"""Riwayat perubahan — cerminan `frontend/src/features/audit/types.ts`."""

from typing import Optional

from pydantic import BaseModel


class CatatanAudit(BaseModel):
    id: int
    waktu: str
    aktor: str
    aksi: str
    sasaran: str
    sasaranId: Optional[str] = None
    perubahan: Optional[str] = None
