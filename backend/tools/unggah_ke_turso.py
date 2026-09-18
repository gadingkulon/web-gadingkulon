"""Salin isi berkas `.db` lokal ke Turso, sekali, saat pindah ke cloud.

Dipakai ketika database sudah terlanjur berisi di laptop (akun pengurus,
berita, riwayat mutasi) tapi Turso masih kosong. Mengimpor ulang dari Excel
BUKAN gantinya: yang kembali cuma tabel `penduduk`, sedangkan akun, berita,
dan riwayat mutasi tidak ada di file Excel mana pun.

Menolak jalan kalau tabel tujuan sudah berisi. Alat ini untuk pindahan sekali,
bukan penyelaras dua arah — menjalankannya di atas data yang sudah hidup akan
menggandakan baris, bukan memperbaruinya.

Jalankan dari folder `backend`, dengan `TURSO_*` terisi di `.env`:

    python -m tools.unggah_ke_turso            # lihat rencananya, tidak menulis
    python -m tools.unggah_ke_turso --tulis    # benar-benar menyalin
"""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.data import db  # noqa: E402

# Urutannya mengikuti FOREIGN KEY: `persetujuan` menunjuk `pengajuan` dan
# `pengurus`, `audit_log` menunjuk `pengurus`. Menyalin anak sebelum induknya
# ditolak SQLite, dan `db.buka()` memang menyalakan `foreign_keys`.
TABEL_KEPENDUDUKAN = (
    "penduduk",
    "pengurus",
    "pengajuan",
    "persetujuan",
    "mutasi",
    "audit_log",
)

# `sesi` sengaja tidak ikut: isinya token login yang menempel pada proses lama.
# Yang tertinggal cuma memaksa pengurus login sekali lagi, dan itu memang yang
# diinginkan saat pindah server.
TABEL_PORTAL = ("padukuhan", "lpm", "portal_meta", "berita", "titik_lokasi")

RENCANA = (
    ("Data kependudukan", settings.DATABASE_FILE, TABEL_KEPENDUDUKAN),
    ("Portal publik", settings.PORTAL_DATABASE_FILE, TABEL_PORTAL),
)


def _kolom(conn, tabel: str) -> list[str]:
    return [str(baris[1]) for baris in conn.execute(f"PRAGMA table_info({tabel})")]


def _punya_tabel(conn, tabel: str) -> bool:
    sql = "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?"
    return conn.execute(sql, (tabel,)).fetchone() is not None


def _salin(nama: str, berkas: Path, tabel: tuple[str, ...], tulis: bool) -> int:
    if not berkas.exists():
        print(f"{nama}: berkas lokal {berkas.name} tidak ada, dilewati.")
        return 0

    sumber = sqlite3.connect(berkas)
    sumber.row_factory = sqlite3.Row
    try:
        # Dua `with` dan keduanya perlu. Yang luar meminjam koneksinya; yang
        # dalam adalah blok transaksinya — `db.koneksi()` sendiri TIDAK
        # meng-commit untuk Turso, jadi tanpa ini setiap INSERT menggantung
        # lalu hilang tanpa satu pesan galat pun.
        with db.koneksi(berkas) as tujuan, tujuan:
            # Seluruh tabel diperiksa DULU, sebelum satu baris pun ditulis.
            # Kalau pemeriksaannya disisipkan di tengah penyalinan, tabel yang
            # sudah lewat terlanjur ter-commit dan percobaan berikutnya ditolak
            # oleh separuh datanya sendiri.
            for satu in tabel:
                if not _punya_tabel(sumber, satu):
                    continue
                sudah = tujuan.execute(f"SELECT count(*) FROM {satu}").fetchone()[0]
                if sudah:
                    print(f"  {satu}: TOLAK - sudah berisi {sudah} baris di Turso.")
                    return 1

            for satu in tabel:
                if not _punya_tabel(sumber, satu):
                    continue

                baris = sumber.execute(f"SELECT * FROM {satu}").fetchall()
                if not baris:
                    print(f"  {satu}: kosong di lokal, dilewati.")
                    continue

                # Kolom yang ada di kedua sisi saja. Berkas lokal bisa tertinggal
                # satu tambalan kolom dari skema sekarang; yang tidak ada di
                # sumber dibiarkan memakai nilai bawaannya.
                kolom = [k for k in _kolom(sumber, satu) if k in _kolom(tujuan, satu)]
                tanya = ", ".join("?" for _ in kolom)
                sql = f"INSERT INTO {satu} ({', '.join(kolom)}) VALUES ({tanya})"
                isi = [tuple(r[k] for k in kolom) for r in baris]

                if tulis:
                    tujuan.executemany(sql, isi)
                print(f"  {satu}: {len(isi)} baris" + ("" if tulis else " (rencana)"))
    finally:
        sumber.close()

    return 0


def main() -> int:
    tulis = "--tulis" in sys.argv

    if not db.turso_aktif():
        print("Turso tidak aktif — isi TURSO_* di backend/.env dulu.")
        print("Tanpa itu skrip ini cuma akan menyalin berkas ke dirinya sendiri.")
        return 1

    for nama, berkas, tabel in RENCANA:
        print(nama)
        gagal = _salin(nama, berkas, tabel, tulis)
        if gagal:
            return gagal

    if tulis:
        print("\nSelesai. Cek ulang jumlahnya lewat dashboard Turso.")
    else:
        print("\nBelum ada yang ditulis. Ulangi dengan --tulis kalau angkanya benar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
