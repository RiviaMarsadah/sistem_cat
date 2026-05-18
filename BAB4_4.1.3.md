# 4.1.3 Implementasi Tampilan Website (Frontend)

Bagian ini menjelaskan tampilan antarmuka pengguna (user interface/UI) pada website CAT yang dibangun menggunakan React.js dengan Vite. Seluruh halaman dirancang agar responsif dan intuitif, dengan pemisahan hak akses antara Administrator dan Guru. Masing-masing halaman disertai placeholder gambar serta penjelasan singkat mengenai komponen dan fungsinya.

---

## 4.1.3.1 Struktur Direktori Frontend

`[][Gambar 4.x Struktur Direktori Frontend React]`

Menampilkan gambar berupa hierarki folder dan file pada direktori proyek frontend. Struktur direktori frontend website CAT secara garis besar terdiri atas beberapa folder utama, yaitu folder `src/` sebagai direktori kerja utama yang menyimpan seluruh kode sumber React. Di dalam `src/` terdapat folder `assets/` yang digunakan untuk menyimpan file gambar, font, dan sumber daya statis lainnya yang dibutuhkan oleh aplikasi. Folder `components/` memuat komponen React yang bersifat reusable dan dapat digunakan kembali di berbagai halaman, seperti komponen navigasi sidebar, header, card, modal, dan komponen UI umum lainnya. Folder `pages/` merupakan direktori yang menyimpan seluruh halaman (view) aplikasi, di mana setiap halaman dipisah ke dalam sub-folder `admin/` dan `guru/` berdasarkan hak akses penggunanya. Folder `services/` berisi konfigurasi layanan API menggunakan Axios, termasuk pengaturan base URL, header request, dan interceptors untuk kebutuhan autentikasi JWT. Folder `context/` menyimpan React Context yang digunakan untuk mengelola state secara global, seperti `AuthContext` yang menangani informasi user yang sedang login, serta state-role terkait. Folder `styles/` menyimpan file CSS atau preprocessor lain yang mendefinisikan tampilan dan tema visual aplikasi. File konfigurasi utama seperti `App.jsx` sebagai root component dan `main.jsx` sebagai entry point berada di tingkat root direktori `src/`. Dengan adanya pemisahan folder seperti ini, struktur kode menjadi lebih rapi, mudah dipelihara, dan scalable untuk pengembangan fitur baru.

---

## 4.1.3.2 Halaman Login Admin/Guru

`[][Gambar 4.x Halaman Login Admin dan Guru]`

Berfungsi sebagai tampakan halaman login yang digunakan oleh Administrator dan Guru untuk mengakses sistem. Halaman login terbagi menjadi dua bagian utama, yaitu bagian kiri yang berisi gambar atau ilustrasi sekolah/institusi berikut logo, nama aplikasi, serta slogan, dan bagian kanan yang berisi form login. Bagian form login menampilkan judul halaman \"Login\" serta tombol \"Masuk dengan Google\" yang berfungsi sebagai tombol utama untuk melakukan autentikasi menggunakan akun Google OAuth 2.0. Ketika tombol diklik, sistem akan mengarahkan (redirect) pengguna ke halaman consent Google untuk memilih atau memasukkan akun Google yang sudah terdaftar sebagai Admin atau Guru dalam database sistem. Setelah proses autentikasi berhasil, sistem akan menerima token JWT yang disimpan ke dalam localStorage atau session storage, lalu mengarahkan pengguna ke halaman dashboard sesuai dengan role-nya, apakah Administrator atau Guru. Desain halaman ini menggunakan layout split-screen yang estetis dan modern, dengan kombinasi warna biru dan putih yang bersih serta responsif terhadap berbagai ukuran layar perangkat.

---

## 4.1.3.3 Halaman Dashboard Admin

`[][Gambar 4.x Halaman Dashboard Administrator]`

