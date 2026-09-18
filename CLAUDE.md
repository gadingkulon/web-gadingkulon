# CLAUDE.md — Panduan Kerja & Konvensi Kode (SIGALON)

Dokumen ini adalah **sumber kebenaran** untuk gaya kode, arsitektur, dan alur
kerja proyek **SIGALON — Portal Data Kependudukan Desa**. Baca ini sebelum menulis
kode agar hasil tetap rapi dan konsisten.

---

## Kondisi Saat Ini

- **Backend:** aktif — FastAPI, 10 endpoint (auth, penduduk, infografis,
  statistik publik, kelola akun pengurus). Daftar lengkap di §11.
- **Frontend:** aktif, http-only — semua fitur memanggil backend langsung
  lewat `apiClient`. Backend harus jalan (`localhost:8000`) agar frontend
  berfungsi.
- **Database:** **SQLite — terpasang** untuk data penduduk **dan akun
  pengurus** (`backend/app/data/db.py`, file di `settings.DATABASE_PATH`).
  Tidak ada seeding otomatis: data penduduk masuk lewat
  `app/data/impor_excel.py`, akun Dukuh pertama lewat `pengurus.bootstrap()`
  dari env. Audit log **juga sudah di SQLite** (tabel `audit_log`) sejak
  Tahap 3b. **Yang masih di memori:** hitungan rate limit login saja
  (`app/core/ratelimit.py`), dan itu memang hilang tiap restart.
- **NIK & No. KK tidak disimpan sama sekali** (keputusan desa, 26 Agustus
  2026). Warga tidak punya akun. `id` penduduk = kolom **Kode Warga** di Excel.
- **Empat peran** (`ADMIN`/`DUKUH`/`RW`/`RT`) dan akun melekat pada **jabatan**.
  Mengisi jabatan kosong bebas; **mengganti pemegang jabatan terisi wajib lewat
  pengajuan yang disetujui** perangkat desa. Admin mengajukan, tidak pernah
  menyetujui.
- **Istilah "kursi" sudah dicabut** (31 Agustus 2026) — kode & UI memakai
  **jabatan** di mana-mana. Yang tersisa: kolom DB lama diangkat otomatis
  (`db._GANTI_NAMA`), dan spec bertanggal di `docs/superpowers/specs/` sengaja
  TIDAK diedit — itu catatan sejarah, jadi masih berbunyi "kursi".

---

## 1. Tentang Proyek

Web untuk melihat data kependudukan desa. Dipakai **perangkat desa saja** —
warga tidak punya akun.

| Peran     | Hak akses                                                                    |
| --------- | ---------------------------------------------------------------------------- |
| **ADMIN** | Kelola akun pengurus. **Nol akses data warga** — bukan pembatasan simbolis     |
| **DUKUH** | Baca data penduduk & infografis **seluruh padukuhan**                         |
| **RW**    | sama, tapi **warga RW-nya saja** (satu akun per nomor RW)                     |
| **RT**    | sama, tapi **warga RT-nya saja** (satu akun per nomor RT)                     |

Kewenangan ADMIN dan tiga peran lain **berpotongan kosong**: yang memegang
tombol pemberian akses tidak membaca isi datanya, dan yang membaca data tidak
bisa menyentuh akun siapa pun termasuk akunnya sendiri. Baca **dibatasi
wilayah** sejak Tahap 3a — Ketua RT 004 hanya melihat warga RT 004.

Portal publik terbuka tanpa login: `/` (beranda), `/profil`, `/infografis`,
`/berita` + `/berita/:slug`, dan `/statistik` (rincian per RW/RT — dulu di `/`).
Semuanya cacah dan keterangan wilayah saja, tidak pernah data orang.

Desain berlaku, tiga dokumen dan ketiganya masih hidup:
`2026-08-26-hapus-nik-kk-auth-pengurus-design.md` (NIK/KK & warga tanpa akun)
`2026-08-26-empat-peran-pergantian-pengurus-design.md` (peran, jabatan, Kode
Warga, ganti password wajib), dan
`2026-08-26-tahap-2-pengajuan-persetujuan-design.md` (pengajuan, persetujuan,
aturan "kursi kosong dilewati" — istilah lama untuk jabatan kosong), dan
`2026-08-26-tahap-3-wilayah-dan-mutasi-design.md` (batas wilayah — 3a selesai,
mutasi data warga 3b belum).
Spec lama (`2026-08-12-auth-warga-pin-design.md`) disimpan sebagai catatan
alasan — terutama bagian "Rancangan awal yang dibatalkan" yang masih berlaku —
tapi seluruh jalur autentikasi warga di dalamnya **sudah dicabut**.

**Status:** Frontend + backend aktif. Backend (`backend/`) FastAPI dengan data
penduduk di SQLite, diisi dari file Excel pendataan lewat
`backend/app/data/impor_excel.py`.

### Penamaan proyek (jangan ditanya ulang)

| Konteks                                   | Nama                            |
| ----------------------------------------- | ------------------------------- |
| Repo & direktori                          | `NIA-WEB` — **jangan diubah**   |
| Nama package (`frontend/package.json`)    | `nia-web-frontend` — **jangan diubah** |
| Nama produk yang dilihat user             | **SIGALON**                     |
| Judul dokumen, README, UI, FastAPI `title` | **SIGALON** (`title="SIGALON API"`) |

`NIA-WEB` / `nia-web-frontend` sudah tertanam di git history dan lockfile;
menggantinya cuma bikin diff besar tanpa manfaat. Yang penting konsisten adalah
nama yang **dibaca user** — itu selalu SIGALON (berganti dari SIDUK pada
3 September 2026, mengikuti logo yang sudah terpasang).

Kunci `localStorage` berawalan `siduk.`
(ukuran teks) sengaja tidak berganti agar tidak
mengosongkan preferensi pengunjung yang sudah ada. Nama berkas basis data
telah dipisah rapi menjadi `data/sigalon.db` (data kependudukan & administrasi)
dan `data/portal.db` (portal berita & profil publik).

## 2. Tech Stack

| Lapisan     | Teknologi                                                             |
| ----------- | -------------------------------------------------------------------- |
| Frontend    | React 18 + TypeScript + Vite                                         |
| Styling     | Tailwind CSS                                                         |
| Routing     | React Router v6                                                      |
| Server state| TanStack Query (React Query)                                        |
| Auth state  | Zustand                                                              |
| Form        | React Hook Form + Zod                                                |
| Charts      | Recharts                                                             |
| Editor teks | TipTap (StarterKit + Image) — isi berita saja                         |
| Backend     | Python + FastAPI                                                     |
| Database    | SQLite (`sqlite3` stdlib, tanpa ORM) — data penduduk                 |
| Auth        | Sesi server-side (tabel `sesi`) + bcrypt. **Bukan JWT**              |

