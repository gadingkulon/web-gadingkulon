"""Helper cacah yang dipakai lebih dari satu router statistik."""

from collections import Counter
from dataclasses import dataclass
from datetime import date
from typing import Callable, Iterable

from app.schemas.penduduk import (
    Agama,
    Alamat,
    Distribusi,
    JenisKelamin,
    Pendidikan,
    Penduduk,
    StatusHubunganKeluarga,
)

# Urutan tampil kelompok umur, sengaja eksplisit: mengurutkan labelnya sebagai
# teks menaruh '13-17' sebelum '6-12'.
KELOMPOK_UMUR = ("0-5", "6-12", "13-17", "18-25", "26-40", "41-60", "60+")

# Batas atas (inklusif) tiap kelompok kecuali yang terakhir.
_BATAS_UMUR = (5, 12, 17, 25, 40, 60)

# Urutan tampil pendidikan — jenjang naik dari SD ke tertinggi. Non-jenjang
# ditaruh di ekor, bukan di kepala urutan naik.
URUTAN_PENDIDIKAN = (
    "SD",
    "SMP",
    "SMA",
    "D2",
    "D3",
    "D4",
    "S1",
    "S2",
    "S3",
    "BELUM_TAMAT_SD",
    "TIDAK_BELUM_SEKOLAH",
    "TIDAK_SEKOLAH",
)


def _dua_digit(kode: str) -> str:
    """`'019'` -> `'19'`, `'001'` -> `'01'`."""
    return (kode.lstrip("0") or "0").rjust(2, "0")


def format_rw(rw: str) -> str:
    """`'019'` -> `'RW 19'` — cerminan `frontend/src/lib/wilayah.ts`."""
    return f"RW {_dua_digit(rw)}"


def format_rt(rt: str) -> str:
    """`'001'` -> `'RT 01'`."""
    return f"RT {_dua_digit(rt)}"


def umur(tanggal_lahir_iso: str) -> int:
    try:
        tgl_str = str(tanggal_lahir_iso).strip().split()[0].split("T")[0]
        lahir = date.fromisoformat(tgl_str)
    except (ValueError, TypeError, IndexError):
        return 0
    hari_ini = date.today()
    tahun = hari_ini.year - lahir.year
    if (hari_ini.month, hari_ini.day) < (lahir.month, lahir.day):
        tahun -= 1
    return max(0, tahun)


def kelompok_umur(tahun: int) -> str:
    for batas, label in zip(_BATAS_UMUR, KELOMPOK_UMUR):
        if tahun <= batas:
            return label
    return KELOMPOK_UMUR[-1]


def distribusi_by(
    orang: Iterable[Penduduk], keyfn: Callable[[Penduduk], str]
) -> list[Distribusi]:
    """Cacah per kategori, terbanyak dulu. Kategori tanpa anggota tidak muncul."""
    counter = Counter(keyfn(p) for p in orang)
    return sorted(
        (Distribusi(label=k, value=v) for k, v in counter.items()),
        key=lambda d: d.value,
        reverse=True,
    )


def distribusi_kelompok_umur(orang: Iterable[Penduduk]) -> list[Distribusi]:
    """Cacah per kelompok umur, urut umur — bukan urut jumlah."""
    return sorted(
        distribusi_by(orang, lambda p: kelompok_umur(umur(p.tanggalLahir))),
        key=lambda d: KELOMPOK_UMUR.index(d.label),
    )


def distribusi_pendidikan(orang: Iterable[Penduduk]) -> list[Distribusi]:
    """Cacah per pendidikan, urut jenjang — bukan urut jumlah."""
    def _bobot(label: str) -> int:
        try:
            return URUTAN_PENDIDIKAN.index(label)
        except ValueError:
            return 999

    return sorted(
        distribusi_by(orang, lambda p: p.pendidikan),
        key=lambda d: _bobot(d.label),
    )


@dataclass
class CacahDasar:
    """Empat angka kepala yang muncul di tiap halaman statistik."""

    total: int
    lakiLaki: int
    perempuan: int
    kepalaKeluarga: int


def cacah_dasar(orang: Iterable[Penduduk]) -> CacahDasar:
    """Total jiwa, laki-laki, perempuan, dan kepala keluarga dalam satu lintasan."""
    warga = list(orang)
    return CacahDasar(
        total=len(warga),
        lakiLaki=sum(1 for p in warga if p.jenisKelamin == "LAKI_LAKI"),
        perempuan=sum(1 for p in warga if p.jenisKelamin == "PEREMPUAN"),
        kepalaKeluarga=sum(
            1 for p in warga if p.statusHubunganKeluarga == "KEPALA_KELUARGA"
        ),
    )


@dataclass
class RingkasanBansos:
    """Cacah penerima bantuan sosial, siap dipasang ke skema respons mana pun."""

    totalPenerima: int
    totalBpnt: int
    totalPkh: int
    perBansos: list[Distribusi]


def ringkasan_bansos(orang: Iterable[Penduduk]) -> RingkasanBansos:
    """Cacah penerima BPNT/PKH beserta rinciannya untuk grafik."""
    warga = list(orang)
    punya = [(p, set(getattr(p, "bansos", []) or ())) for p in warga]
    bpnt_saja = sum(1 for _, b in punya if "BPNT" in b and "PKH" not in b)
    pkh_saja = sum(1 for _, b in punya if "PKH" in b and "BPNT" not in b)
    ganda = sum(1 for _, b in punya if "BPNT" in b and "PKH" in b)
    return RingkasanBansos(
        totalPenerima=sum(1 for _, b in punya if b),
        totalBpnt=sum(1 for _, b in punya if "BPNT" in b),
        totalPkh=sum(1 for _, b in punya if "PKH" in b),
        perBansos=[
            Distribusi(label="BPNT", value=bpnt_saja),
            Distribusi(label="PKH", value=pkh_saja),
            Distribusi(label="BPNT & PKH", value=ganda),
        ],
    )


