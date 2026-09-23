# Neon Context Bridge

Neon is the remote, read-only context surface for ChatGPT. Plex remains catalogue/playback authority and Tautulli remains viewing-history authority.

## Scope

Included: Plex movies, TV shows, seasons, episodes, Tautulli movie/TV history, recently-added records, progress/watch state, playback device fields, and Plex identifiers.

Excluded: music, secrets, tokens, API keys, authorization headers, cookies, passwords, email addresses, IP addresses, and raw machine identifiers.

## Local configuration

Store the Neon connection string only in the local `.env` file:

```env
NEON_DATABASE_URL=replace_me
```

Never commit or print the actual value.

Install dependencies once:

```powershell
npm install
```

## First run

```powershell
npm run context:migrate
npm run context:dry-run
npm run context:sync -- --full
npm run context:verify
```

The migration is additive and idempotent. The full sync reconciles the current Plex catalogue, imports movie/TV Tautulli history, derives per-user watch state, and soft-deletes catalogue items that no longer exist in Plex.

## Normal operation

```powershell
npm run context:sync
```

Catalogue synchronization is idempotent and hash-based. Tautulli history advances with `sync.cursors(source='tautulli', stream='session_history_id')` so subsequent runs only import newer history events. A periodic full run can be used as an integrity reconciliation.

Useful modes:

```powershell
node --env-file=.env scripts/sync-context-bridge.mjs --sync --catalogue
node --env-file=.env scripts/sync-context-bridge.mjs --sync --history
node --env-file=.env scripts/sync-context-bridge.mjs --sync --full
node --env-file=.env scripts/sync-context-bridge.mjs --verify
```

## Query surface

ChatGPT-facing queries should use the `assistant` schema rather than raw `core` tables:

- `assistant.catalogue`
- `assistant.movies`
- `assistant.tv_episodes`
- `assistant.watch_history`
- `assistant.recently_added`
- `assistant.continue_watching`
- `assistant.recommendation_context`

The assistant views expose structured evidence; recommendation reasoning remains in ChatGPT rather than being embedded in the database.
