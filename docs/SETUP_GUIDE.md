# Detailed Setup Guide

This guide is written for your current laptop and the files already present in:

`C:\Users\W S Mughal\Downloads\DigitalPersona`

## 1. What you already have verified

- Java 17 installed
- `javac` installed
- Node.js installed
- npm installed
- Python installed
- MySQL 8 running
- `attendance_db` database already present
- HID DigitalPersona SDK files present locally

## 2. Overall build order

Follow this exact order:

1. Validate MySQL schema
2. Build and run fingerprint bridge
3. Test fingerprint bridge endpoints
4. Set up backend
5. Set up frontend
6. Set up face service
7. Integrate full attendance flow

## 3. Prepare the database

Open PowerShell in:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system"
```

Run:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 < .\database\schema.sql
```

Check tables:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SHOW TABLES; DESCRIBE employees; DESCRIBE attendance;"
```

If your tables already existed before this project, also run:

```powershell
Get-Content .\database\upgrade_existing_schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123
```

Insert one sample employee for fingerprint enrollment testing:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; INSERT INTO employees (employee_code, name, cnic, department, designation) VALUES ('EMP-001', 'Test Employee', '12345-1234567-1', 'IT', 'Developer');"
```

If that CNIC already exists, use another CNIC.

## 4. Build the Java fingerprint bridge

Move to the bridge folder:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\biometric-bridge-java"
```

Compile:

```powershell
.\build.ps1
```

Note:

- the bridge scripts now prefer the installed HID runtime at:
  - `C:\Program Files\HID Global\Authentication Device Client\Bin`
- if that is not present, they fall back to the copied SDK bundle in your Downloads folder

If compile succeeds, run:

```powershell
$env:ATTENDANCE_DB_URL="jdbc:mysql://localhost:3306/attendance_db?useSSL=false&allowPublicKeyRetrieval=true"
$env:ATTENDANCE_DB_USER="root"
$env:ATTENDANCE_DB_PASSWORD="admin123"
.\run.ps1
```

Expected result:

- Console prints `Fingerprint bridge listening on http://127.0.0.1:8081`

Important for your current laptop:

- port `8080` is already occupied by another Java process
- use port `8081` for this bridge unless you later free `8080`

Set the bridge port before running:

```powershell
$env:BRIDGE_PORT="8081"
```

## 5. Test the fingerprint bridge

Open a second PowerShell window.

### Check health

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8081/health"
```

Expected success:

- `status = ok`
- reader serial appears

If it says reader not detected:

1. Plug the HID 4500 directly into USB
2. Wait for Windows driver detection
3. Re-run the health endpoint
4. If still failing, check Device Manager manually
5. If Device Manager sees the reader but bridge still returns `JniException`, install or repair the HID DigitalPersona 4500 Non-WBF legacy driver from HID Global and avoid the Windows Hello WBF driver for this SDK path

### Enroll fingerprint

```powershell
$body = @{ cnic = "12345-1234567-1" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8081/enroll" -ContentType "application/json" -Body $body
```

Expected behavior:

- bridge prompts you to place finger several times
- fingerprint template is saved into `employees.fingerprint`

### Identify fingerprint

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8081/identify" -ContentType "application/json" -Body "{}"
```

Expected result:

- matched employee details returned if fingerprint matches

## 6. Set up the Node backend

Open a new PowerShell window:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
Copy-Item .env.example .env
npm install
npm run dev
```

Test backend health:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/health"
```

Test bridge status through backend:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/status"
```

Test employee list:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4000/api/employees"
```

Test attendance by fingerprint:

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:4000/api/biometrics/fingerprint/identify" -ContentType "application/json" -Body "{}"
```

What happens:

- backend asks bridge to identify fingerprint
- backend finds employee by CNIC
- backend creates check-in for first scan of the day
- next scan creates check-out

## 7. Set up the React frontend

Open a new PowerShell window:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\frontend"
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Use the two buttons to:

- check reader status
- trigger fingerprint attendance scan

## 8. Set up the face service

Open a new PowerShell window:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\face-service-python"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Health check:

```powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:5000/health"
```

## 9. Recommended next features

Build these next in order:

1. Login and JWT auth
2. Employee registration UI
3. Fingerprint enrollment page
4. Face enrollment page
5. Attendance dashboard
6. Reports by date range
7. Export to CSV or Excel

## 10. Important implementation decisions

### Fingerprint

- Keep all HID SDK calls in Java bridge
- Never call HID code directly from React
- Store template bytes only in MySQL

### Face recognition

- Capture webcam image in React
- Send image to Python service or backend
- Store computed face embedding, not just raw file path

### Attendance rule

Use this rule first:

- first successful scan today = check-in
- second successful scan today = check-out
- later scans after check-out = reject or mark already closed

## 11. Commands you will use most often

### Database

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, name, cnic, fingerprint IS NOT NULL AS has_fingerprint FROM employees;"
```

### Build bridge

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\biometric-bridge-java"
.\build.ps1
```

### Run bridge

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\biometric-bridge-java"
$env:ATTENDANCE_DB_URL="jdbc:mysql://localhost:3306/attendance_db?useSSL=false&allowPublicKeyRetrieval=true"
$env:ATTENDANCE_DB_USER="root"
$env:ATTENDANCE_DB_PASSWORD="admin123"
$env:BRIDGE_PORT="8081"
.\run.ps1
```

### Run backend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm install
npm run dev
```

### Run frontend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\frontend"
npm install
npm run dev
```

### Run face service

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\face-service-python"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## 12. Troubleshooting

### `reader not detected`

- reconnect scanner
- try another USB port
- verify Windows sees device
- restart bridge after plugging device

### Java native library errors

- confirm SDK dll files exist in:
  - `C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\Bin`
- always run through `run.ps1`

### MySQL login errors

- verify root password
- update `.env` and bridge env vars

### Node install issues

- clear npm cache only if needed
- use current Node 24 already installed

### Face library install issues

- `face_recognition` may need Visual C++ build tools or prebuilt dependencies
- if that becomes difficult, start with OpenCV-only face capture and postpone face matching

## 13. Practical project strategy

For fast delivery and fewer surprises:

1. Finish a reliable fingerprint flow first
2. Use that to complete attendance marking end to end
3. Add face recognition second
4. Polish reporting and dashboard last
