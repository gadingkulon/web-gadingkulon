@echo off
cd /d "%~dp0"

REM Kerangka .env dibuatkan di sini kalau belum ada — nilai bawaan sudah
REM bisa jalan apa adanya (frontend tidak punya rahasia wajib seperti backend).
if not exist .env (
    > .env echo # SIDUK Frontend — environment variables. Berkas ini TIDAK ikut repo.
    >> .env echo # Daftar lengkap beserta penjelasannya ada di frontend/README.md.
    >> .env echo.
    >> .env echo # Base URL API backend. /api = lewat proxy dev server (vite.config.ts) ke
    >> .env echo # localhost:8000, jadi satu origin, tanpa CORS.
    >> .env echo # Isi URL penuh (mis. http://localhost:8000) hanya kalau memang mau langsung.
    >> .env echo VITE_API_BASE_URL=/api
    >> .env echo.
    >> .env echo # Nama aplikasi (dipakai di title ^& header).
    >> .env echo VITE_APP_NAME=SIDUK
    echo frontend\.env dibuatkan dengan nilai bawaan — langsung bisa jalan.
    echo Kalau perlu menyesuaikan, buka frontend\.env lalu ubah seperlunya.
    echo.
)

call npm install --silent
call npm run dev
pause
