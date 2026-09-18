#!/usr/bin/env bash
# Nyalakan backend + frontend sekaligus, lokal saja (localhost:8000 + :5173).
# Ctrl+C mematikan keduanya.
set -e
cd "$(dirname "$0")"

# Diperiksa SEBELUM apa pun dinyalakan. Kalau tidak, backend mati sendirian
# sementara frontend tetap jalan — yang terlihat halaman terbuka normal dengan
# login yang gagal terus, dan sebabnya tertimbun output Vite.
if ! grep -qE '^ADMIN_PASSWORD=.+' backend/.env 2>/dev/null; then
  cat >&2 <<'PESAN'
backend/.env belum siap — ADMIN_USERNAME dan ADMIN_PASSWORD harus diisi dulu.
Jalankan ./backend/start.sh sekali untuk membuatkan kerangkanya.
PESAN
  exit 1
fi

[ -d frontend/node_modules ] || (cd frontend && npm install)

trap 'kill 0' EXIT

./backend/start.sh &
(cd frontend && npm run dev) &

# Beri dev server waktu bind ke 5173 sebelum dipastikan hidup.
sleep 5

# `/dev/tcp` bawaan bash, jadi tidak perlu curl. Tanpa pemeriksaan ini, backend
# yang mati karena sebab lain (port 8000 dipakai proses lama, dependensi gagal
# dipasang) tetap menghasilkan tampilan yang kelihatan jalan.
if ! (echo > /dev/tcp/127.0.0.1/8000) 2>/dev/null; then
  echo "" >&2
  echo "Backend tidak menyala di port 8000 — lihat pesannya di atas." >&2
  echo "Yang paling sering: port 8000 masih dipakai proses lama." >&2
  exit 1
fi

echo ""
echo "SIGALON berjalan:"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  API Docs : http://localhost:8000/docs"
echo ""
echo "Tekan Ctrl+C untuk mematikan semua server."

# Menahan skrip tetap hidup selama backend/frontend jalan di latar belakang.
# Ctrl+C memicu trap di atas, yang mematikan keduanya sekaligus.
wait
