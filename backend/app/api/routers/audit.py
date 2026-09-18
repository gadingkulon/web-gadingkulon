"""Riwayat perubahan: siapa mengubah apa, kapan, dari apa jadi apa."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.routers.auth import current_user, tolak_kalau_belum_ganti
from app.core import audit
from app.core.audit import AKSI_AKUN, AKSI_WARGA
from app.data.store import penduduk_untuk
from app.schemas.audit import CatatanAudit
from app.schemas.auth import ROLE_PENGURUS, AuthUser

router = APIRouter(tags=["audit"])


def _keluaran(r: dict) -> CatatanAudit:
    return CatatanAudit(
        id=r["id"],
        waktu=r["waktu"],
        aktor=r["aktor"],
        aksi=r["aksi"],
        sasaran=r["sasaran"],
        sasaranId=r["sasaran_id"],
        perubahan=r["perubahan"],
    )


@router.get("/audit", response_model=list[CatatanAudit])
def riwayat(user: AuthUser = Depends(current_user)) -> list[CatatanAudit]:
    """Riwayat yang boleh dibaca orang ini.

    Memakai `current_user`, bukan `current_pengurus`/`current_admin`: dua
    peran memakai endpoint yang sama dengan isi berbeda. Karena itu
    pemeriksaan password-awal harus dipanggil manual di sini.
    """
    tolak_kalau_belum_ganti(user)

    if user.role == "ADMIN":
        return [_keluaran(r) for r in audit.riwayat(AKSI_AKUN)]

    if user.role not in ROLE_PENGURUS:
        raise HTTPException(403, "Peran ini tidak punya riwayat untuk dibaca.")

    # Satu query untuk dua jenis aksi, bukan dua lalu digabung: urutan waktunya
    # sudah benar sejak dari SQL, dan batas 200 baris berlaku pada gabungannya.
    #
    # Aksi warga disaring per wilayah lewat warga yang boleh dilihat
    # pemanggilnya; warga yang sudah pindah keluar wilayahnya ikut hilang dari
    # riwayat — konsisten dengan daftar penduduk. Aksi Admin lolos apa adanya:
    # sasarannya akun, berita, atau profil padukuhan, tidak ada warga di sana.
    boleh = {w.id for w in penduduk_untuk(user)}
    return [
        _keluaran(r)
        for r in audit.riwayat(AKSI_WARGA + AKSI_AKUN)
        if r["aksi"] in AKSI_AKUN or r["sasaran_id"] in boleh
    ]
