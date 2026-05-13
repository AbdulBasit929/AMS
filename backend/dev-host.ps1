$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $npmCmd) {
  throw "npm.cmd was not found. Install Node.js and npm first."
}

Set-Location $root
& $npmCmd.Source run dev
