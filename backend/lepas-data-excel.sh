#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

DB="data/sigalon.db"

echo "=== Lepas data Excel dari SIGALON ==="
echo

if [ ! -f "$DB" ]; then
    echo "Sudah kosong — file $DB belum ada."
    read -p "Tekan Enter untuk keluar..."
    exit 0
fi

JUMLAH=$(.venv/bin/python -c "
import sqlite3
c = sqlite3.connect('$DB')
print(c.execute('SELECT count(*) FROM penduduk').fetchone()[0])
")

if [ "$JUMLAH" = "0" ]; then
    echo "Sudah kosong — 0 baris penduduk di database."
    read -p "Tekan Enter untuk keluar..."
    exit 0
fi

echo "Database sekarang berisi $JUMLAH baris penduduk."
echo "Data ini akan DIKELUARKAN dari sistem — backend kembali kosong sampai"
echo "diimpor lagi lewat import-excel.sh."
echo
read -p "Lanjutkan? (ketik y untuk lanjut, apa saja selain itu batal): " JAWAB

if [ "$JAWAB" != "y" ] && [ "$JAWAB" != "Y" ]; then
    echo "Dibatalkan, tidak ada yang berubah."
    read -p "Tekan Enter untuk keluar..."
    exit 0
fi

CADANGAN="data/sigalon-sebelum-lepas-$(date +%Y%m%d-%H%M%S).db"
cp "$DB" "$CADANGAN"
rm "$DB"

echo
echo "Selesai. Backup tersimpan di: $CADANGAN"
echo "Restart backend (Ctrl+C lalu jalankan start.sh lagi) supaya perubahan ini kepakai."
read -p "Tekan Enter untuk keluar..."