Merupakan tampakan halaman dashboard utama yang ditampilkan kepada Administrator setelah berhasil login ke dalam sistem. Halaman ini berfungsi sebagai pusat kendali (control center) bagi Administrator untuk memantau seluruh aktivitas dan data yang ada dalam sistem CAT. Bagian atas halaman menampilkan header dengan judul \"Dashboard\" serta badge \"Admin\" untuk menunjukkan peran pengguna yang sedang aktif. Di bagian utama dashboard, terdapat sepuluh buah kartu statistik yang masing-masing menampilkan jumlah data dari setiap entitas sistem, yaitu jumlah Mata Pelajaran, jumlah Kelas, jumlah Siswa, jumlah Guru, jumlah Admin, jumlah Jurusan, jumlah Angkatan, jumlah Periode, jumlah Jadwal Ujian aktif, serta jumlah Ujian yang sedang berjalan. Kartu-kartu statistik ini dirancang secara visual dengan ikon dan warna yang berbeda-beda agar mudah dibedakan satu sama lain. Selain kartu statistik, halaman dashboard Admin juga menampilkan tiga buah widget informasi di bagian tengah, yaitu widget Periode Aktif yang menunjukkan periode ujian yang sedang berlangsung, widget Jadwal Terbaru yang menampilkan daftar jadwal ujian terbaru, serta widget Siswa Terbaru yang menampilkan daftar siswa yang baru terdaftar. Di bagian bawah, terdapat tiga buah grafik interaktif yang membantu Administrator dalam menganalisis data, yaitu grafik batang (Bar Chart) yang menampilkan distribusi jumlah siswa per angkatan, grafik lingkaran (Pie Chart) yang menampilkan distribusi siswa berdasarkan tingkat kelas, dan grafik batang kedua yang menampilkan distribusi rata-rata nilai ujian siswa. Seluruh komponen pada halaman ini saling terintegrasi secara real-time dan terhubung langsung dengan database melalui API backend.

---

## 4.1.3.4 Halaman Manajemen Jurusan

`[][Gambar 4.x Halaman Daftar Jurusan]`

`[][Gambar 4.x Halaman Tambah/Edit Jurusan]`

Menyajikan tampakan halaman pengelolaan data jurusan atau program studi yang tersedia di sekolah. Halaman ini digunakan oleh Administrator untuk melakukan operasi CRUD (Create, Read, Update, Delete) terhadap data jurusan. Pada tampilan daftar jurusan, terdapat sebuah tabel yang memuat dua kolom utama, yaitu kolom \"Kode Prodi\" yang berisi kode identifikasi singkat untuk setiap program studi, dan kolom \"Nama Prodi\" yang berisi nama lengkap program studi. Setiap baris data pada tabel dilengkapi dengan tombol aksi berupa ikon edit dan ikon hapus. Administrator dapat mencari data jurusan tertentu menggunakan kolom pencarian yang tersedia di bagian atas tabel. Fitur pagination juga disediakan untuk memudahkan navigasi data ketika jumlah jurusan cukup banyak. Untuk menambah data jurusan baru, Administrator dapat mengklik tombol \"Tambah Jurusan\" yang berada di pojok kanan atas tabel, sehingga akan muncul sebuah modal form berisi kolom input untuk memasukkan Kode Prodi dan Nama Prodi baru. Setelah data diisi, Administrator harus mengkonfirmasi penambahan data tersebut sebelum data disimpan ke database. Sementara itu, untuk mengubah data jurusan yang sudah ada, Administrator cukup mengklik tombol edit pada baris data yang diinginkan, lalu modal form akan menampilkan data lama yang siap untuk diedit. Proses penghapusan data jurusan juga disertai dengan konfirmasi untuk mencegah penghapusan yang tidak disengaja.

---

## 4.1.3.5 Halaman Manajemen Mata Pelajaran

`[][Gambar 4.x Halaman Daftar Mata Pelajaran]`

`[][Gambar 4.x Halaman Tambah/Edit Mata Pelajaran]`

Merupakan tampakan halaman pengelolaan data mata pelajaran yang digunakan dalam sistem ujian. Administrator menggunakan halaman ini untuk mengelola seluruh mata pelajaran yang diajarkan di sekolah dan dapat diujikan melalui sistem CAT. Tampilan halaman daftar mata pelajaran menggunakan layout tabel yang serupa dengan halaman manajemen jurusan, dengan kolom \"Nama Mata Pelajaran\" yang berisi nama lengkap mata pelajaran serta kolom \"Kode Mapel\" opsional yang berisi kode singkatan untuk mata pelajaran tersebut. Setiap entitas data mata pelajaran disertai dengan tombol aksi edit dan hapus yang berfungsi untuk mengubah atau menghapus data. Di bagian atas tabel tersedia kolom pencarian untuk memfilter data mata pelajaran berdasarkan nama atau kode, serta pagination untuk navigasi data. Proses penambahan dan pengeditan mata pelajaran dilakukan melalui modal form popup yang berisi kolom input untuk nama dan kode mata pelajaran, dengan validasi sederhana untuk memastikan data yang dimasukkan tidak kosong. Fitur inline editing memungkinkan Administrator mengubah data secara langsung pada baris tabel tanpa harus membuka modal, sehingga mempercepat proses pembaruan data yang sederhana.

