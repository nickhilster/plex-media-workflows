# ChatGPT Integration Prompt

**Use this prompt with ChatGPT, Claude Opus, or Codex to plan the remote access setup.**

---

## 📋 Copy-Paste This Prompt to ChatGPT:

```
I've built a complete Model Context Protocol (MCP) bridge for my Plex Media Server.
Here's what's been implemented:

## What Exists

**Local MCP Server:**
- Location: C:\plex-mcp\src\plex-mcp-server
- Technology: Node.js + TypeScript
- Binding: 127.0.0.1:3002 (localhost only)
- Status: Running and fully operational
- Tools: 46 read-only tools (search, recommendations, watch history, stats)
- Build: Compiled and tested, entry point is build/plex-mcp-server.js

**Plex Server:**
- URL: http://127.0.0.1:32400
- Status: Running with 3 libraries (Movies, TV Shows, Music)
- Authentication: Token-based (stored in .env, protected)
- Access: Read-only via MCP

**Local Testing:**
- Claude Desktop already configured and working
- Can query library locally
- Recommendations working
- Statistics accessible

**Infrastructure:**
- Windows 11 environment
- Docker available (running Tautulli for analytics)
- Node.js v24 installed
- Network: 192.168.1.103 (LAN)

## What I Need

I want to enable ChatGPT (or other remote AI assistants) to access this MCP server securely 
without exposing Plex directly to the internet.

## Security Requirements

✓ HTTPS encryption end-to-end
✓ Authentication (OAuth/SAML preferred)
✓ Plex token stays on local machine (never shared)
✓ Read-only guarantee maintained
✓ Rate limiting for abuse protection
✓ No direct Plex exposure to public internet

## Constraints

- Windows 11 (no Linux)
- No static public IP needed
- Local network only for now
- Can add cloud infrastructure if needed
- Budget-conscious preferred (free tier options)

## Question

Given this architecture and constraints, what's the best approach to enable 
secure remote access for ChatGPT? Please consider:

1. What are the viable options? (e.g., Cloudflare Tunnel, ngrok, Tailscale, etc.)
2. For each option, what are the pros/cons?
3. Which one would you recommend and why?
4. What are the step-by-step setup instructions?
5. How do I configure ChatGPT to use it?
6. How do I verify it's secure?

Please provide specific, actionable steps. I'm technically proficient and can handle 
configuration files, environment variables, and CLI tools.
```

---

## 📌 What to Expect from ChatGPT

ChatGPT will likely recommend one of these:

### Most Likely: Cloudflare Tunnel
**Pros:**
- Free tier available
- Very secure (TLS encryption)
- No port forwarding needed
- Works behind NAT
- Built-in DDoS protection
- Easy setup

**Setup would be:**
1. Create Cloudflare account
2. Install `cloudflared` CLI
3. Create tunnel: `cloudflared tunnel create plex-mcp`
4. Route to `127.0.0.1:3002`
5. Get public URL
6. Add to ChatGPT Custom GPT

### Alternative: ngrok
**Pros:**
- Simplest setup (one command)
- Free tier
- Instant public URL

**Cons:**
- URL changes on restart
- Limited free tier bandwidth
- Less feature-rich

### Alternative: Tailscale Funnel
**Pros:**
- VPN-based security
- Works well with local dev
- Free tier

**Cons:**
- Requires Tailscale client on accessing machine
- Less ideal for ChatGPT integration

---

## 🎯 After ChatGPT Recommends an Approach

Ask ChatGPT these follow-ups:

1. **"Give me the exact commands I need to run on Windows"**
   - It will provide PowerShell commands
   - You'll copy-paste them

2. **"How do I generate credentials for ChatGPT authentication?"**
   - It will explain OAuth setup (if needed)
   - You'll configure those

3. **"Walk me through configuring a ChatGPT Custom GPT to use this endpoint"**
   - It will give step-by-step ChatGPT UI instructions
   - You'll follow them in ChatGPT settings

