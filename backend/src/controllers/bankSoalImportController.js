const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const { getSchema, normalizePayload } = require('./bankSoalController');

const KATEGORI = ['single_choice', 'multi_choice', 'benar_salah'];
const TINGKAT = ['X', 'XI', 'XII', 'SEMUA'];

// Map header cell (flexible) to our field name
const HEADER_MAP = {
  kategori: 'kategoriSoal',
  soal: 'soal',
  'opsi a': 'kolomA',
  'opsi b': 'kolomB',
  'opsi c': 'kolomC',
  'opsi d': 'kolomD',
  'opsi e': 'kolomE',
  'opsi f': 'kolomF',
  jawaban: 'jawaban',
  gambar: 'gambar',
};

function normalizeHeader(str) {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

function rowToPayload(row, defaults) {
  const out = { ...defaults };
  for (const [key, val] of Object.entries(row)) {
    const norm = normalizeHeader(key);
    const field = HEADER_MAP[norm];
    if (!field) continue;
    const v = val != null ? String(val).trim() : '';
    out[field] = v || null;
  }
  return out;
}

function normalizeJawabanBenarSalah(val) {
  if (!val || typeof val !== 'string') return val;
  const s = val.trim().toUpperCase();
  return s
    .replace(/\bBENAR\b/gi, 'B')
    .replace(/\bSALAH\b/gi, 'S')
    .replace(/[^BS,]/g, '')
    .replace(/,+/g, ',');
}

/**
 * POST /guru/bank-soal/import
 * Body: multipart with file + mataPelajaranId, tingkat, jurusanId (optional)
 */
exports.importExcel = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) {
    return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });
  }

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ success: false, message: 'File Excel wajib diunggah' });
  }

  const mataPelajaranId = req.body.mataPelajaranId ? Number(req.body.mataPelajaranId) : null;
  let tingkat = (req.body.tingkat || '').trim().toUpperCase();
  const jurusanIdRaw = req.body.jurusanId;

  if (!mataPelajaranId) {
    return res.status(400).json({ success: false, message: 'Mata pelajaran wajib dipilih' });
  }
  if (tingkat === '10') tingkat = 'X';
  if (tingkat === '11') tingkat = 'XI';
  if (tingkat === '12') tingkat = 'XII';
  if (tingkat === '0') tingkat = 'SEMUA';
  if (!TINGKAT.includes(tingkat)) {
    return res.status(400).json({ success: false, message: 'Tingkat harus 10, 11, 12, atau 0 (semua tingkat)' });
  }

  const jurusanId =
    jurusanIdRaw != null && jurusanIdRaw !== '' && String(jurusanIdRaw).toLowerCase() !== 'null'
      ? Number(jurusanIdRaw)
      : null;

  try {
    await prisma.mataPelajaran.findUniqueOrThrow({ where: { id: mataPelajaranId } });
    if (jurusanId != null) {
      await prisma.jurusan.findUniqueOrThrow({ where: { id: jurusanId } });
    }
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Mata pelajaran atau jurusan tidak ditemukan' });
    }
    throw e;
  }

  const defaults = {
    mataPelajaranId,
    tingkat,
    jurusanId,
    guruId,
  };

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
  } catch (e) {
    return res.status(400).json({ success: false, message: 'File bukan format Excel yang valid' });
  }

  const sheetName = workbook.SheetNames[0] || 'Sheet1';
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!rows.length) {
    return res.status(400).json({ success: false, message: 'Tidak ada baris data di sheet pertama' });
  }

  const results = { created: 0, failed: 0, errors: [] };
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const payload = rowToPayload(rows[i], { ...defaults });
    const kategori = payload.kategoriSoal && String(payload.kategoriSoal).trim().toLowerCase().replace(/\s+/g, '_');
    if (!kategori || !KATEGORI.includes(kategori)) {
      results.failed++;
      results.errors.push({ row: rowNum, message: 'Kategori harus: single_choice, multi_choice, atau benar_salah' });
      continue;
    }
    payload.kategoriSoal = kategori;
    if (kategori === 'benar_salah' && payload.jawaban) {
      payload.jawaban = normalizeJawabanBenarSalah(payload.jawaban);
    }

    // Jangan validasi field guruId di Joi schema (schema hanya mengenal baseSchema)
    const schema = getSchema(kategori);
    const { guruId: _ignoredGuruId, ...validatePayload } = payload;
    const { error, value } = schema.validate(validatePayload, { abortEarly: true });
    if (error) {
      results.failed++;
      results.errors.push({ row: rowNum, message: error.details[0].message });
      continue;
    }
    try {
      await prisma.bankSoal.create({
        data: normalizePayload({ ...value, guruId }),
      });
      results.created++;
    } catch (e) {
      results.failed++;
      results.errors.push({ row: rowNum, message: e.message || 'Gagal menyimpan' });
    }
  }

  return res.json({
    success: true,
    message: `Import selesai: ${results.created} berhasil, ${results.failed} gagal`,
    data: results,
  });
};

/**
 * GET /guru/bank-soal/template
 * Returns Excel file with header row and example rows + sheet Panduan
 */
exports.downloadTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Kategori',
    'Soal',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Opsi E',
    'Opsi F',
    'Jawaban',
    'Gambar',
  ];
  const exampleSingle = [
    'single_choice',
    'Siapa presiden pertama Indonesia?',
    'Soekarno',
    'Soeharto',
    'B.J. Habibie',
    '',
    '',
    '',
    'A',
    '',
  ];
  const exampleMulti = [
    'multi_choice',
    'Yang termasuk bilangan prima adalah...',
    '2',
    '3',
    '4',
    '5',
    '6',
    '',
    'A,B,D',
    '',
  ];
  const exampleBenarSalah = [
    'benar_salah',
    'Tentukan benar/salah pernyataan berikut.',
    'Bumi berbentuk bulat',
    'Matahari mengelilingi Bumi',
    'Air mendidih pada 100°C',
    '',
    '',
    '',
    'B,S,B',
    '',
  ];

  const data = [headers, exampleSingle, exampleMulti, exampleBenarSalah];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
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
    ['Contoh nilai Kategori: single_choice, multi_choice, benar_salah'],
    ['Untuk benar_salah, isi Jawaban dengan B (Benar) dan S (Salah) sesuai urutan Opsi A, B, C, ...'],
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = [{ wch: 50 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=template_import_bank_soal.xlsx');
  res.send(buf);
};
