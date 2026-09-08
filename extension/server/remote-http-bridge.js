#!/usr/bin/env node
import { randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config as loadDotenv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WATCHLIST_GATE_PATH = path.join(__dirname, "watchlist-gate.js");
const REPO_ENV_PATH = path.resolve(__dirname, "..", "..", ".env");
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3333;
const DEFAULT_MAX_SESSIONS = 32;
const DEFAULT_SESSION_IDLE_MS = 300_000;

loadDotenv({ path: REPO_ENV_PATH, quiet: true });

export function getBearerToken(env = process.env) {
  const token = env.MCP_REMOTE_BEARER_TOKEN?.trim();
  if (!token) {
    throw new Error("MCP_REMOTE_BEARER_TOKEN must be set to a non-empty bearer token");
  }
  return token;
}

export function getListenOptions(env = process.env) {
  const host = env.MCP_REMOTE_HOST || DEFAULT_HOST;
  const rawPort = env.MCP_REMOTE_PORT || String(DEFAULT_PORT);
  const port = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid MCP_REMOTE_PORT: ${rawPort}`);
  }
  return { host, port };
}

export function isAuthorized(headers, expectedToken) {
  const actual = headers.authorization;
  if (typeof actual !== "string") return false;
  const expected = `Bearer ${expectedToken}`;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function stdioServerParameters(env = process.env) {
  const cleanEnv = { ...env };
  delete cleanEnv.MCP_REMOTE_BEARER_TOKEN;
  delete cleanEnv.PLEX_ENABLE_MUTATIVE_OPS;

  return {
    command: process.execPath,
    args: [WATCHLIST_GATE_PATH],
    cwd: __dirname,
    env: cleanEnv,
    stderr: "inherit",
  };
}

function positiveIntFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

class SessionStore {
  constructor({ maxSessions, idleTimeoutMs }) {
    this.maxSessions = maxSessions;
    this.idleTimeoutMs = idleTimeoutMs;
    this.sessions = new Map();
    this.sweeper = setInterval(() => this.sweep(), 30_000);
    this.sweeper.unref?.();
  }

  get size() {
    return this.sessions.size;
  }

  get(id) {
    const entry = this.sessions.get(id);
    if (!entry) return undefined;
    entry.lastActivity = Date.now();
    return entry;
  }

  hasCapacity() {
    return this.sessions.size < this.maxSessions;
  }

  add(id, entry) {
    this.sessions.set(id, { ...entry, lastActivity: Date.now() });
  }

  close(id) {
    const entry = this.sessions.get(id);
    if (!entry) return;
    this.sessions.delete(id);
    entry.httpTransport.onclose = undefined;
    void entry.httpTransport.close().catch(() => {});
    void entry.stdioTransport.close().catch(() => {});
  }

  sweep() {
    const cutoff = Date.now() - this.idleTimeoutMs;
    for (const [id, entry] of this.sessions) {
      if (entry.lastActivity < cutoff) this.close(id);
    }
  }

  closeAll() {
    for (const id of [...this.sessions.keys()]) this.close(id);
    clearInterval(this.sweeper);
  }
}

async function createBridgeServer() {
  const client = new Client({ name: "plex-watchlist-gate-bridge", version: "1.0.0" });
  const stdioTransport = new StdioClientTransport(stdioServerParameters());
  await client.connect(stdioTransport);

  const server = new Server(
    { name: "plex-watchlist-gate-remote", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    return client.listTools(request.params);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return client.callTool(request.params);
  });

  return { server, stdioTransport };
}

export function createAuthenticatedMcpHandler({ bearerToken, store }) {
  return async function handle(req, res) {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (!isAuthorized(req.headers, bearerToken)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    if (url.pathname === "/health" && req.method === "GET") {
      sendJson(res, 200, { status: "ok", server: "plex-watchlist-gate-remote", sessions: store.size });
      return;
    }

    if (url.pathname !== "/mcp") {
      sendJson(res, 404, { error: "Not Found", message: "Use /mcp for MCP requests" });
      return;
    }

    const rawSessionId = req.headers["mcp-session-id"];
    const sessionId = typeof rawSessionId === "string" ? rawSessionId : undefined;

    if (sessionId) {
      const entry = store.get(sessionId);
      if (!entry) {
        sendJson(res, 404, { jsonrpc: "2.0", error: { code: -32001, message: "Session not found or expired" }, id: null });
        return;
      }
      await entry.httpTransport.handleRequest(req, res);
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 400, { jsonrpc: "2.0", error: { code: -32000, message: "Missing mcp-session-id header" }, id: null });
      return;
    }

    if (!store.hasCapacity()) {
      sendJson(res, 503, { jsonrpc: "2.0", error: { code: -32000, message: "Server at session capacity" }, id: null });
      return;
    }

    const { server, stdioTransport } = await createBridgeServer();
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    });

    httpTransport.onclose = () => {
      if (httpTransport.sessionId) store.close(httpTransport.sessionId);
    };

    await server.connect(httpTransport);
    await httpTransport.handleRequest(req, res);

    if (httpTransport.sessionId) {
      store.add(httpTransport.sessionId, { httpTransport, stdioTransport });
      console.error(`Remote MCP session ${httpTransport.sessionId} initialized (total: ${store.size})`);
    }
  };
}

export function startRemoteBridge() {
  const bearerToken = getBearerToken();
  const listen = getListenOptions();
  const store = new SessionStore({
    maxSessions: positiveIntFromEnv("MCP_REMOTE_MAX_SESSIONS", DEFAULT_MAX_SESSIONS),
    idleTimeoutMs:
      positiveIntFromEnv("MCP_REMOTE_SESSION_TIMEOUT_SECONDS", DEFAULT_SESSION_IDLE_MS / 1000) * 1000,
  });
  const httpServer = createServer(createAuthenticatedMcpHandler({ bearerToken, store }));

  const shutdown = () => {
    store.closeAll();
    httpServer.close(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  httpServer.listen(listen.port, listen.host, () => {
    console.error(`Authenticated Plex MCP bridge listening on http://${listen.host}:${listen.port}/mcp`);
  });

  return { httpServer, store };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startRemoteBridge();
}
