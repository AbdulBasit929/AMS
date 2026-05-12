# Fingerprint-First Runbook

This is the current best working path for fingerprint integration on this laptop.

## What is already done

- HID 4500 reader is detected by Windows
- HID legacy driver is installed
- local MySQL schema is prepared
- `.NET` fingerprint bridge project exists
- backend routes are wired to the bridge

## Important note

The bridge `GET /health` endpoint confirms the bridge host is running.
The real proof is `POST /capture-template` and `POST /identify`.

## 1. Build the fingerprint bridge

Open PowerShell:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\biometric-bridge-dotnet"
.\build.ps1
```

Expected result:

- build succeeds
- `FingerprintBridge.exe` is produced in `bin\Release\net48`

## 2. Run the fingerprint bridge

In the same PowerShell:

```powershell
$env:BRIDGE_PORT="8082"
.\run.ps1
```

Expected result:

- the bridge keeps running
- it stays in the foreground

To stop it later:

- press the keyboard shortcut `Ctrl` + `C`

Do not type `Ctrl + C` as text.

## 3. Test bridge health

Open a second PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8082/health"
```

Expected result:

```json
{
  "StatusCode": 200,
  "Status": "ok",
  "Message": "fingerprint bridge host is running"
}
```

## 4. Start the backend

Open a third PowerShell:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

Expected result:

- backend listens on `http://127.0.0.1:4000`

## 5. Test backend fingerprint status

In another PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/status"
```

Expected result:

- same `StatusCode: 200` bridge host response

## 6. Enroll fingerprint for employee

You already have a test employee with:

- `id = 1`
- `cnic = 12345-1234567-1`

Use either `employeeId` or `cnic`.

### Using employeeId

```powershell
$body = @{ employeeId = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/enroll" -ContentType "application/json" -Body $body
```

### Using cnic

```powershell
$body = @{ cnic = "12345-1234567-1" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/enroll" -ContentType "application/json" -Body $body
```

Expected behavior:

- bridge starts enrollment capture
- place the same finger multiple times
- when enough good samples are captured, backend stores the template into MySQL

## 7. Verify template was stored

After enrollment finishes:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, name, cnic, fingerprint IS NOT NULL AS has_fingerprint FROM employees;"
```

Expected result:

- `has_fingerprint` becomes `1` for the enrolled employee

## 8. Identify and mark attendance

After at least one employee has fingerprint enrolled:

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/identify" -ContentType "application/json" -Body "{}"
```

Expected behavior:

- bridge scans the fingerprint
- backend sends stored templates as candidates
- if matched:
  - backend finds employee
  - backend marks attendance

## 9. Verify attendance rows

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT * FROM attendance ORDER BY id DESC;"
```

Expected result:

- first successful scan of the day creates check-in
- next successful scan creates check-out

## 10. Troubleshooting

### If enrollment request returns bridge error

- keep the HID reader plugged in
- keep internal laptop fingerprint device disabled
- test the vendor sample again:

```powershell
& "C:\Program Files\HID Global\Authentication Device Client\One Touch SDK\C-C++\Samples\C++\DPFP UI Demo\Release\DPFPUIDemo.exe"
```

### If backend says bridge template missing

- the capture operation did not complete successfully
- rerun the enroll request and place the same finger carefully

### If identify says no employees have enrolled fingerprints

- confirm enrollment succeeded in MySQL

### If identify says no match

- use the same enrolled finger
- try again with consistent finger placement

## 11. Working order from now on

1. fingerprint bridge
2. backend fingerprint enroll
3. backend fingerprint identify
4. attendance marking
5. frontend UI
6. face recognition later

