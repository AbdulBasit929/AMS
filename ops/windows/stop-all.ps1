$ErrorActionPreference = "SilentlyContinue"

$runtimeDir = Join-Path $PSScriptRoot "runtime"
$componentNames = @("backend", "frontend", "face-service", "fingerprint-bridge", "biometric-agent")

function Stop-ProcessTree {
  param([int]$ProcessId)

  $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $ProcessId }
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId $child.ProcessId
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

foreach ($name in $componentNames) {
  $pidFile = Join-Path $runtimeDir "$name.pid"
  if (-not (Test-Path $pidFile)) {
    continue
  }

  $raw = Get-Content -Path $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidValue = 0
  if ([int]::TryParse([string]$raw, [ref]$pidValue)) {
    Stop-ProcessTree -ProcessId $pidValue
    Write-Host "Stopped $name (PID $pidValue) if it was running." -ForegroundColor Green
  }

  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Done. If needed, run .\status-runtime.ps1 to verify everything is stopped." -ForegroundColor Cyan
