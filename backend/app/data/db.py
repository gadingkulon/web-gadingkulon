"""SQLite: penduduk, akun pengurus, pergantian jabatan.
Satu-satunya modul yang menulis SQL.

Nama kolom = nama field Pydantic (`camelCase`), jadi satu baris masuk
ke `Penduduk(**row)` apa adanya. `sqlite3` stdlib, bukan ORM.

NIK & Nomor KK tidak disimpan sama sekali. `id` penduduk = kolom
Kode Warga di Excel.

Baris ber-`deletedAt` tetap disimpan — penyaringannya di `store.py`.
"""

import re
import sqlite3
import threading
from collections.abc import Mapping
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Iterator

from app.core.config import settings
from app.schemas.penduduk import Alamat, Penduduk

_PREFIKS_ALAMAT = "alamat_"

# Semua TEXT: `alamat_rt`, `alamat_rw`, dan `alamat_kodePos` berawalan angka 0,
# jadi menyimpannya sebagai INTEGER akan memakan nol di depan diam-diam — bug
# yang sama persis dengan yang dilakukan Excel pada kolom-kolom itu.
SKEMA_KEPENDUDUKAN = """
CREATE TABLE IF NOT EXISTS penduduk (
    id                     TEXT PRIMARY KEY,
    kodeKeluarga           TEXT,
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
    -- Jabatan dari file Excel. Bukan penentu kewenangan; dibaca hanya untuk
    -- mencalonkan pemegang jabatan yang masih kosong.
    jabatan                TEXT NOT NULL DEFAULT 'WARGA',
    alamat_jalan           TEXT NOT NULL,
    alamat_rt              TEXT NOT NULL,
    alamat_rw              TEXT NOT NULL,
    alamat_desa            TEXT NOT NULL,
    alamat_kecamatan       TEXT NOT NULL,
    alamat_kabupaten       TEXT NOT NULL,
    alamat_provinsi        TEXT NOT NULL,
    alamat_kodePos         TEXT NOT NULL,
    statusKependudukan     TEXT NOT NULL DEFAULT 'AKTIF',
    deletedAt              TEXT,
    bansos                 TEXT,
    statusDomisili         TEXT NOT NULL DEFAULT 'TETAP',
    alamatAsal             TEXT,
    catatanPerkawinan      TEXT,
    catatanKematian        TEXT
);

-- Akun perangkat desa. Satu-satunya akun yang ada — warga tidak punya akun.
-- Di SQLite, bukan di memori: akun ditambah & dinonaktifkan oleh ADMIN saat
-- runtime, jadi harus selamat melewati restart.
-- `jabatan` sengaja TIDAK disimpan: diturunkan dari role + rw + rt, supaya
-- tidak ada dua sumber kebenaran yang bisa berbeda diam-diam.
-- `password_hash` BLOB karena bcrypt mengembalikan bytes.
CREATE TABLE IF NOT EXISTS pengurus (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash BLOB NOT NULL,
    nama          TEXT NOT NULL,
    role          TEXT NOT NULL,
    rw            TEXT,
    rt            TEXT,
    aktif         INTEGER NOT NULL DEFAULT 1,
    -- Kode Warga pemegang jabatan ini. Dipakai memeriksa "orang ini sedang
    -- menjabat di tempat lain" — nama tidak bisa dipakai untuk itu, karena dua
    -- orang senama akan saling menghalangi. NULL untuk akun ADMIN, yang memang
    -- bukan warga.
    warga_id      TEXT,
    -- Password awal dari Admin sekali pakai: selama 1, akun cuma boleh
    -- mengganti passwordnya sendiri. Padam begitu password diganti.
    harus_ganti_password INTEGER NOT NULL DEFAULT 1
);

-- Usulan pergantian pemegang satu jabatan. TIDAK PERNAH DIHAPUS: riwayat inilah
-- catatan permanen perpindahan jabatan, sekaligus alasan tabel audit_log
-- terpisah belum diperlukan.
-- Identitas kandidat ikut DISALIN (nama/rt/rw) di samping `kandidat_id`: impor
-- Excel berikutnya bisa mengubah nama atau alamat orang itu, sementara riwayat
-- harus tetap terbaca sebagaimana keadaannya saat itu.
CREATE TABLE IF NOT EXISTS pengajuan (
    id             TEXT PRIMARY KEY,
    -- Kunci jabatan, mis. `RT:019/001` — lihat `pengurus.kode_jabatan_dari()`.
    jabatan_kode   TEXT NOT NULL,
    role           TEXT NOT NULL,
    rw             TEXT,
    rt             TEXT,
    kandidat_id    TEXT NOT NULL,
    kandidat_nama  TEXT NOT NULL,
    kandidat_rt    TEXT NOT NULL,
    kandidat_rw    TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'MENUNGGU',
    diajukan_oleh  TEXT NOT NULL,
    diajukan_pada  TEXT NOT NULL,
    selesai_pada   TEXT,
    -- Sebab selesainya, buat dibaca manusia: "ditolak Ketua RW 019",
    -- "kandidat sudah pindah", "lewat 30 hari".
    sebab          TEXT
);

CREATE INDEX IF NOT EXISTS idx_pengajuan_jabatan ON pengajuan(jabatan_kode, status);

-- Satu penyetuju satu suara per pengajuan, dan suaranya tidak bisa diubah.
CREATE TABLE IF NOT EXISTS persetujuan (
    pengajuan_id TEXT NOT NULL REFERENCES pengajuan(id),
    pengurus_id  TEXT NOT NULL REFERENCES pengurus(id),
    setuju       INTEGER NOT NULL,
    pada         TEXT NOT NULL,
    PRIMARY KEY (pengajuan_id, pengurus_id)
);

-- Jejak perubahan data warga & akun. TIDAK PERNAH DIHAPUS.
-- `perubahan` menyimpan kolom apa berubah dari apa ke apa, sebagai teks siap
-- baca — bukan JSON: yang membacanya manusia yang menelusuri sengketa data,
-- bukan program.
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    waktu       TEXT NOT NULL,
    aktor       TEXT NOT NULL,
    aksi        TEXT NOT NULL,
    sasaran     TEXT NOT NULL,
    -- Kode Warga atau id akun yang dikenai tindakan. Dipakai menyaring riwayat
    -- per wilayah; `sasaran` yang berupa teks tidak bisa dipakai untuk itu.
    sasaran_id  TEXT,
    perubahan   TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_waktu ON audit_log(waktu);

-- Sesi yang sedang berjalan. Menggantikan JWT: token di sini cuma nomor acak
-- tanpa arti, dan yang menentukan sah atau tidak adalah ADANYA baris ini —
-- bukan tanda tangan yang tetap berlaku sampai TTL-nya habis. Akibatnya
-- "Keluar" benar-benar mencabut, bukan sekadar melupakan token di browser.
CREATE TABLE IF NOT EXISTS sesi (
    token            TEXT PRIMARY KEY,
    pengurus_id      TEXT NOT NULL REFERENCES pengurus(id),
    dibuat_pada      TEXT NOT NULL,
    kedaluwarsa_pada TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesi_pengurus ON sesi(pengurus_id);

-- Buku mutasi warga: satu baris tiap kali `statusKependudukan` berubah, plus
-- satu baris saat warga baru masuk (`dari IS NULL`). TIDAK PERNAH DIHAPUS.
--
-- Inilah yang membuat statistik per periode mungkin: tabel `penduduk` cuma tahu
-- keadaan sekarang, jadi keadaan bulan lalu dihitung dengan memutar mundur
-- baris-baris di sini (lihat `store.penduduk_pada`). Tanpa buku ini setiap
-- bulan menghasilkan angka yang sama persis.
CREATE TABLE IF NOT EXISTS mutasi (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    warga_id TEXT NOT NULL,
    -- NULL = warga baru masuk, belum punya status sebelumnya.
    dari     TEXT,
    ke       TEXT NOT NULL,
    pada     TEXT NOT NULL,
    oleh     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mutasi_pada ON mutasi(pada);
"""

