# Desain: Hapus NIK & No. KK, Aplikasi Khusus Pengurus

Tanggal: 2026-08-26

Menggantikan sebagian besar `2026-08-12-auth-warga-pin-design.md`. Spec lama
tetap disimpan sebagai catatan alasan — terutama bagian "Rancangan awal yang
dibatalkan", yang masih berlaku — tapi seluruh jalur autentikasi warga di
dalamnya sudah tidak dipakai.

## Konteks

Hasil diskusi dengan perangkat desa: **desa tidak mengizinkan NIK dan Nomor
Kartu Keluarga disimpan oleh aplikasi.** Bukan sekadar dilarang tampil —
dilarang ada di database sama sekali.

Konsekuensinya langsung menghantam fondasi desain lama, yang seluruhnya
bertumpu pada NIK: warga masuk dengan NIK + PIN, mengaktifkan akun dengan NIK +
tanggal lahir, dan hanya boleh melihat NIK miliknya sendiri plus anggota nomor
KK yang sama. Tanpa NIK, tidak ada satu pun dari mekanisme itu yang bisa berdiri.

Keputusan yang diambil bersama: **warga tidak lagi punya akun.** Yang bisa masuk
hanya perangkat desa — Dukuh, Ketua RW, Ketua RT. Data hasil pendataan di Excel
tetap dipakai apa adanya (dan sudah bagus), dikurangi dua kolom itu.

## Keputusan

1. **Kolom `nik` dan `noKK` dihapus dari database, skema, dan file Excel.**
   Bukan disembunyikan, bukan di-hash — tidak disimpan.
2. **Konsep Kartu Keluarga dibuang seluruhnya.** Tanpa nomor KK tidak ada kunci
   pengelompokan keluarga yang sah, dan membuat penggantinya (kode urut atau
   hash) berarti tetap menyimpan turunan dari data yang dilarang.
3. **Hanya pengurus yang punya akun.** Login warga, aktivasi, PIN, dan halaman
   kontak dicabut.
4. **Akun pengurus pindah ke SQLite dan dikelola lewat UI oleh ADMIN.** Selama
   ini akun di-hardcode di `app/data/akun.py` dan di-seed ulang tiap restart;
   itu tidak bisa dipertahankan begitu akun pengurus jadi satu-satunya akun yang
   ada.
5. **Excel adalah sumber kebenaran tunggal data penduduk.** Setiap impor
   menimpa seluruh tabel.
6. **Pencarian orang berpindah dari NIK ke filter kategori.** Kotak cari tinggal
   mencocokkan nama; penyaringan sungguhan dilakukan lewat kategori yang bisa
   ditumpuk.

## Yang tidak berubah

Data per orang selain dua kolom itu tetap disimpan penuh dan tetap terlihat oleh
pengurus yang sudah masuk: nama, tempat & tanggal lahir, jenis kelamin, agama,
status perkawinan, pendidikan, pekerjaan, golongan darah, status dalam keluarga,
kewarganegaraan, dan alamat lengkap sampai RT/RW.

Halaman statistik publik di landing tetap terbuka tanpa login, dan tetap hanya
berisi cacah — tidak ada nama, tidak ada alamat.

## Data & skema

### Tabel `penduduk`

Kolom `nik` dan `noKK` dihapus. Index `idx_penduduk_noKK` ikut dihapus karena
satu-satunya query yang memakainya sudah tidak ada.

`id` sekarang UUID4 yang dibuat saat impor. Sebelumnya `id` diisi persis dengan
NIK (`impor_excel.py`, `baris_ke_penduduk`), jadi membiarkannya berarti tetap
menyimpan NIK dengan nama kolom lain.

Kolom `statusHubunganKeluarga` **dipertahankan**, hanya labelnya yang berubah
dari "Status dalam KK" menjadi "Status dalam Keluarga". Nilainya
(`KEPALA_KELUARGA`/`ISTRI`/`ANAK`/…) tetap berguna untuk memahami susunan rumah
tangga walaupun nomor KK-nya hilang, dan ikut jadi filter.

### Tabel `warga_akun`

Dihapus. Tidak ada akun warga lagi.