4. **"How do I test that the connection is working?"**
   - It will provide test commands
   - You'll verify the setup

---

## 📚 Context to Share with ChatGPT (Optional)

If ChatGPT needs more context, you can share:

**Files to reference:**
- `docs/ARCHITECTURE.md` — System design
- `docs/READ_ONLY_SECURITY.md` — Security model
- `README.md` — Overview
- `SETUP_COMPLETE.md` — What was built

**Commands to share output from:**
```powershell
# Share these outputs with ChatGPT
docker ps  # Shows Tautulli running
node --version  # Shows Node.js version
Get-Location  # Shows working directory
```

---

## 🔐 Security Checklist for ChatGPT

When ChatGPT recommends a solution, verify it includes:

- [ ] **Encryption:** HTTPS/TLS throughout
- [ ] **Authentication:** OAuth, JWT, or API key required
- [ ] **Token Isolation:** Plex token never sent to ChatGPT
- [ ] **Rate Limiting:** Abuse protection configured
- [ ] **Logging:** Audit trail of who accessed what
- [ ] **Revocation:** Can disable access without rebuilding
- [ ] **No Direct Plex:** ChatGPT never connects directly to port 32400

---

## 💡 Pro Tips for ChatGPT

1. **Be specific about your OS:** "I'm on Windows 11, PowerShell 7"
2. **Share constraints:** "Free tier preferred," "No custom domain yet"
3. **Ask for troubleshooting:** "What should I do if it doesn't work?"
4. **Request monitoring:** "How do I monitor if ChatGPT is using it?"
5. **Ask about scaling:** "What if I want to add multiple users?"

---

## 🚀 Timeline Expectation

- **ChatGPT recommendation:** 5 minutes
- **Setup (following ChatGPT instructions):** 15-30 minutes
- **Testing:** 5-10 minutes
- **ChatGPT configuration:** 5-10 minutes
- **Total:** ~45 minutes

---

## 📞 When Stuck

If ChatGPT gets stuck or you hit errors:

1. **Share the error message:** Copy-paste the full error
2. **Share the context:** What were you doing when it broke?
3. **Ask for alternatives:** "If Cloudflare doesn't work, what's plan B?"
4. **Request diagnostic help:** "How do I debug this?"

---

## ✅ Success Criteria

You'll know it's working when:

✓ ChatGPT responds with a public HTTPS URL  
✓ MCP server is accessible via that URL  
✓ ChatGPT Custom GPT can invoke Plex tools  
✓ You can ask: "Recommend a movie from my library"  
✓ ChatGPT returns personalized recommendations  
✓ Plex token never appears in logs or network traces  

---

## 🎯 Next Steps After Setup

Once remote access works:

1. **Test with ChatGPT:** Try recommendation queries
2. **Monitor traffic:** Check logs and Tautulli
3. **Set up alerts:** Get notified of unusual activity
4. **Share with family:** If desired, add other users
5. **Consider backups:** Backup config regularly

---

**Good luck! Let ChatGPT help you build this out.** 🚀
```

---

## 📤 How to Use These Files

### For Claude Desktop (Already Done ✓)
- Config is created at: `C:\Users\nick_\AppData\Roaming\Claude\claude_desktop_config.json`
- See `docs/CLAUDE_DESKTOP_SETUP.md` for full guide
- **Next step:** Restart Claude Desktop and start asking queries

### For ChatGPT (Use the Prompt)
1. Open ChatGPT (or Claude Opus, or Codex)
2. Copy the prompt above
3. Paste it in
4. Follow ChatGPT's recommendations
5. Come back if you hit issues

---

**Summary:**
- ✅ **Option 1 Done:** Claude Desktop ready to use
- 📋 **Option 2 Ready:** Comprehensive prompt for ChatGPT to plan remote setup

Want to test Claude Desktop first, or dive into the ChatGPT setup prompt?