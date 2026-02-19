# 📋 DOKUMENTASI RANCANGAN PROYEK CAT (Computer Assisted Test)
## Sistem Ujian Online Web & Mobile

**Versi**: 1.0  
**Status**: Planning Phase  
**Last Updated**: Desember 2024  
**Timeline**: 15-18 minggu (3.5-4.5 bulan)

---

## 1. OVERVIEW PROYEK

### 1.1 Tujuan
Membangun sistem ujian online (Computer Assisted Test) yang memungkinkan:
- **Admin** mengelola data master (guru, siswa, mata pelajaran, kelas, jadwal ujian)
- **Guru** membuat soal, membuat paket ujian, dan memonitor ujian secara real-time
- **Siswa** mengerjakan ujian melalui aplikasi mobile dengan sistem randomisasi soal
- **Sistem** mendeteksi pelanggaran dan mencatat log aktivitas lengkap

### 1.2 Target Pengguna
- **Admin**: Manajemen sistem dan data master
- **Guru**: Pembuatan soal, paket ujian, dan monitoring ujian
- **Siswa**: Mengerjakan ujian (melalui aplikasi mobile Flutter)

### 1.3 Prioritas Pengembangan
1. **Web Backend** (Node.js/Express + MySQL)
2. **Web Frontend** (React - Admin & Guru)
3. **Mobile App** (Flutter - Siswa)

---

## 2. TEKNOLOGI & ARSITEKTUR

### 2.1 Backend
- **Framework**: Node.js + Express.js
- **Database**: MySQL 
  - Development: Laragon (local)
  - Production: VPS
- **Authentication**: JWT (JSON Web Token)
- **Real-time**: Socket.io (untuk monitoring guru)
- **File Upload**: Multer (untuk gambar soal)
- **Validation**: Joi / express-validator

### 2.2 Frontend Web (Admin & Guru)
- **Framework**: React.js + Vite
- **State Management**: Context API / Redux (optional)
- **Routing**: React Router DOM
- **UI Components**: React Icons
- **Styling**: CSS Modules / Tailwind CSS
- **HTTP Client**: Axios / Fetch API

### 2.3 Mobile App (Siswa)
- **Framework**: Flutter
- **Platform**: Android
- **Language**: Dart
- **State Management**: Provider / Riverpod
- **Local Storage**: SharedPreferences / Hive
- **HTTP Client**: Dio
- **Offline Support**: SQLite (untuk cache)

### 2.4 Deployment
- **Server**: VPS (DigitalOcean / AWS / Linode / dll)
- **Database**: MySQL di VPS
- **Backend Port**: 3000 (atau sesuai konfigurasi)
- **Frontend Web**: Nginx reverse proxy
- **SSL**: Let's Encrypt

---

## 3. TIPE SOAL TKA (Tes Kompetensi Akademik)

### 3.1 Jenis Soal yang Didukung

#### A. Single Choice (Pilihan Ganda Biasa)
**Deskripsi**: Soal dengan 4-5 opsi, hanya 1 jawaban benar

**Contoh**:
```
Pertanyaan: "Berapa hasil dari 2 + 2?"
Opsi:
- A) 3
- B) 4 ✓ (jawaban benar)
- C) 5
- D) 6

Penilaian: Benar = 1 poin, Salah = 0 poin
```

**Database Schema**:
- `soal.tipe_soal` = `'single_choice'`
- `opsi_jawaban.is_correct` = `true` (hanya 1 opsi)

---

#### B. Multiple Answer Single Choice (MASC)
**Deskripsi**: Soal dengan beberapa opsi, siswa harus memilih SEMUA opsi yang benar (lebih dari 1 jawaban benar, tapi harus semua benar untuk dapat poin)

**Contoh**:
```
Pertanyaan: "Manakah pernyataan yang BENAR tentang fotosintesis?"
Opsi:
- A) Membutuhkan cahaya matahari ✓
- B) Menghasilkan oksigen ✓
- C) Terjadi di mitokondria ✗
- D) Hanya terjadi pada pagi hari ✗

Jawaban Benar: A dan B (keduanya harus dipilih)
Penilaian: 
- Jika siswa pilih A dan B = 1 poin (benar)
- Jika siswa pilih A saja = 0 poin (salah)
- Jika siswa pilih A, B, dan C = 0 poin (salah)
```

**Database Schema**:
- `soal.tipe_soal` = `'multiple_answer_single'`
- `opsi_jawaban.is_correct` = `true` (lebih dari 1 opsi bisa true)
- Validasi: Semua opsi dengan `is_correct=true` harus dipilih siswa

---

#### C. Multiple Answer Multiple Choice (MAMC)
**Deskripsi**: Soal dengan beberapa opsi, siswa bisa memilih beberapa jawaban (minimal 2), penilaian berdasarkan jumlah jawaban benar

**Contoh**:
```
Pertanyaan: "Pilih MINIMAL 2 pernyataan yang benar tentang air"
Opsi:
- A) Terdiri dari H2O ✓
- B) Dapat menghantarkan listrik ✓
- C) Memiliki warna biru ✗
- D) Titik didih 100°C ✓

Jawaban Benar: A, B, D (3 opsi benar)
Penilaian: 
- Jika siswa pilih A, B, D = 1 poin (semua benar)
- Jika siswa pilih A, B = 0.67 poin (2 dari 3 benar)
- Jika siswa pilih A, C = 0.33 poin (1 benar, 1 salah)
```

