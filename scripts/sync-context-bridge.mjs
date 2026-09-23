import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { extractContextSnapshot } from '../src/context-bridge/source.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || (!args.has('--sync') && !args.has('--verify') && !args.has('--migrate'));
const verifyOnly = args.has('--verify');
const migrateOnly = args.has('--migrate');
const catalogueOnly = args.has('--catalogue');
const historyOnly = args.has('--history');
const full = args.has('--full');
const databaseUrl = process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error('NEON_DATABASE_URL is required in the local environment. Do not print it.');

const sql = postgres(databaseUrl, { ssl: 'require', max: 2, idle_timeout: 20, connect_timeout: 20 });
const chunk = (items, size = 250) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

async function migrate() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dbDir = path.resolve(here, '..', 'db');
  const files = fs.readdirSync(dbDir).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  for (const file of files) {
    const body = fs.readFileSync(path.join(dbDir, file), 'utf8');
    const statements = body.split(';').map(statement => statement.trim()).filter(Boolean);
    for (const statement of statements) await sql.unsafe(statement, [], { prepare: false });
    console.log(`Applied ${file}`);
  }
}

async function verify() {
  const [counts, music, freshness] = await Promise.all([
    sql`SELECT media_type, count(*)::int AS count FROM core.media_items WHERE deleted_at IS NULL GROUP BY media_type ORDER BY media_type`,
    sql`SELECT count(*)::int AS count FROM core.media_items WHERE media_type NOT IN ('movie','show','season','episode')`,
    sql`SELECT max(last_synced_at) AS catalogue_synced_at FROM core.media_items`,
  ]);
  const result = { counts, non_video_records: music[0]?.count ?? 0, ...freshness[0] };
  console.log(JSON.stringify(result, null, 2));
  if (result.non_video_records !== 0) throw new Error('Verification failed: unexpected non-video records exist.');
  return result;
}

async function getCursor(source, stream) {
  const rows = await sql`SELECT cursor_value FROM sync.cursors WHERE source=${source} AND stream=${stream}`;
  return rows[0]?.cursor_value ?? null;
}

async function upsertMedia(items) {
  let inserted = 0, updated = 0, unchanged = 0;
  for (const batch of chunk(items)) {
    const keys = batch.map(item => item.plex_rating_key);
    const existingRows = await sql`SELECT plex_rating_key, source_hash FROM core.media_items WHERE plex_rating_key IN ${sql(keys)}`;
    const existing = new Map(existingRows.map(row => [row.plex_rating_key, row.source_hash]));
    const changed = batch.filter(item => {
      if (!existing.has(item.plex_rating_key)) { inserted++; return true; }
      if (existing.get(item.plex_rating_key) !== item.source_hash) { updated++; return true; }
      unchanged++;
      return false;
    });
    if (!changed.length) continue;
    await sql`
      INSERT INTO core.media_items ${sql(changed,
        'plex_rating_key','media_type','library_section_key','library_title','parent_rating_key','show_rating_key',
        'title','sort_title','year','summary','season_number','episode_number','duration_ms','added_at','updated_at',
        'originally_available_at','content_rating','studio','genres','directors','writers','actors','external_ids','ratings',
        'view_count','view_offset_ms','last_viewed_at','source_hash'
      )}
      ON CONFLICT (plex_rating_key) DO UPDATE SET
        media_type = EXCLUDED.media_type,
        library_section_key = EXCLUDED.library_section_key,
        library_title = EXCLUDED.library_title,
        parent_rating_key = EXCLUDED.parent_rating_key,
        show_rating_key = EXCLUDED.show_rating_key,
        title = EXCLUDED.title,
        sort_title = EXCLUDED.sort_title,
        year = EXCLUDED.year,
        summary = EXCLUDED.summary,
        season_number = EXCLUDED.season_number,
        episode_number = EXCLUDED.episode_number,
        duration_ms = EXCLUDED.duration_ms,
        added_at = EXCLUDED.added_at,
        updated_at = EXCLUDED.updated_at,
        originally_available_at = EXCLUDED.originally_available_at,
        content_rating = EXCLUDED.content_rating,
        studio = EXCLUDED.studio,
        genres = EXCLUDED.genres,
        directors = EXCLUDED.directors,
        writers = EXCLUDED.writers,
        actors = EXCLUDED.actors,
        external_ids = EXCLUDED.external_ids,
        ratings = EXCLUDED.ratings,
        view_count = EXCLUDED.view_count,
        view_offset_ms = EXCLUDED.view_offset_ms,
        last_viewed_at = EXCLUDED.last_viewed_at,
        source_hash = EXCLUDED.source_hash,
        last_synced_at = now(),
        deleted_at = NULL
    `;
  }
  return { inserted, updated, unchanged };
}

async function softDeleteMissingMedia(items) {
  const keys = items.map(item => item.plex_rating_key);
  if (!keys.length) return 0;
  const rows = await sql`
    UPDATE core.media_items
    SET deleted_at = now(), last_synced_at = now()
    WHERE deleted_at IS NULL AND plex_rating_key NOT IN ${sql(keys)}
    RETURNING id
  `;
  return rows.length;
}

