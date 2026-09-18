# Desain Autentikasi & Otorisasi SIDUK

Tanggal: 2026-08-12
Revisi: 2026-08-16 — tiga tingkat peran, pembatasan wilayah, mutasi data warga,
siklus hidup akun pengurus tanpa masa berlaku.

## Konteks

Aplikasi dipakai satu padukuhan (~350 KK, ~1.200 jiwa, 5 RT) sebagai proyek KKN.
Dua batasan menentukan seluruh desain:

1. **Nol biaya, tanpa toleransi.** Tidak boleh ada layanan berbayar, sekarang
   maupun nanti.
2. **Tidak ada developer yang standby setelah KKN.** Apa pun yang bisa rusak
   diam-diam akan rusak diam-diam, dan tidak ada yang memperbaikinya.

Populasi penggunanya: banyak lansia, awam teknologi, HP Android kelas bawah.
Data kependudukan sudah lengkap hasil import Excel — warga tidak mendaftarkan
NIK baru.

**Batasan ketiga, ditambahkan pada revisi 2026-08-16: server diserahkan ke
padukuhan sekaligus di akhir masa KKN.** Tidak ada masa transisi, tidak ada
periode pendampingan bertahap. Sejak hari penyerahan, tidak ada satu pun pihak
teknis yang otomatis terlibat.

## Rancangan awal yang dibatalkan

Rancangan awal: warga registrasi mandiri dengan NIK + nomor HP + email, lalu
menerima token lewat WhatsApp/SMS atau email. Dibatalkan setelah diperiksa:

- **WhatsApp Cloud API tidak punya jatah gratis bulanan.** Sejak 1 Juli 2025
  Meta menagih per pesan terkirim. Template kategori *authentication* — yang
  wajib dipakai untuk OTP — di Indonesia ±Rp356,65/pesan + PPN 11%. Yang gratis
  di dalam *customer service window* hanya template *utility*; memakai kategori
  utility untuk mengirim OTP adalah pelanggaran kebijakan Meta. Ditambah syarat
  verifikasi bisnis dengan dokumen badan hukum dan nomor telepon khusus.
- **Gateway tidak resmi (Fonnte, Wablas) tetap berbayar**, melanggar ToS
  WhatsApp (risiko blokir permanen ditanggung pengguna), dan mensyaratkan satu
  HP dengan WhatsApp tetap online selamanya.
- **SMS OTP** Rp20–690/pesan lewat rute premium. Tidak ada tier gratis.
- **Email gratis** (Brevo ±300/hari, Resend 3.000/bulan) kuotanya cukup, tapi
  mayoritas lansia tidak bisa mengakses emailnya sendiri — banyak yang alamat
  Gmail-nya dibuatkan konter dan tidak pernah dibuka. Setiap token yang tidak
  sampai menjadi beban support yang tidak akan ada yang menangani.

Selain soal biaya, rancangan awal punya lubang keamanan: token dikirim ke
nomor/email yang **diketik pendaftar**, sehingga sistem hanya membuktikan
penguasaan nomor tersebut — bukan kepemilikan NIK. Siapa pun yang memegang
fotokopi KTP orang lain bisa mengklaim akunnya.

## Keputusan

1. **Login pertama warga: NIK + tanggal lahir → wajib menetapkan PIN 6 digit.**
   Keduanya sudah ada di data master, jadi tidak ada registrasi dan tidak ada
   aktivasi manual oleh pengurus. Login berikutnya: NIK + PIN.
2. **Nomor HP & email dikumpulkan lewat form opsional setelah masuk.** Keduanya
   adalah data yang ingin dikumpulkan padukuhan, bukan kunci masuk — dua
   kebutuhan berbeda yang sebelumnya tergabung menjadi satu alur.
