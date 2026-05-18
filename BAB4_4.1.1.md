# 4.1 Hasil Implementasi

## 4.1.1 Implementasi Basis Data (Database)

Hasil implementasi basis data pada sistem Computer Assisted Test (CAT) ini menggunakan MySQL sebagai database management system dan Prisma ORM sebagai media pengelolaan basis data. Relasi antar tabel dirancang secara terstruktur menggunakan pendekatan relasional (relational database) agar tercipta integritas data yang kuat antar setiap entitas. Berikut merupakan图文 relasi antar tabel dalam basis data sistem CAT yang telah dibuat serta penjelasan dari masing-masing tabel pembentuk sistem.

**[][Gambar 4.1 Relasi Antar Tabel dalam Basis Data]**
*placeholder: screenshot relasi antar tabel database (ERD / screenshot tabel dari MySQL Workbench / phpMyAdmin / DBeaver)*

Gambar 4.1 merupakan图文 relasi antar tabel dalam basis data MySQL yang menunjukkan keseluruhan tabel yang telah dibuat dalam sistem CAT. Setiap tabel saling terhubung satu sama lain melalui foreign key yang menghubungkan tabel child dengan tabel master-nya, sehingga tercipta hubungan relasional yang konsisten dan terjaga integritas datanya. Relasi yang digunakan dalam basis data ini menggunakan pola one-to-many dan many-to-many sesuai dengan kebutuhan sistem.

---

### 4.1.1.1 Tabel User

**[][Gambar 4.2 Tabel User]**
*placeholder: screenshot tabel user (struktur kolom dan data)*

Gambar 4.2 merupakan图文 implementasi basis data dari tabel user. Tabel user berfungsi sebagai tabel utama dalam menyimpan data akun pengguna sistem yang terbagi dalam tiga role, yaitu admin, guru, dan siswa. Tabel ini menjadi fondasi autentikasi dan otorisasi dalam sistem CAT. Berikut merupakan spesifikasi kolom pada tabel user:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment, sehingga setiap data pengguna otomatis mendapatkan id unik secara berurutan.

b. Kolom `email` menggunakan tipe data `VARCHAR(100)` dan di-set unique, berfungsi untuk menyimpan alamat surel (surat elektronik) pengguna sebagai identitas login yang bersifat unik.

c. Kolom `password` menggunakan tipe data `VARCHAR(255)` yang nullable, berfungsi untuk menyimpan kata sandi pengguna yang sudah di-hash menggunakan algoritma bcrypt. Kolom ini bersifat opsional karena pengguna dapat login menggunakan akun Google.

d. Kolom `role` menggunakan tipe data enum (`admin`, `guru`, `siswa`), berfungsi untuk menentukan hak akses dan peran pengguna dalam sistem.

e. Kolom `nama_lengkap` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama lengkap pengguna.

f. Kolom `status` menggunakan tipe data enum (`aktif`, `nonaktif`) dengan default `aktif`, berfungsi untuk menentukan status aktif atau nonaktifnya akun pengguna.

g. Kolom `google_id` menggunakan tipe data `VARCHAR(255)` yang nullable dan unique, berfungsi untuk menyimpan ID akun Google pengguna yang digunakan untuk proses autentikasi OAuth.

h. Kolom `google_picture` menggunakan tipe data `VARCHAR(500)` yang nullable, berfungsi untuk menyimpan URL foto profil Google pengguna.

i. Kolom `google_linked` menggunakan tipe data `BOOLEAN` dengan default `false`, berfungsi untuk menandakan apakah akun telah terhubung dengan Google.

j. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data secara otomatis.

---

### 4.1.1.2 Tabel Guru

**[][Gambar 4.3 Tabel Guru]**
*placeholder: screenshot tabel guru (struktur kolom dan data)*

Gambar 4.3 merupakan图文 implementasi basis data dari tabel guru. Tabel guru berfungsi untuk menyimpan data profil lengkap dari pengguna yang memiliki role sebagai guru, yang dihubunganlan dengan tabel user melalui relasi one-to-one. Berikut merupakan spesifikasi kolom pada tabel guru:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `user_id` menggunakan tipe data `INT` yang bersifat unique dan menjadi foreign key dari tabel user, berfungsi sebagai penghubung relasi one-to-one antara tabel guru dengan tabel user.

