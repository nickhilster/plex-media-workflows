# Plex MCP Bridge

A secure, read-only Model Context Protocol (MCP) bridge for Plex Media Server that enables AI assistants like ChatGPT to intelligently browse, search, and recommend content from your personal media library.

**Status:** ✓ Fully Operational (Local Phase)

## What This Does

This system bridges your Plex Media Server to AI assistants via the Model Context Protocol, allowing conversations like:

- *"What movies did I watch last week?"*
- *"Show me my most popular TV shows this month"*
- *"Recommend unwatched sci-fi movies under 2 hours"*
- *"What's on my continue-watching list?"*
- *"Find action movies I added but never watched"*
- *"Which directors do I watch most?"*

All queries stay **read-only** — the AI can analyze and recommend, but never modify your library.

## Architecture

```
Your Plex Server (Port 32400)
          ↓ HTTP + Token
Plex MCP Server (Port 3002)
    ├─ 46+ read-only tools
    ├─ Watch history analysis
    ├─ Personalized recommendations
    └─ Analytics integration
          ↓ MCP Protocol
AI Assistants (Claude, ChatGPT)
    └─ Safe, read-only access
          ↓ (Future)
Tautulli (Port 8181)
    └─ Advanced analytics
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design.

## Quick Start

### 1. Verify Prerequisites

```powershell
# All of these should be ✓ installed
node --version         # v24+
python --version       # 3.9+
docker --version       # 19+
git --version          # 2.0+
```

### 2. Start the MCP Server

```powershell
C:\plex-mcp\scripts\start-mcp.ps1
```

This will:
- Load your Plex token from `.env`
- Verify Plex connectivity
- Start the Node.js MCP server on port 3002
- Begin logging to `logs/mcp-server.log`

### 3. Check Status

```powershell
C:\plex-mcp\scripts\status-mcp.ps1
```

Output will show:
- ✓ Plex reachability
- ✓ MCP server process
- ✓ Port 3002 listening
- ✓ Recent log activity

### 4. (Optional) Start Tautulli for Analytics

```powershell
C:\plex-mcp\scripts\start-tautulli.ps1
```

Then open: http://127.0.0.1:8181

## Configuration

### `.env` File (Secrets - Never Commit)

```env
# Your Plex authentication token (from browser DevTools)
PLEX_TOKEN=your_plex_token_here

# Your Plex server URL
PLEX_URL=http://127.0.0.1:32400

# MCP server binding (localhost only for now)
MCP_HOST=127.0.0.1
MCP_PORT=3002
```

**Important:** The `.env` file is **gitignored** by default. Never commit it.

### Getting Your Plex Token

1. Open http://127.0.0.1:32400/web in your browser
2. Log in to your Plex account
3. Press F12 to open Developer Tools
4. Go to Console and run:
   ```javascript
   localStorage.getItem('myPlexAccessToken')
   ```
5. Copy the result and add it to `.env`

See [docs/GET_AUTH_TOKEN.md](docs/GET_AUTH_TOKEN.md) for detailed instructions.

## Features

### 46+ Read-Only Tools

**Library Management:**
- List all libraries
- Search media globally or in specific libraries
- Get comprehensive metadata for any item
- Browse playlists and watchlist

**Watch History & Analytics:**
- Recently watched content
- Full watch history with timestamps
- Viewing statistics (daily, weekly, monthly)
- User activity breakdown
- Popular content analysis

**Recommendations:**
- Personalized movie suggestions based on your watch history
- Smart filtering by genre, director, actor, rating, runtime
- Per-user recommendations for multi-user Plex servers
- Unwatched items discovery

**Advanced:**
- Continue-watching list
- Recently added content
- Tautulli-style analytics
- Session monitoring (who's watching what, right now)
- Optional Sonarr/Radarr integration
- Optional Trakt.tv integration

### Complete Read-Only Guarantee

No write operations enabled:
- ✗ Cannot delete media
- ✗ Cannot modify metadata
- ✗ Cannot change watch state
- ✗ Cannot create/modify playlists
- ✗ Cannot change server settings

See [docs/READ_ONLY_SECURITY.md](docs/READ_ONLY_SECURITY.md) for technical details.

## Documentation

| Document | Purpose |
|----------|---------|
| [HOST_AUDIT.md](docs/HOST_AUDIT.md) | System inventory and network config |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [READ_ONLY_SECURITY.md](docs/READ_ONLY_SECURITY.md) | Security model and guarantees |
| [VALIDATION.md](docs/VALIDATION.md) | Test results and verification |
| [GET_AUTH_TOKEN.md](docs/GET_AUTH_TOKEN.md) | How to retrieve your Plex token |
| [INSTALLATION.md](docs/INSTALLATION.md) | Detailed setup instructions |

## Scripts

### Start MCP Server
```powershell
.\scripts\start-mcp.ps1
```
Starts the Node.js MCP server. Outputs logs to `logs/mcp-server.log`.

### Check Status
```powershell
.\scripts\status-mcp.ps1
```
Verifies Plex connectivity, checks MCP process, shows recent logs.

### Start Tautulli
```powershell
.\scripts\start-tautulli.ps1
```
Launches Tautulli (Docker) for advanced analytics. Access at http://127.0.0.1:8181

### Extract Token
```powershell
.\scripts\extract-token-interactive.ps1
```
Interactive helper to get your Plex token and save it to `.env`.

## Project Structure

```
C:\plex-mcp/
├── .env                      # Your secrets (gitignored)
├── docker-compose.yml        # Tautulli configuration
├── README.md                 # This file
│
├── src/
│   └── plex-mcp-server/      # MCP server (niavasha/plex-mcp-server)
│       ├── build/            # Compiled JavaScript
│       ├── src/              # TypeScript source
│       └── node_modules/     # Dependencies
│
├── scripts/
│   ├── start-mcp.ps1         # Start MCP server
│   ├── status-mcp.ps1        # Check status
│   ├── start-tautulli.ps1    # Start analytics
│   └── extract-token-interactive.ps1
│
├── docs/
│   ├── HOST_AUDIT.md         # System info
│   ├── ARCHITECTURE.md       # Design overview
│   ├── READ_ONLY_SECURITY.md # Security model
│   ├── VALIDATION.md         # Test results
│   └── GET_AUTH_TOKEN.md     # Token retrieval
│
├── config/
│   └── tool-allowlist.json   # Tool restrictions
│
├── logs/
│   └── mcp-server.log        # Server logs
│
└── tautulli/
    ├── config/               # Tautulli configuration
    └── logs/                 # Tautulli logs
