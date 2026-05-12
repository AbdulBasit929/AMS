$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root "src"
$out = Join-Path $root "out"
$installedSdkJava = "C:\Program Files\HID Global\Authentication Device Client\Bin\Java"
$localSdkJava = "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\Bin\Java"
$sdkJava = if (Test-Path $installedSdkJava) { $installedSdkJava } else { $localSdkJava }

if (Test-Path $out) {
    Remove-Item -Recurse -Force $out
}

New-Item -ItemType Directory -Path $out | Out-Null

$classpath = @(
    (Join-Path $sdkJava "dpotapi.jar"),
    (Join-Path $sdkJava "dpotjni.jar")
) -join ";"

$files = Get-ChildItem -Path $src -Recurse -Filter *.java | ForEach-Object { $_.FullName }

javac -encoding UTF-8 -cp $classpath -d $out $files

Write-Host "Bridge compiled into $out"
