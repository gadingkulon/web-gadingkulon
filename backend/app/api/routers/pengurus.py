"""Kelola akun perangkat desa. ADMIN saja."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.routers.auth import current_admin, ke_auth_user
from app.core.audit import catat_audit
from app.data import lpm as data_lpm
from app.data import pengurus as data
from app.data import sesi as data_sesi
from app.data.store import semua_penduduk
from app.schemas.auth import AuthUser
from app.schemas.pengurus import (
    CalonOut,
    JabatanOut,
    LpmIsi,
    WargaPilihan,
    PasswordBaru,
    PengurusBaru,
    PengurusOut,
)

router = APIRouter(
    prefix="/pengurus",
    tags=["pengurus"],
    dependencies=[Depends(current_admin)],
)


def _keluaran(p: data.Pengurus) -> PengurusOut:
    return PengurusOut(**ke_auth_user(p).model_dump(), aktif=p.aktif)


@router.get("", response_model=list[JabatanOut])
def daftar_jabatan() -> list[JabatanOut]:
    """Seluruh jabatan padukuhan, terisi maupun kosong."""
    return [
        JabatanOut(
            kode=j.kode,
            role=j.role,  # type: ignore[arg-type]
            rw=j.rw,
            rt=j.rt,
            label=j.label,
            pemegang=_keluaran(j.pemegang) if j.pemegang else None,
            calon=CalonOut(id=j.calon.id, nama=j.calon.nama) if j.calon else None,
        )
        for j in data.daftar_jabatan()
    ]


# Dropdown tidak pernah menampilkan seluruh warga sekaligus: Admin mengetik
# dulu, dan hasilnya dipotong. Tidak menutup celahnya, tapi membuat "unduh
# seluruh daftar warga" bukan sesuatu yang terjadi dengan satu klik.
MIN_CARI = 2
MAKS_HASIL = 20


def _warga_untuk_jabatan(warga_id: str, role: str, rw: str | None, rt: str | None):
    """Warga yang sah memegang jabatan ini, atau `HTTPException` yang menjelaskan kenapa tidak."""
    warga = next((w for w in semua_penduduk() if w.id == warga_id), None)
    if warga is None or warga.statusKependudukan != "AKTIF":
        raise HTTPException(404, "Warga tidak ditemukan atau sudah tidak aktif.")
    if not data.cocok_wilayah(role, rw, rt, warga.alamat.rw, warga.alamat.rt):
        raise HTTPException(
            409,
            f"{warga.nama} warga RT {warga.alamat.rt}/RW {warga.alamat.rw}, "
            f"tidak bisa memegang jabatan {data.jabatan_dari(role, rw, rt)}.",
        )
    return warga


@router.get("/warga", response_model=list[WargaPilihan])
def cari_warga(
    q: str = Query(""),
    jabatanKode: str = Query(""),
    _admin: AuthUser = Depends(current_admin),
) -> list[WargaPilihan]:
    """Cari warga untuk dipilih Admin. Nama + RT/RW saja.

    `jabatanKode` opsional: menyempitkan ke warga yang boleh memegang
    jabatan itu.

    Satu-satunya celah Admin ke data warga — jangan tambah field.
    Ditulis SEBELUM rute ber-parameter supaya `warga` tidak terbaca jadi id.
    """
    kata = q.strip().lower()
    if len(kata) < MIN_CARI:
        return []
    # `jabatanKode` mempersempit hasil ke warga yang memang boleh memegangnya.
    # Bukan sekadar kenyamanan: makin sempit, makin sedikit data warga yang
    # terbuka untuk Admin.
    target = next(
        (j for j in data.daftar_jabatan() if j.kode == jabatanKode), None
    )
    # Warga yang sudah memegang jabatan aktif TIDAK boleh muncul di dropdown:
    # satu orang satu jabatan. Backend tetap menolak di `tambah()` dan
    # `ajukan()`, tapi menyaringnya di sini mencegah Admin memilih orang yang
    # pasti ditolak — dan memperkecil data warga yang terbuka.
    sudah_menjabat = {
        p.warga_id for p in data.daftar() if p.aktif and p.warga_id
    }
    if lpm_wid := data_lpm.warga_id():
        sudah_menjabat.add(lpm_wid)
    cocok = [
        w
        for w in semua_penduduk()
        if kata in w.nama.lower()
        and w.statusKependudukan == "AKTIF"
        and w.id not in sudah_menjabat
        and (
            target is None
            or data.cocok_wilayah(
                target.role, target.rw, target.rt, w.alamat.rw, w.alamat.rt
            )
        )
    ]
    return [
        WargaPilihan(id=w.id, nama=w.nama, rt=w.alamat.rt, rw=w.alamat.rw)
        for w in cocok[:MAKS_HASIL]
    ]


@router.post("", response_model=PengurusOut, status_code=201)
def tambah_pengurus(
    payload: PengurusBaru, admin: AuthUser = Depends(current_admin)
) -> PengurusOut:
    warga = _warga_untuk_jabatan(
        payload.wargaId, payload.role, payload.rw, payload.rt
    )
    try:
        baru = data.tambah(
            username=payload.username,
            password=payload.password,
            nama=warga.nama,
            role=payload.role,
            rw=payload.rw,
            rt=payload.rt,
            warga_id=warga.id,
        )
    except ValueError as e:
        raise HTTPException(409, str(e))
    catat_audit(
        aktor=admin.username,
        aksi="tambah-pengurus",
        sasaran=baru.username,
        sasaran_id=baru.id,
    )
    return _keluaran(baru)


@router.patch("/lpm")
def isi_lpm(
    payload: LpmIsi, admin: AuthUser = Depends(current_admin)
) -> dict[str, str]:
    """Isi Ketua LPM yang sedang kosong dari data warga.

    Jika LPM sudah terisi, endpoint ini menolak (409) — pergantian harus lewat
    pengajuan pergantian yang disetujui Dukuh (`/pergantian`).
    """
    if data_lpm.warga_id() is not None:
        raise HTTPException(
            409,
            "Jabatan Ketua LPM sudah terisi — gunakan pengajuan pergantian "
            "untuk menggantinya.",
        )
    warga = next((w for w in semua_penduduk() if w.id == payload.wargaId), None)
    if warga is None or warga.statusKependudukan != "AKTIF":
        raise HTTPException(400, "Warga yang dipilih tidak ada atau tidak aktif.")

    sudah_menjabat = {
        p.warga_id for p in data.daftar() if p.aktif and p.warga_id
    }
    if warga.id in sudah_menjabat:
        raise HTTPException(
            409, f"{warga.nama} sedang memegang jabatan lain."
        )

    lama = data_lpm.nama()
    baru = data_lpm.ubah(warga.nama, warga.id)
    catat_audit(
        aktor=admin.username,
        aksi="isi-lpm",
        sasaran="Ketua LPM",
        perubahan=f"{lama or '(kosong)'} → {baru}",
    )
    return {"nama": baru, "wargaId": warga.id}


@router.post("/{id}/reset-password", status_code=204)
def reset_password(
    id: str, payload: PasswordBaru, admin: AuthUser = Depends(current_admin)
) -> None:
    target = data.cari_by_id(id)
    if target is None or not data.ganti_password(
        id, payload.password, oleh_admin=True
    ):
        raise HTTPException(404, "Akun pengurus tidak ditemukan.")
    # Sesi lama dicabut: kalau tidak, orang yang masih memegang sesi berjalan
    # tetap bisa memakai akun itu walau passwordnya sudah diganti — dan reset
    # password justru dilakukan ketika ada kecurigaan seperti itu.
    data_sesi.akhiri_semua(id)
    catat_audit(
        aktor=admin.username,
        aksi="reset-password",
        sasaran=target.username,
        sasaran_id=target.id,
    )