c. Kolom `nip` menggunakan tipe data `VARCHAR(20)` yang nullable, berfungsi untuk menyimpan Nomor Induk Pegawai (NIP) guru.

d. Kolom `jk` menggunakan tipe data enum (`L`, `P`) yang nullable, berfungsi untuk menyimpan jenis kelamin guru.

e. Kolom `foto` menggunakan tipe data `VARCHAR(255)` dengan default `default.jpg`, berfungsi untuk menyimpan nama file foto profil guru.

f. Kolom `tempat_lahir` menggunakan tipe data `VARCHAR(100)` yang nullable, berfungsi untuk menyimpan tempat lahir guru.

g. Kolom `tgl_lahir` menggunakan tipe data `VARCHAR(20)` yang nullable, berfungsi untuk menyimpan tanggal lahir guru.

h. Kolom `agama` menggunakan tipe data `VARCHAR(50)` yang nullable, berfungsi untuk menyimpan informasi agama guru.

i. Kolom `nohp` menggunakan tipe data `VARCHAR(20)` yang nullable, berfungsi untuk menyimpan nomor telepon guru.

j. Kolom `provinsi`, `kabupaten`, `kecamatan`, dan `desa` masing-masing menggunakan tipe data `VARCHAR(100)` yang nullable, berfungsi untuk menyimpan alamat lengkap guru.

k. Kolom `alamat` menggunakan tipe data `TEXT` yang nullable, berfungsi untuk menyimpan alamat lengkap dalam bentuk teks panjang.

l. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.3 Tabel Siswa

**[][Gambar 4.4 Tabel Siswa]**
*placeholder: screenshot tabel siswa (struktur kolom dan data)*

Gambar 4.4 merupakan图文 implementasi basis data dari tabel siswa. Tabel siswa berfungsi untuk menyimpan data profil lengkap dari pengguna yang memiliki role sebagai siswa, yang digunakan untuk kegiatan pengambilan ujian. Berikut merupakan spesifikasi kolom pada tabel siswa:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `user_id` menggunakan tipe data `INT` yang bersifat unique dan menjadi foreign key dari tabel user, berfungsi sebagai penghubung relasi one-to-one antara tabel siswa dengan tabel user.

c. Kolom `nis` menggunakan tipe data `VARCHAR(20)` yang nullable dan unique, berfungsi untuk menyimpan Nomor Induk Siswa (NIS) sebagai identitas utama siswa di sekolah.

d. Kolom `nisn` menggunakan tipe data `VARCHAR(20)` yang nullable dan unique, berfungsi untuk menyimpan Nomor Induk Siswa Nasional (NISN).

e. Kolom `kelas_id` menggunakan tipe data `INT` yang nullable dan menjadi foreign key dari tabel kelas, berfungsi untuk menyimpan relasi siswa dengan kelas yang diampunya.

f. Kolom `id_angkatan` menggunakan tipe data `INT` yang nullable dan menjadi foreign key dari tabel angkatan, berfungsi untuk menyimpan relasi siswa dengan angkatannya.

g. Kolom `jk` menggunakan tipe data enum (`L`, `P`) yang nullable, berfungsi untuk menyimpan jenis kelamin siswa.

h. Kolom `foto` menggunakan tipe data `VARCHAR(255)` dengan default `default.jpg`, berfungsi untuk menyimpan nama file foto profil siswa.

i. Kolom `tempat_lahir` dan `tgl_lahir` masing-masing menggunakan tipe data `VARCHAR(100)` dan `VARCHAR(20)` yang nullable, berfungsi untuk menyimpan data tempat dan tanggal lahir siswa.

j. Kolom `agama` dan `nohp` masing-masing menggunakan tipe data `VARCHAR(50)` dan `VARCHAR(20)` yang nullable, berfungsi untuk menyimpan data agama dan nomor telepon siswa.

k. Kolom `alamat` menggunakan tipe data `TEXT` yang nullable, berfungsi untuk menyimpan alamat lengkap siswa.

l. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.4 Tabel MataPelajaran

**[][Gambar 4.5 Tabel MataPelajaran]**
*placeholder: screenshot tabel mata_pelajaran (struktur kolom dan data)*

