CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS sync;
CREATE SCHEMA IF NOT EXISTS assistant;

CREATE TABLE IF NOT EXISTS core.library_sections (
  plex_section_key text PRIMARY KEY,
  title text,
  media_type text NOT NULL CHECK (media_type IN ('movie','show')),
  uuid text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.media_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plex_rating_key text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('movie','show','season','episode')),
  library_section_key text NOT NULL REFERENCES core.library_sections(plex_section_key),
  library_title text,
  parent_rating_key text,
  show_rating_key text,
  title text NOT NULL,
  sort_title text,
  year integer,
  summary text,
  season_number integer,
  episode_number integer,
  duration_ms bigint,
  added_at timestamptz,
  updated_at timestamptz,
  originally_available_at date,
  content_rating text,
  studio text,
  genres text[] NOT NULL DEFAULT '{}',
  directors text[] NOT NULL DEFAULT '{}',
  writers text[] NOT NULL DEFAULT '{}',
  actors text[] NOT NULL DEFAULT '{}',
  external_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  view_count integer NOT NULL DEFAULT 0,
  view_offset_ms bigint,
  last_viewed_at timestamptz,
  source_hash text NOT NULL,
  first_synced_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS core.media_users (
  tautulli_user_id text PRIMARY KEY,
  username text,
  friendly_name text,
  is_active boolean NOT NULL DEFAULT true,
  is_admin boolean NOT NULL DEFAULT false,
  is_home_user boolean NOT NULL DEFAULT false,
  is_restricted boolean NOT NULL DEFAULT false,
  deleted_user boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.watch_events (
  tautulli_history_id bigint PRIMARY KEY,
  user_id text REFERENCES core.media_users(tautulli_user_id),
  media_item_id bigint REFERENCES core.media_items(id),
  plex_rating_key text,
  parent_rating_key text,
  show_rating_key text,
  media_type text,
  title text,
  parent_title text,
  show_title text,
  started_at timestamptz,
  stopped_at timestamptz,
  duration_ms bigint,
  view_offset_ms bigint,
  completion_percent numeric(6,2),
  player text,
  platform text,
  location text,
  media_decision text,
  video_decision text,
  audio_decision text,
  transcode_decision text,
  source_hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.recent_additions (
  tautulli_row_id bigint PRIMARY KEY,
  media_item_id bigint REFERENCES core.media_items(id),
  plex_rating_key text,
  parent_rating_key text,
  show_rating_key text,
  media_type text,
  title text,
  parent_title text,
  show_title text,
  year integer,
  added_at timestamptz,
  source_hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.user_media_state (
  user_id text NOT NULL REFERENCES core.media_users(tautulli_user_id),
  media_item_id bigint NOT NULL REFERENCES core.media_items(id),
  watch_state text NOT NULL CHECK (watch_state IN ('unwatched','in_progress','watched')),
  view_count integer NOT NULL DEFAULT 0,
  progress_percent numeric(6,2),
  view_offset_ms bigint,
  duration_ms bigint,
  last_viewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, media_item_id)
);

CREATE TABLE IF NOT EXISTS sync.runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed','dry_run')),
  mode text NOT NULL,
  plex_items_seen integer NOT NULL DEFAULT 0,
  history_events_seen integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  unchanged_count integer NOT NULL DEFAULT 0,
  soft_deleted_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_summary text
);

CREATE TABLE IF NOT EXISTS sync.cursors (
  source text NOT NULL,
  stream text NOT NULL,
  cursor_value text,
  last_success_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, stream)
);
