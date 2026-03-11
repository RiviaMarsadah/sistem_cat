/**
 * Generate dummy bank soal Bahasa Jawa (50 soal) dalam format template import.
 * Single choice: 5 opsi (A-E). Multi choice: 5-6 opsi bervariasi. Benar/salah: 3 pernyataan.
 * Output: dummy_bank_soal_bahasa_jawa.xlsx di root project
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const HEADERS = ['Kategori', 'Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 'Opsi F', 'Jawaban', 'Gambar'];

const singleChoice = [
  ['single_choice', 'Tingkat bahasa yang dipakai untuk berbicara dengan orang yang lebih tua atau dihormati dalam Bahasa Jawa disebut...', 'Ngoko', 'Krama', 'Krama inggil', 'Basa kedaton', 'Basa kasar', '', 'B', ''],
  ['single_choice', 'Unggah-ungguh dalam Bahasa Jawa artinya...', 'Tata krama berbahasa', 'Tata krama makan', 'Tata krama berpakaian', 'Tata krama berjalan', 'Tata krama duduk', '', 'A', ''],
  ['single_choice', 'Kata "sugeng enjang" dalam Bahasa Jawa berarti...', 'Selamat siang', 'Selamat pagi', 'Selamat malam', 'Selamat sore', 'Selamat tinggal', '', 'B', ''],
  ['single_choice', 'Aksara Jawa yang digunakan untuk menulis bahasa Jawa tradisional disebut...', 'Aksara Bali', 'Hanacaraka / Carakan', 'Aksara Latin', 'Aksara Pegon', 'Aksara Sunda', '', 'B', ''],
  ['single_choice', 'Tembang maca yang memiliki pola guru gatra 4, guru wilangan 8-8-8-8, guru lagu a-a-a-a adalah...', 'Pangkur', 'Sinom', 'Kinanthi', 'Dhandhanggula', 'Gambuh', '', 'C', ''],
  ['single_choice', 'Paribasan "Ajining diri saka lathi" artinya...', 'Harga diri dari harta', 'Harga diri dari ucapan', 'Harga diri dari pakaian', 'Harga diri dari jabatan', 'Harga diri dari keturunan', '', 'B', ''],
  ['single_choice', 'Wayang kulit yang dimainkan oleh dalang biasanya menggunakan sumber cerita dari...', 'Babad Tanah Jawi', 'Serat Centhini', 'Mahabharata dan Ramayana', 'Hikayat', 'Kronik', '', 'C', ''],
  ['single_choice', 'Krama inggil untuk kata "mangan" (makan) adalah...', 'Nedha', 'Dhahar', 'Ngunjuk', 'Nginum', 'Turu', '', 'B', ''],
  ['single_choice', 'Salah satu wanda (suku kata) dalam aksara Jawa yang melambangkan huruf "na" adalah...', 'Ha', 'Na', 'Ca', 'Ra', 'Ka', '', 'B', ''],
  ['single_choice', 'Gamelan merupakan salah satu...', 'Tarian tradisional Jawa', 'Alat musik tradisional Jawa', 'Pakaian adat Jawa', 'Rumah adat Jawa', 'Seni lukis Jawa', '', 'B', ''],
  ['single_choice', 'Serat Wedhatama dikarang oleh...', 'R.Ng. Ronggowarsito', 'K.G.P.A.A. Mangkunegara IV', 'Yosodipuro', 'R. Ng. Yosodipuro II', 'Ki Hajar Dewantara', '', 'B', ''],
  ['single_choice', 'Basa ngoko dipakai untuk berbicara dengan...', 'Orang tua atau atasan', 'Teman sebaya atau yang lebih muda', 'Raja atau pejabat', 'Guru atau kiai', 'Semua orang tanpa beda', '', 'B', ''],
  ['single_choice', 'Slametan atau selamatan dalam budaya Jawa biasanya berkaitan dengan...', 'Pesta pernikahan saja', 'Syukuran atau rasa syukur', 'Peringatan kematian saja', 'Hari libur nasional', 'Acara pemerintahan', '', 'B', ''],
  ['single_choice', 'Tari Gambyong berasal dari daerah...', 'Yogyakarta', 'Surakarta', 'Jawa Timur', 'Banyumas', 'Jawa Barat', '', 'B', ''],
  ['single_choice', 'Sandangan dalam aksara Jawa berfungsi untuk...', 'Mengganti wanda', 'Memberi vokal atau bunyi', 'Menandai angka', 'Memulai kalimat', 'Mengakhiri kalimat', '', 'B', ''],
  ['single_choice', '"Kula nuwun" dalam konteks perpisahan berarti...', 'Terima kasih', 'Permisi / mohon diri', 'Maaf', 'Selamat datang', 'Silakan', '', 'B', ''],
  ['single_choice', 'Cerita Panji berasal dari tradisi sastra...', 'Bali', 'Jawa', 'Sunda', 'Madura', 'Melayu', '', 'B', ''],
  ['single_choice', 'Batik yang motif dan prosesnya berkaitan dengan keraton Yogyakarta dan Surakarta disebut...', 'Batik pesisir', 'Batik pedalaman', 'Batik modern', 'Batik cap', 'Batik printing', '', 'B', ''],
  ['single_choice', 'Tembang "Lir-ilir" termasuk jenis tembang...', 'Gending', 'Dolanan', 'Macapat', 'Campursari', 'Langgam', '', 'B', ''],
  ['single_choice', 'Pepindhan yang membandingkan sesuatu dengan perumpamaan disebut...', 'Paribasan', 'Saloka', 'Bebasan', 'Sesanti', 'Pocapan', '', 'B', ''],
];

const multiChoice = [
  ['multi_choice', 'Yang termasuk tingkat tutur (undha-usuk) dalam Bahasa Jawa adalah...', 'Ngoko', 'Krama', 'Krama inggil', 'Basa kasar', 'Basa kedaton', 'Basa campur', 'A,B,C', ''],
  ['multi_choice', 'Contoh kata krama untuk bagian tubuh adalah...', 'Sira (krama: kepala)', 'Lathi (krama: mulut)', 'Pancer (krama: hidung)', 'Astha (krama: tangan)', 'Suku (krama: kaki)', 'Pupuk (krama: perut)', 'B,D,E', ''],
  ['multi_choice', 'Yang termasuk tembang macapat adalah...', 'Kinanthi', 'Sinom', 'Dhandhanggula', 'Pangkur', 'Gambuh', 'Megatruh', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Unsur-unsur dalam pagelaran wayang kulit antara lain...', 'Dalang', 'Wayang (boneka kulit)', 'Kelir (layar)', 'Blencong (lampu)', 'Gamelan', 'Sinden', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Paribasan Jawa yang mengandung nasihat hidup adalah...', 'Ajining diri saka lathi', 'Alon-alon waton kelakon', 'Wong urip kudu ngerti unggah-ungguh', 'Sapa nandur bakal ngundhuh', 'Memayu hayuning bawana', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Karya sastra Jawa yang berbentuk tembang (puisi) antara lain...', 'Serat Wedhatama', 'Serat Centhini', 'Babad Tanah Jawi', 'Serat Kalatidha', 'Suluk', 'Wulang', 'A,B,D,E', ''],
  ['multi_choice', 'Fungsi aksara Jawa (Hanacaraka) dalam tradisi Jawa adalah...', 'Menulis naskah kuno', 'Menulis prasasti', 'Mengajarkan unggah-ungguh', 'Mencatat sastra', 'Menulis surat resmi', 'Dekorasi', 'A,C,D', ''],
  ['multi_choice', 'Yang termasuk seni pertunjukan tradisional Jawa adalah...', 'Wayang kulit', 'Wayang orang', 'Ketoprak', 'Ludruk', 'Reog', 'Kuda lumping', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Sapaan/sembah dalam Bahasa Jawa krama untuk menyapa orang yang dihormati bisa menggunakan...', 'Sugeng enjang', 'Kula nuwun', 'Matur nuwun', 'Sembah nuwun', 'Nuwun sewu', 'Monggo pinarak', 'A,B,C,D,E', ''],
  ['multi_choice', 'Serat Wulang atau piwulang berisi ajaran tentang...', 'Etika dan budi pekerti', 'Sejarah', 'Tata negara', 'Kebatinan', 'Kesenian', 'Kesehatan', 'A,B,C,D', ''],
  ['multi_choice', 'Upacara adat Jawa yang berkaitan dengan siklus hidup manusia antara lain...', 'Tingkepan (kehamilan)', 'Tedhak siten', 'Sunatan', 'Temu manten', 'Slametan', 'Sekaten', 'A,B,C,D,E', ''],
  ['multi_choice', 'Jenis batik menurut teknik/cara pembuatan adalah...', 'Batik tulis', 'Batik cap', 'Batik pedalaman', 'Batik pesisir', 'Batik kombinasi', 'Batik printing', 'A,B,E', ''],
  ['multi_choice', 'Tokoh pewayangan yang berasal dari keluarga Pandawa adalah...', 'Yudhistira', 'Bima', 'Arjuna', 'Nakula', 'Sadewa', 'Kresna', 'A,B,C,D,E', ''],
  ['multi_choice', 'Yang termasuk ungkapan permohonan maaf dalam Bahasa Jawa adalah...', 'Nuwun sewu', 'Matur nuwun', 'Nyuwun pangapunten', 'Monggo', 'Sugeng rawuh', 'Kula nuwun', 'A,C,F', ''],
  ['multi_choice', 'Nilai-nilai yang sering diajarkan dalam sastra dan paribasan Jawa adalah...', 'Unggah-ungguh (sopan santun)', 'Rila (rela)', 'Narima (menerima)', 'Gotong royong', 'Hormat kepada orang tua', 'Kejujuran', 'A,B,C,D,E,F', ''],
];

const benarSalah = [
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang tingkat tutur Bahasa Jawa.', 'Ngoko dipakai untuk berbicara dengan orang yang lebih muda atau setara.', 'Krama dipakai untuk berbicara dengan orang yang lebih tua atau dihormati.', 'Krama inggil hanya dipakai untuk menyebut diri sendiri atau orang yang dihormati.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang aksara Jawa.', 'Aksara Jawa Hanacaraka terdiri dari 20 huruf dasar.', 'Aksara Jawa ditulis dari kiri ke kanan.', 'Sandangan dipakai untuk memberi tanda vokal.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang wayang.', 'Wayang kulit dimainkan di belakang kelir (layar).', 'Dalang adalah orang yang memainkan wayang dan menyuarakan tokoh.', 'Cerita wayang hanya bersumber dari Ramayana.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang tembang macapat.', 'Tembang macapat memiliki aturan guru gatra, guru wilangan, dan guru lagu.', 'Setiap jenis tembang macapat memiliki pola yang berbeda.', 'Kinanthi memiliki guru gatra 6.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang paribasan.', 'Paribasan adalah ungkapan yang mengandung nilai atau nasihat.', 'Bebasan adalah ungkapan yang membandingkan dengan perumpamaan.', 'Saloka dan paribasan memiliki makna yang sama persis.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang budaya Jawa.', 'Slametan adalah salah satu tradisi syukuran dalam masyarakat Jawa.', 'Gamelan biasanya mengiringi wayang dan tari.', 'Batik hanya ada di Yogyakarta.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang sastra Jawa.', 'Serat Wedhatama berisi wejangan tentang laku hidup.', 'Ronggowarsito adalah pujangga Jawa yang terkenal.', 'Semua naskah Jawa kuno ditulis dengan aksara Latin.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang krama.', 'Krama lugu adalah krama yang semua katanya berbentuk krama.', 'Krama inggil dipakai untuk kata yang merujuk pada diri sendiri atau orang yang dihormati.', 'Kata "sugeng" termasuk krama.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang seni Jawa.', 'Tari Bedhaya dan Srimpi berkaitan dengan keraton.', 'Gending adalah bentuk musik gamelan.', 'Ludruk berasal dari Jawa Tengah (Surabaya area).', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang etika Jawa.', 'Unggah-ungguh mengajarkan sikap hormat dan tata krama.', 'Ajining diri saka lathi berarti harga diri dilihat dari ucapan.', 'Orang Jawa tidak mengenal tingkatan bahasa.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang wayang kulit.', 'Wayang kulit terbuat dari kulit hewan (biasanya kerbau).', 'Blencong adalah sumber cahaya di belakang kelir.', 'Wayang hanya dipentaskan pada siang hari.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang batik.', 'Batik tulis dikerjakan dengan tangan menggunakan canting.', 'Motif batik pedalaman cenderung lebih gelap dan simbolis.', 'Batik diakui UNESCO sebagai Warisan Budaya Takbenda.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang sapaan Jawa.', '"Sugeng sonten" berarti selamat sore.', '"Matur nuwun" berarti terima kasih dalam krama.', '"Monggo" dipakai untuk mengajak atau mempersilakan.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang tokoh pewayangan.', 'Pandawa berjumlah lima orang.', 'Kurawa adalah musuh Pandawa dalam Bharatayuda.', 'Semua tokoh wayang berasal dari India.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang pendidikan Bahasa Jawa.', 'Pembelajaran Bahasa Jawa mencakup unggah-ungguh.', 'Aksara Jawa diajarkan di beberapa sekolah di Jawa.', 'Bahasa Jawa hanya dipakai di Jawa Tengah.', '', '', '', 'B,B,S', ''],
];

function buildRows() {
  const rows = [HEADERS];
  singleChoice.forEach((r) => rows.push(r));
  multiChoice.forEach((r) => rows.push(r));
  benarSalah.forEach((r) => rows.push(r));
  return rows;
}

function main() {
  const rows = buildRows();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 52 }, { wch: 36 }, { wch: 36 }, { wch: 36 },
    { wch: 36 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Soal');

  const panduanRows = [
    ['PANDUAN FORMAT IMPORT BANK SOAL'],
    [],
    ['Kolom di sheet "Soal" (baris pertama = header):'],
    ['Kategori', 'single_choice | multi_choice | benar_salah'],
    ['Soal', 'Teks pertanyaan (opsional untuk benar_salah)'],
    ['Opsi A s/d F', 'Isi opsi atau pernyataan. Minimal 3 untuk single/multi, minimal 1 untuk benar_salah'],
    ['Jawaban', 'Single: satu huruf A-F. Multi: dipisah koma contoh A,B,D. Benar/Salah: B atau S per pernyataan, contoh B,B,S'],
    ['Gambar', 'URL gambar (opsional)'],
    [],
    ['File ini: 50 soal Bahasa Jawa (20 single, 15 multi, 15 benar/salah). Mapel & tingkat dipilih saat import di aplikasi.'],
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = [{ wch: 50 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

  const outDir = path.join(__dirname, '../..');
  const outPath = path.join(outDir, 'dummy_bank_soal_bahasa_jawa.xlsx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  XLSX.writeFile(wb, outPath);
  console.log('File berhasil dibuat:', outPath);
  console.log('Total baris data:', rows.length - 1, '(baris 1 = header)');
  console.log('  - Single choice:', singleChoice.length);
  console.log('  - Multi choice:', multiChoice.length);
  console.log('  - Benar/Salah:', benarSalah.length);
}

main();
