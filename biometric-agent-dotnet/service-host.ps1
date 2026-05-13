$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $root "bin\Release\net8.0\BiometricAgent.exe"
$logPath = Join-Path $root "biometric-agent-service.log"
$errLogPath = Join-Path $root "biometric-agent-service.err.log"

if (-not (Test-Path $exePath)) {
  throw "BiometricAgent.exe was not found. Build the project first with: dotnet build .\BiometricAgent.csproj -c Release"
}

Set-Location $root

while ($true) {
  Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Starting biometric-agent host"
  & $exePath 1>> $logPath 2>> $errLogPath
  Add-Content -Path $errLogPath -Value "[$(Get-Date -Format o)] biometric-agent exited with code $LASTEXITCODE"
  Start-Sleep -Seconds 5
}