---

## 4.1.3.6 Halaman Manajemen Kelas

`[][Gambar 4.x Halaman Daftar Kelas]`

`[][Gambar 4.x Halaman Tambah/Edit Kelas]`

Berupa tampakan halaman pengelolaan data kelas yang berfungsi untuk mengelompokkan siswa berdasarkan tingkat dan program studi. Berbeda dengan halaman manajemen sebelumnya, halaman ini memiliki relasi data yang lebih kompleks karena setiap kelas dibangun dari kombinasi antara tingkat kelas, jurusan atau program studi, serta inisial kelas opsional. Pada tampilan daftar kelas, tabel memuat kolom \"Nama Kelas\" yang merupakan gabungan otomatis dari tingkat, kode prodi, dan inisial kelas, kolom \"Tingkat\" yang menunjukkan jenjang kelas (X, XI, XII), kolom \"Jurusan\" yang menunjukkan program studi terkait, serta kolom \"Inisial\" untuk singkatan tambahan seperti \"1\" atau \"2\" pada kelas paralel. Administrator dapat menambah kelas baru melalui modal form yang menyediakan dropdown untuk memilih tingkat kelas dan dropdown untuk memilih jurusan atau program studi, serta kolom input untuk inisial kelas. Sistem secara otomatis menghitung dan menampilkan preview nama kelas di bagian bawah form berdasarkan kombinasi pilihan dropdown dan input yang diisi, sehingga Administrator dapat memastikan nama kelas yang dihasilkan sudah sesuai sebelum disimpan. Tombol edit dan hapus tersedia pada setiap baris data untuk mengelola kelas yang sudah ada.

---

## 4.1.3.7 Halaman Manajemen Angkatan

`[][Gambar 4.x Halaman Daftar Angkatan]`

`[][Gambar 4.x Halaman Tambah/Edit Angkatan]`

Berfungsi sebagai tampakan halaman pengelolaan data angkatan yang digunakan untuk mengelompokkan siswa berdasarkan tahun masuk atau tahun ajaran. Halaman ini memiliki tampilan yang relatif lebih sederhana dibandingkan halaman manajemen sebelumnya karena data angkatan hanya terdiri dari tahun angkatan itu sendiri. Pada tampilan daftar angkatan, terdapat tabel yang memuat kolom \"Tahun Angkatan\" berisi nomor tahun seperti \"2024\", \"2025\", dan seterusnya. Setiap baris dilengkapi dengan tombol edit dan tombol hapus yang masing-masing berfungsi untuk mengubah atau menghapus data angkatan. Fitur pencarian tersedia di bagian atas tabel untuk memudahkan pencarian angkatan tertentu. Untuk menambahkan angkatan baru, Administrator mengklik tombol \"Tambah Angkatan\" yang membuka modal form berisi kolom input tahun angkatan. Proses pengeditan dan penghapusan data angkatan juga dilakukan melalui modal konfirmasi untuk menjaga keamanan data. Pengaturan angkatan ini penting karena setiap siswa harus memiliki relasi terhadap angkatan tertentu, sehingga data siswa dapat dikelompokkan dan dilaporkan berdasarkan tahun masuknya.

---

## 4.1.3.8 Halaman Manajemen User Admin

`[][Gambar 4.x Halaman Daftar User Admin]`

`[][Gambar 4.x Halaman Tambah/Edit User Admin]`