```

## How It Works

### Query Flow

1. **User Message:** "Recommend unwatched sci-fi movies"
2. **MCP Client** (Claude/ChatGPT) parses the request
3. **MCP Server** (Port 3002) receives it and selects appropriate tools:
   - `get_recommendations` — Personalized suggestions
   - `get_libraries` — Identify libraries
4. **Tool Execution:**
   - Plex API queries via HTTP + token
   - Data processing and analysis
   - AI-friendly response format
5. **Response:** Ranked movie recommendations with rationale
6. **No Plex Changes:** Library remains unmodified

### Data Flow

```
Plex Media Server (Port 32400)
  ├── Library: Movies (1200 items)
  ├── Library: TV Shows (300 items)
  ├── Library: Music (5000 items)
  └── Watch History (10,000+ sessions)
       ↓ HTTP/XML + X-Plex-Token
Plex MCP Server (Port 3002)
  ├── Tool Registry (46 tools)
  ├── Watch History Analysis
  ├── Recommendation Engine
  └── Response Formatting
       ↓ MCP Protocol (stdout/HTTP)
AI Assistant
  ├── Tool Invocation
  ├── Context Integration
  └── Natural Language Response
```

## Security Model

### Local Boundary
- MCP server: `127.0.0.1:3002` (localhost only)
- Plex server: `127.0.0.1:32400` (localhost only)
- Tautulli: `127.0.0.1:8181` (localhost only)
- **No external exposure yet**

### Authentication
- Plex token stored in `.env` (local-only, gitignored)
- Token never exposed to remote clients
- Each Plex API call includes token in headers
- Token scope: read-only operations only

### Access Control
- 46 read-only tools; 12 write tools blocked
- Tool allowlist enforced by MCP server
- No Plex API mutations (GET only, no PUT/DELETE/POST)
- Sensitive data never logged

### Future Remote Access
- Will use Cloudflare Tunnel (secure, identity-aware)
- HTTPS encryption end-to-end
- OAuth/SAML authentication
- Rate limiting and abuse protection
- Plex token stays local (never shared)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for remote access plan.

## Logs

Logs are stored in `logs/mcp-server.log`:

```
[2026-09-06 10:15:23] Server started at http://127.0.0.1:3002
[2026-09-06 10:15:24] Connected to Plex at http://127.0.0.1:32400
[2026-09-06 10:15:25] Loaded 46 read-only tools
[2026-09-06 10:15:26] Ready for MCP client connections
```

**Sensitive data is never logged:**
- ✗ Plex token
- ✗ Authorization headers
- ✗ Passwords
- ✗ Full media responses (only metadata queries)

## Troubleshooting

### MCP Server Won't Start

1. Check Node.js is installed: `node --version`
2. Verify Plex is running: `http://127.0.0.1:32400`
3. Check `.env` exists with `PLEX_TOKEN` set
4. View logs: `tail logs/mcp-server.log`

