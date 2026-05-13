$ErrorActionPreference = "SilentlyContinue"

$runtimeDir = Join-Path $PSScriptRoot "runtime"
$components = @(
  @{ Name = "backend"; Url = "http://127.0.0.1:4000/api/health" },
  @{ Name = "frontend"; Url = "http://127.0.0.1:5173" },
  @{ Name = "face-service"; Url = "http://127.0.0.1:5000" },
  @{ Name = "fingerprint-bridge"; Url = "http://127.0.0.1:8082" },
  @{ Name = "biometric-agent"; Url = "http://127.0.0.1:8091/health" }
)

foreach ($component in $components) {
  $pidFile = Join-Path $runtimeDir "$($component.Name).pid"
  $label = $component.Name.PadRight(19)

  if (-not (Test-Path $pidFile)) {
    Write-Host "$label not started via start-all.ps1" -ForegroundColor Yellow
    continue
  }

  $raw = Get-Content -Path $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidValue = 0
  if (-not [int]::TryParse([string]$raw, [ref]$pidValue)) {
    Write-Host "$label pid file is invalid" -ForegroundColor Red
    continue
  }

  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($process) {
    Write-Host "$label running (PID $pidValue) -> $($component.Url)" -ForegroundColor Green
  } else {
    Write-Host "$label not running (stale pid file: $pidValue)" -ForegroundColor Red
  }
}
