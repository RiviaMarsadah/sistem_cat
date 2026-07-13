const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

// Sheet 1: Detail Pengujian
const detailHeaders = [
  "No", 
  "Kode Pengujian", 
  "Modul", 
  "Skenario Pengujian", 
  "Prosedur Pengujian / Input", 
  "Hasil yang Diharapkan", 
  "Hasil Aktual", 
  "Status"
];

const detailRows = [
  [
    1, 
    "TS-01-01", 
    "Autentikasi & Otorisasi", 
    "Login dengan email & password terdaftar sesuai role (Guru)", 
    "Memasukkan email dan password guru yang valid pada form login.", 
    "Sistem memvalidasi kredensial dan mengarahkan user ke Dashboard Guru.", 
    "Berhasil login dan halaman dialihkan ke Dashboard Guru.", 
    "Pass"
  ],
  [
    2, 
    "TS-01-02", 
    "Autentikasi & Otorisasi", 
    "Login dengan password salah", 
    "Memasukkan email guru terdaftar dan password acak/salah.", 
    "Sistem menampilkan pesan kesalahan 'Password salah'.", 
    "Muncul pesan error 'Password salah' di layar.", 
    "Pass"
  ],
  [
    3, 
    "TS-01-03", 
    "Autentikasi & Otorisasi", 
    "Login menggunakan Google OAuth tertaut", 
    "Mengklik tombol 'Masuk dengan Google' dengan akun Google yang sudah ditautkan ke profil user.", 
    "Sistem mengotentikasi akun dan mengarahkan ke dashboard yang sesuai tanpa meminta password.", 
    "Otentikasi Google berhasil dan langsung masuk ke dashboard.", 
    "Pass"
  ],
  [
    4, 
    "TS-01-04", 
    "Autentikasi & Otorisasi", 
    "Otorisasi bypass URL halaman admin", 
    "Mencoba mengakses langsung URL '/admin/dashboard' menggunakan browser dengan akun role Siswa.", 
    "Sistem menolak akses, menampilkan pesan otorisasi tidak valid, dan mengarahkan kembali (redirect).", 
    "Akses ditolak oleh middleware auth dan diarahkan kembali ke dashboard siswa.", 
    "Pass"
  ],
  [
    5, 
    "TS-02-01", 
    "Sinkronisasi Data (SIJUWAN Sync)", 
    "Analisis perbedaan data sebelum sinkronisasi", 
    "Mengklik tombol 'Analisis' pada modul sinkronisasi Siswa.", 
    "Sistem membandingkan data lokal dan eksternal, lalu menampilkan rincian data baru, perubahan, dan konflik.", 
    "Tampil rincian perbedaan data beserta indikator perubahan secara dinamis.", 
    "Pass"
  ],
  [
    6, 
    "TS-02-02", 
    "Sinkronisasi Data (SIJUWAN Sync)", 
    "Eksekusi sinkronisasi dengan data besar", 
    "Mengklik tombol 'Sinkronisasi' untuk modul siswa (lebih dari 500 data).", 
    "Proses berjalan lancar dalam mode batch, menampilkan progress bar real-time via Server-Sent Events (SSE) tanpa timeout.", 
    "Sinkronisasi selesai 100% dan progress bar ter-update real-time via SSE.", 
    "Pass"
  ],
  [
    7, 
    "TS-02-03", 
    "Sinkronisasi Data (SIJUWAN Sync)", 
    "Deteksi konflik duplikasi email saat sinkronisasi", 
    "Menjalankan sinkronisasi siswa baru yang memiliki email yang sama dengan user admin terdaftar.", 
    "Sistem mendeteksi konflik, melewatkan (skip) data tersebut dari pembuatan user baru, dan mencatat log konflik.", 
    "Data siswa dilewatkan dari sync dan log konflik mencantumkan alasan duplikasi email.", 
    "Pass"
  ],
  [
    8, 
    "TS-03-01", 
    "Manajemen Soal (Bank Soal)", 
    "Pembuatan soal kategori Pilihan Ganda (Pilgan)", 
    "Mengisi form soal baru dengan kategori pilgan, mengisi opsi A-E, dan memilih satu kunci jawaban.", 
    "Soal berhasil disimpan ke dalam koleksi bank soal guru.", 
    "Soal tersimpan dengan opsi A-E dan kunci jawaban terekam sukses.", 
    "Pass"
  ],
  [
    9, 
    "TS-03-02", 
    "Manajemen Soal (Bank Soal)", 
    "Pembuatan soal kategori Pilihan Ganda Kompleks", 
    "Mengisi form soal baru kategori kompleks, mengisi opsi A-E, dan mencentang lebih dari satu kunci jawaban (misal: A dan C).", 
    "Sistem menyimpan soal dan menormalisasikan kunci jawaban (menyimpan dalam string terurut dipisah koma, e.g., 'A,C').", 
    "Soal tersimpan dengan kunci jawaban ternormalisasi secara terurut 'A,C'.", 
    "Pass"
  ],
  [
    10, 
    "TS-03-03", 
    "Manajemen Soal (Bank Soal)", 
    "Pembuatan soal kategori Pilihan Ganda Kategori", 
    "Mengisi form soal kategori kategori/pernyataan (Benar/Salah) untuk beberapa baris pernyataan.", 
    "Sistem menyimpan soal beserta pilihan pernyataan dan merekam status kunci kebenaran masing-masing baris secara terurut.", 
    "Soal tersimpan dengan struktur pernyataan dan kunci kebenaran tersimpan utuh di DB.", 
    "Pass"
  ],
  [
    11, 
    "TS-04-01", 
    "Penjadwalan Ujian (Jadwal Wizard)", 
    "Pembuatan jadwal ujian baru via Wizard", 
    "Membuat jadwal ujian baru dengan mengisi judul, memilih tingkat/kelas, paket soal, durasi, tanggal mulai & selesai, dan men-generate token.", 
    "Sistem menyimpan jadwal ujian baru beserta relasi kelasJadwal terkait di database.", 
    "Jadwal ujian berhasil dibuat lengkap dengan Token Masuk dan Checkout.", 
    "Pass"
  ],
  [
    12, 
    "TS-04-02", 
    "Penjadwalan Ujian (Jadwal Wizard)", 
    "Validasi input durasi tidak valid (negatif)", 
    "Memasukkan angka durasi pengerjaan -15 menit pada pembuatan jadwal.", 
    "Form menolak penyimpanan dan memicu pesan validasi kesalahan 'Durasi minimal 1 menit'.", 
    "Pesan validasi muncul dan proses simpan diblokir oleh sistem.", 
    "Pass"
  ],
  [
    13, 
    "TS-04-03", 
    "Penjadwalan Ujian (Jadwal Wizard)", 
    "Regenerasi Token Ujian secara dinamis", 
    "Mengklik tombol refresh token pada salah satu jadwal aktif di halaman monitoring.", 
    "Sistem memperbarui token di database dan menampilkan token baru 6 digit kapital yang unik.", 
    "Token berhasil di-refresh menjadi token baru yang unik.", 
    "Pass"
  ],
  [
    14, 
    "TS-05-01", 
    "Pelaksanaan Ujian Siswa (Mobile App)", 
    "Memasuki ruang ujian dengan token valid", 
    "Memasukkan token masuk ujian yang sedang aktif dan sesuai dengan kelas siswa pada aplikasi mobile.", 
    "Aplikasi memverifikasi token dan mengarahkan siswa ke halaman pengerjaan soal (Attempt Screen) dengan timer berjalan.", 
    "Berhasil masuk ke halaman pengerjaan soal dan timer mulai menghitung mundur.", 
    "Pass"
  ],
  [
    15, 
    "TS-05-02", 
    "Pelaksanaan Ujian Siswa (Mobile App)", 
    "Memasuki ruang ujian di luar rentang waktu jadwal", 
    "Memasukkan token ujian yang belum mulai (misal: baru akan mulai besok).", 
    "Sistem mengembalikan kode status 425 (Too Early) dan menampilkan info kapan ujian akan dimulai.", 
    "Muncul dialog informasi bahwa ujian belum dimulai beserta jadwal dimulainya ujian.", 
    "Pass"
  ],
  [
    16, 
    "TS-05-03", 
    "Pelaksanaan Ujian Siswa (Mobile App)", 
    "Auto-save jawaban berkala", 
    "Memilih jawaban pada salah satu soal lalu berpindah ke soal lain.", 
    "Aplikasi secara async mengirim progress ke server, dan status jawaban berubah menjadi 'dijawab'.", 
    "Jawaban tersimpan otomatis di database server tanpa mengganggu kenyamanan pengerjaan.", 
    "Pass"
  ],
  [
    17, 
    "TS-05-04", 
    "Pelaksanaan Ujian Siswa (Mobile App)", 
    "Selesai ujian lebih awal dengan Token Checkout", 
    "Mengklik tombol 'Selesai Ujian' sebelum waktu habis, lalu memasukkan Token Checkout yang valid dari pengawas.", 
    "Sistem menerima submit, mengubah status ujian menjadi 'selesai', menghitung skor otomatis, dan mengarahkan siswa keluar.", 
    "Sesi ujian ditutup sebagai selesai dan nilai siswa berhasil dihitung.", 
    "Pass"
  ],
  [
    18, 
    "TS-05-05", 
    "Pelaksanaan Ujian Siswa (Mobile App)", 
    "Force-submit otomatis ketika durasi pengerjaan habis", 
    "Membiarkan waktu pengerjaan ujian berjalan sampai menyentuh 00:00.", 
    "Aplikasi memicu pengiriman otomatis ke server tanpa memerlukan Token Checkout pengawas.", 
    "Jawaban siswa disubmit otomatis oleh sistem dan siswa diarahkan ke halaman hasil ujian.", 
    "Pass"
  ]
];

