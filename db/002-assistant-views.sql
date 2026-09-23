CREATE OR REPLACE VIEW assistant.catalogue AS
SELECT
  mi.id,
  mi.plex_rating_key,
  mi.media_type,
  mi.library_title,
  mi.parent_rating_key,
  mi.show_rating_key,
  mi.title,
  mi.sort_title,
  mi.year,
  mi.summary,
  mi.season_number,
  mi.episode_number,
  mi.duration_ms,
  mi.added_at,
  mi.originally_available_at,
  mi.content_rating,
  mi.studio,
  mi.genres,
  mi.directors,
  mi.writers,
  mi.actors,
  mi.external_ids,
  mi.ratings,
  mi.view_count,
  mi.view_offset_ms,
  mi.last_viewed_at
FROM core.media_items mi
WHERE mi.deleted_at IS NULL;

CREATE OR REPLACE VIEW assistant.movies AS
SELECT * FROM assistant.catalogue WHERE media_type = 'movie';

CREATE OR REPLACE VIEW assistant.tv_episodes AS
SELECT * FROM assistant.catalogue WHERE media_type = 'episode';

CREATE OR REPLACE VIEW assistant.watch_history AS
SELECT
  we.tautulli_history_id,
  we.user_id,
  COALESCE(mu.friendly_name, mu.username, we.user_id) AS user_name,
  we.plex_rating_key,
  we.media_type,
  COALESCE(mi.title, we.title) AS title,
  COALESCE(show_item.title, we.show_title) AS show_title,
  mi.season_number,
  mi.episode_number,
  we.started_at,
  we.stopped_at,
  we.duration_ms,
  we.view_offset_ms,
  we.completion_percent,
  we.player,
  we.platform,
  we.location,
  we.media_decision,
  we.video_decision,
  we.audio_decision,
  we.transcode_decision
FROM core.watch_events we
LEFT JOIN core.media_users mu ON mu.tautulli_user_id = we.user_id
LEFT JOIN core.media_items mi ON mi.id = we.media_item_id
LEFT JOIN core.media_items show_item ON show_item.plex_rating_key = COALESCE(mi.show_rating_key, we.show_rating_key);

CREATE OR REPLACE VIEW assistant.recently_added AS
SELECT
  ra.tautulli_row_id,
  ra.plex_rating_key,
  COALESCE(mi.media_type, ra.media_type) AS media_type,
  COALESCE(mi.title, ra.title) AS title,
  COALESCE(show_item.title, ra.show_title) AS show_title,
  COALESCE(mi.year, ra.year) AS year,
  COALESCE(mi.added_at, ra.added_at) AS added_at,
  mi.genres,
  mi.duration_ms
FROM core.recent_additions ra
LEFT JOIN core.media_items mi ON mi.id = ra.media_item_id
LEFT JOIN core.media_items show_item ON show_item.plex_rating_key = COALESCE(mi.show_rating_key, ra.show_rating_key)
WHERE mi.deleted_at IS NULL OR mi.id IS NULL;

CREATE OR REPLACE VIEW assistant.continue_watching AS
WITH in_progress AS (
  SELECT
    ums.user_id,
    mi.id AS media_item_id,
    mi.plex_rating_key,
    mi.show_rating_key,
    mi.media_type,
    mi.title,
    show_item.title AS show_title,
    mi.season_number,
    mi.episode_number,
    ums.watch_state,
    ums.progress_percent,
    ums.view_offset_ms,
    ums.duration_ms,
    ums.last_viewed_at,
    'resume'::text AS continuation_type
  FROM core.user_media_state ums
  JOIN core.media_items mi ON mi.id = ums.media_item_id AND mi.deleted_at IS NULL
  LEFT JOIN core.media_items show_item ON show_item.plex_rating_key = mi.show_rating_key
  WHERE ums.watch_state = 'in_progress' AND mi.media_type IN ('movie','episode')
),
latest_completed_episode AS (
  SELECT DISTINCT ON (ums.user_id, mi.show_rating_key)
    ums.user_id,
    mi.show_rating_key,
    mi.season_number,
    mi.episode_number,
    ums.last_viewed_at
  FROM core.user_media_state ums
  JOIN core.media_items mi ON mi.id = ums.media_item_id
  WHERE ums.watch_state = 'watched' AND mi.media_type = 'episode' AND mi.deleted_at IS NULL
  ORDER BY ums.user_id, mi.show_rating_key, ums.last_viewed_at DESC NULLS LAST, mi.season_number DESC, mi.episode_number DESC
),
next_episode AS (
  SELECT
    last.user_id,
    next_item.id AS media_item_id,
    next_item.plex_rating_key,
    next_item.show_rating_key,
    next_item.media_type,
    next_item.title,
    show_item.title AS show_title,
    next_item.season_number,
    next_item.episode_number,
    COALESCE(next_state.watch_state, 'unwatched') AS watch_state,
    next_state.progress_percent,
    next_state.view_offset_ms,
    next_item.duration_ms,
    last.last_viewed_at,
    'next_episode'::text AS continuation_type
  FROM latest_completed_episode last
  JOIN LATERAL (
    SELECT candidate.*
    FROM core.media_items candidate
    LEFT JOIN core.user_media_state state
      ON state.user_id = last.user_id AND state.media_item_id = candidate.id
    WHERE candidate.media_type = 'episode'
      AND candidate.show_rating_key = last.show_rating_key
      AND candidate.deleted_at IS NULL
      AND (candidate.season_number, candidate.episode_number) > (last.season_number, last.episode_number)
      AND COALESCE(state.watch_state, 'unwatched') <> 'watched'
    ORDER BY candidate.season_number, candidate.episode_number
    LIMIT 1
  ) next_item ON true
  LEFT JOIN core.user_media_state next_state ON next_state.user_id = last.user_id AND next_state.media_item_id = next_item.id
  LEFT JOIN core.media_items show_item ON show_item.plex_rating_key = next_item.show_rating_key
  WHERE NOT EXISTS (
    SELECT 1 FROM in_progress ip
    WHERE ip.user_id = last.user_id AND ip.show_rating_key = last.show_rating_key AND ip.media_type = 'episode'
  )
)
SELECT * FROM in_progress
UNION ALL
SELECT * FROM next_episode;

CREATE OR REPLACE VIEW assistant.recommendation_context AS
SELECT
  ums.user_id,
  COALESCE(mu.friendly_name, mu.username, ums.user_id) AS user_name,
  mi.plex_rating_key,
  mi.media_type,
  mi.title,
  show_item.title AS show_title,
  mi.year,
  mi.duration_ms,
  mi.genres,
  mi.directors,
  mi.actors,
  mi.content_rating,
  mi.ratings,
  ums.watch_state,
  ums.view_count,
  ums.progress_percent,
  ums.last_viewed_at,
  mi.added_at
FROM core.user_media_state ums
JOIN core.media_items mi ON mi.id = ums.media_item_id AND mi.deleted_at IS NULL
LEFT JOIN core.media_items show_item ON show_item.plex_rating_key = mi.show_rating_key
LEFT JOIN core.media_users mu ON mu.tautulli_user_id = ums.user_id;
