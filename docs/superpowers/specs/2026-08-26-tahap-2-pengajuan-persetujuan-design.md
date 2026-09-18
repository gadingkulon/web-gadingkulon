# Desain Tahap 2: Pengajuan & Persetujuan Pergantian Pengurus

Tanggal: 2026-08-26

Melanjutkan `2026-08-26-empat-peran-pergantian-pengurus-design.md` bagian 7,
yang sengaja menyisakan tiga keadaan saling mengunci. Dokumen ini
menyelesaikannya dan merinci alurnya.

## Inti perubahan

Tahap 2 **tidak menambah kemampuan baru, ia memindahkan kekuasaan.** Sekarang
Admin memutuskan siapa menduduki kursi mana. Setelah ini Admin hanya
**menjalankan** keputusan; yang memutuskan adalah perangkat desa sendiri.

## Keputusan

1. **Persetujuan hanya untuk kursi yang sedang TERISI.** Kursi kosong tetap
   diisi Admin langsung tanpa persetujuan siapa pun.
2. **Tombol Cabut Akses dicabut.** Kursi hanya menjadi kosong lewat pergantian
   yang disetujui.
3. **Kursi yang kosong dilewati, bukan dihitung sebagai suara yang belum
   masuk.** Ini menyelesaikan ketiga kebuntuan sekaligus.
4. **Pengajuan menyimpan salinan identitas kandidat**, bukan hanya tautannya.
5. **Riwayat pengajuan & persetujuan tidak pernah dihapus** — itulah catatan
   permanen perpindahan jabatan.

### Kenapa (1) dan (2) harus berpasangan

Kalau Admin masih bisa mencabut akses sendiri, ia bisa mengosongkan kursi lalu
mengisinya langsung — persetujuan jadi hiasan yang bisa dilewati dalam dua
klik. Karena itu keduanya satu paket: mengisi kursi kosong bebas, mengosongkan
kursi terisi tidak bisa sama sekali kecuali lewat pergantian yang lolos.

Efek sampingnya justru diinginkan: **memulai dari nol tetap mungkin.** Instalasi
baru berisi kursi kosong semua, dan Admin mengisinya satu per satu tanpa
terkunci menunggu penyetuju yang belum ada.

## Alur satu pergantian

1. **Admin mengajukan.** Pilih kursi terisi → "Ajukan Pergantian" → cari warga
   pengganti. Belum ada yang berubah pada tahap ini.
2. **Pengajuan muncul di akun penyetujunya**, dan hanya di sana.
3. **Penyetuju menjawab** setuju atau tolak dari akunnya masing-masing.
4. **Begitu semua penyetuju setuju**, jabatan berpindah: akun lama dinonaktifkan
   seketika, kursi tercatat kosong atas nama kandidat yang lolos.
5. **Admin membuatkan kredensial** untuk penghuni baru — jalur yang sudah ada
   sejak Tahap 1, termasuk kewajiban ganti password.

## Siapa menyetujui apa

| Kursi yang diganti | Penyetuju                                    |
| ------------------ | -------------------------------------------- |
| Ketua RT           | Ketua RW wilayahnya **dan** Dukuh            |
| Ketua RW           | Dukuh                                        |
| Dukuh              | seluruh Ketua RW                             |

**Butuh persetujuan bulat dari penyetuju yang kursinya terisi.** Satu penolakan
membuat pengajuan gugur seketika.

**Daftar penyetuju dihitung ulang setiap kali ada yang menjawab**, bukan
dibekukan saat pengajuan dibuat. Kalau dibekukan, kursi yang berganti di tengah
jalan meninggalkan daftar penyetuju yang menunjuk orang yang sudah tidak
menjabat.

### Kursi kosong dilewati

Penyetuju yang kursinya sedang kosong tidak dihitung — bukan dianggap "belum
menjawab". Tanpa aturan ini, tiga keadaan mengunci sistem secara permanen:

- Kursi RW kosong → pergantian Dukuh mustahil selamanya (butuh seluruh RW).
- Kursi Dukuh kosong → seluruh pergantian RW dan RT ikut buntu.
- Kursi RW kosong → pergantian RT di bawahnya buntu.

**Satu pengecualian: pengajuan yang tidak punya satu pun penyetuju ditolak saat
dibuat**, dengan pesan yang menyebut kursi mana yang harus diisi lebih dulu.
Melewatkan semua penyetuju berarti Admin memutuskan sendirian — persis yang
dicegah seluruh mekanisme ini.