## 3. Struktur Direktori

```
NIA-WEB/
├── CLAUDE.md                 # dokumen ini
├── frontend/                 # aplikasi React (aktif)
│   └── src/
│       ├── app/              # provider global (React Query, Router)
│       ├── components/
│       │   ├── charts/       # komponen grafik (Distribusi*, StatCard, donut-geometri)
│       │   ├── layout/       # Sidebar, Navbar, DashboardLayout, PublicShell
│       │   └── ui/           # primitif UI reusable (Button, Card, Table, …)
│       ├── config/           # akses env tervalidasi (env.ts)
│       ├── features/         # kode per-domain (lihat §4)
│       │   ├── auth/             # form login & ganti password (sesinya di lib/)
│       │   ├── pengurus/         # jabatan & akun (ADMIN)
│       │   ├── pergantian/       # pengajuan + persetujuan jabatan
│       │   ├── audit/            # riwayat perubahan
│       │   ├── penduduk/         # daftar + filter kategori
│       │   ├── titik-lokasi/     # titik peta + PetaOpenStreetMap
│       │   ├── infografis/       # agregat untuk pengurus (di balik login)
│       │   └── statistik-publik/ # agregat halaman depan (tanpa login)
│       ├── hooks/            # hook lintas fitur (use-auth, use-padukuhan, use-debounce, …)
│       ├── lib/              # klien & util lintas fitur (api-client, auth-store, auth-api,
│       │                     #   token-storage, utils, query-client)
│       ├── pages/            # komponen halaman (route target)
│       ├── routes/           # definisi route, guards, paths
│       ├── styles/           # CSS global + Tailwind
│       └── types/            # tipe lintas fitur (api.ts, auth.ts, statistik.ts)
└── backend/                  # FastAPI (aktif, penduduk di SQLite)
```

**Sesi login tinggal di luar `features/auth`, dan itu disengaja.** `Role`,
`AuthUser`, dan `Session` dibaca `pengurus`, `pergantian`, `penduduk`, guards,
dan menu sidebar — sementara §4 melarang `features/A` mengimpor internal
`features/B`. Jadi tipenya di `types/auth.ts`, penyimpanan sesinya di
`lib/auth-store.ts` + `lib/token-storage.ts` + `lib/auth-api.ts`, dan
`useAuth`/`useLogout` di `hooks/use-auth.ts`. Yang tertinggal di fiturnya cuma
yang memang milik layar login: form, skema Zod, `useLoginPetugas`,
`useGantiPassword`.

## 4. Arsitektur Berbasis Fitur (feature-first)

Setiap domain berdiri sendiri di `src/features/<nama>/` dengan isi standar:

```
features/penduduk/
├── api/            # kontrak (`interface XApi`) + implementasi http
├── components/     # komponen khusus fitur ini
├── hooks/          # React Query hooks (use-penduduk.ts)
├── types.ts        # model domain
├── labels.ts       # peta enum -> teks tampilan
├── view-model.ts   # data mentah -> bentuk siap tampil
└── utils.ts        # helper murni khusus fitur
```

**Aturan arah impor (jangan dilanggar):**

- `features/*` **boleh** impor dari `components/ui`, `lib`, `hooks`, `types`, `config`.
- `features/A` **tidak boleh** impor internal `features/B`. Butuh berbagi? Naikkan ke `lib`/`components`/`types`.
- `components/ui` **tidak boleh** impor dari `features/*` (harus generik).
- `pages/*` merakit `features/*` + `components/*`; jangan taruh logika bisnis berat di sini.

## 5. Lapisan Data — Kontrak API

Backend aktif, jadi tiap fitur mendefinisikan **kontrak API** lalu
menyediakan satu implementasi yang memanggil `apiClient` (axios → FastAPI).
Tidak ada lagi cabang mock/http — mock sudah dicabut sepenuhnya (§11).

```ts
export interface PendudukApi { list(...): Promise<...>; getByNik(...): ...; }

export const pendudukApi: PendudukApi = {
  async list(params) {
    const { data } = await apiClient.get('/penduduk', { params });
    return data;
  },
  // ...
};
```

Komponen tidak pernah memanggil `apiClient` langsung — selalu lewat `pendudukApi`
& React Query hooks di `features/*/hooks/`.

## 6. Konvensi Kode

### Penamaan

- Komponen React & tipe: `PascalCase` (`PendudukDetail`, `AuthUser`).
- Variabel, fungsi, hook: `camelCase` (`formatUmur`, `usePendudukList`).
- File komponen: `PascalCase.tsx`. File non-komponen: `kebab-case.ts` (`use-penduduk.ts`, `api-client.ts`).
- Konstanta modul: `UPPER_SNAKE_CASE` (`PAGE_SIZE`).
- **Istilah domain memakai Bahasa Indonesia** (`penduduk`, `pengurus`, `jenisKelamin`) agar selaras dengan data asli.
  Sebaliknya, **primitif UI tetap Inggris** (`Button`, `Sidebar`, `AccountButton`) — Bahasa Indonesia dipakai
  karena datanya berbahasa Indonesia, bukan sebagai gaya bahasa menyeluruh.
- File view-model **selalu bernama `view-model.ts`** (tanpa prefiks) dan tinggal di folder yang memilikinya:
  di dalam fitur bila logikanya milik satu fitur, atau di folder halaman bila justru di situ dua fitur bertemu
  (lihat `pages/admin/infografis/view-model.ts` — memindahkannya ke dalam fitur akan melanggar aturan impor §4).

### TypeScript

- `strict` menyala. **Dilarang `any`** — pakai `unknown` + penyempitan tipe bila perlu.
- Impor tipe pakai `import type { … }`.
- Enum domain sebagai **union string literal** (`'ISLAM' | 'KRISTEN'`), bukan `enum`. Pasangkan dengan peta label di `labels.ts`.
- Path alias: selalu `@/…` (mis. `@/features/penduduk/hooks/use-penduduk`), hindari `../../../`.

### Komponen

- Fungsi komponen + hooks. Tanpa class component.
- Satu komponen utama per file. Komponen pembantu kecil boleh di file yang sama bila privat.
- Halaman (`pages/*`) memakai `export default`; selain itu **named export**.
- `className` dinamis WAJIB lewat helper `cn()` (`@/lib/utils`), jangan gabung string manual.

### Styling