Menampilkan tampakan halaman pengelolaan akun Administrator sistem yang memiliki hak akses penuh terhadap seluruh fitur dan data dalam website CAT. Halaman ini digunakan oleh Administrator untuk mendaftarkan, mengubah, atau menonaktifkan akun Administrator lain dalam sistem. Tampilan daftar admin disajikan dalam bentuk tabel yang memuat kolom \"Nama Lengkap\" berisi nama Administrator, kolom \"Email\" berisi alamat surel yang digunakan untuk login, kolom \"Status\" berisi indikator aktif atau nonaktif yang ditampilkan dalam bentuk badge berwarna hijau dan merah, serta kolom \"Aksi\" yang berisi tombol edit dan hapus. Untuk mendaftarkan Administrator baru, Administrator dapat mengklik tombol \"Tambah Admin\" pada pojok kanan atas halaman, sehingga modal form akan muncul dengan kolom input untuk mengisi nama lengkap Administrator, email aktif, serta password awal yang digunakan untuk login pertama kali. Toggle switch tersedia pada form edit untuk mengaktifkan atau menonaktifkan akun Administrator tertentu tanpa harus menghapusnya dari database, sehingga Administrator yang berhalangan hadir tetap bisa dinonaktifkan sementara. Fitur pencarian dan pagination juga tersedia pada halaman ini untuk memudahkan navigasi data Administrator yang mungkin cukup banyak.

---

## 4.1.3.9 Halaman Manajemen User Guru

`[][Gambar 4.x Halaman Daftar User Guru]`

`[][Gambar 4.x Halaman Tambah/Edit User Guru]`

`[][Gambar 4.x Halaman Import Guru dari File Excel]`

Berupa tampakan halaman pengelolaan data guru pengajar yang memiliki akses ke fitur-fitur tertentu dalam sistem, seperti pembuatan bank soal, paket ujian, jadwal ujian, serta pemantauan hasil ujian siswa. Halaman ini memiliki tampilan tabel yang lebih komprehensif karena memuat lebih banyak kolom informasi guru. Kolom-kolom yang tersedia pada tabel meliputi: kolom \"Nama Lengkap\" berisi nama guru, kolom \"Email\" berisi surel guru, kolom \"NIP\" berisi Nomor Induk Pegawai, kolom \"JK\" berisi jenis kelamin (L/P), kolom \"Tempat Lahir\" dan \"Tanggal Lahir\" untuk data kependudukan, kolom \"Agama\", kolom \"No HP\", kolom \"Provinsi\", \"Kabupaten\", \"Kecamatan\", \"Desa\", dan \"Alamat\" untuk alamat lengkap guru, serta kolom \"Status\" yang menunjukkan apakah akun guru dalam keadaan aktif atau nonaktif. Setiap baris data juga dilengkapi dengan foto profil placeholder yang menampilkan inisial nama guru. Fitur pencarian tersedia untuk memfilter guru berdasarkan nama, email, atau NIP. Untuk menambah guru, Administrator dapat menggunakan tombol \"Tambah Guru\" yang membuka modal form berisi seluruh kolom data diri guru. Selain itu, Administrator juga dapat mengimpor data guru secara massal dari file Excel menggunakan tombol \"Import Excel\" yang tersedia di pojok kanan atas. Fitur import ini membuka modal terpisah yang menyediakan area drag-and-drop untuk file Excel serta tombol unduh template Excel agar format file yang diunggah sesuai dengan struktur database. Setelah proses import selesai, sistem akan menampilkan ringkasan hasil import yang mencakup jumlah data berhasil diimpor, jumlah data yang dilewati karena email sudah terdaftar, dan jumlah data yang gagal karena format tidak valid.

---

## 4.1.3.10 Halaman Manajemen User Siswa

`[][Gambar 4.x Halaman Daftar Siswa]`

`[][Gambar 4.x Halaman Tambah/Edit Siswa]`

`[][Gambar 4.x Halaman Import Siswa dari File Excel]`