Gambar 4.5 merupakan图文 implementasi basis data dari tabel mata_pelajaran. Tabel mata_pelajaran berfungsi untuk menyimpan data mata pelajaran yang diajarkan di sekolah dan digunakan dalam pengelolaan bank soal serta penjadwalan ujian. Berikut merupakan spesifikasi kolom pada tabel mata_pelajaran:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama_mapel` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama mata pelajaran.

c. Kolom `kode_mapel` menggunakan tipe data `VARCHAR(20)` yang nullable dan unique, berfungsi untuk menyimpan kode unik mata pelajaran.

d. Kolom `deskripsi` menggunakan tipe data `TEXT` yang nullable, berfungsi untuk menyimpan deskripsi atau informasi tambahan mengenai mata pelajaran.

e. Kolom `created_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan data mata pelajaran.

---

### 4.1.1.5 Tabel Jurusan

**[][Gambar 4.6 Tabel Jurusan]**
*placeholder: screenshot tabel jurusan (struktur kolom dan data)*

Gambar 4.6 merupakan图文 implementasi basis data dari tabel jurusan. Tabel jurusan berfungsi untuk menyimpan data program studi atau jurusan yang tersedia di sekolah, yang digunakan untuk pengelompokan kelas dan bank soal. Berikut merupakan spesifikasi kolom pada tabel jurusan:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `kode_prodi` menggunakan tipe data `VARCHAR(20)` yang unique, berfungsi untuk menyimpan kode program studi jurusan.

c. Kolom `nama_prodi` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama program studi jurusan.

d. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.6 Tabel Kelas

**[][Gambar 4.7 Tabel Kelas]**
*placeholder: screenshot tabel kelas (struktur kolom dan data)*

Gambar 4.7 merupakan图文 implementasi basis data dari tabel kelas. Tabel kelas berfungsi untuk menyimpan data kelas yang merupakan kombinasi antara tingkat kelas, jurusan, dan inisial kelas. Berikut merupakan spesifikasi kolom pada tabel kelas:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama_kelas` menggunakan tipe data `VARCHAR(50)`, berfungsi untuk menyimpan nama kelas, misalnya "X IPA 1".

c. Kolom `tingkat` menggunakan tipe data enum (`X`, `XI`, `XII`, `ALUMNI`, `KI`), berfungsi untuk menyimpan tingkat kelas siswa.

d. Kolom `jurusan_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel jurusan, berfungsi untuk menghubungkan kelas dengan jurusan yang tepat.

e. Kolom `inisial` menggunakan tipe data `VARCHAR(10)`, berfungsi untuk menyimpan inisial kelas, misalnya "1", "2", atau "3".

f. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.7 Tabel Angkatan

**[][Gambar 4.8 Tabel Angkatan]**
*placeholder: screenshot tabel angkatan (struktur kolom dan data)*

Gambar 4.8 merupakan图文 implementasi basis data dari tabel angkatan. Tabel angkatan berfungsi untuk menyimpan data angkatan atau tahun masuk siswa yang digunakan sebagai referensi pengelompokan siswa. Berikut merupakan spesifikasi kolom pada tabel angkatan:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama_angkatan` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama angkatan, misalnya "Angkatan 2023".

c. Kolom `tahun_angkatan` menggunakan tipe data `INT` yang unique, berfungsi untuk menyimpan tahun angkatan yang digunakan sebagai identitas unik.

d. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.8 Tabel BankSoalKoleksi

**[][Gambar 4.9 Tabel BankSoalKoleksi]**
*placeholder: screenshot tabel bank_soal_koleksi (struktur kolom dan data)*

Gambar 4.9 merupakan图文 implementasi basis data dari tabel bank_soal_koleksi. Tabel bank_soal_koleksi berfungsi sebagai wadah pengelompokan soal-soal yang dibuat oleh guru berdasarkan koleksi tertentu, sehingga memudahkan guru dalam mengelola bank soal secara terorganisir. Berikut merupakan spesifikasi kolom pada tabel bank_soal_koleksi:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `guru_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel guru, berfungsi untuk menghubungkan koleksi dengan guru pemilik koleksi.

c. Kolom `nama` menggunakan tipe data `VARCHAR(120)`, berfungsi untuk menyimpan nama koleksi soal.

d. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.9 Tabel BankSoal

**[][Gambar 4.10 Tabel BankSoal]**
*placeholder: screenshot tabel bank_soal (struktur kolom dan data)*

