# Periode statistik — buku mutasi warga

Tanggal: 1 September 2026
Status: disetujui, siap diimplementasikan

## Masalah

Tabel `penduduk` hanya menyimpan keadaan SEKARANG. `statusKependudukan`
(`AKTIF`/`PINDAH`/`MENINGGAL`) berubah di tempat, tanpa jejak kapan
berubahnya. Akibatnya statistik hanya bisa menjawab "hari ini berapa jiwa",
tidak pernah "Agustus berapa jiwa".

Rail kiri `/statistik` sudah punya pemilih **Periode**, tapi memilih bulan lain
tidak mengubah satu angka pun — halamannya memasang peringatan supaya tidak
terbaca sebagai data historis.

## Keputusan

Tambah **buku mutasi**: tabel `mutasi` yang mencatat tiap perubahan status,
append-only. Papan tulis (`penduduk`) tetap menyimpan keadaan sekarang; buku
dipakai memutar mundur.

Ditolak — **stempel tanggal** (kolom `statusDiubahPada` di `penduduk`): hanya
mengingat perubahan terakhir. Warga yang pindah lalu kembali menghapus jejak
pindahnya.

Ditolak — **snapshot bulanan**: butuh penjadwal yang jalan tiap bulan, satu
bagian lagi yang harus dirawat orang setelah KKN, dan isinya cuma angka
sehingga tidak bisa menjawab "siapa yang pindah".

## Skema

```sql
CREATE TABLE IF NOT EXISTS mutasi (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    warga_id TEXT NOT NULL,
    -- NULL = warga baru masuk (tidak punya status sebelumnya).
    dari     TEXT,
    ke       TEXT NOT NULL,
    pada     TEXT NOT NULL,
    oleh     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mutasi_pada ON mutasi(pada);
```

TIDAK PERNAH DIHAPUS, sama seperti `pengajuan` dan `audit_log`. Warga bertanda
`PINDAH`/`MENINGGAL` juga tetap ada di tabel `penduduk` — yang berubah cuma
tandanya, dan tanda itu bisa dibatalkan.

## Yang menulis

Dua tempat, dua-duanya di `store.py` supaya tidak ada jalur yang lupa mencatat:

- `ubah_warga` — saat `statusKependudukan` berubah: `dari` status lama, `ke`
  status baru.
- `tambah_warga` — `dari = NULL`, `ke` status warga baru.

Impor Excel TIDAK menulis mutasi: ia mengisi keadaan awal, bukan mencatat
perubahan.

## Yang membaca

`store.penduduk_pada(periode)` — `periode` bentuk `YYYY-MM`:

1. Ambil `semua_penduduk()` (keadaan sekarang).
2. Ambil mutasi ber-`pada` >= awal bulan BERIKUTNYA, urut terbaru dulu.
3. Putar mundur satu per satu: `dari IS NULL` berarti warga itu belum ada di
   periode tersebut — keluarkan dari daftar; selain itu kembalikan statusnya
   ke `dari`.

Hasilnya keadaan pada akhir bulan `periode`.

## Endpoint

`GET /publik/statistik?periode=YYYY-MM` — opsional. Tanpa parameter =
keadaan hari ini, jadi pemanggil lama tidak berubah. Bentuk `periode` yang
salah dijawab 422 oleh validasi pola, bukan diam-diam diabaikan.

Responsnya tambah satu field:

- `periodeTerawal` — bulan mutasi tertua, atau bulan berjalan bila buku masih
  kosong. Frontend memakainya sebagai batas daftar pilihan.

Konsekuensi yang diterima sadar: sebelum mutasi pertama tercatat, daftar cuma
menawarkan bulan berjalan. Bulan yang sebenarnya masih bisa dihitung (antara
fitur dipasang dan mutasi pertama) ikut tidak ditawarkan. Konservatif, dan
tidak pernah menampilkan angka yang tidak bisa dipertanggungjawabkan.

## Frontend

- `statistikPublikApi.get(periode?)` + query key ikut periode.
- `daftarPeriode(terawal, sampai)` menurunkan pilihan dari jawaban backend,
  bukan mengarang 12 bulan terakhir.
- `Alert` "angka ini keadaan terkini" dicabut — angkanya jadi benar.

## Batas

Riwayat mulai kosong. Bulan sebelum fitur ini dipasang tidak bisa
direkonstruksi, dan tidak ada bahan untuk mengisinya mundur: file Excel
pendataan (`impor_excel.KOLOM`) tidak punya kolom status kependudukan sama
sekali, apalagi tanggalnya.

## Pengujian

`db._check_mutasi()` — putar mundur satu warga yang meninggal: periode
sebelumnya harus menghitungnya lagi, periode sesudahnya tidak.
