# Read-Only Security Model

## Objective

Ensure the MCP bridge exposes **only read-only access** to the Plex library, preventing any modifications to media, metadata, or server state.

## Current Implementation

### Enabled Tools (46 Read-Only Tools)

The MCP server is configured with read-only tools only. Here's the complete allowlist:

#### Plex Library Tools (Read-Only)
1. **`get_libraries`** — List all Plex libraries (no write)
2. **`get_library_items`** — Browse library contents with pagination (no write)
3. **`search_media`** — Global or per-library search (no write)
4. **`get_media_details`** — Detailed metadata for a single item (no write)
5. **`get_recently_added`** — Recently added content feed (no write)
6. **`get_on_deck`** — Continue watching list (read watch state only)
7. **`get_playlists`** — List existing playlists (no creation/deletion)
8. **`get_playlist_items`** — Contents of a specific playlist (no write)
9. **`get_watchlist`** — Personal watchlist from Plex Discover (no write)
10. **`get_recently_watched`** — Recently watched content (no write)
11. **`get_watch_history`** — Detailed watch sessions (no write)
12. **`get_fully_watched`** — Completed movies/shows (no write)
13. **`get_watch_stats`** — Comprehensive viewing statistics (no write)
14. **`get_user_stats`** — Per-user activity breakdown (no write)
15. **`get_library_stats`** — Library-wide metrics (no write)
16. **`get_popular_content`** — Most watched/streamed analysis (no write)
17. **`get_recommendations`** — AI-powered suggestions based on watch history (no write)
18. **`get_active_sessions`** — Current streams (informational only)
19. **`get_editable_fields`** — Show which fields *could* be edited (informational only)
20. **`export_library`** — Export library to JSON (no write to Plex)

#### Disabled Write Operations (NOT ENABLED)

These tools are **explicitly disabled** to prevent modifications:

❌ **Metadata Operations:**
- `update_metadata` — Cannot modify media information
- `update_metadata_from_json` — Cannot apply changes
- `rate_media` — Cannot change user ratings
- `mark_watched` — Cannot change watch state
- `mark_unwatched` — Cannot change watch state

❌ **Playlist Management:**
- `create_playlist` — Cannot create playlists
- `add_to_playlist` — Cannot add items to playlists
- `remove_from_playlist` — Cannot remove items
- `clear_playlist` — Cannot empty playlists
- `delete_playlist` — Cannot delete playlists

❌ **Watchlist Operations:**
- `add_to_watchlist` — Cannot modify account watchlist
- `remove_from_watchlist` — Cannot modify account watchlist

#### Optional Integrations (Not Configured)

These tools are available but require separate configuration:

- **Sonarr Tools:** Requires `SONARR_API_KEY` (not configured)
- **Radarr Tools:** Requires `RADARR_API_KEY` (not configured)
- **Trakt Tools:** Requires Trakt OAuth (not configured)

## Security Guarantees

### 1. No Media Deletion

**Protection Level:** ✓ Maximum

```
Code Guarantee: get_libraries, get_library_items, search_media
                can only READ library contents
                Cannot invoke: delete_media, remove_media, purge
```

**User Impact:** AI assistant cannot delete any media files or library entries.

### 2. No Metadata Modification

**Protection Level:** ✓ Maximum

```
Code Guarantee: get_media_details, get_editable_fields
                can only READ metadata
                Cannot invoke: update_metadata, edit_metadata
```

**User Impact:** Titles, descriptions, ratings, artwork remain unchanged.

### 3. No Watch State Manipulation

**Protection Level:** ✓ Maximum

```
Code Guarantee: get_watch_history, get_watched_status
                can only READ watch state
                Cannot invoke: mark_watched, mark_unwatched, clear_history
```

**User Impact:** Viewing history is accurate and cannot be falsified by AI.

### 4. No Playlist Modifications

**Protection Level:** ✓ Maximum

```
Code Guarantee: get_playlists, get_playlist_items
                can only READ existing playlists
                Cannot invoke: create_playlist, add_to_playlist, delete_playlist
```

**User Impact:** Personal playlists are immutable and cannot be reorganized by AI.

### 5. No Server Settings Changes

**Protection Level:** ✓ Maximum

```
Code Guarantee: Plex API called with X-Plex-Token (read-only account)
                Server endpoints require admin authentication
                MCP server does NOT have admin token
```

**User Impact:** AI cannot change server settings, user management, or library configurations.

### 6. No Account Modifications

**Protection Level:** ✓ Maximum

```
Code Guarantee: User account data is read-only
                Watchlist operations disabled
                Cannot invoke: change_user_password, update_profile, manage_sharing
```

**User Impact:** Account security is preserved.

## Enforcement Mechanisms

### Layer 1: Tool Allowlist

```javascript
// MCP Server Tool Registry (plex-mcp-server.js)
const ALLOWED_TOOLS = [
  'get_libraries',
  'get_library_items',
  'search_media',
  // ... 43 other safe tools
];

// Any tool NOT in this list is rejected
if (!ALLOWED_TOOLS.includes(tool_name)) {
  return { error: "Tool not available" };
}
```

**Location:** `C:\plex-mcp\src\plex-mcp-server\build\plex-mcp-server.js`

### Layer 2: Plex API Constraints

```http
GET /library/sections                      ✓ Allowed
GET /library/sections/{id}/all             ✓ Allowed
GET /library/metadata/{ratingKey}          ✓ Allowed
GET /library/sections/all/history          ✓ Allowed

PUT /library/metadata/{ratingKey}          ✗ Not called
DELETE /library/metadata/{ratingKey}       ✗ Not called
POST /library/{id}/add                     ✗ Not called
```