- Tailwind utility-first. Hindari file CSS terpisah kecuali untuk global (`styles/index.css`).
- Kelas panjang: urutkan otomatis oleh `prettier-plugin-tailwindcss` (jalankan `npm run format`).
- **Warna Tegas & Profesional**: Hindari warna fill samar-samar/pastel kusam (seperti `bg-purple-100`, `bg-slate-100` berlebih). Gunakan warna solid, kontras tinggi, dan rapi.
- **Border**: selalu tulis lebarnya — `border-1` untuk garis halus 1px — atau pakai tombol borderless. Di `tailwind.config.js` sekarang `borderWidth: { DEFAULT: '1px' }`, jadi `border` telanjang **tidak lagi** merender 4px seperti dulu; aturan ini bertahan demi keseragaman, bukan lagi untuk mencegah garis tebal yang tidak disengaja.
- **Konvensi Titik Lokasi (`features/titik-lokasi`)**:
  - Warna semantik terpusat di `features/titik-lokasi/warna.ts` (`dapatkanTemaTitik`):
    - Masjid/Ibadah: Emerald Green (`bg-emerald-600` / `bg-emerald-700` / `text-emerald-600`)
    - Pos Ronda/Keamanan: Cobalt Blue (`bg-blue-600` / `bg-blue-700` / `text-blue-600`)
    - Posyandu/Sosial: Rose Red (`bg-rose-600` / `bg-rose-700` / `text-rose-600`)
    - Balai Padukuhan: Warm Amber (`bg-amber-600` / `text-amber-600`)
    - Perangkat RW: Ocean Cyan (`bg-cyan-700` / `text-cyan-700`)
    - Perangkat RT: Sea Teal (`bg-teal-700` / `text-teal-700`)
    - Kepala Dukuh: Royal Purple (`bg-purple-700` / `text-purple-700`)
    - Pamong/Perangkat Umum: Royal Indigo (`bg-indigo-700` / `text-indigo-700`)
  - Ikon lokasi pada baris daftar ditampilkan langsung (`h-6 w-6`) tanpa padding atau kotak pembungkus.
  - Tombol **Edit**: teks ringkas "Edit", berlatar putih dengan border tipis (`border-1 border-slate-300 bg-white text-slate-800 hover:bg-slate-100`), tidak menggunakan warna hitam atau ungu.
  - Tombol **Hapus** (sampah): berpasangan seimbang dengan `border-1 border-slate-300 bg-white text-rose-600 hover:bg-rose-50` agar tidak timpang secara visual.
- **Konvensi Kelola Berita (`pages/admin/berita`)**:
  - Tombol **Sunting**: Hitam solid (`bg-slate-900 hover:bg-slate-800 text-white font-bold`) dengan ikon `Pencil`.
  - Tombol **Hapus**: Merah solid (`bg-rose-600 hover:bg-rose-700 text-white font-bold`) dengan ikon `Trash2`.


### Data fetching (React Query)

- Semua akses server lewat hook di `features/*/hooks/`, **bukan** `useEffect + fetch`.
- Definisikan **query keys terpusat** per fitur (`pendudukKeys`) untuk caching & invalidasi konsisten.
- Jangan panggil `api-client`/`*Api` langsung dari komponen; bungkus dalam hook.

### Form

- React Hook Form + skema Zod di `features/*/schemas.ts`. Validasi lewat `zodResolver`.
- **Jangan `<input type="date">` untuk tanggal yang diketik orang.** Urutan
  kotaknya (dd/mm vs mm/dd) ikut bahasa browser dan **tidak bisa dipaksa** —
  tidak lewat atribut, CSS, maupun `lang`. Akibatnya isian diam-diam terbaca
  jadi tanggal lain. Pakai tiga kolom Tgl / Bulan (nama, bukan angka) / Tahun,
  disatukan jadi ISO lewat `keTanggalLahirIso()` di `lib/tanggal.ts`. Dipakai
  form data warga (`features/penduduk/components/WargaFormDialog.tsx`).

### Error

- Error API dinormalisasi menjadi `ApiError` (`@/types/api`) oleh interceptor axios.
- Di UI, tampilkan pesan ramah (komponen `Alert`), jangan `alert()` / `console.log` untuk user.

## 7. Autentikasi & Otorisasi

**Model auth (lihat
`docs/superpowers/specs/2026-08-26-hapus-nik-kk-auth-pengurus-design.md`
untuk alasan lengkapnya):**

- **Warga tidak punya akun.** Tidak ada login warga, PIN, aktivasi, maupun
  halaman kontak. Dicabut 26 Agustus 2026 bersama NIK & No. KK — jangan
  dihidupkan lagi tanpa keputusan eksplisit.
- **Perangkat desa** masuk di `/login` dengan username + password. Empat peran:
  `ADMIN` (kelola akun, buta data warga) dan `DUKUH`/`RW`/`RT` (baca data
  warga, tidak bisa menyentuh akun).
- **Akun pengurus tinggal di SQLite** (tabel `pengurus`), ditambah &
  dinonaktifkan ADMIN saat runtime lewat `/admin/pengurus`. Akun ADMIN pertama
  dibuat `pengurus.bootstrap()` dari `ADMIN_USERNAME`/`ADMIN_PASSWORD`; **DB
  kosong tanpa dua env itu = backend menolak jalan**, bukan memakai default.
- **Akun pengurus tidak punya masa berlaku.** Satu-satunya mekanisme siklus
  hidupnya kolom boolean `aktif`; tidak ada tanggal dan tidak ada perbandingan
  waktu di mana pun. Konsekuensinya diterima sadar: akun pengurus lama tetap
  bisa masuk sampai ada yang menonaktifkannya manual. Penggantinya prosedur
  di `docs/PROSEDUR-PENGURUS.md`, bukan kode.
- **Tiga dependency, jangan tertukar:** `current_user` (siapa pun yang masuk —
  dipakai hanya oleh ganti password), `current_pengurus` (`DUKUH`/`RW`/`RT`,
  menolak ADMIN), `current_admin` (ADMIN saja).
- **Akun melekat pada jabatan.** Daftar jabatan diturunkan dari alamat warga
  (`pengurus.daftar_jabatan`), bukan disimpan di tabel kedua. Satu jabatan hanya
  boleh dipegang satu akun **aktif** — akun nonaktif pemegang lama tetap
  tersimpan pada jabatan yang sama, jadi keunikannya diperiksa di kode, bukan
  lewat `UNIQUE` di SQL.
- **Dua nama, jangan tertukar:** `kode` (`RT:019/001`, dari
  `pengurus.kode_jabatan_dari()`) adalah kuncinya; `jabatan`/`label`
  ("Ketua RT 001", dari `pengurus.jabatan_dari()`) yang dibaca orang. Yang
  ketiga: `Penduduk.jabatan` (`WARGA`/`DUKUH`/`RW`/`RT`) adalah cerminan kolom
  "Jabatan" di Excel — bukan salah satu dari dua di atas.
- **Password awal dari Admin sekali pakai.** Kolom `harus_ganti_password`:
  selama menyala, login berhasil tapi `current_pengurus`/`current_admin`
  menolak 403. Reset oleh Admin menyalakannya lagi.
