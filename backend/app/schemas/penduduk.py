"""Skema Pydantic — cerminan tipe frontend di frontend/src/types/penduduk.ts
dan frontend/src/types/statistik.ts. Bentuknya wajib sama; kalau salah satu
berubah, ubah dua-duanya.
"""

from typing import Literal, Optional

from pydantic import BaseModel, field_validator


def _normalisasi_tgl(v: object) -> str:
    if not v:
        return ""
    s = str(v).strip()
    if " " in s:
        s = s.split(" ")[0]
    elif "T" in s:
        s = s.split("T")[0]
    return s

JenisKelamin = Literal["LAKI_LAKI", "PEREMPUAN"]

Agama = Literal[
    "ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "LAINNYA"
]

StatusPerkawinan = Literal["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]

Pendidikan = Literal[
    "TIDAK_BELUM_SEKOLAH", "BELUM_TAMAT_SD", "SD", "SMP", "SMA", "D2", "D3", "D4", "S1", "S2", "S3"
]

# Susunan rumah tangga. Nomor KK tidak disimpan (spec 2026-08-26), tapi peran
# tiap orang di keluarganya tetap berguna dan tetap jadi filter.
StatusHubunganKeluarga = Literal[
    "KEPALA_KELUARGA", "ISTRI", "ANAK", "FAMILI_LAIN", "LAINNYA"
]

GolonganDarah = Literal["A", "B", "AB", "O", "TIDAK_TAHU"]

# Dua sebab hilangnya warga dari daftar sengaja dipisah — lihat spec auth,
# bagian "Hapus warga". `statusKependudukan` untuk yang datanya sah tapi
# statusnya berubah (pindah/meninggal); `deletedAt` untuk baris yang memang
# tidak pernah valid (salah input).
StatusKependudukan = Literal["AKTIF", "PINDAH", "MENINGGAL"]

StatusDomisili = Literal["TETAP", "KONTRAK"]

# Jabatan warga di padukuhan, diisi pengurus di kolom "Jabatan" file Excel.
#
# Ini BUKAN penentu kewenangan — yang menentukan siapa boleh apa tetap akun
# pengurus (tabel `pengurus`). Kolom ini hanya dibaca untuk **mengisi jabatan
# yang masih kosong**: begitu sebuah jabatan ada pemegangnya, isi kolom ini
# diabaikan. Tanpa batas itu, satu impor Excel yang belum diperbarui bisa
# membatalkan pergantian yang sudah disetujui Dukuh dan para Ketua RW.
JabatanWarga = Literal["WARGA", "DUKUH", "RW", "RT"]


class Alamat(BaseModel):
    jalan: str
    rt: str
    rw: str
    desa: str
    kecamatan: str
    kabupaten: str
    provinsi: str
    kodePos: str

    @field_validator("rt", "rw", mode="before")
    @classmethod
    def normalisasi_wilayah(cls, v: object) -> str:
        s = str(v or "").strip()
        if s.isdigit():
            return s.lstrip("0") or "0"
        return s


class Penduduk(BaseModel):
    """Satu warga."""

    id: str
    kodeKeluarga: Optional[str] = None
    nama: str
    jenisKelamin: JenisKelamin
    tempatLahir: str
    tanggalLahir: str
    agama: Agama
    statusPerkawinan: StatusPerkawinan
    pendidikan: Pendidikan
    pekerjaan: str
    golonganDarah: GolonganDarah
    statusHubunganKeluarga: StatusHubunganKeluarga
    kewarganegaraan: str
    jabatan: JabatanWarga = "WARGA"
    alamat: Alamat
    statusKependudukan: StatusKependudukan = "AKTIF"
    statusDomisili: StatusDomisili = "TETAP"
    bansos: list[str] = []
    alamatAsal: Optional[str] = None
    catatanPerkawinan: Optional[str] = None
    catatanKematian: Optional[str] = None
    # ISO date string, atau None kalau barisnya masih berlaku. Baris ber-nilai
    # tidak pernah ikut daftar maupun statistik (disaring di `data/store.py`).
    deletedAt: Optional[str] = None

    @field_validator("tanggalLahir", mode="before")
    @classmethod
    def validasi_tanggal_lahir(cls, v: object) -> str:
        return _normalisasi_tgl(v)


class PaginatedPenduduk(BaseModel):
    items: list[Penduduk]
    total: int
    page: int
    pageSize: int


class AlamatUbah(BaseModel):
    """Bagian alamat yang mau diganti. Yang tidak dikirim tidak disentuh."""

    jalan: Optional[str] = None
    rt: Optional[str] = None
    rw: Optional[str] = None
    desa: Optional[str] = None
    kecamatan: Optional[str] = None
    kabupaten: Optional[str] = None
    provinsi: Optional[str] = None
    kodePos: Optional[str] = None


class PendudukUbah(BaseModel):
    """Field yang tidak dikirim tidak diubah."""

    kodeKeluarga: Optional[str] = None
    nama: Optional[str] = None
    jenisKelamin: Optional[JenisKelamin] = None
    tempatLahir: Optional[str] = None
    tanggalLahir: Optional[str] = None
    agama: Optional[Agama] = None
    statusPerkawinan: Optional[StatusPerkawinan] = None
    pendidikan: Optional[Pendidikan] = None
    pekerjaan: Optional[str] = None
    golonganDarah: Optional[GolonganDarah] = None
    statusHubunganKeluarga: Optional[StatusHubunganKeluarga] = None
    kewarganegaraan: Optional[str] = None
    jabatan: Optional[JabatanWarga] = None
    statusKependudukan: Optional[StatusKependudukan] = None
    statusDomisili: Optional[StatusDomisili] = None
    bansos: Optional[list[str]] = None
    alamatAsal: Optional[str] = None
    catatanPerkawinan: Optional[str] = None
    catatanKematian: Optional[str] = None
    alamat: Optional[AlamatUbah] = None

    @field_validator("tanggalLahir", mode="before")
    @classmethod
    def validasi_tanggal_lahir(cls, v: object) -> str | None:
        if v is None:
            return None
        return _normalisasi_tgl(v)


class PendudukBaru(BaseModel):
    """Warga baru."""

    kodeKeluarga: Optional[str] = None
    nama: str
    jenisKelamin: JenisKelamin
    tempatLahir: str
    tanggalLahir: str
    agama: Agama
    statusPerkawinan: StatusPerkawinan
    pendidikan: Pendidikan
    pekerjaan: str
    golonganDarah: GolonganDarah
    statusHubunganKeluarga: StatusHubunganKeluarga
    kewarganegaraan: str = "WNI"
    statusDomisili: StatusDomisili = "TETAP"
    bansos: list[str] = []
    alamatAsal: Optional[str] = None
    catatanPerkawinan: Optional[str] = None
    catatanKematian: Optional[str] = None
    alamat: Alamat

    @field_validator("tanggalLahir", mode="before")
    @classmethod
    def validasi_tanggal_lahir(cls, v: object) -> str:
        return _normalisasi_tgl(v)


class FilterOpsi(BaseModel):
    """Pilihan filter yang BUKAN enum — nilainya cuma bisa diketahui dari isi data."""

    rt: list[str]
    rw: list[str]
    pekerjaan: list[str]
    bansos: list[str] = []


class Distribusi(BaseModel):
    label: str
    value: int


class RincianRw(BaseModel):
    """Agregat satu wilayah (RW, atau satu RT di dalamnya) untuk halaman depan."""

    label: str
    totalPenduduk: int
    # Turunan `statusHubunganKeluarga`, sama seperti di `StatistikPublik` —
    # bukan hitungan kartu keluarga sungguhan (nomor KK tidak didata).
    totalKepalaKeluarga: int
    totalLakiLaki: int
    totalPerempuan: int
    totalPenerimaBansos: int = 0
    totalBpnt: int = 0
    totalPkh: int = 0
    perBansos: list[Distribusi] = []
    perKelompokUmur: list[Distribusi]
    perPendidikan: list[Distribusi]
    perAgama: list[Distribusi]
    perStatusPerkawinan: list[Distribusi]
    # Rincian tiap RT di wilayah ini, urut menaik menurut nomor RT.
    perRt: list["RincianRw"] = []


class StatistikPublik(BaseModel):
    # Bulan paling lampau yang datanya bisa dipertanggungjawabkan, `YYYY-MM`.
    # Frontend memakainya sebagai batas daftar pilihan periode — lihat
    # `store.periode_terawal` untuk kenapa jawabannya konservatif.
    periodeTerawal: str
    totalPenduduk: int
    totalLakiLaki: int
    totalPerempuan: int
    # Cacah kepala keluarga — dipakai halaman depan sebagai "Jumlah KK".
    # Nomor KK sendiri tidak disimpan (spec 2026-08-26), jadi ini turunan dari
    # `statusHubunganKeluarga`, bukan hitungan kartu keluarga yang sebenarnya.
    totalKepalaKeluarga: int
    totalPenerimaBansos: int = 0
    totalBpnt: int = 0
    totalPkh: int = 0
    perBansos: list[Distribusi] = []
    # Sepuluh pekerjaan terbanyak se-padukuhan. Dibatasi karena isinya teks
    # bebas: tanpa batas, satu ketikan unik per orang jadi satu baris chart.
    perPekerjaan: list[Distribusi]
    perRw: list[RincianRw]
