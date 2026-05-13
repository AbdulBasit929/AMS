$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$tempRoot = Join-Path $root ".tmp-py312"
$cacheRoot = Join-Path $tempRoot "pip-cache"

Write-Host "Preparing Python 3.12 user runtime for face-service..." -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Force -Path $cacheRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  throw "Python launcher 'py' was not found. Install Python 3.12 first."
}

$corePackages = @(
  "Flask==3.1.1",
  "numpy==1.26.4",
  "opencv-python==4.10.0.84",
  "blinker==1.9.0",
  "click==8.3.3",
  "itsdangerous==2.2.0",
  "jinja2==3.1.6",
  "markupsafe==3.0.3",
  "werkzeug==3.1.8",
  "Pillow==12.2.0",
  "colorama==0.4.6",
  "waitress==3.0.0",
  "setuptools>=70.0.0"
)

$facePackages = @(
  "face-recognition-models==0.3.0",
  "dlib-bin==20.0.1",
  "face_recognition==1.3.0"
)

& py -3.12 -m pip install --user --upgrade --cache-dir $cacheRoot @corePackages
if ($LASTEXITCODE -ne 0) {
  throw "Failed to install core face-service packages."
}

& py -3.12 -m pip install --user --upgrade --cache-dir $cacheRoot --no-deps @facePackages
if ($LASTEXITCODE -ne 0) {
  throw "Failed to install face-recognition runtime packages."
}

Write-Host "Face-service Python 3.12 user runtime is ready." -ForegroundColor Green
Write-Host "Runtime scope: user site-packages for Python 3.12" -ForegroundColor Green
Write-Host "Run .\run.ps1 to start the Logitech webcam face service." -ForegroundColor Green
