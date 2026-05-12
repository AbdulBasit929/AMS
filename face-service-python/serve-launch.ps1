$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$depsPath = Join-Path $root ".pydeps312"
$servePath = Join-Path $root "serve.py"
$pythonExe = Join-Path $env:LocalAppData "Programs\Python\Python312\python.exe"

$env:PYTHONPATH = if ($env:PYTHONPATH) { "$depsPath;$env:PYTHONPATH" } else { $depsPath }

Set-Location $root
if (-not (Test-Path $pythonExe)) {
  throw "Python 3.12 executable not found at $pythonExe"
}

& $pythonExe $servePath
