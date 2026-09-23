import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const DEFAULT_TAUTULLI_CONFIG = 'C:\\plex-mcp\\tautulli\\config\\config.ini';
const DEFAULT_TAUTULLI_DB = 'C:\\plex-mcp\\tautulli\\config\\tautulli.db';

const USER_COLUMNS = [
  'id','user_id','username','friendly_name','title','is_active','is_admin',
  'is_home_user','is_restricted','deleted_user','keep_history'
];
const HISTORY_COLUMNS = [
  'id','reference_id','rating_key','parent_rating_key','grandparent_rating_key',
  'user_id','section_id','media_type','started','stopped','paused_counter',
  'player','platform','location','media_decision','video_decision','audio_decision',
  'transcode_decision','duration','view_offset'
];
const HISTORY_METADATA_COLUMNS = [
  'id','section_id','rating_key','parent_rating_key','grandparent_rating_key','title',
  'parent_title','grandparent_title','media_index','parent_media_index','media_type',
  'year','originally_available_at','added_at','updated_at','last_viewed_at',
  'content_rating','summary','rating','duration','guid','directors','writers','actors',
  'genres','studio'
];
const RECENT_COLUMNS = [
  'id','section_id','rating_key','parent_rating_key','grandparent_rating_key',
  'media_type','title','parent_title','grandparent_title','year','added_at','created_at'
];

const asArray = value => Array.isArray(value) ? value : [];
const asTextArray = value => asArray(value).map(v => v?.tag ?? v?.title ?? v?.name ?? v?.id ?? v).filter(Boolean).map(String);
const toIsoFromEpoch = value => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString();
};
const cleanNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const stableHash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function sqliteJson(dbPath, sql) {
  const raw = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8' });
  return JSON.parse(raw || '[]');
}

function tableColumns(dbPath, table) {
  return new Set(sqliteJson(dbPath, `PRAGMA table_info("${table.replaceAll('"','""')}")`).map(row => row.name));
}

function selectAllowed(dbPath, table, allowedColumns, where = '') {
  const present = tableColumns(dbPath, table);
  const selected = allowedColumns.filter(column => present.has(column));
  if (!selected.length) return [];
  return sqliteJson(dbPath, `SELECT ${selected.map(c => `"${c}"`).join(',')} FROM "${table}" ${where}`);
}

function resolvePlexToken(configPath) {
  if (process.env.PLEX_TOKEN) return process.env.PLEX_TOKEN;
  const config = fs.readFileSync(configPath, 'utf8');
  const token = config.match(/^pms_token\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!token) throw new Error(`Plex token was not found in environment or ${configPath}`);
  return token;
}

function normalizePlexItem(item, section, relationship = {}) {
  const mediaType = item.type;
  const seasonNumber = mediaType === 'season' ? cleanNumber(item.index) : mediaType === 'episode' ? cleanNumber(item.parentIndex) : null;
  const episodeNumber = mediaType === 'episode' ? cleanNumber(item.index) : null;
  const showRatingKey = relationship.showRatingKey
    ?? (mediaType === 'show' ? item.ratingKey : null)
    ?? item.grandparentRatingKey
    ?? (mediaType === 'season' ? item.parentRatingKey : null);
  const normalized = {
    plex_rating_key: String(item.ratingKey),
    media_type: mediaType,
    library_section_key: String(section.key),
    library_title: section.title ?? null,
    parent_rating_key: item.parentRatingKey ? String(item.parentRatingKey) : relationship.parentRatingKey ?? null,
    show_rating_key: showRatingKey ? String(showRatingKey) : null,
    title: item.title ?? null,
    sort_title: item.titleSort ?? item.sortTitle ?? null,
    year: cleanNumber(item.year),
    summary: item.summary ?? null,
    season_number: seasonNumber,
    episode_number: episodeNumber,
    duration_ms: cleanNumber(item.duration),
    added_at: toIsoFromEpoch(item.addedAt),
    updated_at: toIsoFromEpoch(item.updatedAt),
    originally_available_at: item.originallyAvailableAt ?? null,
    content_rating: item.contentRating ?? null,
    studio: item.studio ?? null,
    genres: asTextArray(item.Genre),
    directors: asTextArray(item.Director),
    writers: asTextArray(item.Writer),
    actors: asTextArray(item.Role),
    external_ids: Object.fromEntries(asArray(item.Guid).map(g => String(g?.id ?? '')).filter(Boolean).map(id => {
      const [provider] = id.split('://');
      return [provider || 'guid', id];
    })),
    ratings: {
      critic: cleanNumber(item.rating),
      audience: cleanNumber(item.audienceRating),
      user: cleanNumber(item.userRating),
    },
    view_count: cleanNumber(item.viewCount) ?? 0,
    view_offset_ms: cleanNumber(item.viewOffset),
    last_viewed_at: toIsoFromEpoch(item.lastViewedAt),
  };
  normalized.source_hash = stableHash(normalized);
  return normalized;
}

