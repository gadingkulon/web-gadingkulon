"""Akun perangkat desa (Dukuh/RW/RT) — satu-satunya akun yang ada.

Koneksi sekali pakai per operasi, BUKAN cache `store.py`: tabelnya
ditulis saat runtime, jadi cache impor-sekali akan basi.

Password selalu di-hash bcrypt, tidak pernah polos.
"""

import uuid
from dataclasses import dataclass
from typing import Any

from app.core.config import settings
from app.core.security import hash_rahasia
from app.data import db

ROLE_ADMIN = "ADMIN"
ROLE_DUKUH = "DUKUH"
ROLE_RW = "RW"
ROLE_RT = "RT"
ROLE_LPM = "LPM"

# Penanda "argumen tidak dikirim" untuk `ubah()`, supaya `rw=None` yang berarti
# "kosongkan" bisa dibedakan dari "jangan sentuh". Bagian dari kontrak modul
# ini, jadi sengaja publik.
#: Penanda "jangan sentuh kolom ini", beda dari `None` yang berarti kosongkan.
#: Bertipe `Any` supaya bisa jadi nilai bawaan parameter `str | None`.
TETAP: Any = object()


@dataclass
class Pengurus:
    id: str
    username: str
    nama: str
    role: str
    rw: str | None
    rt: str | None
    aktif: bool
    harus_ganti_password: bool = False
    # Kode Warga orang yang memegang jabatan ini. `None` untuk ADMIN — ia akun
    # layanan, bukan warga padukuhan.
    warga_id: str | None = None

    @property
    def jabatan(self) -> str:
        return jabatan_dari(self.role, self.rw, self.rt)

    @property
    def kode_jabatan(self) -> str:
        """Kunci jabatan yang dipegang, untuk menjodohkan akun dengan daftar jabatan."""
        return kode_jabatan_dari(self.role, self.rw, self.rt)


def normalisasi_wilayah(w: str | None) -> str | None:
    if w is None:
        return None
    s = str(w).strip()
    return s.lstrip("0") or "0" if s.isdigit() else s


def jabatan_dari(role: str, rw: str | None, rt: str | None) -> str:
    """Label jabatan diturunkan dari role+RW+RT, tidak disimpan."""
    rw = normalisasi_wilayah(rw)
    rt = normalisasi_wilayah(rt)
    if role == ROLE_ADMIN:
        return "Admin"
    if role == ROLE_DUKUH:
        return "Dukuh"
    if role == ROLE_RW:
        return f"Ketua RW {rw}" if rw else "Ketua RW"
    if role == ROLE_RT:
        return f"Ketua RT {rt}" if rt else "Ketua RT"
    if role == ROLE_LPM:
        return "Ketua LPM"
    return role


def kode_jabatan_dari(role: str, rw: str | None, rt: str | None) -> str:
    """Kunci satu jabatan, mis. `DUKUH`, `RW:019`, `RT:019/001`."""
    rw_bersih = normalisasi_wilayah(rw) or ""
    rt_bersih = normalisasi_wilayah(rt) or ""
    if role == ROLE_RW:
        return f"RW:{rw_bersih}"
    if role == ROLE_RT:
        return f"RT:{rw_bersih}/{rt_bersih}"
    if role == ROLE_LPM:
        return "LPM"
    return role


def _samakan_wilayah(a: str | None, b: str | None) -> bool:
    if a == b:
        return True
    if a is None or b is None:
        return False
    return (a.strip().lstrip("0") or "0") == (b.strip().lstrip("0") or "0")


def cocok_wilayah(
    role: str, rw: str | None, rt: str | None, warga_rw: str, warga_rt: str
) -> bool:
    """Apakah seorang warga boleh memegang jabatan ini.

    Ketua RT dari RT itu, Ketua RW dari RW itu, Dukuh dari mana pun.
    Di sini, bukan di router: dipakai dua jalur dan aturannya tidak boleh
    berbeda di antara keduanya.
    """
    if role == ROLE_RT:
        return _samakan_wilayah(warga_rw, rw) and _samakan_wilayah(warga_rt, rt)
    if role == ROLE_RW:
        return _samakan_wilayah(warga_rw, rw)
    # Dukuh dan LPM boleh dari wilayah mana pun di padukuhan.
    return True


def _db():
    return db.koneksi(settings.DATABASE_FILE)


