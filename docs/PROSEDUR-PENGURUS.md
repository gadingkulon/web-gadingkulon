# Prosedur Pengurus — SIGALON, Portal Data Kependudukan

Dokumen ini untuk **pengurus padukuhan** (Dukuh, RW, RT), bukan untuk
programmer. **Simpan salinan cetaknya di rumah Dukuh.**

> **Diperbarui 26 Agustus 2026.** Dua perubahan besar:
>
> 1. Aplikasi **tidak boleh menyimpan NIK dan Nomor Kartu Keluarga**. Warga
>    tidak lagi punya akun sama sekali; seluruh prosedur PIN warga di versi
>    sebelumnya sudah tidak berlaku.
> 2. Ada **empat tingkat akun**, dan kewenangan kelola akun dipegang **Admin**
>    yang justru tidak bisa melihat data warga sama sekali.
> 3. **Pergantian pengurus tidak lagi ditentukan Admin sendiri.** Admin
>    mengajukan; yang memutuskan adalah perangkat desa yang berwenang.

---

## Kenapa dokumen ini penting

Aplikasi ini sengaja dibuat tanpa mekanisme otomatis apa pun untuk mencabut
akses. **Akun pengurus tidak punya masa berlaku.** Akun yang dibuat hari ini
akan tetap bisa dipakai bertahun-tahun ke depan sampai ada orang yang
menonaktifkannya secara manual.

Artinya: prosedur di dokumen ini **bukan anjuran, tapi satu-satunya pengaman
yang dimiliki sistem.** Kalau seorang Ketua RT berhenti menjabat dan tidak ada
yang menonaktifkan akunnya, ia tetap bisa masuk dan tetap bisa melihat seluruh
data warga padukuhan. Tidak ada apa pun di dalam aplikasi yang akan
menghentikannya sendiri.

Ini pilihan yang diambil sadar. Mekanisme otomatis yang tidak ada yang merawat
justru akan mengunci semua orang di luar sistem pada suatu hari tanpa ada yang
bisa membuka. Yang menggantikannya adalah dokumen ini, dan kedisiplinan
menjalankannya.

---

## Empat tingkat akun

| Tingkat      | Siapa                | Bisa apa                                                     |
| ------------ | -------------------- | ------------------------------------------------------------ |
| **Admin**    | pemegang akun layanan | Membuatkan akun untuk jabatan kosong, reset password, **mengajukan** pergantian. **Tidak bisa melihat data warga, dan tidak bisa menyetujui pergantian apa pun.** |
| **Dukuh**    | Pak Dukuh            | Melihat seluruh data warga & infografis                       |
| **Ketua RW** | satu per RW (sekarang RW 19, 20, 21)    | sama                       |
| **Ketua RT** | satu per RT (sekarang RT 1–6)            | sama                       |

Dua sisi ini **tidak saling menyentuh**, dan itu disengaja:

- **Admin memberi akses tapi buta terhadap isinya.** Orang yang memegang tombol
  pemberian akses tidak perlu — dan karena itu tidak boleh — membaca data
  warganya. Kalau Admin bisa keduanya, satu akun saja cukup untuk membuka
  seluruh data sedesa tanpa ada yang bisa menghalangi.
- **Dukuh, RW, dan RT membaca data tapi tidak bisa menyentuh akun siapa pun**,
  termasuk akunnya sendiri. Orang yang bisa dicabut haknya tidak boleh memegang
  tombol pencabutannya.

**Warga tidak punya akun.** Tidak ada halaman masuk untuk warga, tidak ada PIN,
tidak ada aktivasi. Yang bisa dilihat warga tanpa masuk hanyalah **halaman
depan** — angka statistik padukuhan, tanpa satu pun nama atau alamat.

---

## Akun melekat pada jabatan, bukan pada orang

Yang terdaftar di aplikasi bukan "Pak Slamet", melainkan **jabatan** "Ketua RT
001". Jabatan itu dipegang satu orang, dan orangnya berganti sewaktu-waktu.

