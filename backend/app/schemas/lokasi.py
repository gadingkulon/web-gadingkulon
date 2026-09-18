"""Skema data titik lokasi fasilitas dan perangkat desa untuk peta interaktif."""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class TitikLokasiBase(BaseModel):
    nama: str = Field(min_length=1, max_length=150)
    kategori: Literal["perangkat", "fasilitas"]
    peran: Optional[str] = Field(default=None, max_length=50)
    kategoriLabel: str = Field(min_length=1, max_length=100)
    deskripsi: str = Field(default="", max_length=1000)
    x: float = Field(ge=0.0, le=100.0)
    y: float = Field(ge=0.0, le=100.0)
    lat: Optional[float] = None
    lon: Optional[float] = None
    googleMapsUrl: Optional[str] = None
    ikon: str = Field(default="balai", max_length=50)
    urutan: int = Field(default=0)

    @field_validator("nama", "kategoriLabel", "deskripsi", mode="before")
    @classmethod
    def _rapikan_teks(cls, v: object) -> object:
        return v.strip() if isinstance(v, str) else v


class TitikLokasi(TitikLokasiBase):
    id: str = Field(min_length=1, max_length=100)


class TitikLokasiBaru(TitikLokasiBase):
    id: Optional[str] = Field(default=None, max_length=100)


class TitikLokasiUbah(BaseModel):
    nama: Optional[str] = Field(default=None, min_length=1, max_length=150)
    kategori: Optional[Literal["perangkat", "fasilitas"]] = None
    peran: Optional[str] = Field(default=None, max_length=50)
    kategoriLabel: Optional[str] = Field(default=None, min_length=1, max_length=100)
    deskripsi: Optional[str] = Field(default=None, max_length=1000)
    x: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    y: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    lat: Optional[float] = None
    lon: Optional[float] = None
    googleMapsUrl: Optional[str] = None
    ikon: Optional[str] = Field(default=None, max_length=50)
    urutan: Optional[int] = None

    @field_validator("nama", "kategoriLabel", "deskripsi", mode="before")
    @classmethod
    def _rapikan_teks_ubah(cls, v: object) -> object:
        return v.strip() if isinstance(v, str) else v