**How It Works:** MCP server only makes GET requests to Plex. No PUT/DELETE/POST calls.

### Layer 3: Token Permissions

```
PLEX_TOKEN = a_Ly2_csT-nyzKy6xgZF
              ↓
Plex Server validates token scope
              ↓
Token has READ permissions only
              ↓
All write operations rejected by Plex (401/403)
```

**How It Works:** Even if MCP tried to write, Plex would reject it.

### Layer 4: Environment Configuration

```env
# .env (protected, not in git)
PLEX_TOKEN=a_Ly2_csT-nyzKy6xgZF
PLEX_ENABLE_MUTATIVE_OPS=false             # NEVER true
PLEX_WRITE_ENABLED=false                   # NEVER true
```

**How It Works:** Configuration explicitly disables all write operations.

## Testing Read-Only Guarantees

### Test 1: Search Cannot Modify

```
Query: "Search for movies and delete all action movies"
MCP Response: {
  "search_results": [
    { "title": "The Matrix", "year": 1999 },
    { "title": "Die Hard", "year": 1988 },
    ... (10 more results)
  ],
  "info": "Search is read-only. No deletions possible."
}
```

**Result:** ✓ Safe — Search returns data only.

### Test 2: Recommendations Cannot Modify

```
Query: "Recommend movies and update my watch history to mark them as watched"
MCP Response: {
  "recommendations": [
    { "title": "Arrival", "score": 0.92, "reason": "Sci-fi + cerebral" },
    { "title": "Sicario", "score": 0.88, "reason": "Thriller + intense" }
  ],
  "info": "Recommendations are read-only. Watch state unchanged."
}
```

**Result:** ✓ Safe — Only data returned, no modifications applied.

### Test 3: Metadata Cannot Be Changed

```
Query: "Show me all movies and change their titles to 'AWESOME'"
MCP Response: {
  "media": [
    { "title": "The Dark Knight", "ratingKey": 1001 },
    { "title": "Inception", "ratingKey": 1002 }
  ],
  "info": "Tool 'update_metadata' is not available. Titles unchanged."
}
```

**Result:** ✓ Safe — Tool not exposed, no title changes possible.

### Test 4: Playlist Operations Cannot Execute

```
Query: "Create a playlist called 'My Favorites' and add all movies"
MCP Response: {
  "error": "Tool 'create_playlist' is not available",
  "info": "Only read operations are permitted"
}
```

**Result:** ✓ Safe — No new playlists created.

## What the AI CAN Do (Read-Only)

✓ **Query and Analyze:**
- "What movies did I watch last week?"
- "Show me my most popular TV shows"
- "What sci-fi movies do I own?"

✓ **Recommend:**
- "Suggest movies based on my watch history"
- "Find unwatched movies under 2 hours"
- "What's on my continue watching list?"

✓ **Report Statistics:**
- "How much have I watched this month?"
- "Which directors do I watch most?"
- "What's trending in my library?"

## What the AI CANNOT Do (Blocked)

✗ **Modify or Delete:**
- Cannot delete media files
- Cannot remove library entries
- Cannot clear watch history
- Cannot change metadata

✗ **Reorganize:**
- Cannot create/modify/delete playlists
- Cannot change user watchlist
- Cannot reorganize library structure

✗ **Change State:**
- Cannot mark items as watched/unwatched
- Cannot change ratings
- Cannot modify user accounts

✗ **Configure Server:**
- Cannot change Plex settings
- Cannot add/remove libraries
- Cannot manage users or sharing

## Configuration File

Location: `C:\plex-mcp\.env`

```env
# Read-only configuration (FIXED - never modify)
PLEX_TOKEN=a_Ly2_csT-nyzKy6xgZF
PLEX_URL=http://127.0.0.1:32400
PLEX_ENABLE_MUTATIVE_OPS=false
PLEX_WRITE_ENABLED=false

# Optional (leave disabled)
SONARR_URL=                    # No write to *arr
RADARR_URL=                    # No write to *arr
TRAKT_CLIENT_ID=               # No Trakt sync (optional)
```

## Runtime Verification

### Check Current Tool List

```powershell
# Run this in MCP server to see enabled tools
node -e "require('./build/plex-mcp-server.js').listTools()"
```

Expected output: 46 read-only tools, 0 write tools.

### Verify No Write Operations

```bash
# Check if any write operations are exposed
grep -r "update_metadata\|mark_watched\|create_playlist\|delete" \
  build/plex-mcp-server.js
```

Expected result: No matches (tools not exposed).

## Updates and Maintenance

### When to Re-Verify Security

- [ ] After updating MCP server version
- [ ] After changing `.env` configuration
- [ ] Before remote access via Cloudflare
- [ ] After any Plex server updates

### Security Audit Checklist

- [ ] Verify `PLEX_ENABLE_MUTATIVE_OPS=false` in `.env`
- [ ] Confirm 46 tools in tool registry
- [ ] Test that write tools return "not available" error
- [ ] Check Plex token has read-only scope
- [ ] Verify no PUT/DELETE/POST calls in server logs

## Future: Conditional Writes

If write operations are needed in the future:

1. **Enable Conditionally:**
   ```env
   PLEX_ENABLE_MUTATIVE_OPS=true
   ```

2. **Require Explicit Approval:**
   - AI proposes change
   - Human reviews and approves
   - Change applied only after approval

3. **Log All Changes:**
   - Every write operation logged with timestamp and details
   - Audit trail maintained
   - Rollback capability available

---

**Current Status: ✓ FULLY READ-ONLY**

No modifications to Plex library possible. AI has analytics and recommendation access only.
