# Landing Publik: Statistik Padukuhan + Form Masuk

**Tanggal:** 2026-08-13
**Status:** diimplementasikan (revisi kedua — lihat catatan di bawah)

## Masalah

Halaman `/login` sekarang hanya berisi form masuk dengan panel brand kosong di
sebelah kiri — separuh layar terpakai untuk dekorasi. Warga yang membuka portal
tidak mendapat apa pun sebelum berhasil masuk.

Padukuhan ingin halaman pertama itu sekaligus memperlihatkan **angka
kependudukan agregat** (jumlah jiwa per RW), tanpa mengorbankan jalur masuk.

## Revisi kedua

Rancangan awal (di bawah) menempatkan form masuk sebagai kolom ketiga di
`/login` itu sendiri. Setelah dicoba, itu bikin donutnya terjepit kecil di
tengah dan `/login` jadi dua-fungsi (landing **dan** form) — nama halamannya
sendiri jadi tidak jujur, karena begitu dibuka isinya statistik, bukan form
masuk.

Bentuk final membelah dua tanggung jawab itu:

- **`/` (root)** — landing publik: rail `Dashboard` + panel statistik saja.
  Tidak ada form. Pengunjung yang belum masuk mendarat di sini; yang sudah
  masuk tetap dilempar ke beranda rolenya (`RootRoute` di `AppRoutes.tsx`).

  > **Revisi 2026-08-16 — `RootRoute` dihapus, `/` kini terbuka untuk semua.**
  > Pelemparan itu membuat warga kehilangan statistik desa persis setelah
  > login: warga tidak punya halaman statistik lain (`/admin/infografis`
  > khusus ADMIN), jadi satu-satunya cara melihatnya kembali adalah keluar.
  > Sekarang `/` selalu merender `LandingPage`. Pengalihan setelah masuk tidak
  > berubah — tetap dikerjakan `RedirectIfAuthenticated` di `/login`.
  > Ikutannya: tombol rail kiri berganti dari `LoginButton` menjadi
  > `AccountButton` ("Masuk" atau "Akun Saya" tergantung sesi), dan
  > `navItemsForRole()` mendapat item **Statistik Desa** untuk kedua peran.
- **`/login`** — dikembalikan jadi halaman masuk berdiri sendiri
  (`LoginWargaForm` di dalam `AuthLayout`), persis seperti sebelum perubahan
  ini mulai. Dituju lewat tautan **Masuk** di rail kiri landing (desktop) atau
  bilah atas (mobile, karena rail disembunyikan di layar sempit).

Konsekuensinya, `paths.login` tetap `'/login'` dan tetap berarti "halaman
masuk" di seluruh kode (`guards.tsx`, `AktivasiCekView`, `LoginPetugasFormView`,
`use-auth.ts` sesudah logout) — tidak ada yang perlu disesuaikan di luar
routing root & layout landing itu sendiri.

Donut di kolom tengah juga diperbesar (`height={640}`, dari `460`) karena
sekarang tidak lagi berbagi baris dengan kolom form.

## Bentuk akhir (setelah revisi)

Dua kolom setinggi layar pada `/` (root):

```
┌──────────────┬─────────────────────────────────────┐
│ 🏛 NIA        │           ╱‾‾RW 19‾‾╲               │
│              │         ╱   14 jiwa   ╲             │
│ ▸ Dashboard  │        │    ╭─────╮    │            │
│              │        │    │ 36  │    │            │
│ STATISTIK    │     RW 20  │ JIWA │  RW 21          │
│ WARGA        │     12 jiwa ╰─────╯  10 jiwa        │
│  (kosong)    │         ╲            ╱               │
│              │           ╲________╱                 │
├──────────────┤                                       │
│ ⇒ Masuk      │                                       │
├──────────────┤                                       │
│ footer       │                                       │
└──────────────┴─────────────────────────────────────┘
   16rem                    fleksibel
```

- **Rail kiri** — `Dashboard` sebagai item aktif, lalu tautan **Masuk** di
  bagian bawah rail (di atas footer). Section `Statistik Warga` dibuat tetapi
  sengaja kosong; isinya menyusul.
- **Kolom kanan** — hanya donut, tanpa judul dan tanpa legenda. Seluruh
  keterangan hidup di dalam chart: nama RW + jumlah jiwanya dicetak di atas
  irisannya masing-masing, totalnya di lubang donut. Di luar donut tidak ada
  apa pun.
- **< 1024px** — rail disembunyikan; digantikan bilah atas ringkas (logo +
  tautan Masuk) supaya jalur masuk tetap terjangkau tanpa rail.

`/login`, `/login/petugas`, dan `/aktivasi` **tidak berubah secara visual** —
tetap memakai `AuthLayout` (form masuk warga kembali dibungkus `AuthLayout`
setelah sempat dilepas di rancangan pertama).

