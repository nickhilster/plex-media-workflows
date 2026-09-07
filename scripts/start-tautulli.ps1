# Start Tautulli for Plex monitoring and analytics
# Requires Docker and Docker Compose

param(
  [string]$ProjectRoot = "C:\plex-mcp"
)

Write-Host "=== Starting Tautulli (Plex Analytics) ==="
Write-Host ""

# Check Docker availability
Write-Host "Checking Docker availability..."
try {
  $dockerVersion = docker --version 2>$null
  Write-Host "✓ Docker found: $dockerVersion"
} catch {
  Write-Host "✗ Docker is not installed or not in PATH"
  Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
  exit 1
}

# Check Docker daemon
try {
  docker ps -q > $null 2>&1
  Write-Host "✓ Docker daemon is running"
} catch {
  Write-Host "✗ Docker daemon is not running. Start Docker Desktop."
  exit 1
}

Write-Host ""
Write-Host "Starting Tautulli container..."

Push-Location $ProjectRoot

# Create data directories if they don't exist
$dirs = @("tautulli\config", "tautulli\logs")
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  Created directory: $dir"
  }
}

# Start container
docker-compose up -d tautulli

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✓ Tautulli started successfully!"
  Write-Host ""
  Write-Host "Access Tautulli at: http://127.0.0.1:8181"
  Write-Host ""
  Write-Host "Setup steps:"
  Write-Host "1. Open http://127.0.0.1:8181 in your browser"
  Write-Host "2. Complete the setup wizard"
  Write-Host "3. Connect to your Plex server (http://127.0.0.1:32400)"
  Write-Host "4. Provide your Plex token when prompted"
  Write-Host ""
  Write-Host "Initial setup typically takes 1-2 minutes."

  # Wait a bit then check if it's accessible
  Start-Sleep -Seconds 3

  try {
    $check = Invoke-WebRequest -Uri "http://127.0.0.1:8181" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Tautulli is already responding to web requests"
  } catch {
    Write-Host "! Tautulli is starting. It may take a moment to fully initialize."
  }
} else {
  Write-Host "✗ Failed to start Tautulli. Check Docker logs with:"
  Write-Host "  docker-compose logs tautulli"
}

Pop-Location
