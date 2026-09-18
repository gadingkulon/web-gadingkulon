"""Pergantian jabatan — cerminan `frontend/src/features/pergantian/types.ts`."""

from typing import Literal, Optional

from pydantic import BaseModel

from app.schemas.auth import Role

StatusPengajuan = Literal["MENUNGGU", "DISETUJUI", "DITOLAK", "GUGUR"]


class SuaraOut(BaseModel):
    pengurusId: str
    nama: str
    jabatan: str
    setuju: bool
    pada: str


class PengajuanOut(BaseModel):
    id: str
    #: Kunci jabatan, mis. `RT:019/001`.
    jabatanKode: str
    role: Role
    rw: Optional[str] = None
    rt: Optional[str] = None
    #: Label yang dibaca orang, mis. "Ketua RT 001".
    jabatan: str
    kandidatId: str
    kandidatNama: str
    kandidatRt: str
    kandidatRw: str
    status: StatusPengajuan
    diajukanOleh: str
    diajukanPada: str
    selesaiPada: Optional[str] = None
    sebab: Optional[str] = None
    suara: list[SuaraOut] = []


class PengajuanBaru(BaseModel):
    jabatanKode: str
    kandidatId: str = ""


class Jawaban(BaseModel):
    setuju: bool
