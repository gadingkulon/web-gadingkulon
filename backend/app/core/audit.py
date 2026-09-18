"""Jejak perubahan: siapa mengubah apa, kapan, dari apa jadi apa.

Tersimpan permanen di tabel `audit_log`, sekaligus dicetak ke console.
"""

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.data import db


# Aksi atas data warga — dibaca pengurus, disaring per wilayah.
AKSI_WARGA = ("ubah-warga", "tambah-warga", "hapus-warga")
# Aksi milik Admin — dibaca Admin. Sebagian besar soal akun; berita ikut di
# sini karena isi portal juga kewenangannya. Dua daftar ini berpotongan kosong,
# sama seperti kewenangan yang menghasilkannya.
AKSI_AKUN = (
    "tambah-pengurus",
    "isi-lpm",
    "ubah-lpm",
    "reset-password",
    "tambah-berita",
    "ubah-berita",
    "hapus-berita",
    "ubah-padukuhan",
    "tambah-titik-lokasi",
    "ubah-titik-lokasi",
    "hapus-titik-lokasi",
    "muat-bawaan-titik-lokasi",
)

# Riwayat audit lebih tua dari ini dihapus otomatis. 180 hari (≈6 bulan) cukup
# untuk penelusuran sengketa data di level padukuhan; yang lebih lama jarang
# sekali dibuka dan hanya menambah berat DB.
RETENSI_AUDIT_HARI = 180


def _pangkas_audit_lama() -> None:
    """Buang entri audit_log yang lebih tua dari `RETENSI_AUDIT_HARI`."""
    batas = (
        datetime.now(timezone.utc) - timedelta(days=RETENSI_AUDIT_HARI)
    ).isoformat(timespec="seconds")
    with db.koneksi(settings.DATABASE_FILE) as conn:
        with conn:
            conn.execute("DELETE FROM audit_log WHERE waktu < ?", (batas,))


def catat_audit(
    *,
    aktor: str,
    aksi: str,
    sasaran: str,
    sasaran_id: str | None = None,
    perubahan: str = "",
) -> None:
    """`sasaran` = nama atau username yang dikenai tindakan — yang dibaca orang."""
    waktu = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with db.koneksi(settings.DATABASE_FILE) as conn:
        with conn:
            conn.execute(
                "INSERT INTO audit_log (waktu, aktor, aksi, sasaran, sasaran_id,"
                " perubahan) VALUES (?, ?, ?, ?, ?, ?)",
                (waktu, aktor, aksi, sasaran, sasaran_id, perubahan or None),
            )
    _pangkas_audit_lama()
    ekor = f" ({perubahan})" if perubahan else ""
    print(f"[AUDIT] {aktor} melakukan '{aksi}' pada {sasaran}{ekor}")


def riwayat(aksi: tuple[str, ...] = (), batas: int = 200) -> list[dict]:
    """Catatan terbaru lebih dulu, disaring per jenis aksi."""
    sql = "SELECT * FROM audit_log"
    args: list[object] = []
    if aksi:
        sql += f" WHERE aksi IN ({','.join('?' * len(aksi))})"
        args += list(aksi)
    sql += " ORDER BY id DESC LIMIT ?"
    args.append(batas)
    with db.koneksi(settings.DATABASE_FILE) as conn:
        return [dict(r) for r in conn.execute(sql, args)]
