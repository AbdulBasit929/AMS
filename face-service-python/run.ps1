$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$healthUrl = "http://127.0.0.1:5000/health"
$logPath = Join-Path $root "face-service.log"
$errLogPath = Join-Path $root "face-service.err.log"
$pythonLauncher = "py"
$pythonArgs = @("-3.12")
$pythonExe = Join-Path $env:LocalAppData "Programs\Python\Python312\python.exe"
$expectedServiceVersion = "2.2.0"

function Test-FaceRuntime() {
  if (-not (Get-Command $pythonLauncher -ErrorAction SilentlyContinue)) {
    return $false
  }

  $probe = "import face_recognition, face_recognition_models, cv2, numpy, waitress"

  try {
    & $pythonLauncher @pythonArgs -c $probe *> $null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

if (-not (Test-FaceRuntime)) {
  Write-Host "Face-service runtime is not ready." -ForegroundColor Yellow
  Write-Host "Install the Python 3.12 face-service packages first." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $pythonExe)) {
  Write-Host "Python 3.12 executable not found at $pythonExe" -ForegroundColor Yellow
  exit 1
}

function Stop-Port5000Process() {
  try {
    $listener = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction Stop | Select-Object -First 1
    if ($listener -and $listener.OwningProcess) {
      Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
      Start-Sleep -Milliseconds 500
    }
  } catch {
  }
}

try {
  $health = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 2
  if ($health.status -eq "ok") {
    if ($health.serviceVersion -eq $expectedServiceVersion) {
      Write-Host "Face service is already running." -ForegroundColor Green
      Write-Host "Health: $healthUrl" -ForegroundColor Cyan
      exit 0
    }

    Write-Host "A stale face-service instance is running. Restarting it..." -ForegroundColor Yellow
    Stop-Port5000Process
  }
} catch {
}

Write-Host "Starting Logitech webcam face service on http://127.0.0.1:5000" -ForegroundColor Cyan
$servePath = Join-Path $root "serve.py"
$backgroundCmd = Join-Path $root "serve-background.cmd"
if (Test-Path $logPath) {
  Remove-Item -LiteralPath $logPath -Force
}
if (Test-Path $errLogPath) {
  Remove-Item -LiteralPath $errLogPath -Force
}
if (-not (Test-Path $backgroundCmd)) {
  Write-Host "Background launcher not found at $backgroundCmd" -ForegroundColor Red
  exit 1
}

& $backgroundCmd

for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 2
    if ($health.status -eq "ok") {
      Write-Host "Face service started successfully." -ForegroundColor Green
      Write-Host "Health: $healthUrl" -ForegroundColor Cyan
      if ($health.minBlurVariance) {
        Write-Host "minBlurVariance: $($health.minBlurVariance)" -ForegroundColor Cyan
      }
      exit 0
    }
  } catch {
  }
}

Write-Host "Face service did not become ready in time." -ForegroundColor Red
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
