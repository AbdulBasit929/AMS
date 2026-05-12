# Fingerprint Verification Workflow

This is the most practical verification flow currently available on this laptop.

## What works today

- HID fingerprint enrollment template can be captured through the native sample path
- template can be stored in MySQL
- stored template can be exported back to a `.fpt` file
- backend can mark attendance once a fingerprint match is confirmed

## What does not reliably work yet

- managed live identification through `POST /api/biometrics/fingerprint/identify`

Because of that, use the native HID verification sample for the live match step.

## 1. Start the backend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

## 2. Export the enrolled template from MySQL to a `.fpt` file

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system"
.\scripts\export-fingerprint-template.ps1 -EmployeeId 1 -OutputPath "C:\Users\W S Mughal\Downloads\DigitalPersona\templates\employee-1-verify.fpt"
```

Expected result:

- `status = saved`

## 3. Open the native HID verification sample

Use the local sample that came with the SDK bundle:

```powershell
& "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\Release\Enrollment.exe"
```

If that path is flaky, try the installed vendor path:

```powershell
& "C:\Program Files\HID Global\Authentication Device Client\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\Release\Enrollment.exe"
```

## 4. Load the exported template

In the sample main window:

1. click `Read Fingerprint Enrollment Template`
2. choose:

```text
C:\Users\W S Mughal\Downloads\DigitalPersona\templates\employee-1-verify.fpt
```

## 5. Verify the live finger

In the same sample:

1. click `Fingerprint Verification`
2. place the same finger on the reader
3. confirm the sample shows a successful match

## 6. Mark attendance in the backend

After the sample confirms the match:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system"
.\scripts\mark-fingerprint-attendance.ps1 -EmployeeId 1
```

Expected result:

- first successful run on a day: `check_in`
- second successful run on the same day: `check_out`

## 7. Verify attendance rows

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, employee_id, date, check_in, check_out, check_in_method, check_out_method, check_in_device, check_out_device, verification_score FROM attendance ORDER BY id DESC;"
```
