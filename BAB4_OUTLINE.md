# OUTLINE BAB 4 — HASIL DAN PEMBAHASAN
# Sistem Computer Assisted Test (CAT) Berbasis Website dan Mobile App
# (Referensi struktur penulisan: TA Silvy Ayu, Syah Reza Anugrah, Syayidah Afiva, Haiqal Salsabila Zhaqi — Politeknik Negeri Madiun)

---

## 4.1 Hasil Implementasi

### 4.1.1 Implementasi Basis Data (Database)

- Gambar relasi antar tabel dalam basis data MySQL
- Penjelasan masing-masing tabel:

  - 4.1.1.1 Tabel User
  - 4.1.1.2 Tabel Guru
  - 4.1.1.3 Tabel Siswa
  - 4.1.1.4 Tabel MataPelajaran
  - 4.1.1.5 Tabel Jurusan
  - 4.1.1.6 Tabel Kelas
  - 4.1.1.7 Tabel Angkatan
  - 4.1.1.8 Tabel BankSoalKoleksi
  - 4.1.1.9 Tabel BankSoal
  - 4.1.1.10 Tabel PaketUjian
  - 4.1.1.11 Tabel SoalPaketUjian
  - 4.1.1.12 Tabel JadwalUjian
  - 4.1.1.13 Tabel PeriodeUjian
  - 4.1.1.14 Tabel UjianSiswa
  - 4.1.1.15 Tabel JawabanSiswa

  *(Setiap tabel disertai: nama tabel, kolom, tipe data, primary key, foreign key, dan fungsinya dalam sistem)*

---

### 4.1.2 Implementasi Kode (Backend)

#### 4.1.2.1 Struktur Direktori Backend

- Gambar struktur direktori backend
- Penjelasan singkat setiap folder (src/, prisma/, routes/, controllers/, dll.)

#### 4.1.2.2 Konfigurasi Server Utama (server.js / app.js)

- Kode program konfigurasi server Node.js + Express
- Kode program inisialisasi Socket.io
- Kode program koneksi database Prisma

#### 4.1.2.3 Implementasi Autentikasi (JWT + Google OAuth)

- Kode program route autentikasi login Google (Web)
- Kode program route autentikasi login Google (Mobile ID Token)
- Kode program middleware proteksi route (JWT verify)
- Kode program route profile dan logout

#### 4.1.2.4 Implementasi Route Admin

- Kode program CRUD Jurusan
- Kode program CRUD Mata Pelajaran
- Kode program CRUD Kelas
- Kode program CRUD Angkatan
- Kode program CRUD User (Admin, Guru, Siswa)
- Kode program Import Excel Siswa & Guru

#### 4.1.2.5 Implementasi Route Guru

- Kode program CRUD Paket Ujian
- Kode program CRUD Bank Soal
  - Tipe soal Pilihan Ganda (pilgan)
  - Tipe soal Pilihan Ganda Kompleks (pilgan_kompleks)
  - Tipe soal Kategori Benar/Salah (pilgan_kategori)
- Kode program CRUD Jadwal Ujian (termasuk Bulk Generate)
- Kode program Rekap Hasil Ujian
- Kode program Analisis Soal (P-Value & Tingkat Kesulitan)

#### 4.1.2.6 Implementasi Route Siswa (API Mobile)

- Kode program GET jadwal ujian hari ini
- Kode program POST mulai ujian (dengan random seed)
- Kode program PUT simpan jawaban (Smart Sync)
- Kode program POST submit ujian (dengan validasi token checkout)
- Kode program GET riwayat ujian
- Kode program GET hasil ujian

#### 4.1.2.7 Implementasi Algoritma Pengacakan Soal

- Kode program algoritma random seed untuk pengacakan soal per siswa
- Kode program algoritma random seed untuk pengacakan opsi jawaban

---

### 4.1.3 Implementasi Tampilan Website (Frontend)

#### 4.1.3.1 Struktur Direktori Frontend

- Gambar struktur direktori frontend React
- Penjelasan singkat setiap folder (src/, components/, pages/, services/, context/, dll.)

#### 4.1.3.2 Halaman Login Admin/Guru

- Screenshot halaman login
- Penjelasan fitur login (Google OAuth redirect)

#### 4.1.3.3 Halaman Dashboard Admin

- Screenshot halaman dashboard admin
- Penjelasan komponen: statistik data (jumlah jurusan, kelas, guru, siswa), grafik, ringkasan aktivitas

#### 4.1.3.4 Halaman Manajemen Jurusan

- Screenshot halaman daftar jurusan
- Screenshot halaman tambah/edit jurusan
- Penjelasan fitur CRUD data jurusan

#### 4.1.3.5 Halaman Manajemen Mata Pelajaran

- Screenshot halaman daftar mata pelajaran
- Screenshot halaman tambah/edit mata pelajaran
- Penjelasan fitur CRUD data mata pelajaran

