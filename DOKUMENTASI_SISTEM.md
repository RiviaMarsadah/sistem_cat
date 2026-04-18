# Dokumentasi Sistem Website CAT (Computer Assisted Test)

Selamat datang di panduan teknis sistem Website CAT. Dokumen ini dirancang untuk membantu Anda memahami arsitektur, teknologi, dan alur kerja aplikasi ini secara mendalam.

---

## 🚀 Ringkasan Sistem
Aplikasi ini adalah platform ujian berbasis komputer (CAT) yang memungkinkan **Admin** mengelola data master, **Guru** membuat bank soal dan jadwal ujian, serta **Siswa** mengerjakan ujian secara real-time.

Sistem menggunakan arsitektur **Client-Server** yang terpisah antara Frontend dan Backend.

---

## 🛠️ Teknologi yang Digunakan

### 1. Backend (Server)
*   **Node.js & Express**: Framework utama untuk menjalankan logika server dan API.
*   **Prisma ORM**: Alat untuk berinteraksi dengan database MySQL menggunakan skema yang terstruktur.
*   **MySQL**: Sistem manajemen database relasional.
*   **Socket.io**: Digunakan untuk komunikasi real-time (misalnya: memantau status ujian siswa).
*   **JWT (JSON Web Token)**: Untuk sistem login dan pengamanan API.
*   **Google OAuth**: Integrasi login menggunakan akun Google.
*   **XLSX / Multer**: Digunakan untuk memproses impor data dari Excel dan unggah file gambar.

### 2. Frontend (Client)
*   **React (Vite)**: Framework library JavaScript untuk membangun antarmuka pengguna yang cepat.
*   **React Router DOM**: Untuk navigasi antar halaman (Multi-page App).
*   **Axios**: Library untuk melakukan request API ke backend.
*   **Socket.io Client**: Menghubungkan frontend dengan server real-time.
*   **Vanilla CSS**: Digunakan untuk styling yang fleksibel dan ringan.

---

## 📁 Pembagian Folder

### Root Directory
*   `/backend`: Berisi semua logika server, database, dan API.
*   `/frontend`: Berisi kode antarmuka pengguna (UI).
*   `/file_lain`: Dokumentasi tambahan atau aset pendukung.

### Arsitektur Backend (`/backend/src`)
*   `controllers/`: Logika bisnis (proses data sebelum dikirim ke client).
*   `routes/`: Definisi endpoint API (misal: `/api/auth`, `/api/siswa`).
*   `middleware/`: Fungsi pengecekan (misal: cek apakah user sudah login/admin).
*   `models/`: (Dalam Prisma, skema berada di `/prisma/schema.prisma`).
*   `services/`: Logika tambahan untuk integrasi pihak ketiga (misal: Google Cloud).
*   `utils/`: Fungsi pembantu/helper.

### Arsitektur Frontend (`/frontend/src`)
*   `pages/`: Komponen halaman utama (Admin, Guru, Siswa).
*   `components/`: Potongan UI yang bisa digunakan berulang kali (Tombol, Modal, Tabel).
*   `context/`: Manajemen state global (misal: data user yang sedang login).
*   `services/`: Berisi konfigurasi Axios untuk memanggil API.
*   `layout/`: Kerangka dasar halaman (Sidebar, Header).

---

## 🔄 Alur Kerja Sistem (Workflows)

### 1. Proses Autentikasi
*   User login melalui form atau Google Login.
*   Backend memverifikasi kredensial dan mengirimkan **Token JWT**.
*   Frontend menyimpan token tersebut untuk digunakan pada setiap request API berikutnya.

### 2. Manajemen Bank Soal (Guru)
*   Guru membuat **Bank Soal** (kumpulan pertanyaan).
*   Soal bisa dikelompokkan dalam **Koleksi**.
*   Mendukung berbagai tipe soal (Pilihan Ganda tunggal, Kompleks, dll).
*   Guru bisa mengimpor soal dalam jumlah banyak melalui file Excel.

### 3. Penjadwalan Ujian
*   Admin atau Guru membuat **Jadwal Ujian**.
*   Menghubungkan **Paket Ujian** (kumpulan soal yang dipilih) dengan **Kelas** dan **Waktu** tertentu.
*   Sistem akan secara otomatis memunculkan ujian di akun siswa saat waktu mulai tiba.

### 4. Pelaksanaan Ujian (Siswa)
*   Siswa memilih jadwal ujian yang aktif.
*   Sistem melakukan **Random Seed** agar urutan soal setiap siswa berbeda (mencegah kecurangan).
*   Jawaban disimpan secara otomatis ke database setiap kali siswa pindah soal.
*   Setelah selesai, sistem langsung menghitung nilai berdasarkan jawaban benar/salah.

---

## 📊 Skema Database (Prisma)
Inti dari sistem ini terletak pada beberapa tabel utama:
*   **Users**: Menyimpan data akun (Admin, Guru, Siswa).
*   **BankSoal**: Tempat menyimpan butir-butir pertanyaan.
*   **PaketUjian**: Wadah untuk mengelompokkan soal-soal tertentu.
*   **JadwalUjian**: Mengatur kapan dan siapa yang mengikuti ujian.
*   **UjianSiswa**: Mencatat hasil dan status pengerjaan setiap siswa.

---

## 🚀 Cara Menjalankan untuk Pengembangan

1.  **Backend**:
    *   Buka terminal di folder `backend`.
    *   Jalankan `npm install`.
    *   Setup database di file `.env`.
    *   Jalankan `npx prisma generate` dan `npx prisma migrate dev`.
    *   Jalankan `npm run dev`.

2.  **Frontend**:
    *   Buka terminal di folder `frontend`.
    *   Jalankan `npm install`.
    *   Jalankan `npm run dev`.

---

> [!TIP]
> **Sistem ini menggunakan Socket.io secara aktif!**
> Pastikan koneksi internet stabil saat pengembangan agar fitur monitoring real-time berjalan dengan baik.

---
*Dibuat untuk membantu memahami sistem tugas akhir CAT.*
