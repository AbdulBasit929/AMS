param(
    [Parameter(Mandatory = $true)]
    [int]$EmployeeId,

    [Parameter(Mandatory = $true)]
    [string]$TemplatePath,

    [string]$FingerCode = "right_index",

    [string]$BackendUrl = "http://127.0.0.1:4000"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TemplatePath)) {
    throw "Template file not found: $TemplatePath"
}

$resolvedTemplatePath = (Resolve-Path $TemplatePath).Path
$extension = [System.IO.Path]::GetExtension($resolvedTemplatePath)

if ($extension -ieq ".fpt") {
    $bytes = [System.IO.File]::ReadAllBytes($resolvedTemplatePath)
}
else {
    $content = Get-Content -Path $resolvedTemplatePath -Raw

    if ($content -match "FINGERPRINT_TEMPLATE_START\s*([0-9A-Fa-f]+)\s*FINGERPRINT_TEMPLATE_END") {
        $hex = $matches[1]
    }
    else {
        $hex = ($content -replace "\s+", "")
    }

    if ([string]::IsNullOrWhiteSpace($hex)) {
        throw "No fingerprint template data was found in: $resolvedTemplatePath"
    }

    if (($hex.Length % 2) -ne 0) {
        throw "Fingerprint template hex data has an odd length and cannot be converted."
    }

    if ($hex -notmatch "^[0-9A-Fa-f]+$") {
        throw "Fingerprint template text file must contain only hexadecimal data."
    }

    $bytes = New-Object byte[] ($hex.Length / 2)
    for ($i = 0; $i -lt $bytes.Length; $i++) {
        $bytes[$i] = [Convert]::ToByte($hex.Substring($i * 2, 2), 16)
    }
}

$body = @{
    employeeId = $EmployeeId
    fingerCode = $FingerCode
    templateFormat = "LEGACY_IMPORTED"
    source = "script_import"
    templateBase64 = [System.Convert]::ToBase64String($bytes)
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
    -Method Post `
    -Uri "$BackendUrl/api/biometrics/fingerprint/import-template" `
    -ContentType "application/json" `
    -Body $body