**Database Schema**:
- `soal.tipe_soal` = `'multiple_answer_multiple'`
- `opsi_jawaban.is_correct` = `true/false`
- Penilaian: `(jumlah_jawaban_benar_siswa / total_jawaban_benar) × bobot_soal`

---

#### D. Kategori Pilihan Ganda
**Deskripsi**: Soal dengan pengelompokan/kategorisasi, siswa harus mengelompokkan item ke dalam kategori yang benar

**Contoh**:
```
Pertanyaan: "Golongkan tumbuhan berikut ke dalam kelompoknya"

Kategori: 
[Monokotil] [Dikotil]

Item:
1. Padi → Monokotil ✓
2. Mawar → Dikotil ✓
3. Jagung → Monokotil ✓
4. Mangga → Dikotil ✓

Penilaian: Per item yang benar (4 item = 4 poin jika semua benar)
```

**Database Schema**:
- `soal.tipe_soal` = `'kategori'`
- Tabel baru: `soal_kategori` (id, soal_id, kategori_nama)
- Tabel baru: `soal_kategori_item` (id, soal_id, item_nama, kategori_id)
- `jawaban_siswa.jawaban_kategori` = JSON: `{"item_id": "kategori_id"}`

---

### 3.2 Sistem Randomisasi Soal

**Lokasi Randomisasi**: **Aplikasi Mobile (Flutter)** - Sisi Client

**Mekanisme**:
1. Saat siswa klik "Mulai Ujian", backend mengirim semua soal untuk ujian tersebut
2. **Mobile app melakukan randomisasi**:
   - Random urutan soal (shuffle array)
   - Random urutan opsi jawaban (shuffle opsi A, B, C, D)
3. Data randomisasi disimpan di mobile (local storage)
4. Jawaban siswa tetap dikirim dengan referensi `soal_id` dan `opsi_id` asli (bukan urutan random)

**Alasan Randomisasi di Mobile**:
- Setiap siswa mendapat urutan soal berbeda
- Setiap siswa mendapat urutan opsi berbeda
- Mencegah siswa saling mencontek
- Randomisasi terjadi real-time di device siswa

**Contoh Flow**:
```
Backend kirim soal:
[
  {id: 1, pertanyaan: "Soal A", opsi: [A, B, C, D]},
  {id: 2, pertanyaan: "Soal B", opsi: [A, B, C, D]},
  {id: 3, pertanyaan: "Soal C", opsi: [A, B, C, D]}
]

Mobile random:
Siswa 1 melihat: [Soal C, Soal A, Soal B] dengan opsi teracak
Siswa 2 melihat: [Soal B, Soal C, Soal A] dengan opsi teracak
```

---

## 4. FITUR UTAMA

### 4.1 Admin Panel (Web)

#### Dashboard
- Statistik: Jumlah guru, siswa, mata pelajaran, kelas, jadwal ujian
- Quick actions: Tambah guru, tambah siswa, tambah mata pelajaran
- Grafik aktivitas ujian (chart)

#### Manajemen Data Master
- **Guru**: CRUD data guru (NIP, nama, email, mata pelajaran)
- **Siswa**: CRUD data siswa (NIS, NISN, nama, kelas, email)
- **Mata Pelajaran**: CRUD mata pelajaran
- **Kelas**: CRUD kelas (X, XI, XII dengan jurusan)
- **Jadwal Ujian**: CRUD jadwal ujian (tanggal, jam, mata pelajaran)

#### Manajemen Ujian
- Lihat semua ujian yang dibuat guru
- Export laporan hasil ujian
- Manajemen token ujian

---

### 4.2 Guru Panel (Web)

#### Dashboard
- Statistik: Jumlah soal, paket ujian aktif, peserta ujian
- Ujian aktif hari ini
- Notifikasi

#### Bank Soal
- **Buat Soal**: 
  - Pilih tipe soal (Single Choice, MASC, MAMC, Kategori)
  - Input pertanyaan (text + gambar optional)
  - Input opsi jawaban
  - Set kunci jawaban
  - Set mata pelajaran, kelas, semester
- **Edit Soal**: Update soal yang sudah dibuat
- **Hapus Soal**: Hapus soal (soft delete)
- **Filter**: Filter berdasarkan mata pelajaran, kelas, pembuat
- **Grouping**: Group soal berdasarkan mata pelajaran + kelas + semester

#### Paket Ujian
- **Buat Paket Ujian**:
  - Nama paket
  - Durasi (menit)
  - Pilih jadwal (dari admin) atau atur manual (tanggal & jam)
  - Pilih kelas (multi-select)
  - Pilih soal dari bank soal (multi-select)
  - Opsi keamanan (aktifkan monitoring)
  - Generate kode ujian otomatis
- **Edit Paket**: Update paket ujian (jika belum aktif)
- **Hapus Paket**: Hapus paket (jika belum aktif)
- **Status**: Draft, Published, Aktif, Selesai

#### Monitoring Real-time
- **Pilih Paket Ujian Aktif**: Dropdown paket ujian yang sedang berlangsung
- **Progress Peserta**:
  - Nama siswa
  - Soal selesai / Total soal
  - Waktu tersisa
  - Status (mengerjakan, selesai)
  - Progress bar
- **Detail Siswa** (expandable):
  - NIS, NISN, Kelas, Email, No. Telp
  - Pelanggaran yang terdeteksi
- **Pelanggaran Terdeteksi**:
  - Nama siswa
  - Jenis pelanggaran (Keluar aplikasi, Tab switch, dll)
  - Waktu kejadian
  - Durasi
  - Aksi yang dilakukan sistem
