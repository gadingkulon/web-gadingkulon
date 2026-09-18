# Hapus NIK & No. KK, Aplikasi Khusus Pengurus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hapus kolom NIK & No. KK dari seluruh sistem, cabut autentikasi warga, dan jadikan aplikasi hanya bisa diakses pengurus desa (Dukuh/RW/RT) dengan akun yang dikelola lewat UI.

**Architecture:** Backend FastAPI + SQLite tanpa ORM. Data penduduk read-only, masuk lewat impor Excel yang menimpa seluruh tabel. Akun pengurus pindah dari list hardcoded di memori ke tabel SQLite dengan bootstrap ADMIN dari environment. Pencarian orang berpindah dari NIK ke filter kategori yang disaring di memori atas cache `store.py`.

**Tech Stack:** Python 3 + FastAPI + Pydantic v2 + `sqlite3` stdlib + bcrypt + PyJWT + openpyxl. Frontend React 18 + TypeScript + Vite + TanStack Query + Zustand + React Hook Form + Zod + Tailwind + Recharts.

**Spec:** `docs/superpowers/specs/2026-08-26-hapus-nik-kk-auth-pengurus-design.md`

## Global Constraints

- **Tidak boleh ada kolom, field, variabel, atau parameter bernama `nik` atau `noKK` yang tersisa** di backend maupun frontend setelah plan ini selesai. Termasuk `AuthUser.nik` dan `settings.KODE_WILAYAH`.
- **Backend selalu dijalankan lewat `.venv/bin/python`** dari direktori `backend/`. `python3` sistem tidak punya dependensinya.
- **Tidak ada dependensi baru.** `httpx` tidak ada di `requirements.txt`, jadi `fastapi.testclient` tidak bisa dipakai — uji ujung-ke-ujung memakai `urllib` stdlib terhadap uvicorn di port lain dengan `DATABASE_PATH` sementara.
- **Frontend tidak punya test runner.** Verifikasi = `npm run typecheck && npm run lint && npm run build`, plus `node --experimental-strip-types <file>.ts` untuk modul murni.
- **Istilah domain Bahasa Indonesia** (`penduduk`, `pengurus`, `jenisKelamin`), primitif UI Bahasa Inggris (`Button`, `Table`).
- **Dilarang `any`** di TypeScript. `strict` menyala.
- **Nama kolom SQLite = nama field Pydantic** (camelCase), supaya `Penduduk(**row)` bekerja apa adanya.
- **File `.db` tidak pernah di-commit.** Sudah di `backend/.gitignore`.
- **Dua peran saja:** `ADMIN` dan `PENGURUS`. Tidak ada `USER`, tidak ada `WARGA`.
- **Setiap task berakhir dengan commit.** Jangan gabungkan dua task dalam satu commit.

---

### Task 1: Skema penduduk tanpa NIK & No. KK

**Files:**
- Modify: `backend/app/schemas/penduduk.py`
- Modify: `backend/app/data/db.py`
- Modify: `backend/app/data/store.py`

**Interfaces:**
- Consumes: —
- Produces: `Penduduk` tanpa field `nik`/`noKK`, dengan `id: str` (UUID4). `db.SKEMA` tanpa tabel `warga_akun` dan tanpa kolom `nik`/`noKK`. `store.DAFTAR_PENDUDUK: list[Penduduk]`. Konstanta `KARTU_KELUARGA_BY_NOKK` dan fungsi `bangun_kartu_keluarga` **tidak ada lagi** — jangan diimpor di task mana pun.

- [ ] **Step 1: Perbarui skema Pydantic**

Di `backend/app/schemas/penduduk.py`, hapus dua baris field dari `class Penduduk`:

```python
    nik: str
    noKK: str
```

Hapus seluruh `class KartuKeluarga` (definisinya, bukan cuma isinya). Ubah docstring `class Penduduk` seperlunya. Ubah komentar di atas `StatusHubunganKeluarga` menjadi:

```python
# Susunan rumah tangga. Nomor KK tidak disimpan (spec 2026-08-26), tapi peran
# tiap orang di keluarganya tetap berguna dan tetap jadi filter.
StatusHubunganKeluarga = Literal[
    "KEPALA_KELUARGA", "ISTRI", "ANAK", "FAMILI_LAIN", "LAINNYA"
]
```

Di `class RincianRw` dan `class StatistikPublik`, hapus field `totalKK: int` beserta komentarnya.

- [ ] **Step 2: Perbarui skema SQLite**

Di `backend/app/data/db.py`, ubah `SKEMA` menjadi:

```python
SKEMA = """
CREATE TABLE IF NOT EXISTS penduduk (
    id                     TEXT PRIMARY KEY,
    nama                   TEXT NOT NULL,
    jenisKelamin           TEXT NOT NULL,
    tempatLahir            TEXT NOT NULL,
    tanggalLahir           TEXT NOT NULL,
    agama                  TEXT NOT NULL,
    statusPerkawinan       TEXT NOT NULL,
    pendidikan             TEXT NOT NULL,
    pekerjaan              TEXT NOT NULL,
    golonganDarah          TEXT NOT NULL,
    statusHubunganKeluarga TEXT NOT NULL,
    kewarganegaraan        TEXT NOT NULL,
    alamat_jalan           TEXT NOT NULL,
    alamat_rt              TEXT NOT NULL,
    alamat_rw              TEXT NOT NULL,
    alamat_desa            TEXT NOT NULL,
    alamat_kecamatan       TEXT NOT NULL,
    alamat_kabupaten       TEXT NOT NULL,
    alamat_provinsi        TEXT NOT NULL,
    alamat_kodePos         TEXT NOT NULL,
    statusKependudukan     TEXT NOT NULL DEFAULT 'AKTIF',
    deletedAt              TEXT
);
"""
```

Perbarui docstring modul: dua tabel jadi satu, dan komentar "Semua TEXT: NIK & no KK berawalan angka 0" diganti — alasannya sekarang `alamat_rt`/`alamat_rw`/`alamat_kodePos` yang berawalan nol.

Hapus fungsi `nik_sudah_ada`, `warga_akun_ambil`, `warga_akun_simpan`, `warga_akun_hapus`, `warga_akun_niks` beserta seluruh SQL-nya. Tambahkan:

```python
def kosongkan(conn: sqlite3.Connection) -> int:
    """Hapus seluruh baris penduduk. Dipakai impor: Excel adalah sumber
    kebenaran tunggal, jadi tiap impor menimpa, bukan menambah."""
    jumlah = conn.execute("SELECT COUNT(*) FROM penduduk").fetchone()[0]
    conn.execute("DELETE FROM penduduk")
    conn.commit()
    return jumlah
```

- [ ] **Step 3: Perbarui self-check `db.py`**

Di blok `if __name__ == "__main__":` (atau fungsi `demo()`), buang setiap `nik=`/`noKK=` dari objek `Penduduk` contoh dan ganti `id=` dengan UUID literal. Tambahkan assert baru:

```python
    assert db_kosongkan_bekerja(), "kosongkan() harus mengembalikan tabel ke nol baris"
```

Implementasikan pemeriksaannya inline (bukan helper terpisah) mengikuti gaya self-check yang sudah ada di file itu: simpan 2 baris, panggil `kosongkan`, pastikan `muat()` mengembalikan list kosong dan nilai kembaliannya `2`.

- [ ] **Step 4: Jalankan self-check, harus gagal dulu**

Run: `cd backend && .venv/bin/python -m app.data.db`
Expected: FAIL — `store.py` masih mengimpor `KartuKeluarga`. Ini yang diperbaiki di step berikutnya.

- [ ] **Step 5: Sederhanakan `store.py`**

Ganti seluruh `backend/app/data/store.py` menjadi:

```python
"""Sumber data yang dibaca router — satu-satunya tempat data penduduk masuk
ke proses, jadi router tidak perlu tahu datanya lahir dari mana.

Datanya tinggal di SQLite (`settings.DATABASE_PATH`). **Tidak ada seeding
otomatis**: DB kosong tetap kosong, dan itu disengaja. Data masuk lewat
`app/data/impor_excel.py` dari file Excel hasil pendataan pengurus.

ponytail: seluruh tabel dibaca ke memori sekali saat impor modul. Ceilingnya
dua: (1) data puluhan ribu baris, (2) endpoint tulis penduduk — begitu ada
`POST/PATCH /penduduk`, cache ini basi dan router harus query `db.py`
langsung. Ganti isi modul ini, bukan tiap router.

Akun pengurus TIDAK di sini: tabelnya ditulis saat runtime, jadi cache
impor-sekali akan basi. Lihat `app/data/pengurus.py`.
"""

from app.core.config import settings
from app.data import db
from app.schemas.penduduk import Penduduk

_conn = db.buka(settings.DATABASE_FILE)
_SEMUA_PENDUDUK = db.muat(_conn)
_conn.close()

# Baris ber-`deletedAt` = salah input, datanya memang tidak pernah valid, jadi
# tidak pernah ikut daftar maupun statistik. Disaring di sini, satu tempat.
# `statusKependudukan` PINDAH/MENINGGAL sengaja TIDAK disaring — datanya sah,
# yang berubah statusnya, dan untuk sementara tetap ikut dihitung.
DAFTAR_PENDUDUK: list[Penduduk] = [p for p in _SEMUA_PENDUDUK if p.deletedAt is None]
```

- [ ] **Step 6: Jalankan self-check sampai lolos**

Run: `cd backend && .venv/bin/python -m app.data.db`
Expected: PASS, tanpa exception.

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas/penduduk.py backend/app/data/db.py backend/app/data/store.py
git commit -m "refactor(backend): hapus kolom nik & noKK dari skema penduduk"
```

---

### Task 2: Tabel `pengurus` + bootstrap ADMIN

**Files:**
- Create: `backend/app/data/pengurus.py`
- Delete: `backend/app/data/akun.py`
- Modify: `backend/app/data/db.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`

**Interfaces:**
- Consumes: `db.buka`, `db.koneksi`, `settings.DATABASE_FILE` (Task 1).
- Produces:
  - `db.SKEMA` berisi tabel `pengurus`.
  - `pengurus.Pengurus` dataclass: `id: str`, `username: str`, `nama: str`, `role: str`, `rw: str | None`, `rt: str | None`, `aktif: bool`.
  - `pengurus.jabatan_dari(role: str, rw: str | None, rt: str | None) -> str`
  - `pengurus.cari_by_username(username: str) -> tuple[Pengurus, bytes] | None` — pengurus + password hash.
  - `pengurus.cari_by_id(id: str) -> Pengurus | None`
  - `pengurus.daftar() -> list[Pengurus]`
  - `pengurus.tambah(username, password, nama, role, rw, rt) -> Pengurus` — raise `ValueError` kalau username sudah dipakai.
  - `pengurus.ubah(id, *, nama=None, rw=..., rt=..., aktif=None) -> Pengurus | None`
  - `pengurus.ganti_password(id: str, password: str) -> bool`
  - `pengurus.bootstrap() -> None`
  - `settings.ADMIN_USERNAME: str`, `settings.ADMIN_PASSWORD: str` (default `""` keduanya).

- [ ] **Step 1: Tambah tabel `pengurus` ke skema**

Di `backend/app/data/db.py`, tambahkan ke `SKEMA` setelah tabel `penduduk`:

```sql
-- Akun perangkat desa. Satu-satunya akun yang ada — warga tidak punya akun
-- (spec 2026-08-26). Di SQLite, bukan di memori: akun ditambah & dinonaktifkan
-- oleh ADMIN saat runtime, jadi harus selamat melewati restart.
-- `jabatan` sengaja TIDAK disimpan: diturunkan dari role + rw + rt, supaya
-- tidak ada dua sumber kebenaran yang bisa berbeda diam-diam.
CREATE TABLE IF NOT EXISTS pengurus (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash BLOB NOT NULL,
    nama          TEXT NOT NULL,
    role          TEXT NOT NULL,
    rw            TEXT,
    rt            TEXT,
    aktif         INTEGER NOT NULL DEFAULT 1
);
```

- [ ] **Step 2: Tambah env var ADMIN ke config**

Di `backend/app/core/config.py`, **hapus** field `KODE_WILAYAH` beserta komentarnya (satu-satunya pemakainya adalah NIK palsu akun pengurus, yang dihapus di task ini). Tambahkan di bagian Runtime:

```python
    # --- Bootstrap ADMIN pertama -------------------------------------------
    # Dipakai HANYA saat tabel `pengurus` masih kosong. Kalau kosong dan dua
    # nilai ini belum diisi, backend menolak jalan — memakai default berarti
    # ada instalasi yang berjalan dengan password yang tertulis di kode publik.
    ADMIN_USERNAME: str = ""
    ADMIN_PASSWORD: str = ""