- **`jabatan` tidak disimpan** — diturunkan dari `role` + `rw` + `rt`
  (`pengurus.jabatan_dari`). Menyimpannya berarti dua sumber kebenaran yang
  bisa berbeda diam-diam. `kode_jabatan_dari()` memakai RW **dan** RT
  sekaligus: nomor RT cuma unik di dalam RW-nya.
- **Status `aktif` diperiksa tiap request**, bersama pencarian sesinya. Dua
  query per request, dan itu yang membuat pencabutan berlaku seketika.
- **Tidak ada OTP, SMS, WhatsApp, atau email di jalur autentikasi.** Syarat nol
  biaya bersifat mutlak. Password baru disampaikan tatap muka; itu satu-satunya
  jalur, dan disengaja.
- **Rate limit login: per username saja**, 5 gagal per 15 menit. Batas per-IP
  sempat ada lalu **dicabut**: satu jaringan balai desa dipakai banyak pengurus
  sekaligus, jadi menghitung per IP berarti beberapa orang yang masing-masing
  salah ketik sekali bisa mengunci seluruh ruangan. Konsekuensi yang diterima
  sadar: penebakan yang berpindah-pindah username dari satu tempat tidak
  tertahan. Hitungannya di memori proses (`ponytail:` di
  `app/core/ratelimit.py`).
- **Sesi tersimpan di server** (tabel `sesi`, `app/data/sesi.py`), bukan JWT.
  Token cuma nomor acak tanpa arti; yang menentukan sah atau tidak adalah
  ADANYA baris di tabel. Akibatnya "Keluar" benar-benar mencabut, ganti
  password memutus sesi lain milik akun itu, dan reset oleh Admin mencabut
  seluruh sesinya. Tidak ada `JWT_SECRET` lagi — tidak ada yang ditandatangani,
  jadi tidak ada rahasia yang bisa salah dipasang. `pyjwt` ikut dicabut dari
  `requirements.txt`.

**Mekanik:**

- Sesi (token + user) disimpan Zustand (`lib/auth-store.ts`) & di-persist ke `localStorage` (`lib/token-storage.ts`).
- Proteksi route lewat guard di `routes/guards.tsx`:
  - `RequireAuth` — wajib login.
  - `RequireRole roles={[...]}` — menerima **daftar** peran, bukan satu.
  - `RequireGantiPassword` — alihkan ke `/ganti-password` selagi penandanya
    menyala.
  - `RedirectIfAuthenticated` — halaman login menolak user yang sudah masuk.
- Menu sidebar mengikuti role via `navItemsForRole()` — **selalu perbarui ini saat menambah halaman**.
- `homePathForRole()`: ADMIN mendarat di `/admin/pengurus`, sisanya di
  `/admin/penduduk`. ADMIN punya empat halaman — kelola akun, kelola berita,
  profil padukuhan, riwayat — dan nol halaman data warga.

> Keamanan sebenarnya WAJIB ditegakkan di backend (FastAPI). Guard frontend hanya UX.

## 8. Environment Variables

- Hanya variabel berprefix `VITE_` yang terbaca di client.
- **Jangan** baca `import.meta.env.*` langsung; akses via `@/config/env`.
- **Tidak ada `.env.example` di mana pun.** Kedua sisi memakai pola yang sama:
  `start.sh` membuatkan kerangka `.env` kalau belum ada, lalu dokumentasi
  variabelnya tinggal di `README.md` masing-masing.
- Frontend: `frontend/start.sh` membuatkan `.env` dengan **nilai bawaan yang
  langsung bisa jalan** (tidak ada rahasia wajib). Kunci utama
  `VITE_API_BASE_URL` (default `/api`, diproksikan Vite ke `localhost:8000`).
  Daftar variabelnya didokumentasikan di `frontend/README.md`.
- Backend: `backend/start.sh` membuatkan `.env` dengan **nilai kosong** untuk
  `ADMIN_USERNAME`/`ADMIN_PASSWORD`, lalu skripnya berhenti sampai keduanya
  diisi. Contoh yang berisi password yang berlaku terlalu mudah tersalin
  diam-diam jadi password sungguhan. Daftar variabelnya didokumentasikan di
  `backend/README.md`.

## 9. Perintah

Dari `frontend/`:

```bash
npm install        # sekali di awal
npm run dev        # dev server (http://localhost:5173)
npm run build      # typecheck + build produksi
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run format     # Prettier — mengubah file, jadi typecheck/lint lagi sesudahnya
```

Dari `backend/` — **selalu `.venv/bin/python`**, `python3` sistem tidak punya
dependensinya:

```bash
./start.sh                              # berhenti dengan petunjuk kalau .env belum ada
.venv/bin/uvicorn app.main:app --reload --port 8000
.venv/bin/python -m app.data.db         # self-check SQLite (skema + impor menimpa)
.venv/bin/python -m app.data.agregat    # self-check kelompok umur & distribusi
DATABASE_PATH=/tmp/uji.db .venv/bin/python -m app.data.pengurus   # self-check kelola akun
DATABASE_PATH=/tmp/uji.db .venv/bin/python -m app.data.sesi       # self-check sesi login
.venv/bin/python -m app.schemas.berita  # self-check penyaring HTML berita
DATABASE_PATH=/tmp/uji.db .venv/bin/python -m app.data.padukuhan  # self-check profil padukuhan
.venv/bin/python -m app.core.ratelimit  # self-check batas percobaan login
.venv/bin/python -m app.data.impor_excel ../docs/data-penduduk-contoh.xlsx   # isi data (MENIMPA)
```

**Sebelum menganggap tugas selesai:** `npm run typecheck` **dan** `npm run lint`
harus bersih (0 error), `npm run build` sukses, dan self-check backend di atas
lolos bila menyentuh lapisan data — termasuk `app.schemas.berita` bila menyentuh
isi berita, karena di situlah batas kepercayaan HTML-nya.

### Menguji — perkakasnya terbatas, ini yang jalan

- **`fastapi.testclient` tidak bisa dipakai:** `httpx` tidak ada di
  `requirements.txt`. Uji ujung-ke-ujung dengan menjalankan uvicorn di port
  lain + `DATABASE_PATH` sementara, lalu panggil pakai `urllib` stdlib.
- **Frontend tidak punya test runner.** Untuk memeriksa satu modul murni:
  `node --experimental-strip-types <file>.ts` dari `frontend/` — Node 22 bisa
  mengimpor `.ts` langsung, tanpa memasang apa pun.
- **Akun pengurus untuk uji dibuat sendiri**, tidak ada yang di-seed:
  `DATABASE_PATH=/tmp/uji.db ADMIN_USERNAME=dukuh ADMIN_PASSWORD=rahasia123`
  saat menjalankan uvicorn — `bootstrap()` membuat akun ADMIN pertama, dan
  backend menolak jalan kalau dua env itu kosong pada DB kosong.
