#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Backend menolak jalan tanpa ADMIN_USERNAME & ADMIN_PASSWORD pada database
# kosong. Kerangka `.env` dibuatkan di sini kalau belum ada — dengan nilai
# KOSONG, bukan contoh yang berlaku: password contoh yang tersalin diam-diam
# berhenti jadi contoh dan berubah jadi password Admin yang sungguhan.
if [ ! -f .env ]; then
  cat > .env <<'ISI'
# SIGALON Backend — environment variables. Berkas ini TIDAK ikut repo.
# Daftar lengkap beserta penjelasannya ada di backend/README.md.

# Akun Admin pertama. WAJIB diisi sebelum backend pertama kali dijalankan:
# tanpa ini tidak ada satu pun akun yang bisa masuk. Dipakai sekali — setelah
# akunnya terbentuk, mengubah nilai ini tidak berpengaruh apa-apa.
ADMIN_USERNAME=
ADMIN_PASSWORD=

# Path file SQLite, relatif dari folder backend/. Jangan pernah di-commit.
DATABASE_PATH=./data/sigalon.db
PORTAL_DATABASE_PATH=./data/portal.db

# Umur sesi login, dalam jam.
SESI_TTL_JAM=12

# Asal yang boleh memanggil API, dipisah koma (bukan JSON).
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ISI
  cat >&2 <<'PESAN'
backend/.env baru saja dibuatkan, tapi ADMIN_USERNAME dan ADMIN_PASSWORD masih
kosong — backend tidak akan jalan sebelum keduanya diisi.

Buka backend/.env, isi dua baris itu dengan nilai sungguhan, lalu jalankan lagi.
PESAN
  exit 1
fi

[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
