# Local Agent Fingerprint Runbook

## Working architecture

- React frontend on `http://127.0.0.1:5173`
- Node backend on `http://127.0.0.1:4000`
- Local Windows biometric agent on `http://127.0.0.1:8091`
- HID helper apps launched by the agent:
  - `fingerprint-enroll-ui`
  - `fingerprint-identify-ui`

The browser does not talk to the HID SDK directly. It talks to the local biometric agent, and the agent launches the native Windows fingerprint flows.

## Start order

### 1. Backend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

### 2. Frontend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\frontend"
npm run dev
```

### 3. Local biometric agent

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\biometric-agent-dotnet"
dotnet build .\BiometricAgent.csproj -c Release
.\run.ps1
```

## Health checks

### Agent health

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8091/health"
```

### Backend fingerprint status

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/status"
```

Expected result:

- `status = ok`
- `mode = local-agent`

## Browser workflow

Open:

- `http://127.0.0.1:5173`

Login with:

- email: `admin@attendance.local`
- password: `Admin@12345`

## Fingerprint lifecycle tests

### A. Launch enrollment from browser

1. Go to `Employees`
2. Select an employee
3. Use one of:
   - `Launch Fingerprint Enrollment`
   - a recommended backup finger `Enroll ...` button
4. Confirm the helper window opens with the selected employee ID and finger slot

### B. Enroll primary + backup fingers

Recommended order:

1. `right_index`
2. `right_thumb`
3. `left_index`
4. `left_thumb`

After each enrollment, verify the slot was stored:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT employee_id, finger_code, is_preferred, template_format, source, OCTET_LENGTH(template) AS bytes FROM employee_fingerprints ORDER BY employee_id, is_preferred DESC, finger_code;"
```

### C. Launch verification from browser

1. Go to `Attendance Station`
2. Click `Launch Fingerprint Verification`
3. Place an enrolled finger on the reader
4. Confirm the helper window shows a match
5. Confirm attendance is marked in the browser dashboard and reports

### D. Mark preferred finger

1. Go to `Employees`
2. Select the employee
3. In `Enrolled Fingerprints`, click `Set Preferred` on the desired slot
4. Refresh employee details
5. Confirm the slot now shows `(Preferred)`

### E. Replace a finger slot

1. Go to `Employees`
2. Select the employee
3. In `Enrolled Fingerprints`, click `Replace Slot`
4. Re-enroll the same slot with a fresh scan
5. Verify live matching still works

### F. Delete a finger slot

1. Go to `Employees`
2. Select the employee
3. In `Enrolled Fingerprints`, click `Delete Slot`
4. Confirm the slot disappears from the list
5. If the deleted slot was preferred, confirm another slot becomes preferred automatically

## Attendance verification checks

### Recent employee history

The employee page shows recent attendance for the selected person.

### Reports

Use `Reports` to verify:

- date
- check-in
- check-out
- method
- station device

### CSV export

Use the `Export CSV` button in `Reports`.

## Direct backend launch tests

### Launch verify

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/launch-verify" -ContentType "application/json" -Body "{}"
```

### Launch enroll for a slot

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/launch-enroll" -ContentType "application/json" -Body '{"employeeId":1,"fingerCode":"left_index"}'
```

## Troubleshooting

### The helper app does not rebuild

A running helper process is locking the `.exe`.

Close it or run:

```powershell
Stop-Process -Name FingerprintEnrollUi -Force -ErrorAction SilentlyContinue
Stop-Process -Name FingerprintIdentifyUi -Force -ErrorAction SilentlyContinue
```

### Browser shows fingerprint warning

Check the local agent:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8091/health"
```

### HID helper window opens but scanner does not behave

Check:

```powershell
Get-Service DpHost, WbioSrvc
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Services\DpHost' | Select-Object ImagePath
```

Expected:

- `DpHost` = `Running`
- `WbioSrvc` = `Running`
- `ImagePath` = `"C:\Program Files\HID Global\Authentication Device Client\Bin\DpHostW.exe"`

## Next phase

After fingerprint lifecycle testing is complete:

1. install Python `3.10` or `3.11`
2. create a clean face-service environment
3. wire Logitech HD 1080p face enrollment and verification into the same station flow
