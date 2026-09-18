# Desain Tahap 3: Batas Wilayah & Mutasi Data Warga

Tanggal: 2026-08-26

Melanjutkan `2026-08-26-empat-peran-pergantian-pengurus-design.md` dan
`2026-08-26-tahap-2-pengajuan-persetujuan-design.md`.

Dikerjakan **dua tahap**. Tahap 3a (bagian 1–5) berdiri sendiri: seluruhnya
soal membaca, jadi tidak ada data yang bisa rusak. Tahap 3b (bagian 6)
menambahkan endpoint tulis dan berdiri di atas 3a.

## Yang dibalik dari keputusan sebelumnya

Spec 26 Agustus menetapkan **baca tidak dibatasi wilayah** — semua pengurus
melihat seluruh padukuhan. Itu dipilih supaya tidak perlu penyaring wajib di
tiap endpoint.

Keputusan itu **dicabut**. Sekarang:

| Peran | Melihat & mengubah |
| ----- | ------------------ |
| `DUKUH` | seluruh padukuhan |
| `RW`    | warga RW-nya saja |
| `RT`    | warga RT-nya saja |
| `ADMIN` | tidak ada sama sekali (tidak berubah) |

Konsekuensi yang diterima sadar: **Ketua RT tidak bisa lagi memeriksa data
warga RT sebelah**, dan hanya Dukuh yang melihat gambaran utuh padukuhan.

## Keputusan

1. **Satu aturan wilayah untuk semua hal.** `pengurus.cocok_wilayah` yang sudah
   dipakai memutuskan siapa boleh menduduki sebuah kursi, dipakai juga untuk
   memutuskan warga siapa yang boleh dilihat. Aturannya memang sama persis:
   Ketua RT 004 boleh menduduki kursi RT 004 dan boleh melihat warga RT 004.
   Menulisnya dua kali berarti dua aturan yang bisa berbeda diam-diam.
2. **Cache `store.py` dicabut.** Router query database tiap request.
3. **Infografis ikut menyempit**; statistik publik tidak.
4. **Aplikasi jadi sumber kebenaran data warga** (Tahap 3b), dan karena itu
   impor Excel harus dikunci.

## 1. Cache dicabut

`app/data/store.py` selama ini membaca seluruh tabel ke memori **sekali saat
modul diimpor**, dan itu ditandai `ponytail:` sejak awal dengan catatan
"begitu ada endpoint tulis, cache ini basi". Batas itu tercapai di Tahap 3b,
tapi dicabut sekarang supaya 3b tidak menumpuk dua perubahan besar sekaligus.

`DAFTAR_PENDUDUK` (konstanta) diganti dua fungsi:

- `semua_penduduk()` — seluruh warga yang tidak ber-`deletedAt`, dibaca dari
  database tiap dipanggil.
- `penduduk_untuk(user)` — warga yang boleh dilihat pengurus ini.

Konstantanya **dihapus, bukan disimpan sebagai alias**: apa pun yang masih
menunjuk ke sana akan gagal terang-terangan, bukan diam-diam menyajikan data
basi.

**Harga yang diterima sadar:** tiap request membuka koneksi dan membaca ~385
baris. Pada beban satu padukuhan itu tidak terasa, dan menghapus seluruh urusan
"kapan cache harus disegarkan". Ditandai `ponytail:` — pindahkan penyaringan ke
`WHERE` di SQL kalau datanya nanti puluhan ribu baris.

## 2. Penyaringan wilayah

Ditegakkan di **satu tempat**, `store.penduduk_untuk(user)`, dan seluruh
endpoint baca memanggilnya. Router tidak pernah menyaring sendiri — kalau
tidak, satu endpoint yang lupa menjadi lubang yang tidak kelihatan.

Berlaku untuk:

- `GET /penduduk` — daftar
- `GET /penduduk/{id}` — **404, bukan 403**, untuk warga di luar wilayahnya.
  403 memberi tahu bahwa orang itu ada; 404 tidak memberi tahu apa-apa.
- `GET /penduduk/filter-opsi` — pilihan RT/RW/pekerjaan ikut menyempit, jadi
  Ketua RT 004 tidak melihat daftar RT lain di dropdown-nya.
- `GET /infografis`

**Tidak berlaku** untuk `GET /publik/statistik`: terbuka tanpa login, isinya
cacah se-padukuhan, dan tidak ada penggunanya untuk disaring.

`ADMIN` tidak ikut aturan ini karena tidak pernah sampai ke sana —
`current_pengurus` menolaknya lebih dulu.

## 3. Infografis menyempit

Agregat dihitung atas hasil `penduduk_untuk(user)`, bukan seluruh tabel. Grafik
Ketua RT 004 jadi tentang RT 004 saja.

Akibat yang wajar dan tidak dianggap cacat: `perDusun` milik Ketua RT hanya
berisi satu batang, karena wilayahnya memang satu RW.

## 4. Daftar kursi & pergantian

