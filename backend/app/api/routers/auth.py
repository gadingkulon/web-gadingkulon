from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import ratelimit
from app.core.security import cocok_rahasia
from app.data import pengurus as data_pengurus
from app.data import sesi as data_sesi
from app.schemas.auth import (
    ROLE_PENGURUS,
    AuthUser,
    GantiPassword,
    PetugasCredentials,
    Session,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)

PESAN_NONAKTIF = (
    "Akun Anda sudah dinonaktifkan. Hubungi Admin untuk mengaktifkannya kembali."
)
PESAN_HARUS_GANTI = (
    "Ganti password Anda dulu sebelum memakai aplikasi."
)


def ke_auth_user(p: data_pengurus.Pengurus) -> AuthUser:
    return AuthUser(
        id=p.id,
        nama=p.nama,
        username=p.username,
        role=p.role,  # type: ignore[arg-type]
        rw=p.rw,
        rt=p.rt,
        jabatan=p.jabatan,
        harusGantiPassword=p.harus_ganti_password,
    )


def token_sesi(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """Token mentah dari header."""
    if creds is None:
        raise HTTPException(401, "Sesi tidak ditemukan. Silakan masuk.")
    return creds.credentials


async def current_user(token: str = Depends(token_sesi)) -> AuthUser:
    """Semua pengurus yang sudah masuk."""
    pengurus_id = data_sesi.pemilik(token)
    if pengurus_id is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    p = data_pengurus.cari_by_id(pengurus_id)
    if p is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    if not p.aktif:
        raise HTTPException(403, PESAN_NONAKTIF)
    return ke_auth_user(p)


def tolak_kalau_belum_ganti(user: AuthUser) -> None:
    """Password awal dari Admin sekali pakai: selama belum diganti, akun tidak
    boleh melakukan apa pun selain menggantinya. Ditegakkan di sini, bukan di
    layar — kalau tidak, password yang sempat diketahui Admin tetap bisa
    dipakai membaca data lewat panggilan langsung."""
    if user.harusGantiPassword:
        raise HTTPException(403, PESAN_HARUS_GANTI)


async def current_admin(user: AuthUser = Depends(current_user)) -> AuthUser:
    """Kelola akun pengurus. ADMIN saja."""
    tolak_kalau_belum_ganti(user)
    if user.role != "ADMIN":
        raise HTTPException(403, "Hanya untuk Admin.")
    return user


async def current_pengurus(user: AuthUser = Depends(current_user)) -> AuthUser:
    """Baca data warga."""
    tolak_kalau_belum_ganti(user)
    if user.role not in ROLE_PENGURUS:
        raise HTTPException(403, "Admin tidak memiliki akses data warga.")
    return user


def _lama(detik: int) -> str:
    """Waktu tunggu dalam bahasa orang, bukan detik mentah."""
    menit = (detik + 59) // 60
    return f"{menit} menit" if menit > 1 else "kurang dari semenit"


@router.post("/login", response_model=Session)
async def login(payload: PetugasCredentials) -> Session:
    tunggu = ratelimit.sisa_tunggu(payload.username)
    if tunggu:
        # `Retry-After` supaya perkakas yang membacanya tahu kapan boleh lagi;
        # pesannya untuk orang yang membacanya di layar.
        raise HTTPException(
            429,
            "Terlalu banyak percobaan masuk yang gagal. "
            f"Coba lagi {_lama(tunggu)} lagi, atau hubungi Admin kalau Anda "
            "lupa password.",
            headers={"Retry-After": str(tunggu)},
        )

    hasil = data_pengurus.cari_by_username(payload.username)
    if hasil is None or not cocok_rahasia(payload.password, hasil[1]):
        ratelimit.catat_gagal(payload.username)
        raise HTTPException(401, "Username atau password salah.")
    p, _ = hasil
    # Dibedakan dari salah password: pengurus yang akunnya dimatikan perlu tahu
    # harus menghubungi siapa, bukan mengira dirinya salah ketik.
    if not p.aktif:
        raise HTTPException(403, PESAN_NONAKTIF)
    # Dinolkan hanya setelah password terbukti benar — akun nonaktif di atas
    # sengaja tidak menolkan, supaya penebakan tidak dapat jalan memutar lewat
    # akun yang kebetulan sudah dicabut.
    ratelimit.reset(payload.username)
    user = ke_auth_user(p)
    return Session(token=data_sesi.buat(p.id), user=user)


@router.post("/ganti-password", response_model=AuthUser)
async def ganti_password_sendiri(
    payload: GantiPassword,
    user: AuthUser = Depends(current_user),
    token: str = Depends(token_sesi),
) -> AuthUser:
    """Ganti password akun sendiri.

    Sengaja bergantung pada `current_user`, bukan `current_pengurus`/
    `current_admin`: ini satu-satunya pintu yang harus tetap terbuka selagi
    penanda `harusGantiPassword` menyala.
    """
    hasil = data_pengurus.cari_by_username(user.username)
    if hasil is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    _, hash_lama = hasil
    if not cocok_rahasia(payload.passwordLama, hash_lama):
        # 400, bukan 401: sesinya SAH — yang salah isian formulirnya. Klien
        # memperlakukan 401 sebagai "sesi mati" dan langsung mencabutnya, jadi
        # memakai 401 di sini berarti salah ketik password lama satu kali
        # melempar orangnya keluar ke halaman masuk.
        raise HTTPException(400, "Password lama salah.")
    # Kalau boleh sama, tuntutan mengganti password bisa dipenuhi tanpa
    # mengganti apa pun.
    if cocok_rahasia(payload.passwordBaru, hash_lama):
        raise HTTPException(400, "Password baru harus berbeda dari yang lama.")

    data_pengurus.ganti_password(user.id, payload.passwordBaru, oleh_admin=False)
    # Sesi lain milik akun ini diputus: orang yang mengganti password karena
    # curiga passwordnya bocor perlu cara menutup pintu, bukan cuma mengganti
    # kuncinya. Sesinya sendiri disisakan supaya ia tidak terlempar keluar oleh
    # perbuatannya sendiri.
    data_sesi.akhiri_semua(user.id, kecuali=token)
    baru = data_pengurus.cari_by_id(user.id)
    if baru is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    return ke_auth_user(baru)


@router.post("/logout", status_code=204)
async def logout(token: str = Depends(token_sesi)) -> None:
    """Cabut sesi ini."""
    data_sesi.akhiri(token)
