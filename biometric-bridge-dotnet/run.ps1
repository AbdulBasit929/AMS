$ErrorActionPreference = "Stop"

if (-not $env:BRIDGE_PORT) {
    $env:BRIDGE_PORT = "8082"
}

& ".\bin\Release\net48\FingerprintBridge.exe"