```

Tambahkan dua baris ke `backend/.env.example`:

```
# Wajib diisi saat pertama kali menjalankan backend dengan database kosong.
# Setelah akun ADMIN pertama terbentuk, dua nilai ini tidak dipakai lagi.
ADMIN_USERNAME=dukuh
ADMIN_PASSWORD=ganti-password-ini
```

- [ ] **Step 3: Tulis `pengurus.py` dengan self-check yang gagal duluan**

Buat `backend/app/data/pengurus.py`:

```python
"""Akun perangkat desa (Dukuh/RW/RT) — satu-satunya akun yang ada.

Dibaca lewat koneksi sekali pakai per operasi, BUKAN lewat cache `store.py`:
tabelnya ditulis saat runtime (ADMIN menambah & menonaktifkan akun), jadi
cache impor-sekali akan basi.

Password selalu di-hash bcrypt, tidak pernah disimpan polos.
"""

import uuid
from dataclasses import dataclass

from app.core.config import settings
from app.core.security import hash_rahasia
from app.data import db

ROLE_ADMIN = "ADMIN"
ROLE_PENGURUS = "PENGURUS"


@dataclass
class Pengurus:
    id: str
    username: str
    nama: str
    role: str
    rw: str | None
    rt: str | None
    aktif: bool

    @property
    def jabatan(self) -> str:
        return jabatan_dari(self.role, self.rw, self.rt)


def jabatan_dari(role: str, rw: str | None, rt: str | None) -> str:
    """Label jabatan diturunkan, tidak disimpan. Urutan periksa dari yang
    paling spesifik: RT ada berarti Ketua RT, apa pun isi RW-nya."""
    if rt:
        return f"Ketua RT {rt}"
    if rw:
        return f"Ketua RW {rw}"
    return "Dukuh"


def _db():
    return db.koneksi(settings.DATABASE_FILE)


def _dari_row(row) -> Pengurus:
    return Pengurus(
        id=row["id"],
        username=row["username"],
        nama=row["nama"],
        role=row["role"],
        rw=row["rw"],
        rt=row["rt"],
        aktif=bool(row["aktif"]),
    )


def cari_by_username(username: str) -> tuple[Pengurus, bytes] | None:
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
) -> Pengurus:
    """Raise `ValueError` kalau username sudah dipakai."""
    baru = Pengurus(
        id=str(uuid.uuid4()),
        username=username,
        nama=nama,
        role=role,
        rw=rw or None,
        rt=rt or None,
        aktif=True,
    )
    with _db() as conn:
        sudah = conn.execute(
            "SELECT 1 FROM pengurus WHERE username = ?", (username,)
        ).fetchone()
        if sudah:
            raise ValueError(f"Username '{username}' sudah dipakai.")
        conn.execute(
            "INSERT INTO pengurus (id, username, password_hash, nama, role, rw, rt,"
            " aktif) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
            (
                baru.id,
                baru.username,
                hash_rahasia(password),
                baru.nama,
                baru.role,
                baru.rw,
                baru.rt,
            ),
        )
        conn.commit()
    return baru


# Penanda "argumen tidak dikirim", supaya `rw=None` yang berarti "kosongkan"
# bisa dibedakan dari "jangan sentuh".
_TETAP = object()


def ubah(
    id: str,
    *,
    nama: str | None = None,
    rw: object = _TETAP,
    rt: object = _TETAP,
    aktif: bool | None = None,
) -> Pengurus | None:
    ada = cari_by_id(id)
    if ada is None:
        return None
    kolom: list[str] = []
    nilai: list[object] = []
    if nama is not None:
        kolom.append("nama = ?")
        nilai.append(nama)
    if rw is not _TETAP:
        kolom.append("rw = ?")
        nilai.append(rw or None)
    if rt is not _TETAP:
        kolom.append("rt = ?")
        nilai.append(rt or None)
    if aktif is not None:
        kolom.append("aktif = ?")
        nilai.append(1 if aktif else 0)
    if not kolom:
        return ada
    with _db() as conn:
        conn.execute(
            f"UPDATE pengurus SET {', '.join(kolom)} WHERE id = ?", (*nilai, id)
        )
        conn.commit()
    return cari_by_id(id)


def ganti_password(id: str, password: str) -> bool:
    with _db() as conn:
        cur = conn.execute(
            "UPDATE pengurus SET password_hash = ? WHERE id = ?",
            (hash_rahasia(password), id),
        )
        conn.commit()
    return cur.rowcount > 0


def bootstrap() -> None:
    """Buat akun ADMIN pertama kalau tabel masih kosong.

    Menolak jalan (bukan memakai default) ketika tabel kosong tapi env belum
    diisi: default berarti ada instalasi yang berjalan dengan password yang
    tertulis di kode publik.
    """
    with _db() as conn:
        ada = conn.execute("SELECT 1 FROM pengurus LIMIT 1").fetchone()
    if ada:
        return
    if not settings.ADMIN_USERNAME or not settings.ADMIN_PASSWORD:
        raise RuntimeError(
            "Tabel pengurus kosong dan belum ada akun ADMIN pertama.\n"
            "Isi ADMIN_USERNAME dan ADMIN_PASSWORD di backend/.env lalu jalankan "
            "ulang. Lihat backend/.env.example."
        )
    tambah(
        username=settings.ADMIN_USERNAME,
        password=settings.ADMIN_PASSWORD,
        nama="Dukuh",
        role=ROLE_ADMIN,
    )
    print(f"  Akun ADMIN pertama dibuat: {settings.ADMIN_USERNAME}")


def demo() -> None:
    """Self-check. Jalankan: .venv/bin/python -m app.data.pengurus"""
    assert jabatan_dari(ROLE_ADMIN, None, None) == "Dukuh"
    assert jabatan_dari(ROLE_PENGURUS, "019", None) == "Ketua RW 019"
    assert jabatan_dari(ROLE_PENGURUS, "019", "03") == "Ketua RT 03"

    p = tambah("uji-rt", "rahasia", "Fajar", ROLE_PENGURUS, rw="019", rt="03")
    assert p.jabatan == "Ketua RT 03"
    assert cari_by_username("uji-rt") is not None
    try:
        tambah("uji-rt", "lain", "Kembar", ROLE_PENGURUS)
        raise AssertionError("username ganda harus ditolak")
    except ValueError:
        pass

    diubah = ubah(p.id, aktif=False)
    assert diubah is not None and diubah.aktif is False
    assert ubah(p.id, nama="Fajar N.") is not None
    assert cari_by_id(p.id).nama == "Fajar N."  # type: ignore[union-attr]
    assert ganti_password(p.id, "baru") is True
    assert ganti_password("tidak-ada", "baru") is False
    assert ubah("tidak-ada", nama="x") is None

    print("OK: app/data/pengurus.py")


if __name__ == "__main__":
    demo()
```

- [ ] **Step 4: Jalankan self-check di DB sekali pakai**

Run:
```bash
cd backend && DATABASE_PATH=/tmp/uji-pengurus.db .venv/bin/python -m app.data.pengurus
```
Expected: `OK: app/data/pengurus.py`. Kalau gagal karena file DB lama, `rm /tmp/uji-pengurus.db` dulu.

- [ ] **Step 5: Verifikasi bootstrap menolak jalan tanpa env**

Run:
```bash
cd backend && rm -f /tmp/uji-boot.db && DATABASE_PATH=/tmp/uji-boot.db ADMIN_USERNAME= ADMIN_PASSWORD= \
  .venv/bin/python -c "from app.data.pengurus import bootstrap; bootstrap()"
```
Expected: `RuntimeError` dengan pesan yang menyebut `ADMIN_USERNAME` dan `ADMIN_PASSWORD`.

Lalu:
```bash
cd backend && DATABASE_PATH=/tmp/uji-boot.db ADMIN_USERNAME=dukuh ADMIN_PASSWORD=rahasia123 \
  .venv/bin/python -c "from app.data.pengurus import bootstrap, daftar; bootstrap(); print(daftar())"
```
Expected: satu `Pengurus` ber-`role='ADMIN'`, `aktif=True`.

- [ ] **Step 6: Hapus `akun.py`**

```bash
git rm backend/app/data/akun.py
```

Modul ini akan bikin import error di `auth.py` sampai Task 3 selesai — itu diharapkan, dan Task 3 langsung menyusul.

- [ ] **Step 7: Commit**

```bash
git add backend/app/data/pengurus.py backend/app/data/db.py backend/app/core/config.py backend/.env.example
git commit -m "feat(backend): tabel pengurus di SQLite + bootstrap ADMIN dari env"
```

---

### Task 3: Rombak `auth.py` — cabut seluruh jalur warga

**Files:**
- Modify: `backend/app/api/routers/auth.py`
- Modify: `backend/app/schemas/auth.py`
- Delete: `backend/app/core/ratelimit.py`
- Modify: `backend/app/core/audit.py`

**Interfaces:**
- Consumes: `pengurus.cari_by_username`, `pengurus.cari_by_id`, `pengurus.Pengurus`, `pengurus.jabatan_dari` (Task 2).
- Produces:
  - `AuthUser` (Pydantic): `id`, `nama`, `username`, `role: Literal["ADMIN","PENGURUS"]`, `rw: str | None`, `rt: str | None`, `jabatan: str`.
  - `auth.current_user(...) -> AuthUser` — dependency, semua pengurus yang login.
  - `auth.current_admin(...) -> AuthUser` — dependency, hanya `role == "ADMIN"`.
  - `auth.ke_auth_user(p: Pengurus) -> AuthUser`
  - `Session` (`token`, `user`), `PetugasCredentials` (`username`, `password`).
- Catatan penting untuk task berikutnya: **`current_user` sekarang berarti "pengurus mana pun"**, bukan lagi "warga atau admin". Endpoint baca penduduk memakai `current_user`, bukan `current_admin`.

- [ ] **Step 1: Rampingkan `schemas/auth.py`**

Ganti seluruh isi `backend/app/schemas/auth.py`:

```python
"""Skema autentikasi — cerminan `frontend/src/features/auth/types.ts`.
Bentuknya wajib sama; kalau salah satu berubah, ubah dua-duanya.

Warga tidak punya akun (spec 2026-08-26), jadi tidak ada skema PIN,
aktivasi, maupun kontak di sini.
"""