3. **Warga melihat data dirinya + seluruh anggota Kartu Keluarganya.**
4. **Tiga tingkat peran: `WARGA`, `PENGURUS`, `ADMIN`.** Menggantikan satu peran
   `ADMIN` datar yang dipakai revisi pertama. Rinciannya di bagian
   [Tiga tingkat peran](#tiga-tingkat-peran).
5. **Lupa PIN → pengurus me-reset**, warga mengulang aktivasi. Tidak ada
   pemulihan mandiri, tidak ada OTP, tidak ada email, tidak ada WhatsApp.
6. **Tidak ada pemilih peran di layar masuk.** Halaman utama adalah form warga;
   pengurus lewat tautan kecil ke `/login/petugas`. Peran dibaca dari akun.
7. **NIK yang akunnya sudah aktif tidak bisa diklaim ulang** lewat tanggal
   lahir. Sekali aktif, satu-satunya jalan masuk adalah PIN atau reset oleh
   pengurus.
8. **Siklus hidup akun pengurus hanya lewat kolom boolean `aktif`.** Tidak ada
   masa berlaku, tidak ada tanggal, tidak ada perbandingan waktu di mana pun.
   Rinciannya di bagian berikut.
9. **Pengurus bisa menambah, mengubah, dan menghapus data warga lewat web**,
   dibatasi wilayah kerjanya. Rinciannya di
   [Mutasi data warga](#mutasi-data-warga).

## Siklus hidup akun pengurus

Karena server diserahkan sekaligus, tidak ada pihak yang akan menjalankan
pemeliharaan berkala. Segala mekanisme yang bergantung pada perjalanan waktu —
masa berlaku akun, penonaktifan otomatis pada tanggal tertentu, pengecekan
kedaluwarsa di setiap request — dibuang dari desain. Bukan ditunda, bukan
disimpan sebagai opsi: dibuang.

Alasannya: mekanisme berbasis waktu yang tidak ada yang mengawasi akan gagal ke
salah satu dari dua arah, dan dua-duanya buruk. Kalau terlalu ketat, seluruh
pengurus terkunci di luar sistem pada suatu hari tanpa ada yang bisa membuka.
Kalau terlalu longgar, ia cuma menambah kode dan kasus uji tanpa menahan apa
pun. Menambah aturan tanggal juga menyeret pembahasan zona waktu, batas
inklusif, dan pengecualian per jabatan — semuanya kompleksitas yang harus
dirawat orang yang tidak ada.

**Satu-satunya mekanisme yang tersisa adalah kolom boolean `aktif` pada tabel
akun pengurus.** Akun `aktif = false` ditolak saat login dan tidak bisa dipakai
sama sekali. Tidak ada pengecualian per jabatan: akun Dukuh pun tunduk pada
kolom yang sama.

### Konsekuensi yang diterima sadar

Ini menggeser pengaman dari teknis ke prosedural. **Akun pengurus yang sudah
tidak menjabat tetap bisa masuk dan tetap bisa mengubah data warga sampai ada
manusia yang menonaktifkannya secara manual.** Kalau tidak ada yang
menonaktifkan, akun itu hidup selamanya.

Ini konsekuensi yang dipilih sadar, bukan celah yang terlewat. Sistem sengaja
tidak punya rem otomatis di sini. Yang menggantikannya adalah
`docs/PROSEDUR-PENGURUS.md` — dan karena itulah dokumen tersebut naik status
dari catatan pendukung menjadi bagian dari pengaman sistem. Kalau prosedur itu
tidak dijalankan, tidak ada lapisan lain di belakangnya.

Dua utang implementasi di bagian [Utang implementasi](#utang-implementasi)
menjadi lebih penting justru karena keputusan ini.

### Data akun pengurus

Kolom yang dibutuhkan tabel akun pengurus:

| Kolom      | Isi                                                       |
| ---------- | --------------------------------------------------------- |
| `username` | kunci login                                                |
| `password_hash` | bcrypt                                                |
| `nama`     | nama pengurus                                              |
| `jabatan`  | teks tampilan ("Dukuh", "Ketua RW 019", "Ketua RT 03")     |
| `role`     | `PENGURUS` atau `ADMIN`                                    |
| `rw`       | nullable — cakupan wilayah, lihat [Pembatasan wilayah](#pembatasan-wilayah) |
| `rt`       | nullable — idem                                            |
| `aktif`    | boolean, satu-satunya mekanisme siklus hidup               |

Tidak ada kolom tanggal apa pun di tabel ini selain metadata pembuatan.

### Data mock akun pengurus

Tiga baris, identitas fiktif semua:

| username | nama            | jabatan       | role     | rw    | rt    | aktif |
| -------- | --------------- | ------------- | -------- | ----- | ----- | ----- |
| `dukuh`  | Ki Demang Suryanto | Dukuh      | PENGURUS | NULL  | NULL  | true  |
| `rt03`   | Fajar Nugraha   | Ketua RT 03   | PENGURUS | `019` | `003` | true  |
| `rt05`   | Sri Wulandari   | Ketua RT 05   | PENGURUS | `019` | `005` | false |

Baris ketiga ada supaya jalur "akun nonaktif ditolak" punya data ujinya. Akun
`ADMIN` tidak ikut di-mock — ia dibuat lewat bootstrap, lihat
[Bootstrap akun ADMIN pertama](#bootstrap-akun-admin-pertama).

## Tiga tingkat peran

### WARGA

Melihat data dirinya sendiri dan seluruh anggota Kartu Keluarganya. Tidak ada
yang berubah dari yang sudah berjalan.

### PENGURUS

Dukuh, Ketua RW, dan Ketua RT. Kewenangannya:

- Melihat seluruh data warga padukuhan dan infografis.
- **Menambah, mengubah, dan menghapus data warga langsung lewat web**, dibatasi
  wilayah kerjanya.
- Mereset PIN warga yang lupa, dibatasi wilayah kerjanya.

Menambah dan mengubah data warga di sini adalah **fitur normal aplikasi dengan
formulir sendiri** — layar isian dengan validasi, sama seperti fitur lain yang
dipakai sehari-hari. Ini bukan akses administratif ke database, bukan konsol
SQL, dan bukan jalur ekspor data mentah. Pengurus tidak pernah melihat tabel,
tidak pernah menulis query, dan tidak bisa menyentuh baris di luar apa yang
formulirnya izinkan.

**PENGURUS tidak bisa mengelola akun pengurus mana pun, termasuk akunnya
sendiri.** Tidak bisa membuat, tidak bisa menonaktifkan, tidak bisa mereset
password — baik milik orang lain maupun milik sendiri.

### ADMIN

Akun pemeliharaan tingkat sistem. Punya semua kewenangan PENGURUS, ditambah:

- Membuat akun pengurus baru.
- Menonaktifkan akun pengurus (`aktif = false`).
- Mereset password akun pengurus.
- Membaca log audit.

ADMIN adalah **peran, bukan orang, dan bukan jabatan di padukuhan.** Ia melekat
pada fungsi "yang memelihara web ini". Saat ini pemegangnya adalah pengembang
aplikasi (tim KKN); setelah masa KKN ia dialihkan ke siapa pun yang melanjutkan
pemeliharaan — tim KKN periode berikutnya, perangkat desa yang ditunjuk, atau
vendor. Prosedur pengalihannya di
[Pengalihan akun ADMIN](#pengalihan-akun-admin).

Ditulis sebagai peran, bukan nama, justru karena pemegangnya pasti berganti.
Dukuh, Ketua RW, dan Ketua RT **bukan** ADMIN — ketiganya PENGURUS. Tidak ada
jabatan di padukuhan yang otomatis mendapat peran ADMIN.

Kewenangan ADMIN atas data warga tidak dibatasi wilayah.

## Matriks kewenangan

`✅` = boleh. `❌` = ditolak 403. `◐` = boleh, tapi terbatas — keterangannya di
kolom catatan.

| Endpoint | Publik | WARGA | PENGURUS | ADMIN | Catatan |
| -------- | ------ | ----- | -------- | ----- | ------- |
| `POST /auth/warga/aktivasi/cek` | ✅ | — | — | — | throttled per NIK+IP |
| `POST /auth/warga/aktivasi/set-pin` | ✅ | — | — | — | tiket sekali pakai |
| `POST /auth/warga/login` | ✅ | — | — | — | |
| `POST /auth/login` | ✅ | — | — | — | ditolak bila `aktif = false` |
| `GET /publik/statistik` | ✅ | ✅ | ✅ | ✅ | hanya cacah per RW |
| `POST /auth/logout` | ❌ | ✅ | ✅ | ✅ | |
| `PATCH /auth/me/kontak` | ❌ | ◐ | ❌ | ❌ | hanya kontak diri sendiri |
| `GET /penduduk/nik/{nik}` | ❌ | ◐ | ✅ | ✅ | WARGA: NIK sendiri saja |
| `GET /kartu-keluarga/{noKK}` | ❌ | ◐ | ✅ | ✅ | WARGA: KK sendiri saja |
| `GET /penduduk` | ❌ | ❌ | ✅ | ✅ | seluruh padukuhan, tidak dibatasi wilayah |
| `GET /infografis` | ❌ | ❌ | ✅ | ✅ | seluruh padukuhan, tidak dibatasi wilayah |
| `POST /auth/warga/{nik}/reset-pin` | ❌ | ❌ | ◐ | ✅ | **turun dari ADMIN-only**, dibatasi wilayah |
| `POST /penduduk` | ❌ | ❌ | ◐ | ✅ | baru — dibatasi wilayah |
| `PATCH /penduduk/{nik}` | ❌ | ❌ | ◐ | ✅ | baru — dibatasi wilayah |
| `PATCH /penduduk/{nik}/status` | ❌ | ❌ | ◐ | ✅ | baru — dibatasi wilayah |
| `DELETE /penduduk/{nik}` | ❌ | ❌ | ◐ | ✅ | baru — dibatasi wilayah, soft delete |
| `GET /pengurus` | ❌ | ❌ | ❌ | ✅ | baru |
| `POST /pengurus` | ❌ | ❌ | ❌ | ✅ | baru |
| `PATCH /pengurus/{id}/aktif` | ❌ | ❌ | ❌ | ✅ | baru |
| `POST /pengurus/{id}/reset-password` | ❌ | ❌ | ❌ | ✅ | baru |
| `GET /audit` | ❌ | ❌ | ❌ | ✅ | baru — lihat [Utang implementasi](#utang-implementasi) |

## Batas tegas: kelola warga vs kelola akun

Dua hal ini sering tertukar dalam pembicaraan. Di sistem, keduanya dipisah
tegas dan pemisahannya tidak boleh dilunakkan.

### Kelola data warga — kewenangan PENGURUS (dan ADMIN)

Menambah warga, mengubah data warga, menandai warga pindah atau meninggal, dan
mereset PIN warga yang lupa.

**Reset PIN warga masuk kategori ini**, bukan kategori kelola akun. Sifatnya
layanan harian: warga lupa PIN lalu datang ke Ketua RT-nya membawa KTP. Ia
tidak akan mencari "pemelihara sistem", dan seharusnya memang tidak perlu.

> **Perubahan dari kondisi berjalan.** Endpoint
> `POST /auth/warga/{nik}/reset-pin` saat ini dijaga `current_admin` dan hanya
> bisa dipakai role `ADMIN` (`backend/app/api/routers/auth.py`). Dengan revisi
> ini, endpoint tersebut **turun menjadi kewenangan PENGURUS**, ditambah
> pembatasan wilayah. Ini satu-satunya kewenangan yang berkurang tingkatnya
> pada revisi ini — sisanya bertambah.

### Kelola akun pengurus — kewenangan ADMIN saja

Membuat akun pengurus baru, menonaktifkan akun pengurus, dan mereset password
pengurus. **Tidak bisa didelegasikan ke PENGURUS dalam bentuk apa pun** — tidak
lewat flag per akun, tidak lewat pengecualian jabatan, tidak lewat "boleh untuk
akun di bawahnya".

### Kenapa dipisah

Setelah masa berlaku akun dihapus, pencabutan hak akses secara manual adalah
satu-satunya rem yang tersisa. Rem itu tidak boleh dipegang oleh orang yang bisa
menjadi objek pencabutan itu sendiri.

Kalau PENGURUS bisa mengelola akun pengurus, seorang pengurus yang seharusnya
dinonaktifkan bisa mengaktifkan dirinya kembali, atau menonaktifkan orang yang
hendak menonaktifkannya. Rem yang bisa dilepas oleh yang direm bukan rem.

Ini juga alasan PENGURUS tidak bisa mengelola akunnya sendiri, bukan sekadar
akun orang lain: batas yang ada pengecualiannya untuk diri sendiri adalah batas
yang sama saja tidak ada.

## Pembatasan wilayah

Kewenangan mutasi PENGURUS dibatasi wilayah kerjanya:

| Jabatan  | Cakupan mutasi           | `rw`   | `rt`   |
| -------- | ------------------------ | ------ | ------ |
| Dukuh    | seluruh padukuhan        | NULL   | NULL   |
| Ketua RW | seluruh RT di dalam RW-nya | terisi | NULL   |
| Ketua RT | RT-nya saja              | terisi | terisi |

Dua kolom nullable, dibaca sebagai cakupan yang makin sempit: `rw` NULL berarti
tak terbatas RW, `rt` NULL berarti tak terbatas RT di dalam RW tersebut. ADMIN
tidak tunduk pada kolom ini.

### Satu helper tunggal

Seluruh pengecekan wilayah lewat **satu** fungsi, misalnya
`boleh_akses(pengurus, warga) -> bool`, dan setiap endpoint mutasi
memanggilnya. Logika pembatasan tidak boleh disebar ke masing-masing endpoint.

Alasannya bukan soal kerapian: aturan yang ditulis ulang di enam tempat akan
berbeda di salah satunya, dan yang berbeda itu tidak akan ketahuan sampai
seseorang mengubah data yang tidak boleh disentuhnya. Satu fungsi berarti satu
tempat yang perlu dibaca untuk tahu aturannya, dan satu tempat yang perlu
diperbaiki kalau aturannya salah.

Endpoint mutasi menolak dengan **403**, bukan 404, ketika warga sasaran ada tapi
di luar wilayah. Pengurus padukuhan saling kenal dan datanya bukan rahasia
antar-pengurus; menyamarkan keberadaan warga di sini cuma bikin pesan errornya
membingungkan tanpa menyembunyikan apa pun yang belum diketahui.

### Baca tidak dibatasi wilayah

**Keputusan: `GET /penduduk` dan `GET /infografis` tetap mencakup seluruh
padukuhan untuk semua PENGURUS.** Yang dibatasi wilayah hanya mutasi.

Alasannya:

1. **Infografis tingkat padukuhan adalah gunanya aplikasi ini.** Ketua RT yang
   cuma bisa melihat grafik RT-nya sendiri kehilangan seluruh manfaat
   perbandingan, dan itu justru pemakaian yang paling sering.
2. **Koordinasi antar-pengurus butuh lihat data tetangga.** Warga pindah antar-RT
   di dalam padukuhan yang sama adalah kejadian biasa, dan kedua Ketua RT perlu
   melihat data yang sama untuk menyelesaikannya.
3. **Risiko baca dan risiko tulis tidak setara.** Salah lihat tidak merusak apa
   pun. Salah simpan merusak data warga dan baru ketahuan berbulan kemudian.
   Pembatasan diletakkan di tempat kerusakannya ada.
4. Data yang bisa dilihat pengurus adalah data yang memang jadi tanggung jawab
   padukuhan, dan seluruh pengurus sudah punya akses fisik ke arsip yang sama
   dalam bentuk kertas.

### Kenapa ada pembatasan sama sekali

Bukan karena curiga kepada pengurus. Di padukuhan yang pengurusnya saling kenal
dan bertemu tiap minggu, seorang Ketua RT yang mengubah data warga RT lain
hampir pasti sedang salah klik — salah baris di daftar, salah tab yang masih
terbuka — bukan sedang berniat buruk.

Pembatasan wilayah membuat salah klik itu mustahil, bukan membuatnya
tertangkap belakangan. Ini pengaman terhadap kekeliruan, dan itu memang jenis
kesalahan yang akan benar-benar terjadi di sini.

## Mutasi data warga

Backend saat ini nol endpoint tulis — seluruhnya `GET` kecuali jalur auth. Ini
kemampuan yang benar-benar baru, dan bagian ini merancangnya saja.

Seluruh endpoint mutasi: wajib `boleh_akses()`, wajib tercatat di audit log.

### Tambah warga

Warga baru selalu menempel pada satu Kartu Keluarga, jadi nomor KK wajib
ditentukan sebelum barisnya bisa dibuat. Dua kasus:

**Kasus A — masuk ke KK yang sudah ada.** Kelahiran, atau anggota keluarga yang
pindah masuk. Pengurus memilih nomor KK yang sudah terdaftar, sistem
memvalidasi bahwa KK tersebut ada dan alamatnya diwarisi dari KK itu. Kasus ini
tidak punya pertanyaan terbuka dan bisa dirancang penuh.

**Kasus B — membuat KK baru.** Keluarga pindah masuk ke padukuhan, atau
pemekaran KK karena pernikahan.

**Keputusan (2026-08-16): nomor KK asli diambil dari desa/perangkat desa.
Untuk tahap prototipe, nomor KK baru dibangkitkan generator dummy backend.**

Nomor KK adalah nomor resmi terbitan Dukcapil, bukan nomor internal aplikasi.
Sampai data resminya diserahkan perangkat desa, aplikasi memakai nomor
bangkitan agar alur "tambah warga" bisa dites utuh.

Aturan untuk nomor bangkitan:

- Dibentuk dari `settings.SEED_KODE_WILAYAH` + nomor urut berikutnya, memakai
  pola `_no_kk()` yang sudah ada di `app/data/dummy.py`. **Bukan literal yang
  ditulis di kode** — kode wilayahnya tetap dari config, sama seperti seluruh
  data dummy lain.
- Ditandai jelas sebagai nomor sementara, supaya bisa ditemukan kembali dan
  ditimpa saat data asli masuk.

> **KEPUTUSAN TERBUKA — bagaimana nomor sementara diganti nomor asli?**
> Menggantinya berarti mengubah `noKK` seluruh anggota KK sekaligus, dan
> `noKK` adalah kunci yang dipakai `GET /kartu-keluarga/{noKK}`. Mekanisme
> penggantiannya belum dirancang. Ini baru perlu dijawab saat data resmi desa
> benar-benar siap diimpor, bukan sekarang.

### Ubah data warga

Field dibagi tiga:

| Kelompok | Field | Aturan |
| -------- | ----- | ------ |
| Bebas diubah | nama, tempat lahir, agama, status perkawinan, pendidikan, pekerjaan, golongan darah, alamat (jalan/RT/RW) | formulir biasa |
| Terkunci di UI biasa | `noKK`, `tanggalLahir`, `statusHubunganKeluarga` | perlu alur khusus, bukan field bebas |
| Terkunci penuh | `nik`, `id` | lihat di bawah |

`tanggalLahir` dikunci dari formulir biasa karena ia dipakai sebagai faktor
verifikasi aktivasi. Mengubahnya diam-diam mengubah kunci masuk warga yang
belum aktivasi, dan warga yang gagal aktivasi tidak akan tahu kenapa.

#### NIK secara khusus

**NIK adalah identitas akun, bukan sekadar kolom data.** Aktivasi
(`/auth/warga/aktivasi/cek`) dan login warga (`/auth/warga/login`) sama-sama
memakai NIK sebagai kunci, dan akun warga disimpan ber-key NIK
(`WARGA_ACCOUNTS` sekarang, tabel akun warga nanti).

Konsekuensinya: **kalau NIK seorang warga diubah, akun warga yang sudah
aktivasi ikut putus.** Baris akunnya masih menunjuk NIK lama yang tidak lagi
ada di data induk, sehingga warga tidak bisa masuk dengan PIN-nya, dan tidak
bisa aktivasi ulang karena NIK barunya belum punya akun.

Karena itu:

- NIK **tidak boleh** ada di formulir ubah data warga biasa.
- Koreksi NIK (kasus nyata: salah ketik saat import) adalah operasi terpisah
  milik ADMIN, yang secara eksplisit **menghapus akun warga lama sekalian** dan
  memberi tahu operatornya bahwa warga tersebut harus aktivasi ulang.
- Prosedur untuk warganya sama persis dengan lupa PIN: datang, bawa KTP,
  aktivasi ulang.

### Hapus warga

Soft delete dengan kolom `deleted_at` (keputusan yang sudah diambil
sebelumnya). Baris tidak pernah benar-benar dibuang.

Ada dua sebab menghapus yang maknanya berbeda dan tidak boleh dicampur:

**(a) Warga pindah atau meninggal.** Datanya sah dan pernah benar. Yang berubah
statusnya, bukan keabsahannya. Riwayatnya harus tetap ada — warga yang pindah
bisa kembali, dan data warga meninggal masih dipakai untuk keperluan
administrasi keluarganya.

**(b) Salah input.** Barisnya memang tidak pernah valid — duplikat hasil
import, atau warga yang tidak pernah ada di padukuhan ini. Tidak ada yang perlu
dipertahankan selain jejak bahwa barisnya pernah dibuat dan siapa yang
membuangnya.

**Rekomendasi: pakai dua kolom, satu untuk masing-masing sebab.**

| Sebab | Kolom | Efek |
| ----- | ----- | ---- |
| (a) pindah / meninggal | `status_kependudukan` | tetap muncul di pencarian dengan penanda status; akses akun tertutup |
| (b) salah input | `deleted_at` | hilang dari seluruh daftar, statistik, dan pencarian biasa |

**Ini tidak saya anggap kerumitan berlebih**, dengan satu alasan konkret:
`status_kependudukan` sudah dibutuhkan terlepas dari fitur hapus. CLAUDE.md §11
sudah mencatatnya sebagai syarat yang belum terpenuhi ("status kependudukan
menonaktifkan akses otomatis"), dan `docs/PROSEDUR-PENGURUS.md` sudah
menjanjikan perilakunya kepada pengurus. Kolom itu akan ada apa pun keputusan
soal hapus. Yang benar-benar ditambahkan bagian ini hanya `deleted_at`, satu
kolom nullable — dan menggabungkan dua makna ke satu kolom justru lebih mahal,
karena setiap query nanti harus menebak apakah baris yang "terhapus" itu warga
meninggal yang perlu dihitung atau duplikat yang tidak.

**Keputusan sementara (2026-08-16): warga meninggal dan pindah tetap dihitung**
di `GET /publik/statistik` dan `GET /infografis`. "Total penduduk" berarti
jumlah baris yang tercatat, bukan jumlah jiwa yang saat ini tinggal.

Yang dikecualikan dari hitungan hanya baris ber-`deleted_at` (salah input) —
baris itu memang tidak pernah valid, jadi tidak pernah boleh ikut dihitung.

Ditandai **sementara** karena begitu jumlah warga meninggal menumpuk, angka di
halaman depan akan menyimpang makin jauh dari jumlah jiwa sebenarnya, dan
angka itu dilihat publik. Yang perlu ditinjau ulang nanti: apakah cukup
mengganti labelnya jadi "jiwa tercatat", atau perlu dua angka terpisah.

### Efek samping ke akun warga

**Menambah warga = membuka jalur aktivasi akun baru.** Begitu barisnya ada di
data induk, NIK + tanggal lahir warga tersebut langsung bisa dipakai di
`/aktivasi`, tanpa langkah tambahan dari pengurus. Ini konsekuensi langsung
dari desain "tidak ada registrasi": jalur aktivasi selalu mengikuti data induk.
Artinya salah input data warga bukan cuma salah data — ia membuat jalur masuk
untuk NIK yang tidak seharusnya punya akun. Karena itu tambah warga wajib
dibatasi wilayah dan wajib masuk audit log.

**Menghapus warga = akun warganya ikut dicabut.** Aturannya:

| Kejadian | Akun warga |
| -------- | ---------- |
| `deleted_at` diisi (salah input) | akun dihapus; NIK tidak bisa aktivasi lagi |
| `status_kependudukan` jadi pindah/meninggal | akun dinonaktifkan; login ditolak; aktivasi ditolak |
| `status_kependudukan` kembali aktif (warga kembali) | akun tetap tidak ada — warga aktivasi ulang seperti biasa |

Pemulihan selalu lewat aktivasi ulang, bukan lewat "menghidupkan kembali" akun
lama. Alasannya sama dengan alasan tidak adanya pemulihan mandiri: satu jalur
pemulihan yang sudah dipahami pengurus lebih baik daripada dua jalur yang
salah satunya jarang dipakai dan karenanya jarang benar.

### Endpoint mutasi ditaruh di mana

**Keputusan: tetap di `backend/app/api/routers/penduduk.py`, sebagai
`APIRouter` kedua di file yang sama** — bukan file router baru.

Alasannya:

1. **Resource-nya sama.** `POST /penduduk` dan `GET /penduduk` adalah dua
   operasi pada koleksi yang sama. Memisahkannya ke file lain berarti orang yang
   mencari "apa saja yang bisa dilakukan ke penduduk" harus tahu dulu bahwa
   jawabannya ada di dua tempat.
2. **`APIRouter` kedua memberi yang sebenarnya dibutuhkan tanpa file baru.**
   Yang dicari dari pemisahan adalah supaya guard mutasi terpasang di satu
   tempat dan tidak bisa lupa dipasang per-endpoint. Itu didapat dengan
   mendeklarasikan router mutasi ber-`dependencies=[Depends(current_pengurus)]`
   — endpoint baru yang didaftarkan ke router itu ikut terjaga secara default,
   dan lupa memasang guard menjadi tidak mungkin, bukan sekadar tidak
   dianjurkan.
3. File itu sekarang 59 baris. Tiga endpoint mutasi tidak membuatnya jadi file
   yang sulit dibaca.

Pemisahan ke router sendiri dilakukan nanti kalau file-nya benar-benar sudah
sulit dibaca — bukan sekarang, atas dasar dugaan.

Sebaliknya, **kelola akun pengurus memang router sendiri**
(`/pengurus`), karena resource-nya memang berbeda dan guard-nya berbeda
(`current_admin`, bukan `current_pengurus`).

## Bootstrap akun ADMIN pertama

Saat database baru di-seed, tabel akun pengurus kosong — belum ada akun apa pun,
sehingga tidak ada yang bisa membuat akun pertama lewat aplikasi.

**Keputusan: satu perintah sekali jalan yang dijalankan dari terminal server,
misalnya `python -m app.bootstrap_admin`.** Perilakunya:

- Menolak jalan kalau sudah ada akun `ADMIN` di database. Ini bukan perintah
  yang bisa dipakai ulang untuk membuat ADMIN kedua.
- Meminta username dan password diketik saat itu juga. **Password tidak dibaca
  dari environment variable dan tidak punya nilai default.**
- Mencetak username yang dibuat, tidak mencetak passwordnya.

Password sengaja tidak lewat env var: nilai yang masuk `.env` cenderung tinggal
di sana selamanya, ikut ter-backup, dan terbaca siapa pun yang membuka file itu
belakangan. Password yang diketik sekali tidak meninggalkan jejak di file mana
pun.

Tidak ada mode "kalau tabel kosong, siapa pun boleh masuk sebagai admin". Selama
bootstrap belum dijalankan, `POST /auth/login` menolak semua kredensial. Sistem
yang tidak bisa dimasuki siapa pun jauh lebih mudah diperbaiki daripada sistem
yang sempat bisa dimasuki siapa pun.

## Pengalihan akun ADMIN

Peran ADMIN berpindah ke pemelihara berikutnya lewat **pembuatan akun baru,
bukan penyerahan password akun lama.**

1. Pemelihara berikutnya ditentukan dan dicatat di buku administrasi padukuhan.
2. ADMIN yang menjabat membuat akun ADMIN baru untuk orang tersebut.
3. Pemelihara baru masuk, mengganti passwordnya sendiri, dan memastikan ia bisa
   membuka daftar akun pengurus.
4. **Baru setelah langkah 3 terbukti berhasil**, ADMIN lama menonaktifkan
   akunnya sendiri — atau, kalau ia tidak bisa menonaktifkan akun ADMIN
   miliknya sendiri, ADMIN baru yang menonaktifkannya.
5. Pergantian dicatat di buku administrasi padukuhan.

Urutan langkah 3 sebelum 4 tidak boleh dibalik. Menonaktifkan akun lama sebelum
akun baru terbukti bisa dipakai adalah cara paling umum sebuah sistem menjadi
tidak bisa dikelola siapa pun.

Password akun ADMIN lama tidak pernah diserahkan ke penggantinya. Akun yang
dipakai bergantian membuat log audit tidak bisa membedakan siapa melakukan apa,
dan itu justru pada peran yang paling perlu bisa dibedakan.

Penerusnya sudah ditetapkan: pengurus dari kelurahan yang bersedia memelihara
aplikasi setelah masa KKN. Sisa celahnya — kalau pemegang ADMIN tidak bisa
dihubungi sebelum sempat mengalihkan — dibahas di
[Pemulihan akun ADMIN](#pemulihan-akun-admin--sebagian-terjawab).

## Alur

1. **Aktivasi** (`/aktivasi`) — NIK + tanggal lahir → server verifikasi ke data
   master → tiket sekali pakai + nama pemilik NIK → warga mengonfirmasi namanya
   (menangkap salah ketik NIK sebelum PIN dibuat) → buat PIN → sesi aktif.
2. **Masuk warga** (`/login`) — NIK + PIN.
3. **Masuk pengurus** (`/login/petugas`) — username + password. Ditolak bila
   `aktif = false`.
4. **Lengkapi kontak** (`/kontak`) — opsional, boleh dilewati.
5. **Reset PIN warga** — warga menemui pengurus membawa KTP → pengurus menekan
   Reset PIN pada data warga → akun kembali ke keadaan belum aktif.
6. **Kelola data warga** — pengurus membuka data penduduk, memakai formulir
   tambah/ubah/hapus dalam batas wilayahnya.
7. **Kelola akun pengurus** — ADMIN membuka daftar akun pengurus, membuat
   akun baru atau menonaktifkan akun lama.

## Batasan yang diterima sadar

- **Tanggal lahir bukan rahasia** bagi yang memegang Kartu Keluarga. Diterima
  karena ancaman realistisnya tetangga penasaran, bukan penyerang serius.
  Tingkat keamanan disepadankan dengan taruhannya. Perlu dicatat bahwa
  taruhannya naik pada revisi ini: warga tetap baca-saja, tapi pengurus kini
  bisa menulis — dan itulah kenapa jalur pengurus dijaga password, wilayah, dan
  audit log, bukan tanggal lahir.
- **Celah klaim duluan:** untuk NIK yang belum pernah diaktifkan, orang lain
  bisa mengaktifkannya lebih dulu. Mitigasi: throttling di backend, log audit,
  dan reset oleh pengurus. Terdeteksi saat warga asli mengeluh tidak bisa masuk.
- **Tidak ada pemulihan mandiri.** Lupa PIN wajib lewat pengurus. Ini
  konsekuensi yang dipilih sengaja: satu-satunya alternatif adalah mesin
  pemulihan otomatis yang berbiaya, rapuh, dan tidak ada yang merawatnya.
- **Akun pengurus tidak punya rem otomatis.** Sudah dibahas di
  [Konsekuensi yang diterima sadar](#konsekuensi-yang-diterima-sadar). Diulang
  di sini supaya tidak terlewat saat orang cuma membaca bagian ini.

## Yang wajib ditegakkan backend

Guard frontend hanya UX. Backend wajib: menyimpan PIN & password sebagai hash;
men-throttle endpoint cek aktivasi per NIK dan per IP (ruang tanggal lahir
kecil — ini titik terlemah jalur warga); membuat tiket aktivasi sekali pakai
dan berumur pendek; mengunci login sementara setelah beberapa PIN salah;
menentukan otorisasi data dari klaim sesi dan bukan parameter request; menolak
login akun pengurus yang `aktif = false`; memanggil `boleh_akses()` di setiap
endpoint mutasi; membatasi kelola akun pengurus hanya untuk `ADMIN`; mencatat
seluruh mutasi dan reset di log audit; serta menutup akses akun warga dari
status kependudukan (pindah/meninggal).

## Utang implementasi

Dua keputusan lama yang belum dikerjakan. Keduanya tetap berlaku, tapi
**alasannya berubah** pada revisi ini dan bobotnya naik.

### Session token server-side, bukan JWT

`backend/app/core/security.py` sekarang masih memakai JWT dengan TTL 12 jam
(`settings.JWT_TTL_JAM`). Token yang sudah diterbitkan tetap sah sampai
kedaluwarsa sendiri — server tidak punya cara membatalkannya.

**Alasan lama:** kerapian dan kemudahan logout.

**Alasan sekarang:** menonaktifkan akun adalah satu-satunya cara memutus akses
yang tersisa setelah masa berlaku dihapus. Kalau pemutusan itu baru berlaku
sampai 12 jam kemudian, pengaman satu-satunya punya lubang selebar 12 jam
persis di saat ia paling dibutuhkan — momen seorang pengurus dicabut haknya.
Prosedur di `PROSEDUR-PENGURUS.md` menjanjikan "akun lama dinonaktifkan hari
itu juga", dan janji itu tidak benar selama tokennya JWT.

Yang dibutuhkan: tabel sesi server-side, `aktif = false` menghapus seluruh sesi
milik akun tersebut, dan setiap request memeriksa sesi ke database.

**Status: belum dikerjakan.**

### Audit log persisten

`backend/app/core/audit.py` sekarang hanya `print()` ke console dan menyimpan
list di memori proses — hilang setiap restart, tidak ada endpoint pembacanya.

**Alasan lama:** hanya `reset-pin` yang wajib tercatat, dan itu operasi jarang.

**Alasan sekarang:** revisi ini menambahkan mutasi data warga oleh banyak
pengurus di banyak wilayah. Audit bukan lagi catatan satu operasi langka,
melainkan satu-satunya cara menjawab "kenapa data warga ini berubah" —
pertanyaan yang pasti muncul, dan yang tidak punya sumber jawaban lain begitu
datanya sudah tertimpa.

Yang dibutuhkan:

- Tabel `audit_log` dengan minimal: aktor, aksi, NIK sasaran, waktu, **nilai
  sebelum dan sesudah**.
- Endpoint `GET /audit` untuk ADMIN. Log yang tidak bisa dibaca tanpa akses
  server sama saja tidak ada, karena yang butuh membacanya justru bukan orang
  yang punya akses server.

Nilai sebelum/sesudah adalah bagian yang paling mudah dianggap opsional dan
paling menentukan kegunaannya: "Fajar mengubah data NIK 3204…" tidak menjawab
apa pun tanpa isi perubahannya.

**Status: belum dikerjakan.**

## Keputusan yang masih terbuka

Harus dijawab sebelum sistem dipakai sungguhan. Yang bersifat prosedural
diturunkan ke `docs/PROSEDUR-PENGURUS.md`.

### Kepemilikan hosting & database setelah KKN — terjawab

**Jawaban (2026-08-16): email khusus yang dibuat untuk desa** — bukan email
pribadi pengembang yang dipakai untuk keperluan lain. Seluruh akun hosting dan
database berdiri di atas email tersebut.

Waktunya juga sudah tetap: penyerahan sekaligus di akhir masa KKN, tidak ada
periode abu-abu tempat kepemilikan bisa dianggap masih di tangan tim KKN.

Yang harus dituntaskan sebelum hari penyerahan — bukan pertanyaan terbuka,
melainkan pekerjaan yang tinggal dilakukan:

- Password email tersebut harus diketahui **minimal satu orang dari pihak
  desa**, bukan hanya pengembang. Email khusus desa yang password-nya cuma
  dipegang satu orang punya masalah yang sama persis dengan email pribadi.
- Nomor pemulihan dan email pemulihan pada akun tersebut tidak boleh menunjuk
  ke nomor atau email pribadi pengembang. Kalau menunjuk ke sana, kepemilikan
  hanya berpindah di atas kertas.

Formulir pengisiannya ada di `docs/PROSEDUR-PENGURUS.md`.

### Pemulihan akun ADMIN — sebagian terjawab

**Yang sudah terjawab (2026-08-16): penerus perannya sudah ada.** Peran ADMIN
akan dialihkan ke pengurus dari kelurahan yang bersedia memelihara aplikasi
setelah masa KKN. Prosedur pengalihannya di
[Pengalihan akun ADMIN](#pengalihan-akun-admin) — akun baru dibuat untuk orang
tersebut, bukan password lama yang diserahkan.

**Rencana pencegahan yang dipakai:** password akun ADMIN dicatat pemegangnya
supaya tidak terlupa.

**Yang masih menggantung:** mencatat password mencegah *lupa*, tapi belum
menjawab *hilang*. Kalau catatannya ikut hilang, atau pemegangnya tidak bisa
dihubungi sebelum sempat mengalihkan, sistem tetap tidak bisa dikelola siapa
pun lewat aplikasi — bootstrap menolak jalan kalau sudah ada akun ADMIN, dan
tidak ada peran lain yang boleh mengelola akun ADMIN.

**Rekomendasi yang menutup sisa celah ini dengan satu langkah:** buat akun
ADMIN untuk pengurus kelurahan tersebut **sekarang**, tidak menunggu hari
serah terima. Dua akun ADMIN yang hidup bersamaan saling menjadi cadangan —
yang satu hilang, yang lain masih bisa membuat penggantinya. Ini juga membuat
pengalihan nanti tinggal langkah menonaktifkan, bukan langkah membuat.

Yang perlu ditetapkan kalau rekomendasi di atas tidak diambil: catatan
password-nya disimpan di mana, dan siapa lagi selain pemegangnya yang tahu
tempat itu.

### Siapa pengendali data menurut UU PDP 27/2022 — terjawab

**Jawaban (2026-08-16): Lurah dan Dukuh**, yaitu Pemerintah Desa dan pengurus
padukuhan sebagai penanggung jawab di tingkat wilayah.

Bobot pertanyaan ini naik pada revisi ini karena data kependudukan kini
dimutasi banyak pengurus secara terus-menerus lewat aplikasi, bukan lagi
sekadar hasil import yang tidak berubah. Konsekuensi dari jawaban di atas:

- Warga yang keberatan atau minta koreksi data mengadu ke Dukuh; kalau tidak
  selesai, naik ke Lurah.
- Akurasi data adalah tanggung jawab jabatan tersebut, bukan tanggung jawab
  pemegang akun ADMIN. ADMIN memelihara sistemnya, bukan isinya.
- Kalau terjadi kebocoran data, Lurah yang wajib melapor.

Satu hal yang perlu dirapikan menyusul: secara hukum pengendali data adalah
**lembaga** (Pemerintah Desa / Pemerintah Kalurahan), bukan pribadi yang
sedang menjabat. Nama pejabatnya berganti, kewajibannya tidak. Penulisan
resminya perlu dicek ke perangkat desa saat dokumen serah terima disusun.
