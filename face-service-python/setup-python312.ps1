$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$depsPath = Join-Path $root ".pydeps312"
$tempRoot = Join-Path $root ".tmp-py312"
$cacheRoot = Join-Path $tempRoot "pip-cache"

Write-Host "Preparing Python 3.12 dependency bundle for face-service..." -ForegroundColor Cyan

if (Test-Path $depsPath) {
  Remove-Item -Recurse -Force $depsPath
}

New-Item -ItemType Directory -Force -Path $depsPath | Out-Null
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot

py -3.12 -m pip install --cache-dir $cacheRoot --target $depsPath -r (Join-Path $root "requirements.txt")
py -3.12 -m pip install --cache-dir $cacheRoot --target $depsPath --no-deps face_recognition==1.3.0

Write-Host "Face-service dependency bundle is ready." -ForegroundColor Green
Write-Host "Run .\run.ps1 to start the Logitech webcam face service." -ForegroundColor Green
