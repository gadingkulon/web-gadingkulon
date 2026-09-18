"""Keterangan tetap padukuhan: satu baris tunggal di tabel `padukuhan`."""

from app.core.config import settings
from app.data import db
from app.schemas.padukuhan import Padukuhan

_KOLOM = (
    "nama, namaLengkap, desa, kapanewon, kabupaten, provinsi, luasWilayah,"
    " telepon, email, sejarah, batasUtara, batasTimur, batasSelatan, batasBarat"
)


def ambil() -> Padukuhan | None:
    """Keterangan yang tersimpan, atau `None` kalau Admin belum pernah menyimpan."""
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        row = conn.execute(f"SELECT {_KOLOM} FROM padukuhan WHERE id = 1").fetchone()
    return Padukuhan(**dict(row)) if row else None


def ubah(baru: Padukuhan) -> Padukuhan:
    """Simpan seluruh keterangan sekaligus, bukan per kolom."""
    kolom = [k.strip() for k in _KOLOM.split(",")]
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        conn.execute(
            f"INSERT INTO padukuhan (id, {_KOLOM}) VALUES"
            f" (1, {', '.join(':' + k for k in kolom)})"
            f" ON CONFLICT(id) DO UPDATE SET"
            f" {', '.join(f'{k} = excluded.{k}' for k in kolom)}",
            baru.model_dump(),
        )
        conn.commit()
    return baru


def demo() -> None:
    """Self-check menggunakan DB sementara yang terisolasi."""
    # Turso dimatikan dulu: cek mandiri ini menghapus & menimpa isi tabel,
    # dan itu tidak boleh sampai mengenai database sungguhan di cloud.
    db.paksa_lokal()
    import tempfile
    from pathlib import Path

    jalur_lama = settings.PORTAL_DATABASE_PATH
    with tempfile.TemporaryDirectory() as tmp:
        settings.PORTAL_DATABASE_PATH = str(Path(tmp) / "portal_uji.db")
        try:
            assert ambil() is None, "DB uji harus mulai tanpa baris padukuhan"

            def contoh(**ganti: str) -> Padukuhan:
                dasar = dict(
                    nama="Gading Kulon", namaLengkap="Padukuhan Gading Kulon",
                    desa="Donokerto", kapanewon="Kapanewon Turi", kabupaten="Sleman",
                    provinsi="Daerah Istimewa Yogyakarta", luasWilayah="162,4 ha",
                    telepon="+62 812-2761-391", email="gadingkulon@gmail.com",
                    sejarah="Padukuhan di lereng Merapi yang hidup dari pertanian.",
                    batasUtara="Gading Lor", batasTimur="Gading Wetan",
                    batasSelatan="Ngipak", batasBarat="Banyusoco",
                )
                return Padukuhan(**{**dasar, **ganti})

            assert ubah(contoh()).telepon == "+62 812-2761-391"
            tersimpan = ambil()
            assert tersimpan is not None and tersimpan.desa == "Donokerto"

            # Menyimpan lagi menimpa baris yang sama, bukan menambah baris kedua.
            ubah(contoh(telepon="+62 811-0000-000"))
            with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
                baris = conn.execute("SELECT COUNT(*) FROM padukuhan").fetchone()
            assert baris is not None and baris[0] == 1, baris
            lagi = ambil()
            assert lagi is not None and lagi.telepon == "+62 811-0000-000"

            for salah in ({"nama": "   "}, {"email": "bukan-surel"}, {"sejarah": "pendek"}):
                try:
                    contoh(**salah)
                except ValueError:
                    pass
                else:
                    raise AssertionError(f"seharusnya ditolak: {salah}")

            print("OK: app/data/padukuhan.py")
        finally:
            settings.PORTAL_DATABASE_PATH = jalur_lama


if __name__ == "__main__":
    demo()