def _dari_row(row) -> Pengurus:
    return Pengurus(
        id=row["id"],
        username=row["username"],
        nama=row["nama"],
        role=row["role"],
        rw=normalisasi_wilayah(row["rw"]),
        rt=normalisasi_wilayah(row["rt"]),
        aktif=bool(row["aktif"]),
        harus_ganti_password=bool(row["harus_ganti_password"]),
        warga_id=row["warga_id"],
    )


def cari_by_username(username: str) -> tuple[Pengurus, bytes] | None:
    """Pengurus + hash password-nya."""
    with _db() as conn:
        row = conn.execute(
            "SELECT * FROM pengurus WHERE username = ?", (username,)
        ).fetchone()
    return (_dari_row(row), row["password_hash"]) if row else None


def cari_by_id(id: str) -> Pengurus | None:
    with _db() as conn:
        row = conn.execute("SELECT * FROM pengurus WHERE id = ?", (id,)).fetchone()
    return _dari_row(row) if row else None


def daftar() -> list[Pengurus]:
    with _db() as conn:
        rows = conn.execute(
            "SELECT * FROM pengurus ORDER BY role, rw, rt, username"
        ).fetchall()
    return [_dari_row(r) for r in rows]


def tambah(
    username: str,
    password: str,
    nama: str,
    role: str,
    rw: str | None = None,
    rt: str | None = None,
    warga_id: str | None = None,
) -> Pengurus:
    """Raise `ValueError` kalau username sudah dipakai, jabatannya sudah dipegang
    akun aktif, atau orangnya sedang memegang jabatan lain. Akun baru selalu
    lahir dengan `harus_ganti_password` menyala: password dari Admin sekali
    pakai."""
    if role == ROLE_LPM:
        raise ValueError(
            "Ketua LPM tidak punya akun — isi lewat endpoint LPM, "
            "bukan lewat pembuatan akun."
        )
    baru = Pengurus(
        id=str(uuid.uuid4()),
        username=username,
        nama=nama,
        role=role,
        rw=normalisasi_wilayah(rw),
        rt=normalisasi_wilayah(rt),
        aktif=True,
        harus_ganti_password=True,
        warga_id=warga_id or None,
    )
    with _db() as conn:
        sudah = conn.execute(
            "SELECT 1 FROM pengurus WHERE username = ?", (username,)
        ).fetchone()
        if sudah:
            raise ValueError(f"Username '{username}' sudah dipakai.")
        # Satu jabatan satu orang. Diperiksa di sini, bukan lewat UNIQUE di SQL:
        # akun nonaktif dari pemegang lama tetap tersimpan pada jabatan yang
        # sama, jadi constraint kolom akan menolak penggantinya.
        pemegang = [
            _dari_row(r)
            for r in conn.execute("SELECT * FROM pengurus WHERE aktif = 1")
        ]
        if any(p.kode_jabatan == baru.kode_jabatan for p in pemegang):
            raise ValueError(f"Jabatan {baru.jabatan} sudah ada yang memegang.")
        # Satu orang satu jabatan. Dibandingkan lewat Kode Warga, bukan nama:
        # dua orang yang benar-benar senama akan saling menghalangi kalau
        # namanya yang dipakai.
        lain = next(
            (p for p in pemegang if baru.warga_id and p.warga_id == baru.warga_id),
            None,
        )
        if lain is not None:
            raise ValueError(
                f"{baru.nama} sedang memegang jabatan {lain.jabatan}. "
                "Satu orang satu jabatan."
            )
        with conn:
            conn.execute(
                "INSERT INTO pengurus (id, username, password_hash, nama, role,"
                " rw, rt, aktif, warga_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)",
                (
                    baru.id,
                    baru.username,
                    hash_rahasia(password),
                    baru.nama,
                    baru.role,
                    baru.rw,
                    baru.rt,
                    baru.warga_id,
                ),
            )
    return baru


def ubah(
    id: str,
    *,
    nama: str | None = None,
    rw: str | None = TETAP,
    rt: str | None = TETAP,
    aktif: bool | None = None,
) -> Pengurus | None:
    """Field yang tidak dikirim tidak diubah. `None` untuk `rw`/`rt` berarti
    dikosongkan — bedanya dari "jangan sentuh" ditandai `TETAP`."""
    ada = cari_by_id(id)
    if ada is None:
        return None
    kolom: list[str] = []
    nilai: list[object] = []
    if nama is not None:
        kolom.append("nama = ?")
        nilai.append(nama)
    if rw is not TETAP:
        kolom.append("rw = ?")
        nilai.append(normalisasi_wilayah(rw) if rw else None)
    if rt is not TETAP:
        kolom.append("rt = ?")
        nilai.append(normalisasi_wilayah(rt) if rt else None)
    if aktif is not None:
        kolom.append("aktif = ?")
        nilai.append(1 if aktif else 0)
    if not kolom:
        return ada
    with _db() as conn:
        with conn:
            conn.execute(
                f"UPDATE pengurus SET {', '.join(kolom)} WHERE id = ?", (*nilai, id)
            )
    return cari_by_id(id)