## Arsitektur

### Fitur baru: `features/statistik-publik/`

```
api/statistik-publik-api.ts   StatistikPublikApi { get(): Promise<StatistikPublik> }
                              mock → agregat dari pendudukData
                              http → GET /publik/statistik
hooks/use-statistik-publik.ts statistikPublikKeys + useStatistikPublik()
view-model.ts                 StatistikPublik → props tampilan
components/StatistikPanel.tsx      LOGIKA: hook + QueryBoundary
components/StatistikPanelView.tsx  VISUAL: donut + legenda
components/StatistikNavView.tsx    VISUAL: rail kiri (tanpa state)
types.ts                      StatistikPublik
```

Endpoint dipisah dari `/infografis` **dengan sengaja**: halaman ini publik,
sehingga backend tidak boleh melayaninya lewat jalur ber-JWT admin. Payload-nya
hanya cacah per RW — tanpa NIK, nama, maupun alamat.

Tambahan kontrak backend (CLAUDE.md §11):

| Method | Path                | Untuk                                    |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/publik/statistik` | agregat publik, tanpa auth, tanpa data pribadi |

### Yang dinaikkan supaya aturan impor tidak dilanggar

`features/A` tidak boleh mengimpor internal `features/B` (CLAUDE.md §4), padahal
fitur baru ini butuh tipe & chart yang kini terkunci di `features/infografis`:

- `Distribusi` → `src/types/statistik.ts`
- `DistribusiBarChart` / `DistribusiPieChart` → `src/components/ui/DistribusiCharts.tsx`

### Halaman

```
pages/landing/LandingPage.tsx   BARU — rail + StatistikPanel, tanpa form. Rute "/".
pages/login/LoginPage.tsx       dikembalikan ke bentuk semula — cuma <LoginWargaForm />.
```

`LoginWargaFormView` sempat melepas bungkus `AuthLayout` di rancangan pertama
(karena saat itu dipasang di dalam `PublicLandingLayout`); dikembalikan begitu
form itu punya halamannya sendiri lagi. Props dan file logikanya
(`LoginWargaForm.tsx`) tidak berubah sama sekali di kedua rancangan.

## Data mock

`src/mocks/data/penduduk.ts` diperluas ke **RW 019 / 020 / 021**, 36 jiwa dalam
14 KK — RW 019 = 14 jiwa, RW 020 = 12 jiwa, RW 021 = 10 jiwa.

Empat NIK berikut wajib tetap ada karena akun demo mengacu padanya:

| NIK                | Dipakai untuk                  |
| ------------------ | ------------------------------ |
| `3204121705850001` | login pengurus `dukuh`         |
| `3204122208900010` | login pengurus `rt03`          |
| `3204120208790004` | login warga (PIN `112233`)     |
| `3204120101600008` | uji alur aktivasi              |

Label agregat memakai `RW 19` (nol depan dibuang), ikut memperbaiki chart
"Sebaran per RW" di halaman infografis admin.

Tidak ada satu pun angka statistik yang ditulis di komponen. Seluruhnya mengalir
`mocks → api → hook → container → view`.

## Warna

Tidak ada token baru; palet tertutup di `tailwind.config.js` tetap utuh.

Perubahan di `styles/index.css`:

1. Token teks `--chart-slice-label` untuk label yang dicetak **di atas**
   irisan: putih polos di semua seri, bukan dipilih per kontras.
2. `--chart-legend-text` baru: teks legenda memakai **token teks**, bukan warna
   serinya sendiri. Seri terang hanya 1,9–2,7:1 di atas kartu putih — tak
   terbaca sebagai huruf. Identitasnya dibawa bulatan berwarna di sebelahnya.

Cincin donut `52%`–`88%` saat berlabel: cukup tebal untuk memuat dua baris teks
di layar sempit, tanpa jadi gelang tambun. Celah antar-irisan `0,6°` (≈2px pada
radius donut besar) — nilai lama `2°` menghasilkan celah ±10px yang terbaca
sebagai potongan, bukan spasi.

**Donut ini tidak punya efek hover sama sekali.** Tidak ada sorotan/peredupan
irisan, dan tooltip dimatikan untuk chart berlabel — isinya persis sama dengan
label yang sudah menempel di tiap irisan. Chart-nya adalah gambar yang sudah
selesai dibaca dalam keadaan diam; menyorot irisan tidak menambah informasi apa
pun, cuma membuat gambar berkedip saat kursor lewat. Kalau efek sorot mau
dihidupkan lagi, itu keputusan sadar — bukan bawaan yang kembali diam-diam.

## Verifikasi

`npm run typecheck`, `npm run lint`, dan `npm run build` harus bersih.