- **Kontrol Ujian**:
  - **Hentikan Ujian**: Auto-submit semua peserta
  - **Tambah Waktu**: Tambah waktu untuk semua peserta
  - **Reset Sesi**: Reset progress semua peserta (mulai ulang)
- **Auto-refresh**: Update setiap 5 detik (toggle on/off)
- **Manual Refresh**: Button refresh manual

#### Detail Ujian
- Informasi paket ujian
- Daftar soal dalam paket
- Daftar peserta
- Statistik peserta

#### Evaluasi
- **Pilih Paket Ujian**: Dropdown paket ujian yang sudah selesai
- **Analisis Per Soal**:
  - P-Value (persentase siswa yang menjawab benar)
  - Kategori kesulitan (Mudah, Sedang, Sulit)
  - Rata-rata waktu pengerjaan
  - Jumlah benar/total
- **Ringkasan**:
  - Jumlah soal mudah, sedang, sulit
  - Distribusi kesulitan (chart)
- **Export**: Export ke Excel

#### Notifikasi
- Notifikasi ujian baru
- Notifikasi pelanggaran
- Notifikasi ujian selesai

---

### 4.3 Siswa (Mobile - Flutter)

#### Login
- Login dengan email/username dan password
- (Optional: Google OAuth untuk masa depan)

#### Dashboard
- **Ujian Tersedia**: List ujian yang bisa diikuti siswa
  - Nama ujian
  - Mata pelajaran
  - Tanggal & waktu
  - Durasi
  - Status (Belum mulai, Sedang berlangsung, Selesai)
- **Riwayat Ujian**: List ujian yang sudah dikerjakan
- **Profil**: Data siswa

#### Daftar Ujian
- Filter: Semua, Tersedia, Sedang berlangsung, Selesai
- Search: Cari ujian
- Card ujian:
  - Nama ujian
  - Mata pelajaran
  - Tanggal & waktu
  - Durasi
  - Status badge
  - Button "Mulai Ujian" / "Lihat Hasil"

#### Mengerjakan Ujian
- **Masuk Ujian**: Input kode ujian (jika diperlukan)
- **Konfirmasi Mulai**: Dialog konfirmasi sebelum mulai
- **Tampilan Soal**:
  - Header: Timer countdown, Nomor soal (X dari Y)
  - Pertanyaan (text + gambar jika ada)
  - Opsi jawaban (radio button untuk single, checkbox untuk multiple)
  - Navigation: Previous, Next, Jump to soal
  - Bookmark soal (flag untuk review)
  - Progress bar
- **Randomisasi**:
  - Urutan soal diacak (setiap siswa berbeda)
  - Urutan opsi diacak (setiap siswa berbeda)
- **Sinkronisasi Jawaban**:
  - Auto-save jawaban ke server setiap kali menjawab
  - Offline mode: Simpan lokal, sync saat online
- **Submit Ujian**:
  - Dialog konfirmasi
  - Tampilkan ringkasan: Soal terjawab, Soal belum terjawab, Soal di-bookmark
  - Konfirmasi final submit

#### Hasil Ujian
- **Skor**: Nilai akhir (persentase)
- **Status**: Lulus / Tidak Lulus (berdasarkan passing grade)
- **Detail**:
  - Soal benar / Soal salah / Soal kosong
  - Waktu pengerjaan
  - Tanggal ujian
- **Review Jawaban** (optional):
  - Lihat soal yang dijawab benar/salah
  - Lihat kunci jawaban

#### Riwayat
- List semua ujian yang sudah dikerjakan
- Filter: Semua, Lulus, Tidak Lulus
- Sort: Terbaru, Terlama, Nilai tertinggi

#### Profil
- Data siswa: NIS, NISN, Nama, Kelas, Email, No. Telp
- Edit profil (jika diizinkan)
- Logout

---

## 5. DATABASE SCHEMA

