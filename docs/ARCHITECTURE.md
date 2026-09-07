# Plex MCP Bridge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Assistant (ChatGPT)                   │
│                    (Future: Remote Access)                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS/MCP
                                 │ (Cloudflare Tunnel)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Secure Remote Gateway                         │
│          (Cloudflare Access / OAuth / Rate Limiting)            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Local HTTPS
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Local Network (192.168.1.x)                  │
│                                                                 │
│  ┌────────────────────────┐          ┌─────────────────────┐   │
│  │   Plex MCP Server      │          │   Tautulli          │   │
│  │   (Node.js)            │◄─────────►│   (Docker)          │   │
│  │   Port: 3002           │  Analytics│   Port: 8181        │   │
│  │   • Read-only tools    │          │   • Watch history   │   │
│  │   • 46+ functions      │          │   • User stats      │   │
│  │   • Recommendations    │          │   • Popular content │   │
│  └────────────────────────┘          └─────────────────────┘   │
│              ▲                                                   │
│              │ HTTP/XML                                         │
│              │ X-Plex-Token                                     │
│              │                                                   │
│  ┌────────────────────────┐                                     │
│  │   Plex Media Server    │                                     │
│  │   Port: 32400          │                                     │
│  │   • Library data       │                                     │
│  │   • Watch history      │                                     │
│  │   • Metadata           │                                     │
│  └────────────────────────┘                                     │
│              ▲                                                   │
│              │                                                   │
│              ▼                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Media Storage (O:\, P:\, D:\)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Plex Media Server (Port 32400)
- **Role:** Core media library and metadata source
- **Protocol:** HTTP/XML
- **Authentication:** X-Plex-Token header
- **Access:** Read-only (no direct modifications)
- **Data Sources:**
  - Movies library (O:\, P:\, D:\TORRENTS)
  - TV Shows library (O:\, P:\, D:\TORRENTS)
  - Music library (O:\HQ MUSIC)

### 2. Plex MCP Server (Port 3002)
- **Role:** Model Context Protocol bridge
- **Technology:** Node.js + TypeScript
- **Framework:** MCP SDK
- **Location:** `C:\plex-mcp\src\plex-mcp-server`
- **Executable:** `build/plex-mcp-server.js`

#### Capabilities:
- **46 read-only tools** for querying Plex
- **Library Management:** Browse, search, get metadata
- **Watch History:** Viewing statistics, user activity, popular content
- **Recommendations:** AI-powered suggestions based on watch history
- **Derived Queries:** Recent additions, on-deck, unwatched items
- **Optional Integrations:** Sonarr, Radarr, Trakt.tv

#### Tool Categories:

**Plex Core (20 tools):**
- `get_libraries` - List all Plex libraries
- `search_media` - Global or per-library search
- `get_media_details` - Comprehensive metadata
- `get_recently_added` - New content
- `get_on_deck` - Continue watching
- `get_recently_watched` - Recent playback
- `get_watch_history` - Detailed sessions
- `get_fully_watched` - Completed movies/shows
- `get_watch_stats` - Comprehensive statistics
- `get_user_stats` - User activity
- `get_library_stats` - Library metrics
- `get_popular_content` - Trending analysis
- `get_recommendations` - Personalized suggestions
- `get_active_sessions` - Current streams
- Plus 6 more utilities

### 3. Tautulli (Port 8181)
- **Role:** Plex monitoring and analytics dashboard
- **Technology:** Docker container
- **Purpose:**
  - User watch history tracking
  - Viewing statistics and trends
  - Popular content analysis
  - Session monitoring
  - Notification alerts
  - Library statistics

#### Tautulli Features:
- Real-time stream monitoring
- Daily/weekly/monthly statistics
- User activity breakdown
- Most played content
- Library growth tracking
- Watchlist management
- Custom reports

### 4. Configuration & Storage

**Project Structure:**
```
C:\plex-mcp\
├── .env                      # Plex token (gitignored)
├── .env.example             # Configuration template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Tautulli configuration
├── README.md                # Project overview
│
├── src/
│   └── plex-mcp-server/     # MCP server (cloned from GitHub)
│       ├── src/             # TypeScript source
│       ├── build/           # Compiled JavaScript
│       ├── package.json     # Node dependencies
│       └── README.md        # MCP server docs
│
├── scripts/
│   ├── start-mcp.ps1        # Start MCP server
│   ├── status-mcp.ps1       # Check MCP status
│   ├── start-tautulli.ps1   # Start Tautulli
│   ├── get-plex-token.ps1   # Token retrieval helper
│   └── extract-token-interactive.ps1  # Interactive token extractor
│
├── docs/
│   ├── HOST_AUDIT.md        # System information
│   ├── ARCHITECTURE.md      # This file
│   ├── INSTALLATION.md      # Setup instructions
│   ├── READ_ONLY_SECURITY.md # Security & restrictions
│   ├── VALIDATION.md        # Test results
│   └── CHATGPT_CONNECTION.md # Remote access setup
│
├── config/
│   └── tool-allowlist.json  # Read-only tool restrictions
│
├── logs/
│   ├── mcp-server.log       # MCP server logs
│   └── .gitkeep
│
└── tautulli/
    ├── config/              # Tautulli configuration
    └── logs/                # Tautulli logs
```

