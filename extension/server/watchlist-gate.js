#!/usr/bin/env node
// Thin MCP stdio proxy in front of plex-mcp-server.js.
//
// The upstream server gates ALL 12 write tools behind one flag
// (PLEX_ENABLE_MUTATIVE_OPS) — there's no per-tool switch. This proxy
// enables that flag for the child process internally, then filters the
// JSON-RPC stream so only add_to_watchlist / remove_from_watchlist are
// ever visible or callable. Every other write tool is hidden from
// tools/list and rejected outright if called, even though the child
// process technically has them unlocked.
//
// Everything else (all read-only tools, Sonarr/Radarr/Trakt tools) passes
// through unmodified.
//
// NOTE ON LOGGING: this runs inside Claude Desktop's Electron
// UtilityProcess when launched as an extension, where process.stderr is
// not guaranteed to behave like a normal OS-backed stream (piping to it,
// or even writing large/frequent chunks, has been observed to crash the
// process silently). All diagnostics here go to a local log file instead
// of stderr/stdout, so a logging failure can never take down the proxy.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "keepalive-wrapper.mjs");
const LOG_PATH = path.join(__dirname, "gate-debug.log");

function log(msg) {
  try {
    fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // If even file logging fails, there's nothing safe left to do — swallow it.
  }
}

process.on("uncaughtException", (err) => {
  log(`uncaught exception: ${err?.stack || err}`);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  log(`unhandled rejection: ${err?.stack || err}`);
});

log("watchlist-gate starting");

const ALLOWED_WRITE_TOOLS = new Set(["add_to_watchlist", "remove_from_watchlist"]);
const ALL_WRITE_TOOLS = new Set([
  "update_metadata",
  "update_metadata_from_json",
  "create_playlist",
  "add_to_playlist",
  "remove_from_playlist",
  "clear_playlist",
  "delete_playlist",
  "add_to_watchlist",
  "remove_from_watchlist",
  "mark_watched",
  "mark_unwatched",
  "rate_media",
]);
const BLOCKED_WRITE_TOOLS = new Set(
  [...ALL_WRITE_TOOLS].filter((t) => !ALLOWED_WRITE_TOOLS.has(t))
);

const child = spawn(process.execPath, [SERVER_PATH], {
  env: { ...process.env, PLEX_ENABLE_MUTATIVE_OPS: "true" },
  stdio: ["pipe", "pipe", "pipe"],
});

log(`child spawned, pid=${child.pid}`);

// Never touch process.stderr here — just log child stderr to file.
child.stderr.on("data", (chunk) => log(`[child stderr] ${chunk.toString().trimEnd()}`));
child.stderr.on("error", (err) => log(`child stderr stream error: ${err?.stack || err}`));

child.on("error", (err) => {
  log(`child process error: ${err?.stack || err}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  log(`child exited code=${code} signal=${signal}`);
  process.exit(code ?? 0);
});

function safeWrite(stream, text) {
  try {
    stream.write(text);
  } catch (err) {
    log(`write failed: ${err?.stack || err}`);
  }
}

function send(stream, obj) {
  safeWrite(stream, JSON.stringify(obj) + "\n");
}

// parent stdin (requests from the MCP client) -> filter -> child stdin
const fromClient = createInterface({ input: process.stdin });
fromClient.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    safeWrite(child.stdin, line + "\n");
    return;
  }

  // A JSON-RPC line can parse successfully as JSON while still not being a
  // request object — e.g. the literal `null`, a bare number, or a batch
  // array. Accessing .method on those either throws (null) or is silently
  // undefined (array/number), so guard explicitly rather than assume shape.
  if (msg === null || typeof msg !== "object" || Array.isArray(msg)) {
    safeWrite(child.stdin, line + "\n");
    return;
  }

  if (msg.method === "tools/call" && BLOCKED_WRITE_TOOLS.has(msg.params?.name)) {
    send(process.stdout, {
      jsonrpc: "2.0",
      id: msg.id,
      error: {
        code: -32601,
        message: `Tool '${msg.params.name}' is not available. This Plex MCP install only permits ` +
          `read-only tools plus add_to_watchlist/remove_from_watchlist — every other write operation ` +
          `is blocked regardless of server-side configuration.`,
      },
    });
    return;
  }

  safeWrite(child.stdin, line + "\n");
});
fromClient.on("close", () => log("client stdin closed"));

// child stdout (responses/tool list) -> filter -> parent stdout
const fromServer = createInterface({ input: child.stdout });
fromServer.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    safeWrite(process.stdout, line + "\n");
    return;
  }

  if (msg.result?.tools && Array.isArray(msg.result.tools)) {
    msg.result.tools = msg.result.tools.filter(
      (t) => !BLOCKED_WRITE_TOOLS.has(t.name)
    );
  }

  send(process.stdout, msg);
});
fromServer.on("close", () => log("child stdout closed"));

process.stdin.on("error", (err) => log(`process.stdin error: ${err?.stack || err}`));
process.stdout.on("error", (err) => log(`process.stdout error: ${err?.stack || err}`));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

log("watchlist-gate ready");