### 5.1 Tabel Users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'guru', 'siswa') NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.2 Tabel Guru
```sql
CREATE TABLE guru (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  nip VARCHAR(20) UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.3 Tabel Siswa
```sql
CREATE TABLE siswa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  nis VARCHAR(20) UNIQUE,
  nisn VARCHAR(20) UNIQUE,
  kelas_id INT,
  no_telp VARCHAR(20),
  jenis_kelamin ENUM('L', 'P'),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id)
);
```

### 5.4 Tabel Mata Pelajaran
```sql
CREATE TABLE mata_pelajaran (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_mapel VARCHAR(100) NOT NULL,
  kode_mapel VARCHAR(20) UNIQUE,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.5 Tabel Kelas
```sql
CREATE TABLE kelas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_kelas VARCHAR(50) NOT NULL,
  tingkat ENUM('X', 'XI', 'XII'),
  jurusan VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.6 Tabel Soal
```sql
CREATE TABLE soal (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mapel_id INT NOT NULL,
  pembuat_id INT NOT NULL,
  tipe_soal ENUM('single_choice', 'multiple_answer_single', 'multiple_answer_multiple', 'kategori') NOT NULL,
  pertanyaan TEXT NOT NULL,
  gambar_soal VARCHAR(255),
  kelas VARCHAR(10),
  semester ENUM('1', '2'),
  bobot_nilai DECIMAL(5,2) DEFAULT 1.00,
  kategori_kesulitan ENUM('mudah', 'sedang', 'sulit'),
  status ENUM('draft', 'published') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id),
  FOREIGN KEY (pembuat_id) REFERENCES users(id)
);
```

### 5.7 Tabel Opsi Jawaban
```sql
CREATE TABLE opsi_jawaban (
  id INT PRIMARY KEY AUTO_INCREMENT,
  soal_id INT NOT NULL,
  urutan INT NOT NULL,
  teks_opsi TEXT NOT NULL,
  gambar_opsi VARCHAR(255),
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
);
```

### 5.8 Tabel Soal Kategori (untuk tipe soal kategori)
```sql
CREATE TABLE soal_kategori (
  id INT PRIMARY KEY AUTO_INCREMENT,
  soal_id INT NOT NULL,
  kategori_nama VARCHAR(100) NOT NULL,
  urutan INT,
  FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE
);
```

### 5.9 Tabel Soal Kategori Item
```sql
CREATE TABLE soal_kategori_item (
  id INT PRIMARY KEY AUTO_INCREMENT,
  soal_id INT NOT NULL,
  item_nama VARCHAR(100) NOT NULL,
  kategori_id INT NOT NULL,
  FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE,
  FOREIGN KEY (kategori_id) REFERENCES soal_kategori(id) ON DELETE CASCADE
);
```

### 5.10 Tabel Jadwal Ujian (Admin)
```sql
CREATE TABLE jadwal_ujian (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_jadwal VARCHAR(100) NOT NULL,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME,
  mapel_id INT,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id)
);
```

### 5.11 Tabel Paket Ujian
```sql
CREATE TABLE paket_ujian (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kode_ujian VARCHAR(50) UNIQUE NOT NULL,
  nama_paket VARCHAR(100) NOT NULL,
  durasi INT NOT NULL, -- dalam menit
  tanggal_mulai DATETIME NOT NULL,
  tanggal_selesai DATETIME NOT NULL,
  jadwal_id INT,
  pembuat_id INT NOT NULL,
  opsi_keamanan BOOLEAN DEFAULT TRUE,
  status ENUM('draft', 'published', 'aktif', 'selesai') DEFAULT 'draft',
  jumlah_soal INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_ujian(id),
  FOREIGN KEY (pembuat_id) REFERENCES users(id)
);
```

### 5.12 Tabel Paket Ujian Kelas (Many-to-Many)
```sql
CREATE TABLE paket_ujian_kelas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paket_ujian_id INT NOT NULL,
  kelas_id INT NOT NULL,
  FOREIGN KEY (paket_ujian_id) REFERENCES paket_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_paket_kelas (paket_ujian_id, kelas_id)
);
```

### 5.13 Tabel Paket Ujian Soal (Many-to-Many)
```sql
CREATE TABLE paket_ujian_soal (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paket_ujian_id INT NOT NULL,
  soal_id INT NOT NULL,
  urutan INT,
  FOREIGN KEY (paket_ujian_id) REFERENCES paket_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (soal_id) REFERENCES soal(id) ON DELETE CASCADE,
  UNIQUE KEY unique_paket_soal (paket_ujian_id, soal_id)
);
```

### 5.14 Tabel Peserta Ujian
```sql
CREATE TABLE peserta_ujian (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paket_ujian_id INT NOT NULL,
  siswa_id INT NOT NULL,
  waktu_mulai DATETIME,
  waktu_selesai DATETIME,
  waktu_tersisa INT, -- dalam detik
  status ENUM('belum_mulai', 'sedang_ujian', 'selesai', 'dibatalkan') DEFAULT 'belum_mulai',
  nilai_akhir DECIMAL(5,2),
  persentase DECIMAL(5,2),
  is_lulus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paket_ujian_id) REFERENCES paket_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  UNIQUE KEY unique_peserta_paket (paket_ujian_id, siswa_id)
);
```

### 5.15 Tabel Jawaban Siswa
```sql
CREATE TABLE jawaban_siswa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  peserta_ujian_id INT NOT NULL,
  soal_id INT NOT NULL,
  opsi_jawaban_id INT, -- untuk single choice
  jawaban_multiple JSON, -- untuk multiple choice: [1, 2, 3]
  jawaban_kategori JSON, -- untuk kategori: {"item_id": "kategori_id"}
  waktu_jawab DATETIME,
  status ENUM('dijawab', 'kosong', 'bookmark') DEFAULT 'kosong',
  is_correct BOOLEAN,
  poin DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (peserta_ujian_id) REFERENCES peserta_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (soal_id) REFERENCES soal(id),
  FOREIGN KEY (opsi_jawaban_id) REFERENCES opsi_jawaban(id)
);
```

### 5.16 Tabel Log Aktivitas
```sql
CREATE TABLE log_aktivitas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  peserta_ujian_id INT NOT NULL,
  tipe_aktivitas VARCHAR(50) NOT NULL, -- login, mulai_ujian, jawab_soal, pindah_soal, submit, dll
  deskripsi TEXT,
  metadata JSON, -- data tambahan dalam format JSON
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peserta_ujian_id) REFERENCES peserta_ujian(id) ON DELETE CASCADE
);
```

### 5.17 Tabel Deteksi Pelanggaran
```sql
CREATE TABLE deteksi_pelanggaran (
  id INT PRIMARY KEY AUTO_INCREMENT,
  peserta_ujian_id INT NOT NULL,
  tipe_pelanggaran VARCHAR(50) NOT NULL, -- tab_switch, app_switch, screenshot, copy_paste, dll
  bukti TEXT, -- screenshot/log dalam format base64 atau path file
  tingkat_severity ENUM('warning', 'critical') DEFAULT 'warning',
  durasi INT, -- durasi pelanggaran dalam detik
  status ENUM('tercatat', 'ditindak_lanjuti', 'ditolak') DEFAULT 'tercatat',
  aksi_sistem VARCHAR(255), -- aksi yang dilakukan sistem
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (peserta_ujian_id) REFERENCES peserta_ujian(id) ON DELETE CASCADE
);
```

### 5.18 Tabel Guru Mata Pelajaran (Many-to-Many)
```sql
CREATE TABLE guru_mata_pelajaran (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guru_id INT NOT NULL,
  mapel_id INT NOT NULL,
  FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  UNIQUE KEY unique_guru_mapel (guru_id, mapel_id)
);
```

---

## 6. API ENDPOINTS

### 6.1 Authentication
```
POST   /api/auth/login              - Login user (email/username + password)
POST   /api/auth/logout             - Logout user
POST   /api/auth/refresh-token     - Refresh JWT token
GET    /api/auth/profile            - Get profile user yang login
PUT    /api/auth/profile            - Update profile user
```

### 6.2 Admin - Manajemen User
```
GET    /api/admin/guru              - Daftar semua guru
POST   /api/admin/guru              - Tambah guru baru
GET    /api/admin/guru/:id          - Detail guru
PUT    /api/admin/guru/:id          - Edit guru
DELETE /api/admin/guru/:id          - Hapus guru