Gambar 4.10 merupakan图文 implementasi basis data dari tabel bank_soal. Tabel bank_soal berfungsi untuk menyimpan seluruh soal ujian yang dibuat oleh guru, dengan dukungan tiga tipe soal yaitu Pilihan Ganda (pilgan), Pilihan Ganda Kompleks (pilgan_kompleks), dan Pilihan Ganda Kategori (pilgan_kategori). Berikut merupakan spesifikasi kolom pada tabel bank_soal:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `bank_soal_koleksi_id` menggunakan tipe data `INT` yang nullable dan menjadi foreign key dari tabel bank_soal_koleksi, berfungsi untuk menghubungkan soal dengan koleksi tertentu.

c. Kolom `mata_pelajaran_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel mata_pelajaran, berfungsi untuk menghubungkan soal dengan mata pelajaran yang relevan.

d. Kolom `tingkat` menggunakan tipe data enum (`X`, `XI`, `XII`, `SEMUA`), berfungsi untuk menentukan tingkat kelas yang dapat mengerjakan soal tersebut.

e. Kolom `jurusan_id` menggunakan tipe data `INT` yang nullable dan menjadi foreign key dari tabel jurusan, berfungsi untuk membatasi soal hanya untuk jurusan tertentu.

f. Kolom `guru_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel guru, berfungsi untuk menghubungkan soal dengan guru yang membuatnya.

g. Kolom `kategori_soal` menggunakan tipe data enum (`pilgan`, `pilgan_kompleks`, `pilgan_kategori`), berfungsi untuk menentukan tipe atau kategori soal yang digunakan.

h. Kolom `soal` menggunakan tipe data `TEXT` yang nullable, berfungsi untuk menyimpan teks atau pertanyaan dari soal.

i. Kolom `kolom_a` hingga `kolom_f` masing-masing menggunakan tipe data `VARCHAR(500)` yang nullable, berfungsi untuk menyimpan pilihan jawaban A sampai F.

j. Kolom `jawaban` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan kunci jawaban yang benar.

k. Kolom `gambar` menggunakan tipe data `VARCHAR(500)` yang nullable, berfungsi untuk menyimpan nama file gambar yang dilampirkan pada soal.

l. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.10 Tabel PaketUjian

**[][Gambar 4.11 Tabel PaketUjian]**
*placeholder: screenshot tabel paket_ujian (struktur kolom dan data)*

Gambar 4.11 merupakan图文 implementasi basis data dari tabel paket_ujian. Tabel paket_ujian berfungsi untuk menyimpan data paket ujian yang merupakan kumpulan soal yang telah dikurasi oleh guru untuk digunakan dalam suatu ujian tertentu. Berikut merupakan spesifikasi kolom pada tabel paket_ujian:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama` menggunakan tipe data `VARCHAR(200)`, berfungsi untuk menyimpan nama paket ujian.

c. Kolom `mata_pelajaran_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel mata_pelajaran, berfungsi untuk menghubungkan paket ujian dengan mata pelajaran yang diujikan.

d. Kolom `tingkat` menggunakan tipe data enum (`X`, `XI`, `XII`, `SEMUA`), berfungsi untuk menentukan tingkat kelas yang dapat mengikuti paket ujian ini.

e. Kolom `tipe_ujian` menggunakan tipe data enum (`UH`, `UTS`, `UAS`, `Lainnya`), berfungsi untuk menyimpan tipe atau kategori ujian.

f. Kolom `guru_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel guru, berfungsi untuk menghubungkan paket ujian dengan guru yang membuatnya.

g. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.11 Tabel SoalPaketUjian

**[][Gambar 4.12 Tabel SoalPaketUjian]**
*placeholder: screenshot tabel soal_paket_ujian (struktur kolom dan data)*

Gambar 4.12 merupakan图文 implementasi basis data dari tabel soal_paket_ujian. Tabel soal_paket_ujian berfungsi sebagai tabel penghubung many-to-many antara tabel paket_ujian dan tabel bank_soal, yang menentukan soal-soal mana saja yang masuk dalam suatu paket ujian. Berikut merupakan spesifikasi kolom pada tabel soal_paket_ujian:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `paket_ujian_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel paket_ujian, berfungsi untuk menghubungkan soal dengan paket ujian terkait.

c. Kolom `bank_soal_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel bank_soal, berfungsi untuk menghubungkan paket ujian dengan soal tertentu.

d. Kolom `created_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu penambahkan soal ke dalam paket ujian.

---

### 4.1.1.12 Tabel JadwalUjian

**[][Gambar 4.13 Tabel JadwalUjian]**
*placeholder: screenshot tabel jadwal_ujian (struktur kolom dan data)*

