param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 3333
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $root "extension\server"
$env:MCP_REMOTE_HOST = $HostName
$env:MCP_REMOTE_PORT = [string]$Port

Push-Location $serverDir
try {
  node .\remote-http-bridge.js
} finally {
  Pop-Location
}
