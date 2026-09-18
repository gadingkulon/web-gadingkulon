#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

DEFAULT="../docs/DataPendudukGadingKulon.xlsx"

echo "=== Impor data Excel ke SIGALON ==="
echo
read -p "Path file Excel [Enter = $DEFAULT]: " FILE
FILE="${FILE:-$DEFAULT}"
[ ! -f "$FILE" ] && [ -f "${FILE}.xlsx" ] && FILE="${FILE}.xlsx"

if [ ! -f "$FILE" ]; then
    echo
    echo "File tidak ketemu: $FILE"
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q openpyxl

echo
.venv/bin/python -m app.data.impor_excel "$FILE" --timpa-semua

echo
echo "Selesai. Restart backend (Ctrl+C lalu jalankan start.sh lagi) supaya data ini kepakai."
read -p "Tekan Enter untuk keluar..."
