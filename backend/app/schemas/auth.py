"""Skema autentikasi — cerminan `frontend/src/features/auth/types.ts`.
Bentuknya wajib sama; kalau salah satu berubah, ubah dua-duanya.

Warga tidak punya akun (spec 2026-08-26), jadi tidak ada skema PIN,
aktivasi, maupun kontak di sini.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Empat peran, dan yang membedakannya bukan tingkat melainkan ARAH kewenangan:
# ADMIN mengelola akun dan tidak boleh membaca data warga; tiga sisanya membaca
# data warga dan tidak bisa menyentuh akun siapa pun. Berpotongan kosong —
# lihat spec 2026-08-26-empat-peran-pergantian-pengurus-design.md.
Role = Literal["ADMIN", "DUKUH", "RW", "RT"]

# Peran yang boleh membaca data warga.
ROLE_PENGURUS: tuple[str, ...] = ("DUKUH", "RW", "RT")


class AuthUser(BaseModel):
    id: str
    nama: str
    username: str
    role: Role
    # Wilayah kerja. NULL untuk Dukuh; `rt` NULL untuk Ketua RW.
    rw: Optional[str] = None
    rt: Optional[str] = None
    # Diturunkan dari role+rw+rt, tidak disimpan di DB.
    jabatan: str
    # Password awal dari Admin masih berlaku: akun belum boleh melakukan apa pun
    # selain menggantinya.
    harusGantiPassword: bool = False

    @field_validator("rt", "rw", mode="before")
    @classmethod
    def normalisasi_wilayah(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        if s.isdigit():
            return s.lstrip("0") or "0"
        return s


class PetugasCredentials(BaseModel):
    username: str
    password: str


class GantiPassword(BaseModel):
    passwordLama: str
    passwordBaru: str = Field(min_length=8)


class Session(BaseModel):
    token: str
    user: AuthUser
