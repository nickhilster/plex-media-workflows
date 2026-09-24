$ErrorActionPreference = 'Stop'

$composeDir = 'C:\plex-mcp'
$baseUrl = 'http://127.0.0.1:19850'
$log = Join-Path $env:TEMP 'nostalgia-tv-repair.log'

function Say($message) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $message" }

try {
    Start-Transcript -Path $log -Append | Out-Null
    Say 'Starting Docker Desktop if needed...'
    $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerDesktop) { Start-Process -FilePath $dockerDesktop -ErrorAction SilentlyContinue }

    Say 'Waiting for Docker...'
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try { docker info *> $null; if ($LASTEXITCODE -eq 0) { $ready = $true; break } } catch {}
        Start-Sleep -Seconds 2
    }
    if (-not $ready) { throw 'Docker did not become ready within 60 seconds.' }

    Say 'Starting the Nostalgia TV service...'
    Push-Location $composeDir
    docker compose up -d nostalgia
    if ($LASTEXITCODE -ne 0) { throw 'Docker could not start the Nostalgia TV service.' }
    Pop-Location

    Say 'Waiting for Nostalgia TV to come online...'
    $status = $null
    for ($i = 0; $i -lt 30; $i++) {
        try { $status = Invoke-RestMethod "$baseUrl/api/status" -TimeoutSec 3; if ($status.status -eq 'ok' -and $status.plexConnected) { break } } catch {}
        Start-Sleep -Seconds 2
    }
    if (-not $status -or $status.status -ne 'ok') { throw 'Nostalgia TV did not become ready.' }
    if (-not $status.plexConnected) { throw 'Nostalgia TV is online, but Plex is not connected.' }

    Say 'Refreshing the Plex library and channel schedule...'
    Invoke-RestMethod -Method Post "$baseUrl/api/schedule/refresh-library" -TimeoutSec 120 | Out-Null

    Say 'Waiting for the schedule to finish...'
    for ($i = 0; $i -lt 60; $i++) {
        $schedule = Invoke-RestMethod "$baseUrl/api/schedule/status" -TimeoutSec 5
        if (-not $schedule.scheduler.running -and $schedule.totalPrograms -gt 0) { break }
        Start-Sleep -Seconds 2
    }

    $m3u = Invoke-WebRequest "$baseUrl/channels.m3u" -TimeoutSec 20
    $xmltv = Invoke-WebRequest "$baseUrl/xmltv.xml" -TimeoutSec 20
    if ($m3u.StatusCode -ne 200 -or $xmltv.StatusCode -ne 200) { throw 'The M3U or XMLTV endpoint did not respond successfully.' }

    Say "Ready. Plex connected: $($status.plexConnected); content: $($status.contentCount); schedule programmes: $($schedule.totalPrograms)"
    Say 'TiviMate URLs:'
    Say '  http://192.168.1.103:19850/channels.m3u'
    Say '  http://192.168.1.103:19850/xmltv.xml'
    Say "Log saved to $log"
} catch {
    Write-Host "`nREPAIR FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Log: $log"
    exit 1
} finally {
    try { Stop-Transcript | Out-Null } catch {}
}

Read-Host 'Press Enter to close'
