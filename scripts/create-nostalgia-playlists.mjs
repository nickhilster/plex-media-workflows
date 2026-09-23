import fs from 'node:fs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const cfgPath = process.env.TAUTULLI_CONFIG || 'C:\\plex-mcp\\tautulli\\config\\config.ini';
const plexBase = process.env.PLEX_URL || 'http://127.0.0.1:32400';

const cfg = fs.readFileSync(cfgPath, 'utf8');
const token = cfg.match(/^pms_token\s*=\s*(.+)$/m)?.[1]?.trim();
if (!token) throw new Error(`No Plex token found in ${cfgPath}`);

const headers = { 'X-Plex-Token': token, Accept: 'application/json' };
const request = async (path, options = {}) => {
  const response = await fetch(`${plexBase}${path}`, { headers, ...options });
  if (!response.ok) throw new Error(`Plex ${response.status} for ${path}`);
  return response.json();
};
const encoded = value => encodeURIComponent(value);

const sections = (await request('/library/sections')).MediaContainer?.Directory ?? [];
const showSection = sections.find(section => section.type === 'show');
if (!showSection) throw new Error('No Plex TV library section found');
const shows = (await request(`/library/sections/${showSection.key}/all?type=2`)).MediaContainer?.Metadata ?? [];
const requested = [
  ['The Simpsons', 'Nostalgia TV — The Simpsons'],
  ['Last Week Tonight with John Oliver', 'Nostalgia TV — Last Week Tonight'],
];
const mixNames = ['The Simpsons', 'Last Week Tonight with John Oliver', 'Dark Matter', 'Disclaimer'];
const existing = (await request('/playlists')).MediaContainer?.Metadata ?? [];
const identity = (await request('/identity')).MediaContainer;
const results = [];

const episodesFor = async show => {
  const leaves = (await request(`/library/metadata/${show.ratingKey}/allLeaves`)).MediaContainer?.Metadata ?? [];
  return leaves.map(item => item.ratingKey).filter(Boolean);
};

const createPlaylist = async (title, keys, extra = {}) => {
  const found = existing.find(item => item.title === title);
  if (found) return { playlistTitle: title, status: 'exists', ratingKey: found.ratingKey, ...extra };
  if (dryRun) return { playlistTitle: title, status: 'would_create', episodes: keys.length, ...extra };
  const uri = `server://${identity.machineIdentifier}/com.plexapp.plugins.library/library/metadata/${keys.join(',')}`;
  const created = await request(`/playlists?type=video&title=${encoded(title)}&smart=0&uri=${encoded(uri)}`, { method: 'POST' });
  return { playlistTitle: title, status: 'created', episodes: keys.length, ratingKey: created?.MediaContainer?.Metadata?.[0]?.ratingKey ?? null, ...extra };
};

for (const [showTitle, playlistTitle] of requested) {
  const show = shows.find(item => item.title === showTitle);
  if (!show) { results.push({ playlistTitle, status: 'show_not_found' }); continue; }
  const keys = await episodesFor(show);
  results.push(keys.length ? await createPlaylist(playlistTitle, keys, { show: showTitle }) : { playlistTitle, status: 'no_episodes', show: showTitle });
}

const mixShows = shows.filter(show => mixNames.includes(show.title));
const mixKeys = (await Promise.all(mixShows.map(episodesFor))).flat();
if (mixKeys.length) results.push(await createPlaylist('Nostalgia TV — Top TV Mix', mixKeys, { shows: mixShows.map(show => show.title) }));

console.log(JSON.stringify({ dryRun, plex: plexBase, results }, null, 2));