SKEMA_PORTAL = """
-- Nama Ketua LPM untuk bagan struktur organisasi publik — satu baris
-- tunggal (id selalu 1). LPM bukan salah satu dari empat peran akun, jadi
-- tidak punya baris di `pengurus` dan tidak ikut sistem ganti-jabatan yang
-- disetujui. Lihat `app/data/lpm.py`.
CREATE TABLE IF NOT EXISTS lpm (
    id       INTEGER PRIMARY KEY CHECK (id = 1),
    nama     TEXT NOT NULL DEFAULT '',
    warga_id TEXT
);

-- Tabel metadata portal (misal status inisialisasi titik lokasi)
CREATE TABLE IF NOT EXISTS portal_meta (
    kunci TEXT PRIMARY KEY,
    nilai TEXT NOT NULL
);

-- Titik lokasi fasilitas dan perangkat desa untuk peta interaktif
CREATE TABLE IF NOT EXISTS titik_lokasi (
    id            TEXT PRIMARY KEY,
    nama          TEXT NOT NULL,
    kategori      TEXT NOT NULL,
    peran         TEXT,
    kategoriLabel TEXT NOT NULL,
    deskripsi     TEXT NOT NULL DEFAULT '',
    x             REAL NOT NULL,
    y             REAL NOT NULL,
    lat           REAL,
    lon           REAL,
    googleMapsUrl TEXT,
    ikon          TEXT NOT NULL DEFAULT 'balai',
    urutan        INTEGER NOT NULL DEFAULT 0
);

-- Keterangan tetap padukuhan: nama wilayah, luas, kontak, sejarah, batas.
-- Satu baris tunggal (id selalu 1), sama polanya dengan `lpm`.
--
-- Dulu konstanta di `frontend/src/lib/padukuhan.ts`, yang berarti mengganti
-- nomor telepon balai padukuhan menuntut deploy ulang. Barisnya BOLEH tidak
-- ada: selama belum pernah disimpan Admin, frontend memakai nilai bawaannya
-- sendiri — jadi tidak ada nilai desa yang dikarang di sisi server, dan tidak
-- ada dua daftar nilai awal yang bisa berbeda diam-diam.
--
-- Koordinat & radius peta TIDAK di sini: itu setelan tampilan peta yang
-- perubahannya harus dilihat hasilnya, bukan data yang dirawat perangkat desa.
CREATE TABLE IF NOT EXISTS padukuhan (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    nama         TEXT NOT NULL,
    namaLengkap  TEXT NOT NULL,
    desa         TEXT NOT NULL,
    kapanewon    TEXT NOT NULL,
    kabupaten    TEXT NOT NULL,
    provinsi     TEXT NOT NULL,
    luasWilayah  TEXT NOT NULL,
    telepon      TEXT NOT NULL,
    email        TEXT NOT NULL,
    -- Paragraf dipisah baris kosong, sama seperti isi berita sebelum jadi HTML.
    sejarah      TEXT NOT NULL,
    batasUtara   TEXT NOT NULL,
    batasTimur   TEXT NOT NULL,
    batasSelatan TEXT NOT NULL,
    batasBarat   TEXT NOT NULL
);

-- Berita padukuhan: ditulis Admin di `/admin/berita`, dibaca siapa saja di
-- `/berita`.
-- `slug` UNIQUE: dialah URL `/berita/:slug`, dan dua baris berslug sama berarti
-- salah satunya tidak bisa dibuka sama sekali.
-- `foto` menyimpan path berkas webp di disk (`/uploads/berita/...`).
CREATE TABLE IF NOT EXISTS berita (
    id            TEXT PRIMARY KEY,
    slug          TEXT NOT NULL UNIQUE,
    judul         TEXT NOT NULL,
    foto          TEXT NOT NULL DEFAULT '',
    tanggalTerbit TEXT NOT NULL,
    penulis       TEXT NOT NULL,
    isi           TEXT NOT NULL
);
"""

