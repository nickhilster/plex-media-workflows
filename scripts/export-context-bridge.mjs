import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const mode = process.argv.includes('--export') ? 'export' : 'dry-run';
const outPath = process.argv[process.argv.indexOf('--output') + 1] || 'C:\\plex-mcp\\exports\\plex-tautulli-context.jsonl';
const config = fs.readFileSync('C:\\plex-mcp\\tautulli\\config\\config.ini', 'utf8');
const token = config.match(/^pms_token\s*=\s*(.+)$/m)?.[1]?.trim();
if (!token) throw new Error('Tautulli Plex token configuration was not found.');
const records = [];
const allowedRatingKeys = new Set();
const redact = (value) => {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[/token|api[_-]?key|authorization|password|secret|cookie|credential/i.test(k) ? k : k] = /token|api[_-]?key|authorization|password|secret|cookie|credential/i.test(k) ? '[REDACTED]' : redact(v);
  return out;
};
const add = (source_type, row) => { const clean = redact(row); const id = clean.ratingKey ?? clean.rating_key ?? clean.id ?? clean.key ?? crypto.randomUUID(); records.push({source_type, source_id:String(id), captured_at:new Date().toISOString(), data:clean}); };
const get = async (path) => (await fetch(`http://127.0.0.1:32400${path}`, {headers:{'X-Plex-Token':token, Accept:'application/json'}})).json();
const sections = (await get('/library/sections')).MediaContainer.Directory.filter(section => ['movie', 'show'].includes(section.type));
for (const section of sections) {
  add('library_sections', section);
  const type = {movie:1, show:2}[section.type];
  if (!type) continue;
  const data = await get(`/library/sections/${section.key}/all?type=${type}&includeGuids=1`);
  for (const item of (data.MediaContainer.Metadata ?? [])) { allowedRatingKeys.add(String(item.ratingKey)); add(`plex_${section.type}`, item); }
}
for (const table of ['users','session_history','session_history_metadata','recently_added']) {
  const sql = table === 'users' ? 'SELECT id,user_id,username,friendly_name,thumb,custom_avatar_url,title,email,is_active,is_admin,is_home_user,is_allow_sync,is_restricted,do_notify,keep_history,deleted_user,allow_guest,shared_libraries,filter_all,filter_movies,filter_tv,filter_music,filter_photos FROM users' : `SELECT * FROM ${table}`;
  const raw = execFileSync('sqlite3', ['-json','C:\\plex-mcp\\tautulli\\config\\tautulli.db',sql], {encoding:'utf8'});
  for (const row of JSON.parse(raw || '[]')) {
    // Tautulli rows are retained only when they can be associated with Movie/TV libraries.
    if (['session_history','recently_added'].includes(table) && ![1,2].includes(Number(row.section_id))) continue;
    if (table === 'session_history_metadata' && !allowedRatingKeys.has(String(row.rating_key))) continue;
    add(table, row);
  }
}
const counts = Object.fromEntries(Object.entries(Object.groupBy(records, r=>r.source_type)).map(([k,v])=>[k,v.length]));
console.log(JSON.stringify({records:records.length,counts,mode}));
if (mode === 'export') { fs.mkdirSync(path.dirname(outPath), {recursive:true}); fs.writeFileSync(outPath, records.map(r=>JSON.stringify(r)).join('\n')+'\n'); console.log(`Wrote ${outPath}`); }
