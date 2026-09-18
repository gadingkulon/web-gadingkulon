"""Tarik isi terbaru dari Turso ke salinan lokal, lalu laporkan isinya.

Dipanggil `backup.bat` tepat sebelum folder `data/` disalin. Tanpa langkah ini
yang tersalin adalah keadaan terakhir kali backend jalan di laptop ini —
perubahan yang dikerjakan pengurus lewat web tidak ikut, dan backup-nya tetap
kelihatan berhasil. Itu jenis kegagalan yang baru ketahuan saat datanya
dibutuhkan.

Sengaja BUKAN `db.buka()`: fungsi itu ikut memasang skema dan tambalan kolom,
jadi sekadar mem-backup akan menulis ke database sungguhan. Di sini cuma
`.sync()` (menarik) lalu `SELECT` (membaca).
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.data.db import _path_replika  # noqa: E402

# Diimpor dari `db.py`, bukan disalin ke sini: nama berkas salinan lokal
# ditentukan di satu tempat, kalau tidak dua aturan penamaan bisa berbeda
# diam-diam dan backup-nya menyalin berkas yang salah.

DATABASE = (
    (
        "Data kependudukan",
        settings.DATABASE_FILE,
        settings.TURSO_DATABASE_URL,
        settings.TURSO_AUTH_TOKEN,
        (
            ("warga", "SELECT count(*) FROM penduduk WHERE deletedAt IS NULL"),
            ("akun pengurus", "SELECT count(*) FROM pengurus"),
        ),
    ),
    (
        "Portal publik",
        settings.PORTAL_DATABASE_FILE,
        settings.TURSO_PORTAL_DATABASE_URL,
        settings.TURSO_PORTAL_AUTH_TOKEN,
        (("berita", "SELECT count(*) FROM berita"),),
    ),
)


def main() -> int:
    tersambung = [baris for baris in DATABASE if baris[2] and baris[3]]
    if not tersambung:
        print("  Turso belum disetel di .env, jadi tidak ada yang perlu ditarik.")
        print("  Yang disalin adalah file lokal apa adanya.")
        return 0

    try:
        import libsql
    except ModuleNotFoundError:
        print("  Pustaka libsql belum terpasang, data terbaru tidak bisa ditarik.")
        print(r"  Jalankan backend\start.bat sekali, lalu ulangi backup ini.")
        return 1

    for nama, berkas, url, token, hitungan in tersambung:
        try:
            conn = libsql.connect(
                str(_path_replika(berkas)), sync_url=url, auth_token=token
            )
            conn.sync()
            isi = ", ".join(
                f"{conn.execute(sql).fetchone()[0]} {label}" for label, sql in hitungan
            )
        except Exception as gagal:  # noqa: BLE001 - apa pun sebabnya, backup jalan terus
            print(f"  {nama}: GAGAL ditarik - {gagal}")
            return 1
        print(f"  {nama}: {isi}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
