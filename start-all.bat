@echo off
setlocal enabledelayedexpansion
title SIGALON — Launcher
cd /d "%~dp0"

echo ============================================================
echo   Memulai SIGALON (Backend + Frontend)
echo ============================================================
echo.

REM 1. Bersihkan proses lama jika port 8000 atau 5173 masih terpakai
taskkill /F /FI "WINDOWTITLE eq SIGALON Backend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SIGALON Frontend*" /T >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.Name -eq 'python.exe' -or $_.Name -eq 'node.exe') -and $_.CommandLine -like '*SIGALON*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 2. Pastikan backend\.env ada dan ADMIN_PASSWORD terisi
if not exist "backend\.env" (
    echo [INFO] backend\.env belum ada, membuat kerangka otomatis...
    >  "backend\.env" echo # SIGALON Backend - environment variables.
    >> "backend\.env" echo ADMIN_USERNAME=admin
    >> "backend\.env" echo ADMIN_PASSWORD=admin
    >> "backend\.env" echo DATABASE_PATH=./data/sigalon.db
    >> "backend\.env" echo PORTAL_DATABASE_PATH=./data/portal.db
    >> "backend\.env" echo SESI_TTL_JAM=12
    >> "backend\.env" echo CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    echo [OK] backend\.env berhasil dibuat dengan default ADMIN_USERNAME=admin dan ADMIN_PASSWORD=admin.
)

findstr /r /c:"^ADMIN_PASSWORD=..*" backend\.env >nul 2>&1
if errorlevel 1 (
    echo [PERHATIAN] ADMIN_PASSWORD di backend\.env masih kosong!
    set /p ADMIN_PASS="Masukkan password untuk akun Admin [default: admin]: "
    if "!ADMIN_PASS!"=="" set ADMIN_PASS=admin
    >  "backend\.env" echo # SIGALON Backend - environment variables.
    >> "backend\.env" echo ADMIN_USERNAME=admin
    >> "backend\.env" echo ADMIN_PASSWORD=!ADMIN_PASS!
    >> "backend\.env" echo DATABASE_PATH=./data/sigalon.db
    >> "backend\.env" echo PORTAL_DATABASE_PATH=./data/portal.db
    >> "backend\.env" echo SESI_TTL_JAM=12
    >> "backend\.env" echo CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    echo [OK] Password Admin berhasil disimpan ke backend\.env.
)

REM 3. Pastikan virtual environment dan dependensi backend siap
if not exist "backend\.venv\Scripts\python.exe" (
    echo [INFO] Menyiapkan virtual environment backend
    python -m venv backend\.venv
)

echo [INFO] Memeriksa dependensi backend
backend\.venv\Scripts\pip install -q -r backend\requirements.txt

REM 4. Pastikan dependensi frontend siap
if not exist "frontend\node_modules" (
    echo [INFO] Memasang dependensi frontend
    cmd /c "cd frontend && npm install"
)

REM 5. Jalankan Backend dan Frontend di jendela terpisah
echo [INFO] Menjalankan Backend dan Frontend
start "SIGALON Backend" cmd /k "backend\start.bat"
start "SIGALON Frontend" cmd /k "cd frontend && npm run dev"

REM 6. Tunggu backend merespons di port 8000 (maksimal 15 detik)
echo Menunggu backend aktif di port 8000...
set /a TRIES=0
:WAIT_BACKEND
ping 127.0.0.1 -n 2 >nul
curl -s http://127.0.0.1:8000/health >nul 2>&1
if not errorlevel 1 goto BACKEND_READY
set /a TRIES+=1
if !TRIES! geq 15 (
    echo [PERINGATAN] Backend belum merespons setelah 15 detik.
    echo Silakan periksa jendela "SIGALON Backend" untuk melihat pesan error.
    goto RUN_LOCAL
)
goto WAIT_BACKEND

:BACKEND_READY
echo [OK] Backend aktif di http://localhost:8000

:RUN_LOCAL
echo.
echo ============================================================
echo   SIGALON BERJALAN DENGAN SUKSES!
echo ============================================================
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo ============================================================
echo.
echo Membuka browser: http://localhost:5173
start http://localhost:5173
echo.
echo Tekan sembarang tombol di jendela ini untuk mematikan semua server...
pause >nul
goto SHUTDOWN

:SHUTDOWN
echo.
echo Menghentikan semua server SIGALON...
taskkill /F /FI "WINDOWTITLE eq SIGALON Backend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SIGALON Frontend*" /T >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.Name -eq 'python.exe' -or $_.Name -eq 'node.exe') -and $_.CommandLine -like '*SIGALON*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
echo [OK] Semua server telah dimatikan dengan bersih.
ping 127.0.0.1 -n 3 >nul
exit /b 0
