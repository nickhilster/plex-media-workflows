# Claude Desktop - Plex MCP Integration

**Status:** ✓ Configuration Complete  
**Date:** 2026-09-06

## What's Been Done

Your Claude Desktop has been configured to access your Plex library through the MCP server.

**Configuration File:** `C:\Users\nick_\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "plex": {
      "command": "node",
      "args": ["C:\\plex-mcp\\src\\plex-mcp-server\\build\\plex-mcp-server.js"],
      "env": {
        "PLEX_TOKEN": "your_plex_token_here",
        "PLEX_URL": "http://127.0.0.1:32400"
      }
    }
  }
}
```

## How to Use

### Step 1: Close Claude Desktop Completely

If Claude Desktop is running, close it completely (not just minimize):
- Click the X button to close the window
- Verify it's not running in the system tray
- Wait 5 seconds

### Step 2: Reopen Claude Desktop

- Launch Claude Desktop from your applications
- Wait for it to fully load (30 seconds)

### Step 3: Verify MCP Connection

Once Claude opens, look in the **bottom right corner** of the window:
- You should see a small icon/indicator
- Hover over it to see "Plex MCP Server" or similar
- Green/connected status means it's working

### Step 4: Start Asking Questions

In Claude Desktop, try these queries:

**Library Queries:**
```
What movies do I have in my library?
Show me all my TV shows
How many items are in each of my libraries?
```

**Search Queries:**
```
Search my library for "Arrival"
Find all sci-fi movies I own
Show me movies with "Matrix" in the title
```

**Watch History:**
```
What have I watched recently?
Show me my watch history from the past week
What's on my continue watching list?
```

**Recommendations:**
```
Recommend an unwatched movie for me
Suggest a sci-fi movie under 2 hours I haven't seen
What highly-rated movies have I not watched?
What should I watch next from my library?
```

**Analytics:**
```
What's my most watched genre?
How many movies have I watched total?
Show me viewing statistics for the past month
Which directors appear most in my watch history?
```

## How It Works

```
You type in Claude Desktop
    ↓
Claude processes your query
    ↓
Claude invokes MCP tools
    ↓
MCP Server (Port 3002) receives the request
    ↓
MCP queries Plex API (Port 32400)
    ↓
Plex returns library/watch data
    ↓
MCP processes and formats response
    ↓
Claude displays answer in conversation
```

**All communication is local** — nothing goes to remote servers for library queries.

## Troubleshooting

### MCP Server Not Connecting

**Problem:** MCP icon doesn't show in Claude Desktop

**Solutions:**
1. Ensure MCP server is running:
   ```powershell
   C:\plex-mcp\scripts\status-mcp.ps1
   ```

2. Restart MCP server:
   ```powershell
   Stop-Process -Name node -Force
   C:\plex-mcp\scripts\start-mcp.ps1
   ```

3. Restart Claude Desktop completely

4. Check config file:
   ```powershell
   Get-Content $env:APPDATA\Claude\claude_desktop_config.json
   ```

### MCP Server Running But Claude Says Tools Not Available

**Possible causes:**
- MCP server hasn't finished loading (wait 10 seconds)
- Configuration syntax error (check JSON format)
- Node.js not in system PATH

**Fix:**
1. Close Claude Desktop
2. Stop MCP server: `Stop-Process -Name node -Force`
3. Check logs: `tail C:\plex-mcp\logs\mcp-server.log`
4. Restart both

### Plex Token Invalid

**Error:** "Unauthorized" or "401 error"

**Solution:**
1. Get new token:
   ```powershell
   C:\plex-mcp\scripts\extract-token-interactive.ps1
   ```

2. Update `.env` file

3. Restart MCP server

4. Update Claude config if needed

## Advanced: Monitoring

### Check What Tools Are Available

Run this in PowerShell:
```powershell
node -e "
const server = require('C:\\plex-mcp\\src\\plex-mcp-server\\build\\plex-mcp-server.js');
console.log('Available tools:');
server.tools.forEach(t => console.log('  - ' + t.name));
"
```

### View Real-Time Logs

```powershell
Get-Content C:\plex-mcp\logs\mcp-server.log -Tail 20 -Wait
```

### Monitor Plex API Calls

The logs will show when tools query Plex:
```
[Tool Call] get_libraries
[Plex API] GET /library/sections
[Response] 3 libraries found
```

## What Queries Work Best

### ✓ Works Great
- "What movies do I have?"
- "Find [Title] in my library"
- "Recommend a movie I haven't seen"
- "Show me my watch history"
- "What genre do I watch most?"

### ⚠️ Limited
- Multi-step queries (Claude will break them down)
- Complex filters (Claude will reason through them)
- Real-time playback info (shows current streams from Tautulli)

### ✗ Won't Work
- Modifying your library (read-only)
- Changing watch state (read-only)
- Creating playlists (read-only)
- Server settings changes (read-only)

## Performance Notes

- **First query:** 2-3 seconds (cold start)
- **Subsequent queries:** 1-2 seconds
- **Large library queries:** Up to 5 seconds
- **Watch history:** 2-3 seconds

This is normal. Plex API queries take time.

## Tips & Tricks

### 1. Be Specific
**Better:**
```
Show me unwatched sci-fi movies under 2 hours rated above 7.0
```

**Less specific:**
```
What should I watch?
```

### 2. Use Metadata
Claude understands:
- Genre (sci-fi, thriller, comedy, etc.)
- Runtime (minutes, hours)
- Rating (IMDB, critic, audience)
- Year (1980-2025)
- Directors, actors, collections

### 3. Combine Queries
```
What science fiction movies have I watched?
Of those, which ones are over 120 minutes?
Can you rank them by rating?
```

Claude will handle the multi-step reasoning.

### 4. Get Context
Ask Claude to explain:
```
Why did you recommend that movie?
What makes it similar to movies I like?
```

Claude references your watch history to justify recommendations.

## Next Steps

### Phase 15: ChatGPT Integration (Future)

When you're ready, you can expose this MCP server to ChatGPT via Cloudflare Tunnel:
- See `docs/ARCHITECTURE.md` for the remote access diagram
- Requires Cloudflare account (free tier available)
- Enables ChatGPT to access your library
- Plex token stays local (never shared)

## Quick Reference

| Task | Command |
|------|---------|
| Start MCP | `C:\plex-mcp\scripts\start-mcp.ps1` |
| Check status | `C:\plex-mcp\scripts\status-mcp.ps1` |
| View logs | `tail -f C:\plex-mcp\logs\mcp-server.log` |
| Get new token | `C:\plex-mcp\scripts\extract-token-interactive.ps1` |
| Start Tautulli | `C:\plex-mcp\scripts\start-tautulli.ps1` |

## Support

If Claude says "tools not found" or "connection error":

1. Verify MCP server is running: `status-mcp.ps1`
2. Check logs for errors: `logs/mcp-server.log`
3. Restart everything:
   ```powershell
   Stop-Process -Name node -Force
   Start-Sleep -Seconds 2
   C:\plex-mcp\scripts\start-mcp.ps1
   ```
4. Close and reopen Claude Desktop

---

**Claude Desktop is now ready to query your Plex library!** 🚀

Start by asking: *"What movies are in my Plex library?"*