# Kompatibilitas mundur jika ada yang membaca `db.SKEMA`
SKEMA = SKEMA_KEPENDUDUKAN + "\n" + SKEMA_PORTAL


# ---------------------------------------------------------------------------
# Turso: SQLite yang sama, filenya saja yang tinggal di cloud.
#
# Mode salinan lokal: baca dari file `.db` di mesin ini, tulisan dikirim ke
# cloud lalu ikut diterapkan ke salinannya. SQL-nya tidak disentuh.
#
# Satu-satunya beda: `sqlite3` bisa membaca lewat NAMA kolom (`row["nama"]`),
# pustaka Turso mengembalikan tuple polos. Seluruh isi bagian ini menjembatani
# itu — `app/data/` membaca lewat nama di puluhan tempat.
# ---------------------------------------------------------------------------


class _Baris:
    """Baris hasil query yang bisa dibaca lewat nama kolom."""

    __slots__ = ("_kolom", "_indeks", "_nilai")

    def __init__(
        self, kolom: tuple[str, ...], indeks: dict[str, int], nilai: tuple
    ) -> None:
        self._kolom = kolom
        self._indeks = indeks
        self._nilai = nilai

    def __getitem__(self, kunci: str | int):
        if isinstance(kunci, str):
            posisi = self._indeks.get(kunci.lower())
            if posisi is None:
                # `sqlite3.Row` juga melempar IndexError, bukan KeyError.
                raise IndexError(f"kolom tidak ada: {kunci}")
            return self._nilai[posisi]
        return self._nilai[kunci]

    # `dict(baris)` memakai pasangan keys() + __getitem__ ini.
    def keys(self) -> list[str]:
        return list(self._kolom)

    def __len__(self) -> int:
        return len(self._nilai)

    def __iter__(self):
        # Seperti `sqlite3.Row`: yang diiterasi nilainya, bukan nama kolomnya.
        return iter(self._nilai)

    def __repr__(self) -> str:
        return f"_Baris({dict(zip(self._kolom, self._nilai))!r})"


class _KursorTurso:
    """Kursor Turso yang membungkus tiap baris jadi `_Baris`."""

    def __init__(self, kursor) -> None:
        self._kursor = kursor
        self._kolom: tuple[str, ...] | None = None
        self._indeks: dict[str, int] = {}

    def _siapkan(self) -> None:
        # Nama kolom dibaca saat baris pertama diambil, bukan saat dibungkus:
        # kursor dari `cursor()` belum menjalankan apa pun, jadi `description`
        # -nya masih kosong pada saat itu.
        if self._kolom is None:
            deskripsi = self._kursor.description
            self._kolom = tuple(d[0] for d in deskripsi) if deskripsi else ()
            self._indeks = {n.lower(): i for i, n in enumerate(self._kolom)}

    def _bungkus(self, nilai):
        if nilai is None:
            return None
        self._siapkan()
        assert self._kolom is not None
        return _Baris(self._kolom, self._indeks, nilai)

    def execute(self, sql: str, parameter=()) -> "_KursorTurso":
        self._kursor.execute(sql, parameter)
        self._kolom = None
        return self

    def executemany(self, sql: str, parameter) -> "_KursorTurso":
        self._kursor.executemany(sql, parameter)
        self._kolom = None
        return self

    def fetchone(self):
        return self._bungkus(self._kursor.fetchone())

    def fetchall(self) -> list:
        return [self._bungkus(n) for n in self._kursor.fetchall()]

    def fetchmany(self, ukuran: int = 1) -> list:
        return [self._bungkus(n) for n in self._kursor.fetchmany(ukuran)]

    def __iter__(self):
        # Kursor libsql TIDAK bisa diiterasi langsung, beda dari `sqlite3` —
        # sementara `for r in conn.execute(...)` dipakai di banyak tempat,
        # termasuk di dalam `buka()` sendiri. Jadi diambil sekaligus.
        #
        # ponytail: berarti seluruh hasil masuk memori dulu. Tidak masalah untuk
        # query di modul ini (paling besar satu padukuhan); pindah ke
        # `fetchmany()` berulang kalau nanti ada query yang benar-benar besar.
        return iter(self.fetchall())

    def __getattr__(self, nama: str):
        # `rowcount`, `lastrowid`, `description` diteruskan apa adanya. Nama
        # berawalan garis bawah sengaja ditolak, kalau tidak pencarian atribut
        # internal berputar tanpa henti sebelum `_kursor` sempat terpasang.
        if nama.startswith("_"):
            raise AttributeError(nama)
        return getattr(self._kursor, nama)


_NAMA_PARAM = re.compile(r"[A-Za-z_]\w*")


