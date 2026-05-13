# Attendance System Reference Card

## Daily Start

Open PowerShell and run:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\open-app.ps1
```

This will:
- start backend
- start frontend
- start face service
- start fingerprint bridge
- start biometric agent
- open the app in the browser

Frontend URL:

```text
http://127.0.0.1:5173
```

## Start Without Opening Browser

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\start-all.ps1
```

## Check What Is Running

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\status-runtime.ps1
```

## Stop Everything

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\stop-all.ps1
```

## Reboot / Login Auto-Start

Install auto-start:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\install-autostart.ps1
.\status-autostart.ps1
```

Remove auto-start:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\uninstall-autostart.ps1
.\status-autostart.ps1
```

## If Fingerprint Windows Or Biometric Processes Get Stuck

```powershell
Get-Process -Name FingerprintBridge -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name BiometricAgent -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name FingerprintIdentifyUi -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name FingerprintEnrollUi -ErrorAction SilentlyContinue | Stop-Process -Force
```

Then start again:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\ops\windows"
.\stop-all.ps1
.\open-app.ps1
```

## Health Links

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:4000/api/health`
- Face service: `http://127.0.0.1:5000`
- Fingerprint bridge: `http://127.0.0.1:8082`
- Biometric agent: `http://127.0.0.1:8091/health`

## Recommended Routine

For normal use:
- run `.\open-app.ps1`

For shutdown:
- run `.\stop-all.ps1`

For Windows-login auto-start:
- use `.\install-autostart.ps1`
