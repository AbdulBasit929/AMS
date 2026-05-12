# Fingerprint Re-enroll Fix

The fingerprint verifier now opens and reads templates from the backend. If it says `No fingerprint match`, the most likely cause is template format mismatch:

- old imported template came from the low-level native sample path
- new verifier uses HID `.NET` `DPFP.Template` format

To fix that, re-enroll the employee using the new `.NET` enrollment UI so the stored template format matches the verifier.

## 1. Keep backend running

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

## 2. Build the enrollment UI

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\fingerprint-enroll-ui"
dotnet build .\FingerprintEnrollUi.csproj -c Release
```

## 3. Run the enrollment UI

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\fingerprint-enroll-ui"
.\run.ps1
```

## 4. Re-enroll employee 1

When the window opens:

1. keep `Employee ID` as `1`
2. follow the HID enrollment UI
3. use the same finger consistently for all required scans
4. wait for the success message

That will overwrite the old template in MySQL with a `.NET` verifier-compatible template.

## 5. Verify storage

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, name, cnic, fingerprint IS NOT NULL AS has_fingerprint, OCTET_LENGTH(fingerprint) AS fingerprint_bytes FROM employees;"
```

## 6. Run the verifier again

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\fingerprint-identify-ui"
.\run.ps1
```

Touch the same enrolled finger.

If it matches, the app will mark attendance automatically.