if __name__ == "__main__":
    # Cek mandiri: `python -m app.data.agregat` (tidak butuh pytest).
    assert format_rw("019") == "RW 19"
    assert format_rw("100") == "RW 100"
    assert format_rw("000") == "RW 00"
    assert format_rt("001") == "RT 01"
    assert format_rt("012") == "RT 12"

    assert [kelompok_umur(u) for u in (0, 5, 6, 17, 18, 60, 61, 99)] == [
        "0-5",
        "0-5",
        "6-12",
        "13-17",
        "18-25",
        "41-60",
        "60+",
        "60+",
    ]

    hari_ini = date.today()
    assert umur(hari_ini.replace(year=hari_ini.year - 30).isoformat()) == 30
    # Ulang tahun besok: belum genap.
    besok = hari_ini.toordinal() + 1
    lahir = date.fromordinal(besok).replace(year=hari_ini.year - 30)
    assert umur(lahir.isoformat()) == 29

    def _orang(
        tanggal_lahir: str,
        agama: Agama = "ISLAM",
        pendidikan: Pendidikan = "SD",
        jenis_kelamin: JenisKelamin = "LAKI_LAKI",
        hubungan: StatusHubunganKeluarga = "ANAK",
        bansos: list[str] | None = None,
    ) -> Penduduk:
        return Penduduk(
            id="uji",
            nama="x",
            jenisKelamin=jenis_kelamin,
            tempatLahir="x",
            tanggalLahir=tanggal_lahir,
            agama=agama,
            statusPerkawinan="BELUM_KAWIN",
            pendidikan=pendidikan,
            pekerjaan="x",
            golonganDarah="O",
            bansos=bansos or [],
            statusHubunganKeluarga=hubungan,
            kewarganegaraan="WNI",
            alamat=Alamat(
                jalan="x",
                rt="001",
                rw="019",
                desa="x",
                kecamatan="x",
                kabupaten="x",
                provinsi="x",
                kodePos="00000",
            ),
        )

    y = hari_ini.year
    warga = [
        _orang(f"{y - 3}-01-01"),
        _orang(f"{y - 30}-01-01"),
        _orang(f"{y - 31}-01-01"),
        _orang(f"{y - 70}-01-01", agama="KATOLIK"),
    ]
    # Urut umur, bukan urut jumlah: '0-5' (1 orang) tetap di depan '26-40' (2).
    assert [(d.label, d.value) for d in distribusi_kelompok_umur(warga)] == [
        ("0-5", 1),
        ("26-40", 2),
        ("60+", 1),
    ]
    # Sebaliknya, distribusi biasa urut jumlah.
    assert [(d.label, d.value) for d in distribusi_by(warga, lambda p: p.agama)] == [
        ("ISLAM", 3),
        ("KATOLIK", 1),
    ]

    warga_pendidikan = [
        _orang(f"{y - 30}-01-01", pendidikan="S1"),
        _orang(f"{y - 30}-01-01", pendidikan="SD"),
    ]
    # Urut jenjang (SD sebelum S1), bukan urut abjad atau jumlah.
    assert [d.label for d in distribusi_pendidikan(warga_pendidikan)] == [
        "SD",
        "S1",
    ]

    # --- cacah_dasar ---
    campur = [
        _orang(f"{y - 30}-01-01", jenis_kelamin="LAKI_LAKI", hubungan="KEPALA_KELUARGA"),
        _orang(f"{y - 28}-01-01", jenis_kelamin="PEREMPUAN", hubungan="ISTRI"),
        _orang(f"{y - 5}-01-01", jenis_kelamin="PEREMPUAN", hubungan="ANAK"),
    ]
    dasar = cacah_dasar(campur)
    assert (dasar.total, dasar.lakiLaki, dasar.perempuan, dasar.kepalaKeluarga) == (
        3,
        1,
        2,
        1,
    ), dasar
    kosong = cacah_dasar([])
    assert (kosong.total, kosong.lakiLaki, kosong.kepalaKeluarga) == (0, 0, 0)

    # --- ringkasan_bansos ---
    penerima = [
        _orang(f"{y - 30}-01-01", bansos=["BPNT"]),
        _orang(f"{y - 30}-01-01", bansos=["BPNT"]),
        _orang(f"{y - 30}-01-01", bansos=["PKH"]),
        _orang(f"{y - 30}-01-01", bansos=["BPNT", "PKH"]),
        _orang(f"{y - 30}-01-01", bansos=[]),
    ]
    b = ringkasan_bansos(penerima)
    # Tumpang tindih: yang menerima dua-duanya ikut dihitung di kedua angka ini.
    assert (b.totalBpnt, b.totalPkh) == (3, 2), b
    # Empat baris punya bansos, satu tidak.
    assert b.totalPenerima == 4, b
    assert [(d.label, d.value) for d in b.perBansos] == [
        ("BPNT", 2),
        ("PKH", 1),
        ("BPNT & PKH", 1),
    ], b.perBansos
    # Kategori grafik saling lepas, jadi jumlahnya = totalPenerima. Ini yang
    # menjaga grafik tidak menghitung satu orang dua kali.
    assert sum(d.value for d in b.perBansos) == b.totalPenerima

    # Tanpa penerima sama sekali: tetap tiga batang bernilai nol, bukan kosong —
    # frontend yang memutuskan menyembunyikannya.
    nol = ringkasan_bansos([_orang(f"{y - 30}-01-01")])
    assert nol.totalPenerima == 0 and len(nol.perBansos) == 3

    print("agregat: OK")