Berfungsi sebagai tampakan halaman pengelolaan data siswa yang merupakan pengguna utama sistem CAT melalui aplikasi mobile. Halaman ini memiliki tampilan paling kompleks karena memuat seluruh data profil siswa yang diperlukan untuk keperluan ujian dan pelaporan. Tabel daftar siswa memuat kolom-kolom yang sangat lengkap, meliputi: \"Nama Lengkap\", \"Email\" yang digunakan untuk login siswa melalui Google OAuth di aplikasi mobile, \"NIS\" (Nomor Induk Siswa), \"NISN\" (Nomor Induk Siswa Nasional), \"Kelas\" yang menunjukkan tingkat, program studi, dan inisial kelas, \"JK\" untuk jenis kelamin, \"Tempat/Tanggal Lahir\", \"Agama\", \"No HP\", \"Alamat\" lengkap, serta \"Angkatan\" yang menunjukkan tahun masuk siswa. Setiap baris siswa juga dilengkapi dengan avatar placeholder yang menampilkan inisial nama siswa. Administrator dapat menambah siswa baru melalui modal form yang terbagi ke dalam beberapa section, yaitu section data login (email dan password), section data pribadi (nama, NIS, NISN, jenis kelamin, tempat dan tanggal lahir, agama, nomor HP), section data kelas (pilih kelas dari dropdown yang sudah terintegrasi dengan data tingkat, jurusan, dan inisial), serta section data alamat lengkap. Fitur pencarian tersedia untuk mencari siswa berdasarkan nama, email, NIS, atau NISN. Sama seperti halaman manajemen guru, halaman ini juga menyediakan fitur import massal dari file Excel melalui tombol \"Import Excel\" yang membuka modal dengan area drag-and-drop dan template download. Sistem melakukan validasi email unik pada saat import, sehingga siswa dengan email yang sudah terdaftar akan secara otomatis dilewati dan tidak akan menyebabkan duplikat data.

---

## 4.1.3.11 Halaman Dashboard Guru

`[][Gambar 4.x Halaman Dashboard Guru]`

Merupakan tampakan halaman dashboard utama yang ditampilkan kepada Guru setelah berhasil login ke dalam sistem. Berbeda dengan dashboard Administrator yang menampilkan statistik seluruh entitas sistem, dashboard Guru lebih berfokus pada aktivitas dan data yang relevan dengan peran Guru sebagai pembuat dan pengelola ujian. Pada bagian atas halaman, terdapat header dengan judul \"Dashboard\" dan badge \"Guru\" yang menunjukkan peran pengguna yang sedang aktif, beserta subtitle yang menjelaskan bahwa halaman ini adalah pusat aktivitas pengujian. Empat buah kartu statistik utama ditampilkan secara horizontal di bagian tengah halaman, masing-masing berisi jumlah \"Bank Soal\" yang sudah dibuat oleh Guru, jumlah \"Paket Ujian\" yang sudah disusun, jumlah \"Jadwal Ujian\" aktif yang tersedia untuk siswa, serta jumlah \"Total Soal\" yang tersedia di seluruh bank soal yang dimiliki. Setiap kartu statistik dilengkapi dengan ikon visual dan angka besar berwarna yang mencolok untuk memudahkan Guru dalam membaca data secara cepat. Di bagian bawah kartu statistik, terdapat deretan kartu aksi cepat (quick action cards) yang masing-masing berisi ikon dan label menu navigasi utama Guru, yaitu menu Bank Soal yang mengarah ke halaman pengelolaan bank soal, menu Paket Ujian yang mengarah ke halaman pengelolaan paket ujian, menu Jadwal Ujian yang mengarah ke halaman pengelolaan jadwal ujian, menu Rekap Hasil yang mengarah ke halaman rekapitulasi hasil ujian siswa, dan menu Analisis Soal yang mengarah ke halaman analisis butir soal. Kartu-kartu aksi cepat ini berfungsi sebagai shortcut navigasi agar Guru dapat langsung mengakses fitur yang diinginkan tanpa harus melewati sidebar menu.

---

## 4.1.3.12 Halaman Bank Soal Guru

`[][Gambar 4.x Halaman Daftar Bank Soal]`

`[][Gambar 4.x Halaman Tambah/Edit Koleksi Bank Soal]`

`[][Gambar 4.x Halaman Daftar Soal dalam Koleksi]`

`[][Gambar 4.x Form Soal Tipe Pilihan Ganda]`

`[][Gambar 4.x Form Soal Tipe Pilihan Ganda Kompleks]`

`[][Gambar 4.x Form Soal Tipe Pilihan Ganda Kategori Benar/Salah]`

`[][Gambar 4.x Halaman Import Soal dari File Excel]`

`[][Gambar 4.x Panduan Format Excel untuk Import Soal]`