- **`id` penduduk dibaca dari DB**, bukan dari log startup:
  `SELECT id, nama FROM penduduk ORDER BY rowid LIMIT 2`. `print()` di startup
  ter-buffer begitu stdout dipipe ke file, jadi sering belum muncul saat dibaca.
- **Jangan `pkill -f "uvicorn …"`** untuk mematikan server latar: polanya
  cocok dengan baris perintah shell yang sedang menjalankannya, jadi shell-nya
  ikut mati dan output perintah berikutnya hilang. Simpan PID-nya
  (`echo $! > /tmp/pid`) lalu `kill "$(cat /tmp/pid)"`.

## 10. Menambah Fitur / Halaman Baru (checklist)

1. Buat folder `features/<nama>/` (types, api, hooks, components).
2. Definisikan kontrak API (`interface XApi`) + implementasi yang memanggil `apiClient`.
3. Tambah query keys + hook React Query di `features/<nama>/hooks/`.
4. Buat halaman di `pages/…`, rakit dari komponen fitur.
5. Daftarkan path di `routes/paths.ts`, route di `routes/AppRoutes.tsx` (bungkus guard yang sesuai), dan lazy-load halamannya.
6. Tambah item menu di `components/layout/nav-config.ts` bila perlu.
7. Jalankan `npm run typecheck && npm run lint && npm run build`.

## 11. Backend (FastAPI) — aktif, penduduk di SQLite

Struktur saat ini (lihat `backend/README.md` untuk cara menjalankan):

```
backend/
├── app/
│   ├── main.py            # entrypoint FastAPI, CORS, exception handler, bootstrap
│   ├── core/              # security (JWT/bcrypt), ratelimit, audit log (di DB)
│   ├── api/routers/       # auth, penduduk, pengurus, pergantian, audit, publik, infografis
│   ├── schemas/           # Pydantic — cerminan tipe frontend, harus sinkron manual
│   └── data/              # db.py (SQLite) + store.py (cache penduduk, dibaca router)
│                          # + pengurus.py (akun & jabatan) + sesi.py (sesi login)
│                          # + pergantian.py (usulan)
│                          # + agregat.py
│                          # + impor_excel.py (isi tabel dari Excel)
├── data/sigalon.db        # data kependudukan & akun (di-gitignore — jangan di-commit)
├── data/portal.db         # portal berita & profil publik (di-gitignore — jangan di-commit)
└── requirements.txt
```

**Database: SQLite — keputusan final, bukan salah satu opsi.** Postgres/DBeaver
sudah tidak dipertimbangkan lagi: satu file `.db` yang gampang di-backup, nol
server buat dipasang dan dirawat setelah KKN. Jangan mengusulkan Postgres balik
tanpa keputusan eksplisit.

**File `.db` TIDAK ikut repo** dan itu tidak bisa ditawar: begitu isinya data
warga sungguhan, satu commit menaruh data kependudukan sedesa di git history
permanen, dan git history tidak bisa dibersihkan setengah-setengah. Sudah
dikunci di `backend/.gitignore` (`data/`, `*.db`). Backup-nya salin file, bukan
commit.

**Kolom baru dipasang lewat `db._TAMBALAN`**, bukan dengan menghapus file
`.db`: `CREATE TABLE IF NOT EXISTS` tidak menyentuh tabel yang sudah ada, dan
menghapus filenya berarti membuang seluruh akun di dalamnya. Ditandai
`ponytail:` — daftar tempel seadanya, cukup untuk kolom nullable, dan bukan
pengganti perkakas migrasi kalau nanti ada perubahan yang lebih berat.

**Kolom yang BERGANTI NAMA lewat `db._GANTI_NAMA`** (+ `_INDEKS_USANG` untuk
indeks yang ditinggalkannya). Jalan **sebelum** `SKEMA` dieksekusi — skema baru
memasang indeks di atas nama kolom yang baru, dan itu gagal selama kolomnya
masih bernama lama. Diuji beneran di `db._check_migrasi_jabatan()`: tabel
`pengajuan` riwayat permanen, jadi migrasi yang salah menghapus catatan yang
tidak bisa dibuat ulang.

**Akses SQL cuma di `app/data/db.py`** — `sqlite3` stdlib, lima tabel:
`penduduk` (dengan `Alamat` diratakan jadi kolom `alamat_*`), `pengurus`, serta
`pengajuan` + `persetujuan` (riwayat perpindahan jabatan, tidak pernah
dihapus), serta `mutasi` (buku perubahan `statusKependudukan`, juga tidak
pernah dihapus).
Tabel `pengurus` dibaca lewat koneksi sekali pakai per operasi (`db.koneksi`,
dibungkus `app/data/pengurus.py`), **bukan** lewat cache `store.py` — tabelnya
ditulis saat runtime, jadi cache impor-sekali itu akan basi. Tanpa ORM: query
yang ada muat di satu layar, dan SQLAlchemy cuma menambah dependensi yang harus
dirawat orang lain setelah KKN. **Tidak ada `models/` atau `services/`** —
skema Pydantic di `app/schemas/` sudah merangkap model.

**Batas wilayah ditegakkan di satu tempat:** `store.penduduk_untuk(user)`,
dipanggil SETIAP endpoint baca. Router tidak pernah menyaring sendiri — satu
endpoint yang lupa jadi lubang yang tidak kelihatan. Aturannya dipinjam dari
`pengurus.cocok_wilayah`, predikat yang sama yang menentukan siapa boleh
memegang sebuah jabatan. `GET /penduduk/{id}` menjawab **404, bukan 403**, untuk
warga di luar wilayah: 403 memberi tahu bahwa orangnya ada.

`app/data/store.py` **tidak lagi menyimpan cache**. Konstanta `DAFTAR_PENDUDUK`
dicabut di Tahap 3a dan diganti `semua_penduduk()` + `penduduk_untuk(user)`,
yang query database tiap dipanggil. Ditandai `ponytail:` — pindahkan
penyaringannya ke `WHERE` di SQL kalau datanya nanti puluhan ribu baris.

**Aplikasi adalah sumber kebenaran data warga sejak Tahap 3b**, bukan Excel.
Pengurus mengubah & menambah lewat `POST`/`PATCH /penduduk`; `impor_excel`
dipakai untuk mengisi pertama kali dan **menolak jalan kalau tabel sudah
berisi**, kecuali diberi `--timpa-semua` yang harus diketik penuh.

**Izinnya dua lapis.** `store.penduduk_untuk` menentukan warga MANA yang boleh
disentuh; di dalam `store.ubah_warga` ada lapis kedua per kolom: **mengubah
RT/RW hanya boleh Dukuh.** Kalau Ketua RT boleh, ia bisa memindahkan orang
keluar dari wilayahnya sendiri lalu tidak bisa lagi membatalkannya. Menambah
warga ikut aturan yang sama — kalau tidak, menambah jadi jalan memutar untuk
memindahkan.