## Data Flow

### Query Path (Read-Only)
```
User Request
    ↓
MCP Client (Claude/ChatGPT)
    ↓
MCP Server (Port 3002)
    ├─► Tool Registry (46+ tools)
    │   ├─► Plex API Tools
    │   ├─► Analytics Tools
    │   └─► Recommendation Engine
    │
    └─► Plex Server (Port 32400)
        └─► HTTP GET requests + X-Plex-Token
            ├─► /identity
            ├─► /library/sections
            ├─► /library/sections/{id}/all
            ├─► /library/metadata/{ratingKey}
            ├─► /library/sections/all/history
            └─► ... (read-only endpoints only)

Response Path
```

### Analytics Path
```
Plex Media Server (Real-time events)
    ↓
Tautulli (Port 8181)
    ├─► Webhook listeners
    ├─► Database storage
    └─► Analytics dashboard
    
User Queries
    ↓
MCP Server → Tautulli API
    ↓
Enhanced statistics returned
```

## Security Architecture

### Local Boundary
- MCP server listens only on `127.0.0.1:3002` (localhost)
- Plex server on `127.0.0.1:32400` (localhost)
- Tautulli on `127.0.0.1:8181` (localhost)
- No exposure to external networks yet

### Authentication
- **Plex Token:** Stored in `.env` (local-only, gitignored)
- **Token Scope:** Read-only operations only
- **No Shared Keys:** MCP does not expose token to remote clients
- **Per-Request Auth:** Token included in every Plex API call

### Access Control
- **Tool Allowlist:** Only safe read-only tools exposed
- **Write Operations:** Disabled by default
- **Sensitive Fields:** Token never logged or displayed
- **Validation:** All inputs validated before Plex queries

### Future Remote Access (Cloudflare Tunnel)
```
Remote Client (ChatGPT)
    │
    ├─→ HTTPS (Public Internet)
    │
    ├─→ Cloudflare Access
    │   ├─ OAuth/SAML authentication
    │   ├─ Mutual TLS
    │   └─ Rate limiting
    │
    └─→ Cloudflare Tunnel
        └─→ Secure encrypted connection
            └─→ Local MCP Server
                ├─ Plex token stays local
                ├─ No direct Plex exposure
                └─ Read-only guarantee maintained
```

## Extension Points (Optional)

### 1. Semantic Search (Phase 13)
- Vector embeddings of movie descriptions
- Similarity-based recommendations
- "Find something like Arrival but different"
- Requires: vector database + embeddings model

### 2. Tautulli Integration (Phase 14)
- Enhanced viewing analytics
- Per-user statistics
- Session history analysis
- Transcode/direct-play tracking
- Optional: Both Plex API + Tautulli API queries

### 3. Sonarr/Radarr Integration
- Already supported in MCP server
- Browse, search, add series/movies
- Queue monitoring
- Profile/folder management
- Requires: API keys (optional)

### 4. Trakt.tv Integration
- Sync Plex watch history to Trakt
- Catch movies watched outside Plex
- OAuth authentication
- Requires: Trakt application (optional)

## Performance Considerations

### Plex API Queries
- **Library Load:** ~1-2s for 1000 items
- **Search:** ~500ms (local, no network)
- **Watch History:** ~2-3s (full history fetch)
- **Recent:** ~500ms (cached results)

### Caching Strategy
- MCP server caches library structure (5 min TTL)
- Recent items cached (2 min TTL)
- Watch history cached per-session
- Search results not cached (fresh each query)

### Concurrency
- Single-threaded Node.js event loop
- Sequential Plex API calls (safe)
- MCP handles multiple concurrent client requests
- No database transactions needed (read-only)

## Scaling Considerations

### Local Scaling
- Current setup handles single household use
- Tautulli can store full history (50k+ sessions)
- MCP tools handle libraries up to 10k+ items

### Remote Scaling
- Cloudflare Tunnel handles bandwidth throttling
- Rate limiting prevents abuse
- Caching reduces Plex load
- Authentication gates access

## Disaster Recovery

### Backup Strategy
- `.env` backup to external drive
- Tautulli config backup (docker volume)
- Plex libraries (no backup needed - source media intact)
- MCP source (available from GitHub)

### Recovery Procedures
1. **MCP Server Crash:** Restart via `start-mcp.ps1`
2. **Tautulli Loss:** Restore config from backup or reconfigure
3. **Plex Token Expiry:** Generate new token, update `.env`
4. **Network Failure:** Service waits for Plex to return online

---

**Architecture designed for reliability, security, and extensibility.**
