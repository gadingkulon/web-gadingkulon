# Desain: Empat Peran & Pergantian Pengurus

Tanggal: 2026-08-26

Melanjutkan `2026-08-26-hapus-nik-kk-auth-pengurus-design.md`, yang memakai dua
peran datar (`ADMIN`/`PENGURUS`). Dokumen itu tetap berlaku untuk semua hal
lain — NIK & No. KK tidak disimpan, warga tidak punya akun, Excel sumber
kebenaran tunggal.

Dikerjakan **bertahap**. Tahap 1 (dokumen ini, bagian 1–6) berdiri sendiri dan
bisa dipakai. Tahap 2 (bagian 7) dapat spec-nya sendiri.

## Konteks

Aplikasi dipakai empat pihak, bukan dua. Yang membedakannya bukan sekadar
tingkat kewenangan, melainkan **arah** kewenangan:

- **Admin** mengelola siapa yang boleh masuk, dan justru **tidak boleh melihat
  data warga sama sekali**. Ini bukan pembatasan simbolis: orang yang memegang
  tombol pemberian akses tidak perlu, dan karena itu tidak boleh, membaca isi
  datanya.
- **Dukuh, RW, RT** membaca data warga, dan tidak bisa menyentuh akun siapa pun
  termasuk akunnya sendiri.

Dua kewenangan itu berpotongan kosong. Di dua peran datar sebelumnya, ADMIN
memegang keduanya sekaligus — itu yang diperbaiki di sini.

Setiap kursi dipegang **satu orang**, dan orangnya berganti sewaktu-waktu.
Karena itu akun tidak lagi dianggap milik seseorang selamanya, melainkan
**penghuni sebuah kursi** yang bisa berpindah tangan.

## Keputusan

1. **Empat peran:** `ADMIN`, `DUKUH`, `RW`, `RT`.
2. **Baca tidak dibatasi wilayah.** Dukuh, RW, dan RT sama-sama melihat seluruh
   warga padukuhan. Kolom `rw`/`rt` menandai kursi mana yang diduduki, bukan
   membatasi bacaan.
3. **Kode Warga menggantikan UUID sebagai `id` penduduk.** Kolom baru di Excel,
   diisi pengurus, wajib unik.
4. **Password awal hanya sekali pakai.** Akun baru wajib mengganti passwordnya
   sebelum bisa melakukan apa pun.
5. **Pergantian pengurus lewat pengajuan + persetujuan** (Tahap 2). Tidak ada
   tombol cabut akses yang berdiri sendiri: akses lama terlepas otomatis saat
   pengganti disetujui.

## 1. Peran & kursi

| Peran   | Jumlah kursi | Kewenangan                                                   |
| ------- | ------------ | ------------------------------------------------------------ |
| `ADMIN` | 1            | Lihat daftar kursi & penghuninya, buatkan kredensial. **Nol akses data warga.** |
| `DUKUH` | 1            | Baca seluruh warga + infografis                              |
| `RW`    | satu per nomor RW di data (sekarang 3: 019, 020, 021) | sama |
| `RT`    | satu per nomor RT di data (sekarang 6: 001–006) | sama                 |

**Daftar kursi diturunkan dari data penduduk**, bukan dari tabel atau berkas
konfigurasi tersendiri: pasangan RW/RT yang benar-benar ada di padukuhan sudah
tercatat di kolom alamat tiap warga. Menyimpannya di tempat kedua berarti ada
dua sumber kebenaran yang bisa berbeda diam-diam ketika padukuhan memekarkan
sebuah RT.

Konsekuensi yang diterima sadar: **kursi baru hanya muncul setelah ada warga
ber-RT itu di data.** Itu urutan yang benar — RT tanpa warga tidak perlu akun.

`jabatan` tetap diturunkan, tidak disimpan: `DUKUH` → "Dukuh", `RW` + rw
"019" → "Ketua RW 019", `RT` + rw "019" + rt "001" → "Ketua RT 001",
`ADMIN` → "Admin".

### Dependency di backend

