# Start Plex MCP Server
# Loads environment from .env file and starts the Node.js server

param(
  [string]$ProjectRoot = "C:\plex-mcp",
  [bool]$Verbose = $false
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = $ProjectRoot
$mcpDir = "$projectRoot\src\plex-mcp-server"
$envFile = "$projectRoot\.env"
$logFile = "$projectRoot\logs\mcp-server.log"

Write-Host "=== Starting Plex MCP Server ==="
Write-Host ""

# Check if .env exists
if (-not (Test-Path $envFile)) {
  Write-Host "✗ Error: .env file not found at $envFile"
  Write-Host "Please run setup first and add your Plex token to .env"
  exit 1
}

# Load environment variables from .env
Write-Host "Loading environment from .env..."
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^=]+)=(.*)$') {
    $key = $Matches[1].Trim()
    $value = $Matches[2].Trim()
    [Environment]::SetEnvironmentVariable($key, $value, "Process")
    if ($Verbose) { Write-Host "  Set: $key" }
  }
}

# Verify required environment variables
$requiredVars = @("PLEX_TOKEN", "PLEX_URL")
foreach ($var in $requiredVars) {
  $val = [Environment]::GetEnvironmentVariable($var, "Process")
  if ([string]::IsNullOrEmpty($val)) {
    Write-Host "✗ Missing required environment variable: $var"
    exit 1
  }
}

Write-Host "✓ Environment loaded"
Write-Host "✓ PLEX_URL: $([Environment]::GetEnvironmentVariable('PLEX_URL', 'Process'))"
Write-Host "✓ PLEX_TOKEN: configured"
Write-Host ""

# Check if build exists
if (-not (Test-Path "$mcpDir\build\plex-mcp-server.js")) {
  Write-Host "✗ MCP server not built. Run 'npm install && npm run build' in $mcpDir"
  exit 1
}

# Create logs directory if needed
$logsDir = Split-Path -Parent $logFile
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host "Starting MCP server..."
Write-Host "Log file: $logFile"
Write-Host ""

# Start the server
Push-Location $mcpDir

$startTime = Get-Date
Write-Host "Server started at: $startTime" | Tee-Object -FilePath $logFile -Append

# Run the server with output to log file and console
& node build\plex-mcp-server.js 2>&1 | Tee-Object -FilePath $logFile -Append

$endTime = Get-Date
Write-Host "Server stopped at: $endTime" | Tee-Object -FilePath $logFile -Append

Pop-Location
