param(
    [Parameter(Mandatory = $true)]
    [int]$EmployeeId,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$FingerCode,

    [string]$BackendUrl = "http://127.0.0.1:4000"
)

$ErrorActionPreference = "Stop"

$body = @{
    employeeId = $EmployeeId
    fingerCode = $FingerCode
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod `
    -Method Post `
    -Uri "$BackendUrl/api/biometrics/fingerprint/export-template" `
    -ContentType "application/json" `
    -Body $body

if (-not $response.templateBase64) {
    throw "Backend did not return a template."
}

$bytes = [System.Convert]::FromBase64String($response.templateBase64)
$resolvedOutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDirectory = Split-Path -Path $resolvedOutputPath -Parent

if ($outputDirectory -and -not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

[System.IO.File]::WriteAllBytes($resolvedOutputPath, $bytes)

[pscustomobject]@{
    status = "saved"
    outputPath = $resolvedOutputPath
    fingerCode = $response.fingerCode
    employee = $response.employee
}
