# Native Enrollment Workflow

This workflow is the most reliable enrollment path currently available on this laptop.

## Why use this

- HID native C++ sample behaves better than the Java/.NET wrapper capture path
- it can save a real fingerprint template to disk as `.fpt`
- backend can then import that template into MySQL

## 1. Start backend

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system\backend"
npm run dev
```

## 2. Run the native HID Enrollment sample

Use the installed vendor sample:

```powershell
& "C:\Program Files\HID Global\Authentication Device Client\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\Release\Enrollment.exe"
```

If that path does not open, use your local copy:

```powershell
& "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\Release\Enrollment.exe"
```

## 3. Capture the fingerprint

Inside the sample:

1. click `Fingerprint Enrollment`
2. place the same finger each time
3. finish all required scans
4. return to the main sample window

## 4. Save the template to file

In the sample main window:

1. click `Save Fingerprint Template`
2. save the file as something like:

```text
C:\Users\W S Mughal\Downloads\DigitalPersona\templates\employee-1.fpt
```

If the `templates` folder does not exist, create it first:

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\W S Mughal\Downloads\DigitalPersona\templates"
```

### Fallback if the save dialog is unreliable

Your fellow's local sample source was already modified to write the enrolled template into:

```text
C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\fingerprint_template.txt
```

That file contains a hex dump wrapped between:

- `FINGERPRINT_TEMPLATE_START`
- `FINGERPRINT_TEMPLATE_END`

If the native `Save Fingerprint Template` path is flaky, use that text file directly in step 5. The import script now accepts both:

- binary `.fpt` files
- text template dumps from `fingerprint_template.txt`

## 5. Import the saved template into the backend

Run:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system"
.\scripts\import-fingerprint-template.ps1 -EmployeeId 1 -TemplatePath "C:\Users\W S Mughal\Downloads\DigitalPersona\templates\employee-1.fpt"
```

Or import the hex dump directly:

```powershell
cd "C:\Users\W S Mughal\Downloads\DigitalPersona\attendance-system"
.\scripts\import-fingerprint-template.ps1 -EmployeeId 1 -TemplatePath "C:\Users\W S Mughal\Downloads\DigitalPersona\DigitalPersona\One Touch SDK\C-C++\Samples\C++\Enrollment Sample Code\fingerprint_template.txt"
```

Expected response:

- `status = imported`

## 6. Verify the DB was updated

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uroot -padmin123 -e "USE attendance_db; SELECT id, name, cnic, fingerprint IS NOT NULL AS has_fingerprint FROM employees;"
```

Expected result:

- `has_fingerprint = 1` for the enrolled employee

## 7. What this solves

This gives you a working fingerprint enrollment integration path:

- scan with HID native sample
- save `.fpt`
- import into system database

## 8. What remains next

The next native step is attendance verification/identification:

- use native C++ verification flow against stored templates
- then expose that through a bridge for the backend
