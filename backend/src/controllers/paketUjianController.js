const Joi = require('joi');
const prisma = require('../config/prisma');

const TINGKAT = ['X', 'XI', 'XII', 'SEMUA'];
const TIPE_UJIAN = ['UH', 'UTS', 'UAS', 'Lainnya'];

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * 26)]).join('');
}

const createSchema = Joi.object({
  nama: Joi.string().trim().min(1).max(200).required(),
  mataPelajaranId: Joi.number().integer().positive().required(),
  tingkat: Joi.string().valid(...TINGKAT).required(),
  tipeUjian: Joi.string().valid(...TIPE_UJIAN).required(),
  bankSoalIds: Joi.array().items(Joi.number().integer().positive()).default([]),
});

const updateSchema = Joi.object({
  nama: Joi.string().trim().min(1).max(200).optional(),
  mataPelajaranId: Joi.number().integer().positive().optional(),
  tingkat: Joi.string().valid(...TINGKAT).optional(),
  tipeUjian: Joi.string().valid(...TIPE_UJIAN).optional(),
  bankSoalIds: Joi.array().items(Joi.number().integer().positive()).optional(),
});

exports.list = async (req, res) => {
  try {
    const guruId = req.guruId;
    if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

    const items = await prisma.paketUjian.findMany({
      where: { guruId },
      orderBy: { updatedAt: 'desc' },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        _count: { select: { soalPaket: true } },
      },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('PaketUjian list error:', err);
    const msg = String(err.message || '');
    if ((msg.includes('findMany') && msg.includes('undefined')) || msg.includes('paketUjian')) {
      return res.status(500).json({
        success: false,
        message: 'Prisma client belum di-update. Stop backend (Ctrl+C), jalankan di folder backend: npx prisma generate, lalu jalankan backend lagi.',
      });
    }
    return res.status(500).json({ success: false, message: 'Gagal memuat paket ujian' });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const item = await prisma.paketUjian.findFirst({
      where: { id, guruId },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        soalPaket: {
          include: {
            bankSoal: {
              select: {
                id: true,
                soal: true,
                jawaban: true,
                kategoriSoal: true,
                tingkat: true,
                jurusanId: true,
                mataPelajaran: { select: { namaMapel: true } },
                jurusan: { select: { nama: true } },
              },
            },
          },
        },
      },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('PaketUjian getById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat paket ujian' });
  }
};

exports.create = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const { error, value } = createSchema.validate(req.body, { abortEarly: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    await prisma.mataPelajaran.findUniqueOrThrow({ where: { id: value.mataPelajaranId } });
  } catch (e) {
    if (e.code === 'P2025') return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    throw e;
  }

  let tokenCheckIn = generateToken();
  let tokenCheckOut = generateToken();
  while (tokenCheckIn === tokenCheckOut) tokenCheckOut = generateToken();

  try {
    const bankSoalIds = value.bankSoalIds || [];
    const created = await prisma.paketUjian.create({
      data: {
        nama: value.nama,
        mataPelajaranId: value.mataPelajaranId,
        tingkat: value.tingkat,
        tipeUjian: value.tipeUjian,
        tokenCheckIn,
        tokenCheckOut,
        guruId,
      },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
      },
    });
    if (bankSoalIds.length > 0) {
      await prisma.soalPaketUjian.createMany({
        data: bankSoalIds.map((bankSoalId) => ({ paketUjianId: created.id, bankSoalId })),
        skipDuplicates: true,
      });
    }
    const withSoal = await prisma.paketUjian.findUnique({
      where: { id: created.id },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        _count: { select: { soalPaket: true } },
      },
    });
    return res.status(201).json({ success: true, message: 'Paket ujian berhasil dibuat', data: withSoal });
  } catch (err) {
    console.error('PaketUjian create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat paket ujian' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const { error, value } = updateSchema.validate(req.body, { abortEarly: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const existing = await prisma.paketUjian.findFirst({ where: { id, guruId } });
  if (!existing) return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan' });

  if (value.mataPelajaranId != null) {
    try {
      await prisma.mataPelajaran.findUniqueOrThrow({ where: { id: value.mataPelajaranId } });
    } catch (e) {
      if (e.code === 'P2025') return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
      throw e;
    }
  }

  const updateData = {};
  if (value.nama != null) updateData.nama = value.nama;
  if (value.mataPelajaranId != null) updateData.mataPelajaranId = value.mataPelajaranId;
  if (value.tingkat != null) updateData.tingkat = value.tingkat;
  if (value.tipeUjian != null) updateData.tipeUjian = value.tipeUjian;

  try {
    if (Object.keys(updateData).length > 0) {
      await prisma.paketUjian.updateMany({ where: { id, guruId }, data: updateData });
    }
    if (value.bankSoalIds !== undefined) {
      await prisma.soalPaketUjian.deleteMany({ where: { paketUjianId: id } });
      if (value.bankSoalIds.length > 0) {
        await prisma.soalPaketUjian.createMany({
          data: value.bankSoalIds.map((bankSoalId) => ({ paketUjianId: id, bankSoalId })),
          skipDuplicates: true,
        });
      }
    }
    const item = await prisma.paketUjian.findUnique({
      where: { id },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        _count: { select: { soalPaket: true } },
      },
    });
    return res.json({ success: true, message: 'Paket ujian berhasil diubah', data: item });
  } catch (err) {
    console.error('PaketUjian update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah paket ujian' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const deleted = await prisma.paketUjian.deleteMany({ where: { id, guruId } });
    if (deleted.count === 0) return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan' });
    return res.json({ success: true, message: 'Paket ujian berhasil dihapus' });
  } catch (err) {
    console.error('PaketUjian remove error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus paket ujian' });
  }
};
