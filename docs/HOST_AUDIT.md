# Host Audit Report

**Generated:** 2026-09-06  
**System:** Windows 11 (Build 10.0.26200)

## System Information

| Property | Value |
|----------|-------|
| OS | Windows 11 Home |
| Build | 10.0.26200 |
| PowerShell | 7.6.5 |

## Runtime Environments

| Runtime | Version | Status |
|---------|---------|--------|
| Node.js | v24.19.0 | ✓ Installed |
| Python | 3.13.15 | ✓ Installed |
| Git | 2.55.0 | ✓ Installed |
| uv | 0.12.5 | ✓ Installed |
| Docker | 29.6.1 | ✓ Installed |
| Docker Compose | v5.1.4 | ✓ Installed |

## Plex Media Server

| Property | Value |
|----------|-------|
| Installation Path | C:\Program Files\Plex\Plex Media Server |
| Data Directory | C:\Users\nick_\AppData\Local\Plex Media Server |
| Server URL | http://127.0.0.1:32400 |
| Plex Version | 1.43.3.10896-cb3ebc72d |
| API Version | 1.2.2 |
| Server Status | ✓ Running and accessible |
| Authentication | ✓ Valid Plex token configured |

## Plex Libraries

| Library | Type | Locations |
|---------|------|-----------|
| Movies | movie | O:\MEDIA\MOVIES, P:\MEDIA\MOVIES, D:\TORRENTS |
| TV Shows | show | O:\MEDIA\TV, P:\MEDIA\TV, D:\TORRENTS |
| Music | artist | O:\HQ MUSIC (hidden) |

**Total Libraries:** 3

## Network Configuration

| Item | Value |
|------|-------|
| Local IP | 192.168.1.103 |
| Plex Port | 32400 |
| MCP Service Port | 3002 |
| Tautulli Port | 8181 |
| DNS Resolution | Configured |

## Port Status

| Port | Service | Status |
|------|---------|--------|
| 32400 | Plex Media Server | ✓ Listening (IPv4 & IPv6) |
| 3002 | MCP Bridge | ✓ Available |
| 8181 | Tautulli | ✓ Available |

## Storage

| Location | Type | Status |
|----------|------|--------|
| O:\MEDIA | Network Drive | ✓ Accessible |
| P:\MEDIA | Network Drive | ✓ Accessible |
| D:\TORRENTS | Local Drive | ✓ Accessible |
| C:\plex-mcp | Project Directory | ✓ Created |

## Key Capabilities

- ✓ Local Plex API access via token
- ✓ Read-only library operations
- ✓ Watch history and statistics
- ✓ Node.js MCP server deployment
- ✓ Docker-based Tautulli analytics
- ✓ Remote exposure via Cloudflare (future)

## Security Notes

- Plex token stored securely in `.env` (gitignored)
- MCP service bound to 127.0.0.1 (local-only for now)
- No destructive operations enabled by default
- All credentials in environment variables

## Recommendations

1. **Backup Configuration:** Regularly backup `.env` and Tautulli config
2. **Token Security:** Rotate Plex token if shared or compromised
3. **Remote Access:** Set up Cloudflare Tunnel for secure ChatGPT integration
4. **Monitoring:** Use Tautulli for ongoing viewing analytics
5. **Updates:** Keep Plex, Docker, and Node.js updated

---

**System ready for Plex MCP Bridge deployment.**