**Tidak ada penghapusan warga lewat API.** Pindah/meninggal ditandai lewat
`statusKependudukan`; `deletedAt` hanya bisa disetel lewat SQL langsung.

**Kolom "Jabatan" di Excel (`WARGA`/`DUKUH`/`RW`/`RT`) dibaca HANYA untuk
jabatan yang masih kosong** (`pengurus.daftar_jabatan` mengisi `Jabatan.calon`).
Begitu sebuah jabatan ada pemegangnya, kolom itu diabaikan — kalau tidak, satu impor
Excel yang belum diperbarui bisa membatalkan pergantian yang sudah disetujui
Dukuh dan para Ketua RW. Kolom ini **bukan** penentu kewenangan; yang
menentukan tetap akun di tabel `pengurus`. Dua orang ditandai memegang jabatan
yang sama menghentikan impor.

**Statistik bulan lampau dihitung dengan MEMUTAR MUNDUR, bukan disimpan.**
Tabel `penduduk` cuma tahu keadaan sekarang; tabel `mutasi` mencatat tiap
perubahan `statusKependudukan` (plus satu baris saat warga baru masuk,
`dari IS NULL`). `store.penduduk_pada(periode)` mengambil keadaan hari ini lalu
membatalkan tiap mutasi yang terjadi sesudah bulan itu. Yang menulis cuma
`store.ubah_warga` & `store.tambah_warga` — impor Excel TIDAK menulis mutasi,
ia mengisi keadaan awal. Batas bulannya dihitung di **WIB**
(`store.WIB`), yang tersimpan tetap UTC: pukul 00:00–07:00 tanggal 1 masih
tanggal 30/31 di UTC, dan tanpa itu pemakai pagi hari melihat bulan lalu
ditawarkan sebagai "bulan ini". Riwayatnya mulai kosong dan tidak bisa diisi
mundur — file Excel pendataan tidak punya kolom status kependudukan sama
sekali. `periodeTerawal` di respons statistik yang membatasi pilihan bulan di
frontend. Spec: `docs/superpowers/specs/2026-09-01-periode-riwayat-mutasi-design.md`.

**`id` penduduk = kolom "Kode Warga" di Excel**, bukan UUID. Kunci yang dijaga
manusia adalah satu-satunya yang bertahan melewati impor yang menimpa, dan
Tahap 2 mengharuskan jabatan pengurus menunjuk warga tertentu. Kode ganda atau
kosong **menghentikan impor sebelum satu baris pun ditulis** — dua warga
bertukar kode berarti dua orang bertukar jabatan tanpa ada yang menyadarinya.

Kontrak endpoint yang **sudah diimplementasikan** (bentuknya sinkron dengan
`*Api` frontend):

| Method | Path                             | Untuk                                                  |
| ------ | -------------------------------- | ------------------------------------------------------ |
| POST   | `/auth/login`                    | pengurus: username + password → `{ token, user }`      |
| POST   | `/auth/logout`                   | —                                                      |
| POST   | `/auth/ganti-password`           | ganti password sendiri; satu-satunya pintu yang terbuka selagi `harusGantiPassword` menyala |
| GET    | `/penduduk`                      | daftar: `page`, `pageSize`, `search` (nama/Kode Warga) + 14 filter + `sortBy`/`sortOrder` |
| GET    | `/penduduk/filter-opsi`          | pilihan RT / RW / pekerjaan dari isi data              |
| GET    | `/penduduk/{id}`                 | detail satu warga (404 kalau di luar wilayah)           |
| POST   | `/penduduk`                      | tambah warga di wilayah sendiri — PENGURUS              |
| PATCH  | `/penduduk/{id}`                 | ubah data warga; RT/RW hanya Dukuh — PENGURUS           |
| GET    | `/infografis`                    | agregat lengkap — semua pengurus                        |
| GET    | `/publik/statistik`              | cacah per RW + cacah kepala keluarga + 10 pekerjaan terbanyak; `?periode=YYYY-MM` memutar mundur ke bulan itu — **tanpa auth** |
| GET    | `/publik/struktur-organisasi`    | bagan Dukuh/RW/RT + nama pemegang jabatan aktif — **tanpa auth** |
| GET    | `/publik/berita`                 | semua berita, terbaru dulu — **tanpa auth**            |
| GET    | `/publik/berita/{slug}`          | satu berita menurut slug — **tanpa auth**              |
| POST   | `/berita`                        | terbitkan berita — ADMIN                                |
| PATCH  | `/berita/{id}`                   | ganti seluruh isi satu berita — ADMIN                   |
| DELETE | `/berita/{id}`                   | hapus berita — ADMIN                                    |
| GET    | `/publik/padukuhan`              | keterangan padukuhan; `null` kalau belum diisi — **tanpa auth** |
| PATCH  | `/padukuhan`                     | ubah keterangan padukuhan — ADMIN                       |
| GET    | `/pengurus`                      | daftar **jabatan** (terisi & kosong) — ADMIN            |
| GET    | `/pengurus/warga`                | cari warga buat dropdown (nama + RT/RW saja) — ADMIN    |
| POST   | `/pengurus`                      | isi satu jabatan **kosong** — ADMIN                     |
| POST   | `/pengurus/{id}/reset-password`  | ganti password akun — ADMIN                             |
| GET    | `/pergantian`                    | riwayat pengajuan — ADMIN                               |
| POST   | `/pergantian`                    | ajukan pergantian jabatan **terisi** — ADMIN            |
| GET    | `/pergantian/menunggu`           | pengajuan yang menunggu jawaban saya — PENGURUS         |
| POST   | `/pergantian/{id}/jawab`         | satu suara, tidak bisa diubah — PENGURUS                |
| GET    | `/audit`                         | riwayat: data warga se-wilayah (PENGURUS) / kelola akun (ADMIN) |

Filter `GET /penduduk` (semua opsional, digabung AND, disaring di memori oleh
`penduduk.saring`): `jenisKelamin`, `agama`, `golonganDarah`, `pendidikan`,
`statusPerkawinan`, `statusHubunganKeluarga`, `statusKependudukan`,
`statusDomisili`, `pekerjaan`, `rt`, `rw`, `kelompokUmur`, `bansos`, dan
`search`. Ditambah `sortBy` (`nama`/`umur`/`tanggalLahir`/`rt`/`rw`/`id`)
dengan `sortOrder` (`asc`/`desc`). `GET /penduduk/ekspor` menerima daftar
filter yang sama persis, minus paginasi dan pengurutan.

**Satu orang satu jabatan**, diperiksa lewat kolom `pengurus.warga_id` (Kode
Warga pemegang jabatan) — bukan lewat nama, karena dua orang yang benar-benar
senama akan saling menghalangi. `NULL` untuk akun ADMIN, yang memang bukan
warga.

