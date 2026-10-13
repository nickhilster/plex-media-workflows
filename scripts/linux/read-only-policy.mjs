export const ALLOWED_TOOLS = new Set([
  'get_libraries', 'get_library_items', 'search_media', 'get_media_details',
  'get_recently_added', 'get_on_deck', 'get_playlists', 'get_playlist_items',
  'get_watchlist', 'get_active_sessions', 'get_recently_watched',
  'get_watch_history', 'get_fully_watched', 'get_watch_stats', 'get_user_stats',
  'get_library_stats', 'get_popular_content', 'get_recommendations',
  'get_editable_fields',
]);

export function childEnvironment(env) {
  const clean = Object.fromEntries(Object.entries(env).filter(([key]) =>
    !/^(SONARR_|RADARR_|TRAKT_|MCP_|NODE_OPTIONS$|NODE_PATH$)/.test(key)));
  clean.PLEX_ENABLE_MUTATIVE_OPS = 'false';
  clean.PLEX_WRITE_ENABLED = 'false';
  // Prevent dotenv from silently reintroducing optional credentials from cwd.
  clean.DOTENV_CONFIG_PATH = '/dev/null';
  return clean;
}

export function permittedRequest(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || msg.jsonrpc !== '2.0') return false;
  if (msg.method === 'tools/call') return ALLOWED_TOOLS.has(msg.params?.name);
  return ['initialize', 'notifications/initialized', 'notifications/cancelled',
    'notifications/progress', 'ping', 'tools/list'].includes(msg.method);
}