def ganti_password(id: str, password: str, *, oleh_admin: bool) -> bool:
    """Ganti password satu akun.

    `oleh_admin=True` (reset) menyalakan kembali `harus_ganti_password`;
    `False` (pemiliknya sendiri) memadamkannya, dalam operasi yang sama
    supaya tidak ada celah di antaranya.
    """
    with _db() as conn:
        with conn:
            cur = conn.execute(
                "UPDATE pengurus SET password_hash = ?, harus_ganti_password = ?"
                " WHERE id = ?",
                (hash_rahasia(password), 1 if oleh_admin else 0, id),
            )
    return cur.rowcount > 0


@dataclass
class Calon:
    """Warga yang ditandai memegang jabatan ini di kolom "Jabatan" file Excel."""

    id: str
    nama: str


@dataclass
class Jabatan:
    """Satu jabatan yang ada di padukuhan, terisi maupun kosong."""

    #: Kunci, mis. `RT:019/001` — lihat `kode_jabatan_dari()`.
    kode: str
    role: str
    rw: str | None
    rt: str | None
    #: Label yang dibaca orang, mis. "Ketua RT 001".
    label: str
    pemegang: Pengurus | None
    # Hanya diisi untuk jabatan KOSONG. Begitu ada pemegangnya, kolom Jabatan di
    # Excel diabaikan — kalau tidak, satu impor yang belum diperbarui bisa
    # membatalkan pergantian yang sudah disetujui.
    calon: Calon | None = None


def daftar_jabatan() -> list[Jabatan]:
    """Seluruh jabatan pengurus, diturunkan dari alamat warga di data penduduk."""
    from app.data.store import semua_penduduk

    warga = semua_penduduk()
    # Wilayah diturunkan dari warga AKTIF saja: satu orang yang sudah pindah
    # tidak boleh memunculkan jabatan RT yang sebenarnya sudah tidak dipegang.
    wilayah = sorted(
        {(p.alamat.rw, p.alamat.rt) for p in warga if p.statusKependudukan == "AKTIF"}
    )
    rencana: list[tuple[str, str | None, str | None]] = [(ROLE_DUKUH, None, None)]
    rencana += [(ROLE_RW, rw, None) for rw in sorted({rw for rw, _ in wilayah})]
    rencana += [(ROLE_RT, rw, rt) for rw, rt in wilayah]

    aktif = {p.kode_jabatan: p for p in daftar() if p.aktif}

    hasil = []
    for role, rw, rt in rencana:
        kunci = kode_jabatan_dari(role, rw, rt)
        pemegang = aktif.get(kunci)
        hasil.append(
            Jabatan(
                kode=kunci,
                role=role,
                rw=rw,
                rt=rt,
                label=jabatan_dari(role, rw, rt),
                pemegang=pemegang,
                calon=None,
            )
        )
    return hasil


def bootstrap() -> None:
    """Buat akun ADMIN pertama kalau tabel masih kosong."""
    with _db() as conn:
        ada = conn.execute("SELECT 1 FROM pengurus LIMIT 1").fetchone()
    if ada:
        return
    if not settings.ADMIN_USERNAME or not settings.ADMIN_PASSWORD:
        raise RuntimeError(
            "Tabel pengurus kosong dan belum ada akun ADMIN pertama.\n"
            "Isi ADMIN_USERNAME dan ADMIN_PASSWORD di backend/.env lalu jalankan "
            "ulang. Daftar variabelnya ada di backend/README.md."
        )
    tambah(
        username=settings.ADMIN_USERNAME,
        password=settings.ADMIN_PASSWORD,
        nama="Admin",
        role=ROLE_ADMIN,
    )
    # Akun bootstrap tidak dituntut ganti password: nilainya datang dari
    # environment server, bukan dari tangan orang lain.
    with _db() as conn:
        with conn:
            conn.execute(
                "UPDATE pengurus SET harus_ganti_password = 0 WHERE username = ?",
                (settings.ADMIN_USERNAME,),
            )
    print(f"  Akun ADMIN pertama dibuat: {settings.ADMIN_USERNAME}")