### Tabel `pengurus` (baru)

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | TEXT PRIMARY KEY | UUID4 |
| `username` | TEXT NOT NULL UNIQUE | |
| `password_hash` | BLOB NOT NULL | bcrypt |
| `nama` | TEXT NOT NULL | |
| `role` | TEXT NOT NULL | `ADMIN` atau `PENGURUS` |
| `rw` | TEXT | NULL untuk Dukuh |
| `rt` | TEXT | NULL untuk Dukuh dan Ketua RW |
| `aktif` | INTEGER NOT NULL DEFAULT 1 | |

`jabatan` **tidak disimpan** — diturunkan dari `role` + `rw` + `rt` ("Ketua RT
03", "Ketua RW 019", "Dukuh"). Menyimpannya berarti dua sumber kebenaran yang
bisa berbeda diam-diam ketika salah satunya diedit.

Akun pengurus tetap tidak punya masa berlaku. Kolom `aktif` adalah satu-satunya
mekanisme siklus hidupnya, persis seperti keputusan di spec lama, dan tidak ada
perbandingan waktu di mana pun.

### `AuthUser`

Field `nik` dihapus. Selama ini tiap akun pengurus diberi NIK palsu berblok
serial `00000090xx` supaya bentuk `AuthUser` seragam dengan warga; sekarang tidak
boleh ada NIK di mana pun, dan warga sudah tidak punya `AuthUser` sama sekali.

Bentuk akhir: `id`, `nama`, `username`, `role`, `rw`, `rt`, `jabatan` (turunan).

## Autentikasi

Dua peran, keduanya pengurus:

- **ADMIN** — Dukuh. Semua kewenangan PENGURUS, ditambah kelola akun pengurus.
- **PENGURUS** — Ketua RW dan Ketua RT. Membaca data penduduk dan infografis
  se-padukuhan.

`WARGA` hilang dari kode dan dari tipe frontend. Pemisahan tegas antara "kelola
data warga" dan "kelola akun" dari spec lama tetap berlaku; yang berubah hanya
jumlah perannya, karena peran ketiga sudah tidak punya pemilik.

Login menolak akun dengan `aktif = 0`.

Pembatasan wilayah (`boleh_akses`) **belum diperlukan**: baca memang tidak pernah
dibatasi wilayah, dan endpoint mutasi data warga belum ada. Kolom `rw`/`rt` tetap
disimpan sekarang karena form kelola akun membutuhkannya untuk membentuk label
jabatan — jadi bukan kolom spekulatif.

### Endpoint auth yang dihapus

`POST /auth/warga/login`, `POST /auth/warga/aktivasi/cek`,
`POST /auth/warga/aktivasi/set-pin`, `PATCH /auth/me/kontak`,
`GET /auth/warga/akun`, `POST /auth/warga/{nik}/reset-pin`.

Ikut mati bersamanya: seluruh `app/core/ratelimit.py` (hanya dipakai jalur warga)
dan penyimpanan tiket aktivasi.

### Bootstrap ADMIN pertama

Kalau tabel `pengurus` kosong saat backend start, satu akun ADMIN dibuat dari
`ADMIN_USERNAME` dan `ADMIN_PASSWORD` di environment. Kalau tabel kosong dan
environment itu belum diisi, **backend menolak jalan** dengan pesan yang
menyebutkan variabel yang kurang.

Menolak jalan, bukan memakai nilai default, karena default berarti ada instalasi
yang berjalan dengan password yang tertulis di kode publik.

## Endpoint sesudah bongkaran

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/auth/login` | publik |
| POST | `/auth/logout` | login |
| GET | `/penduduk` | PENGURUS + ADMIN |
| GET | `/penduduk/{id}` | PENGURUS + ADMIN |
| GET | `/penduduk/filter-opsi` | PENGURUS + ADMIN |
| GET | `/infografis` | PENGURUS + ADMIN |
| GET | `/publik/statistik` | tanpa auth |
| GET | `/pengurus` | ADMIN |
| POST | `/pengurus` | ADMIN |
| PATCH | `/pengurus/{id}` | ADMIN |
| POST | `/pengurus/{id}/reset-password` | ADMIN |

Dihapus: `GET /penduduk/nik/{nik}` dan `GET /kartu-keluarga/{noKK}`.

`PATCH /pengurus/{id}` dipakai untuk mengubah nama, wilayah, dan status
`aktif` — termasuk menonaktifkan akun. Tidak ada `DELETE`: akun yang pernah
melakukan sesuatu tidak dihapus, cukup dinonaktifkan.

### Filter pada `GET /penduduk`

Selain `page`, `pageSize`, dan `search` (kini hanya mencocokkan nama), endpoint
menerima parameter opsional: `jenisKelamin`, `agama`, `golonganDarah`,
`pendidikan`, `statusPerkawinan`, `statusHubunganKeluarga`, `pekerjaan`, `rt`,
`rw`, `kelompokUmur`.

Semua digabung dengan **AND**; parameter yang tidak dikirim tidak menyaring
apa-apa. Penyaringan dilakukan di memori atas `DAFTAR_PENDUDUK` — `store.py`
sudah memuat seluruh tabel saat start, jadi tidak ada query SQL baru.

`kelompokUmur` dihitung dari `tanggalLahir` memakai pembagian kelompok yang sudah
ada di `app/data/agregat.py`, dipakai ulang, bukan ditulis kedua kalinya.

### `GET /penduduk/filter-opsi`

Mengembalikan hanya pilihan yang **bukan** enum: daftar `rt`, `rw`, dan
`pekerjaan` yang benar-benar muncul di data. Pilihan enum sudah ada di
`frontend/src/features/penduduk/labels.ts`; mengirimkannya lewat jaringan cuma
menduplikasi sesuatu yang sudah pasti.

`pekerjaan` adalah teks bebas di Excel, jadi daftarnya akan ikut kotor kalau
pengurus mengetik tidak konsisten ("Petani" vs "petani"). Diterima sadar:
alternatifnya menjadikan pekerjaan enum tertutup, dan daftar pekerjaan di satu
padukuhan tidak bisa diprediksi dari awal.

## Impor Excel

Kolom `No. KK` dan `NIK` dihapus dari `KOLOM` di `app/data/impor_excel.py`,
sehingga template Excel ikut berubah bentuk (pembangkit template di
`backend/tools/` membaca daftar yang sama).

Baris kosong sekarang dikenali dari kolom `Nama Lengkap`; sebelumnya dari `NIK`.

**Setiap impor menimpa seluruh tabel:** `DELETE FROM penduduk`, lalu isi ulang
dari file. Penjaga `nik_sudah_ada()` dihapus, tidak diganti — tanpa NIK tidak ada
kunci yang bisa dipercaya untuk mengenali orang yang sama, dan kandidat
penggantinya (nama + tanggal lahir + alamat) gagal persis pada kasus yang paling
mungkin terjadi di satu padukuhan: dua orang senama.

Ceiling yang diterima sadar: **kalau pengurus mengimpor file berisi warga baru
saja, warga lama akan terhapus.** File harus selalu lengkap. Ini ditulis di
docstring modul dan dicetak sebagai peringatan oleh skrip sebelum menimpa.

Data penduduk tetap read-only dari sisi aplikasi, jadi tidak ada perubahan hasil
kerja di aplikasi yang bisa hilang karena penimpaan ini.

## Frontend

**Dihapus:** `pages/aktivasi/`, `pages/user/beranda/`, `pages/user/kontak/`,
`pages/login/LoginPage.tsx` (login warga), seluruh bagian PIN/aktivasi/kontak di
`features/auth/`, serta path `aktivasi`, `kontak`, dan `beranda` di
`routes/paths.ts`.

**Diubah:** `LoginPetugasPage` pindah ke `/login` dan menjadi satu-satunya pintu
masuk. Tipe `Role` menjadi `'ADMIN' | 'PENGURUS'`. `navItemsForRole()` tinggal
satu daftar menu, ditambah "Akun Pengurus" khusus ADMIN. Landing dan infografis
kehilangan kartu "Jumlah KK".

**Baru:** `pages/admin/pengurus/` (tabel akun, tambah, nonaktifkan, reset
password) dengan `features/pengurus/` di belakangnya, mengikuti struktur fitur
standar di §4 CLAUDE.md. Di `features/penduduk/` ditambahkan satu komponen
`FilterPenduduk` — sebaris dropdown plus tombol "Hapus filter".

State filter ikut masuk ke query key React Query, supaya tiap kombinasi filter
punya cache sendiri dan tidak saling menimpa.

## Penanganan error

Tidak ada pola baru. Error API tetap dinormalisasi jadi `ApiError` oleh
interceptor axios dan ditampilkan lewat komponen `Alert`.

Dua kasus yang perlu pesan khusus:

- Login akun nonaktif — dibedakan dari salah password, dengan pesan yang menyuruh
  menghubungi Dukuh.
- Impor Excel dengan kolom yang tidak cocok — skrip sudah menyebutkan kolom yang
  hilang; setelah perubahan ini file lama yang masih punya kolom NIK/No. KK akan
  ditolak, dan itu perilaku yang diinginkan.

## Migrasi

Database lama **dihapus**, bukan di-`ALTER`: `rm backend/data/siduk.db`, lalu
impor ulang dari Excel. File `.db` memang tidak pernah ikut repo, dan datanya
seluruhnya berasal dari Excel, jadi tidak ada yang hilang.

`app/data/dummy.py` (generator 200 KK) dihapus. Konsep yang dibangkitkannya
adalah KK, dan Excel asli sudah tersedia sebagai sumber data.
`app/data/agregat.py` yang merakit objek `Penduduk` palsu ber-`nik="0"` dan
`noKK="0"` disesuaikan.

`docs/data-penduduk.xlsx` sudah dibuat ulang tanpa dua kolom itu (21 → 19 kolom,
385 baris data utuh) pada 2026-08-26. `docs/template-data-penduduk.xlsx` masih
perlu dibangkitkan ulang dari `backend/tools/` setelah `KOLOM` berubah.

### Riwayat git

Versi lama `docs/data-penduduk.xlsx` yang masih berisi kolom NIK dan No. KK ada
di riwayat git. Isinya data contoh ("Desa Sukamaju"), bukan data warga sungguhan,
jadi tidak ada kebocoran. **Sebelum file itu pernah diisi data pendataan asli,
riwayatnya harus dibersihkan** — sekali NIK asli masuk ke sebuah commit, ia
permanen di sana.

## Pengujian

Backend: `.venv/bin/python -m app.data.db` untuk self-check skema. Lalu uvicorn
di port lain dengan `DATABASE_PATH` sementara, dipanggil lewat `urllib` stdlib
(`httpx` tidak ada di `requirements.txt`, jadi `fastapi.testclient` tidak bisa
dipakai) untuk memastikan: login pengurus berhasil, login akun nonaktif ditolak,
filter `GET /penduduk` benar untuk kombinasi bertumpuk, endpoint `/pengurus`
menolak PENGURUS, dan `/publik/statistik` tetap tidak memuat data pribadi.

Impor: jalankan `impor_excel` dua kali berturut-turut atas file yang sama dan
pastikan jumlah barisnya tetap, bukan berlipat.

Frontend: `npm run typecheck && npm run lint && npm run build` harus bersih.

## Batasan yang diterima sadar

- **Impor menimpa total.** File tidak lengkap = warga hilang.
- **Tidak ada cara mengenali orang yang sama antar-impor.** `id` berganti tiap
  impor; tidak ada yang boleh menyimpan referensi ke `id` penduduk.
- **Daftar `pekerjaan` di filter ikut kotor** kalau ejaan di Excel tidak
  konsisten.
- **Rate limit hilang** bersama jalur warga. Login pengurus tidak diberi pembatas
  percobaan; jumlah akunnya sedikit dan semuanya dibuat manual oleh ADMIN.
  Tambahkan kalau aplikasi nanti terbuka ke internet luas.
- **Audit log masih `print()`** ke console. Belum ada mutasi data warga, jadi
  yang tercatat cuma kelola akun. Menjadi wajib begitu endpoint tulis penduduk
  ditambahkan.

## Utang yang tetap terbuka dari spec lama

Masih berlaku dan tidak diselesaikan di sini:

- **Sesi server-side menggantikan JWT.** Sekarang malah lebih mendesak:
  menonaktifkan akun adalah satu-satunya cara memutus akses, dan dengan JWT
  efeknya baru terasa setelah TTL 12 jam habis.
- **Audit log persisten** dengan nilai sebelum/sesudah.
- **Endpoint mutasi data warga** beserta helper `boleh_akses(pengurus, warga)`
  dan pembatasan wilayah — sengaja ditunda ke siklus berikutnya.
- **Status kependudukan (`PINDAH`/`MENINGGAL`) memutus akses otomatis.** Kini
  jauh berkurang artinya: warga sudah tidak punya akun sama sekali, jadi yang
  tersisa hanya pertanyaan apakah mereka masih ikut dihitung di statistik.
