@echo off
setlocal enabledelayedexpansion
title SIGALON - Backup
cd /d "%~dp0"

echo.
echo ============================================================
echo   BACKUP SIGALON
echo ============================================================
echo.

REM Tujuan bawaan: folder DI SEBELAH proyek, bukan di dalamnya. Salinan data
REM warga yang disimpan di dalam folder proyek gampang ikut terkirim ke GitHub
REM tanpa ada yang menyadari.
REM
REM Mau ke flashdisk? Jalankan lewat terminal:  backup.bat E:\SIGALON-backup
set "TUJUAN=%~1"
if "%TUJUAN%"=="" set "TUJUAN=%~dp0..\SIGALON-backup"

REM Tanggalnya diambil lewat PowerShell, bukan %DATE%: format %DATE% ikut
REM setelan bahasa Windows, jadi nama foldernya bisa berantakan di komputer
REM lain.
set "STAMP="
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd-HHmm"`) do set "STAMP=%%s"
if "%STAMP%"=="" (
    echo [GAGAL] Tanggal hari ini tidak terbaca, backup dibatalkan.
    goto :selesai
)

set "FOLDER=%TUJUAN%\backup-%STAMP%"
echo Tujuan: %FOLDER%
echo.

mkdir "%FOLDER%" 2>nul
if not exist "%FOLDER%" (
    echo [GAGAL] Folder tujuan tidak bisa dibuat.
    echo         Kalau tujuannya flashdisk atau hard disk luar, pastikan sudah tercolok.
    goto :selesai
)

set "PERINGATAN="

echo [1/4] Menarik data terbaru dari internet...
if exist "backend\.venv\Scripts\python.exe" (
    "backend\.venv\Scripts\python.exe" "backend\tools\segarkan_replika.py"
    if errorlevel 1 set "PERINGATAN=1"
) else (
    echo   Python backend belum terpasang, langkah ini dilewati.
    set "PERINGATAN=1"
)
echo.

echo [2/4] Menyalin data warga, akun, berita, dan foto...
REM /XD cadangan-sebelum-turso: isinya salinan lama yang tidak berubah lagi.
REM Ikut tersalin tiap kali cuma bikin tiap backup makin gemuk tanpa guna.
robocopy "backend\data" "%FOLDER%\data" /E /XD cadangan-sebelum-turso /NFL /NDL /NJH /NJS /R:1 /W:1 >nul
if errorlevel 8 (
    echo [GAGAL] Data gagal disalin. Cek sisa ruang di drive tujuan.
    goto :selesai
)
echo   Selesai.
echo.

echo [3/4] Menyalin file kunci dan data pendataan asli...
if exist "backend\.env" (
    copy /Y "backend\.env" "%FOLDER%\backend-env.txt" >nul
    echo   File kunci tersalin.
) else (
    echo   backend\.env tidak ketemu, dilewati.
)
if exist "docs\*.xlsx" copy /Y "docs\*.xlsx" "%FOLDER%\" >nul
echo   Selesai.
echo.

echo [4/4] Menulis catatan isi backup...
set "CATATAN=%FOLDER%\BACA-AKU.txt"
>  "%CATATAN%" echo BACKUP SIGALON - %STAMP%
>> "%CATATAN%" echo.
>> "%CATATAN%" echo ISI FOLDER INI
>> "%CATATAN%" echo.
>> "%CATATAN%" echo   data\             data warga, akun pengurus, berita, dan foto berita
>> "%CATATAN%" echo   backend-env.txt   file kunci: password admin pertama dan kunci ke
>> "%CATATAN%" echo                     database yang di internet
>> "%CATATAN%" echo   file .xlsx        data pendataan asli dari desa
>> "%CATATAN%" echo.
>> "%CATATAN%" echo.
>> "%CATATAN%" echo KALAU SUATU SAAT PERLU DIPULIHKAN
>> "%CATATAN%" echo.
>> "%CATATAN%" echo   Kalau file di laptop yang rusak atau hilang:
>> "%CATATAN%" echo     1. Copy folder data\ dari sini ke backend\data\ di proyek
>> "%CATATAN%" echo     2. Copy backend-env.txt ke folder backend\, ganti namanya jadi .env
>> "%CATATAN%" echo     3. Jalankan start-all.bat
>> "%CATATAN%" echo.
>> "%CATATAN%" echo   Kalau data yang di internet yang bermasalah:
>> "%CATATAN%" echo     Tidak bisa sekadar copy-paste, datanya harus diunggah ulang.
>> "%CATATAN%" echo     Langkahnya ada di backend\README.md, bagian "Pindah ke Turso".
>> "%CATATAN%" echo.
>> "%CATATAN%" echo.
>> "%CATATAN%" echo PENTING
>> "%CATATAN%" echo.
>> "%CATATAN%" echo   Folder ini berisi data pribadi ratusan warga dan kunci masuk ke
>> "%CATATAN%" echo   database. Simpan di tempat yang butuh password untuk dibuka.
>> "%CATATAN%" echo   Jangan taruh di GitHub, jangan di Drive yang linknya dibagikan,
>> "%CATATAN%" echo   jangan dikirim ke grup WhatsApp.
echo   Selesai.

echo.
echo ============================================================
echo   BACKUP SELESAI
echo ============================================================
echo.
echo Tersimpan di:
echo   %FOLDER%
echo.
if defined PERINGATAN (
    echo [PERHATIAN] Data terbaru dari internet tidak berhasil ditarik.
    echo             Yang tersalin adalah keadaan terakhir kali backend jalan
    echo             di laptop ini. Cek internet, lalu ulangi backup ini.
    echo.
)
set "JUMLAH=0"
for /f %%n in ('dir /b /ad "%TUJUAN%\backup-*" 2^>nul ^| find /c /v ""') do set "JUMLAH=%%n"
echo Backup tersimpan di folder itu: %JUMLAH% buah.
echo Kalau sudah lebih dari 5, hapus yang paling lama supaya tidak menumpuk.
echo.
echo Jangan lupa salin folder ini ke flashdisk atau hard disk lain.
echo Backup yang cuma ada di satu laptop ikut hilang kalau laptopnya hilang.

:selesai
echo.
pause
endlocal
