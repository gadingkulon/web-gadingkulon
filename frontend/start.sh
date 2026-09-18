#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Kerangka `.env` dibuatkan di sini kalau belum ada — nilai bawaan sudah
# bisa jalan apa adanya (frontend tidak punya rahasia wajib seperti backend).
if [ ! -f .env ]; then
  cat > .env <<'ISI'
# SIGALON Frontend — environment variables. Berkas ini TIDAK ikut repo.
# Daftar lengkap beserta penjelasannya ada di frontend/README.md.

# Base URL API backend. `/api` = lewat proxy dev server (vite.config.ts) ke
# localhost:8000, jadi satu origin, tanpa CORS.
# Isi URL penuh (mis. http://localhost:8000) hanya kalau memang mau langsung.
VITE_API_BASE_URL=/api

# Nama aplikasi (dipakai di title & header).
VITE_APP_NAME=SIGALON
ISI
  echo "frontend/.env dibuatkan dengan nilai bawaan — langsung bisa jalan."
  echo "Kalau perlu menyesuaikan, buka frontend/.env lalu ubah seperlunya."
  echo
fi

npm install --silent
npm run dev