Daftar jabatannya **mengikuti data warga**: begitu ada warga ber-RT 007 di file
Excel, jabatan "Ketua RT 007" muncul sendiri di halaman Admin. Tidak ada daftar
RW/RT yang perlu diurus terpisah — dan RT yang belum punya warga memang belum
perlu akun.

Satu jabatan hanya boleh dipegang **satu akun aktif**. Akun pemegang lama tetap
tersimpan dalam keadaan nonaktif supaya jejaknya tidak hilang.

---

## Siapa boleh melihat apa

**Melihat data dibatasi wilayah masing-masing:**

| Siapa | Melihat |
| ----- | ------- |
| Pak Dukuh | seluruh padukuhan |
| Ketua RW 020 | warga RW 020 saja (RT 003 & 004) |
| Ketua RT 004 | warga RT 004 saja |

Angka di halaman Infografis ikut menyempit — grafik Ketua RT 004 adalah tentang
RT 004, bukan padukuhan. Judul halamannya menyebutkan wilayah yang sedang
ditampilkan supaya tidak salah baca.

Konsekuensinya: **Ketua RT tidak bisa lagi mengecek data warga RT sebelah.**
Kalau perlu, minta bantuan Ketua RW atau Pak Dukuh.

Halaman depan yang terbuka untuk umum tetap menampilkan angka se-padukuhan —
isinya cuma cacah, tanpa nama maupun alamat.

Admin tidak melihat satu pun dari itu. Menu di layarnya hanya **Akun Pengurus**
dan **Statistik Desa** (halaman depan yang terbuka untuk umum).