GET    /api/admin/siswa             - Daftar semua siswa
POST   /api/admin/siswa             - Tambah siswa baru
GET    /api/admin/siswa/:id          - Detail siswa
PUT    /api/admin/siswa/:id          - Edit siswa
DELETE /api/admin/siswa/:id          - Hapus siswa
```

### 6.3 Admin - Manajemen Data Master
```
GET    /api/admin/mata-pelajaran    - Daftar mata pelajaran
POST   /api/admin/mata-pelajaran    - Tambah mata pelajaran
PUT    /api/admin/mata-pelajaran/:id - Edit mata pelajaran
DELETE /api/admin/mata-pelajaran/:id - Hapus mata pelajaran

GET    /api/admin/kelas             - Daftar kelas
POST   /api/admin/kelas             - Tambah kelas
PUT    /api/admin/kelas/:id         - Edit kelas
DELETE /api/admin/kelas/:id         - Hapus kelas

GET    /api/admin/jadwal-ujian      - Daftar jadwal ujian
POST   /api/admin/jadwal-ujian      - Tambah jadwal ujian
PUT    /api/admin/jadwal-ujian/:id  - Edit jadwal ujian
DELETE /api/admin/jadwal-ujian/:id  - Hapus jadwal ujian
```

### 6.4 Guru - Manajemen Soal
```
GET    /api/guru/soal               - Daftar soal (filter: mapel, kelas, semester, pembuat)
POST   /api/guru/soal               - Buat soal baru
GET    /api/guru/soal/:id           - Detail soal
PUT    /api/guru/soal/:id           - Edit soal
DELETE /api/guru/soal/:id           - Hapus soal
POST   /api/guru/soal/import        - Import soal dari Excel/CSV (optional)
GET    /api/guru/soal/export        - Export soal ke Excel/CSV (optional)
```

### 6.5 Guru - Manajemen Paket Ujian
```
GET    /api/guru/paket-ujian        - Daftar paket ujian (filter: status)
POST   /api/guru/paket-ujian        - Buat paket ujian baru
GET    /api/guru/paket-ujian/:id    - Detail paket ujian
PUT    /api/guru/paket-ujian/:id    - Edit paket ujian (jika belum aktif)
DELETE /api/guru/paket-ujian/:id    - Hapus paket ujian (jika belum aktif)
POST   /api/guru/paket-ujian/:id/publish - Publish paket ujian (ubah status ke 'published')
POST   /api/guru/paket-ujian/:id/aktifkan - Aktifkan paket ujian (ubah status ke 'aktif')
```

### 6.6 Guru - Monitoring Real-time
```
GET    /api/guru/monitoring/:paket_id - Status real-time semua peserta
GET    /api/guru/monitoring/:paket_id/peserta/:peserta_id - Detail peserta
GET    /api/guru/monitoring/:paket_id/pelanggaran - Daftar pelanggaran
GET    /api/guru/monitoring/:paket_id/log/:peserta_id - Log aktivitas peserta
POST   /api/guru/monitoring/:paket_id/hentikan - Hentikan ujian (auto-submit semua)
POST   /api/guru/monitoring/:paket_id/tambah-waktu - Tambah waktu untuk semua peserta
POST   /api/guru/monitoring/:paket_id/reset-sesi - Reset sesi ujian (mulai ulang)
```

### 6.7 Guru - Evaluasi & Hasil
```
GET    /api/guru/evaluasi/:paket_id - Analisis soal (P-value, kategori kesulitan)
GET    /api/guru/hasil/:paket_id    - Hasil ujian semua peserta
GET    /api/guru/hasil/:paket_id/export - Export hasil ke Excel
```

### 6.8 Siswa - Ujian (Mobile)
```
GET    /api/siswa/ujian-tersedia    - Daftar ujian yang tersedia untuk siswa
GET    /api/siswa/ujian/:id         - Detail ujian
POST   /api/siswa/ujian/:id/mulai   - Mulai ujian (create peserta_ujian, kirim semua soal)
GET    /api/siswa/ujian/:id/soal    - Ambil soal (dengan randomisasi di mobile)
POST   /api/siswa/ujian/:id/jawab   - Submit jawaban (soal_id, opsi_id/jawaban_multiple)
GET    /api/siswa/ujian/:id/status  - Status ujian siswa (progress, waktu tersisa)
POST   /api/siswa/ujian/:id/selesai - Selesaikan ujian (submit final, hitung nilai)
GET    /api/siswa/ujian/:id/hasil   - Hasil ujian siswa
GET    /api/siswa/riwayat           - Riwayat semua ujian yang sudah dikerjakan
```

### 6.9 Socket.io Events (Real-time Monitoring)
```
// Server → Client (Guru)
'exam:started'              - Ujian dimulai
'exam:student_joined'        - Siswa bergabung ujian
'exam:student_answered'      - Siswa menjawab soal
'exam:student_progress'      - Update progress siswa
'exam:student_finished'      - Siswa selesai ujian
'exam:violation_detected'   - Pelanggaran terdeteksi
'exam:time_updated'          - Waktu ujian diupdate

