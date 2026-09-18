"""Sesi login yang tersimpan di server."""

import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.data import db

# Panjang token: 32 byte acak, jadi menebaknya bukan pilihan.
_PANJANG_TOKEN = 32


def _sekarang() -> datetime:
    return datetime.now(timezone.utc)


def buat(pengurus_id: str) -> str:
    """Mulai sesi baru, kembalikan tokennya."""
    token = secrets.token_urlsafe(_PANJANG_TOKEN)
    sekarang = _sekarang()
    kedaluwarsa = sekarang + timedelta(hours=settings.SESI_TTL_JAM)
    with db.koneksi(settings.DATABASE_FILE) as conn:
        with conn:
            conn.execute(
                "DELETE FROM sesi WHERE kedaluwarsa_pada < ?",
                (sekarang.isoformat(),),
            )
            conn.execute(
                "INSERT INTO sesi (token, pengurus_id, dibuat_pada,"
                " kedaluwarsa_pada) VALUES (?, ?, ?, ?)",
                (
                    token,
                    pengurus_id,
                    sekarang.isoformat(timespec="seconds"),
                    kedaluwarsa.isoformat(timespec="seconds"),
                ),
            )
    return token


def pemilik(token: str) -> str | None:
    """`pengurus_id` pemilik sesi ini, atau `None` kalau tidak ada / kedaluwarsa.

    Sesi yang lewat umurnya langsung dihapus, bukan sekadar ditolak: kalau cuma
    ditolak, tabelnya tumbuh terus dan tidak ada yang membersihkannya.
    """
    with db.koneksi(settings.DATABASE_FILE) as conn:
        row = conn.execute("SELECT * FROM sesi WHERE token = ?", (token,)).fetchone()
        if row is None:
            return None
        if datetime.fromisoformat(row["kedaluwarsa_pada"]) < _sekarang():
            with conn:
                conn.execute("DELETE FROM sesi WHERE token = ?", (token,))
            return None
        return row["pengurus_id"]


def akhiri(token: str) -> bool:
    """Cabut satu sesi (Keluar). `False` kalau tokennya memang sudah tidak ada."""
    with db.koneksi(settings.DATABASE_FILE) as conn:
        with conn:
            cur = conn.execute("DELETE FROM sesi WHERE token = ?", (token,))
    return cur.rowcount > 0


def akhiri_semua(pengurus_id: str, kecuali: str | None = None) -> int:
    """Cabut seluruh sesi satu akun, kembalikan berapa yang dicabut.

    `kecuali` menyisakan satu sesi — dipakai saat orangnya sendiri mengganti
    password: ia tidak perlu ikut terlempar keluar oleh perbuatannya sendiri,
    tapi sesi lain yang mungkin bukan miliknya harus putus.
    """
    with db.koneksi(settings.DATABASE_FILE) as conn:
        with conn:
            if kecuali:
                cur = conn.execute(
                    "DELETE FROM sesi WHERE pengurus_id = ? AND token != ?",
                    (pengurus_id, kecuali),
                )
            else:
                cur = conn.execute(
                    "DELETE FROM sesi WHERE pengurus_id = ?", (pengurus_id,)
                )
    return cur.rowcount


def demo() -> None:
    """Self-check. Jalankan dengan DB sekali pakai:

        DATABASE_PATH=/tmp/uji-sesi.db .venv/bin/python -m app.data.sesi
    """
    # Turso dimatikan dulu: cek mandiri ini menghapus & menimpa isi tabel,
    # dan itu tidak boleh sampai mengenai database sungguhan di cloud.
    db.paksa_lokal()
    from app.data import pengurus as pg

    a = pg.tambah("uji-a", "rahasia12", "A", pg.ROLE_DUKUH)
    b = pg.tambah("uji-b", "rahasia12", "B", pg.ROLE_RW, rw="019")

    t1 = buat(a.id)
    t2 = buat(a.id)
    t3 = buat(b.id)
    assert len({t1, t2, t3}) == 3, "token harus unik"
    assert pemilik(t1) == a.id
    assert pemilik("bukan-token") is None, "token karangan harus ditolak"

    # Keluar mencabut satu sesi saja, bukan semuanya.
    assert akhiri(t1) is True
    assert pemilik(t1) is None
    assert pemilik(t2) == a.id, "sesi lain ikut mati"
    assert akhiri(t1) is False, "mencabut sesi yang sudah tidak ada"

    # Ganti password: sesi lain putus, punya sendiri tetap.
    t4 = buat(a.id)
    assert akhiri_semua(a.id, kecuali=t4) == 1
    assert pemilik(t4) == a.id and pemilik(t2) is None
    assert pemilik(t3) == b.id, "sesi akun lain tidak boleh ikut tercabut"

    # Sesi kedaluwarsa ditolak DAN dibuang.
    from app.core.config import settings as s
    lampau = (_sekarang() - timedelta(hours=1)).isoformat(timespec="seconds")
    with db.koneksi(s.DATABASE_FILE) as conn:
        with conn:
            conn.execute(
                "UPDATE sesi SET kedaluwarsa_pada = ? WHERE token = ?", (lampau, t4)
            )
    assert pemilik(t4) is None, "sesi kedaluwarsa harus ditolak"
    with db.koneksi(s.DATABASE_FILE) as conn:
        sisa = conn.execute("SELECT 1 FROM sesi WHERE token = ?", (t4,)).fetchone()
    assert sisa is None, "sesi kedaluwarsa harus ikut dibuang"

    assert akhiri_semua(b.id) == 1 and pemilik(t3) is None
    print("OK: app/data/sesi.py")


if __name__ == "__main__":
    demo()
