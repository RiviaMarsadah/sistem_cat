const Joi = require('joi');
const prisma = require('../config/prisma');

const KATEGORI = ['single_choice', 'multi_choice', 'benar_salah'];
const TINGKAT = ['X', 'XI', 'XII'];

const baseSchema = {
  mataPelajaranId: Joi.number().integer().positive().required(),
  tingkat: Joi.string().valid(...TINGKAT).required().messages({
    'any.only': 'Tingkat harus X, XI, atau XII (10, 11, 12)',
  }),
  jurusanId: Joi.number().integer().positive().allow(null).optional(),
  kategoriSoal: Joi.string().valid(...KATEGORI).required(),
};

const singleChoiceSchema = Joi.object({
  ...baseSchema,
  soal: Joi.string().trim().min(1).required(),
  kolomA: Joi.string().trim().max(500).allow('', null),
  kolomB: Joi.string().trim().max(500).allow('', null),
  kolomC: Joi.string().trim().max(500).allow('', null),
  kolomD: Joi.string().trim().max(500).allow('', null),
  kolomE: Joi.string().trim().max(500).allow('', null),
  kolomF: Joi.string().trim().max(500).allow('', null),
  jawaban: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE, value.kolomF].filter(Boolean);
  if (cols.length < 3) return helpers.message('Minimal 3 kolom jawaban harus diisi');
  return value;
});

const multiChoiceSchema = Joi.object({
  ...baseSchema,
  soal: Joi.string().trim().min(1).required(),
  kolomA: Joi.string().trim().max(500).allow('', null),
  kolomB: Joi.string().trim().max(500).allow('', null),
  kolomC: Joi.string().trim().max(500).allow('', null),
  kolomD: Joi.string().trim().max(500).allow('', null),
  kolomE: Joi.string().trim().max(500).allow('', null),
  kolomF: Joi.string().trim().max(500).allow('', null),
  jawaban: Joi.string().pattern(/^[A-F](,[A-F])*$/).required().messages({
    'string.pattern.base': 'Jawaban harus huruf A-F dipisah koma, contoh: A,B,F',
  }),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE, value.kolomF].filter(Boolean);
  if (cols.length < 3) return helpers.message('Minimal 3 kolom jawaban harus diisi');
  const letters = value.jawaban.split(',').map((s) => s.trim());
  const valid = new Set(['A', 'B', 'C', 'D', 'E', 'F']);
  if (!letters.every((l) => valid.has(l))) return helpers.message('Jawaban hanya boleh A,B,C,D,E,F');
  return value;
});

const benarSalahSchema = Joi.object({
  ...baseSchema,
  soal: Joi.string().trim().allow('', null),
  kolomA: Joi.string().trim().max(500).allow('', null),
  kolomB: Joi.string().trim().max(500).allow('', null),
  kolomC: Joi.string().trim().max(500).allow('', null),
  kolomD: Joi.string().trim().max(500).allow('', null),
  kolomE: Joi.string().trim().max(500).allow('', null),
  kolomF: Joi.string().trim().max(500).allow('', null),
  jawaban: Joi.string().pattern(/^[BS](,[BS])*$/).required().messages({
    'string.pattern.base': 'Jawaban benar/salah: B atau S dipisah koma, contoh: B,B,S',
  }),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE, value.kolomF].filter(Boolean);
  if (cols.length < 1) return helpers.message('Minimal 1 pernyataan harus diisi');
  return value;
});

function getSchema(kategori) {
  if (kategori === 'single_choice') return singleChoiceSchema;
  if (kategori === 'multi_choice') return multiChoiceSchema;
  if (kategori === 'benar_salah') return benarSalahSchema;
  return null;
}

exports.getSchema = getSchema;

function normalizePayload(body) {
  const out = {
    mataPelajaranId: body.mataPelajaranId,
    tingkat: body.tingkat,
    jurusanId: body.jurusanId != null && body.jurusanId !== '' ? Number(body.jurusanId) : null,
    guruId: body.guruId,
    kategoriSoal: body.kategoriSoal,
    soal: body.soal || null,
    kolomA: body.kolomA || null,
    kolomB: body.kolomB || null,
    kolomC: body.kolomC || null,
    kolomD: body.kolomD || null,
    kolomE: body.kolomE || null,
    kolomF: body.kolomF || null,
    jawaban: String(body.jawaban).trim(),
    gambar: body.gambar || null,
  };
  return out;
}

exports.normalizePayload = normalizePayload;

exports.list = async (req, res) => {
  try {
    const { mataPelajaranId, tingkat, jurusanId, kategoriSoal } = req.query;
    const guruId = req.guruId;
    if (!guruId) {
      return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });
    }

    const where = { guruId: Number(guruId) };
    if (mataPelajaranId) where.mataPelajaranId = Number(mataPelajaranId);
    if (tingkat) where.tingkat = tingkat;
    if (jurusanId !== undefined && jurusanId !== '' && jurusanId !== 'null') {
      where.jurusanId = jurusanId === 'null' || jurusanId === '' ? null : Number(jurusanId);
    }
    if (kategoriSoal) where.kategoriSoal = kategoriSoal;

    const items = await prisma.bankSoal.findMany({
      where,
      orderBy: [{ tingkat: 'asc' }, { createdAt: 'desc' }],
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, nama: true, idJurusan: true } },
      },
    });

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('BankSoal list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat bank soal' });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const item = await prisma.bankSoal.findFirst({
      where: { id, guruId },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, nama: true, idJurusan: true } },
      },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('BankSoal getById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat soal' });
  }
};

exports.create = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const schema = getSchema(req.body.kategoriSoal);
  if (!schema) {
    return res.status(400).json({ success: false, message: 'Kategori soal tidak valid' });
  }

  const { error, value } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    await prisma.mataPelajaran.findUniqueOrThrow({ where: { id: value.mataPelajaranId } });
    if (value.jurusanId != null) {
      await prisma.jurusan.findUniqueOrThrow({ where: { id: value.jurusanId } });
    }
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Mata pelajaran atau jurusan tidak ditemukan' });
    }
    throw e;
  }

  try {
    const created = await prisma.bankSoal.create({
      data: normalizePayload({ ...value, guruId }),
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, nama: true, idJurusan: true } },
      },
    });
    return res.status(201).json({ success: true, message: 'Soal berhasil ditambah', data: created });
  } catch (err) {
    console.error('BankSoal create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah soal' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const schema = getSchema(req.body.kategoriSoal);
  if (!schema) {
    return res.status(400).json({ success: false, message: 'Kategori soal tidak valid' });
  }

  const { error, value } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    await prisma.mataPelajaran.findUniqueOrThrow({ where: { id: value.mataPelajaranId } });
    if (value.jurusanId != null) {
      await prisma.jurusan.findUniqueOrThrow({ where: { id: value.jurusanId } });
    }
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(400).json({ success: false, message: 'Mata pelajaran atau jurusan tidak ditemukan' });
    }
    throw e;
  }

  try {
    const updated = await prisma.bankSoal.updateMany({
      where: { id, guruId },
      data: normalizePayload({ ...value, guruId }),
    });
    if (updated.count === 0) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }
    const item = await prisma.bankSoal.findUnique({
      where: { id },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, nama: true, idJurusan: true } },
      },
    });
    return res.json({ success: true, message: 'Soal berhasil diubah', data: item });
  } catch (err) {
    console.error('BankSoal update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah soal' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const deleted = await prisma.bankSoal.deleteMany({ where: { id, guruId } });
    if (deleted.count === 0) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Soal berhasil dihapus' });
  } catch (err) {
    console.error('BankSoal remove error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus soal' });
  }
};