## Aturan yang ditegakkan sistem

- Kandidat tidak boleh sedang menduduki kursi lain.
- Satu kursi tidak boleh punya dua pengajuan yang masih berjalan.
- Admin tidak pernah bisa menyetujui, termasuk lewat panggilan langsung.
- Penyetuju hanya melihat pengajuan yang memang ditujukan kepadanya.
- Satu penyetuju satu suara per pengajuan; jawabannya tidak bisa diubah.
- Pengajuan **gugur otomatis** begitu tidak mungkin lagi lolos.
- Pengajuan gugur kalau kandidatnya hilang dari data atau berstatus
  `PINDAH`/`MENINGGAL` pada saat dievaluasi.
- Pengajuan yang tidak dijawab **30 hari** dianggap gugur.

Dua yang terakhir diperiksa **saat pengajuan dibaca atau dijawab**, bukan lewat
tugas latar. Tidak ada penjadwal di aplikasi ini, dan menambahkannya berarti
satu proses lagi yang harus dirawat orang setelah KKN.

## Data yang disimpan

**Tabel `pengajuan`** — satu baris per usulan pergantian: kursi yang dituju,
identitas kandidat, status, siapa mengajukan, kapan, dan kapan selesai.

**Salinan identitas kandidat ikut disimpan** (nama, RT, RW) di samping Kode
Warganya. Kode Warga adalah tautan hidup ke data penduduk, tapi impor Excel
berikutnya bisa mengubah nama atau alamat orang itu — dan riwayat pergantian
harus tetap terbaca sebagaimana keadaannya saat itu.

**Tabel `persetujuan`** — satu baris per jawaban: pengajuan mana, penyetuju
siapa, setuju atau tolak, kapan. Pasangan (pengajuan, penyetuju) unik.

Keduanya **tidak pernah dihapus**. Riwayat inilah catatan permanen perpindahan
jabatan — dan sekaligus alasan tabel `audit_log` terpisah belum diperlukan:
yang paling perlu ditelusuri sudah tercatat di sini, dengan nilai sebelum dan
sesudah yang jelas.

## Layar baru

**Admin:** tombol "Ajukan Pergantian" pada tiap kursi terisi, kotak pencarian
warga yang menampilkan "Nama — RT/RW" pada tiap barisnya, dan daftar pengajuan
berjalan lengkap dengan siapa yang sudah menjawab apa.

**Pengurus (Dukuh/RW/RT):** kotak "Menunggu persetujuan Anda" di halaman
utamanya, berisi hanya pengajuan yang ditujukan kepadanya.

Tombol **Cabut Akses** hilang dari halaman Admin.

## Penanganan error

| Keadaan | Yang terjadi |
| ------- | ------------ |
| Kandidat sedang menduduki kursi lain | pengajuan ditolak saat dibuat |
| Kursi sudah punya pengajuan berjalan | ditolak saat dibuat |
| Tidak ada satu pun penyetuju | ditolak, sebut kursi yang harus diisi dulu |
| Bukan penyetuju yang ditunjuk | 403, dan pengajuannya memang tidak terlihat olehnya |
| Sudah pernah menjawab | ditolak, jawaban tidak bisa diubah |
| Kandidat pindah/meninggal | pengajuan gugur saat dievaluasi |

## Batasan yang diterima sadar

- **Tidak ada pembatalan pengajuan oleh Admin.** Yang salah usul menunggu
  ditolak penyetujunya, atau gugur setelah 30 hari. Menambah tombol batal
  berarti Admin bisa menarik pengajuan yang sedang tidak disukainya sebelum
  suara terakhir masuk.
- **Tidak ada notifikasi.** Penyetuju baru tahu ada pengajuan saat ia membuka
  aplikasi. Tidak ada SMS/WhatsApp/email di aplikasi ini, dan itu keputusan
  yang tidak dibuka lagi.
- **Kandidat dipilih dari data penduduk apa adanya.** Kalau seseorang belum ada
  di file Excel, ia belum bisa diusulkan.
- **Jawaban tidak bisa diubah.** Salah pencet berarti pengajuan itu selesai dan
  harus diajukan ulang — disengaja, supaya tidak ada tawar-menawar setelah
  suara masuk.
- **Tidak ada rate limit** (utang lama, belum dibayar).
