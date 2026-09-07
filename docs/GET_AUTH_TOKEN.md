# Getting Your Plex Account Authentication Token

The claim token (claim-xxxx) has limited permissions. For full library access, we need your personal Plex account authentication token.

## Quick Method (Recommended)

1. **Open Plex Web UI:**
   ```
   http://127.0.0.1:32400/web/index.html
   ```

2. **Open Developer Tools (F12) and go to Console**

3. **Run this command:**
   ```javascript
   localStorage.getItem('auth.token')
   ```
   
   You should see a long alphanumeric string. Copy it.

4. **Alternative command if above doesn't work:**
   ```javascript
   JSON.stringify(localStorage)
   ```
   
   Look for keys containing 'auth', 'token', or 'authentication'. The actual token is typically 32+ characters.

## Method 2: From Plex Account Settings

1. Visit **https://www.plex.tv** and log in
2. Go to **Account Settings** (top right menu)
3. Click on **Remote Access** in left sidebar
4. Look for "Server" section - your token may be displayed there
5. If not visible, check **Connected Applications** or **Devices**

## Method 3: From Network Requests

1. Open http://127.0.0.1:32400/web/index.html
2. Open DevTools → Network tab
3. Make a request (e.g., navigate to Libraries)
4. Check any request headers for `X-Plex-Token` header value
5. That's your authentication token

## What You're Looking For

**Correct format:**
- Usually 20-32+ characters
- Alphanumeric (letters and numbers only)
- Example: `abc123def456ghi789jkl012mno345pqr`

**Wrong format:**
- `claim-xxxxx` (server claim token) ❌
- `https://plex.tv/claim/...` (claim URL) ❌

## Verify It Works

Once you have the token, test it:

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{ "X-Plex-Token" = $token }
$response = Invoke-WebRequest -Uri "http://127.0.0.1:32400/library/sections" -Headers $headers
```

If successful, you'll see XML data with your libraries.