#### 4.1.3.6 Halaman Manajemen Kelas

- Screenshot halaman daftar kelas
- Screenshot halaman tambah/edit kelas
- Penjelasan fitur CRUD data kelas (relasi dengan jurusan dan tingkat kelas)

#### 4.1.3.7 Halaman Manajemen Angkatan

- Screenshot halaman daftar angkatan
- Screenshot halaman tambah/edit angkatan
- Penjelasan fitur CRUD data angkatan

#### 4.1.3.8 Halaman Manajemen User Admin

- Screenshot halaman daftar user admin
- Screenshot halaman tambah/edit user admin
- Penjelasan fitur CRUD user admin

#### 4.1.3.9 Halaman Manajemen User Guru

- Screenshot halaman daftar user guru
- Screenshot halaman tambah/edit user guru
- Screenshot halaman import guru dari file Excel
- Penjelasan fitur CRUD dan import excel guru

#### 4.1.3.10 Halaman Manajemen User Siswa

- Screenshot halaman daftar siswa
- Screenshot halaman tambah/edit siswa
- Screenshot halaman import siswa dari file Excel
- Penjelasan fitur CRUD dan import excel siswa

#### 4.1.3.11 Halaman Dashboard Guru

- Screenshot halaman dashboard guru
- Penjelasan komponen: statistik paket ujian, bank soal, jadwal aktif, hasil ujian terbaru

#### 4.1.3.12 Halaman Bank Soal Guru

- Screenshot halaman daftar koleksi bank soal
- Screenshot halaman tambah/edit koleksi
- Screenshot halaman daftar soal dalam koleksi
- Screenshot halaman tambah/edit soal
  - Form soal tipe Pilihan Ganda (pilgan)
  - Form soal tipe Pilihan Ganda Kompleks (pilgan_kompleks)
  - Form soal tipe Kategori Benar/Salah (pilgan_kategori)
- Screenshot halaman import soal dari file Excel
- Screenshot halaman download template soal
- Penjelasan fitur CRUD bank soal dan import excel

#### 4.1.3.13 Halaman Paket Ujian Guru

- Screenshot halaman daftar paket ujian
- Screenshot halaman tambah/edit paket ujian
- Penjelasan fitur pemilihan soal dari bank soal, pengaturan jumlah soal, dan durasi

#### 4.1.3.14 Halaman Jadwal Ujian Guru

- Screenshot halaman daftar jadwal ujian
- Screenshot halaman wizard tambah jadwal ujian (step-by-step)
- Screenshot halaman Bulk Generate jadwal ujian
- Penjelasan fitur: pengaturan paket ujian, token masuk, token checkout, durasi, kelaspeserta, tipe ujian (UH/UTS/UAS)

#### 4.1.3.15 Halaman Rekap Hasil Ujian Guru

- Screenshot halaman daftar rekap hasil ujian
- Screenshot halaman detail hasil per siswa (nama, NIS, kelas, skor, waktu pengerjaan)
- Penjelasan fitur filter berdasarkan paket ujian, kelas, dan periode

#### 4.1.3.16 Halaman Analisis Soal Guru

- Screenshot halaman daftar analisis soal
- Screenshot halaman detail analisis per soal (P-Value, jumlah benar, jumlah salah)
- Penjelasan fitur: kategori tingkat kesulitan (Mudah/Sedang/Sulit), rekomendasi perbaikan soal

---

### 4.1.4 Implementasi Tampilan Mobile App (Flutter)

#### 4.1.4.1 Struktur Direktori Flutter

- Gambar struktur direktori Flutter
- Penjelasan singkat setiap folder (lib/, screens/, core/, assets/, dll.)

#### 4.1.4.2 Halaman Login (LoginPage)

- Screenshot halaman login
- Penjelasan fitur: Google Sign-In OAuth 2.0, auto-login JWT via SharedPreferences

#### 4.1.4.3 Halaman Dashboard — Tab Home (DashboardScreen)

- Screenshot card ujian aktif (jika ada ujian sedang berlangsung)
- Screenshot daftar jadwal ujian hari ini
- Penjelasan fitur: navigasi ke halaman ujian, tampilan status ujian (belum mulai, berlangsung, selesai)

#### 4.1.4.4 Halaman Dashboard — Tab History (DashboardScreen)

- Screenshot daftar riwayat ujian yang telah dikerjakan
- Penjelasan fitur: menampilkan nama paket ujian, tanggal, skor akhir, status kelulusan

#### 4.1.4.5 Halaman Dashboard — Tab Account (DashboardScreen)

- Screenshot profil siswa (nama, NIS, NISN, kelas, jurusan)
- Screenshot tampilan foto profil dari Google
- Penjelasan fitur: informasi akun dan tombol logout

#### 4.1.4.6 Halaman Pengambilan Ujian — Tampilan Soal (ExamAttemptScreen)