**Pengurus sekarang bisa mengubah data warga langsung di aplikasi** — lihat
[Memperbarui data warga](#memperbarui-data-warga). File Excel dipakai untuk
mengisi data pertama kali saja.

---

## Mencari warga: pakai saringan, bukan nomor

Karena NIK dan Nomor KK tidak lagi didata, mencari orang dilakukan dengan
**nama** atau dengan **saringan kategori** di menu **Data Penduduk**:

jenis kelamin, agama, golongan darah, pendidikan, status perkawinan, status
dalam keluarga, kelompok umur, RW, RT, dan pekerjaan.

Saringan bisa ditumpuk. "Perempuan **dan** RT 03 **dan** umur 60+" akan
menampilkan hanya warga yang memenuhi ketiganya sekaligus. Tombol **Hapus
filter** mengembalikan daftar utuh.

---

## Memperbarui data warga

**Aplikasi adalah catatan yang berlaku.** Sejak sekarang pengurus membetulkan
dan menambah data lewat menu **Data Penduduk**, bukan lewat file Excel.

### Membetulkan data

Cari warganya, tekan **Ubah**, betulkan, simpan. Setiap perubahan **tercatat
permanen**: siapa yang mengubah, kapan, kolom apa, dari apa jadi apa. Itu bukan
pengawasan terhadap pengurus — itu supaya kalau ada data yang keliru, bisa
ditelusuri kembali dan diperbaiki, bukan ditebak.

Catatannya bisa dibaca sendiri di menu **Riwayat Perubahan**, berisi perubahan
data warga di wilayah Anda. Pak Dukuh melihat seluruh padukuhan. Admin tidak
melihat riwayat data warga sama sekali — yang ia lihat cuma riwayat pembuatan
akun dan reset password.

### Menambah warga baru

Tekan **+ Tambah Warga**. RT dan RW-nya otomatis wilayah Anda sendiri. Nomor
**Kode Warga dibuat aplikasi**, tidak perlu (dan tidak bisa) Anda tentukan.

### Warga pindah atau meninggal

Ubah **Status Kependudukan** menjadi Pindah atau Meninggal. **Datanya tidak
pernah dihapus** — barisnya tetap ada di daftar dengan penanda, statusnya saja
yang berubah.

Sejak ditandai, orang itu **tidak lagi ikut dihitung** dalam jumlah penduduk
dan seluruh grafik, termasuk di halaman depan. Kalau ternyata salah tandai,
kembalikan saja statusnya jadi Aktif — barisnya masih ada di daftar.

### Warga pindah antar-RT: hanya Pak Dukuh

Kolom **RT** dan **RW** terkunci untuk Ketua RT dan Ketua RW. Kalau ada warga
pindah dari RT 003 ke RT 004, **laporkan ke Pak Dukuh** — beliau yang
memindahkannya.

Alasannya: kalau Ketua RT bisa memindahkan warga keluar dari RT-nya sendiri,
maka begitu tersimpan ia tidak bisa lagi menyentuh orang itu untuk membatalkan
kalau ternyata salah. Kesalahan yang tidak bisa diperbaiki oleh yang
melakukannya.

Membetulkan **alamat jalan** — "Jl. Melati No. 5" jadi "No. 7" — tetap bisa
dilakukan Ketua RT, karena itu bukan pindah wilayah.

### File Excel: hanya untuk pengisian pertama

Formulir kosongnya ada di `docs/template-data-penduduk.xlsx`, dipakai sekali
saat aplikasi pertama kali dipasang.

> ### ⚠️ Jangan mengimpor Excel lagi setelah aplikasi dipakai
>
> Impor **menghapus seluruh data di aplikasi** dan menggantinya dengan isi
> file. Semua koreksi dan warga baru yang dimasukkan pengurus akan hilang.
>
> Aplikasi sudah menolak impor kalau databasenya berisi, jadi itu tidak bisa
> terjadi karena tidak sengaja. Tapi kalau ada yang memaksanya, **salin dulu
> file databasenya.**

**Jangan menambahkan kolom NIK atau No. KK ke file itu.** Sistem tidak
menyimpannya, dan desa tidak mengizinkannya.

---

## Membuatkan akun untuk jabatan kosong

Dilakukan **Admin**, lewat menu **Akun Pengurus**:

1. Cari baris jabatannya (mis. "Ketua RT 003"), yang statusnya **Kosong**.
2. Klik **Buatkan Akun**, lalu **cari nama orangnya** di kotak pencarian —
   ketik minimal 2 huruf, pilih dari daftar yang muncul. Tiap baris tertulis
   "Nama — RT/RW" supaya tidak salah pilih kalau ada nama kembar.
   Kalau kolom Jabatan di Excel sudah menandai orangnya, ia **sudah terpilih
   otomatis** — tinggal diperiksa.
3. Isi **username** dan **password awal** (minimal 8 karakter).
4. **Serahkan password awal secara tatap muka.**

Jabatan tidak perlu dipilih — sudah ditentukan oleh baris yang diklik.
Namanya juga tidak diketik: Admin tidak boleh melihat data warga, jadi ia
memilih dari daftar, bukan mengarang dari ingatan.

**Yang muncul di daftar hanya warga wilayah jabatan itu.** Ketua RT 3 hanya
bisa diisi warga RT 3, Ketua RW 19 hanya warga RW 19. Pak Dukuh boleh dari
wilayah mana pun di padukuhan. Aturan yang sama berlaku saat mengajukan
pergantian.

### Password awal hanya sekali pakai

Password yang dibuat Admin **tidak bisa dipakai untuk melihat apa pun.** Saat
pemiliknya masuk pertama kali, aplikasi langsung menuntut ia mengganti password
itu dengan pilihannya sendiri, dan tidak ada halaman lain yang bisa dibuka
sebelum itu selesai. Setelah diganti, password dari Admin mati.

Artinya: **Admin tidak pernah tahu password yang benar-benar dipakai pengurus**,
walaupun dialah yang membuatkan akunnya. Statusnya terlihat di tabel sebagai
"Belum ganti password" selama itu belum dilakukan.

Tidak ada pengiriman password lewat SMS, WhatsApp, atau email — aplikasi ini
memang tidak punya jalur itu, dan itu disengaja supaya tidak ada biaya bulanan
dan tidak ada yang bisa mati diam-diam.

---

## Pengurus lupa password

**Kalau masih ingat passwordnya dan cuma ingin menggantinya:** tidak perlu
Admin. Klik gambar orang di pojok kanan atas → **Ganti Password**.

**Kalau benar-benar lupa:**

1. Pengurus **datang langsung** menemui Admin.
2. Admin membuka menu **Akun Pengurus** → cari barisnya → **Reset Password**.
3. Admin mengetik password baru, lalu menyampaikannya **langsung**.
4. Pengurus masuk, dan aplikasi kembali menuntutnya mengganti password itu.

**JANGAN mereset password atas permintaan lewat telepon, SMS, atau WhatsApp.**
Verifikasi tatap muka adalah satu-satunya pengaman yang dimiliki sistem ini.

Reset password juga **memutus semua sesi** akun itu: kalau ada yang sedang
memakai akunnya di perangkat lain, ia langsung terlempar keluar.

### Kalau muncul "Terlalu banyak percobaan masuk yang gagal"

Aplikasi mengunci sebuah username selama **15 menit** setelah 5 kali salah
password. Ini menahan orang menebak-nebak password dari luar.

Yang terkunci **hanya username itu**, bukan seluruh orang yang memakai jaringan
yang sama. Jadi kalau satu pengurus terkunci, yang lain tetap bisa masuk seperti
biasa.

Yang harus dilakukan: **tunggu**, jangan mencoba terus — tiap percobaan baru
tidak memperpanjang kuncinya, tapi juga tidak mempercepatnya. Kalau memang
lupa password, temui Admin untuk direset; resetnya tetap bisa dilakukan
walaupun akunnya sedang terkunci.

---

## Pengurus berganti jabatan

**Setiap pengurus punya akun sendiri. Jangan pernah berbagi satu akun bersama.**
Kalau akun dipakai bergantian, tidak ada yang bisa tahu siapa melakukan apa.

### Siapa melapor kepada siapa

| Yang berganti | Wajib melapor kepada     | Siapa yang melapor                                 |
| ------------- | ------------------------ | -------------------------------------------------- |
| Ketua RT      | Ketua RW-nya, lalu Dukuh | Ketua RT yang lama; kalau berhalangan, Ketua RW     |
| Ketua RW      | Dukuh                    | Ketua RW yang lama; kalau berhalangan, Dukuh mencatat sendiri |
| Dukuh         | Lurah, dan Dukuh berikutnya | Dukuh yang lama; kalau berhalangan, Ketua RW paling senior |

**Dukuh adalah pihak yang wajib memastikan laporan ini sampai**, bukan sekadar
menerimanya. Kalau Dukuh mendengar ada pergantian pengurus dari sumber mana pun
— rapat, obrolan, surat — itu sudah cukup untuk memulai langkah di bawah, tanpa
menunggu laporan resmi.

### Berapa lama akun lama boleh tetap aktif

**Paling lama 7 hari sejak pergantian berlaku.** Kalau pergantiannya sudah
diketahui sebelumnya (masa jabatan habis, pengunduran diri terencana), akun
baru dibuat lebih dulu dan akun lama dinonaktifkan **pada hari pergantian**.

Batas 7 hari ini bukan target, tapi batas atas. Selama akun lama masih aktif,
orang yang sudah tidak menjabat masih bisa melihat seluruh data warga.

Kalau pergantiannya karena **konflik, pemberhentian, atau kehilangan
kepercayaan**: nonaktifkan **hari itu juga**, sebelum akun penggantinya sempat
dibuat. Urutannya sengaja dibalik untuk kasus ini.

### Langkah konkret

1. **Admin mengajukan penggantinya:** menu **Akun Pengurus** → cari baris
   jabatannya → **Ajukan Pergantian** → ketik nama warga penggantinya, pilih dari
   daftar yang muncul. Tiap pilihan tertulis "Nama — RT/RW" supaya tidak salah
   pilih kalau ada dua orang senama.
   *Sampai di sini belum ada yang berubah.*

2. **Yang berwenang menyetujui membuka aplikasinya**, dan melihat kotak
   **"Menunggu persetujuan Anda"** di layar. Isinya hanya pengajuan yang memang
   urusannya — pengurus lain tidak melihatnya sama sekali.

   | Yang diganti | Harus disetujui |
   | ------------ | --------------- |
   | Ketua RT     | Ketua RW wilayahnya **dan** Pak Dukuh |
   | Ketua RW     | Pak Dukuh |
   | Pak Dukuh    | seluruh Ketua RW |

3. **Mereka menekan Setujui atau Tolak.** Satu penolakan saja membuat pengajuan
   gugur, dan pengurus lama tetap menjabat.
   **Jawaban tidak bisa diubah** — salah pencet berarti harus diajukan ulang
   dari awal. Ini disengaja, supaya tidak ada tawar-menawar setelah suara masuk.

4. **Begitu semuanya setuju, jabatan berpindah saat itu juga.** Akun pengurus
   lama langsung mati, dan jabatannya tercatat kosong.

5. **Admin membuatkan akun untuk pemegang barunya**, sama seperti mengisi jabatan
   kosong biasa — lihat
   [Membuatkan akun untuk jabatan kosong](#membuatkan-akun-untuk-jabatan-kosong).

6. **Catat pergantiannya** di buku administrasi padukuhan.

### Hal-hal yang perlu diketahui

**Admin tidak bisa mencabut akses siapa pun sendirian.** Tombol itu memang
tidak ada. Satu-satunya cara sebuah jabatan menjadi kosong adalah lewat
pergantian yang disetujui. Kalau Admin bisa mengosongkannya sendiri, ia bisa
langsung mengisinya lagi — dan seluruh persetujuan ini jadi hiasan yang bisa
dilewati dalam dua klik.

**Jabatan penyetuju yang sedang kosong dilewati, bukan ditunggu.** Kalau jabatan
Ketua RW 19 sedang kosong, pergantian Ketua RT di bawahnya cukup disetujui Pak
Dukuh. Tanpa aturan ini satu jabatan kosong akan mengunci pergantian selamanya.

**Kalau tidak ada satu pun yang bisa menyetujui**, pengajuan ditolak dan
aplikasi menyebutkan jabatan mana yang harus diisi lebih dulu. Admin tidak pernah
bisa memutuskan sendirian.

**Warga yang diusulkan tidak boleh sedang menjabat di tempat lain.** Satu orang
satu jabatan.

**Warga yang diusulkan harus warga wilayah jabatan itu.** Ketua RW 19 harus
warga RW 19; Ketua RT 3 harus warga RT 3. Pak Dukuh boleh dari mana pun.

**Pengajuan yang tidak dijawab siapa pun gugur setelah 30 hari**, begitu juga
kalau warga yang diusulkan ternyata pindah atau meninggal.

**Tidak ada pemberitahuan otomatis.** Penyetuju baru tahu ada pengajuan saat ia
membuka aplikasi — tidak ada SMS, WhatsApp, maupun email. Kalau pergantiannya
mendesak, beri tahu orangnya secara langsung.

**Riwayat pengajuan tidak pernah dihapus.** Siapa mengusulkan siapa, siapa
menyetujui, dan kapan — semuanya tersimpan permanen dan bisa dibaca Admin di
menu **Akun Pengurus**.

---

## Pemeriksaan berkala oleh Dukuh bersama Admin

**Setiap 3 bulan**, dan **wajib** setiap kali ada pergantian pengurus di tingkat
mana pun. Ini satu-satunya cara mengetahui ada akun yang tertinggal aktif.

Dilakukan **berdua**: hanya Admin yang bisa membuka daftar jabatan, dan hanya
Dukuh yang tahu siapa yang sebenarnya sedang menjabat. Tidak ada satu orang pun
yang bisa memeriksa ini sendirian — itu memang bentuk yang diinginkan.

1. Minta Admin membuka menu **Akun Pengurus**, lalu cetak atau foto daftar
   jabatannya beserta nama pemegang tiap jabatan.
2. Bandingkan baris per baris dengan **daftar pengurus yang benar-benar sedang
   menjabat**, sesuai buku administrasi padukuhan.
3. Untuk setiap baris, jawab dua pertanyaan:
   - Apakah orang ini masih menjabat? Kalau tidak → **nonaktifkan hari itu juga.**
   - Apakah ia masih ada di jabatan yang benar? Kalau tidak → ajukan
     pergantiannya lewat langkah di atas.
4. Periksa juga arah sebaliknya: adakah jabatan yang statusnya **Kosong** padahal
   orangnya sedang menjabat? Kalau ada, itu tandanya ada pergantian yang tidak
   pernah dilaporkan — telusuri kapan terjadinya.
5. Perhatikan jabatan yang lama bertanda **"Belum ganti password"**: berarti
   pemegangnya belum pernah masuk sejak akunnya dibuat.
5. **Tulis hasil pemeriksaan di buku administrasi**, walaupun hasilnya "semua
   sesuai". Catatan bahwa pemeriksaan pernah dilakukan sama pentingnya dengan
   hasilnya — tanpa itu, tidak ada yang tahu pemeriksaan terakhir kapan.

| Tanggal periksa | Jumlah akun aktif | Sesuai? | Tindakan | Diperiksa oleh |
| --------------- | ----------------- | ------- | -------- | -------------- |
|                 |                   |         |          |                |
|                 |                   |         |          |                |

---

## Kalau tidak ada satu pun akun Admin yang bisa dipakai

Tanpa akun Admin, tidak ada yang bisa membuatkan akun pengurus baru maupun
mencabut akses akun lama. Pengurus yang sudah berhenti akan tetap bisa masuk,
dan pengurus baru tidak bisa diberi akun.

**Cara menghindarinya — lakukan sekarang, bukan nanti:** buat **dua akun
Admin** yang hidup bersamaan, dipegang dua orang berbeda. Kalau yang satu
hilang, yang lain masih bisa membuat penggantinya.

Perhatikan: karena Admin buta terhadap data warga, menambah satu akun Admin
cadangan **tidak** menambah satu orang lagi yang bisa membaca data warga. Yang
bertambah cuma kemampuan mengelola akun. Itu sebabnya cadangan ini murah.

**Kalau sudah terlanjur tidak ada:** akun Admin pertama hanya bisa dibuat ulang
dari sisi server oleh yang mengurus teknis (mengosongkan daftar akun, lalu
menyalakan ulang aplikasi dengan username & password awal yang baru). Itu
berarti bergantung pada orang luar — persis keadaan yang ingin dihindari.

- Akun Admin cadangan dipegang oleh: ............................................
- Catatan password disimpan di: ............................................

---

## Hal-hal yang sudah diputuskan

**26 Agustus 2026:**

- **NIK dan Nomor Kartu Keluarga tidak disimpan aplikasi sama sekali.** Bukan
  disembunyikan — memang tidak ada kolomnya. Karena itu tidak ada lagi halaman
  Kartu Keluarga, dan angka "jumlah KK" hilang dari halaman depan.
- **Warga tidak punya akun.** Yang bisa masuk hanya perangkat desa.
- **Pergantian pengurus lewat pengajuan + persetujuan.** Admin mengajukan,
  perangkat desa memutuskan; jabatan penyetuju yang kosong dilewati.
- **Kewenangan kelola akun ada pada Admin**, yang justru buta terhadap data
  warga. Dukuh, RW, dan RT membaca data tapi tidak bisa menyentuh akun.
- **Akun melekat pada jabatan**, dan daftarnya mengikuti RW/RT di data warga.
- **Password awal dari Admin sekali pakai** — wajib diganti pemiliknya sebelum
  bisa membuka apa pun.
- **File Excel adalah sumber data satu-satunya**, dan impor menimpa seluruh
  isinya.

**16 Agustus 2026 (masih berlaku):**

- **Warga yang meninggal atau pindah tetap dihitung** dalam "total penduduk"
  yang tampil di halaman depan. Angka itu berarti *jumlah warga yang tercatat*,
  bukan jumlah yang saat ini tinggal. Keputusan **sementara** — perlu ditinjau
  lagi kalau jumlahnya sudah banyak. Baris yang dihapus karena **salah input**
  tidak pernah ikut dihitung.
- **Penanggung jawab data warga: Bapak Lurah dan Bapak Dukuh.** Warga yang
  keberatan atau minta datanya dibetulkan mengadu ke Dukuh; kalau belum
  selesai, naik ke Lurah. Kalau ada masalah kebocoran data, Lurah yang
  berkewajiban melapor. Yang mengurus teknis **tidak** bertanggung jawab atas
  isi datanya.

---

## Akun layanan (untuk yang mengurus teknis)

Aplikasi ini berjalan di komputer sewaan (server) yang didaftarkan memakai
sebuah **alamat email**. Email itulah yang memegang kendali: yang bisa
memperpanjang sewa, membayar, memperbaiki, atau memindahkan aplikasi.

**Kalau email itu milik pribadi seseorang yang kemudian tidak bisa dihubungi,
aplikasi ini tidak bisa diselamatkan siapa pun.** Karena itu email dan akun di
bawah ini harus milik lembaga padukuhan atau desa, bukan pribadi mahasiswa,
dan password-nya harus diketahui lebih dari satu orang.

**Sudah diputuskan (16 Agustus 2026):** dipakai **email khusus yang dibuat
untuk desa**, bukan email pribadi yang juga dipakai untuk keperluan lain.

Isi daftar berikut sebelum serah terima:

- Alamat email khusus desa tersebut: ....................................
- **Siapa dari pihak desa yang tahu password email itu:** ....................................
- Akun hosting web: ....................................
- Yang mengurus teknis saat ini: ....................................
- Kontaknya (dua jalur berbeda): ....................................
- Penanggung jawab dari pihak padukuhan: ....................................
- Tempat menyimpan salinan file Excel pendataan: ....................................

Dua hal yang sering terlewat dan membuat penyerahan cuma di atas kertas:

1. **Password email khusus itu harus diketahui minimal satu orang pihak desa.**
   Kalau cuma pembuatnya yang tahu, statusnya sama saja dengan email pribadi.
2. **Nomor HP dan email pemulihan** pada akun tersebut jangan menunjuk ke nomor
   atau email pribadi pembuatnya. Kalau menunjuk ke sana, siapa pun yang
   memegang nomor itu tetap bisa mengambil alih akunnya kapan saja.

**Email lembaga yang password-nya cuma diketahui satu orang punya masalah yang
sama persis dengan email pribadi.** Pastikan minimal dua orang bisa membukanya,
dan catat siapa saja.

---

## Mengalihkan akun Admin

Dilakukan **sebelum** pemegang Admin yang sekarang berhenti terlibat — bukan
sesudahnya.

Peran ini berpindah lewat **pembuatan akun baru, bukan penyerahan password.**
Password akun lama tidak pernah diberikan ke penggantinya: kalau dua orang
memakai akun yang sama, catatan perubahan tidak bisa lagi membedakan siapa
melakukan apa — justru pada peran yang paling perlu bisa dibedakan.

1. Admin yang menjabat membuatkan **akun Admin baru** untuk penggantinya.
2. Penggantinya masuk, **mengganti password awalnya** (dituntut aplikasi), dan
   memastikan ia bisa membuka menu **Akun Pengurus**.
3. **Setelah langkah 2 terbukti berhasil**, akun Admin lama berhenti dipakai.
   (Akun Admin tidak ikut mekanisme persetujuan — ia bukan jabatan padukuhan.)
4. Perbarui bagian [Akun layanan](#akun-layanan-untuk-yang-mengurus-teknis) di
   atas, termasuk kontaknya.

> **Urutan langkah 2 sebelum 3 tidak boleh dibalik.** Menonaktifkan akun lama
> sebelum akun baru terbukti bisa dipakai adalah cara paling umum sebuah sistem
> menjadi tidak bisa dikelola siapa pun.
