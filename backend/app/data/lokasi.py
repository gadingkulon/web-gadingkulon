"""Akses data titik lokasi fasilitas dan perangkat desa di tabel `titik_lokasi`."""

import re
import uuid
from typing import Optional

from app.core.config import settings
from app.data import db
from app.schemas.lokasi import TitikLokasi, TitikLokasiBaru, TitikLokasiUbah

_KOLOM = "id, nama, kategori, peran, kategoriLabel, deskripsi, x, y, lat, lon, googleMapsUrl, ikon, urutan"

# Titik lokasi murni dikelola manual oleh Admin via panel admin
TITIK_BAWAAN: list[dict] = []


def _buat_id(nama: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", nama.lower()).strip("-")
    return f"{slug}-{uuid.uuid4().hex[:6]}" if slug else uuid.uuid4().hex[:10]


def seed_bawaan() -> None:
    """Titik lokasi murni diisi secara manual oleh Admin melalui antarmuka admin."""
    pass


def semua() -> list[TitikLokasi]:
    """Mengambil semua titik lokasi terurut kategori dan urutan. Murni membaca isi tabel."""
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        rows = conn.execute(
            f"SELECT {_KOLOM} FROM titik_lokasi ORDER BY kategori ASC, urutan ASC, nama ASC"
        ).fetchall()
    return [TitikLokasi(**dict(r)) for r in rows]


def ambil(id: str) -> Optional[TitikLokasi]:
    """Mengambil satu titik lokasi berdasarkan ID."""
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        row = conn.execute(
            f"SELECT {_KOLOM} FROM titik_lokasi WHERE id = ?", (id,)
        ).fetchone()
    return TitikLokasi(**dict(row)) if row else None


def tambah(baru: TitikLokasiBaru) -> TitikLokasi:
    """Menambahkan titik lokasi baru."""
    data = baru.model_dump()
    if not data.get("id"):
        data["id"] = _buat_id(data["nama"])

    kolom_list = [k.strip() for k in _KOLOM.split(",")]
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        conn.execute(
            f"INSERT INTO titik_lokasi ({_KOLOM}) VALUES "
            f"({', '.join(':' + k for k in kolom_list)})",
            data,
        )
        conn.commit()
    return TitikLokasi(**data)


def ubah(id: str, perubahan: TitikLokasiUbah) -> Optional[TitikLokasi]:
    """Memperbarui titik lokasi yang ada."""
    ada = ambil(id)
    if not ada:
        return None

    update_dict = perubahan.model_dump(exclude_unset=True)
    if not update_dict:
        return ada

    set_klausa = ", ".join(f"{k} = :{k}" for k in update_dict)
    update_dict["id"] = id

    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        conn.execute(
            f"UPDATE titik_lokasi SET {set_klausa} WHERE id = :id",
            update_dict,
        )
        conn.commit()

    return ambil(id)


def hapus(id: str) -> bool:
    """Menghapus satu titik lokasi berdasarkan ID."""
    with db.koneksi(settings.PORTAL_DATABASE_FILE) as conn:
        cursor = conn.execute("DELETE FROM titik_lokasi WHERE id = ?", (id,))
        conn.commit()
    return cursor.rowcount > 0


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
            assert len(semua()) == 0, "DB baru harus mulai dengan 0 titik"

            # Uji tambah titik manual oleh admin
            baru = tambah(TitikLokasiBaru(
                nama="Gardu Ronda RT 01",
                kategori="fasilitas",
                kategoriLabel="Keamanan Lingkungan",
                deskripsi="Gardu pos jaga malam",
                x=15.0,
                y=60.0,
                lat=-7.6575,
                lon=110.3602,
                ikon="poskamling",
            ))
            assert baru.id is not None
            assert ambil(baru.id) is not None
            assert len(semua()) == 1

            ubah(baru.id, TitikLokasiUbah(x=20.0, y=65.0))
            terubah = ambil(baru.id)
            assert terubah is not None and terubah.x == 20.0 and terubah.y == 65.0

            assert hapus(baru.id) is True
            assert ambil(baru.id) is None
            assert len(semua()) == 0, "Setelah dihapus harus kembali 0 titik dan tidak ada yang bangkit otomatis"

            # Pastikan panggil seed_bawaan tidak pernah menambah apapun
            seed_bawaan()
            assert len(semua()) == 0

            print("OK: app/data/lokasi.py")
        finally:
            settings.PORTAL_DATABASE_PATH = jalur_lama


if __name__ == "__main__":
    demo()