- Screenshot halaman pengerjaan soal tipe Pilihan Ganda (RadioListTile)
- Screenshot halaman pengerjaan soal tipe Kompleks (CheckboxListTile)
- Screenshot halaman pengerjaan soal tipe Kategori Benar/Salah (tabel)
- Penjelasan perbedaan tampilan setiap tipe soal

#### 4.1.4.7 Halaman Pengambilan Ujian — Navigasi Soal (ExamAttemptScreen)

- Screenshot navigator soal (grid warna: hijau = dijawab, kuning = ragu-ragu, putih = kosong)
- Penjelasan fitur navigasi antar soal (prev/next, loncat ke nomor tertentu)

#### 4.1.4.8 Halaman Pengambilan Ujian — Timer & Submit (ExamAttemptScreen)

- Screenshot timer countdown
- Screenshot dialog konfirmasi submit
- Screenshot dialog input token checkout (6 digit)
- Penjelasan fitur:
  - Auto submit saat waktu habis
  - Validasi token checkout sebelum submit
  - Smart Sync (auto-save jawaban setiap 800ms)

#### 4.1.4.9 Halaman Hasil Ujian — Tab Rekap Hasil (ExamResultScreen)

- Screenshot skor akhir
- Screenshot progress bar (jumlah benar, salah, ragu-ragu)
- Screenshot informasi durasi pengerjaan
- Penjelasan sistem penskoran setiap tipe soal

#### 4.1.4.10 Halaman Hasil Ujian — Tab Review Jawaban (ExamResultScreen)

- Screenshot tab review jawaban (expandable card per soal)
- Screenshot indicator benar/salah per soal
- Screenshot tampilan soal beserta jawaban siswa dan kunci jawaban
- Penjelasan fitur review jawaban setelah submit

#### 4.1.4.11 Halaman Pengaturan (SettingsScreen)

- Screenshot halaman pengaturan
- Screenshot form konfigurasi URL server backend
- Penjelasan fitur: ubah base URL API, simpan ke SharedPreferences

---

## 4.2 Pembahasan

### 4.2.1 Pembahasan Arsitektur Sistem

- 4.2.1.1 Arsitektur Client-Server
- 4.2.1.2 Alur Data Antara Website, Backend, dan Mobile App
- 4.2.1.3 Peran Socket.io dalam Monitoring Real-Time

### 4.2.2 Pembahasan Fitur Utama

- 4.2.2.1 Sistem Autentikasi Google OAuth (Web & Mobile)
- 4.2.2.2 Manajemen Bank Soal dengan 3 Tipe Soal
- 4.2.2.3 Pengacakan Soal menggunakan Algoritma Random Seed
- 4.2.2.4 Smart Sync — Auto Save Jawaban dengan Debounce 800ms
- 4.2.2.5 Sistem Keamanan Ujian
  - Token Masuk 6 Digit
  - Token Checkout/Submit 6 Digit
  - Kiosk Mode (Screen Pinning) di Mobile
- 4.2.2.6 Analisis Soal (P-Value dan Kategori Tingkat Kesulitan)
- 4.2.2.7 Sistem Rekap Hasil Ujian

### 4.2.3 Pembahasan Hasil Implementasi

- 4.2.3.1 Hasil Implementasi Database
- 4.2.3.2 Hasil Implementasi Website (Admin & Guru)
- 4.2.3.3 Hasil Implementasi Mobile App (Siswa)

---

## 4.3 Tahapan Pengujian

### 4.3.1 Pengujian Black Box

- 4.3.1.1 Pengujian Blackbox — Fitur Admin
- 4.3.1.2 Pengujian Blackbox — Fitur Guru
- 4.3.1.3 Pengujian Blackbox — Fitur Siswa (Mobile App)

### 4.3.2 Pengujian Lainnya (jika ada)

- 4.3.2.1 Feasibility Testing
- 4.3.2.2 Beta Testing / User Acceptance Testing (UAT)
- 4.3.2.3 Pengujian Integrasi API (Mobile ke Backend)

---

## Catatan Penulisan

- Setiap sub-bab implementasi **WAJIB** disertai:
  1. **Screenshot/Gambar** tampilan hasil implementasi
  2. **Penjelasan deskriptif** tentang tampilan/fitur yang dihasilkan
  3. **Potongan kode program** penting (opsional, jika relevan)

- Setiap sub-bab pengujian **WAJIB** disertai:
  1. **Tabel pengujian** berisi: Kelas Uji, Skenario Uji, Hasil yang Diharapkan, Keterangan
  2. **Kesimpulan hasil pengujian**

- Konsistensi penomoran gambar: **Gambar 4.1, Gambar 4.2, ...** (lanjutkan dari nomor Bab 3)
- Konsistensi penomoran tabel: **Tabel 4.1, Tabel 4.2, ...** (lanjutkan dari nomor Bab 3)