`pengurus.daftar_kursi` dan `pergantian` juga membaca `DAFTAR_PENDUDUK`.
Keduanya pindah ke `semua_penduduk()` — **tanpa** penyaringan wilayah:

- Daftar kursi diturunkan dari seluruh alamat padukuhan, dan yang membacanya
  Admin, yang tidak punya wilayah.
- Kandidat pergantian sudah dibatasi `cocok_wilayah` terhadap **kursinya**,
  bukan terhadap siapa yang mengajukan.

## 5. Frontend

Tidak ada halaman baru. Yang berubah cuma isinya menyempit sendiri, karena
backend yang menyaring.

Satu tambahan kecil: halaman Data Penduduk dan Infografis menyebutkan wilayah
yang sedang ditampilkan (mis. "RT 004 / RW 020") supaya pengurus tahu angka
yang dilihatnya bukan se-padukuhan.

## 6. Tahap 3b — mutasi data warga

Sejak tahap ini **aplikasi adalah sumber kebenaran data warga**, bukan Excel.

### Dua lapis izin

Batas wilayah Tahap 3a bekerja **per baris**: warga ini boleh disentuh atau
tidak. Tahap 3b menambahkan lapis kedua, **per kolom**:

| Kolom | Dukuh | Ketua RW | Ketua RT |
| ----- | ----- | -------- | -------- |
| nama, tempat & tanggal lahir, agama, pendidikan, pekerjaan, gol. darah, status perkawinan, status dalam keluarga, kewarganegaraan | ✅ | ✅ | ✅ |
| alamat jalan | ✅ | ✅ | ✅ |
| **RT / RW** | ✅ | ❌ | ❌ |
| statusKependudukan (`PINDAH`/`MENINGGAL`) | ✅ | ✅ | ✅ |

**Memindahkan warga antar-wilayah hanya boleh Dukuh.** Kalau Ketua RT boleh
mengubah RT seorang warga, ia bisa memindahkan orang keluar dari wilayahnya
sendiri — dan begitu tersimpan, ia tidak bisa lagi menyentuh orang itu untuk
membatalkannya. Kesalahan yang tidak bisa diperbaiki sendiri oleh yang
melakukannya.

Membetulkan "Jl. Melati No. 5" jadi "No. 7" **bukan** pindah wilayah, jadi tetap
boleh.

### Menambah warga

RT/RW warga baru **dipaksa masuk wilayah penambahnya**: Ketua RT 004 hanya bisa
menambah warga RT 004; Ketua RW 020 memilih RT 003 atau 004; Dukuh bebas. Aturan
yang sama dengan mengubah — kalau berbeda, menambah jadi jalan memutar untuk
memindahkan.

**Kode Warga dibangkitkan aplikasi**, bukan diketik: pengurus tidak punya cara
tahu kode mana yang belum terpakai, dan kode bentrok berarti dua orang bertukar
identitas.

### Tidak ada penghapusan

Warga yang pindah atau meninggal **ditandai**, tidak dihapus. `deletedAt`
(salah input) tetap ada di skema tapi tidak bisa disetel lewat API — satu-satunya
jalannya lewat SQL langsung, dan itu disengaja.

### Impor Excel dikunci

`impor_excel` **menolak jalan kalau tabel penduduk sudah berisi**, kecuali
diberi `--timpa-semua` yang harus diketik penuh. Tanpa kunci itu, satu perintah
impor yang dijalankan karena kebiasaan menghapus seluruh hasil pendataan yang
dikerjakan pengurus di aplikasi.

### Audit log jadi tabel

Tabel `audit_log`: waktu, aktor, aksi, sasaran, dan **apa yang berubah**
(kolom, nilai lama, nilai baru). Sebelumnya `print()` ke console dan hilang tiap
restart. Begitu tiga puluh sekian orang bisa mengubah data warga, catatan itu
berhenti jadi kemewahan.

Belum ada halaman untuk membacanya — itu ditunda sampai ada yang benar-benar
perlu menelusuri. Isinya sudah tersimpan permanen, dan itu bagian yang tidak
bisa disusulkan belakangan.

## Batasan yang diterima sadar

- **Ketua RT kehilangan pandangan ke luar RT-nya**, termasuk untuk keperluan
  sah seperti mencocokkan data keluarga yang tinggal berbeda RT.
- **Tiap request membaca ulang seluruh tabel.** Sederhana, dan cukup pada
  beban satu padukuhan.
- **Statistik publik tetap membocorkan cacah se-padukuhan** kepada siapa pun,
  termasuk Ketua RT yang datanya sendiri dibatasi. Itu memang sudah terbuka
  untuk umum sejak awal.
- **Audit log belum bisa dibaca lewat aplikasi.** Tersimpan, tapi perlu SQL
  untuk melihatnya.
- **Tidak ada penyuntingan massal.** Satu warga satu kali simpan.
- **Tidak ada rate limit** (utang lama, belum dibayar).