def _ke_parameter_berurutan(sql: str) -> tuple[str, list[str]]:
    """Ubah parameter bernama (`:kolom`) jadi berurutan (`?`)."""
    keluar: list[str] = []
    urutan: list[str] = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if c == "'":  # literal teks; `''` di dalamnya berarti satu kutip
            j = i + 1
            while j < n:
                if sql[j] == "'":
                    if j + 1 < n and sql[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            keluar.append(sql[i : j + 1])
            i = j + 1
        elif c == '"':  # nama kolom/tabel yang dikutip
            j = sql.find('"', i + 1)
            j = n - 1 if j == -1 else j
            keluar.append(sql[i : j + 1])
            i = j + 1
        elif c == ":" and (cocok := _NAMA_PARAM.match(sql, i + 1)):
            urutan.append(cocok.group(0))
            keluar.append("?")
            i = cocok.end()
        else:
            keluar.append(c)
            i += 1
    return "".join(keluar), urutan


class _KoneksiTurso:
    """Koneksi Turso, sejauh yang dipakai modul-modul `app/data/`."""

    def __init__(self, mentah) -> None:
        self._mentah = mentah

    def execute(self, sql: str, parameter=()) -> _KursorTurso:
        if isinstance(parameter, Mapping):
            sql, urutan = _ke_parameter_berurutan(sql)
            parameter = tuple(parameter[nama] for nama in urutan)
        return _KursorTurso(self._mentah.execute(sql, parameter))

    def executemany(self, sql: str, parameter) -> _KursorTurso:
        # libsql menolak generator, jadi dibulatkan jadi list lebih dulu.
        baris = list(parameter)
        if baris and isinstance(baris[0], Mapping):
            sql, urutan = _ke_parameter_berurutan(sql)
            baris = [tuple(b[nama] for nama in urutan) for b in baris]
        else:
            baris = [tuple(b) for b in baris]
        return _KursorTurso(self._mentah.executemany(sql, baris))

    def cursor(self) -> _KursorTurso:
        return _KursorTurso(self._mentah.cursor())

    # `with conn:` dipakai sebagai blok transaksi di 18 tempat (`sesi.py`,
    # `pengurus.py`, `pergantian.py`, `audit.py`, dan modul ini). Aturannya
    # ditiru persis dari `sqlite3`: selesai mulus → commit, ada galat →
    # rollback, dan galatnya TIDAK ditelan.
    def __enter__(self) -> "_KoneksiTurso":
        return self

    def __exit__(self, jenis, nilai, jejak) -> bool:
        if jenis is None:
            self._mentah.commit()
        else:
            self._mentah.rollback()
        return False

    def __getattr__(self, nama: str):
        # `commit`, `rollback`, `close`, `sync`.
        if nama.startswith("_"):
            raise AttributeError(nama)
        return getattr(self._mentah, nama)


# Dipakai di anotasi supaya jelas bahwa `conn` bisa datang dari dua dunia.
# Keduanya berperilaku sama sejauh SQL yang ditulis modul ini.
Koneksi = sqlite3.Connection | _KoneksiTurso
Baris = sqlite3.Row | _Baris


def _kunci_path(path: Path) -> str:
    """Bentuk path yang bisa dibandingkan. Windows tidak peduli besar-kecil."""
    try:
        return str(path.resolve()).lower()
    except OSError:
        return str(path).lower()


def _path_replika(path: Path) -> Path:
    """Berkas salinan lokal untuk mode Turso — `sigalon.db` → `sigalon.replika.db`."""
    return path.with_name(f"{path.stem}.replika{path.suffix}")


def _tujuan_turso() -> dict[str, tuple[str, str]]:
    """Path mana yang dilayani Turso, dikunci SEKALI saat modul diimpor."""
    pasangan = (
        (
            settings.DATABASE_FILE,
            settings.TURSO_DATABASE_URL,
            settings.TURSO_AUTH_TOKEN,
        ),
        (
            settings.PORTAL_DATABASE_FILE,
            settings.TURSO_PORTAL_DATABASE_URL,
            settings.TURSO_PORTAL_AUTH_TOKEN,
        ),
    )
    return {
        _kunci_path(file): (url, token) for file, url, token in pasangan if url and token
    }


_TUJUAN_TURSO = _tujuan_turso()
_SUDAH_SINKRON: set[str] = set()
_MODE_LOKAL = False


def paksa_lokal() -> None:
    """Matikan Turso untuk sisa proses ini."""
    global _MODE_LOKAL
    _MODE_LOKAL = True


def turso_aktif() -> bool:
    """Ada database yang dilayani Turso? Dipakai log startup & `backend/README.md`."""
    return bool(_TUJUAN_TURSO) and not _MODE_LOKAL


def _tujuan_untuk(path: Path) -> tuple[str, str] | None:
    """URL + token Turso untuk file ini, atau None kalau memang lokal."""
    return None if _MODE_LOKAL else _TUJUAN_TURSO.get(_kunci_path(path))


def _sambung(path: Path) -> Koneksi:
    tujuan = _tujuan_untuk(path)
    if tujuan is None:
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return conn

    url, token = tujuan
    try:
        import libsql
    except ModuleNotFoundError as e:  # pragma: no cover - salah pasang, bukan alur
        raise RuntimeError(
            "Turso disetel di .env tapi pustakanya belum terpasang. "
            "Jalankan: pip install -r requirements.txt"
        ) from e

    mentah = libsql.connect(str(_path_replika(path)), sync_url=url, auth_token=token)

    # Tarik sekali per proses; sesudah itu tulisan kita sendiri yang menjaganya mutakhir.
    # ponytail: kalau backend jalan lebih dari satu, pindah ke `sync_interval` libsql.
    kunci = _kunci_path(path)
    if kunci not in _SUDAH_SINKRON:
        mentah.sync()
        _SUDAH_SINKRON.add(kunci)

    return _KoneksiTurso(mentah)


def _adalah_portal(path: Path) -> bool:
    try:
        return (
            path.resolve() == settings.PORTAL_DATABASE_FILE.resolve()
            or "portal" in path.stem.lower()
        )
    except Exception:
        return "portal" in str(path).lower()


def _pasang_skema(conn: Koneksi, is_portal: bool) -> None:
    if is_portal:
        conn.executescript(SKEMA_PORTAL)
        conn.commit()
        return
    # Penggantian nama kolom WAJIB sebelum `SKEMA`: skema baru memasang indeks
    # di atas nama kolom yang baru, dan itu gagal selama kolomnya masih bernama
    # lama di instalasi yang sudah jalan.
    _ganti_nama_kolom(conn)
    conn.executescript(SKEMA_KEPENDUDUKAN)
    # Ditutup di sini, tidak dibiarkan menggantung sampai akhir: lewat Turso tiap
    # perintah adalah satu perjalanan ke server, dan transaksi yang dibiarkan
    # terbuka selama belasan perjalanan akan dibatalkan sepihak karena dianggap
    # menganggur terlalu lama.
    conn.commit()
    _tambal_kolom(conn)
    _migrasi_data(conn)


# Path yang skemanya sudah dipastikan pada proses ini.
_SKEMA_SIAP: set[str] = set()


def buka(path: Path) -> Koneksi:
    """Buka koneksi, bikin file & skema kalau belum ada."""
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = _sambung(path)
    # Tanpa ini SQLite mengabaikan FOREIGN KEY diam-diam. Per koneksi, jadi
    # tidak ikut dilewati oleh penjagaan di bawah.
    conn.execute("PRAGMA foreign_keys = ON")

    # Skema dipasang SEKALI per proses, bukan tiap koneksi dibuka. Di file lokal
    # bedanya tidak terasa, tapi `koneksi()` membuka-menutup tiap operasi — lewat
    # Turso itu berarti dua puluhan perjalanan ke server mengulang `CREATE TABLE
    # IF NOT EXISTS` yang sama pada SETIAP permintaan halaman.
    kunci = _kunci_path(path)
    if kunci not in _SKEMA_SIAP:
        _pasang_skema(conn, _adalah_portal(path))
        _SKEMA_SIAP.add(kunci)

    return conn


def _migrasi_data(conn: Koneksi) -> None:
    """Migrasi nilai data lama yang berubah di skema baru."""
    ada = {r["name"] for r in conn.execute("PRAGMA table_info(penduduk)")}
    if "pendidikan" in ada:
        conn.execute(
            "UPDATE penduduk SET pendidikan = 'TIDAK_BELUM_SEKOLAH' WHERE pendidikan = 'TIDAK_SEKOLAH'"
        )
        conn.commit()


# Kolom yang ditambahkan setelah ada instalasi berjalan. `CREATE TABLE IF NOT
# EXISTS` tidak menyentuh tabel yang sudah ada.
#
# ponytail: daftar tempel seadanya, cukup selama tambahannya kolom nullable.
# Begitu ada yang butuh mengisi ulang atau membuang kolom, pakai alat migrasi.
_TAMBALAN: list[tuple[str, str, str]] = [
    ("pengurus", "warga_id", "TEXT"),
    ("audit_log", "sasaran_id", "TEXT"),
    ("lpm", "warga_id", "TEXT"),
    ("penduduk", "kodeKeluarga", "TEXT"),
    ("penduduk", "bansos", "TEXT"),
    ("penduduk", "statusDomisili", "TEXT"),
    ("penduduk", "alamatAsal", "TEXT"),
    ("penduduk", "catatanPerkawinan", "TEXT"),
    ("penduduk", "catatanKematian", "TEXT"),
]


def _tambal_kolom(conn: Koneksi) -> None:
    for tabel, kolom, tipe in _TAMBALAN:
        ada = {r["name"] for r in conn.execute(f"PRAGMA table_info({tabel})")}
        if ada and kolom not in ada:
            conn.execute(f"ALTER TABLE {tabel} ADD COLUMN {kolom} {tipe}")
            conn.commit()


# Kolom yang BERGANTI NAMA setelah ada instalasi berjalan. Menghapus file `.db`
# bukan pilihan: tabel `pengajuan` itu riwayat permanen perpindahan jabatan.
#
# ponytail: sama seperti `_TAMBALAN` — daftar tempel seadanya. `ALTER TABLE
# RENAME COLUMN` butuh SQLite 3.25+ (2018); Python 3.11 membawa yang jauh lebih
# baru, jadi tidak dijaga versinya di sini.
_GANTI_NAMA: list[tuple[str, str, str]] = [
    # Istilah "kursi" diganti "jabatan" — dua kata untuk satu hal, dan yang
    # dipakai perangkat desa adalah "jabatan".
    ("pengajuan", "kursi", "jabatan_kode"),
]

# Indeks yang ditinggalkan penggantian nama di atas. SQLite ikut memperbarui
# DEFINISI indeks saat kolomnya di-rename, tapi NAMA indeksnya tetap yang lama —
# tanpa baris ini satu tabel berakhir punya dua indeks beridentik isi.
_INDEKS_USANG = ["idx_pengajuan_kursi"]


def _ganti_nama_kolom(conn: Koneksi) -> None:
    for tabel, lama, baru in _GANTI_NAMA:
        kolom = {r["name"] for r in conn.execute(f"PRAGMA table_info({tabel})")}
        # Tabel belum ada (DB baru) atau sudah pernah diganti — dua-duanya
        # bukan galat, cuma tidak ada yang perlu dikerjakan.
        if lama not in kolom or baru in kolom:
            continue
        conn.execute(f"ALTER TABLE {tabel} RENAME COLUMN {lama} TO {baru}")
        conn.commit()
    for indeks in _INDEKS_USANG:
        conn.execute(f"DROP INDEX IF EXISTS {indeks}")
    conn.commit()


# Koneksi Turso yang dipakai bersama, satu per database, beserta gemboknya.
_KONEKSI_BERSAMA: dict[str, Koneksi] = {}
_GEMBOK = threading.RLock()


@contextmanager
def koneksi(path: Path) -> Iterator[Koneksi]:
    """Koneksi untuk satu operasi.

    File lokal: buka-tutup tiap panggilan. Turso: satu koneksi digilir
    lewat gembok — `PRAGMA foreign_keys = ON` makan 850 ms lewat jaringan.

    ponytail: kalau terasa antre, pakai kumpulan koneksi per thread. Jangan
    hapus gemboknya — `with conn:` dipakai sebagai blok transaksi di 18 tempat.
    """
    if _tujuan_untuk(path) is not None:
        with _GEMBOK:
            kunci = _kunci_path(path)
            conn = _KONEKSI_BERSAMA.get(kunci)
            if conn is None:
                conn = buka(path)
                _KONEKSI_BERSAMA[kunci] = conn
            yield conn
        return

    conn = buka(path)
    try:
        yield conn
    finally:
        conn.close()


def kosong(conn: Koneksi) -> bool:
    return conn.execute("SELECT 1 FROM penduduk LIMIT 1").fetchone() is None


def _ke_row(p: Penduduk) -> dict[str, object]:
    data = p.model_dump()
    alamat = data.pop("alamat")
    data.update({f"{_PREFIKS_ALAMAT}{k}": v for k, v in alamat.items()})
    if isinstance(data.get("bansos"), list):
        data["bansos"] = ",".join(data["bansos"]) if data["bansos"] else ""
    return data


def _ke_penduduk(row: Baris) -> Penduduk:
    data = dict(row)
    alamat = {
        k.removeprefix(_PREFIKS_ALAMAT): v
        for k, v in data.items()
        if k.startswith(_PREFIKS_ALAMAT)
    }
    inti = {k: v for k, v in data.items() if not k.startswith(_PREFIKS_ALAMAT)}
    bansos_raw = inti.get("bansos")
    if bansos_raw:
        inti["bansos"] = [b.strip() for b in bansos_raw.split(",") if b.strip()]
    else:
        inti["bansos"] = []
    if not inti.get("statusDomisili"):
        inti["statusDomisili"] = "TETAP"
    return Penduduk(**inti, alamat=Alamat(**alamat))


def simpan(conn: Koneksi, daftar: Iterable[Penduduk]) -> int:
    """Sisipkan penduduk. Mengembalikan jumlah baris yang masuk."""
    rows = [_ke_row(p) for p in daftar]
    if not rows:
        return 0
    kolom = ", ".join(rows[0])
    nilai = ", ".join(f":{k}" for k in rows[0])
    with conn:
        conn.executemany(f"INSERT INTO penduduk ({kolom}) VALUES ({nilai})", rows)
    return len(rows)


def kosongkan(conn: Koneksi) -> int:
    """Hapus seluruh baris penduduk, kembalikan jumlah yang terhapus."""
    baris = conn.execute("SELECT COUNT(*) FROM penduduk").fetchone()
    jumlah = baris[0] if baris is not None else 0
    with conn:
        conn.execute("DELETE FROM penduduk")
    return int(jumlah)


def perbarui(conn: Koneksi, p: Penduduk) -> bool:
    """Timpa satu baris penduduk. `False` kalau `id`-nya tidak ada."""
    row = _ke_row(p)
    id_ = row.pop("id")
    setter = ", ".join(f"{k} = :{k}" for k in row)
    with conn:
        cur = conn.execute(
            f"UPDATE penduduk SET {setter} WHERE id = :id", {**row, "id": id_}
        )
    return cur.rowcount > 0


def muat(conn: Koneksi) -> list[Penduduk]:
    """Semua baris, termasuk yang ber-`deletedAt`. Penyaringan milik `store.py`."""
    return [
        _ke_penduduk(r)
        for r in conn.execute("SELECT * FROM penduduk ORDER BY rowid")
    ]


# Buku mutasi lebih tua dari ini dihapus otomatis. 365 hari (≈12 bulan) cukup
# untuk kebutuhan statistik historis di level padukuhan; yang lebih lama tidak
# bisa direkonstruksi tapi juga tidak pernah diminta. Tanpa ini tabel tumbuh
# tanpa batas seumur aplikasi.
RETENSI_MUTASI_HARI = 365


def _pangkas_mutasi_lama(conn: Koneksi) -> None:
    """Buang baris mutasi yang lebih tua dari `RETENSI_MUTASI_HARI`."""
    batas = (
        datetime.now(timezone.utc) - timedelta(days=RETENSI_MUTASI_HARI)
    ).isoformat(timespec="seconds")
    conn.execute("DELETE FROM mutasi WHERE pada < ?", (batas,))
    conn.commit()


def catat_mutasi(
    conn: Koneksi, warga_id: str, dari: str | None, ke: str, oleh: str
) -> None:
    """Tulis satu baris buku mutasi. `dari=None` untuk warga yang baru masuk."""
    conn.execute(
        "INSERT INTO mutasi (warga_id, dari, ke, pada, oleh) VALUES (?, ?, ?, ?, ?)",
        (warga_id, dari, ke, datetime.now(timezone.utc).isoformat(timespec="seconds"), oleh),
    )
    conn.commit()
    _pangkas_mutasi_lama(conn)


def mutasi_sejak(conn: Koneksi, batas: str) -> list[Baris]:
    """Mutasi yang tercatat pada atau sesudah `batas` (ISO), TERBARU DULU."""
    return list(
        conn.execute(
            "SELECT warga_id, dari, ke FROM mutasi WHERE pada >= ? ORDER BY pada DESC, id DESC",
            (batas,),
        )
    )


def mutasi_terawal(conn: Koneksi) -> str | None:
    """Waktu mutasi paling lama, atau None kalau bukunya masih kosong."""
    baris = conn.execute("SELECT MIN(pada) AS pada FROM mutasi").fetchone()
    return baris["pada"] if baris and baris["pada"] else None


def _contoh_penduduk() -> list[Penduduk]:
    """Data uji seadanya untuk `_self_check`."""

    def _buat(id: str, nama: str, **ubah: object) -> Penduduk:
        bawaan = dict(
            id=id, nama=nama,
            jenisKelamin="LAKI_LAKI", tempatLahir="Bandung",
            tanggalLahir="1990-01-01", agama="ISLAM", statusPerkawinan="KAWIN",
            pendidikan="SMA", pekerjaan="Petani", golonganDarah="O",
            statusHubunganKeluarga="KEPALA_KELUARGA", kewarganegaraan="WNI",
            alamat=Alamat(
                jalan="Jl. Uji No. 1", rt="1", rw="19", desa="Sukamaju",
                kecamatan="Cibiru", kabupaten="Bandung", provinsi="Jawa Barat",
                kodePos="40615",
            ),
        )
        return Penduduk(**{**bawaan, **ubah})  # type: ignore[arg-type]

    return [
        _buat("4f1d0c8e-0001-4000-8000-000000000001", "Warga Normal"),
        _buat(
            "4f1d0c8e-0002-4000-8000-000000000002",
            "Warga Salah Input",
            deletedAt="2026-01-15",
        ),
        _buat(
            "4f1d0c8e-0003-4000-8000-000000000003",
            "Warga Pindah",
            statusKependudukan="PINDAH",
        ),
    ]


def _check_migrasi_jabatan() -> None:
    """DB lama (kolom `pengajuan.kursi`) harus terangkat sendiri saat dibuka.

    Diuji beneran, bukan dibaca sekilas: tabel `pengajuan` adalah riwayat
    permanen perpindahan jabatan, jadi migrasi yang salah menghapus catatan yang
    tidak bisa dibuat ulang dari mana pun.
    """
    import tempfile

    # Bentuk tabel PERSIS seperti sebelum penggantian nama — ditulis tangan,
    # bukan diambil dari `SKEMA`, karena `SKEMA` sudah memakai nama yang baru.
    skema_lama = """
    CREATE TABLE pengajuan (
        id            TEXT PRIMARY KEY,
        kursi         TEXT NOT NULL,
        role          TEXT NOT NULL,
        rw            TEXT,
        rt            TEXT,
        kandidat_id   TEXT NOT NULL,
        kandidat_nama TEXT NOT NULL,
        kandidat_rt   TEXT NOT NULL,
        kandidat_rw   TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'MENUNGGU',
        diajukan_oleh TEXT NOT NULL,
        diajukan_pada TEXT NOT NULL,
        selesai_pada  TEXT,
        sebab         TEXT
    );
    CREATE INDEX idx_pengajuan_kursi ON pengajuan(kursi, status);
    """

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "lama.db"
        tua = sqlite3.connect(path)
        tua.executescript(skema_lama)
        tua.execute(
            "INSERT INTO pengajuan (id, kursi, role, rw, rt, kandidat_id,"
            " kandidat_nama, kandidat_rt, kandidat_rw, diajukan_oleh,"
            " diajukan_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("p1", "RT:019/001", "RT", "019", "001", "W1", "Budi", "001",
             "019", "admin", "2026-08-01T00:00:00"),
        )
        tua.commit()
        tua.close()

        conn = buka(path)
        kolom = {r["name"] for r in conn.execute("PRAGMA table_info(pengajuan)")}
        assert "jabatan_kode" in kolom, "kolom belum berganti nama"
        assert "kursi" not in kolom, "kolom lama masih ada"

        baris = conn.execute("SELECT * FROM pengajuan").fetchone()
        assert baris is not None, "baris pengajuan hilang saat migrasi"
        assert baris["jabatan_kode"] == "RT:019/001", "isi baris hilang saat migrasi"
        assert baris["kandidat_nama"] == "Budi", "kolom lain ikut rusak"

        indeks = {
            r["name"]
            for r in conn.execute("PRAGMA index_list(pengajuan)")
        }
        assert "idx_pengajuan_kursi" not in indeks, "indeks usang tidak dibuang"
        assert "idx_pengajuan_jabatan" in indeks, "indeks baru tidak terpasang"
        conn.close()

        # Buka lagi: migrasi harus diam kalau tidak ada yang perlu dikerjakan.
        conn = buka(path)
        sisa = conn.execute("SELECT COUNT(*) c FROM pengajuan").fetchone()
        assert sisa is not None and sisa["c"] == 1
        conn.close()

    print("OK: DB lama (kolom `kursi`) terangkat ke `jabatan_kode`")


