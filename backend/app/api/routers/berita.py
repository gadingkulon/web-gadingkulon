"""Berita padukuhan: dibaca siapa saja, ditulis ADMIN.

`/publik/berita*` tanpa auth; `/berita*` ADMIN saja + log audit.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.api.routers.auth import current_admin
from app.core.audit import catat_audit
from app.data import berita as data
from app.schemas.auth import AuthUser
from app.schemas.berita import Berita, BeritaBaru

router = APIRouter(tags=["berita"])


@router.get("/publik/berita", response_model=list[Berita])
def daftar_berita() -> list[Berita]:
    """Semua berita, terbaru dulu. Tanpa auth."""
    return data.daftar()


@router.get("/publik/berita/{slug}", response_model=Berita)
def satu_berita(slug: str) -> Berita:
    """Satu berita menurut slug-nya. Tanpa auth."""
    berita = data.by_slug(slug)
    if berita is None:
        raise HTTPException(404, "Berita tidak ditemukan.")
    return berita


@router.post("/berita", response_model=Berita, status_code=201)
def tulis_berita(
    payload: BeritaBaru, admin: AuthUser = Depends(current_admin)
) -> Berita:
    berita = data.tambah(payload)
    catat_audit(
        aktor=admin.username,
        aksi="tambah-berita",
        sasaran=berita.judul,
        sasaran_id=berita.id,
    )
    return berita


@router.patch("/berita/{id}", response_model=Berita)
def sunting_berita(
    id: str, payload: BeritaBaru, admin: AuthUser = Depends(current_admin)
) -> Berita:
    """Ganti seluruh isi satu berita sekaligus."""
    lama = data.by_id(id)
    berita = data.ubah(id, payload)
    if berita is None or lama is None:
        raise HTTPException(404, "Berita tidak ditemukan.")
    catat_audit(
        aktor=admin.username,
        aksi="ubah-berita",
        sasaran=berita.judul,
        sasaran_id=berita.id,
        # Judul yang berubah menggeser URL-nya juga, jadi itu yang dicatat —
        # bukan seluruh isi artikel, yang akan menenggelamkan riwayatnya.
        perubahan="" if lama.judul == berita.judul else f"{lama.judul} → {berita.judul}",
    )
    return berita


@router.delete("/berita/{id}", status_code=204)
def hapus_berita(id: str, admin: AuthUser = Depends(current_admin)) -> None:
    """Hapus berita. Boleh, beda dari data warga & akun: ini isi situs."""
    berita = data.by_id(id)
    if berita is None or not data.hapus(id):
        raise HTTPException(404, "Berita tidak ditemukan.")
    catat_audit(
        aktor=admin.username,
        aksi="hapus-berita",
        sasaran=berita.judul,
        sasaran_id=berita.id,
    )