- `current_user` — siapa pun yang sudah masuk. Dipakai hanya oleh ganti
  password.
- `current_pengurus` — `DUKUH`/`RW`/`RT`. Menolak `ADMIN`. Menjaga seluruh
  endpoint baca data warga.
- `current_admin` — `ADMIN` saja. Menjaga seluruh endpoint kelola akun.

Ketiganya sudah ada bentuk awalnya; yang berubah cuma daftar peran yang lolos.

## 2. Kode Warga sebagai identitas

Excel mendapat satu kolom baru **`Kode Warga`** di posisi paling kiri, diisi
pengurus, wajib unik dan tidak boleh kosong. Nilainya **langsung menjadi `id`
penduduk** — bukan kolom tambahan di sebelah UUID.

Alasannya: Tahap 2 mengharuskan akun pengurus mengingat warga mana yang
menempatinya, sementara `id` UUID dibangkitkan ulang setiap impor (spec
26 Agustus, bagian "Impor Excel"). Tautan apa pun ke seorang warga akan putus
pada impor berikutnya. Kode yang dijaga manusia adalah satu-satunya kunci yang
bertahan, karena ia tidak diturunkan dari isi data.

Impor **tetap menimpa seluruh tabel**. Yang berubah hanya asal `id`-nya.

**Kode ganda atau kosong menghentikan impor**, dengan menyebutkan barisnya —
tidak ditimpa diam-diam. Dua warga bertukar kode berarti dua orang bertukar
jabatan tanpa ada yang menyadarinya.

Konsekuensi yang diterima sadar: **kode salah ketik = orang yang salah**, dan
beban menjaganya ada pada pengurus. Alternatifnya (mencocokkan nama + tanggal
lahir) gagal persis pada kasus yang paling mungkin di satu padukuhan: dua orang
senama.

## 3. Password awal sekali pakai

Tabel `pengurus` mendapat kolom `harus_ganti_password` (default 1).

Selama kolom itu bernilai 1:

- Login **berhasil** dan menghasilkan token — kalau tidak, orangnya tidak punya
  cara masuk untuk mengganti passwordnya.
- Tapi **setiap endpoint selain ganti password ditolak 403** dengan pesan
  khusus. Ditegakkan di `current_pengurus` dan `current_admin`, bukan di layar.
- Mengganti password memadamkan penanda itu dalam satu operasi yang sama.

Akibatnya password yang sempat diketahui Admin tidak pernah berlaku untuk
membaca apa pun. Reset password oleh Admin menyalakan penanda itu lagi.

**Password baru tidak boleh sama dengan yang lama** — kalau boleh, tuntutan
mengganti password bisa dipenuhi tanpa mengganti apa pun.

## 4. Halaman Admin

Satu tabel berisi seluruh kursi, terisi maupun kosong:

| Kursi | Nama penghuni | Username | Status |
| ----- | ------------- | -------- | ------ |

- Kursi **kosong** → tombol **Buatkan Akun**: Admin mengisi nama, username, dan
  password awal, lalu menyerahkannya tatap muka.
- Kursi **terisi** → tombol **Reset Password** (menyalakan kembali penanda
  ganti-password) dan **Nonaktifkan**.

**Nonaktifkan adalah pintu darurat sementara.** Di Tahap 2 pelepasan kursi
terjadi otomatis saat pengganti disetujui, jadi tombol ini akan dicabut.
Ditandai `ponytail:` di kode supaya tidak menjadi peninggalan yang tidak ada
yang berani hapus.

Di Tahap 1 nama penghuni **diketik Admin**. Penarikan otomatis dari data warga
menyusul di Tahap 2 bersama dropdown pencariannya.

## 5. Frontend

- `Role` menjadi `'ADMIN' | 'DUKUH' | 'RW' | 'RT'`.
- `homePathForRole`: `ADMIN` → `/admin/pengurus`; sisanya → `/admin/penduduk`.
- Menu Admin **hanya** "Akun Pengurus" + "Statistik Desa". Dashboard, Data
  Penduduk, dan Infografis tidak muncul untuknya — halaman-halaman itu memang
  akan menolaknya di backend.