def _check_jembatan_turso() -> None:
    """Jembatan baris Turso diuji beneran, dan tanpa menyentuh jaringan."""
    global _MODE_LOKAL

    try:
        import libsql
    except ModuleNotFoundError:
        print("LEWAT: pustaka `libsql` belum terpasang, jembatan Turso tidak diuji")
        return

    import tempfile

    mode_asli, connect_asli = _MODE_LOKAL, libsql.connect

    def _connect_tanpa_jaringan(nama, sync_url=None, auth_token=None):
        return connect_asli(nama)

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        path = Path(tmp) / "turso_uji.db"
        kunci = _kunci_path(path)
        conn: Koneksi | None = None

        libsql.connect = _connect_tanpa_jaringan
        _TUJUAN_TURSO[kunci] = ("libsql://uji.invalid", "token-uji")
        _SUDAH_SINKRON.add(kunci)  # jangan panggil .sync(): tidak ada lawan bicara
        _MODE_LOKAL = False
        try:
            conn = buka(path)
            assert isinstance(conn, _KoneksiTurso), "routing Turso tidak kena"

            # Skema, tambal kolom, dan ganti nama kolom semuanya membaca
            # `PRAGMA table_info` lewat nama kolom — itu sudah jalan kalau
            # `buka()` di atas tidak melempar.
            kolom = {r["name"] for r in conn.execute("PRAGMA table_info(penduduk)")}
            assert "jenisKelamin" in kolom, "nama kolom tidak terbaca dari PRAGMA"

            asli = _contoh_penduduk()
            assert kosong(conn), "DB baru harus kosong"
            assert simpan(conn, asli) == len(asli), "jumlah baris tersimpan meleset"

            hasil = {p.id: p for p in muat(conn)}
            assert set(hasil) == {p.id for p in asli}, "id hilang/berubah"
            for p in asli:
                assert hasil[p.id] == p, f"baris {p.id} berubah setelah roundtrip"

            baris = conn.execute(
                "SELECT id, nama FROM penduduk ORDER BY id"
            ).fetchone()
            assert baris is not None, "baris pertama tidak terbaca"
            assert baris["nama"] == baris[1], "baca lewat nama != baca lewat nomor"
            assert baris["NAMA"] == baris["nama"], "nama kolom harus abai besar-kecil"
            assert dict(baris).keys() == {"id", "nama"}, "dict(baris) tidak utuh"
            assert len(baris) == 2, "panjang baris meleset"

            kosong_hasil = conn.execute(
                "SELECT id FROM penduduk WHERE id = 'tidak-ada'"
            ).fetchone()
            assert kosong_hasil is None, "baris kosong harus None, bukan pembungkus"

            try:
                baris["kolomNgawur"]
            except IndexError:
                pass
            else:
                raise AssertionError("kolom tidak dikenal harus melempar IndexError")

            # `perbarui` merakit klausa SET dari nama kolom, jadi ia satu-satunya
            # yang menguji penerjemah parameter bernama pada UPDATE — sekaligus
            # `rowcount`, yang dipakai untuk membedakan "id tidak ada" dari
            # "tidak ada yang berubah".
            diubah = asli[0].model_copy(update={"pekerjaan": "PETANI TURSO"})
            assert perbarui(conn, diubah) is True, "perbarui gagal"
            sesudah = {p.id: p for p in muat(conn)}[diubah.id]
            assert sesudah.pekerjaan == "PETANI TURSO", "nilai baru tidak tersimpan"
            assert sesudah.nama == asli[0].nama, "kolom lain ikut berubah"

            hantu = diubah.model_copy(update={"id": "tidak-ada-kode-ini"})
            assert perbarui(conn, hantu) is False, "id asing harus mengembalikan False"

            # Buku mutasi: dipakai statistik bulan lampau, dan menulisnya lewat
            # jalur yang sama.
            catat_mutasi(conn, diubah.id, "AKTIF", "PINDAH", "uji")
            assert mutasi_terawal(conn) is not None, "mutasi tidak tercatat"

            assert kosongkan(conn) == len(asli), "kosongkan salah menghitung"
        finally:
            if conn is not None:
                conn.close()
            libsql.connect = connect_asli
            _TUJUAN_TURSO.pop(kunci, None)
            _SUDAH_SINKRON.discard(kunci)
            _MODE_LOKAL = mode_asli

    print("OK: jembatan baris Turso (nama kolom, dict(), PRAGMA) utuh")


