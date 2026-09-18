"""Unggah isi database lokal ke Turso. Sekali jalan, bukan sinkronisasi.

Ada karena perkakas resmi Turso tidak punya versi Windows.

    python -m app.data.unggah_turso                  # dua-duanya
    python -m app.data.unggah_turso kependudukan     # satu saja
    python -m app.data.unggah_turso semua --timpa-semua

Menolak jalan kalau database tujuan sudah berisi, kecuali `--timpa-semua`.
Skemanya disalin dari file sumber, bukan dari konstanta `db.SKEMA_*`.
"""

import sqlite3
import sys
import tempfile
from pathlib import Path

from app.core.config import settings

# Baris dikirim per rombongan, bukan sekaligus: satu `executemany` berisi
# ratusan foto berita ber-base64 bisa menghasilkan satu permintaan raksasa.
_SEROMBONGAN = 200


def _tabel_pengguna(conn: sqlite3.Connection) -> list[str]:
    return [
        r[0]
        for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
            " AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
    ]


_AWALAN_BUAT = (
    "CREATE TABLE ",
    "CREATE UNIQUE INDEX ",
    "CREATE INDEX ",
    "CREATE VIEW ",
    "CREATE TRIGGER ",
)


def _boleh_sudah_ada(sql: str) -> str:
    """Kembalikan `IF NOT EXISTS` yang dibuang SQLite."""
    for awalan in _AWALAN_BUAT:
        if sql.upper().startswith(awalan):
            if "IF NOT EXISTS" in sql[: len(awalan) + 14].upper():
                return sql
            return sql[: len(awalan)] + "IF NOT EXISTS " + sql[len(awalan) :]
    return sql


def _pernyataan_skema(conn: sqlite3.Connection) -> list[str]:
    """Perintah pembuat tabel & indeks dari file sumber, tabel dulu baru indeks."""
    baris = conn.execute(
        "SELECT type, sql FROM sqlite_master"
        " WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'"
    ).fetchall()
    tabel = [_boleh_sudah_ada(sql) for jenis, sql in baris if jenis == "table"]
    indeks = [_boleh_sudah_ada(sql) for jenis, sql in baris if jenis == "index"]
    return tabel + indeks


def _jumlah_baris(conn, tabel: list[str]) -> dict[str, int]:
    return {n: conn.execute(f'SELECT COUNT(*) FROM "{n}"').fetchone()[0] for n in tabel}


def _sambung_turso(url: str, token: str, tmp: Path):
    import libsql

    # Salinan lokal dibuang setelah selesai: berkas ini mengunggah, bukan
    # menjalankan aplikasi. Meninggalkan replika di `data/` cuma bikin dua file
    # mirip yang gampang tertukar saat backup.
    return libsql.connect(str(tmp / "unggahan.db"), sync_url=url, auth_token=token)


def unggah(nama: str, sumber: Path, url: str, token: str, timpa: bool) -> bool:
    """Salin satu database lokal ke Turso. `False` kalau dibatalkan."""
    print(f"\n=== {nama} ===")
    print(f"sumber : {sumber}")

    if not url or not token:
        print("DILEWATI: URL/token-nya belum diisi di backend/.env")
        return False
    if not sumber.exists():
        print("DILEWATI: file sumbernya tidak ada")
        return False

    # Dibuka read-only: yang sedang disalin ini satu-satunya salinan data warga
    # yang ada, dan skrip pengunggah tidak punya urusan menulis ke sana.
    asal = sqlite3.connect(f"file:{sumber}?mode=ro", uri=True)
    try:
        tabel = _tabel_pengguna(asal)
        asal_jumlah = _jumlah_baris(asal, tabel)
        total = sum(asal_jumlah.values())
        print(f"isi    : {len(tabel)} tabel, {total} baris")

        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            tujuan = _sambung_turso(url, token, Path(tmp))
            tujuan.sync()

            for sql in _pernyataan_skema(asal):
                tujuan.execute(sql)
            tujuan.commit()

            sudah_ada = _jumlah_baris(tujuan, tabel)
            terisi = {n: j for n, j in sudah_ada.items() if j}
            if terisi and not timpa:
                print("\nBATAL: database tujuan SUDAH BERISI —", terisi)
                print("Ulangi dengan --timpa-semua kalau memang mau ditimpa.")
                return False

            if terisi:
                print(f"menimpa: mengosongkan {len(terisi)} tabel lebih dulu")
                # Urutan dibalik supaya tabel yang ditunjuk FOREIGN KEY dihapus
                # belakangan.
                for n in reversed(tabel):
                    tujuan.execute(f'DELETE FROM "{n}"')
                tujuan.commit()

            for n in tabel:
                kolom = [r[1] for r in asal.execute(f'PRAGMA table_info("{n}")')]
                if not kolom:
                    continue
                daftar = ", ".join(f'"{k}"' for k in kolom)
                tanya = ", ".join("?" for _ in kolom)
                perintah = f'INSERT INTO "{n}" ({daftar}) VALUES ({tanya})'

                kursor = asal.execute(f'SELECT {daftar} FROM "{n}"')
                terkirim = 0
                while rombongan := kursor.fetchmany(_SEROMBONGAN):
                    tujuan.executemany(perintah, [tuple(b) for b in rombongan])
                    tujuan.commit()
                    terkirim += len(rombongan)
                print(f"  {n:<16} {terkirim:>6} baris")

            tujuan.sync()

            # Diperiksa ulang, bukan diasumsikan: unggahan yang putus di tengah
            # tetap meninggalkan tabel yang terisi separuh dan tidak menimbulkan
            # galat apa pun.
            hasil = _jumlah_baris(tujuan, tabel)
            meleset = {n: (asal_jumlah[n], hasil[n]) for n in tabel if asal_jumlah[n] != hasil[n]}
            tujuan.close()

            if meleset:
                print("\nGAGAL: jumlah baris tidak cocok (lokal, turso) —", meleset)
                return False

        print(f"BERES: {total} baris cocok antara lokal dan Turso")
        return True
    finally:
        asal.close()


def main(argumen: list[str]) -> int:
    timpa = "--timpa-semua" in argumen
    pilihan = [a for a in argumen if not a.startswith("--")]
    mana = (pilihan[0] if pilihan else "semua").lower()

    daftar = {
        "kependudukan": (
            settings.DATABASE_FILE,
            settings.TURSO_DATABASE_URL,
            settings.TURSO_AUTH_TOKEN,
        ),
        "portal": (
            settings.PORTAL_DATABASE_FILE,
            settings.TURSO_PORTAL_DATABASE_URL,
            settings.TURSO_PORTAL_AUTH_TOKEN,
        ),
    }
    if mana not in daftar and mana != "semua":
        print(f"Pilihan tidak dikenal: {mana}. Pakai: kependudukan | portal | semua")
        return 2

    kerjakan = list(daftar) if mana == "semua" else [mana]
    hasil = [unggah(n, *daftar[n], timpa=timpa) for n in kerjakan]

    if not any(hasil):
        print("\nTidak ada yang terunggah.")
        return 1
    print("\nSelesai. Nyalakan backend seperti biasa — sekarang datanya dari Turso.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
