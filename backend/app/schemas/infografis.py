"""Cerminan frontend/src/features/infografis/types.ts."""

from pydantic import BaseModel

from app.schemas.penduduk import Distribusi


class InfografisData(BaseModel):
    totalPenduduk: int
    totalKepalaKeluarga: int = 0
    totalLakiLaki: int
    totalPerempuan: int
    totalPenerimaBansos: int = 0
    totalBpnt: int = 0
    totalPkh: int = 0
    perBansos: list[Distribusi] = []
    totalNgontrak: int = 0
    perAgama: list[Distribusi]
    perKelompokUmur: list[Distribusi]
    perPendidikan: list[Distribusi]
    perStatusPerkawinan: list[Distribusi]
    perDusun: list[Distribusi]
