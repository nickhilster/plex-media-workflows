# ChatGPT Remote MCP Connection

## Current Architecture

```
ChatGPT MCP client
  -> HTTPS Cloudflare quick tunnel
  -> localhost-only authenticated bridge (127.0.0.1:3333)
  -> watchlist-gate.js stdio proxy
  -> upstream plex-mcp-server.js
  -> Plex/Radarr/Tautulli localhost services
```

The remote-facing endpoint is Streamable HTTP at:

```
https://producer-scan-nashville-both.trycloudflare.com/mcp
```

This is an accountless Cloudflare quick tunnel URL. It is free and useful for testing, but it is ephemeral and has no uptime guarantee. Restarting the tunnel can produce a different hostname.

## Authentication

The bridge requires:

```
Authorization: Bearer <MCP_REMOTE_BEARER_TOKEN>
```

`MCP_REMOTE_BEARER_TOKEN` is stored in `C:\plex-mcp\.env`, which is gitignored. Do not paste the Plex token into ChatGPT or any remote client. The Plex token remains only on this machine and is used by the local MCP process.

Requests without the bearer token are rejected with `401 Unauthorized`.

## Security Boundary

The bridge binds to `127.0.0.1:3333` by default. Cloudflare Tunnel forwards only to that local bridge. Plex (`127.0.0.1:32400`) and Radarr (`127.0.0.1:7878`) are not exposed directly.

The bridge does not talk to `plex-mcp-server.js` directly. Each remote MCP session spawns `C:\plex-mcp\extension\server\watchlist-gate.js`, preserving the existing read-only-plus-watchlist-only policy. In verification, `update_metadata` was not present in `tools/list`, while `add_to_watchlist` was present.

## Start Locally

Terminal 1:

```powershell
C:\plex-mcp\scripts\start-chatgpt-bridge.ps1
```

Terminal 2:

```powershell
C:\plex-mcp\scripts\start-chatgpt-quick-tunnel.ps1
```

Copy the `https://...trycloudflare.com` URL printed by Cloudflare and append `/mcp` for ChatGPT.

## ChatGPT Custom GPT Configuration

Use an MCP connector or Custom GPT action that supports Streamable HTTP MCP.

- MCP server URL: `https://<your-current-trycloudflare-host>/mcp`
- Transport: Streamable HTTP
- Authentication: Bearer token
- Bearer token value: the value of `MCP_REMOTE_BEARER_TOKEN` from `C:\plex-mcp\.env`

Do not configure ChatGPT with `PLEX_TOKEN`, `RADARR_API_KEY`, Plex port `32400`, or Radarr port `7878`.

## Verification Performed

Local bridge:

- `GET http://127.0.0.1:3333/health` without credentials returned `401`.
- Authenticated `GET http://127.0.0.1:3333/health` returned `status=ok`.
- Authenticated MCP `tools/list` returned 48 tools.
- `get_libraries` was available.
- `add_to_watchlist` was available.
- `update_metadata` was not available.
- Authenticated MCP `get_libraries` returned the Plex `Movies` library.

Cloudflare tunnel:

- Public URL tested: `https://producer-scan-nashville-both.trycloudflare.com`.
- `GET /health` without credentials returned `401`.
- Authenticated `GET /health` returned `status=ok`.
- Authenticated MCP `tools/list` returned 48 tools.
- `update_metadata` was not available.
- Authenticated MCP `get_libraries` returned the Plex `Movies` library.

## Toward A Stable Production URL

For longer-term use, replace the quick tunnel with a named Cloudflare Tunnel and either:

- keep bearer auth at this bridge, or
- add Cloudflare Access in front of the tunnel.

A named tunnel usually requires a Cloudflare account and a domain or managed hostname. Ask before buying a domain or creating paid resources.
