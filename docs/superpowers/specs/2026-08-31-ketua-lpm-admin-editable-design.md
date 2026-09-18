# Desain: Ketua LPM bisa diubah Admin lewat web

Tanggal: 2026-08-31

## Konteks

Ketua LPM sudah ada sebagai konstanta manual (`frontend/src/lib/padukuhan.ts`,
`LPM = { jabatan: 'Ketua LPM', nama: 'Masjkuri' }`), sengaja terpisah dari
sistem `pengurus`: LPM bukan salah satu dari empat peran akun
(ADMIN/DUKUH/RW/RT), jadi tidak punya login dan tidak ikut sistem
ganti-jabatan yang disetujui (lihat komentar di file itu, dan
`StrukturOrganisasiPublik` di `backend/app/schemas/pengurus.py`).

Endpoint `GET /publik/struktur-organisasi` (dibuat sesi ini, belum di-commit)
sudah mengembalikan Dukuh & Ketua RW/RT otomatis dari `pengurus.daftar_jabatan()`
— pergantian yang disetujui langsung terlihat di bagan tanpa deploy ulang.
LPM tertinggal: mengubah namanya masih berarti mengedit kode dan deploy ulang.

## Keputusan

1. **LPM tetap di luar tabel `pengurus`.** Tidak ada login, tidak ada
   persetujuan siapa pun — Admin mengubah nilainya langsung. Ini beda dari
   empat peran lain dengan sengaja, bukan celah yang harus ditambal.
2. **Nama disimpan di tabel baru `lpm`, satu baris tunggal**, pola yang sama
   dengan `kunjungan` (`INSERT ... ON CONFLICT DO UPDATE`, tanpa seed —
   baris pertama dibuat saat pertama kali Admin mengisi).
3. **Dibaca lewat endpoint publik yang sudah ada** (`/publik/struktur-organisasi`),
   bukan endpoint baru — cukup tambah satu field `lpm` di response yang sudah
   dipanggil `BaganOrganisasi.tsx`.
4. **Ditulis lewat endpoint baru** `PATCH /pengurus/lpm`, di router `pengurus`
   yang sama (sudah digerbangi `current_admin` di level router). Ini berbeda
   dari larangan "tidak ada cara mengosongkan jabatan" yang berlaku di router
   itu — larangan itu soal empat peran berakun dan mekanisme
   persetujuannya; LPM sama sekali di luar mekanisme itu, jadi tidak
   melanggarnya.
5. **Tercatat di audit** seperti aksi Admin lainnya — aksi baru `"ubah-lpm"`
   ditambahkan ke `AKSI_AKUN` di `app/core/audit.py`.
6. **String kosong berarti "Belum diisi"**, memakai penanganan kosong yang
   sudah ada di komponen `Kotak` (`BaganOrganisasi.tsx`) — tidak perlu state
   "vacant" terpisah.

## Data

```sql
CREATE TABLE IF NOT EXISTS lpm (
    id   INTEGER PRIMARY KEY CHECK (id = 1),
    nama TEXT NOT NULL DEFAULT ''
);
```

Ditambahkan di `backend/app/data/db.py`, bagian `SKEMA` (bukan `_TAMBALAN`
— ini tabel baru, bukan kolom baru di tabel lama).

## Backend

**`app/data/lpm.py`** (baru, pola sama `app/data/kunjungan.py`):

```python
def nama() -> str:
    """Nama Ketua LPM saat ini. String kosong berarti belum diisi."""

def ubah(nama_baru: str) -> str:
    """Ganti nama Ketua LPM, kembalikan nilai barunya."""

def demo() -> None:
    """Self-check: DATABASE_PATH=/tmp/uji.db .venv/bin/python -m app.data.lpm"""
```

**`app/schemas/pengurus.py`**:
- `StrukturOrganisasiPublik` dapat field `lpm: Optional[str] = None`.
  Komentar yang bilang "LPM sengaja tidak ikut" dihapus/diperbarui — sudah
  tidak akurat setelah perubahan ini.
- Schema baru `LpmUbah(BaseModel)`: `nama: str = Field(max_length=100)`,
  di-`.strip()` di router sebelum disimpan.

