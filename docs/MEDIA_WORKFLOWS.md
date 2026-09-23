# Plex, Tautulli, and Nostalgia TV Workflows

This is the operational runbook for media tasks that can be completed end to end from the local Windows machine.

## Operating principles

- Plex is the catalogue and playback authority.
- Tautulli is the viewing-history and usage source.
- Nostalgia TV is the channel/scheduling surface.
- Notion or Neon is a context bridge for a remote ChatGPT assistant; it is not the source of truth.
- Music is excluded from the current bridge and media-automation workflows unless explicitly requested.
- Read-only audits can run automatically. Creating or updating playlists, channels, collections, or cloud records requires an explicit user request. Deletion, replacement, or destructive cleanup requires confirmation.
- Every mutating workflow is idempotent: detect existing objects first, reuse stable identifiers, and report created/updated/unchanged/failed results.

## Workflow 1: Tautulli history → Plex playlists → Nostalgia TV channels

Use when the request is phrased like “make Nostalgia TV channels from my most-watched shows,” “turn my recent viewing into channels,” or “build a channel lineup from Plex.”

### Steps

1. Audit reachability of Plex, Tautulli, and the Nostalgia TV web remote.
2. Read Tautulli history and exclude music. Rank shows or other requested media using raw play counts, recency, and completion/progress data. Do not infer personal preferences beyond the requested ranking.
3. Resolve each selected show and episode to Plex rating keys.
4. Inspect Plex playlists before writing. Reuse a playlist with the canonical name `Nostalgia TV — <name>` when it already exists.
5. Create or update the Plex playlist with the selected episode rating keys. Verify its item count and membership.
6. Open the authenticated Nostalgia TV web remote, go to Channels, and create or reuse a Custom Channel using `Add by Playlist`.
7. Refresh or inspect the Schedule/Guide so the channel is actually deployed, not merely present as a Plex playlist.
8. Verify the final channel names, playlist linkage, and visible schedule entries.

### Current implementation

- Playlist generation: `C:\plex-mcp\scripts\create-nostalgia-playlists.mjs`
- Current naming: `Nostalgia TV — The Simpsons`, `Nostalgia TV — Last Week Tonight`, and `Nostalgia TV — Top TV Mix`.
- Nostalgia deployment currently uses the authenticated local web remote. A future browser-automation wrapper should preserve the same audit, reuse, create, and verify sequence.

### Required report

Report the ranked source data, playlists created or reused, playlist item counts, Nostalgia channels created or reused, and schedule verification. Never claim deployment based only on Plex playlist creation.

## Workflow 2: Plex organization

Use for requests such as “organize my Plex library,” “make a collection,” “build a playlist for…,” or “clean up my TV lineup.”

1. Audit libraries, sections, existing playlists, collections, and relevant metadata.
2. Translate the user’s request into a named, stable object. Prefer playlists for ordered/programmed viewing and collections for grouping library items.
3. Resolve items by Plex rating key rather than title alone.
4. Preview the proposed membership and naming when the request is ambiguous.
5. Create or update idempotently. Do not delete, rename, or rewrite existing objects unless explicitly requested.
6. Verify membership counts and representative items through Plex.
7. If the result is intended for Nostalgia TV, continue with Workflow 1 rather than stopping at the Plex playlist.

Useful future presets include watch-next, recently added, short movies, unwatched catalogue, completed shows, seasonal programming, and genre or franchise collections.

## Workflow 3: Tautulli viewing analysis

Use for “what have I been watching,” “where did I stop,” “what do I repeatedly watch,” or “what should be continued.”

1. Read raw Tautulli history and session metadata.
2. Join events to Plex using rating key, parent rating key, and grandparent rating key.
3. Preserve source timestamps, user, player/device, platform, local/remote state, playback mode, progress, and duration.
4. Clearly label derived values such as completion percentage, partially watched, abandoned, and next episode.
5. Return evidence and identifiers. Leave personal interpretation and recommendations to the context-rich ChatGPT layer unless the user explicitly asks this agent to recommend.

## Workflow 4: Plex/Tautulli → context bridge

Use when the remote ChatGPT assistant needs current catalogue and viewing context without LAN access.

1. Audit the existing exporter and target schema before changing anything.
2. Export Movies, TV Shows, and relevant movie/TV Tautulli data only; exclude music at the source.
3. Recursively sanitize tokens, API keys, authorization headers, passwords, cookies, credentials, and secrets before any upload.
4. Preserve stable sync keys and Plex rating-key relationships.
5. Keep frequently queried fields structured: title, media type, year, genres, runtime, watched state, view count, last viewed, added date, library, ratings, director, and identifiers.
6. Represent TV as Show → Season → Episode, but choose compact or selective episode materialization based on actual retrieval behavior and scale.
7. Upsert incrementally, retry safely, avoid duplicates, and record sync timestamps and outcomes.
8. Validate through the remote database itself: counts, zero music records, representative catalogue queries, history joins, progress, recently added, and idempotent reruns.

Current local exporter: `C:\plex-mcp\scripts\export-context-bridge.mjs`

The existing JSONL snapshot is useful as an export artifact, but the durable implementation still needs a complete incremental sync path and remote validation when the Notion query quota permits. Neon is the preferred future backend for high-volume structured querying; Notion remains useful as a human/ChatGPT-readable bridge.

## Workflow 5: Service and bridge health check

Use before any dependent workflow or when the user asks whether the local services are running.

1. Check Plex availability and authenticated catalogue access.
2. Check Tautulli availability, database readability, and recent history availability.
3. Check Nostalgia TV availability and authenticated web-remote state.
4. Check the bridge exporter, local configuration, and last successful export/sync timestamp.
5. Report service status separately; one healthy service must not be presented as proof that the others are deployed or synchronized.

## Natural-language entry points

These requests should map to the workflows above:

- “Make channels from my most-watched TV” → Workflow 1.
- “Deploy those Plex playlists to Nostalgia TV” → Workflow 1, including web-remote deployment and schedule verification.
- “Create a playlist of unwatched movies under 100 minutes” → Workflow 2, then verify in Plex.
- “What was I watching and what should I continue?” → Workflow 3, with Plex joins.
- “Refresh the context bridge” → Workflow 4.
- “Are Plex, Tautulli, and Nostalgia TV running?” → Workflow 5.
- “Build a Nostalgia lineup from [criteria]” → Workflow 2 to create/reuse Plex playlists, then Workflow 1 to deploy channels.

## Standard completion report

Every mutating run should state:

- source audit and service status;
- objects created, updated, reused, skipped, and failed;
- stable Plex identifiers and item counts;
- whether Nostalgia deployment was completed and schedule-verified;
- whether a cloud/context sync was completed;
- validation performed and any remaining gaps.

