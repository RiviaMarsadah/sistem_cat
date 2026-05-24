const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const { getSchema, normalizePayload } = require('./bankSoalController');

const KATEGORI = ['pilgan', 'pilgan_kompleks', 'pilgan_kategori'];
const TINGKAT = ['X', 'XI', 'XII', 'SEMUA'];

const HEADER_MAP = {
  kategori: 'kategoriSoal',
  soal: 'soal',
  'opsi a': 'kolomA',
  'opsi b': 'kolomB',
  'opsi c': 'kolomC',
  'opsi d': 'kolomD',
  'opsi e': 'kolomE',
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

  const bankSoalKoleksiIdRaw = req.body.bankSoalKoleksiId;
  const namaBankSoal = req.body.namaBankSoal ? String(req.body.namaBankSoal).trim() : null;

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      let bankSoalKoleksiId =
        bankSoalKoleksiIdRaw != null && bankSoalKoleksiIdRaw !== '' && String(bankSoalKoleksiIdRaw).toLowerCase() !== 'null'
          ? Number(bankSoalKoleksiIdRaw)
          : null;

      if (bankSoalKoleksiId) {
        const existing = await tx.bankSoalKoleksi.findFirst({
          where: { id: bankSoalKoleksiId, guruId },
        });
        if (!existing) {
          throw new Error('Bank soal tidak ditemukan atau bukan milik Anda');
        }
        
        // Update metadata on existing collection if it is currently empty/null
        if (!existing.mataPelajaranId || !existing.tingkat) {
          await tx.bankSoalKoleksi.update({
            where: { id: bankSoalKoleksiId },
            data: {
              mataPelajaranId: existing.mataPelajaranId || mataPelajaranId,
              tingkat: existing.tingkat || tingkat,
              jurusanId: existing.jurusanId || jurusanId
            }
          });
        }
      } else if (namaBankSoal) {
        let koleksi = await tx.bankSoalKoleksi.findFirst({
          where: { guruId, nama: namaBankSoal },
        });
        if (!koleksi) {
          koleksi = await tx.bankSoalKoleksi.create({
            data: { 
              guruId, 
              nama: namaBankSoal,
              mataPelajaranId,
              tingkat,
              jurusanId
            },
          });
        } else {
          // Update metadata if the existing named collection is empty/null
          if (!koleksi.mataPelajaranId || !koleksi.tingkat) {
            await tx.bankSoalKoleksi.update({
              where: { id: koleksi.id },
              data: {
                mataPelajaranId: koleksi.mataPelajaranId || mataPelajaranId,
                tingkat: koleksi.tingkat || tingkat,
                jurusanId: koleksi.jurusanId || jurusanId
              }
            });
          }
        }
        bankSoalKoleksiId = koleksi.id;
      }

      const defaults = {
        mataPelajaranId,
        tingkat,
        jurusanId,
        guruId,
        bankSoalKoleksiId,
      };

      let workbook;
      try {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
      } catch (e) {
        throw new Error('File bukan format Excel yang valid');
      }

      const sheetName = workbook.SheetNames[0] || 'Sheet1';
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        throw new Error('Tidak ada baris data di sheet pertama');
      }

      const createdSoalList = [];
      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2;
        const payload = rowToPayload(rows[i], { ...defaults });
        const kategori = payload.kategoriSoal && String(payload.kategoriSoal).trim().toLowerCase().replace(/\s+/g, '_');
        if (!kategori || !KATEGORI.includes(kategori)) {
          throw new Error(`Error Baris ${rowNum}: Kategori harus pilgan, pilgan_kompleks, atau pilgan_kategori`);
        }
        payload.kategoriSoal = kategori;
        if (kategori === 'pilgan_kategori' && payload.jawaban) {
          payload.jawaban = normalizeJawabanBenarSalah(payload.jawaban);
        }

        const schema = getSchema(kategori);
        const { guruId: _ignoredGuruId, ...validatePayload } = payload;
        const { error, value } = schema.validate(validatePayload, { abortEarly: true });
        if (error) {
          throw new Error(`Error Baris ${rowNum}: ${error.details[0].message}`);
        }
        try {
          const created = await tx.bankSoal.create({
            data: normalizePayload({ ...value, guruId }),
          });
          createdSoalList.push(created);
        } catch (e) {
          throw new Error(`Error Baris ${rowNum}: Gagal menyimpan (${e.message})`);
        }
      }

      return { createdCount: createdSoalList.length };
    });

    return res.json({
      success: true,
      message: `Impor sukses! Berhasil menambahkan ${result.createdCount} soal ke bank soal.`,
      data: { created: result.createdCount, failed: 0, errors: [] },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal melakukan impor bank soal. Proses dibatalkan.',
    });
  }
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
    'Jawaban',
    'Gambar',
  ];
  const exampleSingle = [
    'pilgan',
    'Siapa presiden pertama Indonesia?',
    'Soekarno',
    'Soeharto',
    'B.J. Habibie',
    '',
    '',
    'A',
    '',
  ];
  const exampleMulti = [
    'pilgan_kompleks',
    'Yang termasuk bilangan prima adalah...',
    '2',
    '3',
    '4',
    '5',
    '',
    'A,B,D',
    '',
  ];
  const exampleBenarSalah = [
    'pilgan_kategori',
    'Tentukan benar/salah pernyataan berikut.',
    'Bumi berbentuk bulat',
    'Matahari mengelilingi Bumi',
    'Air mendidih pada 100°C',
    '',
    '',
    'B,S,B',
    '',
  ];

  const data = [headers, exampleSingle, exampleMulti, exampleBenarSalah];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Soal');

  const panduanRows = [
    ['PANDUAN FORMAT IMPORT BANK SOAL'],
    [],
    ['PENTING:', 'Ketik "Nama Bank Soal" langsung pada form di Web Aplikasi sebelum upload, fitur import akan otomatis menautkannya.'],
    [],
    ['Kolom di sheet "Soal" (baris pertama = header):'],
    ['Kategori', 'pilgan | pilgan_kompleks | pilgan_kategori'],
    ['Soal', 'Teks pertanyaan (opsional untuk pilgan_kategori)'],
    ['Opsi A s/d E', 'Isi opsi atau pernyataan. Minimal 3 untuk pilgan/pilgan_kompleks, minimal 1 untuk pilgan_kategori'],
    ['Jawaban', 'Single: satu huruf A-E. Multi: dipisah koma contoh A,B,D. Benar/Salah: B atau S per pernyataan, contoh B,B,S'],
    ['Gambar', 'URL gambar (opsional)'],
    [],
    ['Contoh nilai Kategori: pilgan, pilgan_kompleks, pilgan_kategori'],
    ['Untuk pilgan_kategori, isi Jawaban dengan B (Benar) dan S (Salah) sesuai urutan Opsi A, B, C, ...'],
  ];
  const wsPanduan = XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols'] = [{ wch: 50 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsPanduan, 'Panduan');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=template_import_bank_soal.xlsx');
  res.send(buf);
};