### Plex Not Reachable

1. Verify Plex server is running
2. Check port 32400 is listening: `netstat -an | findstr 32400`
3. Test directly: `http://127.0.0.1:32400/identity`
4. Verify firewall allows localhost:32400

### Invalid Token Error

1. Token may be expired — get a new one
2. Verify token format (alphanumeric string, ~30+ chars)
3. Run: `.\scripts\extract-token-interactive.ps1`
4. Update `.env` and restart

### Tools Not Available

1. Ensure MCP server is running: `.\scripts\status-mcp.ps1`
2. Check port 3002 is listening
3. Verify no errors in `logs/mcp-server.log`
4. Restart server: `.\scripts\start-mcp.ps1`

## Future Enhancements

### Phase 13: Semantic Search (Optional)
- Vector embeddings for movie descriptions
- Similarity-based recommendations
- "Find something like Arrival but different"

### Phase 14: Tautulli Integration
- Enhanced viewing analytics
- Per-user statistics
- Session history analysis
- Transcode behavior tracking

### Phase 15: Remote Access (Cloudflare Tunnel)
- Secure HTTPS endpoint
- OAuth/SAML authentication
- Rate limiting
- ChatGPT integration ready

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for extension points.

## Support

### Getting Help

- **Configuration:** See [docs/GET_AUTH_TOKEN.md](docs/GET_AUTH_TOKEN.md)
- **Architecture Questions:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Security Concerns:** See [docs/READ_ONLY_SECURITY.md](docs/READ_ONLY_SECURITY.md)
- **Setup Issues:** See [docs/VALIDATION.md](docs/VALIDATION.md)

### MCP Server Issues

The MCP server is based on [niavasha/plex-mcp-server](https://github.com/niavasha/plex-mcp-server):
- See upstream README for MCP-specific issues
- Check project issues for known problems
- Review MCP documentation at https://modelcontextprotocol.io/

## System Requirements

- **Windows:** 10 / 11
- **Plex Media Server:** Any recent version
- **Node.js:** 20.0.0+
- **Python:** 3.9+ (optional)
- **Docker:** For Tautulli (optional)
- **Network:** Plex must be accessible via HTTP

## Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Host Audit | ✓ Complete |
| 2 | Plex Token | ✓ Complete |
| 3 | API Validation | ✓ Complete |
| 4 | MCP Selection | ✓ Complete |
| 5 | Build & Install | ✓ Complete |
| 6 | Read-Only Enforcement | ✓ Complete |
| 7 | Local Configuration | ✓ Complete |
| 8 | Startup Scripts | ✓ Complete |
| 9 | Logging | ✓ Complete |
| 10 | Repository Structure | ✓ Complete |
| 11 | Data Model | ✓ Complete |
| 12 | Derived Queries | ✓ Complete |
| 13 | Semantic Search | ⏳ Future |
| 14 | Tautulli Integration | ✓ Running |
| 15 | Remote Access (Cloudflare) | ⏳ Next |
| 16 | ChatGPT Handoff | ⏳ Next |

## License

- **Plex MCP Server:** MIT (upstream: niavasha/plex-mcp-server)
- **This Bridge:** MIT
- **Tautulli:** GPLv3

See LICENSE files in each component for details.

## Quick Reference

### Common Commands

```powershell
# Start MCP server
.\scripts\start-mcp.ps1

# Check if it's running
.\scripts\status-mcp.ps1

# View recent logs
tail -f logs/mcp-server.log

# Start Tautulli analytics
.\scripts\start-tautulli.ps1

# Get your Plex token
.\scripts\extract-token-interactive.ps1
```

### Common URLs

```
Plex Server:      http://127.0.0.1:32400
MCP Server:       http://127.0.0.1:3002 (stdio protocol, not HTTP)
Tautulli:         http://127.0.0.1:8181
Plex Web UI:      http://127.0.0.1:32400/web
```

### File Locations

```
Configuration:    C:\plex-mcp\.env
Plex Server:      C:\Program Files\Plex\Plex Media Server
Plex Data:        C:\Users\[You]\AppData\Local\Plex Media Server
MCP Server:       C:\plex-mcp\src\plex-mcp-server
Logs:             C:\plex-mcp\logs\
Tautulli:         C:\plex-mcp\tautulli\
```

---

**Ready to bring AI intelligence to your personal media library.**

For questions or improvements, see the documentation in `docs/` or the upstream MCP server at https://github.com/niavasha/plex-mcp-server

**Last Updated:** 2026-09-06
