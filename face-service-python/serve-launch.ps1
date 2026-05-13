$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$servePath = Join-Path $root "serve.py"

Set-Location $root
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  throw "Python launcher 'py' was not found. Install Python 3.12 first."
}

& (Get-Command py).Source -3.12 $servePath
