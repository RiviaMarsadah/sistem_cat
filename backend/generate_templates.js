const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Target directory (relative to backend/)
const dir = path.join(__dirname, 'public', 'templates');
console.log('Target directory:', dir);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Template Siswa
const siswaData = [
  ['namaLengkap', 'email', 'nis', 'nisn', 'namaKelas'],
  ['Hendra Wijaya', 'hendra@example.com', '12345', '0012345678', 'X RPL 1'],
  ['Budi Santoso', 'budi@example.com', '12346', '0012345679', 'X RPL 1']
];
const wsSiswa = XLSX.utils.aoa_to_sheet(siswaData);
const wbSiswa = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbSiswa, wsSiswa, 'Siswa');
const filePathSiswa = path.join(dir, 'template_siswa.xlsx');
XLSX.writeFile(wbSiswa, filePathSiswa);
console.log('Created:', filePathSiswa);

// 2. Template Guru
const guruData = [
  ['namaLengkap', 'email', 'nip'],
  ['Siti Aminah', 'siti@example.com', '198001012010012001'],
  ['Ahmad Fauzi', 'ahmad@example.com', '198102022011021002']
];
const wsGuru = XLSX.utils.aoa_to_sheet(guruData);
const wbGuru = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbGuru, wsGuru, 'Guru');
const filePathGuru = path.join(dir, 'template_guru.xlsx');
XLSX.writeFile(wbGuru, filePathGuru);
console.log('Created:', filePathGuru);

console.log('Excel templates generation finished!');
