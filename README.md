# 🏫 Aplikasi Pembayaran SPP (Studi Kasus UKK RPL)

Aplikasi Pembayaran SPP berbasis web modern yang dibangun secara komprehensif untuk memenuhi seluruh kriteria Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak (RPL). Dibangun menggunakan arsitektur **Next.js App Router**, **Tailwind CSS**, **SQLite dengan Prisma ORM**, serta **Custom Cookie Session** yang aman dan efisien.

---

## 🚀 Fitur Utama Berdasarkan Role

Aplikasi mengimplementasikan 3 level privilege / hak akses pengguna sesuai dokumen teknis UKK RPL:

### 1. 🛡️ Administrator
- **Autentikasi:** Login & Logout aman dengan HTTP-Only Cookie.
- **CRUD Data Siswa:** Tambah, edit, cari, filter kelas, dan hapus data siswa (otomatis membuat akun login siswa dengan username NISN dan default password `siswa123`).
- **CRUD Data Petugas:** Tambah, edit, dan hapus akun Petugas Kasir maupun Admin.
- **CRUD Data Kelas:** Manajemen daftar kelas (contoh: XII RPL 1, XII RPL 2, XI TKJ 1, dll).
- **CRUD Data SPP:** Manajemen tarif SPP berdasarkan tahun dan nominal.
- **Entri Transaksi Pembayaran:** Pencarian siswa interaktif, tabel matriks 12 bulan (Januari - Desember), kalkulasi otomatis, pencegahan pembayaran ganda (duplicate month validation), dan cetak kwitansi pembayaran.
- **History Pembayaran:** Riwayat seluruh pembayaran SPP dengan log petugas yang memproses.
- **Generate Laporan:** Rekapitulasi transaksi filterable berdasarkan rentang tanggal, kelas, dan tahun ajaran, dilengkapi format cetak resmi (Kop Surat & Lembar Pengesahan) dengan mode `window.print()` ramah kertas A4.

### 2. 💼 Petugas (Kasir)
- **Autentikasi:** Login & Logout aman.
- **Entri Transaksi Pembayaran:** Memilih siswa, menentukan bulan & tahun bayar, kalkulasi tarif, menyimpan transaksi, dan mencetak kwitansi instan.
- **History Transaksi:** Melihat seluruh riwayat transaksi yang pernah diproses kasir dengan tombol cetak ulang kwitansi.

### 3. 🎓 Siswa
- **Autentikasi:** Login menggunakan NISN / Akun Siswa & Logout.
- **Dashboard Siswa:** Menampilkan profil lengkap siswa (NISN, NIS, Kelas, Jurusan, Alamat, No. Telp), nominal tarif SPP, serta status pembayaran tahun berjalan.
- **History Pembayaran Pribadi:** Riwayat pembayaran SPP milik siswa sendiri (terisolasi secara aman pada level query backend) beserta fitur cetak kwitansi digital.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) dengan TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Palet Minimalis Modern: Corporate Blue `#2563eb`, Slate Background `#f8fafc`, White Cards, Soft Shadows)
- **Database & ORM:** SQLite dengan [Prisma ORM](https://www.prisma.io/)
- **Autentikasi:** Custom HMAC SHA-256 Signed Session Token dengan Cookies HTTP-only
- **Keamanan Password:** [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Ikonografi:** [Lucide React](https://lucide.dev/)

---

## 🔑 Akun Bawaan (Default Login Demo)

Setelah seeding database, gunakan akun bawaan berikut untuk pengujian:

| Role | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh seluruh master data, transaksi, & laporan |
| **Petugas** | `petugas` | `petugas123` | Akses entri transaksi pembayaran & riwayat kasir |
| **Siswa** | `siswa` | `siswa123` | Akses dashboard siswa & riwayat pembayaran pribadi |

*(Halaman login juga dilengkapi tombol 1-Click Demo Login untuk memudahkan penguji UKK).*

---

## 📂 Struktur Proyek

```
SPP-sederhana/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx     # Dashboard analitik & ringkasan admin
│   │   ├── transaksi/page.tsx     # Entri pembayaran SPP & cetak kwitansi
│   │   ├── siswa/page.tsx         # CRUD Data Siswa
│   │   ├── petugas/page.tsx       # CRUD Data Petugas / Admin
│   │   ├── kelas/page.tsx         # CRUD Data Kelas
│   │   ├── spp/page.tsx           # CRUD Data Tarif SPP
│   │   └── laporan/page.tsx       # Rekap & cetak laporan keuangan SPP
│   ├── petugas/
│   │   ├── dashboard/page.tsx     # Dashboard kasir petugas
│   │   ├── transaksi/page.tsx     # Entri transaksi kasir
│   │   └── history/page.tsx       # Riwayat transaksi kasir
│   ├── siswa/
│   │   ├── dashboard/page.tsx     # Profil siswa & status SPP tahun berjalan
│   │   └── history/page.tsx       # Riwayat pembayaran siswa pribadi
│   ├── api/                       # RESTful API Endpoints (CRUD, Auth, Transaksi, Laporan)
│   ├── login/page.tsx             # Halaman login modern
│   ├── layout.tsx                 # Root layout & tema
│   └── page.tsx                   # Redirect otomatis sesuai status login
├── components/
│   ├── Sidebar.tsx                # Navigasi samping dinamis sesuai role
│   ├── Navbar.tsx                 # Top bar dengan tanggal & profil user
│   ├── Card.tsx                   # Kartu ringkasan metrik statistik
│   └── Modal.tsx                  # Dialog modal interaktif untuk form CRUD
├── lib/
│   ├── auth.ts                    # Logika session, token signing, & bcrypt
│   ├── prisma.ts                  # Singleton Prisma Client
│   └── utils.ts                   # Formatter mata uang Rupiah & tanggal Indonesia
├── prisma/
│   ├── schema.prisma              # Skema database SQLite lengkap
│   ├── seed.js                    # Script seeder data awal UKK
│   └── dev.db                     # Database SQLite lokal
└── middleware.ts                  # Route protection & role redirection
```

---

## 💻 Panduan Menjalankan Aplikasi

### 1. Inisialisasi Database (Jika Diperlukan Ulang)
```bash
npx prisma db push
node prisma/seed.js
```

### 2. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 3. Menjalankan Mode Produksi
```bash
npm run build
npm run start
```
Aplikasi siap digunakan untuk simulasi penilaian UKK RPL!