**Kandidat wajib warga wilayah jabatannya** — Ketua RT dari RT itu, Ketua RW dari
RW itu, Dukuh dari mana pun (`pengurus.cocok_wilayah`). Ditegakkan di dua jalur
sekaligus: mengisi jabatan kosong dan mengajukan pergantian. `POST /pengurus`
menerima `wargaId`, **bukan** `nama` — nama dari klien tidak bisa diperiksa,
Kode Warga bisa.

**Admin memilih warga lewat `GET /pengurus/warga`, bukan mengetik namanya.** Ia
buta terhadap data kependudukan, jadi tidak punya cara tahu nama siapa yang
benar. Endpoint itu satu-satunya celahnya — nama + RT/RW saja, minimal 2 huruf,
maksimal 20 hasil, dan bisa dipersempit ke satu jabatan lewat `?jabatanKode=`
— dipakai dua tempat: mengisi jabatan kosong dan memilih
kandidat pergantian. Klien bersamanya di `lib/warga-api.ts` +
`hooks/use-cari-warga.ts` + `components/ui/PilihWarga.tsx`, bukan di dalam
salah satu fitur (§4).

**Rute statis ditulis sebelum rute ber-parameter** — `/penduduk/filter-opsi`
harus di atas `/penduduk/{id}`, kalau tidak ia terbaca sebagai sebuah id.

**Ditegakkan backend** (guard frontend hanya UX):

- ✅ `/publik/statistik` hanya mengembalikan cacah. Tidak ada nama maupun
  alamat — endpoint ini terbuka untuk siapa saja, jadi apa pun yang
  ditambahkan ke sana otomatis menjadi konsumsi publik. `totalKepalaKeluarga`
  turunan `statusHubunganKeluarga` (nomor KK sendiri tidak didata), dan
  `perPekerjaan` dipotong 10 teratas karena isinya teks bebas.
- ✅ Seluruh endpoint penduduk & infografis butuh sesi pengurus.
- ✅ Password disimpan sebagai hash (`bcrypt`, `app/core/security.py`), tidak
  pernah polos.
- ✅ Login menolak akun `aktif = 0` dengan pesan yang dibedakan dari salah
  password, dan `current_user` memeriksa `aktif` tiap request — token lama akun
  nonaktif ikut tertolak.
- ✅ `/pengurus/*` hanya ADMIN (`dependencies=[Depends(current_admin)]` di
  level router), dicatat di log audit.
- ✅ ADMIN ditolak di seluruh endpoint data warga (`current_pengurus`), bukan
  sekadar disembunyikan menunya.
- ✅ Akun yang belum mengganti password awal ditolak 403 di mana pun kecuali
  `/auth/ganti-password`; password baru wajib berbeda dari yang lama.
- ✅ **Tidak ada cara mengosongkan jabatan lewat API.** `PATCH /pengurus`
  dicabut: kalau Admin bisa mengosongkannya sendiri, ia bisa mengisinya
  langsung dan seluruh mekanisme persetujuan bisa dilewati dalam dua klik.
- ✅ Admin ditolak `current_pengurus` di `/pergantian/menunggu` dan
  `/pergantian/{id}/jawab` — ia mengajukan dan melihat, tidak pernah
  menyetujui.
- ✅ Penyetuju hanya menerima pengajuan yang ditujukan kepadanya; yang lain
  memang tidak ikut dikembalikan, bukan disembunyikan di layar.
- ✅ Backend menolak jalan kalau tabel `pengurus` kosong tapi
  `ADMIN_USERNAME`/`ADMIN_PASSWORD` belum diisi.
- ✅ Riwayat perubahan mengikuti kewenangan, dan tumpangnya **satu arah**
  (3 September 2026): PENGURUS melihat riwayat data warga **di wilayahnya**
  DITAMBAH seluruh aksi Admin (`AKSI_AKUN`: kelola akun + isi portal) — aman,
  karena aksi Admin tidak memuat data warga, dan hasilnya pengurus mengawasi
  Admin. ADMIN tetap **tidak pernah** melihat `AKSI_WARGA`: barisnya membawa
  nama orang beserta perubahannya (`… · AKTIF → MENINGGAL`), jadi membukanya
  membatalkan "Admin nol akses data warga" lewat pintu belakang. Arah itu
  ditutup sengaja, bukan karena belum sempat.
- ✅ `deletedAt` (salah input) disaring di `store.semua_penduduk`, satu tempat.
  `PINDAH`/`MENINGGAL` dikeluarkan dari **hitungan** oleh `store.hanya_aktif`,
  dipanggil di jalur statistik saja — daftar penduduk tetap menampilkannya,
  kalau tidak penandaan yang keliru tidak bisa dibatalkan.

**Berita padukuhan tersimpan di SQLite** (tabel `berita`,
`app/data/berita.py`) sejak 3 September 2026 — sebelumnya `localStorage`, yang
artinya tulisan pengurus tidak pernah sampai ke pengunjung mana pun. CMS-nya
`/admin/berita`, **ADMIN saja** (berubah dari DUKUH pada tanggal yang sama:
berita adalah isi portal, dan isi portal kewenangan Admin — bukan data warga,
jadi memberikannya tidak membuka apa pun tentang penduduk). Membaca lewat
`/publik/berita*` tanpa auth; menulis, menyunting, menghapus lewat `/berita*`
dengan `current_admin` + log audit.

**`berita.isi` berisi HTML, dan HTML dari klien tidak dipercaya.** Editornya
TipTap (`features/berita/components/EditorIsiBerita.tsx`): tebal, miring, garis
bawah, judul h2/h3, daftar, kutipan, dan **foto yang bisa diletakkan di tengah
tulisan**. Penyaringan terjadi **sekali, saat menyimpan**, di `bersihkan_html()`
(`app/schemas/berita.py`, memakai `nh3`) — bukan saat menampilkan: halaman
publik memasangnya lewat `dangerouslySetInnerHTML`, jadi yang tersimpan harus
sudah bersih dan tidak ada jalur baca yang bisa lupa menyaring. Daftar tombol
editor sengaja tidak melampaui daftar putih di server. **Tidak ada tombol
tautan** dan `<a>` tidak diizinkan: mengizinkannya berarti melonggarkan skema
URL yang boleh lewat, sementara `data:` harus tetap terbuka untuk foto sisipan.
Panjang minimal 20 huruf diukur dari **teksnya**, bukan HTML-nya — kalau tidak,
satu foto base64 meloloskan berita tanpa satu kata pun. Gaya tampilannya satu
kelas `.isi-berita` di `styles/index.css`, dipakai kotak editor DAN halaman
publik: itu yang membuat "yang ditulis = yang terbit" benar-benar berlaku.

