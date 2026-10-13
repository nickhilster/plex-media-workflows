# Local read-only Plex MCP on Debian

This launcher adapts the existing bundled server for a local MCP client on
Debian. It uses stdio only: there is no HTTP listener, port, service, or tunnel.
It does not change Plex libraries, media permissions, mounts, or playback.
The older Windows validation report is historical, not proof of Debian deployment.

## Access policy

Run `scripts/linux/read-only-mcp.mjs`, not the Windows watchlist gate or the
upstream entry point directly. The new gate permits 19 named Plex query tools
for browsing, search, history, statistics, recommendations and sessions.
Everything else is rejected before dispatch, even if a future upstream tool
claims to be read-only. Tool listings are filtered by the same allowlist.

Watchlist writes, metadata edits, playlist changes, watched-state changes,
ratings, exports to disk, Sonarr, Radarr and Trakt tools are excluded.
The child receives write flags set to false, optional integration credentials
removed, and dotenv pointed at `/dev/null`. Its working directory is `/tmp`,
and its stderr is discarded to avoid forwarding unreviewed diagnostics.
The original Windows extension is unchanged and still has its existing policy.

The Plex token itself is **not** made read-only by these settings. The gate is
the access boundary. A process with the same user's privileges can read its
environment; use a trusted local machine. This is not a sandbox for malicious
upstream code, and a dependency audit remains necessary before deployment.

## Install dependencies

Use Node.js 20 or newer and npm. From a trusted checkout of this repository:

```bash
cd extension/server
npm install --omit=dev --ignore-scripts
cd ../..
node --test tests/linux-read-only.test.mjs
```

The bundled JavaScript is committed; a TypeScript rebuild is not required.
There is currently no committed lockfile in `extension/server`, so dependencies
are not fully reproducible. Review the resolved packages and retain the generated
lockfile before deploying. Do not use the Windows rebuild script on Debian:
it references a separate source checkout not present at the documented path.

## Credentials and launch

Set `PLEX_URL=http://127.0.0.1:32400` when the MCP process runs on the Dell.
If the process runs on Legion, localhost means Legion, not the Dell; use the
Dell address and secure the connection appropriately.

Supply `PLEX_TOKEN` through a trusted secret provider or a hidden local prompt.
Do not paste it into chat, command arguments, a committed config, or a log.
For a manual terminal test, Bash can read it without echo or shell history:

```bash
read -r -s -p 'Plex token: ' PLEX_TOKEN
printf '\n'
export PLEX_TOKEN
export PLEX_URL=http://127.0.0.1:32400
node /absolute/path/to/plex-media-workflows/scripts/linux/read-only-mcp.mjs
unset PLEX_TOKEN
```

The process waits for MCP JSON-RPC on stdin; it is not an interactive text UI.
For a desktop client, configure the client's local stdio command as `node`,
with the absolute launcher path as its sole argument. Use that client's secure
environment/secret mechanism for the token; a GUI client may not inherit your
terminal environment. Never run the MCP process as root just to read Plex's
preferences. This change does not register an MCP server in Codex automatically.

## Verify deployment

First perform an MCP initialize handshake, then request `tools/list`. Confirm
only allowlisted names are advertised. Call `get_libraries` and confirm the
Dell's Movies and TV Shows libraries; then call `get_active_sessions`.
Calls to `add_to_watchlist`, `mark_watched`, `radarr_add_movie`,
`trakt_sync_from_trakt`, and an unknown tool must be rejected by the gate.
Do not invoke mutating tools directly against the upstream server to test it.

The repository tests use a fake child to verify filtering, dispatch rejection,
and environment restrictions without touching Plex. Passing these tests does
not prove live authentication or client registration. Record those checks
separately when actually performed.

Tautulli is a separate application. Installing it does not connect it to this
bridge; no Tautulli integration or credentials are enabled by this change.
