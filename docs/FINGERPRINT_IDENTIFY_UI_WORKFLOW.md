# Fingerprint Identify UI Workflow

This workflow bypasses the RPC-failing `Enrollment.exe` verification path and uses a custom verifier built on top of HID's `.NET` `VerificationControl`.

## Why this path

- `Enrollment.exe` uses a lower-level acquisition path that is failing on this laptop with `0x800706B3`
- the custom verifier uses HID's UI-style verification control, which is a different path and is closer to the vendor UI demo behavior that was more stable
- it loads enrolled templates from your backend/database and marks attendance directly on a successful match

## 1. Start the backend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

## 2. Build the verifier app

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\fingerprint-identify-ui"
dotnet build .\FingerprintIdentifyUi.csproj -c Release
```

## 3. Run the verifier app

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\fingerprint-identify-ui"
.\run.ps1
```

## 4. Use the app

When the window opens:

1. wait for it to load enrolled templates from the backend
2. touch the reader with an enrolled finger
3. if a match is found, the app will mark attendance automatically through the backend

## 5. Verify attendance rows

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, employee_id, date, check_in, check_out, check_in_method, check_out_method, check_in_device, check_out_device, verification_score FROM attendance ORDER BY id DESC;"
```
