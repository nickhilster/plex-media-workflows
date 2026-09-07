# Build/refresh the Claude Desktop Extension package
# Copies the compiled MCP server + installs production dependencies
# into extension/server/, so the extension folder is self-contained
# and ready for "Install unpacked extension" in Claude Desktop.

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "src\plex-mcp-server"
$dest = Join-Path $root "extension\server"

Write-Host "=== Building Plex MCP Claude Desktop Extension ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "$source\build\plex-mcp-server.js")) {
  Write-Host "Source server not built. Building it first..."
  Push-Location $source
  npm install
  npm run build
  Pop-Location
}

Write-Host "Copying build output..."
Copy-Item -Path "$source\build" -Destination "$dest\build" -Recurse -Force

Write-Host "Copying package.json..."
Copy-Item -Path "$source\package.json" -Destination "$dest\package.json" -Force
if (Test-Path "$source\package-lock.json") {
  Copy-Item -Path "$source\package-lock.json" -Destination "$dest\package-lock.json" -Force
}

Write-Host "Installing production dependencies into extension package..."
Push-Location $dest
npm install --omit=dev
Pop-Location

$size = (Get-ChildItem $dest -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "✓ Extension package ready at: $dest" -ForegroundColor Green
Write-Host "  Total size: $([math]::Round($size, 1)) MB"
Write-Host ""
Write-Host "Install it via Claude Desktop: Settings -> Extensions -> Install unpacked extension"
Write-Host "Point it at: $root\extension"