**`app/api/routers/publik.py`**: `struktur_organisasi_publik()` memanggil
`data_lpm.nama()`, isi field `lpm` (`None` kalau string kosong, konsisten
dengan `dukuh`/`nama` RW-RT yang sudah `Optional[str]`).

**`app/api/routers/pengurus.py`**: endpoint baru, ditaruh setelah `GET/POST ""`
dan sebelum `/{id}/reset-password` (urutan tidak masalah di sini — `"lpm"`
adalah path statis, tidak akan pernah cocok dengan pola `/{id}/...`, jadi
tidak ada risiko tertangkap sebagai `{id}`):

```python
@router.patch("/lpm")
def ubah_lpm(payload: LpmUbah, admin: AuthUser = Depends(current_admin)) -> dict[str, str]:
    """Ganti nama Ketua LPM. Bukan jabatan berakun — tanpa login, tanpa
    persetujuan siapa pun, beda dari seluruh jabatan lain di router ini."""
    lama = data_lpm.nama()
    baru = data_lpm.ubah(payload.nama.strip())
    catat_audit(
        aktor=admin.username, aksi="ubah-lpm", sasaran="Ketua LPM",
        perubahan=f"{lama or '(kosong)'} → {baru or '(kosong)'}",
    )
    return {"nama": baru}
```

**`app/core/audit.py`**: `AKSI_AKUN = ("tambah-pengurus", "reset-password", "ubah-lpm")`.

## Frontend

- **`features/struktur-organisasi/types.ts`**: `StrukturOrganisasiPublik` dapat
  `lpm: string | null`.
- **`pages/publik/profil/components/BaganOrganisasi.tsx`**: `<Kotak label={LPM.jabatan} nama={LPM.nama} putus />`
  → `<Kotak label="Ketua LPM" nama={struktur.lpm} putus />`. Import `LPM` dari
  `lib/padukuhan.ts` dihapus dari file ini.
- **`lib/padukuhan.ts`**: konstanta `LPM` dihapus — sudah digantikan data dari
  backend.
- **Halaman Kelola Akun** (tempat screenshot admin di awal percakapan): satu
  baris tambahan "Ketua LPM" di tabel Daftar Akun yang sama. Kolom Username/
  Status tidak berlaku (ditampilkan `—`), tombol aksinya "Ubah Nama" bukan
  "+ Buat Akun" — buka dialog kecil berisi satu input nama, submit memanggil
  mutation baru di `features/pengurus` (`ubahLpm`) yang hit
  `PATCH /pengurus/lpm`. Sumber nilai baris ini memakai
  `useStrukturOrganisasi()` yang sudah ada (`features/struktur-organisasi`) —
  tidak perlu GET baru untuk prefill form.
- Invalidate cache setelah sukses: query key `['struktur-organisasi']` dipakai
  langsung sebagai literal di `onSuccess` mutation (bukan meng-impor
  `strukturOrganisasiKeys` dari fitur lain — itu melanggar aturan arah impor
  §4 CLAUDE.md, fitur tidak boleh impor internal fitur lain).

## Testing

- `DATABASE_PATH=/tmp/uji.db .venv/bin/python -m app.data.lpm` — self-check baru.
- Jalur manual: jalankan uvicorn dengan `DATABASE_PATH` sementara, `PATCH /pengurus/lpm`
  lewat urllib dengan sesi Admin, lalu `GET /publik/struktur-organisasi` tanpa
  auth dan pastikan field `lpm` ikut berubah.
- `npm run typecheck && npm run lint && npm run build` di frontend.

## Batasan yang diterima sadar

- Tidak ada riwayat versi nama Ketua LPM selain baris audit log (tidak ada
  tabel riwayat terpisah seperti `pengajuan`/`persetujuan` — LPM memang
  sengaja di luar mekanisme itu).
- Tidak ada validasi bahwa nama yang diketik Admin adalah warga sungguhan —
  berbeda dari empat peran lain, LPM tidak terhubung ke Kode Warga sama
  sekali, jadi tidak ada yang bisa diperiksa.
