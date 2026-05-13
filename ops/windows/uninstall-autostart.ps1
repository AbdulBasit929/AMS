$ErrorActionPreference = "SilentlyContinue"

$serviceName = "AttendanceFaceService"
$taskFace = "Attendance Face Service"
$taskAgent = "Attendance Biometric Agent"
$runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runValueFace = "AttendanceFaceService"
$runValueAgent = "AttendanceBiometricAgent"
$nssm = Get-Command nssm -ErrorAction SilentlyContinue

if ($nssm) {
  & $nssm.Source stop $serviceName | Out-Null
  & $nssm.Source remove $serviceName confirm | Out-Null
  Write-Host "Removed Windows service '$serviceName' if it existed." -ForegroundColor Green
}

Unregister-ScheduledTask -TaskName $taskFace -Confirm:$false | Out-Null
Unregister-ScheduledTask -TaskName $taskAgent -Confirm:$false | Out-Null
Remove-ItemProperty -Path $runKeyPath -Name $runValueFace | Out-Null
Remove-ItemProperty -Path $runKeyPath -Name $runValueAgent | Out-Null

Write-Host "Removed auto-start tasks if they existed." -ForegroundColor Green
