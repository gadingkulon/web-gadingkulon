"""Titik lokasi fasilitas dan perangkat desa: dibaca siapa saja, dikelola ADMIN."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.routers.auth import current_admin
from app.core.audit import catat_audit
from app.data import lokasi as data
from app.schemas.auth import AuthUser
from app.schemas.lokasi import TitikLokasi, TitikLokasiBaru, TitikLokasiUbah

router = APIRouter(tags=["lokasi"])


@router.get("/publik/titik-lokasi", response_model=list[TitikLokasi])
def daftar_titik_lokasi_publik() -> list[TitikLokasi]:
    """Semua titik lokasi fasilitas & perangkat desa untuk publik. Tanpa auth."""
    return data.semua()


@router.get("/titik-lokasi", response_model=list[TitikLokasi])
def daftar_titik_lokasi_admin(admin: AuthUser = Depends(current_admin)) -> list[TitikLokasi]:
    """Semua titik lokasi fasilitas & perangkat desa untuk halaman admin."""
    return data.semua()


@router.get("/titik-lokasi/{id}", response_model=TitikLokasi)
def satu_titik_lokasi(id: str) -> TitikLokasi:
    """Mengambil satu titik lokasi berdasarkan ID."""
    titik = data.ambil(id)
    if titik is None:
        raise HTTPException(404, "Titik lokasi tidak ditemukan.")
    return titik


@router.post("/titik-lokasi", response_model=TitikLokasi, status_code=201)
def tambah_titik_lokasi(
    payload: TitikLokasiBaru, admin: AuthUser = Depends(current_admin)
) -> TitikLokasi:
    """Menambah titik lokasi baru (fasilitas atau perangkat desa)."""
    hasil = data.tambah(payload)
    catat_audit(
        aktor=admin.username,
        aksi="tambah-titik-lokasi",
        sasaran=hasil.nama,
        sasaran_id=hasil.id,
    )
    return hasil


@router.put("/titik-lokasi/{id}", response_model=TitikLokasi)
def ubah_titik_lokasi(
    id: str, payload: TitikLokasiUbah, admin: AuthUser = Depends(current_admin)
) -> TitikLokasi:
    """Memperbarui data koordinat atau keterangan titik lokasi."""
    lama = data.ambil(id)
    if lama is None:
        raise HTTPException(404, "Titik lokasi tidak ditemukan.")

    hasil = data.ubah(id, payload)
    if hasil is None:
        raise HTTPException(404, "Gagal memperbarui titik lokasi.")

    catat_audit(
        aktor=admin.username,
        aksi="ubah-titik-lokasi",
        sasaran=f"{hasil.nama} (x: {hasil.x}%, y: {hasil.y}%)",
        sasaran_id=hasil.id,
    )
    return hasil


@router.delete("/titik-lokasi/{id}")
def hapus_titik_lokasi(
    id: str, admin: AuthUser = Depends(current_admin)
) -> dict[str, str]:
    """Menghapus satu titik lokasi."""
    lama = data.ambil(id)
    if lama is None:
        raise HTTPException(404, "Titik lokasi tidak ditemukan.")

    sukses = data.hapus(id)
    if not sukses:
        raise HTTPException(500, "Gagal menghapus titik lokasi.")

    catat_audit(
        aktor=admin.username,
        aksi="hapus-titik-lokasi",
        sasaran=lama.nama,
        sasaran_id=id,
    )
    return {"message": "Titik lokasi berhasil dihapus."}
