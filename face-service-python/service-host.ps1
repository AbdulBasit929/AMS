$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $env:LocalAppData "Programs\Python\Python312\python.exe"
$servePath = Join-Path $root "serve.py"
$logPath = Join-Path $root "face-service-service.log"
$errLogPath = Join-Path $root "face-service-service.err.log"

if (-not (Test-Path $pythonExe)) {
  throw "Python 3.12 executable not found at $pythonExe"
}

if (-not (Test-Path $servePath)) {
  throw "serve.py not found at $servePath"
}

Set-Location $root

while ($true) {
  Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Starting face-service host"
  & $pythonExe -u $servePath 1>> $logPath 2>> $errLogPath
  Add-Content -Path $errLogPath -Value "[$(Get-Date -Format o)] face-service exited with code $LASTEXITCODE"
  Start-Sleep -Seconds 5
}