from typing import Literal, Optional

from pydantic import BaseModel

Role = Literal["ADMIN", "PENGURUS"]


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


class PetugasCredentials(BaseModel):
    username: str
    password: str


class Session(BaseModel):
    token: str
    user: AuthUser
```

- [ ] **Step 2: Tulis ulang `auth.py`**

Ganti seluruh isi `backend/app/api/routers/auth.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import buat_token, cocok_rahasia, urai_token
from app.data import pengurus as data_pengurus
from app.schemas.auth import AuthUser, PetugasCredentials, Session

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)

PESAN_NONAKTIF = (
    "Akun Anda sudah dinonaktifkan. Hubungi Dukuh untuk mengaktifkannya kembali."
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
    )


async def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthUser:
    """Bangun ulang `AuthUser` dari DB tiap request, bukan dari klaim token —
    supaya perubahan nama, wilayah, atau status aktif langsung berlaku.

    ponytail: akun yang dinonaktifkan tetap punya token yang secara kriptografi
    sah sampai TTL habis; yang menolaknya adalah pemeriksaan `aktif` di sini.
    Pindah ke sesi server-side kalau pencabutan harus berlaku lebih tegas.
    """
    if creds is None:
        raise HTTPException(401, "Sesi tidak ditemukan. Silakan masuk.")
    user_id = urai_token(creds.credentials)
    if user_id is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    p = data_pengurus.cari_by_id(user_id)
    if p is None:
        raise HTTPException(401, "Sesi tidak valid atau sudah kedaluwarsa.")
    if not p.aktif:
        raise HTTPException(403, PESAN_NONAKTIF)
    return ke_auth_user(p)


async def current_admin(user: AuthUser = Depends(current_user)) -> AuthUser:
    """Kelola akun pengurus. Sengaja dipisah dari `current_user`: membaca data
    warga dan mengelola akun adalah dua kewenangan berbeda."""
    if user.role != "ADMIN":
        raise HTTPException(403, "Hanya untuk Dukuh.")
    return user


@router.post("/login", response_model=Session)
async def login(payload: PetugasCredentials) -> Session:
    hasil = data_pengurus.cari_by_username(payload.username)
    if hasil is None or not cocok_rahasia(payload.password, hasil[1]):
        raise HTTPException(401, "Username atau password salah.")
    p, _ = hasil
    # Dibedakan dari salah password: pengurus yang akunnya dimatikan perlu tahu
    # harus menghubungi siapa, bukan mengira salah ketik.
    if not p.aktif:
        raise HTTPException(403, PESAN_NONAKTIF)
    user = ke_auth_user(p)
    return Session(token=buat_token(user.id), user=user)


@router.post("/logout", status_code=204)
async def logout() -> None:
    return None
```

- [ ] **Step 3: Hapus rate limit & sesuaikan audit**

```bash
git rm backend/app/core/ratelimit.py
```

Di `backend/app/core/audit.py`, ganti parameter `target_nik` menjadi `target` (string bebas: id pengurus atau username), dan perbarui docstring-nya. Signature akhir:

```python
def catat_audit(*, aktor: str, aksi: str, target: str, catatan: str = "") -> None:
```

- [ ] **Step 4: Pastikan tidak ada sisa impor**

Run:
```bash
cd backend && grep -rn "ratelimit\|akun\b\|WargaAccount\|nik\|noKK\|KartuKeluarga" app/ --include=*.py
```
Expected: hanya kemunculan di `app/api/routers/penduduk.py`, `app/api/routers/infografis.py`, `app/api/routers/publik.py`, `app/data/agregat.py`, `app/data/impor_excel.py`, `app/main.py` — semuanya dibereskan di Task 4–7. Tidak boleh ada lagi di `app/core/` maupun `app/schemas/`.

- [ ] **Step 5: Commit**

```bash
git add -A backend/app/api/routers/auth.py backend/app/schemas/auth.py backend/app/core/
git commit -m "refactor(backend): cabut autentikasi warga, login khusus pengurus"
```

---

### Task 4: Router penduduk — filter kategori menggantikan pencarian NIK

**Files:**
- Modify: `backend/app/api/routers/penduduk.py`
- Modify: `backend/app/schemas/penduduk.py`
- Modify: `backend/app/data/agregat.py`

**Interfaces:**
- Consumes: `store.DAFTAR_PENDUDUK` (Task 1), `auth.current_user` (Task 3), `agregat.umur`, `agregat.kelompok_umur`, `agregat.KELOMPOK_UMUR`.
- Produces:
  - `GET /penduduk` menerima `page`, `pageSize`, `search`, `jenisKelamin`, `agama`, `golonganDarah`, `pendidikan`, `statusPerkawinan`, `statusHubunganKeluarga`, `pekerjaan`, `rt`, `rw`, `kelompokUmur`.
  - `GET /penduduk/{id}` -> `Penduduk`.
  - `GET /penduduk/filter-opsi` -> `FilterOpsi` (`rt: list[str]`, `rw: list[str]`, `pekerjaan: list[str]`).
  - `penduduk.saring(daftar, **filter) -> list[Penduduk]` — fungsi murni, bisa diuji sendiri.

- [ ] **Step 1: Tambah skema `FilterOpsi`**

Di `backend/app/schemas/penduduk.py`, tambahkan setelah `PaginatedPenduduk`:

```python
class FilterOpsi(BaseModel):
    """Pilihan filter yang BUKAN enum — nilainya cuma bisa diketahui dari isi
    data. Enum (agama, pendidikan, …) sudah ada di frontend `labels.ts`, jadi
    tidak dikirim lewat jaringan."""

    rt: list[str]
    rw: list[str]
    pekerjaan: list[str]
```

- [ ] **Step 2: Bersihkan `agregat.py` dari Penduduk palsu ber-NIK**

Di `backend/app/data/agregat.py` sekitar baris 118–125 ada objek `Penduduk` contoh dengan `nik="0"` dan `noKK="0"` (dipakai self-check). Hapus dua argumen itu dan ganti `id=` dengan `id="uji"`. Jalankan `cd backend && .venv/bin/python -m app.data.agregat` — harus lolos.

- [ ] **Step 3: Tulis ulang router penduduk**

Ganti seluruh isi `backend/app/api/routers/penduduk.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.routers.auth import current_user
from app.data.agregat import kelompok_umur, umur
from app.data.store import DAFTAR_PENDUDUK
from app.schemas.auth import AuthUser
from app.schemas.penduduk import FilterOpsi, PaginatedPenduduk, Penduduk

router = APIRouter(tags=["penduduk"])

# Filter yang cukup dibandingkan sama-persis dengan satu field `Penduduk`.
# Ditulis sebagai peta supaya menambah filter enum baru = satu baris di sini,
# bukan satu cabang `if` lagi di dalam loop.
_FILTER_LANGSUNG = (
    "jenisKelamin",
    "agama",
    "golonganDarah",
    "pendidikan",
    "statusPerkawinan",
    "statusHubunganKeluarga",
)


def saring(
    daftar: list[Penduduk],
    *,
    search: str = "",
    pekerjaan: str = "",
    rt: str = "",
    rw: str = "",
    kelompokUmur: str = "",
    **enum_filter: str,
) -> list[Penduduk]:
    """Semua filter digabung AND; nilai kosong tidak menyaring apa pun.

    ponytail: disaring di memori atas cache `store.py`, bukan lewat SQL —
    data satu padukuhan muat di RAM dan sudah dimuat saat start. Pindah ke
    WHERE clause kalau datanya nanti puluhan ribu baris.
    """
    q = search.strip().lower()
    hasil = daftar
    if q:
        hasil = [p for p in hasil if q in p.nama.lower()]
    for field in _FILTER_LANGSUNG:
        nilai = enum_filter.get(field, "")
        if nilai:
            hasil = [p for p in hasil if getattr(p, field) == nilai]
    if pekerjaan:
        hasil = [p for p in hasil if p.pekerjaan == pekerjaan]
    if rt:
        hasil = [p for p in hasil if p.alamat.rt == rt]
    if rw:
        hasil = [p for p in hasil if p.alamat.rw == rw]
    if kelompokUmur:
        hasil = [
            p for p in hasil if kelompok_umur(umur(p.tanggalLahir)) == kelompokUmur
        ]
    return hasil


@router.get("/penduduk", response_model=PaginatedPenduduk)
def list_penduduk(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=200),
    search: str = "",
    jenisKelamin: str = "",
    agama: str = "",
    golonganDarah: str = "",
    pendidikan: str = "",
    statusPerkawinan: str = "",
    statusHubunganKeluarga: str = "",
    pekerjaan: str = "",
    rt: str = "",
    rw: str = "",
    kelompokUmur: str = "",
    _user: AuthUser = Depends(current_user),
) -> PaginatedPenduduk:
    hasil = saring(
        DAFTAR_PENDUDUK,
        search=search,
        pekerjaan=pekerjaan,
        rt=rt,
        rw=rw,
        kelompokUmur=kelompokUmur,
        jenisKelamin=jenisKelamin,
        agama=agama,
        golonganDarah=golonganDarah,
        pendidikan=pendidikan,
        statusPerkawinan=statusPerkawinan,
        statusHubunganKeluarga=statusHubunganKeluarga,
    )
    start = (page - 1) * pageSize
    return PaginatedPenduduk(
        items=hasil[start : start + pageSize],
        total=len(hasil),
        page=page,
        pageSize=pageSize,
    )


# Ditulis SEBELUM `/penduduk/{id}`: rute statis harus menang atas rute
# ber-parameter, kalau tidak "filter-opsi" akan terbaca sebagai sebuah id.
@router.get("/penduduk/filter-opsi", response_model=FilterOpsi)
def filter_opsi(_user: AuthUser = Depends(current_user)) -> FilterOpsi:
    return FilterOpsi(
        rt=sorted({p.alamat.rt for p in DAFTAR_PENDUDUK}),
        rw=sorted({p.alamat.rw for p in DAFTAR_PENDUDUK}),
        pekerjaan=sorted({p.pekerjaan for p in DAFTAR_PENDUDUK if p.pekerjaan}),
    )