**Foto berita disimpan utuh sebagai data URL**, bukan berkas di disk — foto
sampul di kolom `berita.foto`, foto sisipan ikut di dalam `berita.isi`: hapus berita = hapus satu baris tanpa berkas yatim, backup tetap
menyalin satu file `.db`, dan tidak ada direktori unggahan yang izinnya harus
dijaga. Dibatasi 600 KB per berkas di `FotoBeritaField` dan 900.000 karakter di
`schemas/berita.py` (base64 membengkak ±33%). Ditandai `ponytail:` — `daftar()`
mengirim seluruh foto sekaligus, jadi pindahkan ke berkas + StaticFiles begitu
beritanya puluhan. **Berita BOLEH dihapus lewat API**, beda dari warga dan akun:
yang ini isi situs, bukan catatan kependudukan.

**Footer publik** (`components/layout/PublicShell.tsx`) punya dua bagian
tambahan di luar footer statis biasa:
- **Tombol Aksesibilitas** (`AksesibilitasWidget.tsx`) — murni klien, menskalakan
  `font-size` akar dokumen (100/115/130%), tersimpan `localStorage`. Tidak ada
  toggle kontras; tambahkan kalau memang diminta.
- **Tombol Pengaduan** (`TombolPengaduan.tsx`) — `mailto:` ke `PADUKUHAN.email`,
  bukan formulir dengan penyimpanan sendiri. Formulir pengaduan sungguhan (perlu
  backend + moderasi) belum punya spesifikasi.

Kontak (`PADUKUHAN.telepon`/`.email` di `lib/padukuhan.ts`) sudah data asli dari
desa — bukan placeholder seperti nama di bagan organisasi.

**Fitur bantuan sosial AKTIF dan terpasang penuh** — kolom `penduduk.bansos`
(TEXT, dipisah koma), dibaca `impor_excel` dengan mendeteksi kolom ber-label
"bansos" secara dinamis, disunting lewat centang BPNT/PKH di form warga, bisa
disaring (`?bansos=`), ikut terekspor, dan diagregasikan jadi panel
"Distribusi Program Bantuan Sosial" di `/infografis` (pengurus & publik) serta
`/statistik`. Tagnya tidak dikunci ke BPNT/PKH: penyaringan mencocokkan tag apa
pun yang ada di data, walau agregasinya masih menghitung BPNT/PKH/keduanya.

**Keterangan padukuhan (nama wilayah, luas, kontak, sejarah, batas) tinggal di
tabel `padukuhan`** sejak 3 September 2026, disunting ADMIN di `/admin/profil`
(`GET /publik/padukuhan` tanpa auth, `PATCH /padukuhan` untuk ADMIN). Sebelumnya
konstanta, yang berarti mengganti nomor telepon balai padukuhan menuntut deploy
ulang.

**Barisnya boleh tidak ada, dan nilai bawaannya cuma di frontend**
(`PADUKUHAN_BAWAAN` di `lib/padukuhan.ts`): selama Admin belum pernah menyimpan,
endpointnya menjawab `null` dan frontend memakai bawaannya. Server tidak
menyimpan nilai awal apa pun — dua daftar nilai bawaan dalam dua bahasa pasti
berbeda diam-diam suatu saat. Bacanya **selalu** lewat `usePadukuhan()`
(`hooks/use-padukuhan.ts` + `lib/padukuhan-api.ts`, pola yang sama dengan
`warga-api.ts` di §4); mengimpor `PADUKUHAN_BAWAAN` langsung berarti halaman itu
memperlihatkan nilai bawaan selamanya. Hook-nya tidak pernah `undefined` dan
tidak punya keadaan memuat — kaki halaman & judul hero harus punya tulisan sejak
render pertama.

**Koordinat & radius peta TETAP konstanta** (`PETA` di `lib/padukuhan.ts`): itu
setelan tampilan peta yang perubahannya harus dilihat hasilnya, bukan data yang
dirawat perangkat desa.

**Bagan struktur organisasi (`/profil`) HIDUP, bukan konstanta** — keputusan
31 Agustus 2026, membalik keputusan sebelumnya di paragraf yang sama. Dukuh &
Ketua RW/RT dibaca `GET /publik/struktur-organisasi`
(`app/api/routers/publik.py`), yang membangun ulang dari
`pengurus.daftar_jabatan()` — SUMBER YANG SAMA dipakai halaman kelola akun
Admin. Begitu Admin isi jabatan atau pergantian disetujui
(`app/api/routers/pergantian.py`), bagan publik ikut berubah tanpa deploy
ulang; jabatan tanpa akun aktif tampil `nama: null`, ditandai "Belum diisi" di
frontend (`pages/publik/profil/components/BaganOrganisasi.tsx`), BUKAN
disembunyikan atau diisi karangan.

RW/RT yang muncul mengikuti alamat warga AKTIF di data penduduk — bukan
daftar tetap. **Kalau tabel `penduduk` masih kosong, bagan kosong total**
(cuma Dukuh "Belum diisi" tanpa RW/RT sama sekali); isinya baru muncul setelah
`impor_excel` dijalankan.

**LPM tetap konstanta manual** (`LPM` di `lib/padukuhan.ts`) — Ketua LPM
BUKAN salah satu dari empat peran akun (ADMIN/DUKUH/RW/RT), jadi tidak punya
baris di tabel `pengurus` dan tidak ikut sistem ganti-jabatan yang disetujui.
Ganti nilainya langsung di kode kalau ketuanya berganti. Di bagan LPM
digambar dengan garis putus-putus (koordinasi) ke Dukuh, bukan garis lurus
(komando) seperti RW/RT — LPM bukan atasan wilayah mana pun.

Skema respons publiknya (`StrukturOrganisasiPublik`/`RwPublik`/
`JabatanWilayahPublik` di `app/schemas/pengurus.py`) SENGAJA lebih ramping
dari `JabatanOut` yang dipakai Admin: tidak ada username, id, atau status
akun — cuma nomor wilayah + nama, karena endpoint ini terbuka tanpa auth.

**Utang yang masih terbuka** — tercatat di spec 2026-08-26, jangan dianggap
kondisi final:

<!-- antislop:start -->
## antislop

Untuk kerja UI, copy, aksesibilitas, layout mobile, atau komentar kode: muat
skill `antislop` (core) lewat tool Skill, lalu skill yang relevan dengan
tugasnya:

- UI / visual: `antislop-ui`
- Copy & teks: `antislop-copywriting`
- Aksesibilitas (people): `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Komentar kode: `antislop-code`

Skill-skill ini terpasang global (bukan file di repo ini), dipanggil lewat
namanya. **Mode: SELAMA proses kerja** — diterapkan sambil menulis kode, tanpa
perlu tanya ulang di tiap sesi baru, bukan audit setelah selesai.

Arahan desain (`DESIGN.md`, dibutuhkan R-37) belum ada — lihat status
terbarunya di `DESIGN.md` bila sudah dibuat.
<!-- antislop:end -->

