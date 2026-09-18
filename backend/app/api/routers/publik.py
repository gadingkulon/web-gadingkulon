from collections import defaultdict
from typing import Callable

from fastapi import APIRouter, Query

from app.data.agregat import (
    cacah_dasar,
    distribusi_by,
    distribusi_kelompok_umur,
    distribusi_pendidikan,
    format_rt,
    format_rw,
    ringkasan_bansos,
)
from app.data import lpm as data_lpm
from app.data import pengurus as data_pengurus
from app.data.store import (
    hanya_aktif,
    penduduk_pada,
    periode_terawal,
    semua_penduduk,
)
from app.schemas.penduduk import Penduduk, RincianRw, StatistikPublik
from app.schemas.pengurus import (
    JabatanWilayahPublik,
    RwPublik,
    StrukturOrganisasiPublik,
)

router = APIRouter(tags=["publik"])


def _kelompokkan(
    warga: list[Penduduk], kunci: Callable[[Penduduk], str]
) -> list[tuple[str, list[Penduduk]]]:
    """Kelompokkan warga per nilai `kunci`, urut menaik menurut kuncinya."""
    hasil: defaultdict[str, list[Penduduk]] = defaultdict(list)
    for p in warga:
        hasil[kunci(p)].append(p)
    return sorted(hasil.items())


def _rincian(
    label: str, warga: list[Penduduk], per_rt: list[RincianRw] | None = None
) -> RincianRw:
    cacah = cacah_dasar(warga)
    bansos = ringkasan_bansos(warga)
    return RincianRw(
        label=label,
        totalPenduduk=cacah.total,
        totalKepalaKeluarga=cacah.kepalaKeluarga,
        totalLakiLaki=cacah.lakiLaki,
        totalPerempuan=cacah.perempuan,
        totalPenerimaBansos=bansos.totalPenerima,
        totalBpnt=bansos.totalBpnt,
        totalPkh=bansos.totalPkh,
        perBansos=bansos.perBansos,
        perKelompokUmur=distribusi_kelompok_umur(warga),
        perPendidikan=distribusi_pendidikan(warga),
        perAgama=distribusi_by(warga, lambda p: p.agama),
        perStatusPerkawinan=distribusi_by(warga, lambda p: p.statusPerkawinan),
        perRt=per_rt or [],
    )


@router.get("/publik/statistik", response_model=StatistikPublik)
def statistik_publik(
    periode: str | None = Query(
        None,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Bulan statistik, format YYYY-MM. Kosongkan untuk data saat ini.",
    ),
) -> StatistikPublik:
    """Statistik agregat warga yang aktif pada akhir bulan yang diminta."""
    # Yang pindah & meninggal tidak ikut dihitung — lihat `store.hanya_aktif`.
    semua = hanya_aktif(penduduk_pada(periode) if periode else semua_penduduk())
    cacah = cacah_dasar(semua)
    bansos = ringkasan_bansos(semua)
    return StatistikPublik(
        periodeTerawal=periode_terawal(),
        totalPenduduk=cacah.total,
        totalLakiLaki=cacah.lakiLaki,
        totalPerempuan=cacah.perempuan,
        totalKepalaKeluarga=cacah.kepalaKeluarga,
        totalPenerimaBansos=bansos.totalPenerima,
        totalBpnt=bansos.totalBpnt,
        totalPkh=bansos.totalPkh,
        perBansos=bansos.perBansos,
        perPekerjaan=distribusi_by(semua, lambda p: p.pekerjaan)[:10],
        perRw=[
            _rincian(
                format_rw(rw),
                warga,
                [
                    _rincian(format_rt(rt), warga_rt)
                    for rt, warga_rt in _kelompokkan(warga, lambda p: p.alamat.rt)
                ],
            )
            for rw, warga in _kelompokkan(semua, lambda p: p.alamat.rw)
        ],
    )


@router.get("/publik/struktur-organisasi", response_model=StrukturOrganisasiPublik)
def struktur_organisasi_publik() -> StrukturOrganisasiPublik:
    """Bagan pengurus untuk halaman profil — Dukuh & Ketua RW/RT beserta nama pemegangnya kalau ada."""
    jabatan = data_pengurus.daftar_jabatan()

    dukuh = next(
        (j for j in jabatan if j.role == data_pengurus.ROLE_DUKUH), None
    )

    rw_map: dict[str, RwPublik] = {}
    urutan_rw: list[str] = []
    for j in jabatan:
        if j.role == data_pengurus.ROLE_RW and j.rw is not None:
            rw_map[j.rw] = RwPublik(
                nomor=j.rw, nama=j.pemegang.nama if j.pemegang else None
            )
            urutan_rw.append(j.rw)
    for j in jabatan:
        if j.role == data_pengurus.ROLE_RT and j.rw is not None and j.rt is not None:
            rw_map[j.rw].rt.append(
                JabatanWilayahPublik(
                    nomor=j.rt, nama=j.pemegang.nama if j.pemegang else None
                )
            )

    return StrukturOrganisasiPublik(
        dukuh=dukuh.pemegang.nama if dukuh and dukuh.pemegang else None,
        rw=[rw_map[rw] for rw in urutan_rw],
        lpm=data_lpm.nama() or None,
    )
