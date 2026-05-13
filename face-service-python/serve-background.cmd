@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python312\python.exe"
if not exist "%PYTHON_EXE%" (
  >>"%~dp0face-service.err.log" echo Python 3.12 executable not found at %PYTHON_EXE%
  exit /b 1
)

start "" /b "%PYTHON_EXE%" -u "%~dp0serve.py" 1>>"%~dp0face-service.log" 2>>"%~dp0face-service.err.log"
exit /b 0
