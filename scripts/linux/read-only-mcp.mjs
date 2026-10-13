#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { ALLOWED_TOOLS, childEnvironment, permittedRequest, normalizeOrganizationCall } from './read-only-policy.mjs';

if (!process.env.PLEX_TOKEN) {
  console.error('PLEX_TOKEN is required; supply it privately through the environment.');
  process.exit(1);
}
if (process.argv.length > 2) {
  console.error('This launcher accepts no arguments and supports stdio only.');
  process.exit(1);
}
const server = fileURLToPath(new URL('../../extension/server/build/plex-mcp-server.js', import.meta.url));
const child = spawn(process.execPath, [server], {
  cwd: '/tmp', env: childEnvironment(process.env), stdio: ['pipe', 'pipe', 'ignore'],
});
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const reject = (id) => send({jsonrpc: '2.0', id: id ?? null,
  error: {code: -32601, message: 'Request is not permitted by the read-only Plex gate.'}});
child.on('error', () => { console.error('Could not start bundled Plex server.'); process.exit(1); });
child.on('exit', (code) => process.exit(code ?? 1));
child.stdin.on('error', () => child.kill());
const input = createInterface({input: process.stdin});
input.on('line', (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { reject(null); return; }
  if (!permittedRequest(msg)) { reject(msg?.id); return; }
  child.stdin.write(JSON.stringify(normalizeOrganizationCall(msg)) + '\n');
});
input.on('close', () => child.kill());
createInterface({input: child.stdout}).on('line', (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
  if (Array.isArray(msg.result?.tools)) {
    msg.result.tools = msg.result.tools.filter(tool => ALLOWED_TOOLS.has(tool.name));
    msg.result.tools.push({name: 'set_item_collections', description: 'Set the collection tags for one Plex item; this changes collection membership only.', inputSchema: {type: 'object', required: ['ratingKey', 'collections'], properties: {ratingKey: {type: 'string'}, collections: {type: 'array', items: {type: 'string'}}}}});
  }
  send(msg);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
