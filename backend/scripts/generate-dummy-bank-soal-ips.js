/**
 * Generate dummy bank soal IPS (50 soal) dalam format template import.
 * Single choice: 5 opsi (A-E). Multi choice: 5-6 opsi bervariasi. Benar/salah: 3 pernyataan.
 * Output: dummy_bank_soal_ips.xlsx di root project
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const HEADERS = ['Kategori', 'Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 'Opsi F', 'Jawaban', 'Gambar'];

// Baris = [kategori, soal, opsiA, opsiB, opsiC, opsiD, opsiE, opsiF, jawaban, gambar]
const singleChoice = [
  ['single_choice', 'Siapa proklamator kemerdekaan Indonesia?', 'Soekarno dan Hatta', 'Soekarno dan Sjahrir', 'Hatta dan Tan Malaka', 'Soekarno dan Kartosuwiryo', 'Hatta dan Sutan Sjahrir', '', 'A', ''],
  ['single_choice', 'Kapan Proklamasi Kemerdekaan Indonesia dibacakan?', '17 Agustus 1944', '17 Agustus 1945', '18 Agustus 1945', '1 Juni 1945', '17 Agustus 1946', '', 'B', ''],
  ['single_choice', 'Pancasila sebagai dasar negara dicetuskan pertama kali oleh?', 'Moh. Hatta', 'Ir. Soekarno', 'Dr. Soetomo', 'Ki Hajar Dewantara', 'Sutan Sjahrir', '', 'B', ''],
  ['single_choice', 'Lembaga yang mengeluarkan dan mengedarkan uang di Indonesia adalah?', 'Bank Indonesia', 'Kementerian Keuangan', 'OJK', 'Perusahaan percetakan uang', 'Bank sentral Asia', '', 'A', ''],
  ['single_choice', 'Ibu kota provinsi Jawa Barat adalah?', 'Jakarta', 'Semarang', 'Bandung', 'Surabaya', 'Yogyakarta', '', 'C', ''],
  ['single_choice', 'Sistem ekonomi yang seluruh kegiatan ekonominya diatur oleh negara disebut?', 'Liberal', 'Kapitalis', 'Terpusat/komando', 'Campuran', 'Pasar', '', 'C', ''],
  ['single_choice', 'Negara ASEAN yang tidak memiliki wilayah laut adalah?', 'Indonesia', 'Thailand', 'Laos', 'Filipina', 'Vietnam', '', 'C', ''],
  ['single_choice', 'BPUPKI dibentuk pada tanggal?', '1 Maret 1944', '1 Maret 1945', '29 April 1945', '7 Agustus 1945', '9 Agustus 1945', '', 'B', ''],
  ['single_choice', 'Pahlawan yang memimpin Perang Diponegoro adalah?', 'Pangeran Antasari', 'Tuanku Imam Bonjol', 'Pangeran Diponegoro', 'Cut Nyak Dien', 'Sultan Hasanuddin', '', 'C', ''],
  ['single_choice', 'Fungsi utama pasar dalam kegiatan ekonomi adalah?', 'Tempat rekreasi', 'Tempat jual beli barang/jasa', 'Tempat pertemuan warga', 'Tempat olahraga', 'Tempat ibadah', '', 'B', ''],
  ['single_choice', 'Suku Asmat berasal dari provinsi?', 'Papua Barat', 'Papua', 'Maluku', 'NTT', 'Kalimantan', '', 'B', ''],
  ['single_choice', 'Kebijakan moneter di Indonesia dilaksanakan oleh?', 'Pemerintah pusat', 'Bank Indonesia', 'DPR', 'Kementerian Perdagangan', 'OJK', '', 'B', ''],
  ['single_choice', 'Peristiwa Rengasdengklok terjadi karena?', 'Persiapan proklamasi', 'Pertempuran melawan Jepang', 'Perundingan dengan Belanda', 'Pembentukan BPUPKI', 'Sidang PPKI', '', 'A', ''],
  ['single_choice', 'Yang termasuk kebutuhan sekunder adalah?', 'Makanan', 'Pakaian', 'Rumah', 'Mobil pribadi', 'Air minum', '', 'D', ''],
  ['single_choice', 'Gunung tertinggi di Indonesia adalah?', 'Semeru', 'Rinjani', 'Kerinci', 'Puncak Jaya', 'Merapi', '', 'D', ''],
  ['single_choice', 'Kerja paksa pada masa penjajahan Jepang disebut?', 'Cultuurstelsel', 'Rodi', 'Romusha', 'Kerja rodi', 'Tanam paksa', '', 'C', ''],
  ['single_choice', 'Lembaga legislatif di tingkat pusat adalah?', 'Presiden', 'MA', 'DPR', 'MK', 'BPK', '', 'C', ''],
  ['single_choice', 'Pengaruh letak astronomis Indonesia terhadap iklim adalah?', 'Beriklim tropis', 'Beriklim subtropis', 'Beriklim dingin', 'Beriklim sedang', 'Beriklim kontinental', '', 'A', ''],
  ['single_choice', 'Koperasi berdasarkan jenis usahanya yang menjual barang kebutuhan sehari-hari disebut?', 'Koperasi simpan pinjam', 'Koperasi konsumsi', 'Koperasi produksi', 'Koperasi jasa', 'Koperasi serba usaha', '', 'B', ''],
  ['single_choice', 'Perjanjian yang menandai pengakuan kedaulatan Indonesia oleh Belanda adalah?', 'Linggarjati', 'Renville', 'Roem-Royen', 'KMB', 'Konferensi Meja Bundar', '', 'D', ''],
];

const multiChoice = [
  ['multi_choice', 'Yang termasuk negara pendiri ASEAN adalah?', 'Indonesia', 'Malaysia', 'Thailand', 'Filipina', 'Singapura', 'Myanmar', 'A,B,C,D,E', ''],
  ['multi_choice', 'Unsur-unsur terbentuknya negara menurut konvensi Montevideo adalah?', 'Rakyat', 'Wilayah', 'Pemerintah yang berdaulat', 'Pengakuan dari negara lain', 'Bendera', 'Lagu kebangsaan', 'A,B,C,D', ''],
  ['multi_choice', 'Bentuk-bentuk interaksi sosial asosiatif adalah?', 'Kerja sama', 'Akomodasi', 'Asimilasi', 'Persaingan', 'Konflik', 'Kontravensi', 'A,B,C', ''],
  ['multi_choice', 'Sumber pendapatan negara dapat berasal dari?', 'Pajak', 'PNBP', 'Hibah', 'Utang', 'Cukai', 'Retribusi', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Yang termasuk provinsi di Pulau Sumatera adalah?', 'Aceh', 'Sumatera Utara', 'Lampung', 'Banten', 'Bengkulu', 'DKI Jakarta', 'A,B,C,E', ''],
  ['multi_choice', 'Lembaga-lembaga negara menurut UUD 1945 (amandemen) antara lain?', 'MPR', 'DPR', 'DPD', 'Presiden', 'MA', 'MK', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Faktor pendorong terjadinya perdagangan internasional adalah?', 'Perbedaan sumber daya alam', 'Perbedaan iklim', 'Efisiensi biaya', 'Selera', 'Perbedaan teknologi', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Ciri-ciri masyarakat tradisional menurut Koentjaraningrat adalah?', 'Heterogen', 'Homogen', 'Mobilitas rendah', 'Mobilitas tinggi', 'Mata pencaharian beragam', 'Mata pencaharian terbatas', 'B,C,F', ''],
  ['multi_choice', 'Yang termasuk hak asasi manusia di bidang politik adalah?', 'Hak memilih dan dipilih', 'Hak berserikat', 'Hak berkumpul', 'Hak hidup', 'Hak mendapat pendidikan', 'Hak beragama', 'A,B,C', ''],
  ['multi_choice', 'Peninggalan sejarah dari masa Hindu-Buddha di Indonesia adalah?', 'Candi Borobudur', 'Candi Prambanan', 'Candi Muara Takus', 'Masjid Demak', 'Keraton Yogyakarta', 'Candi Singosari', 'A,B,C,F', ''],
  ['multi_choice', 'Fungsi pasar bagi produsen adalah?', 'Tempat menjual hasil produksi', 'Memperoleh bahan baku', 'Sumber informasi harga', 'Tempat promosi', 'Mencari tenaga kerja', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Faktor yang mempengaruhi permintaan adalah?', 'Harga barang', 'Pendapatan', 'Selera', 'Jumlah penduduk', 'Harga barang substitusi', 'Harga barang komplementer', 'A,B,C,D,E,F', ''],
  ['multi_choice', 'Yang termasuk jenis-jenis kebutuhan menurut intensitasnya adalah?', 'Kebutuhan primer', 'Kebutuhan sekunder', 'Kebutuhan tersier', 'Kebutuhan sekarang', 'Kebutuhan masa depan', 'Kebutuhan individu', 'A,B,C', ''],
  ['multi_choice', 'Peran Indonesia dalam ASEAN antara lain?', 'Pemrakarsa berdirinya ASEAN', 'Tuan rumah KTT ASEAN', 'Penyelesaian konflik Kamboja', 'Pembentukan AFTA', 'Deklarasi Bali', '', 'A,B,C,D,E', ''],
  ['multi_choice', 'Ciri-ciri negara demokrasi adalah?', 'Kedaulatan di tangan rakyat', 'Perlindungan HAM', 'Persamaan di depan hukum', 'Kebebasan pers', 'Pemilu yang bebas', 'Satu partai dominan', 'A,B,C,D,E', ''],
];

const benarSalah = [
  ['benar_salah', 'Tentukan benar atau salah pernyataan berikut tentang kemerdekaan Indonesia.', 'Indonesia merdeka pada 17 Agustus 1945.', 'Proklamasi dibacakan di Jalan Pegangsaan Timur 56.', 'Soekarno dan Hatta yang menandatangani naskah proklamasi.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang geografi Indonesia.', 'Indonesia dilalui garis khatulistiwa.', 'Indonesia memiliki dua musim yaitu hujan dan kemarau.', 'Puncak Jaya berada di provinsi Papua Barat.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang ekonomi.', 'Inflasi adalah kenaikan harga barang secara umum dan terus-menerus.', 'Bank Indonesia bertugas mencetak uang.', 'Koperasi adalah soko guru perekonomian Indonesia.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang ASEAN.', 'ASEAN didirikan pada 8 Agustus 1967.', 'Indonesia adalah salah satu pendiri ASEAN.', 'Ibu kota ASEAN berada di Jakarta.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang Pancasila.', 'Pancasila terdiri dari lima sila.', 'Sila pertama berbunyi Ketuhanan Yang Maha Esa.', 'Pancasila disahkan pada 18 Agustus 1945.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang pahlawan nasional.', 'Pangeran Diponegoro memimpin perang di Jawa.', 'Cut Nyak Dien adalah pahlawan dari Aceh.', 'Kapitan Pattimura berjuang di Maluku.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang lembaga negara.', 'DPR memiliki fungsi legislatif, anggaran, dan pengawasan.', 'Presiden dipilih langsung oleh rakyat.', 'MA adalah lembaga eksekutif.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang interaksi sosial.', 'Kerja sama adalah bentuk interaksi asosiatif.', 'Konflik selalu berdampak negatif.', 'Asimilasi dapat menghilangkan perbedaan budaya.', '', '', '', 'B,S,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang kebutuhan manusia.', 'Kebutuhan primer harus dipenuhi terlebih dahulu.', 'Pakaian termasuk kebutuhan primer.', 'Mobil mewah termasuk kebutuhan tersier.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang pasar.', 'Pasar adalah tempat bertemunya penjual dan pembeli.', 'Harga terbentuk melalui mekanisme permintaan dan penawaran.', 'Pasar persaingan sempurna hanya ada satu penjual.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang UUD 1945.', 'UUD 1945 telah mengalami amandemen beberapa kali.', 'Pembukaan UUD 1945 tidak boleh diubah.', 'Pasal-pasal UUD 1945 dapat diubah oleh MPR.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang kolonialisme.', 'VOC dibubarkan pada akhir abad ke-18.', 'Cultuurstelsel diterapkan pada masa Hindia Belanda.', 'Romusha adalah kerja paksa pada masa Jepang.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang koperasi.', 'Koperasi berasaskan kekeluargaan.', 'SHU dibagi sesuai jasa anggota.', 'Koperasi hanya bergerak di bidang simpan pinjam.', '', '', '', 'B,B,S', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang hak asasi manusia.', 'HAM bersifat universal.', 'HAM dapat dibatasi oleh hukum.', 'Di Indonesia HAM diatur dalam UUD 1945.', '', '', '', 'B,B,B', ''],
  ['benar_salah', 'Tentukan benar/salah pernyataan tentang perdagangan internasional.', 'Ekspor adalah menjual barang ke luar negeri.', 'Impor adalah membeli barang dari luar negeri.', 'Neraca perdagangan selalu harus surplus.', '', '', '', 'B,B,S', ''],
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
    { wch: 14 }, { wch: 50 }, { wch: 35 }, { wch: 35 }, { wch: 35 },
    { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
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
    ['File ini: 50 soal IPS (20 single choice, 15 multi choice, 15 benar/salah). Mata pelajaran & tingkat dipilih saat import di aplikasi.'],
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = [{ wch: 50 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

  const outDir = path.join(__dirname, '../..');
  const outPath = path.join(outDir, 'dummy_bank_soal_ips.xlsx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  XLSX.writeFile(wb, outPath);
  console.log('File berhasil dibuat:', outPath);
  console.log('Total baris data:', rows.length - 1, '(baris 1 = header)');
  console.log('  - Single choice:', singleChoice.length);
  console.log('  - Multi choice:', multiChoice.length);
  console.log('  - Benar/Salah:', benarSalah.length);
}

main();
