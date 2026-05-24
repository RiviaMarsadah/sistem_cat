const Joi = require('joi');
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

const KATEGORI = ['pilgan', 'pilgan_kompleks', 'pilgan_kategori'];
const TINGKAT = ['X', 'XI', 'XII', 'SEMUA'];

const baseSchema = {
  bankSoalKoleksiId: Joi.number().integer().positive().allow(null).optional(),
  mataPelajaranId: Joi.number().integer().positive().required(),
  tingkat: Joi.string().valid(...TINGKAT).required().messages({
    'any.only': 'Tingkat harus X, XI, XII, atau SEMUA (0 = semua tingkat)',
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
  jawaban: Joi.string().valid('A', 'B', 'C', 'D', 'E').required(),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE].filter(Boolean);
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
  jawaban: Joi.string().pattern(/^[A-E](,[A-E])*$/).required().messages({
    'string.pattern.base': 'Jawaban harus huruf A-E dipisah koma, contoh: A,B,E',
  }),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE].filter(Boolean);
  if (cols.length < 3) return helpers.message('Minimal 3 kolom jawaban harus diisi');
  const letters = value.jawaban.split(',').map((s) => s.trim());
  const valid = new Set(['A', 'B', 'C', 'D', 'E']);
  if (!letters.every((l) => valid.has(l))) return helpers.message('Jawaban hanya boleh A,B,C,D,E');
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
  jawaban: Joi.string().pattern(/^[BS](,[BS])*$/).required().messages({
    'string.pattern.base': 'Jawaban benar/salah: B atau S dipisah koma, contoh: B,B,S',
  }),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE].filter(Boolean);
  if (cols.length < 1) return helpers.message('Minimal 1 pernyataan harus diisi');
  return value;
});

function getSchema(kategori) {
  if (kategori === 'pilgan') return singleChoiceSchema;
  if (kategori === 'pilgan_kompleks') return multiChoiceSchema;
  if (kategori === 'pilgan_kategori') return benarSalahSchema;
  return null;
}

exports.getSchema = getSchema;

function normalizePayload(body) {
  const out = {
    bankSoalKoleksiId:
      body.bankSoalKoleksiId != null && body.bankSoalKoleksiId !== ''
        ? Number(body.bankSoalKoleksiId)
        : null,
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
    jawaban: String(body.jawaban).trim(),
    gambar: body.gambar || null,
  };
  return out;
}

exports.normalizePayload = normalizePayload;

exports.list = async (req, res) => {
  try {
    const { mataPelajaranId, tingkat, jurusanId, kategoriSoal, bankSoalKoleksiId } = req.query;
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
    if (bankSoalKoleksiId) where.bankSoalKoleksiId = Number(bankSoalKoleksiId);

    const items = await prisma.bankSoal.findMany({
      where,
      orderBy: [{ tingkat: 'asc' }, { createdAt: 'desc' }],
      include: {
        bankSoalKoleksi: { select: { id: true, nama: true } },
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, namaProdi: true, kodeProdi: true } },
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
        bankSoalKoleksi: { select: { id: true, nama: true } },
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, namaProdi: true, kodeProdi: true } },
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
    if (value.bankSoalKoleksiId != null) {
      await prisma.bankSoalKoleksi.findFirstOrThrow({
        where: { id: value.bankSoalKoleksiId, guruId },
      });
    }
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
        bankSoalKoleksi: { select: { id: true, nama: true } },
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, namaProdi: true, kodeProdi: true } },
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
    if (value.bankSoalKoleksiId != null) {
      await prisma.bankSoalKoleksi.findFirstOrThrow({
        where: { id: value.bankSoalKoleksiId, guruId },
      });
    }
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
        bankSoalKoleksi: { select: { id: true, nama: true } },
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        jurusan: { select: { id: true, namaProdi: true, kodeProdi: true } },
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
    const item = await prisma.bankSoal.findFirst({
      where: { id, guruId },
      select: { id: true, gambar: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
    }

    // Periksa apakah soal ini digunakan di Paket Ujian
    const usedInPakets = await prisma.soalPaketUjian.findMany({
      where: { bankSoalId: id },
      include: {
        paketUjian: { select: { nama: true } }
      }
    });

    // Periksa apakah soal ini digunakan di Ujian Siswa (Riwayat Ujian)
    const usedInJawabans = await prisma.jawabanSiswa.findMany({
      where: { bankSoalId: id },
      include: {
        ujian: {
          include: {
            jadwalUjian: { select: { nama: true } }
          }
        }
      }
    });

    if (usedInPakets.length > 0 || usedInJawabans.length > 0) {
      const paketNames = Array.from(new Set(usedInPakets.map((p) => p.paketUjian?.nama))).filter(Boolean);
      const jadwalNames = Array.from(new Set(usedInJawabans.map((j) => j.ujian?.jadwalUjian?.nama))).filter(Boolean);

      let detailMessage = 'Tidak dapat menghapus soal ini karena masih digunakan:';
      if (paketNames.length > 0) {
        detailMessage += `\n• Paket Ujian: ${paketNames.join(', ')}`;
      }
      if (jadwalNames.length > 0) {
        detailMessage += `\n• Riwayat/Jadwal Ujian: ${jadwalNames.join(', ')}`;
      }
      detailMessage += '\n\nSilakan hapus atau lepaskan soal ini dari paket/jadwal tersebut terlebih dahulu.';

      return res.status(400).json({
        success: false,
        message: detailMessage
      });
    }

    if (item.gambar) {
      const filePath = path.join(process.cwd(), 'uploads', item.gambar);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error(`Gagal menghapus file gambar ${item.gambar}:`, unlinkErr);
      }
    }

    await prisma.bankSoal.delete({ where: { id } });
    return res.json({ success: true, message: 'Soal berhasil dihapus' });
  } catch (err) {
    console.error('BankSoal remove error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus soal' });
  }
};

const crypto = require('crypto');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    const uuid = crypto.randomUUID();
    const filename = `${uuid}.webp`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, req.file.buffer);

    return res.json({
      success: true,
      message: 'Gambar berhasil diunggah',
      filename: filename
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengunggah gambar' });
  }
};
