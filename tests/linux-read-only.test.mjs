import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { ALLOWED_TOOLS, childEnvironment, permittedRequest } from '../scripts/linux/read-only-policy.mjs';
const call = name => ({jsonrpc:'2.0', id:1, method:'tools/call', params:{name}});
test('only approved Plex queries pass; writes, integrations and future tools fail closed', () => {
  for (const name of ALLOWED_TOOLS) assert.equal(permittedRequest(call(name)), true);
  for (const name of ['add_to_watchlist','remove_from_watchlist','update_metadata',
    'mark_watched','export_library','radarr_add_movie',
    'sonarr_trigger_search','trakt_sync_from_trakt','future_write_tool']) {
    assert.equal(permittedRequest(call(name)), false, name);
  }
});
test('malformed, batch and alternate invocation requests are rejected', () => {
  for (const msg of [null, 1, [], [call('mark_watched')], {},
    {...call('get_libraries'),jsonrpc:'1.0'}, {jsonrpc:'2.0',method:'prompts/get'}]) {
    assert.equal(permittedRequest(msg), false);
  }
  assert.equal(permittedRequest({jsonrpc:'2.0',method:'initialize',id:1}),true);
});
test('inherited optional credentials and runtime injection are stripped', () => {
  const env=childEnvironment({PLEX_TOKEN:'private',PLEX_URL:'http://127.0.0.1:32400',
    RADARR_API_KEY:'secret',SONARR_URL:'remote',TRAKT_ACCESS_TOKEN:'secret',
    MCP_PORT:'3002',NODE_OPTIONS:'--import bad',NODE_PATH:'/bad',
    PLEX_ENABLE_MUTATIVE_OPS:'true',DOTENV_CONFIG_PATH:'/bad',PATH:'/usr/bin'});
  assert.equal(env.PLEX_TOKEN,'private');
  for (const key of ['RADARR_API_KEY','SONARR_URL','TRAKT_ACCESS_TOKEN','MCP_PORT','NODE_OPTIONS','NODE_PATH']) assert.equal(env[key],undefined);
  assert.equal(env.PLEX_ENABLE_MUTATIVE_OPS,'true');
  assert.equal(env.DOTENV_CONFIG_PATH,'/dev/null');
});

test('stdio gate filters listings and prevents disallowed calls reaching a child', async () => {
  const root=await mkdtemp(join(tmpdir(),'plex-gate-test-'));
  let proc;
  try {
    await mkdir(join(root,'scripts/linux'),{recursive:true});
    await mkdir(join(root,'extension/server/build'),{recursive:true});
    for (const file of ['read-only-policy.mjs','read-only-mcp.mjs']) {
      await copyFile(new URL('../scripts/linux/'+file,import.meta.url),join(root,'scripts/linux',file));
    }
    await writeFile(join(root,'extension/server/build/plex-mcp-server.js'), `
      const readline=require('node:readline');
      readline.createInterface({input:process.stdin}).on('line',line=>{
        const m=JSON.parse(line);
        const result=m.method==='tools/list'
          ? {tools:[{name:'get_libraries'},{name:'mark_watched'},{name:'future_write_tool'}]}
          : {reachedChild:true,writes:process.env.PLEX_ENABLE_MUTATIVE_OPS,radarr:!!process.env.RADARR_API_KEY};
        process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,result})+'\\n');
      });
    `);
    proc=spawn(process.execPath,[join(root,'scripts/linux/read-only-mcp.mjs')],{
      env:{...process.env,PLEX_TOKEN:'test-only',RADARR_API_KEY:'test-only'},stdio:['pipe','pipe','pipe']});
    const replies=new Map();
    const lines=createInterface({input:proc.stdout});
    const done=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Timed out waiting for gate')),5000);
      lines.on('line',line=>{const m=JSON.parse(line);replies.set(m.id,m);if(replies.size===4){clearTimeout(timeout);resolve();}});
      proc.on('error',reject);
    });
    for (const m of [call('mark_watched'),{...call('future_write_tool'),id:2},
      {jsonrpc:'2.0',id:3,method:'tools/list'},{...call('get_libraries'),id:4}]) proc.stdin.write(JSON.stringify(m)+'\n');
    await done;
    assert.equal(replies.get(1).error.code,-32601);
    assert.equal(replies.get(2).error.code,-32601);
    assert.deepEqual(replies.get(3).result.tools,[{name:'get_libraries'}]);
    assert.deepEqual(replies.get(4).result,{reachedChild:true,writes:'true',radarr:false});
    lines.close();
  } finally {
    if(proc) { const exited=new Promise(resolve=>proc.once('exit',resolve));proc.stdin.end();await exited; }
    await rm(root,{recursive:true,force:true});
  }
});