def demo() -> None:
    """Self-check. Jalankan dengan DB sekali pakai:

        DATABASE_PATH=/tmp/uji-pengurus.db .venv/bin/python -m app.data.pengurus
    """
    # Turso dimatikan dulu: cek mandiri ini menghapus & menimpa isi tabel,
    # dan itu tidak boleh sampai mengenai database sungguhan di cloud.
    db.paksa_lokal()
    assert cocok_wilayah(ROLE_RT, "019", "001", "019", "001") is True
    assert cocok_wilayah(ROLE_RT, "019", "001", "019", "002") is False
    assert cocok_wilayah(ROLE_RW, "019", None, "019", "005") is True
    assert cocok_wilayah(ROLE_RW, "019", None, "020", "003") is False
    # Dukuh boleh dari wilayah mana pun di padukuhan.
    assert cocok_wilayah(ROLE_DUKUH, None, None, "021", "006") is True

    assert jabatan_dari(ROLE_ADMIN, None, None) == "Admin"
    assert jabatan_dari(ROLE_DUKUH, None, None) == "Dukuh"
    assert jabatan_dari(ROLE_RW, "019", None) == "Ketua RW 19"
    assert jabatan_dari(ROLE_RT, "019", "001") == "Ketua RT 1"

    # Nomor RT hanya unik di dalam RW-nya, jadi dua RT bernomor sama di RW
    # berbeda wajib jadi dua jabatan berbeda.
    assert kode_jabatan_dari(ROLE_RT, "019", "001") != kode_jabatan_dari(
        ROLE_RT, "020", "001"
    )
    assert kode_jabatan_dari(ROLE_DUKUH, None, None) == "DUKUH"

    p = tambah("uji-rt", "rahasia", "Fajar", ROLE_RT, rw="019", rt="001",
               warga_id="W0001")
    assert p.jabatan == "Ketua RT 1"
    # Akun baru wajib ganti password: nilainya datang dari tangan Admin.
    assert p.harus_ganti_password is True
    assert cari_by_id(p.id).harus_ganti_password is True  # type: ignore[union-attr]

    hasil = cari_by_username("uji-rt")
    assert hasil is not None and hasil[1].startswith(b"$2"), "password tidak di-hash"

    try:
        tambah("uji-rt", "lain", "Kembar", ROLE_RT, rw="020", rt="003")
        raise AssertionError("username ganda harus ditolak")
    except ValueError:
        pass

    try:
        tambah("uji-rt2", "lain", "Kembar", ROLE_RT, rw="019", rt="001")
        raise AssertionError("jabatan yang sudah dipegang harus ditolak")
    except ValueError:
        pass

    # Satu orang satu jabatan — dibandingkan lewat Kode Warga.
    try:
        tambah("uji-rw", "rahasia", "Fajar", ROLE_RW, rw="020", warga_id="W0001")
        raise AssertionError("orang yang sudah menjabat harus ditolak")
    except ValueError as e:
        assert "satu jabatan" in str(e), e

    # Dua orang yang benar-benar SENAMA tidak boleh saling menghalangi —
    # inilah alasan pemeriksaannya memakai Kode Warga, bukan nama.
    kembar = tambah("uji-kembar", "rahasia", "Fajar", ROLE_RW, rw="020",
                    warga_id="W9999")
    assert kembar.jabatan == "Ketua RW 20"
    assert kembar.warga_id == "W9999"

    # Jabatan yang sama boleh diisi lagi setelah pemegangnya dinonaktifkan —
    # itulah jalur pergantian pengurus.
    assert ubah(p.id, aktif=False).aktif is False  # type: ignore[union-attr]
    pengganti = tambah("uji-rt2", "rahasia", "Bagus", ROLE_RT, rw="019", rt="001",
                       warga_id="W0002")
    assert pengganti.kode_jabatan == p.kode_jabatan

    # Ganti password sendiri memadamkan penanda; reset Admin menyalakannya lagi.
    assert ganti_password(pengganti.id, "password-baru", oleh_admin=False) is True
    assert cari_by_id(pengganti.id).harus_ganti_password is False  # type: ignore[union-attr]
    assert ganti_password(pengganti.id, "password-reset", oleh_admin=True) is True
    assert cari_by_id(pengganti.id).harus_ganti_password is True  # type: ignore[union-attr]

    assert ganti_password("tidak-ada", "baru", oleh_admin=True) is False
    assert ubah("tidak-ada", nama="x") is None
    assert cari_by_id("tidak-ada") is None

    print(f"OK: app/data/pengurus.py ({len(daftar())} akun di DB uji)")


if __name__ == "__main__":
    demo()