- Route `/admin`, `/admin/penduduk`, `/admin/infografis` dibungkus guard yang
  menolak `ADMIN`; `/admin/pengurus` dibungkus guard yang hanya menerima
  `ADMIN`.
- Halaman **Ganti Password** wajib: selama penanda menyala, seluruh route lain
  mengalihkan ke sana. Pengalihan ini kenyamanan — yang menegakkan tetap
  backend.

## 6. Penanganan error

Tiga keadaan gagal masuk dibedakan pesannya, karena tindakan penerimanya
berbeda:

| Keadaan | Pesan |
| ------- | ----- |
| Username/password salah | "Username atau password salah." |
| Akun nonaktif | "Akun Anda sudah dinonaktifkan. Hubungi Admin." |
| Belum ganti password | dialihkan ke halaman ganti password, bukan pesan galat |

Impor Excel yang menemui Kode Warga ganda atau kosong berhenti sebelum menulis
apa pun, dan menyebutkan nomor barisnya.

## 7. Tahap 2 — pengajuan & persetujuan (belum dikerjakan)

Direkam di sini supaya Tahap 1 tidak menutup jalannya, tapi **tidak** dibangun
sekarang.

Admin mengajukan pergantian sebuah kursi dan memilih warga pengganti lewat
dropdown pencarian; tiap barisnya menampilkan "Nama — RT/RW" supaya nama kembar
tidak tertukar. Persetujuan dilakukan perangkat terkait dari akunnya
masing-masing.

| Kursi yang diganti | Penyetuju | Lolos bila |
| ------------------ | --------- | ---------- |
| Dukuh              | seluruh Ketua RW yang menjabat (sekarang 3) | minimal 3 menyetujui |
| Ketua RW           | Dukuh | Dukuh menyetujui |
| Ketua RT           | Ketua RW wilayahnya **dan** Dukuh | keduanya menyetujui |

Aturan yang mengikat:

- Pengajuan ditolak otomatis begitu jumlah persetujuan yang tersisa tidak lagi
  cukup untuk lolos.
- Admin mengajukan dan melihat; **tidak pernah** menyetujui.
- Hanya penyetuju yang ditunjuk yang melihat pengajuan itu di akunnya.
- Warga yang diusulkan tidak boleh sedang menduduki kursi lain.
- Tidak boleh ada dua pengajuan aktif untuk kursi yang sama.
- Pengajuan lolos → warga baru menduduki kursi, penghuni lama terlepas, lalu
  Admin membuatkan kredensialnya seperti di bagian 4.

**Yang masih perlu diputuskan sebelum Tahap 2 dimulai:**

- Penyetuju Dukuh adalah "seluruh RW yang menjabat", padahal sekarang jumlahnya
  persis 3. Artinya satu kursi RW yang kosong membuat pergantian Dukuh
  **mustahil**. Perlu jalan keluar — misalnya ambang "seluruh RW yang menjabat,
  minimal 2".
- Pergantian Ketua RT butuh persetujuan Ketua RW-nya. Kalau kursi RW itu kosong,
  pergantian RT di bawahnya ikut buntu.
- Kursi Dukuh kosong membuat seluruh pergantian RW dan RT buntu sekaligus.

Ketiganya adalah keadaan saling mengunci, dan tidak punya jawaban di Tahap 1
karena di sana Admin masih bisa membuat akun langsung.

## Batasan yang diterima sadar

- **Kode Warga dijaga manusia.** Salah ketik = orang yang salah.
- **Kursi hanya ada kalau ada warganya** di data hasil impor.
- **Admin buta terhadap data warga**, termasuk saat menyelidiki laporan
  masalah. Itu memang tujuannya.
- **Tidak ada rate limit** pada login maupun ganti password (utang dari spec
  sebelumnya, belum dibayar).
- **Audit log masih `print()`** ke console dan hilang tiap restart. Menjadi
  wajib di Tahap 2, karena persetujuan pergantian jabatan harus bisa
  ditelusuri.
