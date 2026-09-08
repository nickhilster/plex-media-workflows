param(
  [int]$Port = 3333
)

$ErrorActionPreference = "Stop"
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  $installed = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
  if (Test-Path -LiteralPath $installed) {
    $cloudflared = [pscustomobject]@{ Source = $installed }
  }
}

if (-not $cloudflared) {
  throw "cloudflared is not installed. Install it with: winget install --id Cloudflare.cloudflared --source winget"
}

& $cloudflared.Source tunnel --url "http://127.0.0.1:$Port"