export async function extractContextSnapshot(options = {}) {
  const configPath = options.tautulliConfig ?? process.env.TAUTULLI_CONFIG ?? DEFAULT_TAUTULLI_CONFIG;
  const dbPath = options.tautulliDb ?? process.env.TAUTULLI_DB ?? DEFAULT_TAUTULLI_DB;
  const plexBase = options.plexUrl ?? process.env.PLEX_URL ?? 'http://127.0.0.1:32400';
  const token = resolvePlexToken(configPath);
  const headers = { 'X-Plex-Token': token, Accept: 'application/json' };
  const request = async path => {
    const response = await fetch(`${plexBase}${path}`, { headers });
    if (!response.ok) throw new Error(`Plex ${response.status} for ${path}`);
    return response.json();
  };

  const allSections = (await request('/library/sections')).MediaContainer?.Directory ?? [];
  const sections = allSections.filter(section => ['movie', 'show'].includes(section.type)).map(section => ({
    plex_section_key: String(section.key),
    title: section.title ?? null,
    media_type: section.type,
    uuid: section.uuid ?? null,
    scanned_at: new Date().toISOString(),
  }));
  const sectionByKey = new Map(allSections.filter(s => ['movie','show'].includes(s.type)).map(s => [String(s.key), s]));
  const allowedSectionKeys = new Set(sections.map(s => s.plex_section_key));
  const mediaItems = [];

  for (const section of sectionByKey.values()) {
    if (section.type === 'movie') {
      const payload = await request(`/library/sections/${section.key}/all?type=1&includeGuids=1`);
      for (const item of payload.MediaContainer?.Metadata ?? []) mediaItems.push(normalizePlexItem(item, section));
      continue;
    }

    const showsPayload = await request(`/library/sections/${section.key}/all?type=2&includeGuids=1`);
    for (const show of showsPayload.MediaContainer?.Metadata ?? []) {
      const normalizedShow = normalizePlexItem(show, section);
      mediaItems.push(normalizedShow);
      const seasonsPayload = await request(`/library/metadata/${show.ratingKey}/children?includeGuids=1`);
      for (const season of seasonsPayload.MediaContainer?.Metadata ?? []) {
        const normalizedSeason = normalizePlexItem(season, section, { showRatingKey: String(show.ratingKey) });
        mediaItems.push(normalizedSeason);
        const episodesPayload = await request(`/library/metadata/${season.ratingKey}/children?includeGuids=1`);
        for (const episode of episodesPayload.MediaContainer?.Metadata ?? []) {
          mediaItems.push(normalizePlexItem(episode, section, {
            parentRatingKey: String(season.ratingKey),
            showRatingKey: String(show.ratingKey),
          }));
        }
      }
    }
  }

  const mediaKeys = new Set(mediaItems.map(item => item.plex_rating_key));
  const users = selectAllowed(dbPath, 'users', USER_COLUMNS).map(row => ({
    tautulli_user_id: String(row.user_id ?? row.id),
    username: row.username ?? null,
    friendly_name: row.friendly_name ?? row.title ?? row.username ?? null,
    is_active: Boolean(Number(row.is_active ?? 1)),
    is_admin: Boolean(Number(row.is_admin ?? 0)),
    is_home_user: Boolean(Number(row.is_home_user ?? 0)),
    is_restricted: Boolean(Number(row.is_restricted ?? 0)),
    deleted_user: Boolean(Number(row.deleted_user ?? 0)),
  }));

  const minHistoryId = Number(options.historyAfterId ?? 0);
  const historyWhere = Number.isFinite(minHistoryId) && minHistoryId > 0 ? `WHERE id > ${Math.trunc(minHistoryId)}` : '';
  const history = selectAllowed(dbPath, 'session_history', HISTORY_COLUMNS, historyWhere)
    .filter(row => ['movie','episode','show'].includes(String(row.media_type ?? '')))
    .filter(row => allowedSectionKeys.has(String(row.section_id))
      || mediaKeys.has(String(row.rating_key))
      || mediaKeys.has(String(row.parent_rating_key))
      || mediaKeys.has(String(row.grandparent_rating_key)));
  const metadataRows = selectAllowed(dbPath, 'session_history_metadata', HISTORY_METADATA_COLUMNS)
    .filter(row => mediaKeys.has(String(row.rating_key)) || mediaKeys.has(String(row.parent_rating_key)) || mediaKeys.has(String(row.grandparent_rating_key)));
  const metadataById = new Map(metadataRows.map(row => [String(row.id), row]));
  const metadataByRatingKey = new Map(metadataRows.map(row => [String(row.rating_key), row]));

  const watchEvents = history.map(row => {
    const meta = metadataById.get(String(row.id)) ?? metadataByRatingKey.get(String(row.rating_key)) ?? {};
    const duration = cleanNumber(row.duration ?? meta.duration);
    const offset = cleanNumber(row.view_offset);
    const completion = duration && offset != null ? Math.max(0, Math.min(100, Math.round((offset / duration) * 10000) / 100)) : null;
    const event = {
      tautulli_history_id: Number(row.id),
      user_id: String(row.user_id),
      plex_rating_key: row.rating_key ? String(row.rating_key) : null,
      parent_rating_key: row.parent_rating_key ? String(row.parent_rating_key) : meta.parent_rating_key ? String(meta.parent_rating_key) : null,
      show_rating_key: row.grandparent_rating_key ? String(row.grandparent_rating_key) : meta.grandparent_rating_key ? String(meta.grandparent_rating_key) : null,
      media_type: row.media_type ?? meta.media_type ?? null,
      title: meta.title ?? null,
      parent_title: meta.parent_title ?? null,
      show_title: meta.grandparent_title ?? null,
      started_at: toIsoFromEpoch(row.started),
      stopped_at: toIsoFromEpoch(row.stopped),
      duration_ms: duration,
      view_offset_ms: offset,
      completion_percent: completion,
      player: row.player ?? null,
      platform: row.platform ?? null,
      location: row.location ?? null,
      media_decision: row.media_decision ?? null,
      video_decision: row.video_decision ?? null,
      audio_decision: row.audio_decision ?? null,
      transcode_decision: row.transcode_decision ?? null,
    };
    event.source_hash = stableHash(event);
    return event;
  });

  const recentAdditions = selectAllowed(dbPath, 'recently_added', RECENT_COLUMNS)
    .filter(row => allowedSectionKeys.has(String(row.section_id))
      || mediaKeys.has(String(row.rating_key))
      || mediaKeys.has(String(row.parent_rating_key))
      || mediaKeys.has(String(row.grandparent_rating_key)))
    .map(row => ({
      tautulli_row_id: Number(row.id),
      plex_rating_key: row.rating_key ? String(row.rating_key) : null,
      parent_rating_key: row.parent_rating_key ? String(row.parent_rating_key) : null,
      show_rating_key: row.grandparent_rating_key ? String(row.grandparent_rating_key) : null,
      media_type: row.media_type ?? null,
      title: row.title ?? null,
      parent_title: row.parent_title ?? null,
      show_title: row.grandparent_title ?? null,
      year: cleanNumber(row.year),
      added_at: toIsoFromEpoch(row.added_at ?? row.created_at),
      source_hash: stableHash(row),
    }));

  return {
    captured_at: new Date().toISOString(),
    sections,
    media_items: mediaItems,
    users,
    watch_events: watchEvents,
    recent_additions: recentAdditions,
  };
}
