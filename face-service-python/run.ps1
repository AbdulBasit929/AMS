$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$depsPath = Join-Path $root ".pydeps312"
$healthUrl = "http://127.0.0.1:5000/health"
$logPath = Join-Path $root "face-service.log"
$errLogPath = Join-Path $root "face-service.err.log"
$pythonExe = Join-Path $env:LocalAppData "Programs\Python\Python312\python.exe"

if (-not (Test-Path $depsPath)) {
  Write-Host "Python 3.12 face-service dependencies are missing." -ForegroundColor Yellow
  Write-Host "Run .\setup-python312.ps1 first." -ForegroundColor Yellow
  exit 1
}

$env:PYTHONPATH = if ($env:PYTHONPATH) { "$depsPath;$env:PYTHONPATH" } else { $depsPath }

try {
  $health = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 2
  if ($health.status -eq "ok") {
    Write-Host "Face service is already running." -ForegroundColor Green
    Write-Host "Health: $healthUrl" -ForegroundColor Cyan
    exit 0
  }
} catch {
}

Write-Host "Starting Logitech webcam face service on http://127.0.0.1:5000" -ForegroundColor Cyan
$servePath = Join-Path $root "serve.py"
if (-not (Test-Path $pythonExe)) {
  Write-Host "Python 3.12 executable not found at $pythonExe" -ForegroundColor Red
  exit 1
}
if (Test-Path $logPath) {
  Remove-Item -LiteralPath $logPath -Force
}
if (Test-Path $errLogPath) {
  Remove-Item -LiteralPath $errLogPath -Force
}
$proc = Start-Process `
  -FilePath $pythonExe `
  -ArgumentList @($servePath) `
  -WindowStyle Hidden `
  -PassThru `
  -WorkingDirectory $root `
  -RedirectStandardOutput $logPath `
  -RedirectStandardError $errLogPath

for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 2
    if ($health.status -eq "ok") {
      Write-Host "Face service started successfully." -ForegroundColor Green
      Write-Host "PID: $($proc.Id)" -ForegroundColor Green
      Write-Host "Health: $healthUrl" -ForegroundColor Cyan
      if ($health.minBlurVariance) {
        Write-Host "minBlurVariance: $($health.minBlurVariance)" -ForegroundColor Cyan
      }
      exit 0
    }
  } catch {
  }
  if ($proc.HasExited) {
    break
  }
}

Write-Host "Face service did not become ready in time." -ForegroundColor Red
if ($proc.HasExited) {
  Write-Host "The face service process exited during startup." -ForegroundColor Red
}
if (Test-Path $logPath) {
  Write-Host "Last log output:" -ForegroundColor Yellow
  Get-Content -Path $logPath | Select-Object -Last 20
}
if (Test-Path $errLogPath) {
  Write-Host "Last error log output:" -ForegroundColor Yellow
  Get-Content -Path $errLogPath | Select-Object -Last 20
}
Write-Host "If needed, stop stale Python processes and run this script again." -ForegroundColor Yellow
exit 1