async function upsertUsers(users) {
  if (!users.length) return;
  await sql`
    INSERT INTO core.media_users ${sql(users,
      'tautulli_user_id','username','friendly_name','is_active','is_admin','is_home_user','is_restricted','deleted_user'
    )}
    ON CONFLICT (tautulli_user_id) DO UPDATE SET
      username = EXCLUDED.username,
      friendly_name = EXCLUDED.friendly_name,
      is_active = EXCLUDED.is_active,
      is_admin = EXCLUDED.is_admin,
      is_home_user = EXCLUDED.is_home_user,
      is_restricted = EXCLUDED.is_restricted,
      deleted_user = EXCLUDED.deleted_user,
      last_synced_at = now()
  `;
}

async function upsertWatchEvents(events) {
  let inserted = 0, updated = 0, unchanged = 0;
  for (const batch of chunk(events)) {
    const ids = batch.map(event => event.tautulli_history_id);
    const existingRows = await sql`SELECT tautulli_history_id, source_hash FROM core.watch_events WHERE tautulli_history_id IN ${sql(ids)}`;
    const existing = new Map(existingRows.map(row => [Number(row.tautulli_history_id), row.source_hash]));
    const changed = batch.filter(event => {
      if (!existing.has(event.tautulli_history_id)) { inserted++; return true; }
      if (existing.get(event.tautulli_history_id) !== event.source_hash) { updated++; return true; }
      unchanged++;
      return false;
    });
    if (!changed.length) continue;
    for (const event of changed) {
      await sql`
        INSERT INTO core.watch_events (
          tautulli_history_id,user_id,media_item_id,plex_rating_key,parent_rating_key,show_rating_key,media_type,title,parent_title,show_title,
          started_at,stopped_at,duration_ms,view_offset_ms,completion_percent,player,platform,location,media_decision,video_decision,
          audio_decision,transcode_decision,source_hash,synced_at
        ) VALUES (
          ${event.tautulli_history_id},${event.user_id},(SELECT id FROM core.media_items WHERE plex_rating_key=${event.plex_rating_key}),
          ${event.plex_rating_key},${event.parent_rating_key},${event.show_rating_key},${event.media_type},${event.title},${event.parent_title},${event.show_title},
          ${event.started_at},${event.stopped_at},${event.duration_ms},${event.view_offset_ms},${event.completion_percent},${event.player},${event.platform},${event.location},
          ${event.media_decision},${event.video_decision},${event.audio_decision},${event.transcode_decision},${event.source_hash},now()
        )
        ON CONFLICT (tautulli_history_id) DO UPDATE SET
          user_id=EXCLUDED.user_id,
          media_item_id=EXCLUDED.media_item_id,
          plex_rating_key=EXCLUDED.plex_rating_key,
          parent_rating_key=EXCLUDED.parent_rating_key,
          show_rating_key=EXCLUDED.show_rating_key,
          media_type=EXCLUDED.media_type,
          title=EXCLUDED.title,
          parent_title=EXCLUDED.parent_title,
          show_title=EXCLUDED.show_title,
          started_at=EXCLUDED.started_at,
          stopped_at=EXCLUDED.stopped_at,
          duration_ms=EXCLUDED.duration_ms,
          view_offset_ms=EXCLUDED.view_offset_ms,
          completion_percent=EXCLUDED.completion_percent,
          player=EXCLUDED.player,
          platform=EXCLUDED.platform,
          location=EXCLUDED.location,
          media_decision=EXCLUDED.media_decision,
          video_decision=EXCLUDED.video_decision,
          audio_decision=EXCLUDED.audio_decision,
          transcode_decision=EXCLUDED.transcode_decision,
          source_hash=EXCLUDED.source_hash,
          synced_at=now()
      `;
    }
  }
  return { inserted, updated, unchanged };
}

async function upsertRecentAdditions(rows) {
  for (const row of rows) {
    await sql`
      INSERT INTO core.recent_additions (
        tautulli_row_id,media_item_id,plex_rating_key,parent_rating_key,show_rating_key,media_type,title,parent_title,show_title,year,added_at,source_hash,synced_at
      ) VALUES (
        ${row.tautulli_row_id},(SELECT id FROM core.media_items WHERE plex_rating_key=${row.plex_rating_key}),${row.plex_rating_key},${row.parent_rating_key},
        ${row.show_rating_key},${row.media_type},${row.title},${row.parent_title},${row.show_title},${row.year},${row.added_at},${row.source_hash},now()
      )
      ON CONFLICT (tautulli_row_id) DO UPDATE SET
        media_item_id=EXCLUDED.media_item_id,
        plex_rating_key=EXCLUDED.plex_rating_key,
        parent_rating_key=EXCLUDED.parent_rating_key,
        show_rating_key=EXCLUDED.show_rating_key,
        media_type=EXCLUDED.media_type,
        title=EXCLUDED.title,
        parent_title=EXCLUDED.parent_title,
        show_title=EXCLUDED.show_title,
        year=EXCLUDED.year,
        added_at=EXCLUDED.added_at,
        source_hash=EXCLUDED.source_hash,
        synced_at=now()
    `;
  }
}

