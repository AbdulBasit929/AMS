$ErrorActionPreference = "Stop"

$exePath = Join-Path $PSScriptRoot "bin\Release\net8.0\BiometricAgent.exe"

if (-not (Test-Path $exePath)) {
  throw "BiometricAgent.exe was not found. Build the project first with: dotnet build .\BiometricAgent.csproj -c Release"
}

$running = Get-Process BiometricAgent -ErrorAction SilentlyContinue | Where-Object {
  $_.Path -eq $exePath
}

if ($running) {
  Write-Host "Biometric agent is already running on this machine." -ForegroundColor Yellow
  Write-Host "PID(s): $($running.Id -join ', ')" -ForegroundColor Yellow
  Write-Host "Health: http://127.0.0.1:8091/health" -ForegroundColor Cyan
  return
}

& $exePath
