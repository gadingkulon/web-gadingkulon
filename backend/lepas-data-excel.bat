@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "DB=data\sigalon.db"

echo === Lepas data Excel dari SIGALON ===
echo.

if not exist "%DB%" (
    echo Sudah kosong — file %DB% belum ada.
    pause
    exit /b 0
)

for /f %%J in ('.venv\Scripts\python -c "import sqlite3; print(sqlite3.connect(r'%DB%').execute('SELECT count(*) FROM penduduk').fetchone()[0])"') do set "JUMLAH=%%J"

if "%JUMLAH%"=="0" (
    echo Sudah kosong — 0 baris penduduk di database.
    pause
    exit /b 0
)

echo Database sekarang berisi %JUMLAH% baris penduduk.
echo Data ini akan DIKELUARKAN dari sistem — backend kembali kosong sampai
echo diimpor lagi lewat import-excel.bat.
echo.
set /p "JAWAB=Lanjutkan? (ketik y untuk lanjut, apa saja selain itu batal): "

if /i not "%JAWAB%"=="y" (
    echo Dibatalkan, tidak ada yang berubah.
    pause
    exit /b 0
)

for /f "tokens=1-4 delims=/. " %%a in ("%date%") do set "TGL=%%c%%b%%a"
set "JAM=%time::=%"
set "JAM=%JAM: =0%"
set "CADANGAN=data\sigalon-sebelum-lepas-%TGL%-%JAM:~0,6%.db"
copy "%DB%" "%CADANGAN%" >nul
del "%DB%"

echo.
echo Selesai. Backup tersimpan di: %CADANGAN%
echo Restart backend (Ctrl+C lalu jalankan start.bat lagi) supaya perubahan ini kepakai.
pause
