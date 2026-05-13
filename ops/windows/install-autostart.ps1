$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$faceHost = Join-Path $repoRoot "face-service-python\service-host.ps1"
$agentHost = Join-Path $repoRoot "biometric-agent-dotnet\service-host.ps1"
$serviceName = "AttendanceFaceService"
$taskFace = "Attendance Face Service"
$taskAgent = "Attendance Biometric Agent"
$runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runValueFace = "AttendanceFaceService"
$runValueAgent = "AttendanceBiometricAgent"
$powershellExe = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
$nssm = Get-Command nssm -ErrorAction SilentlyContinue
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

if (-not (Test-Path $faceHost)) {
  throw "Face service host not found at $faceHost"
}

if (-not (Test-Path $agentHost)) {
  throw "Biometric agent host not found at $agentHost"
}

function Install-FaceServiceNssm {
  param([string]$NssmPath)

  & $NssmPath remove $serviceName confirm | Out-Null
  & $NssmPath install $serviceName $powershellExe "-NoProfile -ExecutionPolicy Bypass -File `"$faceHost`""
  & $NssmPath set $serviceName AppDirectory (Split-Path $faceHost -Parent)
  & $NssmPath set $serviceName Start SERVICE_AUTO_START
  & $NssmPath set $serviceName AppStdout (Join-Path (Split-Path $faceHost -Parent) "face-service-service.log")
  & $NssmPath set $serviceName AppStderr (Join-Path (Split-Path $faceHost -Parent) "face-service-service.err.log")
  & $NssmPath start $serviceName | Out-Null
}

function Install-LogonTask {
  param(
    [string]$TaskName,
    [string]$ScriptPath
  )

  $action = New-ScheduledTaskAction -Execute $powershellExe -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`"" -ErrorAction Stop
  $trigger = New-ScheduledTaskTrigger -AtLogOn -ErrorAction Stop
  $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -StartWhenAvailable -ErrorAction Stop
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest -ErrorAction Stop
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force -ErrorAction Stop | Out-Null
}

function Install-RunKey {
  param(
    [string]$ValueName,
    [string]$ScriptPath
  )

  if (-not (Test-Path $runKeyPath)) {
    New-Item -Path $runKeyPath -Force | Out-Null
  }

  $command = "`"$powershellExe`" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
  New-ItemProperty -Path $runKeyPath -Name $ValueName -PropertyType String -Value $command -Force | Out-Null
}

if ($nssm) {
  Install-FaceServiceNssm -NssmPath $nssm.Source
  Write-Host "Installed Windows service '$serviceName' for face-service." -ForegroundColor Green
} else {
  try {
    Install-LogonTask -TaskName $taskFace -ScriptPath $faceHost
    Write-Host "Installed logon auto-start task '$taskFace' for face-service." -ForegroundColor Yellow
  } catch {
    Install-RunKey -ValueName $runValueFace -ScriptPath $faceHost
    Write-Host "Installed HKCU Run auto-start entry '$runValueFace' for face-service." -ForegroundColor Yellow
  }
}

try {
  Install-LogonTask -TaskName $taskAgent -ScriptPath $agentHost
  Write-Host "Installed logon auto-start task '$taskAgent' for biometric-agent." -ForegroundColor Green
} catch {
  Install-RunKey -ValueName $runValueAgent -ScriptPath $agentHost
  Write-Host "Installed HKCU Run auto-start entry '$runValueAgent' for biometric-agent." -ForegroundColor Green
}

Write-Host "Use .\\status-autostart.ps1 to verify current registration." -ForegroundColor Cyan
