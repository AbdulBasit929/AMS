param(
    [Parameter(Mandatory = $true)]
    [int]$EmployeeId,

    [decimal]$Score = 0,

    [string]$BackendUrl = "http://127.0.0.1:4000"
)

$ErrorActionPreference = "Stop"

$body = @{
    employeeId = $EmployeeId
    score = $Score
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
    -Method Post `
    -Uri "$BackendUrl/api/biometrics/fingerprint/mark-attendance" `
    -ContentType "application/json" `
    -Body $body