@router.get("/penduduk/{id}", response_model=Penduduk)
def get_by_id(id: str, _user: AuthUser = Depends(current_user)) -> Penduduk:
    for p in DAFTAR_PENDUDUK:
        if p.id == id:
            return p
    raise HTTPException(status_code=404, detail="Penduduk tidak ditemukan")
```

- [ ] **Step 4: Verifikasi urutan rute & fungsi saring**

Run:
```bash
cd backend && .venv/bin/python -c "
from app.api.routers.penduduk import saring
from app.schemas.penduduk import Alamat, Penduduk

def orang(nama, agama, gol, rt, lahir):
    return Penduduk(id=nama, nama=nama, jenisKelamin='LAKI_LAKI', tempatLahir='X',
        tanggalLahir=lahir, agama=agama, statusPerkawinan='KAWIN', pendidikan='SMA',
        pekerjaan='Petani', golonganDarah=gol, statusHubunganKeluarga='KEPALA_KELUARGA',
        kewarganegaraan='WNI', alamat=Alamat(jalan='J', rt=rt, rw='019', desa='D',
        kecamatan='K', kabupaten='B', provinsi='P', kodePos='40615'))

d = [orang('Ani','ISLAM','O','001','1990-01-01'), orang('Budi','KRISTEN','O','002','1950-01-01')]
assert len(saring(d)) == 2
assert [p.nama for p in saring(d, agama='ISLAM')] == ['Ani']
assert [p.nama for p in saring(d, golonganDarah='O', rt='002')] == ['Budi']
assert saring(d, agama='ISLAM', rt='002') == []
assert [p.nama for p in saring(d, search='bu')] == ['Budi']
assert [p.nama for p in saring(d, kelompokUmur='60+')] == ['Budi']
print('OK: saring')
"
```
Expected: `OK: saring`

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routers/penduduk.py backend/app/schemas/penduduk.py backend/app/data/agregat.py
git commit -m "feat(backend): filter kategori pada GET /penduduk, hapus lookup NIK & KK"
```

---

### Task 5: Router `/pengurus` — kelola akun (ADMIN)

**Files:**
- Create: `backend/app/api/routers/pengurus.py`
- Create: `backend/app/schemas/pengurus.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `data.pengurus.*` (Task 2), `auth.current_admin`, `auth.ke_auth_user` (Task 3), `audit.catat_audit` (Task 3).
- Produces: `GET /pengurus`, `POST /pengurus`, `PATCH /pengurus/{id}`, `POST /pengurus/{id}/reset-password`, semuanya ADMIN-only. Response model `AuthUser`.

- [ ] **Step 1: Skema payload**

Buat `backend/app/schemas/pengurus.py`:

```python
"""Payload kelola akun pengurus — cerminan `frontend/src/features/pengurus/types.ts`."""

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.auth import Role


class PengurusBaru(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8)
    nama: str = Field(min_length=1)
    role: Role
    rw: Optional[str] = None
    rt: Optional[str] = None


class PengurusUbah(BaseModel):
    """Field yang tidak dikirim tidak diubah. `rw`/`rt` bernilai null berarti
    dikosongkan — bedanya ditangkap lewat `model_fields_set`."""

    nama: Optional[str] = None
    rw: Optional[str] = None
    rt: Optional[str] = None
    aktif: Optional[bool] = None


class PasswordBaru(BaseModel):
    password: str = Field(min_length=8)