// Client → Server (Guru)
'join:monitoring'           - Guru join room monitoring
'leave:monitoring'          - Guru leave room monitoring
```

---

## 7. FITUR KEAMANAN & DETEKSI PELANGGARAN

### 7.1 Anti-Cheat Features (Mobile)

#### A. Deteksi Tab/App Switching
- **Platform**: Flutter
- **Mekanisme**: 
  - Monitor lifecycle app (AppLifecycleState)
  - Deteksi saat app masuk background
  - Catat waktu masuk/keluar background
  - Jika > 5 detik, catat sebagai pelanggaran
- **Aksi**: 
  - Warning pertama: Peringatan
  - Warning kedua: Auto-submit ujian (optional)

#### B. Deteksi Screenshot
- **Platform**: Flutter
- **Mekanisme**:
  - Gunakan package `screenshot_detector` atau native channel
  - Deteksi saat screenshot diambil
  - Catat sebagai pelanggaran critical
- **Aksi**: 
  - Auto-submit ujian atau lock ujian

#### C. Screen Pinning Detection
- **Platform**: Android (Flutter)
- **Mekanisme**:
  - Deteksi apakah device dalam mode screen pinning
  - Jika tidak dalam mode screen pinning, tampilkan warning
- **Aksi**: 
  - Minta siswa aktifkan screen pinning sebelum mulai ujian

#### D. Copy-Paste Detection
- **Platform**: Flutter
- **Mekanisme**:
  - Disable copy-paste di text field
  - Deteksi gesture copy-paste
- **Aksi**: 
  - Warning atau auto-submit

#### E. Device Rotation Lock
- **Platform**: Flutter
- **Mekanisme**:
  - Lock orientation ke portrait
  - Deteksi perubahan orientation
- **Aksi**: 
  - Warning atau reset orientation

### 7.2 Validasi & Security

#### A. Token Ujian
- Setiap paket ujian memiliki kode ujian unik
- Siswa harus input kode ujian untuk masuk
- Validasi kode ujian di backend

#### B. Time Validation
- Validasi waktu mulai ujian (tidak bisa mulai sebelum waktu)
- Validasi waktu selesai ujian (auto-submit jika waktu habis)
- Validasi durasi ujian

#### C. IP Address Tracking
- Catat IP address setiap aksi
- Deteksi perubahan IP address (jika berbeda, warning)

#### D. Device Fingerprinting
- Catat device info (model, OS, browser)
- Deteksi perubahan device (jika berbeda, warning)

#### E. Activity Logging
- Catat semua aktivitas siswa:
  - Login/Logout
  - Mulai ujian
  - Jawab soal
  - Pindah soal
  - Bookmark soal
  - Submit ujian
  - Pelanggaran

---

## 8. TIMELINE PENGEMBANGAN

### Phase 1: Setup & Backend Core (2-3 minggu)
**Prioritas**: ⭐⭐⭐⭐⭐

- [ ] Setup project Node.js + Express
- [ ] Setup database MySQL (Laragon)
- [ ] Buat semua tabel database
- [ ] Implementasi authentication (JWT)
- [ ] Middleware: auth, role check, error handler
- [ ] Setup CORS, body parser, dll
- [ ] Testing API dengan Postman

**Deliverables**:
- Backend server running
- Database schema siap
- Authentication working
- Basic CRUD API

---

### Phase 2: Admin Panel - Backend API (1-2 minggu)
**Prioritas**: ⭐⭐⭐⭐⭐

- [ ] API: CRUD Guru
- [ ] API: CRUD Siswa
- [ ] API: CRUD Mata Pelajaran
- [ ] API: CRUD Kelas
- [ ] API: CRUD Jadwal Ujian
- [ ] API: Dashboard statistik

**Deliverables**:
- Semua API admin siap
- Testing dengan Postman

---

### Phase 3: Guru Panel - Backend API (2-3 minggu)
**Prioritas**: ⭐⭐⭐⭐⭐

- [ ] API: CRUD Soal (4 tipe: single, MASC, MAMC, kategori)
- [ ] API: CRUD Paket Ujian
- [ ] API: Monitoring real-time (Socket.io)
- [ ] API: Evaluasi & hasil ujian
- [ ] Logic: Penilaian otomatis (semua tipe soal)
- [ ] Logic: Randomisasi soal (untuk mobile)

**Deliverables**:
- Semua API guru siap
- Socket.io real-time working
- Penilaian otomatis working

---

### Phase 4: Siswa - Backend API (1-2 minggu)
**Prioritas**: ⭐⭐⭐⭐

- [ ] API: Daftar ujian tersedia
- [ ] API: Mulai ujian
- [ ] API: Submit jawaban
- [ ] API: Status ujian
- [ ] API: Selesai ujian & hitung nilai
- [ ] API: Hasil ujian
- [ ] API: Riwayat ujian

**Deliverables**:
- Semua API siswa siap
- Logic penilaian working

---

### Phase 5: Frontend Web - Setup & Admin (2-3 minggu)
**Prioritas**: ⭐⭐⭐⭐⭐

- [ ] Setup React + Vite
- [ ] Setup routing (React Router)
- [ ] Setup state management (Context API)
- [ ] Setup API service (Axios)
- [ ] Login page
- [ ] Admin Dashboard
- [ ] Admin: CRUD Guru
- [ ] Admin: CRUD Siswa
- [ ] Admin: CRUD Mata Pelajaran
- [ ] Admin: CRUD Kelas
- [ ] Admin: CRUD Jadwal Ujian

**Deliverables**:
- Admin panel siap digunakan
- Semua fitur admin working

---

### Phase 6: Frontend Web - Guru Panel (3-4 minggu)
**Prioritas**: ⭐⭐⭐⭐⭐

- [ ] Guru Dashboard
- [ ] Bank Soal:
  - List soal dengan filter
  - Form buat/edit soal (4 tipe)
  - Grouping soal
- [ ] Paket Ujian:
  - List paket ujian
  - Form buat/edit paket ujian
  - Pilih soal dari bank soal
- [ ] Monitoring Real-time:
  - Dashboard monitoring
  - Progress peserta (real-time update)
  - Detail peserta (expandable)
  - Pelanggaran terdeteksi
  - Kontrol ujian (hentikan, tambah waktu, reset)
  - Socket.io integration
- [ ] Detail Ujian
- [ ] Evaluasi:
  - Analisis per soal
  - Ringkasan kesulitan
  - Export Excel

**Deliverables**:
- Guru panel siap digunakan
- Monitoring real-time working
- Semua fitur guru working

---

### Phase 7: Mobile App - Flutter Setup & Core (1-2 minggu)
**Prioritas**: ⭐⭐⭐⭐

- [ ] Setup Flutter project
- [ ] Setup folder structure
- [ ] Setup state management (Provider)
- [ ] Setup API service (Dio)
- [ ] Setup local storage (SharedPreferences)
- [ ] Login page
- [ ] Dashboard

**Deliverables**:
- Flutter app structure siap
- Login working

---

### Phase 8: Mobile App - Fitur Ujian (3-4 minggu)
**Prioritas**: ⭐⭐⭐⭐

- [ ] Daftar Ujian:
  - List ujian tersedia
  - Filter & search
  - Status badge
- [ ] Mengerjakan Ujian:
  - Masuk ujian (input kode)
  - Tampilan soal (4 tipe)
  - Randomisasi soal & opsi
  - Navigation (prev, next, jump)
  - Bookmark soal
  - Timer countdown
  - Auto-save jawaban
  - Offline mode & sync
  - Submit ujian
- [ ] Hasil Ujian:
  - Tampilkan skor
  - Detail hasil
  - Review jawaban (optional)
- [ ] Riwayat Ujian
- [ ] Profil

**Deliverables**:
- Mobile app siap digunakan
- Fitur ujian working
- Randomisasi working

---

### Phase 9: Mobile App - Anti-Cheat (1-2 minggu)
**Prioritas**: ⭐⭐⭐

- [ ] Deteksi tab/app switching
- [ ] Deteksi screenshot
- [ ] Screen pinning detection
- [ ] Copy-paste detection
- [ ] Device rotation lock
- [ ] Activity logging
- [ ] Integration dengan backend (kirim log pelanggaran)

**Deliverables**:
- Anti-cheat features working
- Log pelanggaran terkirim ke backend

---

### Phase 10: Testing & Optimization (2 minggu)
**Prioritas**: ⭐⭐⭐

- [ ] Unit testing (backend)
- [ ] Integration testing
- [ ] E2E testing (web & mobile)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Bug fixing
- [ ] UI/UX improvement

**Deliverables**:
- Semua fitur tested
- Performance optimized
- Bug fixed

---

### Phase 11: Deployment ke VPS (1 minggu)
**Prioritas**: ⭐⭐⭐⭐

- [ ] Setup VPS (Ubuntu/CentOS)
- [ ] Install Node.js, MySQL, Nginx
- [ ] Setup database di VPS
- [ ] Deploy backend (PM2)
- [ ] Deploy frontend web (Nginx)
- [ ] Setup SSL (Let's Encrypt)
- [ ] Setup domain & DNS
- [ ] Build Flutter APK
- [ ] Testing production

**Deliverables**:
- Sistem live di VPS
- Domain & SSL working
- APK ready untuk distribusi

---

## 9. STRUKTUR FOLDER PROYEK

```
cat-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Koneksi MySQL
│   │   │   ├── env.js               # Environment variables
│   │   │   └── socket.js            # Socket.io config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── guruController.js
│   │   │   ├── siswaController.js
│   │   │   ├── soalController.js
│   │   │   ├── paketUjianController.js
│   │   │   ├── monitoringController.js
│   │   │   └── hasilController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Guru.js
│   │   │   ├── Siswa.js
│   │   │   ├── Soal.js
│   │   │   ├── PaketUjian.js
│   │   │   ├── PesertaUjian.js
│   │   │   ├── JawabanSiswa.js
│   │   │   ├── LogAktivitas.js
│   │   │   └── DeteksiPelanggaran.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   ├── guru.js
│   │   │   ├── siswa.js
│   │   │   └── monitoring.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   ├── roleCheck.js         # Role-based access
│   │   │   ├── errorHandler.js      # Error handling
│   │   │   └── validator.js         # Request validation
│   │   ├── utils/
│   │   │   ├── helpers.js            # Helper functions
│   │   │   ├── penilaian.js          # Logic penilaian soal
│   │   │   └── randomisasi.js       # Logic randomisasi
│   │   ├── services/
│   │   │   ├── socketService.js      # Socket.io service
│   │   │   └── emailService.js      # Email service (optional)
│   │   └── app.js                    # Express app setup
│   ├── uploads/                      # Folder upload gambar
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                     # Entry point
│   └── README.md
│
├── frontend-web/
│   ├── public/
│   │   ├── gambar/
│   │   │   ├── logo.png
│   │   │   └── sekolah.png
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Guru.jsx
│   │   │   │   ├── Siswa.jsx
│   │   │   │   ├── MataPelajaran.jsx
│   │   │   │   ├── Kelas.jsx
│   │   │   │   └── JadwalUjian.jsx
│   │   │   └── guru/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── BankSoal.jsx
│   │   │       ├── PaketUjian.jsx
│   │   │       ├── DetailUjian.jsx
│   │   │       ├── Monitoring.jsx
│   │   │       └── Evaluasi.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios API calls
│   │   ├── utils/
│   │   │   └── session.js           # Session management
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth context
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── mobile-app/
│   ├── android/
│   │   ├── app/
│   │   │   ├── build.gradle
│   │   │   └── ...
│   │   └── ...
│   ├── lib/
│   │   ├── main.dart
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── daftar_ujian_screen.dart
│   │   │   ├── ujian_screen.dart
│   │   │   ├── hasil_ujian_screen.dart
│   │   │   ├── riwayat_screen.dart
│   │   │   └── profil_screen.dart
│   │   ├── widgets/
│   │   │   ├── soal_widget.dart
│   │   │   ├── timer_widget.dart
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── soal_model.dart
│   │   │   ├── ujian_model.dart
│   │   │   └── jawaban_model.dart
│   │   ├── services/
│   │   │   ├── api_service.dart
│   │   │   ├── local_storage.dart
│   │   │   └── anti_cheat_service.dart
│   │   ├── providers/
│   │   │   ├── auth_provider.dart
│   │   │   └── ujian_provider.dart
│   │   └── utils/
│   │       ├── randomisasi.dart
│   │       └── helpers.dart
│   ├── pubspec.yaml
│   ├── .env
│   └── README.md
│
└── docs/
    ├── DETAIL_RANCANGAN_PROYEK_CAT.md  (file ini)
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.md
    ├── DEPLOYMENT_GUIDE.md
    └── TESTING_GUIDE.md
