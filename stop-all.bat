@echo off
title SIGALON — Stop All Servers
cd /d "%~dp0"

echo ============================================================
echo   Menghentikan Semua Layanan SIGALON...
echo ============================================================
echo.

echo [1/2] Menutup jendela Backend dan Frontend...
taskkill /F /FI "WINDOWTITLE eq SIGALON Backend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SIGALON Frontend*" /T >nul 2>&1

echo [2/2] Membebaskan port 8000 dan 5173...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.Name -eq 'python.exe' -or $_.Name -eq 'node.exe') -and $_.CommandLine -like '*SIGALON*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo.
echo ============================================================
echo   [OK] Backend (port 8000) dan Frontend (port 5173) dihentikan!
echo ============================================================
ping 127.0.0.1 -n 3 >nul
