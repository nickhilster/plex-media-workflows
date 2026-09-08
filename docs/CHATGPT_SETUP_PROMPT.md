# ChatGPT / Codex Desktop Prompt — Remote Access Setup

**Use this with ChatGPT's desktop app (Codex) or any agent with local shell access on this same Windows machine.** It has real context on everything already built, so it can execute rather than just advise generically.

---

## Copy-Paste This Prompt

```
I have a fully working local Plex MCP (Model Context Protocol) bridge on this Windows 11
machine, built and tested end-to-end with Claude Desktop. I want you to set up secure
remote access so ChatGPT can reach it too, without exposing anything to the public
internet directly. You have local shell access on this machine — use it.

## Current State (verified working)

**Plex Media Server**
- Running at http://127.0.0.1:32400
- 3 libraries: Movies (943 items), TV Shows, Music
- Auth token stored in C:\plex-mcp\.env (PLEX_TOKEN) — do not print, log, or move this
  token anywhere; treat it as a live secret

**MCP Server**
- Source: https://github.com/niavasha/plex-mcp-server (cloned to C:\plex-mcp\src\plex-mcp-server)
- Distributed as a Claude Desktop Extension at C:\plex-mcp\extension\ — this is a
  self-contained bundle (manifest.json + server/build/ + server/node_modules/)
- Entry point is NOT the raw server — it's C:\plex-mcp\extension\server\watchlist-gate.js,
  a stdio JSON-RPC proxy I already built. It spawns the real
  server/build/plex-mcp-server.js as a child, forces PLEX_ENABLE_MUTATIVE_OPS=true
  internally, then filters the protocol so only these write tools survive:
  add_to_watchlist, remove_from_watchlist. Every other write tool (update_metadata,
  create_playlist, delete_playlist, mark_watched, mark_unwatched, rate_media, and 4
  more playlist tools) is hidden from tools/list AND rejected with an error if called
  directly — enforced in the proxy, not just by convention. Read watchlist-gate.js
  before touching anything downstream of it so you understand the filtering logic.
- Currently runs locally via stdio, spawned directly by Claude Desktop's Extension
  system — there is no persistent HTTP server listening on a port right now for the
  MCP protocol itself (transport is stdio, process-per-client).

**Radarr (tracking/search only — important constraint)**
- Running in Docker at http://127.0.0.1:7878
- API key in C:\plex-mcp\radarr\.apikey (also in .env as RADARR_API_KEY)
- Deliberately has NO indexers and NO download client configured — it can search
  TMDB and maintain a wanted list, but cannot fetch/download anything
- Keep it that way. Do not add indexers or a download client as part of this task —
  that's explicitly out of scope and was a deliberate decision, not an oversight.

**Tautulli**
- Running in Docker at http://127.0.0.1:8181, already connected to Plex, actively
  logging watch history

**Repo**
- Git repo at C:\plex-mcp, already has commits, .gitignore covers all secrets
  (.env, radarr/config/, radarr/.apikey, tautulli/config/)
- If you make changes, commit them with clear messages, but do NOT push anywhere
  without asking me first — no remote is configured currently

## What I Need From You

Design and implement secure remote access so a ChatGPT Custom GPT (or similar
MCP-capable remote client) can reach this MCP server, without:
- Exposing Plex (port 32400) directly to the internet
- Exposing Radarr (port 7878) directly to the internet
- Sending the Plex token to any remote client — it must stay on this machine
- Losing the read-only-plus-watchlist-only guarantee described above — whatever
  remote transport you add must sit in front of watchlist-gate.js (or replicate
  its filtering), not bypass it by talking to the raw plex-mcp-server.js directly

## Constraints

- Windows 11, no static public IP, no existing domain name (get one if the
  approach needs it, but ask me before buying anything)
- Prefer free-tier options (Cloudflare Tunnel, similar) over paid unless there's a
  strong reason otherwise — ask me before signing up for anything with a cost
- The current MCP transport is stdio, not HTTP — if your chosen remote-access
  approach needs the server reachable over HTTP/SSE instead, check whether the
  underlying niavasha/plex-mcp-server package already supports an HTTP/Streamable
  transport mode (I noticed references to this in its docs) before building a new
  transport layer from scratch
- Must include real authentication on the remote-facing side (OAuth, a bearer
  token, mutual TLS — something beyond "obscure URL"), since a remote endpoint
  needs actual auth even though the local proxy already limits what's reachable
- Log what you set up in C:\plex-mcp\docs\CHATGPT_CONNECTION.md when done —
  endpoint, transport, auth method, and the exact steps I need to take on the
  ChatGPT side to connect (never put the Plex token in that file)

## Do This

1. Investigate whether niavasha/plex-mcp-server supports an HTTP/SSE transport
   mode already (check its README/source in C:\plex-mcp\src\plex-mcp-server) —
   this determines whether you need a tunnel in front of a new HTTP listener, or
   whether you need to build a small stdio-to-HTTP bridge in front of
   watchlist-gate.js
2. Propose your approach and a rough architecture diagram before writing code —
   I want to sign off on the shape of it before you start standing up
   infrastructure
3. Implement it, test it locally first (curl/browser against the tunnel's public
   URL), confirm auth is actually enforced (a request without credentials should
   fail)
4. Verify end-to-end: from a machine that isn't this one, confirm you can reach
   the tunnel URL and get a valid MCP response for a read-only tool call
5. Give me the exact ChatGPT Custom GPT / connector configuration steps to wire
   this up on the ChatGPT side
6. Write C:\plex-mcp\docs\CHATGPT_CONNECTION.md summarizing all of the above

Ask me before: buying a domain, creating paid-tier cloud resources, or changing
anything about watchlist-gate.js's tool-filtering logic.
```

---

## Why This Prompt Is Built This Way

- **Full current-state dump up front** — an agent with no memory of this conversation needs the actual file paths, ports, and what's already running, not a summary. Vague context produces vague (or wrong) infrastructure choices.
- **`watchlist-gate.js` called out explicitly** — the biggest risk in adding remote access is a second, careless integration path that talks to the raw `plex-mcp-server.js` and skips the proxy, silently re-exposing all 12 write tools remotely. The prompt makes that a named constraint, not an assumption.
- **Radarr's "don't touch indexers" is spelled out** — otherwise a helpful agent might "improve" Radarr by wiring up indexers as part of "finishing the setup," which is exactly the line drawn earlier in this project.
- **Asks for a proposal before code** — remote-access architecture (Cloudflare Tunnel vs. ngrok vs. Tailscale vs. something else) is a real decision with tradeoffs; you want to see the shape of it before infrastructure gets stood up under your name.
- **Explicit "ask before" list** — domains, paid tiers, and touching the security-critical proxy file are exactly the three things worth a checkpoint before an autonomous agent acts.

---

## After It's Done

Come back here and I can:
- Sanity-check whatever `docs/CHATGPT_CONNECTION.md` says against what's actually running
- Help debug if the ChatGPT side doesn't connect
- Review the setup for anything that quietly widened the write-tool surface
