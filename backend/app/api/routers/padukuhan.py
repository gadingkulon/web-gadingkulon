"""Keterangan tetap padukuhan: dibaca siapa saja, diubah ADMIN."""

from fastapi import APIRouter, Depends

from app.api.routers.auth import current_admin
from app.core.audit import catat_audit
from app.data import padukuhan as data
from app.schemas.auth import AuthUser
from app.schemas.padukuhan import Padukuhan

router = APIRouter(tags=["padukuhan"])


@router.get("/publik/padukuhan", response_model=Padukuhan | None)
def keterangan_padukuhan() -> Padukuhan | None:
    """`null` berarti Admin belum pernah menyimpannya, dan frontend memakai nilai bawaannya sendiri."""
    return data.ambil()


@router.patch("/padukuhan", response_model=Padukuhan)
def ubah_padukuhan(
    payload: Padukuhan, admin: AuthUser = Depends(current_admin)
) -> Padukuhan:
    lama = data.ambil()
    baru = data.ubah(payload)
    catat_audit(
        aktor=admin.username,
        aksi="ubah-padukuhan",
        sasaran=baru.namaLengkap,
        # Kolom apa saja yang berubah — bukan seluruh isinya, yang akan
        # menenggelamkan riwayat oleh satu paragraf sejarah.
        perubahan=(
            "kolom berubah: "
            + ", ".join(
                k for k, v in baru.model_dump().items() if getattr(lama, k) != v
            )
            if lama
            else "pertama kali disimpan"
        ),
    )
    return baru
