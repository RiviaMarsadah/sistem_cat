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
  ['Rivia Siswa', 'riviasr1212@gmail.com', '2024001', '0012345678', '10 RPL A'],
  ['Hendra Wijaya', 'hendra@siswa.sekolah.sch.id', '2024002', '0012345679', '10 RPL A'],
  ['Budi Santoso', 'budi@siswa.sekolah.sch.id', '2024003', '0012345680', '10 TKJ A']
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
  ['Rivia Guru', 'riviadimong321@gmail.com', '198001012005011001'],
  ['Siti Aminah, S.Pd', 'sitiaminah@guru.sekolah.sch.id', '198203152010012003'],
  ['Drs. Ahmad Fauzi, M.Pd', 'ahmadfauzi@guru.sekolah.sch.id', '197508222003121002']
];
const wsGuru = XLSX.utils.aoa_to_sheet(guruData);
const wbGuru = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbGuru, wsGuru, 'Guru');
const filePathGuru = path.join(dir, 'template_guru.xlsx');
XLSX.writeFile(wbGuru, filePathGuru);
console.log('Created:', filePathGuru);

console.log('Excel templates generation finished!');
