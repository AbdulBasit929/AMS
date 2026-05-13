$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start-all.ps1"
$statusScript = Join-Path $PSScriptRoot "status-runtime.ps1"
$frontendUrl = "http://127.0.0.1:5173"
$backendHealthUrl = "http://127.0.0.1:4000/api/health"

if (-not (Test-Path $startScript)) {
  throw "start-all.ps1 was not found at $startScript"
}

& $startScript

Write-Host ""
Write-Host "Waiting for the frontend and backend to come online..." -ForegroundColor Cyan

$frontendReady = $false
$backendReady = $false

for ($i = 0; $i -lt 20; $i++) {
  try {
    Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    $frontendReady = $true
  } catch {
  }

  try {
    Invoke-WebRequest -Uri $backendHealthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    $backendReady = $true
  } catch {
  }

  if ($frontendReady -and $backendReady) {
    break
  }

  Start-Sleep -Seconds 1
}

Write-Host ""
& $statusScript
Write-Host ""

if ($frontendReady) {
  Write-Host "Opening the application in your default browser..." -ForegroundColor Green
  Start-Process $frontendUrl | Out-Null
} else {
  Write-Host "Frontend is still starting. Open $frontendUrl manually in a few seconds." -ForegroundColor Yellow
}

if (-not $backendReady) {
  Write-Host "Backend health endpoint is not ready yet. Check the backend window if the app page does not load fully." -ForegroundColor Yellow
}