Menyajikan tampakan halaman pengelolaan bank soal yang merupakan fitur inti bagi Guru untuk membangun dan mengelola koleksi soal ujian. Halaman ini menggunakan konsep \"koleksi\" atau \"folder\" untuk mengorganisir soal-soal berdasarkan topik atau mata pelajaran tertentu. Pada tampilan daftar bank soal (koleksi), tabel memuat kolom \"Nama Bank Soal\" yang menampilkan nama koleksi soal, kolom \"Jumlah Soal\" yang menunjukkan berapa banyak soal yang sudah ditambahkan ke dalam koleksi tersebut, kolom \"Dibuat Pada\" yang menunjukkan tanggal pembuatan koleksi, serta kolom \"Aksi\" berisi tombol lihat, edit, dan hapus. Kolom nama bank soal disertai dengan ikon folder berwarna kuning untuk memberikan kesan visual seperti folder file. Guru dapat mengklik baris data bank soal mana saja untuk masuk ke halaman detail yang menampilkan seluruh soal di dalam koleksi tersebut. Tombol \"Import Bank Soal\" di pojok kanan atas digunakan untuk mengimpor soal secara massal dari file Excel, sedangkan tombol \"Tambah Bank Soal\" digunakan untuk membuat koleksi baru. Proses import soal memerlukan pemilihan mata pelajaran, tingkat kelas, dan program studi terlebih dahulu sebelum mengunggah file Excel, serta menyediakan tombol \"Download Template\" untuk memastikan format kolom sesuai dan tombol \"Panduan Format Excel\" yang menampilkan pop-up penjelasan mengenai kolom-kolom yang harus diisi dalam file Excel beserta contoh nilai untuk masing-masing kategori soal (pilgan, pilgan_kompleks, dan pilgan_kategori).

`[][Gambar 4.x Halaman Form Tambah/Edit Soal]`

Berupa tampakan halaman form penambahan atau pengeditan soal di dalam suatu koleksi bank soal. Form ini menyediakan pilihan bank soal dan koleksi yang digunakan, dropdown mata pelajaran, dropdown tingkat kelas (10, 11, 12, atau semua tingkat), dropdown program studi opsional, serta dropdown kategori soal yang merupakan pilihan utama antara tiga tipe soal. Untuk tipe soal \"Pilihan Ganda Sederhana\" (pilgan), form menampilkan textarea untuk pertanyaan, kolom URL gambar opsional, enam buah kolom input untuk opsi jawaban A hingga F, serta tombol-tombol centang pada setiap opsi untuk menandai jawaban yang benar, dengan validasi minimal tiga opsi harus terisi dan satu jawaban harus ditandai sebagai benar. Untuk tipe soal \"Pilihan Ganda Kompleks\" (pilgan_kompleks), form serupa dengan tipe pilihan ganda sederhana, namun tombol centang pada setiap opsi berfungsi sebagai multiple-select, sehingga jawaban benar dapat terdiri dari lebih satu opsi. Untuk tipe soal \"Pilihan Ganda Kategori Benar/Salah\" (pilgan_kategori), form tidak memerlukan pertanyaan wajib (opsional) serta menampilkan enam kolom pernyataan A hingga F yang masing-masing disertai dua tombol toggle \"Benar\" dan \"Salah\", sehingga Guru dapat menandai setiap pernyataan sebagai benar atau salah. Seluruh form dilengkapi dengan preview nama bank soal dan validasi input yang memastikan data soal sesuai sebelum disimpan ke database.

---

## 4.1.3.13 Halaman Paket Ujian Guru

`[][Gambar 4.x Halaman Daftar Paket Ujian]`

`[][Gambar 4.x Halaman Form Buat/Edit Paket Ujian]`

