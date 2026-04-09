const Joi = require('joi');
const prisma = require('../config/prisma');

const createSchema = Joi.object({
  nama: Joi.string().trim().min(1).max(120).required(),
});

exports.list = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const items = await prisma.bankSoalKoleksi.findMany({
      where: { guruId },
      orderBy: [{ updatedAt: 'desc' }, { nama: 'asc' }],
      include: {
        _count: { select: { bankSoal: true } },
      },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('BankSoalKoleksi list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat koleksi bank soal' });
  }
};

exports.create = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const { error, value } = createSchema.validate(req.body, { abortEarly: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const existing = await prisma.bankSoalKoleksi.findFirst({
      where: { guruId, nama: value.nama.trim() },
      select: { id: true, nama: true, createdAt: true, updatedAt: true },
    });
    if (existing) {
      return res.json({ success: true, message: 'Koleksi sudah ada', data: existing });
    }

    const created = await prisma.bankSoalKoleksi.create({
      data: {
        guruId,
        nama: value.nama.trim(),
      },
    });

    return res.status(201).json({ success: true, message: 'Koleksi bank soal berhasil dibuat', data: created });
  } catch (err) {
    console.error('BankSoalKoleksi create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat koleksi bank soal' });
  }
};