def _self_check() -> None:
    import tempfile

    # Turso dimatikan dulu: di bawah ini ada `kosongkan()`, yang mengosongkan
    # tabel penduduk. Salah routing sekali saja = data warga di cloud lenyap.
    paksa_lokal()

    _check_migrasi_jabatan()
    _check_jembatan_turso()

    asli = _contoh_penduduk()
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "sub" / "uji.db"  # `sub/` belum ada: uji mkdir juga.

        conn = buka(path)
        assert kosong(conn), "DB baru harus kosong"
        assert simpan(conn, asli) == len(asli), "jumlah baris tersimpan meleset"
        assert not kosong(conn), "DB terisi tapi masih terbaca kosong"
        conn.close()

        # Tutup lalu buka lagi: inti dari pindah ke SQLite adalah data selamat
        # melewati restart proses, jadi itu yang diuji — bukan sekadar roundtrip.
        conn = buka(path)
        hasil = muat(conn)

        assert {p.id for p in hasil} == {p.id for p in asli}, "id hilang/berubah"
        by_id = {p.id: p for p in hasil}
        for p in asli:
            assert by_id[p.id] == p, f"baris {p.id} berubah setelah roundtrip"

        # Kolom yang paling gampang tercecer: alamat (diratakan lalu disusun
        # ulang) dan dua kolom nullable/berdefault.
        assert all(p.alamat.rt and p.alamat.kodePos for p in hasil), "alamat kosong"
        terhapus = [p for p in hasil if p.deletedAt is not None]
        assert len(terhapus) == len([p for p in asli if p.deletedAt is not None]), (
            "deletedAt tidak selamat"
        )
        assert {p.statusKependudukan for p in hasil} == {
            p.statusKependudukan for p in asli
        }, "statusKependudukan tidak selamat"

        # RT/RW konsisten tersimpan sebagai string
        assert all(p.alamat.rt and p.alamat.rw for p in hasil), (
            "alamat RT/RW kosong setelah disimpan"
        )

        # Impor menimpa: kosongkan harus mengembalikan tabel ke nol baris, dan
        # melaporkan berapa yang dibuang supaya skrip impor bisa memperingatkan.
        assert kosongkan(conn) == len(asli), "kosongkan salah menghitung baris lama"
        assert kosong(conn), "tabel masih terisi setelah dikosongkan"
        assert muat(conn) == [], "muat masih mengembalikan baris setelah dikosongkan"
        assert kosongkan(conn) == 0, "mengosongkan tabel kosong harus mengembalikan 0"
        assert simpan(conn, asli) == len(asli), "impor ulang setelah kosong gagal"
        conn.close()

        conn = buka(path)
        assert len(muat(conn)) == len(asli), "impor ulang tidak selamat lewat restart"
        conn.close()

        # Uji inisialisasi skema portal
        path_portal = Path(tmp) / "portal_uji.db"
        conn_portal = buka(path_portal)
        tabel_portal = {
            r[0]
            for r in conn_portal.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        }
        assert "berita" in tabel_portal and "padukuhan" in tabel_portal and "lpm" in tabel_portal and "titik_lokasi" in tabel_portal
        assert "penduduk" not in tabel_portal
        conn_portal.close()

    print(f"OK: {len(hasil)} baris selamat lewat tutup-buka SQLite, impor menimpa bersih, skema portal teruji")


if __name__ == "__main__":
    _self_check()