Berfungsi sebagai tampakan halaman pengelolaan paket ujian yang berfungsi untuk menggabungkan satu atau lebih soal dari bank soal menjadi sebuah paket ujian yang siap dijadwalkan. Pada tampilan daftar paket ujian, tabel memuat kolom \"Nama Paket\" yang berisi judul paket ujian, kolom \"Mapel\" yang menunjukkan mata pelajaran terkait, kolom \"Tingkat\" yang menunjukkan jenjang kelas target, kolom \"Tipe\" yang menunjukkan jenis ujian (UH, UTS, UAS, atau Lainnya), kolom \"Jumlah Soal\" yang menunjukkan total soal dalam paket, serta kolom \"Aksi\" berisi tombol lihat soal, edit, dan hapus. Terdapat juga indikator \"Shared\" bertanda gembok yang menunjukkan paket milik guru lain, yang dalam hal ini guru tidak memiliki hak untuk mengedit namun tetap dapat melihat soal-soalnya. Tombol \"Buat Paket Ujian\" di pojok kanan atas digunakan untuk membuat paket ujian baru. Pada halaman form paket ujian, terdapat dua section utama, yaitu section \"Data Paket\" yang berisi kolom input nama paket ujian, dropdown mata pelajaran, dropdown tingkat kelas, dan dropdown tipe ujian, serta section \"Pilih Soal dari Bank Soal\" yang menampilkan tabel interaktif berisi seluruh soal yang tersedia di bank soal. Guru dapat memfilter soal berdasarkan nama bank soal, tingkat, program studi, dan kategori soal. Setiap soal pada tabel dilengkapi dengan checkbox yang dapat dicentang untuk menambahkan soal ke dalam paket. Tersedia pula tombol \"Centang Semua (di filter)\" dan \"Hapus Centang (di filter)\" yang mempercepat pemilihan soal dalam jumlah besar. Counter \"Terpilih: N soal\" secara real-time menampilkan jumlah soal yang sudah dipilih. Sistem tidak mengharuskan Guru memilih soal terlebih dahulu sebelum menyimpan paket, sehingga paket dapat disimpan terlebih dahulu kemudian soal ditambahkan kemudian hari. Tombol \"Lihat Soal\" pada tabel daftar paket membuka modal popup yang menampilkan detail seluruh soal yang sudah masuk ke dalam paket, termasuk mata pelajaran, tingkat, kategori, preview pertanyaan, dan kunci jawaban.

---

## 4.1.3.14 Halaman Jadwal Ujian Guru

`[][Gambar 4.x Halaman Daftar Jadwal Ujian (Tab Jadwal Pusat)]`

`[][Gambar 4.x Halaman Daftar Jadwal Ujian (Tab Ujian Mandiri)]`

`[][Gambar 4.x Halaman Form Buat Ulangan Mandiri]`

Merupakan tampakan halaman pengelolaan jadwal ujian yang memiliki dua tab utama, yaitu tab \"Jadwal Pusat (Resmi Admin)\" dan tab \"Ujian Mandiri (Custom Guru)\". Tab pertama menampilkan jadwal ujian yang dibuat oleh Administrator dan sudah include token masuk serta token checkout. Guru dapat menautkan paket soal miliknya ke jadwal resmi Admin melalui tombol \"Isi Paket\" yang membuka modal popup berisi daftar paket yang sesuai dengan mata pelajaran jadwal, disertai informasi jumlah soal pada setiap paket. Guru hanya dapat menautkan paket yang dibuat oleh dirinya sendiri; paket milik guru lain akan ditampilkan tetapi tidak dapat dikaitkan. Tombol \"Lepas Paket\" berfungsi untuk menghapus tautan paket dari jadwal resmi. Tab kedua \"Ujian Mandiri\" memungkinkan Guru membuat jadwal ujian secara mandiri tanpa harus meminta Administrator. Halaman ini dilengkapi dengan tombol \"Buat Ulangan Mandiri\" yang membuka modal form berisi kolom input judul ulangan, dropdown mata pelajaran, dropdown paket ujian yang harus sesuai dengan mata pelajaran yang dipilih, kolom input waktu mulai dan selesai ujian, dropdown durasi pengerjaan dalam menit, toggle opsi keamanan \"Kiosk Mode\" yang bila diaktifkan akan mencegah siswa keluar dari aplikasi mobile selama ujian berlangsung, serta section pilih kelas multi-pilih yang menampilkan seluruh kelas yang tersedia dalam sistem. Setiap jadwal ujian pada kedua tab ditampilkan dengan komponen kartu yang memuat nama ujian, box token masuk (IN) dan token keluar (OUT) masing-masing berisi kode 6 digit, badge mata pelajaran, badge paket soal, informasi jumlah kelas peserta dan waktu pelaksanaan, serta indikator keamanan Kiosk Mode. Pagination tersedia untuk navigasi data jadwal yang banyak.

---

## 4.1.3.15 Halaman Rekap Hasil Ujian Guru

`[][Gambar 4.x Halaman Daftar Rekap Hasil Ujian]`

`[][Gambar 4.x Halaman Detail Hasil Ujian per Siswa]`

