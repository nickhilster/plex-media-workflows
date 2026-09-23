import fs from 'node:fs';
import path from 'node:path';
import { extractContextSnapshot } from '../src/context-bridge/source.mjs';

const args = process.argv.slice(2);
const mode = args.includes('--export') ? 'export' : 'dry-run';
const outputIndex = args.indexOf('--output');
const outPath = outputIndex >= 0 && args[outputIndex + 1]
  ? args[outputIndex + 1]
  : 'C:\\plex-mcp\\exports\\plex-tautulli-context.jsonl';

const snapshot = await extractContextSnapshot();
const records = [
  ...snapshot.sections.map(data => ({ source_type: 'library_section', source_id: data.plex_section_key, captured_at: snapshot.captured_at, data })),
  ...snapshot.media_items.map(data => ({ source_type: `plex_${data.media_type}`, source_id: data.plex_rating_key, captured_at: snapshot.captured_at, data })),
  ...snapshot.users.map(data => ({ source_type: 'tautulli_user', source_id: data.tautulli_user_id, captured_at: snapshot.captured_at, data })),
  ...snapshot.watch_events.map(data => ({ source_type: 'tautulli_watch_event', source_id: String(data.tautulli_history_id), captured_at: snapshot.captured_at, data })),
  ...snapshot.recent_additions.map(data => ({ source_type: 'tautulli_recent_addition', source_id: String(data.tautulli_row_id), captured_at: snapshot.captured_at, data })),
];
const counts = Object.fromEntries(Object.entries(Object.groupBy(records, record => record.source_type)).map(([key, values]) => [key, values.length]));

console.log(JSON.stringify({ records: records.length, counts, mode }, null, 2));
if (mode === 'export') {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${records.map(record => JSON.stringify(record)).join('\n')}\n`);
  console.log(`Wrote ${outPath}`);
}
