"""Payload kelola akun pengurus — cerminan `frontend/src/features/pengurus/types.ts`."""

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.auth import AuthUser, Role


class PengurusOut(AuthUser):
    """Akun pengurus untuk halaman kelola akun: `AuthUser` + status aktif."""

    aktif: bool


class CalonOut(BaseModel):
    """Warga yang ditandai memegang jabatan ini di kolom "Jabatan" file Excel."""

    id: str
    nama: str


class JabatanOut(BaseModel):
    """Satu jabatan di padukuhan, terisi maupun kosong."""

    #: Kunci, mis. `RT:019/001` — lihat `pengurus.kode_jabatan_dari()`.
    kode: str
    role: Role
    rw: Optional[str] = None
    rt: Optional[str] = None
    #: Label yang dibaca orang, mis. "Ketua RT 001".
    label: str
    pemegang: Optional[PengurusOut] = None
    # Hanya untuk jabatan kosong; diabaikan begitu ada pemegangnya.
    calon: Optional[CalonOut] = None

    @field_validator("rt", "rw", mode="before")
    @classmethod
    def normalisasi_wilayah(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        if s.isdigit():
            return s.lstrip("0") or "0"
        return s


class WargaPilihan(BaseModel):
    """Sepotong data warga sekadar untuk dropdown pemilihan: nama + RT/RW."""

    id: str
    nama: str
    rt: str
    rw: str

    @field_validator("rt", "rw", mode="before")
    @classmethod
    def normalisasi_wilayah(cls, v: object) -> str:
        s = str(v or "").strip()
        if s.isdigit():
            return s.lstrip("0") or "0"
        return s


class PengurusBaru(BaseModel):
    """Mengisi satu jabatan kosong. `role`/`rw`/`rt` menunjuk jabatan mana."""

    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8)
    wargaId: str = Field(min_length=1)
    role: Role
    rw: Optional[str] = None
    rt: Optional[str] = None

    @field_validator("rt", "rw", mode="before")
    @classmethod
    def normalisasi_wilayah(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        if s.isdigit():
            return s.lstrip("0") or "0"
        return s



class PasswordBaru(BaseModel):
    password: str = Field(min_length=8)


class JabatanWilayahPublik(BaseModel):
    """Satu RT (atau induk RW) di bagan publik: nomor wilayah + nama pemegangnya."""

    nomor: str
    nama: Optional[str] = None


class RwPublik(JabatanWilayahPublik):
    rt: list[JabatanWilayahPublik] = []


class StrukturOrganisasiPublik(BaseModel):
    """Bagan pengurus untuk halaman profil publik."""

    dukuh: Optional[str] = None
    rw: list[RwPublik] = []
    lpm: Optional[str] = None


class LpmIsi(BaseModel):
    """Mengisi jabatan Ketua LPM yang sedang kosong.

    Menggunakan `wargaId` yang dipilih dari data warga (bukan diketik).
    Jika LPM sudah terisi, pergantian harus lewat pengajuan yang disetujui.
    """

    wargaId: str = Field(min_length=1)
