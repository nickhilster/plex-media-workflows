# How to Get Your Plex Authentication Token

Your Plex token is a unique identifier that allows the MCP bridge to access your Plex library API.

## Method 1: From Plex Web Settings (Recommended)

1. Open your browser and go to: **http://127.0.0.1:32400/web/index.html**
2. Log in if prompted
3. Click your **profile icon** (top right corner)
4. Select **Settings**
5. Go to **Account** (left sidebar)
6. Scroll down to find your **Authentication Token** section
7. Copy the token - it's a long alphanumeric string

## Method 2: From Plex.tv Web UI

1. Visit **https://www.plex.tv/claim** in a browser
2. Log in with your Plex account
3. Look for "Server" or "Claim" information
4. The token may appear in:
   - The URL (after `/claim/`)
   - A text field labeled "Token" or "Auth Token"
   - Your account settings

## Method 3: From Browser DevTools (Advanced)

1. Open **http://127.0.0.1:32400/web** in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Network** tab
4. Reload the page
5. Look for API requests to Plex
6. Check the **Request Headers** for `X-Plex-Token: <YOUR_TOKEN>`
7. Or check **Application** → **Local Storage** for keys containing "auth" or "token"

## Method 4: Query Plex API Directly

Once you have identified your token, verify it works by running:

```powershell
$token = "your_token_here"
$headers = @{ "X-Plex-Token" = $token }
$response = Invoke-WebRequest `
  -Uri "http://127.0.0.1:32400/identity" `
  -Headers $headers

if ($response.StatusCode -eq 200) {
  Write-Host "✓ Token is valid!"
  Write-Host $response.Content
}
```

## Storing Your Token Safely

Once you have your token:

1. Create a `.env` file in the project root:
   ```
   PLEX_TOKEN=your_actual_token_here
   PLEX_URL=http://127.0.0.1:32400
   MCP_PORT=3002
   ```

2. **Never** commit the `.env` file to git (it's in `.gitignore`)
3. The `.env.example` file shows the format without secrets

## Security Notes

- Your Plex token is like a password - treat it as sensitive
- Store it only in `.env` (local machine)
- Do not share it or put it in version control
- Never log or display it in output
- If compromised, regenerate it in Plex settings

## Troubleshooting

**"Token not found" or "401 Unauthorized":**
- Verify you copied the entire token (no spaces)
- Check that Plex is running (should see connections on port 32400)
- Try the token in browser: `http://127.0.0.1:32400/identity?X-Plex-Token=YOUR_TOKEN`
- If that redirects to login, the token is invalid - get a new one

**Plex web UI not accessible at http://127.0.0.1:32400:**
- Verify Plex is running
- Check Windows Firewall allows port 32400
- Try `telnet 127.0.0.1 32400` to test connectivity
