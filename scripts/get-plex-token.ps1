# Get Plex Token Helper Script
# This script helps retrieve your Plex authentication token for local API access

param(
  [string]$PlexUrl = "http://127.0.0.1:32400"
)

Write-Host "=== Plex Token Retrieval ==="
Write-Host ""
Write-Host "To configure the MCP bridge, you need your Plex authentication token."
Write-Host ""
Write-Host "Option 1: Get token from Plex Web UI"
Write-Host "1. Open Plex Web UI in browser: http://127.0.0.1:32400/web"
Write-Host "2. Log in if needed"
Write-Host "3. Click your account icon (top-right) -> Settings"
Write-Host "4. Click 'Remote Access' in the left menu"
Write-Host "5. Scroll down and look for 'Claim Server' section"
Write-Host "6. Visit https://www.plex.tv/claim and sign in"
Write-Host "7. Your auth token appears in the URL as 'claim/...' - copy the token"
Write-Host ""
Write-Host "Option 2: Get token from browser DevTools"
Write-Host "1. Open http://127.0.0.1:32400/web in your browser"
Write-Host "2. Press F12 to open DevTools"
Write-Host "3. Go to Application/Storage -> Local Storage"
Write-Host "4. Look for 'auth.token' or check Network requests for API calls with X-Plex-Token header"
Write-Host ""
Write-Host "Option 3: Query Plex API (requires existing auth)"
Write-Host "If you already know your token, validate it:"
$token = Read-Host "Enter your Plex token (leave blank to skip)"

if ($token) {
  try {
    $headers = @{ "X-Plex-Token" = $token }
    $response = Invoke-WebRequest -Uri "$PlexUrl/identity" `
      -Headers $headers `
      -TimeoutSec 5 `
      -ErrorAction Stop

    Write-Host "✓ Token is valid!"
    Write-Host "Response: $($response.Content)"
  } catch {
    Write-Host "✗ Token validation failed: $_"
  }
}

Write-Host ""
Write-Host "Once you have your token, add it to .env:"
Write-Host "  PLEX_TOKEN=your_token_here"
