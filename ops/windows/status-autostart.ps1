$ErrorActionPreference = "SilentlyContinue"

$serviceName = "AttendanceFaceService"
$taskFace = "Attendance Face Service"
$taskAgent = "Attendance Biometric Agent"
$runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runValueFace = "AttendanceFaceService"
$runValueAgent = "AttendanceBiometricAgent"

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
  Write-Host "Face-service Windows service: $($service.Status)" -ForegroundColor Green
} else {
  Write-Host "Face-service Windows service: not installed" -ForegroundColor Yellow
}

$faceTask = Get-ScheduledTask -TaskName $taskFace -ErrorAction SilentlyContinue
if ($faceTask) {
  Write-Host "Face-service logon task: $($faceTask.State)" -ForegroundColor Green
} else {
  Write-Host "Face-service logon task: not installed" -ForegroundColor Yellow
}

$agentTask = Get-ScheduledTask -TaskName $taskAgent -ErrorAction SilentlyContinue
if ($agentTask) {
  Write-Host "Biometric-agent logon task: $($agentTask.State)" -ForegroundColor Green
} else {
  Write-Host "Biometric-agent logon task: not installed" -ForegroundColor Yellow
}

$faceRun = Get-ItemProperty -Path $runKeyPath -Name $runValueFace -ErrorAction SilentlyContinue
if ($faceRun) {
  Write-Host "Face-service HKCU Run entry: installed" -ForegroundColor Green
} else {
  Write-Host "Face-service HKCU Run entry: not installed" -ForegroundColor Yellow
}

$agentRun = Get-ItemProperty -Path $runKeyPath -Name $runValueAgent -ErrorAction SilentlyContinue
if ($agentRun) {
  Write-Host "Biometric-agent HKCU Run entry: installed" -ForegroundColor Green
} else {
  Write-Host "Biometric-agent HKCU Run entry: not installed" -ForegroundColor Yellow
}
