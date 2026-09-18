# SIGALON — Portal Data Kependudukan & Informasi Desa

**SIGALON** adalah aplikasi web manajemen data kependudukan dan portal informasi publik desa. Didesain khusus untuk **Perangkat Desa** (Admin, Dukuh, Ketua RW, Ketua RT) dengan mengutamakan **privasi data warga**, **otorisasi berbasis wilayah**, serta **transparansi informasi publik**.

---

## 🌟 Fitur Utama

### 1. Privasi Data Warga & Tanpa NIK/KK
* **Tanpa Simpan NIK & No. KK:** Demi keamanan dan perlindungan data pribadi warga, sistem **tidak menyimpan NIK dan Nomor KK sama sekali**.
* **Kode Warga Unik:** Identitas penduduk menggunakan **Kode Warga** yang dikelola pengurus dari pendataan kependudukan.
* **Tanpa Akun Warga:** Warga tidak perlu membuat akun atau login. Akses sistem internal dibatasi penuh hanya untuk Perangkat Desa.

### 2. Otorisasi Berbasis Wilayah & Pemisahan Peran
Terdapat 4 peran pengurus dengan batas kewenangan yang tegas:
* **`ADMIN` (Pengelola Akun):** Kelola akun pengurus, reset password, dan ajukan pergantian jabatan. **Nol akses ke data warga** — Admin tidak dapat melihat atau membaca data kependudukan.
* **`DUKUH`:** Akses penuh membaca, menambah, dan memperbarui data warga serta melihat infografis **seluruh padukuhan**.
* **`RW`:** Akses membaca data warga dan statistik terbatas hanya untuk **wilayah RW yang bersangkutan**.
* **`RT`:** Akses membaca data warga dan statistik terbatas hanya untuk **wilayah RT yang bersangkutan**.

### 3. Manajemen Pengurus & Tata Kelola Jabatan
* **Akun Melekat pada Jabatan:** Akun dibuat berdasarkan jabatan wilayah (Dukuh, Ketua RW 001, Ketua RT 001, dll).
* **Pergantian Jabatan Ber-Persetujuan:** Pergantian pemegang jabatan terisi wajib melalui mekanisme pengajuan oleh Admin yang disetujui oleh perangkat desa terkait (Dukuh & Ketua RW/RT).
* **Manajemen Ketua LPM:** Pengaturan nama Ketua LPM yang dapat diperbarui oleh Admin dan ditampilkan pada bagan organisasi publik.

### 4. Mutasi & Audit Data Kependudukan
* **Pengelolaan Data Warga:** Formulir tambah/ubah data warga dengan dua lapis izin (perubahan lokasi RT/RW hanya dapat dilakukan oleh Dukuh).
* **Pencatatan Status Mutasi:** Penandaan status kependudukan (`AKTIF`, `PINDAH`, `MENINGGAL`).
* **Log Audit Permanen:** Setiap aksi penambahan, perubahan data warga, maupun aktivitas kelola akun tersimpan di tabel audit log backend.

### 5. Portal Publik (Akses Bebas Tanpa Login)
* **Statistik Publik per Periode:** Menampilkan jumlah penduduk per RW, jumlah kepala keluarga, dan distribusi pekerjaan. Dilengkapi fitur **Filter Periode (Bulan & Tahun)** yang memutar mundur riwayat mutasi warga secara presisi.
* **Bagan Struktur Organisasi Dinamis:** Terhubung langsung dengan akun pengurus aktif (Dukuh, RW, RT) serta Ketua LPM.
* **Fitur Pendukung:** Berita padukuhan, widget pengatur ukuran font (aksesibilitas), dan tombol pengaduan via email.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | UI modern, cepat, dan responsive |
| **Styling** | Tailwind CSS | Utility-first styling dengan mode gelap/terang otomatis |
| **State & Fetching** | TanStack Query, Zustand | Pengelolaan server state & auth state client |
| **Form Validation** | React Hook Form + Zod | Validasi skema input form |
| **Visualisasi Data** | SVG & Tailwind CSS | Grafik agregat infografis kependudukan |
| **Backend** | Python, FastAPI | RESTful API performa tinggi |
| **Database** | SQLite (`sqlite3` stdlib) | Penyimpanan data lokal tanpa server database terpisah |
| **Autentikasi** | Sesi Server-Side & Bcrypt | Keamanan token sesi di tabel SQLite & hash password |

---

