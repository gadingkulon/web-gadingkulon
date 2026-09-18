from fastapi import APIRouter, Depends

from app.api.routers.auth import current_pengurus
from app.data.agregat import (
    cacah_dasar,
    distribusi_by,
    distribusi_kelompok_umur,
    distribusi_pendidikan,
    format_rw,
    ringkasan_bansos,
)
from app.data.store import hanya_aktif, penduduk_untuk
from app.schemas.auth import AuthUser
from app.schemas.infografis import InfografisData

router = APIRouter(tags=["infografis"])


@router.get("/infografis", response_model=InfografisData)
async def infografis(user: AuthUser = Depends(current_pengurus)) -> InfografisData:
    """Agregat wilayah pemanggilnya, bukan seluruh padukuhan."""
    warga = hanya_aktif(penduduk_untuk(user))
    cacah = cacah_dasar(warga)
    bansos = ringkasan_bansos(warga)
    total_ngontrak = sum(
        1 for p in warga if getattr(p, "statusDomisili", "TETAP") == "KONTRAK"
    )
    return InfografisData(
        totalPenduduk=cacah.total,
        totalKepalaKeluarga=cacah.kepalaKeluarga,
        totalLakiLaki=cacah.lakiLaki,
        totalPerempuan=cacah.perempuan,
        totalPenerimaBansos=bansos.totalPenerima,
        totalBpnt=bansos.totalBpnt,
        totalPkh=bansos.totalPkh,
        perBansos=bansos.perBansos,
        totalNgontrak=total_ngontrak,
        perAgama=distribusi_by(warga, lambda p: p.agama),
        perPendidikan=distribusi_pendidikan(warga),
        perStatusPerkawinan=distribusi_by(
            warga, lambda p: p.statusPerkawinan
        ),
        perDusun=distribusi_by(warga, lambda p: format_rw(p.alamat.rw)),
        perKelompokUmur=distribusi_kelompok_umur(warga),
    )