Gambar 4.13 merupakan图文 implementasi basis data dari tabel jadwal_ujian. Tabel jadwal_ujian berfungsi untuk menyimpan seluruh data penjadwalan ujian yang memuat informasi waktu pelaksanaan, durasi, token akses, serta paket ujian yang digunakan. Berikut merupakan spesifikasi kolom pada tabel jadwal_ujian:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama atau judul jadwal ujian.

c. Kolom `kategori` menggunakan tipe data enum (`terjadwal`, `custom`) dengan default `terjadwal`, berfungsi untuk membedakan jenis penjadwalan ujian.

d. Kolom `mata_pelajaran_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel mata_pelajaran, berfungsi untuk menghubungkan jadwal ujian dengan mata pelajaran.

e. Kolom `mulai_pada` menggunakan tipe data `DATETIME`, berfungsi untuk menyimpan tanggal dan waktu dimulainya ujian.

f. Kolom `selesai_pada` menggunakan tipe data `DATETIME`, berfungsi untuk menyimpan tanggal dan waktu berakhirnya ujian.

g. Kolom `durasi` menggunakan tipe data `INT` dengan default `60` (menit), berfungsi untuk menyimpan durasi waktu pengerjaan ujian.

h. Kolom `token` menggunakan tipe data `VARCHAR(6)` yang nullable, berfungsi untuk menyimpan token masuk yang wajib dimasukkan siswa sebelum mengikuti ujian.

i. Kolom `token_checkout` menggunakan tipe data `VARCHAR(6)` yang nullable, berfungsi untuk menyimpan token checkout yang wajib dimasukkan siswa saat akan submit ujian.

j. Kolom `guru_id` menggunakan tipe data `INT` yang nullable dan menjadi foreign key dari tabel guru, berfungsi untuk menghubungkan jadwal ujian dengan guru pengawas.

k. Kolom `opsi_keamanan` menggunakan tipe data `BOOLEAN` dengan default `false`, berfungsi untuk mengaktifkan atau menonaktifkan fitur keamanan tambahan dalam ujian.

l. Kolom `paket_ujian_id`, `periode_id`, dan `jurusan_id` masing-masing menggunakan tipe data `INT` yang nullable, berfungsi untuk menghubungkan jadwal ujian dengan paket ujian, periode ujian, dan jurusan terkait.

m. Kolom `ruangan` menggunakan tipe data `VARCHAR(50)` yang nullable, berfungsi untuk menyimpan informasi ruangan tempat ujian dilaksanakan.

---

### 4.1.1.13 Tabel PeriodeUjian

**[][Gambar 4.14 Tabel PeriodeUjian]**
*placeholder: screenshot tabel periode_ujian (struktur kolom dan data)*

Gambar 4.14 merupakan图文 implementasi basis data dari tabel periode_ujian. Tabel periode_ujian berfungsi untuk menyimpan data periode atau tahun ajaran yang digunakan sebagai acuan dalam penjadwalan ujian di sekolah. Berikut merupakan spesifikasi kolom pada tabel periode_ujian:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `nama` menggunakan tipe data `VARCHAR(100)`, berfungsi untuk menyimpan nama periode, misalnya "Semester Ganjil 2024/2025".

c. Kolom `mulai_periode` menggunakan tipe data `DATETIME`, berfungsi untuk menyimpan tanggal dimulainya periode ujian.

d. Kolom `selesai_periode` menggunakan tipe data `DATETIME`, berfungsi untuk menyimpan tanggal berakhirnya periode ujian.

e. Kolom `semester` menggunakan tipe data `VARCHAR(10)`, berfungsi untuk menyimpan informasi semester, misalnya "Ganjil" atau "Genap".

f. Kolom `tahun_ajaran` menggunakan tipe data `VARCHAR(20)`, berfungsi untuk menyimpan tahun ajaran, misalnya "2024/2025".

g. Kolom `created_by` menggunakan tipe data `INT`, berfungsi untuk menyimpan id pengguna yang membuat periode ujian ini.

h. Kolom `created_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan data periode.

---

### 4.1.1.14 Tabel UjianSiswa

**[][Gambar 4.15 Tabel UjianSiswa]**
*placeholder: screenshot tabel ujian_siswa (struktur kolom dan data)*

