$ErrorActionPreference = "Stop"

if (-not $env:BRIDGE_PORT) {
    $env:BRIDGE_PORT = "8082"
}

$exePath = Join-Path $PSScriptRoot "bin\Release\net48\FingerprintBridge.exe"

if (-not (Test-Path $exePath)) {
    throw "FingerprintBridge.exe was not found. Build the project first with: dotnet build .\FingerprintBridge.csproj -c Release"
}

$running = Get-Process FingerprintBridge -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -eq $exePath
}

if ($running) {
    Write-Host "Fingerprint bridge is already running on this machine." -ForegroundColor Yellow
    Write-Host "PID(s): $($running.Id -join ', ')" -ForegroundColor Yellow
    Write-Host "Endpoint: http://127.0.0.1:$($env:BRIDGE_PORT)" -ForegroundColor Cyan
    return
}

& $exePath
