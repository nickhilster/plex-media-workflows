# Media Automation Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the proven Plex/Tautulli → Plex playlist → Nostalgia TV workflow, Plex organization tasks, viewing analysis, and context-bridge synchronization repeatable end to end from a natural-language request.

**Architecture:** Keep Plex as catalogue authority, Tautulli as history authority, Nostalgia TV as the channel/schedule target, and Notion/Neon as an optional remote context bridge. Use stable Plex identifiers, idempotent local operations, explicit mutation boundaries, and verification after every external write.

**Tech Stack:** Node.js ESM scripts, Plex HTTP API, Tautulli SQLite/API data, authenticated Nostalgia TV web remote, JSONL export, Notion or Neon synchronization.

**Spec:** `C:\plex-mcp\docs\MEDIA_WORKFLOWS.md`

## Global Constraints

- Exclude music from the current bridge and TV-channel workflows.
- Never upload or print tokens, API keys, cookies, passwords, authorization headers, or secrets.
- Resolve and persist Plex rating keys; do not rely on titles as identifiers.
- Read-only operations may be automated; destructive changes require explicit confirmation.
- Do not report Nostalgia deployment until a channel and schedule/guide state have been verified.
- Preserve source values and label derived analytics.
- Reruns must not create duplicate playlists, channels, or bridge records.

## Review Focus

- Idempotency and duplicate detection.
- Correct Movie/TV filtering and exclusion of music.
- Reliable joins between Tautulli history and Plex items.
- Safe browser deployment into Nostalgia TV.
- Validation based on retrieved state, not HTTP success alone.
- Clear handling of Notion limits and the future Neon migration.

## Implementation Tasks

### 1. Formalize the local service adapter

- [ ] Add one read-only health/audit layer that checks Plex, Tautulli, Nostalgia TV, exporter configuration, and last sync state.
- [ ] Return normalized service status without exposing credentials or unnecessary LAN details.
- [ ] Make all dependent workflows fail with a specific service-level reason.

### 2. Harden Plex/Tautulli playlist generation

- [ ] Extend `C:\plex-mcp\scripts\create-nostalgia-playlists.mjs` with explicit dry-run and apply modes.
- [ ] Support ranking presets for most-watched, recently watched, recently added, unwatched, watch-next, and user-specified criteria.
- [ ] Detect and reuse canonical playlists by name and stable membership.
- [ ] Report created, updated, unchanged, and failed playlist operations.
- [ ] Verify playlist membership through Plex after each write.

### 3. Automate Nostalgia TV deployment

- [ ] Wrap the authenticated web-remote sequence: Channels → Add Custom Channel → Add by Playlist → select Plex playlist → create/reuse channel.
- [ ] Detect existing channels by stable name and avoid duplicate channels.
- [ ] Refresh and verify Schedule/Guide state after deployment.
- [ ] Capture a concise result containing channel name, source playlist, item count, and schedule visibility.
- [ ] Require confirmation before deleting, replacing, or renumbering channels.

### 4. Complete the context bridge

- [ ] Preserve source-level Movie/TV filtering in `C:\plex-mcp\scripts\export-context-bridge.mjs`.
- [ ] Add an explicit incremental `--sync` mode with dry-run support.
- [ ] Upsert by stable sync key, update changed records, add new records, and mark or safely handle removed Plex media.
- [ ] Add relevant TV show/season/episode state without blindly materializing thousands of low-value pages.
- [ ] Add movie/TV-only Tautulli history and recently-added joins.
- [ ] Add bounded retry/backoff, checkpointing, and a final sync summary.
- [ ] Validate recursively sanitized payloads immediately before upload.

### 5. Add verification suites

- [ ] Verify local counts against Plex for movies and shows.
- [ ] Verify zero music records in the export and remote bridge.
- [ ] Verify representative playlist membership and Nostalgia channel deployment.
- [ ] Verify Tautulli events join to Plex rating keys and preserve progress/device information.
- [ ] Verify a rerun produces no duplicates and reports unchanged records.
- [ ] Verify the remote bridge supports genre/year/runtime/watched/recency queries and TV continuation queries.

### 6. Provide one end-to-end dispatcher

- [ ] Define a small command/request interface that maps natural-language intents to the workflows in the runbook.
- [ ] Keep planning and mutation separate: audit first, show or record the intended scope, then apply authorized writes.
- [ ] Emit the standard completion report defined in `MEDIA_WORKFLOWS.md`.
- [ ] Keep the workflow extensible for future Neon sync without changing Plex/Tautulli/Nostalgia adapters.

---

## Execution choice

The operational runbook is already captured. The next implementation step can be executed as one focused change set, or task-by-task using the checklist above. The highest-value first slice is the Nostalgia web-remote adapter plus idempotent playlist/channel verification, because the playlist-generation path already exists and has been proven manually.
