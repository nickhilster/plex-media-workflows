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

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "build", "plex-mcp-server.js");

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
  stdio: ["pipe", "pipe", "inherit"],
});

child.on("exit", (code) => process.exit(code ?? 0));

function send(stream, obj) {
  stream.write(JSON.stringify(obj) + "\n");
}

// parent stdin (requests from the MCP client) -> filter -> child stdin
const fromClient = createInterface({ input: process.stdin });
fromClient.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    child.stdin.write(line + "\n");
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

  child.stdin.write(line + "\n");
});

// child stdout (responses/tool list) -> filter -> parent stdout
const fromServer = createInterface({ input: child.stdout });
fromServer.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    process.stdout.write(line + "\n");
    return;
  }

  if (msg.result?.tools && Array.isArray(msg.result.tools)) {
    msg.result.tools = msg.result.tools.filter(
      (t) => !BLOCKED_WRITE_TOOLS.has(t.name)
    );
  }

  send(process.stdout, msg);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