async function rebuildUserMediaState() {
  await sql`
    INSERT INTO core.user_media_state (user_id,media_item_id,watch_state,view_count,progress_percent,view_offset_ms,duration_ms,last_viewed_at,updated_at)
    WITH ranked AS (
      SELECT
        we.*,
        row_number() OVER (PARTITION BY we.user_id, we.media_item_id ORDER BY we.started_at DESC NULLS LAST, we.tautulli_history_id DESC) AS rn,
        count(*) OVER (PARTITION BY we.user_id, we.media_item_id)::int AS event_count
      FROM core.watch_events we
      WHERE we.media_item_id IS NOT NULL AND we.user_id IS NOT NULL
    )
    SELECT
      user_id,
      media_item_id,
      CASE WHEN completion_percent >= 90 THEN 'watched' WHEN COALESCE(view_offset_ms,0) > 0 THEN 'in_progress' ELSE 'unwatched' END,
      event_count,
      completion_percent,
      view_offset_ms,
      duration_ms,
      COALESCE(stopped_at, started_at),
      now()
    FROM ranked
    WHERE rn = 1
    ON CONFLICT (user_id,media_item_id) DO UPDATE SET
      watch_state=EXCLUDED.watch_state,
      view_count=EXCLUDED.view_count,
      progress_percent=EXCLUDED.progress_percent,
      view_offset_ms=EXCLUDED.view_offset_ms,
      duration_ms=EXCLUDED.duration_ms,
      last_viewed_at=EXCLUDED.last_viewed_at,
      updated_at=now()
  `;
}

async function setCursor(source, stream, value) {
  await sql`
    INSERT INTO sync.cursors (source,stream,cursor_value,last_success_at)
    VALUES (${source},${stream},${String(value)},now())
    ON CONFLICT (source,stream) DO UPDATE SET cursor_value=EXCLUDED.cursor_value,last_success_at=now()
  `;
}

try {
  if (migrateOnly) {
    await migrate();
    await verify();
  } else if (verifyOnly) {
    await verify();
  } else {
    const historyCursor = full ? 0 : Number(await getCursor('tautulli','session_history_id') ?? 0);
    const snapshot = await extractContextSnapshot({ historyAfterId: historyCursor });
    const summary = {
      mode: dryRun ? 'dry_run' : 'sync',
      captured_at: snapshot.captured_at,
      sections: snapshot.sections.length,
      media_items: snapshot.media_items.length,
      users: snapshot.users.length,
      watch_events: snapshot.watch_events.length,
      recent_additions: snapshot.recent_additions.length,
    };

    if (dryRun) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const [run] = await sql`
        INSERT INTO sync.runs (mode,plex_items_seen,history_events_seen)
        VALUES (${full ? 'full' : catalogueOnly ? 'catalogue' : historyOnly ? 'history' : 'incremental'},${snapshot.media_items.length},${snapshot.watch_events.length})
        RETURNING id
      `;
      try {
        let inserted = 0, updated = 0, unchanged = 0, softDeleted = 0;

        if (!historyOnly) {
          await sql`
            INSERT INTO core.library_sections ${sql(snapshot.sections, 'plex_section_key','title','media_type','uuid','scanned_at')}
            ON CONFLICT (plex_section_key) DO UPDATE SET
              title=EXCLUDED.title,
              media_type=EXCLUDED.media_type,
              uuid=EXCLUDED.uuid,
              scanned_at=EXCLUDED.scanned_at
          `;
          const mediaResult = await upsertMedia(snapshot.media_items);
          inserted += mediaResult.inserted;
          updated += mediaResult.updated;
          unchanged += mediaResult.unchanged;
          softDeleted += await softDeleteMissingMedia(snapshot.media_items);
        }

        await upsertUsers(snapshot.users);

        if (!catalogueOnly) {
          const historyResult = await upsertWatchEvents(snapshot.watch_events);
          inserted += historyResult.inserted;
          updated += historyResult.updated;
          unchanged += historyResult.unchanged;
          await upsertRecentAdditions(snapshot.recent_additions);
          await rebuildUserMediaState();
          const maxHistoryId = snapshot.watch_events.reduce((max, row) => Math.max(max, row.tautulli_history_id), historyCursor);
          if (maxHistoryId > historyCursor) await setCursor('tautulli','session_history_id',maxHistoryId);
        }

        await sql`
          UPDATE sync.runs
          SET finished_at=now(),status='succeeded',inserted_count=${inserted},updated_count=${updated},
              unchanged_count=${unchanged},soft_deleted_count=${softDeleted}
          WHERE id=${run.id}
        `;
        console.log(JSON.stringify({ ...summary, inserted, updated, unchanged, soft_deleted: softDeleted }, null, 2));
        await verify();
      } catch (error) {
        await sql`
          UPDATE sync.runs
          SET finished_at=now(),status='failed',failed_count=1,error_summary=${String(error.message ?? error).slice(0,2000)}
          WHERE id=${run.id}
        `;
        throw error;
      }
    }
  }
} finally {
  await sql.end({ timeout: 5 });
}