Gambar 4.15 merupakan图文 implementasi basis data dari tabel ujian_siswa. Tabel ujian_siswa berfungsi untuk menyimpan data sesi ujian yang dilakukan oleh siswa, termasuk status pengerjaan, nilai yang diperoleh, serta seed pengacakan soal. Berikut merupakan spesifikasi kolom pada tabel ujian_siswa:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `siswa_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel siswa, berfungsi untuk menghubungkan sesi ujian dengan siswa yang mengerjakannya.

c. Kolom `jadwal_ujian_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel jadwal_ujian, berfungsi untuk menghubungkan sesi ujian dengan jadwal ujian yang diambil.

d. Kolom `status` menggunakan tipe data enum (`waiting`, `berlangsung`, `selesai`) dengan default `berlangsung`, berfungsi untuk menunjukkan status pengerjaan ujian siswa.

e. Kolom `random_seed` menggunakan tipe data `INT`, berfungsi untuk menyimpan nilai seed yang digunakan dalam algoritma pengacakan soal dan pilihan jawaban agar setiap siswa mendapatkan urutan yang berbeda.

f. Kolom `total_soal` menggunakan tipe data `INT` dengan default `0`, berfungsi untuk menyimpan jumlah total soal yang diberikan kepada siswa.

g. Kolom `benar`, `salah`, `kosong`, dan `ragu_ragu` masing-masing menggunakan tipe data `INT` dengan default `0`, berfungsi untuk menyimpan jumlah jawaban yang benar, salah, kosong, dan ragu-ragu.

h. Kolom `nilai_akhir` menggunakan tipe data `DECIMAL(5,2)` dengan default `0`, berfungsi untuk menyimpan nilai akhir ujian siswa.

i. Kolom `mulai_pada` menggunakan tipe data `DATETIME` dengan default now, berfungsi untuk menyimpan waktu dimulainya pengerjaan ujian.

j. Kolom `selesai_pada` menggunakan tipe data `DATETIME` yang nullable, berfungsi untuk menyimpan waktu berakhirnya pengerjaan ujian.

k. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.

---

### 4.1.1.15 Tabel JawabanSiswa

**[][Gambar 4.16 Tabel JawabanSiswa]**
*placeholder: screenshot tabel jawaban_siswa (struktur kolom dan data)*

Gambar 4.16 merupakan图文 implementasi basis data dari tabel jawaban_siswa. Tabel jawaban_siswa berfungsi untuk menyimpan seluruh data jawaban yang diberikan oleh siswa untuk setiap soal pada saat mengerjakan ujian, termasuk status dan skor setiap jawaban. Berikut merupakan spesifikasi kolom pada tabel jawaban_siswa:

a. Kolom `id` merupakan primary key pada tabel ini dengan tipe data `INT` yang di-set auto increment.

b. Kolom `ujian_siswa_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel ujian_siswa, berfungsi untuk menghubungkan jawaban dengan sesi ujian siswa terkait.

c. Kolom `bank_soal_id` menggunakan tipe data `INT` yang menjadi foreign key dari tabel bank_soal, berfungsi untuk menghubungkan jawaban dengan soal asli dalam bank soal.

d. Kolom `nomor_soal` menggunakan tipe data `INT`, berfungsi untuk menyimpan nomor urut soal yang ditampilkan kepada siswa (sesuai hasil pengacakan).

e. Kolom `tipe_soal` menggunakan tipe data enum (`pilgan`, `pilgan_kompleks`, `pilgan_kategori`), berfungsi untuk menyimpan tipe soal yang dijawab siswa.

f. Kolom `jawaban_siswa` menggunakan tipe data `VARCHAR(255)` yang nullable, berfungsi untuk menyimpan jawaban yang dipilih oleh siswa.

g. Kolom `status_jawaban` menggunakan tipe data enum (`dijawab`, `kosong`, `ragu_ragu`) dengan default `kosong`, berfungsi untuk menunjukkan status jawaban siswa.

h. Kolom `is_benar` menggunakan tipe data `BOOLEAN` yang nullable, berfungsi untuk menandakan apakah jawaban siswa benar atau salah.

i. Kolom `skor_item` menggunakan tipe data `DECIMAL(5,2)` dengan default `0`, berfungsi untuk menyimpan skor yang diperoleh pada soal tersebut.

j. Kolom `created_at` dan `updated_at` menggunakan tipe data `TIMESTAMP`, berfungsi untuk mencatat waktu pembuatan dan pembaruan data.