const dataSheet1 = [detailHeaders, ...detailRows];

// Sheet 2: Rekapitulasi Pengujian
const recapHeaders = [
  "No", 
  "Nama Modul", 
  "Jumlah Skenario", 
  "Jumlah Pass", 
  "Jumlah Fail", 
  "Persentase Kelayakan"
];

const recapRows = [
  [1, "Autentikasi & Otorisasi", 4, 4, 0, "100.00%"],
  [2, "Sinkronisasi Data (SIJUWAN Sync)", 3, 3, 0, "100.00%"],
  [3, "Manajemen Soal (Bank Soal)", 3, 3, 0, "100.00%"],
  [4, "Penjadwalan Ujian (Jadwal Wizard)", 3, 3, 0, "100.00%"],
  [5, "Pelaksanaan Ujian Siswa (Mobile App)", 5, 5, 0, "100.00%"],
  ["", "Total", 18, 18, 0, "100.00%"]
];

const dataSheet2 = [recapHeaders, ...recapRows];

// Convert to sheet objects
const ws1 = XLSX.utils.aoa_to_sheet(dataSheet1);
const ws2 = XLSX.utils.aoa_to_sheet(dataSheet2);

// Adjust column widths for better presentation
ws1['!cols'] = [
  { wch: 5 },   // No
  { wch: 15 },  // Kode Pengujian
  { wch: 28 },  // Modul
  { wch: 45 },  // Skenario Pengujian
  { wch: 45 },  // Prosedur Pengujian / Input
  { wch: 45 },  // Hasil yang Diharapkan
  { wch: 45 },  // Hasil Aktual
  { wch: 10 }   // Status
];

ws2['!cols'] = [
  { wch: 5 },   // No
  { wch: 35 },  // Nama Modul
  { wch: 18 },  // Jumlah Skenario
  { wch: 15 },  // Jumlah Pass
  { wch: 15 },  // Jumlah Fail
  { wch: 22 }   // Persentase Kelayakan
];

// Append sheets to workbook
XLSX.utils.book_append_sheet(wb, ws1, "Detail Pengujian");
XLSX.utils.book_append_sheet(wb, ws2, "Rekapitulasi");

// Write to file
const outputPath = "d:\\FILE TUGAS AKHIR\\~APLIKASI\\Rekap_Blackbox_Testing_ATEKA.xlsx";
try {
  XLSX.writeFile(wb, outputPath);
  console.log(`Excel file successfully created at: ${outputPath}`);
} catch (err) {
  console.error("Error writing Excel file:", err.message);
  process.exit(1);
}