Menampilkan tampakan halaman rekapitulasi hasil ujian yang membantu Guru dalam memantau perkembangan dan performa siswa dalam mengerjakan ujian. Halaman ini dilengkapi dengan dua buah filter utama yang terletak di bagian atas, yaitu dropdown \"Pilih Ujian\" yang menampilkan seluruh jadwal ujian yang sudah dikerjakan oleh siswa, serta dropdown \"Pilih Kelas\" yang menampilkan kelas-kelas yang relevant berdasarkan jadwal ujian yang dipilih. Filter kelas bersifat dinamis, di mana pilihan kelas hanya akan muncul setelah pengguna memilih jadwal ujian terlebih dahulu. Empat buah kartu statistik ringkasan ditampilkan di bagian header halaman yang masing-masing berisi \"Total Peserta\" (jumlah seluruh siswa yang mengerjakan), \"Siswa Selesai\" (jumlah siswa yang sudah menyelesaikan ujian), \"Rata-rata\" nilai akhir seluruh siswa, dan \"Tertinggi\" nilai tertinggi yang dicapai siswa. Daftar hasil ujian disajikan dalam format baris per siswa, di mana setiap baris memuat avatar dan nama siswa, email siswa, nama kelas dalam bentuk badge pill, status ujian (Selesai atau Aktif), nilai akhir yang ditampilkan dalam format angka besar berwarna (hijau untuk nilai >= 80, biru untuk nilai di bawah 80), serta dua tombol aksi yaitu tombol \"Review\" untuk melihat detail jawaban siswa per soal dan tombol \"Hapus\" untuk menghapus hasil ujian siswa tertentu. Sistem pagination tersedia untuk navigasi data hasil ujian yang banyak. Melalui halaman review, Guru dapat melihat jawaban yang dipilih oleh setiap siswa pada setiap nomor soal, membandingkannya dengan kunci jawaban yang benar, serta melihat apakah siswa ditandai ragu-ragu atau tidak pada soal tertentu.

---

## 4.1.3.16 Halaman Analisis Soal Guru

`[][Gambar 4.x Halaman Analisis Butir Soal]`

Berupa tampakan halaman analisis butir soal yang memberikan evaluasi mendalam terhadap kualitas setiap soal berdasarkan data pengerjaan siswa yang sebenarnya. Halaman ini digunakan oleh Guru untuk mengidentifikasi soal-soal yang termasuk dalam kategori mudah, sedang, atau sulit, sehingga dapat menjadi dasar perbaikan dan pengembangan bank soal ke depannya. Di bagian atas halaman, terdapat dropdown \"Paket Ujian yang Telah Digunakan\" yang secara otomatis memuat seluruh paket ujian yang sudah dikerjakan oleh minimal satu siswa, sehingga analisis hanya dilakukan terhadap paket yang memiliki data pengerjaan nyata. Sistem secara otomatis menjalankan analisis setiap kali paket ujian dipilih, sehingga Guru tidak perlu mengklik tombol tambahan. Empat buah kotak ringkasan ditampilkan di bagian header yang masing-masing berisi jumlah \"Soal Mudah\" dengan ketentuan lebih dari 70% siswa menjawab benar, jumlah \"Soal Sedang\" dengan ketentuan 30% sampai 70% siswa menjawab benar, jumlah \"Soal Sulit\" dengan ketentuan kurang dari 30% siswa menjawab benar, serta jumlah total siswa \"Responden\" yang mengerjakan paket ujian tersebut. Setiap kategori kesulitan ditandai dengan warna yang berbeda, yaitu hijau untuk mudah, kuning/oranye untuk sedang, dan merah untuk sulit. Tabel analisis butir soal memuat kolom \"No\" untuk nomor urut soal, kolom \"Pertanyaan\" untuk menampilkan preview soal, kolom \"Penjawab\" untuk menampilkan jumlah siswa yang mengerjakan soal tersebut, kolom \"Benar\" untuk menampilkan jumlah siswa yang menjawab benar, kolom \"% Benar\" yang disertai bar visual proporsional yang berubah warna sesuai tingkat kesulitan, serta kolom \"Evaluasi\" yang menampilkan badge kategori kesulitan (Mudah/Sedang/Sulit). Bar proporsional pada kolom \"% Benar\" secara visual memberikan gambaran langsung mengenai tingkat kesulitan soal tanpa harus membaca angka persentase, sehingga Guru dapat dengan cepat menyorot soal-soal yang perlu diperbaiki atau diganti.