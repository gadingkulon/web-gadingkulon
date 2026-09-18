@echo off
cd /d "%~dp0"

REM Backend menolak jalan tanpa ADMIN_USERNAME & ADMIN_PASSWORD pada database
REM kosong. Kerangka .env dibuatkan di sini kalau belum ada — dengan nilai
REM KOSONG, bukan contoh yang berlaku.
if not exist .env (
    > .env echo # SIGALON Backend — environment variables. Berkas ini TIDAK ikut repo.
    >> .env echo # Daftar lengkap beserta penjelasannya ada di backend/README.md.
    >> .env echo.
    >> .env echo # Akun Admin pertama. WAJIB diisi sebelum backend pertama kali dijalankan.
    >> .env echo # Dipakai sekali — setelah akunnya terbentuk, mengubahnya tidak berpengaruh.
    >> .env echo ADMIN_USERNAME=admin
    >> .env echo ADMIN_PASSWORD=admin
    >> .env echo.
    >> .env echo # Path file SQLite, relatif dari folder backend/. Jangan pernah di-commit.
    >> .env echo DATABASE_PATH=./data/sigalon.db
    >> .env echo PORTAL_DATABASE_PATH=./data/portal.db
    >> .env echo.
    >> .env echo # Umur sesi login, dalam jam.
    >> .env echo SESI_TTL_JAM=12
    >> .env echo.
    >> .env echo # Asal yang boleh memanggil API, dipisah koma ^(bukan JSON^).
    >> .env echo CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    echo backend\.env baru saja dibuatkan dengan default ADMIN_USERNAME=admin dan ADMIN_PASSWORD=admin.
    echo.
)

if not exist .venv\Scripts\python.exe python -m venv .venv
.venv\Scripts\pip install -q -r requirements.txt
.venv\Scripts\uvicorn app.main:app --reload --port 8000
pause
