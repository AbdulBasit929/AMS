$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root "out"
$installedSdkJava = "C:\Program Files\HID Global\Authentication Device Client\Bin\Java"
$installedSdkBin = "C:\Program Files\HID Global\Authentication Device Client\Bin"
$localSdkJava = "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\Bin\Java"
$localSdkBin = "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\Bin"
$sdkJava = if (Test-Path $installedSdkJava) { $installedSdkJava } else { $localSdkJava }
$sdkBin = if (Test-Path $installedSdkBin) { $installedSdkBin } else { $localSdkBin }

$classpath = @(
    $out,
    (Join-Path $sdkJava "dpotapi.jar"),
    (Join-Path $sdkJava "dpotjni.jar"),
    "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\One Touch SDK\Java\Samples\Console\mysql-connector-j-9.4.0.jar"
) -join ";"

java "-Djava.library.path=$sdkBin" -cp $classpath com.attendance.bridge.AttendanceBridgeServer
