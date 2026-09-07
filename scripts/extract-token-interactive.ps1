# Interactive Plex Token Extraction Helper

Write-Host "================================"
Write-Host "Plex Token Extraction Assistant"
Write-Host "================================"
Write-Host ""

# Check if Plex is reachable
Write-Host "Step 1: Verifying Plex is running..."
try {
  $plexCheck = Invoke-WebRequest -Uri "http://127.0.0.1:32400" -TimeoutSec 2 -ErrorAction Stop
  Write-Host "✓ Plex is accessible at http://127.0.0.1:32400"
} catch {
  Write-Host "✗ Cannot reach Plex. Make sure it's running on port 32400"
  Write-Host ""
  Write-Host "If Plex isn't running, start it from:"
  Write-Host "  Start Menu > Plex Media Server"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "Step 2: Getting your Plex token"
Write-Host ""
Write-Host "EASIEST METHOD (recommended):"
Write-Host "1. Open this URL in your browser:"
Write-Host "   http://127.0.0.1:32400/web/index.html"
Write-Host ""
Write-Host "2. Once logged in, open your browser's Developer Tools (F12)"
Write-Host "3. Go to the Console tab and paste this:"
Write-Host ""
Write-Host "   // This will show your token in the console"
Write-Host "   localStorage.getItem('auth.token')"
Write-Host "   // or try"
Write-Host "   localStorage"
Write-Host ""
Write-Host "4. Copy the token value (long alphanumeric string)"
Write-Host ""

Write-Host "ALTERNATIVE: Visit https://www.plex.tv/claim"
Write-Host "(Your token appears in the URL after successful login)"
Write-Host ""

$token = Read-Host "Enter your Plex token"

if (-not $token) {
  Write-Host "✗ No token provided. Cannot continue."
  exit 1
}

Write-Host ""
Write-Host "Step 3: Validating token..."

$headers = @{
  "X-Plex-Token" = $token
  "Accept" = "application/json"
}

try {
  $response = Invoke-WebRequest `
    -Uri "http://127.0.0.1:32400/identity" `
    -Headers $headers `
    -TimeoutSec 5 `
    -ErrorAction Stop

  $content = $response.Content | ConvertFrom-Json

  Write-Host "✓ Token is VALID!"
  Write-Host ""
  Write-Host "Server Information:"
  $content | Select-Object name, machineIdentifier, version | Format-List

  Write-Host ""
  Write-Host "Step 4: Saving token to .env file..."

  $projectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
  $envFile = Join-Path $projectRoot ".env"

  # Create .env with the token
  @"
PLEX_TOKEN=$token
PLEX_URL=http://127.0.0.1:32400
MCP_HOST=127.0.0.1
MCP_PORT=3002
"@ | Set-Content -Path $envFile -Encoding UTF8

  Write-Host "✓ Token saved to .env"
  Write-Host ""
  Write-Host "File location: $envFile"
  Write-Host ""
  Write-Host "✓ Setup can now proceed!"

} catch {
  Write-Host "✗ Token validation failed!"
  Write-Host "Error: $($_.Exception.Message)"
  Write-Host ""
  Write-Host "The token may be:"
  Write-Host "  - Incorrect or incomplete"
  Write-Host "  - Expired (regenerate in Plex settings)"
  Write-Host "  - For a different Plex server"
  Write-Host ""
  Write-Host "Try again with the correct token."
  exit 1
}