```

---

## 10. REQUIREMENTS & DEPENDENCIES

### 10.1 Backend (Node.js)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "socket.io": "^4.6.1",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.11.0",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 10.2 Frontend Web (React)
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.12.0",
    "axios": "^1.6.0",
    "react-icons": "^5.5.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.2.4"
  }
}
```

### 10.3 Mobile App (Flutter)
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.3.2
  provider: ^6.1.1
  shared_preferences: ^2.2.2
  sqflite: ^2.3.0
  screenshot_detector: ^1.0.0
  device_info_plus: ^9.1.0
```

---

## 11. CATATAN PENTING

### 11.1 Randomisasi Soal
- **Lokasi**: Aplikasi Mobile (Flutter) - Client Side
- **Alasan**: Setiap siswa mendapat urutan soal & opsi berbeda
- **Cara**: Backend kirim semua soal, mobile app melakukan shuffle
- **Data**: Jawaban tetap dikirim dengan referensi `soal_id` & `opsi_id` asli

### 11.2 Prioritas Pengembangan
1. **Web Backend** → Setup & API
2. **Web Frontend** → Admin & Guru Panel
3. **Mobile App** → Fitur Ujian Siswa

### 11.3 Database
- **Development**: MySQL di Laragon (local)
- **Production**: MySQL di VPS

### 11.4 Real-time Monitoring
- Menggunakan **Socket.io** untuk update real-time
- Update setiap 5 detik (configurable)
- Guru bisa toggle auto-refresh on/off

### 11.5 Tipe Soal TKA
- **4 varian**: Single Choice, MASC, MAMC, Kategori
- Setiap tipe memiliki logic penilaian berbeda
- Database schema mendukung semua tipe

### 11.6 Anti-Cheat
- Deteksi dilakukan di **Mobile App** (Flutter)
- Log pelanggaran dikirim ke **Backend**
- Guru bisa lihat pelanggaran di **Monitoring Panel**

---

## 12. NEXT STEPS

1. ✅ **Review dokumentasi ini** - Pastikan semua requirement jelas
2. ⬜ **Setup repository** - Buat repo GitHub/GitLab
3. ⬜ **Setup development environment** - Install Node.js, MySQL (Laragon), Flutter
4. ⬜ **Phase 1: Backend Core** - Mulai development backend
5. ⬜ **Phase 2-6: Web** - Development web admin & guru
6. ⬜ **Phase 7-9: Mobile** - Development mobile app
7. ⬜ **Phase 10-11: Testing & Deployment** - Testing & deploy ke VPS

---

## 13. KONTAK & SUPPORT

Jika ada pertanyaan atau perlu klarifikasi tentang dokumentasi ini, silakan diskusikan dengan tim development.

---

**Dokumen ini akan di-update sesuai perkembangan proyek.**

**Last Updated**: Desember 2024  
**Version**: 1.0