## 📁 Struktur Repositori

```
NIA-WEB/
├── CLAUDE.md               # Panduan utama konvensi kode & arsitektur
├── start-all.sh            # Skrip otomatis jalankan backend + frontend (Linux/macOS)
├── start-all.bat           # Skrip otomatis jalankan backend + frontend (Windows)
├── docs/                   # Dokumen prosedur & file template Excel
├── frontend/               # Aplikasi React + TypeScript + Vite
│   ├── src/
│   │   ├── features/       # Kode per-domain (auth, penduduk, pengurus, dll)
│   │   ├── pages/          # Halaman publik & admin
│   │   └── components/     # Komponen UI & Layout
│   └── README.md           # Panduan khusus frontend
└── backend/                # FastAPI + SQLite
    ├── app/
    │   ├── api/            # Endpoint routers
    │   ├── core/           # Security, ratelimit, audit
    │   └── data/           # Database SQLite, impor excel, & agregat
    └── README.md           # Panduan khusus backend
```

---

## 🚀 Panduan Memulai Cepat

### Prasyarat System
* **Node.js** v18+ & **npm**
* **Python** 3.10+

---

### Cara 1: Menggunakan Skrip Otomatis (Direkomendasikan)

1. **Inisialisasi Environment Backend:**
   Jalankan skrip `start.sh` (Linux/macOS) atau `start.bat` (Windows) di folder `backend/` sekali untuk membuat kerangka file `.env`.
   ```bash
   ./backend/start.sh
   ```
2. **Konfigurasi Akun Admin Bootstrap:**
   Buka file `backend/.env` dan isi username & password untuk akun Admin pertama:
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=password_rahasia_admin
   ```
3. **Isi Data Penduduk Awal:**
   Impor data awal dari file Excel pendataan ke database SQLite:
   ```bash
   backend/.venv/bin/python -m app.data.impor_excel docs/data-penduduk-contoh.xlsx
   ```
4. **Jalankan Seluruh Aplikasi:**
   Kembali ke root direktori, lalu jalankan skrip gabungan:
   * **Linux/macOS:**
     ```bash
     ./start-all.sh
     ```
   * **Windows:**
     ```cmd
     start-all.bat
     ```
   *Aplikasi frontend akan berjalan di `http://localhost:5173` dan backend API di `http://localhost:8000`.*

---

### Cara 2: Menjalankan Secara Manual

#### 1. Backend (FastAPI)
```bash
cd backend

# Membuat virtual environment & install dependensi
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Pastikan backend/.env sudah diisi ADMIN_USERNAME & ADMIN_PASSWORD

# Jalankan server FastAPI
.venv/bin/uvicorn app.main:app --reload --port 8000
```
*Dokumentasi API Swagger interaktif dapat diakses di `http://localhost:8000/docs`.*

#### 2. Frontend (React + Vite)
```bash
cd frontend

# Install dependensi & jalankan dev server
npm install
npm run dev
```
*Akses aplikasi di `http://localhost:5173`.*

---

## 📊 Impor Data Penduduk via Excel

Database SQLite tidak di-seed otomatis. Data penduduk diisi dari file Excel pendataan:
```bash
# Impor pertama kali
backend/.venv/bin/python -m app.data.impor_excel docs/data-penduduk-contoh.xlsx

# Menimpa seluruh data penduduk (HATI-HATI: Hanya gunakan jika ingin reset data warga)
backend/.venv/bin/python -m app.data.impor_excel docs/data-penduduk-contoh.xlsx --timpa-semua
```

* **Penting:** Kolom **Kode Warga** wajib diisi, unik, dan tidak boleh kosong.
* Generator template formulir Excel kosong:
  ```bash
  backend/.venv/bin/python -m tools.buat_template_excel
  ```

---

## 📖 Dokumentasi Lengkap & Konvensi

Untuk informasi lebih lanjut mengenai arsitektur, konvensi penulisan kode, alur autentikasi, serta aturan pengujian:
* 📄 **[`CLAUDE.md`](CLAUDE.md):** Sumber utama panduan kerja, konvensi kode, & spesifikasi arsitektur proyek.
* 🖥️ **[`frontend/README.md`](frontend/README.md):** Dokumentasi detail variabel lingkungan & skrip frontend.
* ⚙️ **[`backend/README.md`](backend/README.md):** Dokumentasi endpoint API, skema SQLite, & aturan bisnis backend.
