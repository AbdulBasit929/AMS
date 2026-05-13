$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $root "bin\Release\net48\FingerprintBridge.exe"
$logPath = Join-Path $root "fingerprint-bridge-service.log"
$errLogPath = Join-Path $root "fingerprint-bridge-service.err.log"

if (-not (Test-Path $exePath)) {
  throw "FingerprintBridge.exe was not found. Build the project first with: dotnet build .\FingerprintBridge.csproj -c Release"
}

Set-Location $root

while ($true) {
  $alreadyRunning = Get-Process FingerprintBridge -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -eq $exePath
  }

  if ($alreadyRunning) {
    Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Fingerprint bridge already running; host loop will wait."
    Start-Sleep -Seconds 5
    continue
  }

  Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Starting fingerprint-bridge host"
  & $exePath 1>> $logPath 2>> $errLogPath
  Add-Content -Path $errLogPath -Value "[$(Get-Date -Format o)] fingerprint-bridge exited with code $LASTEXITCODE"
  Start-Sleep -Seconds 5
}
