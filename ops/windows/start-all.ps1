$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$powershellExe = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
$runtimeDir = Join-Path $PSScriptRoot "runtime"

if (-not (Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
}

$staleProcessNames = @("FingerprintBridge", "FingerprintIdentifyUi", "FingerprintEnrollUi")
foreach ($processName in $staleProcessNames) {
  Get-Process -Name $processName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

$components = @(
  @{
    Name = "backend"
    Title = "Attendance Backend"
    Workdir = Join-Path $repoRoot "backend"
    Command = "npm run dev"
    Url = "http://127.0.0.1:4000/api/health"
  },
  @{
    Name = "frontend"
    Title = "Attendance Frontend"
    Workdir = Join-Path $repoRoot "frontend"
    Command = "npm run dev"
    Url = "http://127.0.0.1:5173"
  },
  @{
    Name = "face-service"
    Title = "Attendance Face Service"
    Workdir = Join-Path $repoRoot "face-service-python"
    Command = ".\serve-launch.ps1"
    Url = "http://127.0.0.1:5000"
  },
  @{
    Name = "fingerprint-bridge"
    Title = "Attendance Fingerprint Bridge"
    Workdir = Join-Path $repoRoot "biometric-bridge-dotnet"
    Command = ".\run.ps1"
    Url = "http://127.0.0.1:8082"
  },
  @{
    Name = "biometric-agent"
    Title = "Attendance Biometric Agent"
    Workdir = Join-Path $repoRoot "biometric-agent-dotnet"
    Command = ".\run.ps1"
    Url = "http://127.0.0.1:8091/health"
  }
)

function Get-PidFilePath {
  param([string]$Name)
  return (Join-Path $runtimeDir "$Name.pid")
}

function Get-RunningProcess {
  param([string]$PidFilePath)

  if (-not (Test-Path $PidFilePath)) {
    return $null
  }

  $raw = Get-Content -Path $PidFilePath -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidValue = 0
  if (-not [int]::TryParse([string]$raw, [ref]$pidValue)) {
    Remove-Item -Path $PidFilePath -Force -ErrorAction SilentlyContinue
    return $null
  }

  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if (-not $process) {
    Remove-Item -Path $PidFilePath -Force -ErrorAction SilentlyContinue
    return $null
  }

  return $process
}

foreach ($component in $components) {
  if (-not (Test-Path $component.Workdir)) {
    throw "Required working directory not found: $($component.Workdir)"
  }

  $pidFile = Get-PidFilePath -Name $component.Name
  $running = Get-RunningProcess -PidFilePath $pidFile
  if ($running) {
    Write-Host "$($component.Name) is already running (PID $($running.Id))." -ForegroundColor Yellow
    continue
  }

  $scriptBlock = @"
`$Host.UI.RawUI.WindowTitle = '$($component.Title)'
Set-Location '$($component.Workdir)'
$($component.Command)
"@

  $process = Start-Process -FilePath $powershellExe `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $scriptBlock) `
    -WorkingDirectory $component.Workdir `
    -WindowStyle Normal `
    -PassThru

  Set-Content -Path $pidFile -Value $process.Id -NoNewline
  Write-Host "Started $($component.Name) (PID $($process.Id))" -ForegroundColor Green
}

Write-Host ""
Write-Host "Opened service windows for the full stack." -ForegroundColor Cyan
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "Backend: http://127.0.0.1:4000/api/health" -ForegroundColor Cyan
Write-Host "Face service: http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "Fingerprint bridge: http://127.0.0.1:8082" -ForegroundColor Cyan
Write-Host "Biometric agent: http://127.0.0.1:8091/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use .\status-runtime.ps1 to confirm which windows are still open." -ForegroundColor Cyan