```

- [ ] **Step 2: Router**

Buat `backend/app/api/routers/pengurus.py`:

```python
"""Kelola akun perangkat desa. ADMIN saja.

Tidak ada DELETE: akun yang pernah dipakai tidak dihapus, cukup dinonaktifkan
(`aktif = 0`). Menghapusnya membuat jejak audit menunjuk ke akun yang tidak
ada lagi.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.api.routers.auth import current_admin, ke_auth_user
from app.core.audit import catat_audit
from app.data import pengurus as data
from app.schemas.auth import AuthUser
from app.schemas.pengurus import PasswordBaru, PengurusBaru, PengurusUbah

router = APIRouter(prefix="/pengurus", tags=["pengurus"], dependencies=[Depends(current_admin)])


@router.get("", response_model=list[AuthUser])
def daftar_pengurus() -> list[AuthUser]:
    return [ke_auth_user(p) for p in data.daftar()]


@router.post("", response_model=AuthUser, status_code=201)
def tambah_pengurus(
    payload: PengurusBaru, admin: AuthUser = Depends(current_admin)
) -> AuthUser:
    try:
        baru = data.tambah(
            username=payload.username,
            password=payload.password,
            nama=payload.nama,
            role=payload.role,
            rw=payload.rw,
            rt=payload.rt,
        )
    except ValueError as e:
        raise HTTPException(409, str(e))
    catat_audit(aktor=admin.username, aksi="tambah-pengurus", target=baru.username)
    return ke_auth_user(baru)


@router.patch("/{id}", response_model=AuthUser)
def ubah_pengurus(
    id: str, payload: PengurusUbah, admin: AuthUser = Depends(current_admin)
) -> AuthUser:
    dikirim = payload.model_fields_set
    hasil = data.ubah(
        id,
        nama=payload.nama,
        rw=payload.rw if "rw" in dikirim else data._TETAP,
        rt=payload.rt if "rt" in dikirim else data._TETAP,
        aktif=payload.aktif,
    )
    if hasil is None:
        raise HTTPException(404, "Akun pengurus tidak ditemukan.")
    catat_audit(
        aktor=admin.username,
        aksi="ubah-pengurus",
        target=hasil.username,
        catatan=", ".join(sorted(dikirim)),
    )
    return ke_auth_user(hasil)


@router.post("/{id}/reset-password", status_code=204)
def reset_password(
    id: str, payload: PasswordBaru, admin: AuthUser = Depends(current_admin)
) -> None:
    target = data.cari_by_id(id)
    if target is None or not data.ganti_password(id, payload.password):
        raise HTTPException(404, "Akun pengurus tidak ditemukan.")
    catat_audit(aktor=admin.username, aksi="reset-password", target=target.username)
```

Catatan: `data._TETAP` memang privat, dan dipakai lintas modul di sini secara sadar — sentinel itu bagian dari kontrak `ubah()`. Kalau terasa mengganggu, ekspor ulang sebagai `data.TETAP` di Task 2 dan pakai nama itu di dua tempat.

- [ ] **Step 3: Daftarkan router & perbaiki startup**

Di `backend/app/main.py`:
- Tambah `pengurus` ke baris impor router.
- Tambah `app.include_router(pengurus.router)`.
- Ganti isi `_cetak_status_awal` menjadi:

```python
@app.on_event("startup")
def _startup() -> None:
    """Bootstrap akun ADMIN pertama, lalu ringkasan keadaan data.

    Tidak ada kredensial yang dicetak: begitu tabelnya berisi data pendataan
    sungguhan, log server jadi tempat bocornya.
    """
    bootstrap()
    print("=== SIDUK backend ===")
    print(f"  Akun pengurus: {len(daftar_pengurus_data())} akun terdaftar")
    if DAFTAR_PENDUDUK:
        print(f"  Data penduduk: {len(DAFTAR_PENDUDUK)} jiwa terbaca dari DB")
    else:
        print("  Data penduduk: KOSONG — impor dulu:")
        print("    .venv/bin/python -m app.data.impor_excel ../docs/data-penduduk.xlsx")
    print("=====================")
```

Impornya: `from app.data.pengurus import bootstrap, daftar as daftar_pengurus_data`.

- [ ] **Step 4: Uji ujung-ke-ujung endpoint pengurus**

Run:
```bash
cd backend && rm -f /tmp/uji-api.db && \
  DATABASE_PATH=/tmp/uji-api.db ADMIN_USERNAME=dukuh ADMIN_PASSWORD=rahasia123 \
  .venv/bin/uvicorn app.main:app --port 8001 > /tmp/uji-api.log 2>&1 & echo $! > /tmp/uji-api.pid
```

Tunggu sampai `/health` menjawab, lalu:

```bash
.venv/bin/python - <<'PY'
import json, urllib.request, urllib.error

def panggil(metode, path, data=None, token=None):
    req = urllib.request.Request(
        f"http://127.0.0.1:8001{path}", method=metode,
        data=json.dumps(data).encode() if data is not None else None,
    )
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            isi = r.read()
            return r.status, json.loads(isi) if isi else None
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")

kode, sesi = panggil("POST", "/auth/login", {"username": "dukuh", "password": "rahasia123"})
assert kode == 200, (kode, sesi)
assert sesi["user"]["jabatan"] == "Dukuh"
assert "nik" not in sesi["user"], "AuthUser tidak boleh punya nik"
admin = sesi["token"]

kode, _ = panggil("POST", "/auth/login", {"username": "dukuh", "password": "salah"})
assert kode == 401

kode, rt = panggil("POST", "/pengurus", {"username": "rt03", "password": "rahasia123",
    "nama": "Fajar", "role": "PENGURUS", "rw": "019", "rt": "03"}, admin)
assert kode == 201 and rt["jabatan"] == "Ketua RT 03", (kode, rt)

kode, _ = panggil("POST", "/pengurus", {"username": "rt03", "password": "rahasia123",
    "nama": "Kembar", "role": "PENGURUS"}, admin)
assert kode == 409

kode, sesi_rt = panggil("POST", "/auth/login", {"username": "rt03", "password": "rahasia123"})
assert kode == 200
kode, _ = panggil("GET", "/pengurus", None, sesi_rt["token"])
assert kode == 403, "PENGURUS tidak boleh mengelola akun"

kode, _ = panggil("PATCH", f"/pengurus/{rt['id']}", {"aktif": False}, admin)
assert kode == 200
kode, pesan = panggil("POST", "/auth/login", {"username": "rt03", "password": "rahasia123"})
assert kode == 403 and "dinonaktifkan" in pesan["message"], (kode, pesan)

kode, _ = panggil("GET", "/pengurus", None, sesi_rt["token"])
assert kode == 403, "token lama akun nonaktif harus ditolak"

print("OK: endpoint /pengurus & login")
PY
kill "$(cat /tmp/uji-api.pid)"
```
Expected: `OK: endpoint /pengurus & login`

Jangan pakai `pkill -f uvicorn` untuk mematikannya — polanya cocok dengan shell yang menjalankannya.

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routers/pengurus.py backend/app/schemas/pengurus.py backend/app/main.py
git commit -m "feat(backend): endpoint kelola akun pengurus (ADMIN)"
```

---

### Task 6: Statistik tanpa `totalKK`

**Files:**
- Modify: `backend/app/api/routers/infografis.py`
- Modify: `backend/app/api/routers/publik.py`
- Modify: `backend/app/schemas/infografis.py`

**Interfaces:**
- Consumes: `store.DAFTAR_PENDUDUK` (Task 1), `auth.current_user` (Task 3).
- Produces: `GET /infografis` dan `GET /publik/statistik` tanpa field `totalKK` di level mana pun (termasuk di dalam `perRw` dan `perRt`).

- [ ] **Step 1: Hapus `totalKK` dari ketiga file**

Di `backend/app/api/routers/infografis.py` hapus baris `totalKK=len({p.noKK for p in DAFTAR_PENDUDUK}),`. Ubah dependency-nya dari `current_admin` menjadi `current_user` — infografis boleh dibaca semua pengurus, bukan cuma Dukuh (spec: baca tidak dibatasi wilayah maupun peran).

Di `backend/app/api/routers/publik.py` hapus dua baris `totalKK=...` (di sekitar baris 35 dan 54) beserta komentar panjang di atasnya yang menjelaskan kenapa totalKK dihitung se-desa.

Di `backend/app/schemas/infografis.py`, hapus field `totalKK` kalau ada.

- [ ] **Step 2: Verifikasi tidak ada sisa**

Run: `cd backend && grep -rn "totalKK\|noKK" app/`
Expected: tidak ada hasil sama sekali.

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/routers/infografis.py backend/app/api/routers/publik.py backend/app/schemas/infografis.py
git commit -m "refactor(backend): hapus totalKK dari infografis & statistik publik"
```

---

### Task 7: Impor Excel menimpa total

**Files:**
- Modify: `backend/app/data/impor_excel.py`
- Modify: `backend/tools/buat_template_excel.py`
- Delete: `backend/app/data/dummy.py`
- Delete: `backend/tools/buat_data_contoh.py`

**Interfaces:**
- Consumes: `db.kosongkan`, `db.simpan` (Task 1).
- Produces: `impor_excel.KOLOM` tanpa entri `noKK`/`nik`; `impor_excel.baris_ke_penduduk` yang membangkitkan `id` UUID4; skrip yang menimpa seluruh tabel.

- [ ] **Step 1: Hapus dua kolom dari definisi**

Di `backend/app/data/impor_excel.py`, hapus dua baris pertama dari `KOLOM`:

```python
    ("noKK", "No. KK", 18),
    ("nik", "NIK", 18),
```

- [ ] **Step 2: Ganti pembangkit id & deteksi baris kosong**

```python
import uuid

def baris_ke_penduduk(nilai: dict[str, str]) -> Penduduk:
    inti = {k: v for k, v in nilai.items() if k not in _ALAMAT}
    alamat = {k: v for k, v in nilai.items() if k in _ALAMAT}
    # `id` dibangkitkan, bukan diturunkan dari data: NIK tidak lagi disimpan
    # (spec 2026-08-26), dan tidak ada field lain yang dijamin unik.
    return Penduduk(id=str(uuid.uuid4()), alamat=Alamat(**alamat), **inti)
```

Di `baca_xlsx`, ganti penanda baris kosong dari `nik` ke `nama`:

```python
        if not r[peta["nama"]]:  # nama kosong = baris belum diisi, lewati
            continue
```

- [ ] **Step 3: Ganti alur `main()` jadi menimpa**

```python
def main(path_xlsx: str) -> None:
    daftar = baca_xlsx(path_xlsx)
    if not daftar:
        sys.exit("Tidak ada baris terisi — cek lagi apakah baris contoh sudah dihapus.")

    conn = db.buka(settings.DATABASE_FILE)
    lama = db.kosongkan(conn)
    masuk = db.simpan(conn, daftar)
    conn.close()
    if lama:
        print(f"PERHATIAN: {lama} baris lama dihapus dan diganti seluruhnya.")
    print(f"OK: {masuk} warga masuk ke {settings.DATABASE_FILE}")
    print("Restart backend supaya data ini kepakai — store.py baca tabel sekali saat start.")
```

Ganti bagian docstring modul yang menjelaskan penolakan NIK ganda menjadi:

```
File Excel adalah sumber kebenaran tunggal. Setiap impor MENIMPA seluruh
tabel penduduk — file yang diimpor harus selalu lengkap, bukan berisi warga
baru saja, atau warga lama akan terhapus.

Tidak ada dedup: tanpa NIK tidak ada kunci yang bisa dipercaya untuk mengenali
orang yang sama antar-impor, dan kandidat penggantinya (nama + tanggal lahir +
alamat) gagal persis pada kasus yang paling mungkin terjadi di satu padukuhan:
dua orang senama.
```

- [ ] **Step 4: Hapus generator data karangan**

```bash
git rm backend/app/data/dummy.py backend/tools/buat_data_contoh.py
```

Kalau `buat_data_contoh.py` ternyata yang membangkitkan `docs/data-penduduk.xlsx` dan kamu masih butuh data contoh untuk dev, **jangan hapus** — cukup buang kolom `noKK`/`nik` dari pembangkitnya, dan catat itu di pesan commit.

- [ ] **Step 5: Bangkitkan ulang template Excel**

Run:
```bash
cd backend && .venv/bin/python tools/buat_template_excel.py
```
Expected: `docs/template-data-penduduk.xlsx` tertulis ulang dengan 19 kolom. Verifikasi:

```bash
cd backend && .venv/bin/python -c "
from openpyxl import load_workbook
ws = load_workbook('../docs/template-data-penduduk.xlsx')['Data Penduduk']
header = [c.value for c in ws[2]]
assert 'NIK' not in header and 'No. KK' not in header, header
assert len(header) == 19, len(header)
print('OK: template', len(header), 'kolom')
"
```

- [ ] **Step 6: Impor sungguhan & uji idempotensi**

Run:
```bash
cd backend && rm -f /tmp/uji-impor.db && \
  DATABASE_PATH=/tmp/uji-impor.db .venv/bin/python -m app.data.impor_excel ../docs/data-penduduk.xlsx && \
  DATABASE_PATH=/tmp/uji-impor.db .venv/bin/python -m app.data.impor_excel ../docs/data-penduduk.xlsx && \
  DATABASE_PATH=/tmp/uji-impor.db .venv/bin/python -c "
from app.core.config import settings
from app.data import db
conn = db.buka(settings.DATABASE_FILE)
n = len(db.muat(conn))
conn.close()
assert n == 385, f'harus 385 baris, dapat {n}'
print('OK: impor dua kali tetap', n, 'baris')
"
```
Expected: `OK: impor dua kali tetap 385 baris` — bukan 770.

- [ ] **Step 7: Buat ulang database dev**

Skema `penduduk` berubah bentuk dan `CREATE TABLE IF NOT EXISTS` tidak akan
memperbaiki tabel lama, jadi file lama harus dibuang — bukan di-`ALTER`:

```bash
cd backend && rm -f data/siduk.db && \
  .venv/bin/python -m app.data.impor_excel ../docs/data-penduduk.xlsx
```

Aman: file `.db` tidak pernah ikut repo, dan seluruh isinya berasal dari Excel.

- [ ] **Step 8: Commit**

```bash
git add -A backend/app/data/impor_excel.py backend/tools/ backend/app/data/ docs/template-data-penduduk.xlsx
git commit -m "feat(backend): impor Excel menimpa seluruh tabel, tanpa kolom NIK & No. KK"
```

---

### Task 8: Tipe & store auth frontend

**Files:**
- Modify: `frontend/src/features/auth/types.ts`
- Modify: `frontend/src/features/auth/api/auth-api.ts`
- Modify: `frontend/src/features/auth/schemas.ts`
- Modify: `frontend/src/features/auth/auth-store.ts`
- Delete: `frontend/src/features/auth/nik-tersimpan.ts`

**Interfaces:**
- Consumes: kontrak backend Task 3.
- Produces:
  - `type Role = 'ADMIN' | 'PENGURUS'`
  - `interface AuthUser { id, nama, username, role, rw?, rt?, jabatan }`
  - `interface PetugasCredentials { username, password }`, `interface Session { token, user }`
  - `authApi.login(creds)`, `authApi.logout()` — tidak ada lagi metode warga.

- [ ] **Step 1: Tulis ulang `types.ts`**

```ts
export type Role = 'ADMIN' | 'PENGURUS';

/**
 * Akun perangkat desa. Warga tidak punya akun sama sekali
 * (docs/superpowers/specs/2026-08-26-hapus-nik-kk-auth-pengurus-design.md).
 */
export interface AuthUser {
  id: string;
  nama: string;
  username: string;
  role: Role;
  /** Wilayah kerja. Kosong untuk Dukuh; `rt` kosong untuk Ketua RW. */
  rw?: string | null;
  rt?: string | null;
  /** Turunan dari role + rw + rt, dihitung backend. Mis. "Ketua RT 03". */
  jabatan: string;
}

/** Login pengurus (Dukuh / RW / RT) — satu-satunya jalur masuk. */
export interface PetugasCredentials {
  username: string;
  password: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}
```

- [ ] **Step 2: Rampingkan api, schema, store**

Di `auth-api.ts`: hapus `loginWarga`, `cekAktivasi`, `setPin`, `simpanKontak`, dan tipe-tipe terkait dari `AuthApi` + implementasinya. Sisakan `login(creds: PetugasCredentials): Promise<Session>` dan `logout(): Promise<void>`.

Di `schemas.ts`: hapus skema Zod untuk NIK, PIN, tanggal lahir, dan kontak. Sisakan skema login pengurus.

Di `auth-store.ts`: hapus setiap referensi ke `nik`, `noHp`, `email`, dan ke `nik-tersimpan`.

```bash
git rm frontend/src/features/auth/nik-tersimpan.ts
```

- [ ] **Step 3: Typecheck — harus gagal, dengan daftar kerja**

Run: `cd frontend && npm run typecheck`
Expected: FAIL. Error-nya persis daftar file yang harus dibereskan Task 9–14 (halaman warga, guards, penduduk, dsb). Simpan outputnya sebagai acuan.

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src/features/auth/
git commit -m "refactor(frontend): tipe auth khusus pengurus, cabut tipe warga"
```

---

### Task 9: Routing — satu pintu masuk, halaman warga hilang

**Files:**
- Modify: `frontend/src/routes/paths.ts`
- Modify: `frontend/src/routes/AppRoutes.tsx`
- Modify: `frontend/src/routes/role-utils.ts`
- Modify: `frontend/src/routes/guards.tsx`
- Modify: `frontend/src/pages/login/LoginPetugasPage.tsx`
- Delete: `frontend/src/pages/login/LoginPage.tsx`, `frontend/src/pages/aktivasi/`, `frontend/src/pages/user/`
- Delete: komponen warga di `frontend/src/features/auth/components/`

**Interfaces:**
- Consumes: `Role`, `AuthUser` (Task 8).
- Produces: `paths` tanpa `login.petugas`, `aktivasi`, `kontak`, `beranda`; `homePathForRole` mengembalikan `paths.admin.penduduk` untuk PENGURUS dan `paths.admin.root` untuk ADMIN.

- [ ] **Step 1: Ramping `paths.ts`**

```ts
/** Sumber tunggal kebenaran untuk path routing. */
export const paths = {
  /** Landing publik: statistik padukuhan, tanpa auth. */
  landing: '/',
  /** Masuk pengurus (Dukuh/RW/RT) — satu-satunya jalur masuk. */
  login: '/login',
  admin: {
    root: '/admin',
    penduduk: '/admin/penduduk',
    infografis: '/admin/infografis',
    /** Kelola akun pengurus. ADMIN saja. */
    pengurus: '/admin/pengurus',
  },
} as const;
```

- [ ] **Step 2: Hapus halaman & komponen warga**

```bash
git rm frontend/src/pages/login/LoginPage.tsx
git rm -r frontend/src/pages/aktivasi frontend/src/pages/user
git rm frontend/src/features/auth/components/AktivasiCekView.tsx \
       frontend/src/features/auth/components/AktivasiFlow.tsx \
       frontend/src/features/auth/components/AktivasiPinView.tsx \
       frontend/src/features/auth/components/KontakForm.tsx \
       frontend/src/features/auth/components/KontakFormView.tsx \
       frontend/src/features/auth/components/KontakPrompt.tsx \
       frontend/src/features/auth/components/KontakPromptView.tsx \
       frontend/src/features/auth/components/LoginWargaForm.tsx \
       frontend/src/features/auth/components/LoginWargaFormView.tsx \
       frontend/src/features/auth/components/ResetPinButton.tsx \
       frontend/src/features/auth/components/ResetPinDialogView.tsx
```

Periksa apakah `frontend/src/lib/tanggal.ts` masih dipakai setelah `AktivasiCekView` hilang:
```bash
cd frontend && grep -rn "tanggal'" src/ | grep -v "lib/tanggal.ts"
```
Kalau tidak ada pemakai, `git rm src/lib/tanggal.ts`.

- [ ] **Step 3: Perbarui `AppRoutes.tsx`**

```tsx
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingBlock } from '@/components/ui/Spinner';
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from './guards';
import { paths } from './paths';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/login/LoginPetugasPage'));
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/dashboard/AdminDashboardPage'),
);
const PendudukPage = lazy(() => import('@/pages/admin/penduduk/PendudukPage'));
const InfografisPage = lazy(
  () => import('@/pages/admin/infografis/InfografisPage'),
);
const PengurusPage = lazy(() => import('@/pages/admin/pengurus/PengurusPage'));
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path={paths.login} element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            {/* Semua pengurus: baca data & statistik, tidak dibatasi wilayah. */}
            <Route path={paths.admin.root} element={<AdminDashboardPage />} />
            <Route path={paths.admin.penduduk} element={<PendudukPage />} />
            <Route path={paths.admin.infografis} element={<InfografisPage />} />

            {/* Kelola akun adalah kewenangan terpisah, ADMIN saja. */}
            <Route element={<RequireRole role="ADMIN" />}>
              <Route path={paths.admin.pengurus} element={<PengurusPage />} />
            </Route>
          </Route>
        </Route>

        {/* Landing publik, terbuka untuk semua — termasuk yang sudah masuk. */}
        <Route path={paths.landing} element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
```

- [ ] **Step 4: `role-utils.ts`**

```ts
import type { Role } from '@/features/auth/types';
import { paths } from './paths';

/**
 * Halaman default setelah login. ADMIN mendarat di dashboard; PENGURUS
 * langsung ke daftar penduduk — itu yang ia pakai sehari-hari.
 */
export function homePathForRole(role: Role | undefined): string {
  return role === 'ADMIN' ? paths.admin.root : paths.admin.penduduk;
}
```

`guards.tsx` tidak perlu berubah isinya, tapi pastikan `RequireRole` masih mengarah ke `homePathForRole` dan tidak mereferensi role yang sudah tidak ada.

- [ ] **Step 5: Sesuaikan halaman login**

Di `frontend/src/pages/login/LoginPetugasPage.tsx`, hapus tautan "Masuk sebagai warga" / "Aktivasi akun" kalau ada, dan sesuaikan judul jadi pintu masuk tunggal. Biarkan nama filenya `LoginPetugasPage.tsx` — isinya memang login petugas, dan mengganti nama file cuma menambah diff.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/routes frontend/src/pages frontend/src/features/auth frontend/src/lib
git commit -m "refactor(frontend): satu pintu masuk pengurus, hapus halaman warga"
```

---

### Task 10: Navigasi

**Files:**
- Modify: `frontend/src/components/layout/nav-config.ts`
- Modify: `frontend/src/components/layout/DashboardLayout.tsx` (kalau merujuk halaman yang dihapus)

**Interfaces:**
- Consumes: `Role` (Task 8), `paths` (Task 9).
- Produces: `navItemsForRole(role)` mengembalikan menu Dashboard / Data Penduduk / Infografis / Statistik Desa untuk semua pengurus, ditambah "Akun Pengurus" hanya untuk ADMIN.

- [ ] **Step 1: Tulis ulang `navItemsForRole`**

Hapus `dataSaya` dan menu "Kontak Saya" (halamannya sudah tidak ada). Ganti fungsinya:

```ts
/** Menu navigasi. Semua pengurus melihat menu yang sama; ADMIN dapat satu
 *  menu tambahan untuk kelola akun. */
export function navItemsForRole(role: Role | undefined): NavItem[] {
  const menu: NavItem[] = [
    {
      label: 'Dashboard',
      to: paths.admin.root,
      aksen: CHART_KATEGORI_COLORS[0],
      end: true,
    },
    {
      label: 'Data Penduduk',
      to: paths.admin.penduduk,
      icon: ikonUsers,
      aksen: CHART_KATEGORI_COLORS[5],
    },
    {
      label: 'Infografis',
      to: paths.admin.infografis,
      icon: ikonChartPie,
      aksen: CHART_KATEGORI_COLORS[4],
    },
  ];
  if (role === 'ADMIN') {
    menu.push({
      label: 'Akun Pengurus',
      to: paths.admin.pengurus,
      icon: ikonId,
      aksen: CHART_KATEGORI_COLORS[2],
    });
  }
  menu.push(statistikDesa);
  return menu;
}
```

Hapus impor `ikonPhone` yang jadi tidak terpakai. `ikonId` dipakai ulang untuk Akun Pengurus.

- [ ] **Step 2: Periksa `DashboardLayout.tsx`**

Run: `cd frontend && grep -n "beranda\|kontak\|nik\|Warga" src/components/layout/*.tsx`
Bereskan setiap kemunculan (mis. `AccountButton` yang menampilkan NIK — ganti dengan `user.jabatan`).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "refactor(frontend): menu navigasi khusus pengurus"
```

---

### Task 11: Tipe, API, dan hooks penduduk

**Files:**
- Modify: `frontend/src/types/penduduk.ts`
- Modify: `frontend/src/types/statistik.ts`
- Modify: `frontend/src/features/penduduk/api/penduduk-api.ts`
- Modify: `frontend/src/features/penduduk/hooks/use-penduduk.ts`
- Modify: `frontend/src/types/api.ts` (kalau `PaginationParams` perlu diperluas)

**Interfaces:**
- Consumes: kontrak backend Task 4.
- Produces:
  - `Penduduk` tanpa `nik`/`noKK`; `KartuKeluarga` dihapus.
  - `interface FilterPenduduk` — semua field opsional bertipe union yang sesuai: `jenisKelamin?`, `agama?`, `golonganDarah?`, `pendidikan?`, `statusPerkawinan?`, `statusHubunganKeluarga?`, `pekerjaan?`, `rt?`, `rw?`, `kelompokUmur?`.
  - `interface FilterOpsi { rt: string[]; rw: string[]; pekerjaan: string[] }`
  - `pendudukApi.list(params: PaginationParams & FilterPenduduk)`, `pendudukApi.getById(id)`, `pendudukApi.filterOpsi()`.
  - `pendudukKeys.list(params)`, `pendudukKeys.byId(id)`, `pendudukKeys.filterOpsi()`.
  - `usePendudukList(params)`, `usePendudukById(id, enabled?)`, `useFilterOpsi()`.

- [ ] **Step 1: Perbarui tipe domain**

Di `frontend/src/types/penduduk.ts`: hapus field `nik` dan `noKK` dari `interface Penduduk`, hapus `interface KartuKeluarga`, dan tambahkan:

```ts
/** Kelompok umur untuk filter & statistik. Harus sama persis dengan
 *  `KELOMPOK_UMUR` di `backend/app/data/agregat.py`. */
export type KelompokUmur =
  '0-5' | '6-12' | '13-17' | '18-25' | '26-40' | '41-60' | '60+';

/** Filter daftar penduduk. Semua opsional, digabung AND oleh backend. */
export interface FilterPenduduk {
  jenisKelamin?: JenisKelamin;
  agama?: Agama;
  golonganDarah?: GolonganDarah;
  pendidikan?: Pendidikan;
  statusPerkawinan?: StatusPerkawinan;
  statusHubunganKeluarga?: StatusHubunganKeluarga;
  pekerjaan?: string;
  rt?: string;
  rw?: string;
  kelompokUmur?: KelompokUmur;
}

/** Pilihan filter yang bukan enum — hanya bisa diketahui dari isi data. */
export interface FilterOpsi {
  rt: string[];
  rw: string[];
  pekerjaan: string[];
}
```

Di `frontend/src/types/statistik.ts`: hapus field `totalKK` di semua tempat.

- [ ] **Step 2: Perbarui kontrak API**

```ts
import { apiClient } from '@/lib/api-client';
import type { Paginated, PaginationParams } from '@/types/api';
import type { FilterOpsi, FilterPenduduk, Penduduk } from '@/types/penduduk';

/** Kontrak API data kependudukan. Semua endpoint butuh sesi pengurus. */
export interface PendudukApi {
  /** Daftar penduduk: paginasi, cari nama, dan filter kategori (AND). */
  list(params: PaginationParams & FilterPenduduk): Promise<Paginated<Penduduk>>;
  /** Detail satu penduduk. `id` dibangkitkan saat impor, bukan NIK. */
  getById(id: string): Promise<Penduduk | null>;
  /** Pilihan filter non-enum (RT, RW, pekerjaan) dari isi data. */
  filterOpsi(): Promise<FilterOpsi>;
}

export const pendudukApi: PendudukApi = {
  async list(params) {
    const { data } = await apiClient.get<Paginated<Penduduk>>('/penduduk', {
      params,
    });
    return data;
  },
  async getById(id) {
    const { data } = await apiClient.get<Penduduk>(`/penduduk/${id}`);
    return data;
  },
  async filterOpsi() {
    const { data } = await apiClient.get<FilterOpsi>('/penduduk/filter-opsi');
    return data;
  },
};
```

- [ ] **Step 3: Perbarui hooks**

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PaginationParams } from '@/types/api';
import type { FilterPenduduk } from '@/types/penduduk';
import { pendudukApi } from '../api/penduduk-api';

type ListParams = PaginationParams & FilterPenduduk;

/** Query keys terpusat agar caching konsisten & mudah di-invalidate.
 *  `params` ikut masuk key: tiap kombinasi filter punya cache sendiri. */
export const pendudukKeys = {
  all: ['penduduk'] as const,
  list: (params: ListParams) => [...pendudukKeys.all, 'list', params] as const,
  byId: (id: string) => [...pendudukKeys.all, 'id', id] as const,
  filterOpsi: () => [...pendudukKeys.all, 'filter-opsi'] as const,
};

export function usePendudukList(params: ListParams) {
  return useQuery({
    queryKey: pendudukKeys.list(params),
    queryFn: () => pendudukApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePendudukById(id: string, enabled = true) {
  return useQuery({
    queryKey: pendudukKeys.byId(id),
    queryFn: () => pendudukApi.getById(id),
    enabled: enabled && id.trim().length > 0,
  });
}

/** Pilihan RT/RW/pekerjaan untuk dropdown filter. Jarang berubah — data
 *  penduduk read-only sampai impor berikutnya. */
export function useFilterOpsi() {
  return useQuery({
    queryKey: pendudukKeys.filterOpsi(),
    queryFn: () => pendudukApi.filterOpsi(),
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types frontend/src/features/penduduk/api frontend/src/features/penduduk/hooks
git commit -m "feat(frontend): kontrak API penduduk dengan filter kategori"
```

---

### Task 12: Komponen filter & halaman Data Penduduk

**Files:**
- Create: `frontend/src/features/penduduk/components/FilterPendudukBar.tsx`
- Modify: `frontend/src/features/penduduk/components/DaftarPenduduk.tsx`
- Modify: `frontend/src/features/penduduk/components/DaftarPendudukView.tsx`
- Modify: `frontend/src/features/penduduk/components/PendudukDetailView.tsx`
- Modify: `frontend/src/features/penduduk/labels.ts`
- Modify: `frontend/src/features/penduduk/view-model.ts`
- Modify: `frontend/src/pages/admin/penduduk/PendudukPage.tsx`
- Delete: `frontend/src/features/penduduk/components/KartuKeluargaCardView.tsx`, `DataWarga.tsx`, `DataWargaView.tsx`

**Interfaces:**
- Consumes: `FilterPenduduk`, `FilterOpsi`, `useFilterOpsi`, `usePendudukList` (Task 11).
- Produces: `<FilterPendudukBar value={filter} opsi={opsi} onChange={(f) => …} />`.

- [ ] **Step 1: Hapus komponen berbasis KK & data pribadi warga**

```bash
git rm frontend/src/features/penduduk/components/KartuKeluargaCardView.tsx \
       frontend/src/features/penduduk/components/DataWarga.tsx \
       frontend/src/features/penduduk/components/DataWargaView.tsx
```

- [ ] **Step 2: Tambah label kelompok umur**

Di `frontend/src/features/penduduk/labels.ts`, tambahkan (dan pastikan label `statusHubunganKeluarga` sudah berbunyi "Status dalam Keluarga", bukan "Status dalam KK"):

```ts
export const KELOMPOK_UMUR_OPSI = [
  '0-5', '6-12', '13-17', '18-25', '26-40', '41-60', '60+',
] as const satisfies readonly KelompokUmur[];
```

- [ ] **Step 3: Tulis `FilterPendudukBar.tsx`**

```tsx
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { FilterOpsi, FilterPenduduk } from '@/types/penduduk';
import {
  AGAMA_LABELS,
  GOLONGAN_DARAH_LABELS,
  JENIS_KELAMIN_LABELS,
  KELOMPOK_UMUR_OPSI,
  PENDIDIKAN_LABELS,
  STATUS_HUBUNGAN_KELUARGA_LABELS,
  STATUS_PERKAWINAN_LABELS,
} from '../labels';

interface Props {
  value: FilterPenduduk;
  opsi: FilterOpsi | undefined;
  onChange: (next: FilterPenduduk) => void;
}

/** Satu <select> generik: label + daftar pilihan + nilai terpilih.
 *  Nilai kosong berarti "semua" dan dibuang dari objek filter, supaya query
 *  key React Query tidak berbeda hanya karena ada field bernilai ''. */
function Pilihan({
  label,
  nilai,
  pilihan,
  onPilih,
}: {
  label: string;
  nilai: string | undefined;
  pilihan: readonly (readonly [string, string])[];
  onPilih: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <select
        className={cn(
          'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm',
          nilai && 'border-slate-900 font-medium',
        )}
        value={nilai ?? ''}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onPilih(e.target.value)}
      >
        <option value="">Semua</option>
        {pilihan.map(([v, teks]) => (
          <option key={v} value={v}>
            {teks}
          </option>
        ))}
      </select>
    </label>
  );
}

function dariLabels(labels: Record<string, string>) {
  return Object.entries(labels) as [string, string][];
}

function daftarPolos(nilai: string[] | undefined) {
  return (nilai ?? []).map((v) => [v, v] as [string, string]);
}

export function FilterPendudukBar({ value, opsi, onChange }: Props) {
  const set = (field: keyof FilterPenduduk) => (v: string) => {
    const next = { ...value };
    if (v) {
      // Nilai <select> selalu string; union sempitnya dijaga oleh daftar
      // pilihan yang dibangkitkan dari labels/opsi, bukan oleh input bebas.
      next[field] = v as never;
    } else {
      delete next[field];
    }
    onChange(next);
  };

  const adaFilter = Object.keys(value).length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Pilihan label="Jenis Kelamin" nilai={value.jenisKelamin} pilihan={dariLabels(JENIS_KELAMIN_LABELS)} onPilih={set('jenisKelamin')} />
      <Pilihan label="Agama" nilai={value.agama} pilihan={dariLabels(AGAMA_LABELS)} onPilih={set('agama')} />
      <Pilihan label="Gol. Darah" nilai={value.golonganDarah} pilihan={dariLabels(GOLONGAN_DARAH_LABELS)} onPilih={set('golonganDarah')} />
      <Pilihan label="Pendidikan" nilai={value.pendidikan} pilihan={dariLabels(PENDIDIKAN_LABELS)} onPilih={set('pendidikan')} />
      <Pilihan label="Status Perkawinan" nilai={value.statusPerkawinan} pilihan={dariLabels(STATUS_PERKAWINAN_LABELS)} onPilih={set('statusPerkawinan')} />
      <Pilihan label="Status dalam Keluarga" nilai={value.statusHubunganKeluarga} pilihan={dariLabels(STATUS_HUBUNGAN_KELUARGA_LABELS)} onPilih={set('statusHubunganKeluarga')} />
      <Pilihan label="Kelompok Umur" nilai={value.kelompokUmur} pilihan={KELOMPOK_UMUR_OPSI.map((u) => [u, u] as [string, string])} onPilih={set('kelompokUmur')} />
      <Pilihan label="RW" nilai={value.rw} pilihan={daftarPolos(opsi?.rw)} onPilih={set('rw')} />
      <Pilihan label="RT" nilai={value.rt} pilihan={daftarPolos(opsi?.rt)} onPilih={set('rt')} />
      <Pilihan label="Pekerjaan" nilai={value.pekerjaan} pilihan={daftarPolos(opsi?.pekerjaan)} onPilih={set('pekerjaan')} />
      {adaFilter && (
        <Button variant="ghost" onClick={() => onChange({})}>
          Hapus filter
        </Button>
      )}
    </div>
  );
}
```

Sesuaikan nama konstanta label (`AGAMA_LABELS`, dst.) dengan yang benar-benar ada di `labels.ts`, dan nama `variant` `Button` dengan yang tersedia di `components/ui/Button.tsx`.

- [ ] **Step 4: Rakit di halaman**

Di `PendudukPage.tsx` (atau `DaftarPenduduk.tsx`, ikuti pembagian yang sudah ada — komponen ber-`View` adalah presentasional):

```tsx
const [filter, setFilter] = useState<FilterPenduduk>({});
const { data: opsi } = useFilterOpsi();
const { data, isPending, error } = usePendudukList({
  page,
  pageSize,
  search: debouncedSearch,
  ...filter,
});
```

Pastikan `page` di-reset ke 1 setiap `filter` berubah — kalau tidak, mengubah filter di halaman 5 menghasilkan daftar kosong yang terlihat seperti bug.

Di kolom tabel `DaftarPendudukView.tsx` dan di `PendudukDetailView.tsx`, hapus kolom/baris NIK dan No. KK. Ganti tautan detail yang memakai NIK dengan `id`.

- [ ] **Step 5: Typecheck & lint**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: hanya sisa error yang berasal dari halaman Akun Pengurus (Task 13) dan landing/infografis (Task 14).

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/features/penduduk frontend/src/pages/admin/penduduk
git commit -m "feat(frontend): filter kategori di halaman Data Penduduk"
```

---

### Task 13: Halaman Akun Pengurus

**Files:**
- Create: `frontend/src/features/pengurus/types.ts`
- Create: `frontend/src/features/pengurus/api/pengurus-api.ts`
- Create: `frontend/src/features/pengurus/hooks/use-pengurus.ts`
- Create: `frontend/src/features/pengurus/schemas.ts`
- Create: `frontend/src/features/pengurus/components/DaftarPengurusView.tsx`
- Create: `frontend/src/features/pengurus/components/PengurusForm.tsx`
- Create: `frontend/src/pages/admin/pengurus/PengurusPage.tsx`

**Interfaces:**
- Consumes: `AuthUser`, `Role` (Task 8); kontrak backend Task 5.
- Produces:
  - `interface PengurusBaru { username; password; nama; role: Role; rw?; rt? }`
  - `interface PengurusUbah { nama?; rw?; rt?; aktif? }`
  - `pengurusApi.list()`, `.tambah(payload)`, `.ubah(id, payload)`, `.resetPassword(id, password)`
  - `pengurusKeys.all`, `usePengurusList()`, `useTambahPengurus()`, `useUbahPengurus()`, `useResetPassword()`
  - `PengurusPage` sebagai `export default`.

- [ ] **Step 1: Tipe & kontrak API**

`frontend/src/features/pengurus/types.ts`:

```ts
import type { Role } from '@/features/auth/types';

/** Akun pengurus seperti dikembalikan backend — bentuknya sama dengan
 *  `AuthUser`, karena memang objek yang sama. */
export type { AuthUser as Pengurus } from '@/features/auth/types';

export interface PengurusBaru {
  username: string;
  password: string;
  nama: string;
  role: Role;
  rw?: string;
  rt?: string;
}

/** Field yang tidak dikirim tidak diubah backend. */
export interface PengurusUbah {
  nama?: string;
  rw?: string | null;
  rt?: string | null;
  aktif?: boolean;
}
```

`frontend/src/features/pengurus/api/pengurus-api.ts`:

```ts
import { apiClient } from '@/lib/api-client';
import type { Pengurus, PengurusBaru, PengurusUbah } from '../types';

/** Kontrak kelola akun pengurus. Semua endpoint ADMIN saja. */
export interface PengurusApi {
  list(): Promise<Pengurus[]>;
  tambah(payload: PengurusBaru): Promise<Pengurus>;
  ubah(id: string, payload: PengurusUbah): Promise<Pengurus>;
  resetPassword(id: string, password: string): Promise<void>;
}

export const pengurusApi: PengurusApi = {
  async list() {
    const { data } = await apiClient.get<Pengurus[]>('/pengurus');
    return data;
  },
  async tambah(payload) {
    const { data } = await apiClient.post<Pengurus>('/pengurus', payload);
    return data;
  },
  async ubah(id, payload) {
    const { data } = await apiClient.patch<Pengurus>(`/pengurus/${id}`, payload);
    return data;
  },
  async resetPassword(id, password) {
    await apiClient.post(`/pengurus/${id}/reset-password`, { password });
  },
};
```

- [ ] **Step 2: Hooks dengan invalidasi**

`frontend/src/features/pengurus/hooks/use-pengurus.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PengurusBaru, PengurusUbah } from '../types';
import { pengurusApi } from '../api/pengurus-api';

export const pengurusKeys = {
  all: ['pengurus'] as const,
  list: () => [...pengurusKeys.all, 'list'] as const,
};

export function usePengurusList() {
  return useQuery({
    queryKey: pengurusKeys.list(),
    queryFn: () => pengurusApi.list(),
  });
}

function useInvalidasi() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: pengurusKeys.all });
}

export function useTambahPengurus() {
  const segarkan = useInvalidasi();
  return useMutation({
    mutationFn: (payload: PengurusBaru) => pengurusApi.tambah(payload),
    onSuccess: segarkan,
  });
}

export function useUbahPengurus() {
  const segarkan = useInvalidasi();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PengurusUbah }) =>
      pengurusApi.ubah(id, payload),
    onSuccess: segarkan,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      pengurusApi.resetPassword(id, password),
  });
}
```

- [ ] **Step 3: Skema form**

`frontend/src/features/pengurus/schemas.ts`:

```ts
import { z } from 'zod';

/** Batas minimal 8 karakter harus sama dengan `Field(min_length=8)` di
 *  `backend/app/schemas/pengurus.py` — kalau berbeda, form meloloskan
 *  sesuatu yang backend tolak. */
export const pengurusBaruSchema = z
  .object({
    username: z.string().min(3, 'Minimal 3 karakter').max(32),
    password: z.string().min(8, 'Minimal 8 karakter'),
    nama: z.string().min(1, 'Nama wajib diisi'),
    role: z.enum(['ADMIN', 'PENGURUS']),
    rw: z.string().optional(),
    rt: z.string().optional(),
  })
  .refine((v) => !(v.rt && !v.rw), {
    path: ['rw'],
    message: 'Ketua RT harus punya RW.',
  });

export type PengurusBaruForm = z.infer<typeof pengurusBaruSchema>;

export const passwordBaruSchema = z.object({
  password: z.string().min(8, 'Minimal 8 karakter'),
});
```

- [ ] **Step 4: Halaman & komponen**

Buat `PengurusPage.tsx` (`export default`) yang merakit: tabel akun dari `usePengurusList()` (kolom Nama, Username, Jabatan, Status), form tambah dari `PengurusForm` (React Hook Form + `zodResolver(pengurusBaruSchema)`), tombol Nonaktifkan/Aktifkan yang memanggil `useUbahPengurus()` dengan `{ aktif: !aktif }`, dan tombol Reset Password yang membuka dialog berisi input password baru.

Ikuti pola presentasional yang sudah dipakai fitur lain: komponen ber-akhiran `View` menerima props polos dan tidak memanggil hook data. Tampilkan error lewat komponen `Alert`, bukan `alert()`.

Konfirmasi wajib sebelum menonaktifkan akun: pengurus yang salah pencet akan memutus akses orang lain.

- [ ] **Step 5: Typecheck, lint, build**

Run: `cd frontend && npm run typecheck && npm run lint`
Expected: sisa error hanya dari landing/infografis (Task 14).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/pengurus frontend/src/pages/admin/pengurus
git commit -m "feat(frontend): halaman kelola akun pengurus"
```

---

### Task 14: Landing & infografis tanpa Jumlah KK

**Files:**
- Modify: `frontend/src/pages/landing/LandingPage.tsx`
- Modify: `frontend/src/pages/landing/view-model.ts`
- Modify: `frontend/src/pages/landing/RincianRwPanel.tsx`
- Modify: `frontend/src/pages/admin/infografis/InfografisPage.tsx`
- Modify: `frontend/src/pages/admin/infografis/view-model.ts`
- Modify: `frontend/src/pages/admin/dashboard/AdminDashboardPage.tsx`

**Interfaces:**
- Consumes: tipe statistik tanpa `totalKK` (Task 11).
- Produces: tidak ada rujukan `totalKK` tersisa di frontend.

- [ ] **Step 1: Cabut semua rujukan**

Run: `cd frontend && grep -rn "totalKK\|Jumlah KK\|Kartu Keluarga\|noKK\|\bnik\b" src/`

Bereskan tiap hasil: hapus kartu statistik "Jumlah KK", hapus kolomnya di panel rincian RW/RT, dan hapus tautan/tombol ke halaman Kartu Keluarga. Di `AdminDashboardPage.tsx`, ganti ringkasan yang memakai KK dengan yang masih tersedia (total jiwa, L/P).

- [ ] **Step 2: Verifikasi bersih**

Run: `cd frontend && grep -rn "totalKK\|noKK\|KartuKeluarga" src/`
Expected: tidak ada hasil.

- [ ] **Step 3: Typecheck, lint, build**

Run: `cd frontend && npm run typecheck && npm run lint && npm run build`
Expected: ketiganya lolos, 0 error.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages
git commit -m "refactor(frontend): hapus Jumlah KK dari landing, infografis, dashboard"
```

---

### Task 15: Verifikasi ujung-ke-ujung & dokumentasi

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/PROSEDUR-PENGURUS.md`
- Modify: `backend/README.md`
- Modify: `frontend/.env.example` (kalau menyebut halaman yang dihapus)

**Interfaces:**
- Consumes: seluruh task sebelumnya.
- Produces: dokumentasi yang cocok dengan kode; tidak ada instruksi yang menyuruh orang membuka halaman yang sudah tidak ada.

- [ ] **Step 1: Jalankan backend bersih dari nol**

```bash
cd backend && rm -f /tmp/e2e.db && \
  DATABASE_PATH=/tmp/e2e.db .venv/bin/python -m app.data.impor_excel ../docs/data-penduduk.xlsx && \
  DATABASE_PATH=/tmp/e2e.db ADMIN_USERNAME=dukuh ADMIN_PASSWORD=rahasia123 \
  .venv/bin/uvicorn app.main:app --port 8001 > /tmp/e2e.log 2>&1 & echo $! > /tmp/e2e.pid
```

- [ ] **Step 2: Uji seluruh permukaan API**

```bash
cd backend && .venv/bin/python - <<'PY'
import json, urllib.request, urllib.error

def panggil(metode, path, data=None, token=None):
    req = urllib.request.Request(f"http://127.0.0.1:8001{path}", method=metode,
        data=json.dumps(data).encode() if data is not None else None)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            isi = r.read()
            return r.status, json.loads(isi) if isi else None
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")

# Publik: tidak boleh ada data pribadi.
kode, publik = panggil("GET", "/publik/statistik")
assert kode == 200
teks = json.dumps(publik)
assert "nik" not in teks.lower() and "totalKK" not in teks, "statistik publik bocor"
assert publik["totalPenduduk"] == 385, publik["totalPenduduk"]

# Tanpa token, daftar penduduk ditolak.
kode, _ = panggil("GET", "/penduduk")
assert kode == 401

kode, sesi = panggil("POST", "/auth/login", {"username": "dukuh", "password": "rahasia123"})
assert kode == 200
t = sesi["token"]

kode, hal = panggil("GET", "/penduduk?page=1&pageSize=5", None, t)
assert kode == 200 and len(hal["items"]) == 5
orang = hal["items"][0]
assert "nik" not in orang and "noKK" not in orang, orang.keys()

kode, satu = panggil("GET", f"/penduduk/{orang['id']}", None, t)
assert kode == 200 and satu["nama"] == orang["nama"]

kode, opsi = panggil("GET", "/penduduk/filter-opsi", None, t)
assert kode == 200 and opsi["rw"] and opsi["rt"], opsi

kode, islam = panggil("GET", "/penduduk?pageSize=200&agama=ISLAM", None, t)
kode2, islam_rt = panggil("GET", f"/penduduk?pageSize=200&agama=ISLAM&rt={opsi['rt'][0]}", None, t)
assert islam_rt["total"] <= islam["total"], "filter bertumpuk harus mempersempit"
assert all(p["agama"] == "ISLAM" for p in islam_rt["items"])

kode, _ = panggil("GET", "/kartu-keluarga/123", None, t)
assert kode == 404, "endpoint KK harus hilang"

kode, info = panggil("GET", "/infografis", None, t)
assert kode == 200 and "totalKK" not in json.dumps(info)

print("OK: e2e seluruh permukaan API")
PY
kill "$(cat /tmp/e2e.pid)"
```
Expected: `OK: e2e seluruh permukaan API`

- [ ] **Step 3: Verifikasi frontend terhadap backend hidup**

Jalankan backend (langkah 1) dan `cd frontend && npm run dev`. Periksa manual:
1. `/` menampilkan statistik tanpa kartu Jumlah KK.
2. `/login` menerima dukuh/rahasia123, mendarat di `/admin`.
3. `/admin/penduduk`: filter Agama + RT bersamaan mempersempit daftar; "Hapus filter" mengembalikannya; tabel tidak punya kolom NIK/No. KK.
4. `/admin/pengurus`: tambah akun RT, lalu logout dan masuk dengan akun itu — menu "Akun Pengurus" tidak muncul, dan membuka `/admin/pengurus` langsung dialihkan.
5. Nonaktifkan akun RT itu dari akun dukuh, lalu coba masuk dengan akun RT — pesan "Akun Anda sudah dinonaktifkan".

- [ ] **Step 4: Perbarui dokumentasi**

Di `CLAUDE.md`: perbarui §Kondisi Saat Ini (akun pengurus sekarang di SQLite), tabel peran (dua peran, warga bukan pengguna), §7 Autentikasi (cabut seluruh alur PIN/aktivasi), dan tabel endpoint di §11. Hapus butir "Selisih desain vs kode" yang sudah tidak berlaku, dan tambahkan rujukan ke spec 2026-08-26.

Di `docs/PROSEDUR-PENGURUS.md`: hapus seluruh prosedur Reset PIN warga dan aktivasi luring. Ganti dengan prosedur baru: menambah akun pengurus, menonaktifkan akun pengurus yang berganti orang, reset password, dan alur impor Excel (termasuk peringatan bahwa file harus lengkap karena impor menimpa).

Di `backend/README.md`: tambahkan langkah wajib mengisi `ADMIN_USERNAME`/`ADMIN_PASSWORD` sebelum menjalankan backend pertama kali.

- [ ] **Step 5: Verifikasi akhir**

Run:
```bash
cd backend && .venv/bin/python -m app.data.db && .venv/bin/python -m app.data.agregat && \
  DATABASE_PATH=/tmp/uji-pengurus2.db .venv/bin/python -m app.data.pengurus
cd ../frontend && npm run typecheck && npm run lint && npm run build
cd .. && grep -rn "\bnik\b\|noKK\|NIK\|No\. KK" backend/app frontend/src --include=*.py --include=*.ts --include=*.tsx
```
Expected: semua perintah lolos, dan `grep` terakhir tidak menghasilkan apa pun.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/PROSEDUR-PENGURUS.md backend/README.md frontend/.env.example
git commit -m "docs: perbarui panduan untuk aplikasi khusus pengurus tanpa NIK & No. KK"
```
