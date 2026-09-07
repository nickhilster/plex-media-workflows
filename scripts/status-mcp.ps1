# Check Plex MCP Server Status
# Tests connectivity to Plex and checks if MCP server is running

param(
  [string]$ProjectRoot = "C:\plex-mcp",
  [string]$PlexUrl = "http://127.0.0.1:32400",
  [string]$McpPort = "3002"
)

Write-Host "=== Plex MCP Server Status ==="
Write-Host ""

$envFile = "$projectRoot\.env"

# Load .env to get actual values
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*PLEX_URL=(.*)$') {
      $PlexUrl = $Matches[1].Trim()
    }
    if ($_ -match '^\s*MCP_PORT=(.*)$') {
      $McpPort = $Matches[1].Trim()
    }
  }
}

# Test 1: Plex Connectivity
Write-Host "1. Plex Server Status:"
try {
  $response = Invoke-WebRequest -Uri "$PlexUrl/identity" -TimeoutSec 3 -ErrorAction Stop
  Write-Host "   ✓ Plex is reachable at $PlexUrl"
} catch {
  Write-Host "   ✗ Plex is NOT reachable at $PlexUrl"
  Write-Host "     Error: $($_.Exception.Message)"
}

# Test 2: Check for node processes
Write-Host ""
Write-Host "2. MCP Server Process:"
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($nodeProcess) {
  Write-Host "   ✓ Node.js process found:"
  $nodeProcess | ForEach-Object {
    Write-Host "     PID: $($_.Id), Memory: $([math]::Round($_.WorkingSet / 1MB))MB"
  }
} else {
  Write-Host "   ✗ No Node.js processes running"
}

# Test 3: Port status
Write-Host ""
Write-Host "3. MCP Server Port Status:"
$portCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port $McpPort -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
  Write-Host "   ✓ Port $McpPort is listening"
} else {
  Write-Host "   ! Port $McpPort is not listening (server may be starting or stopped)"
}

# Test 4: Log file status
Write-Host ""
Write-Host "4. Recent Log Activity:"
$logFile = "$projectRoot\logs\mcp-server.log"
if (Test-Path $logFile) {
  $recentLines = Get-Content $logFile -Tail 5 -ErrorAction SilentlyContinue
  if ($recentLines) {
    Write-Host "   ✓ Log file found"
    Write-Host "   Last 5 lines:"
    $recentLines | ForEach-Object { Write-Host "     $_" }
  }
} else {
  Write-Host "   ! Log file not found yet"
}

Write-Host ""
Write-Host "Summary:"
if ($portCheck.TcpTestSucceeded) {
  Write-Host "✓ MCP Server appears to be running"
} else {
  Write-Host "✗ MCP Server is not running. Start it with: .\scripts\start-mcp.ps1"
}
