const Joi = require('joi');
const prisma = require('../config/prisma');

const createSchema = Joi.object({
  namaMapel: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nama mata pelajaran tidak boleh kosong',
    'string.min': 'Nama minimal 2 karakter',
    'any.required': 'Nama mata pelajaran wajib diisi',
  }),
  kodeMapel: Joi.string().trim().max(20).allow('', null),
  deskripsi: Joi.string().trim().max(2000).allow('', null),
}).messages({
  'object.unknown': 'Field tidak dikenal',
});

const updateSchema = Joi.object({
  namaMapel: Joi.string().trim().min(2).max(100).optional(),
  kodeMapel: Joi.string().trim().max(20).allow('', null),
  deskripsi: Joi.string().trim().max(2000).allow('', null),
});

function isPrismaUniqueError(err) {
  return err && err.code === 'P2002';
}

exports.list = async (req, res) => {
  try {
    const items = await prisma.mataPelajaran.findMany({
      orderBy: [{ namaMapel: 'asc' }],
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('MataPelajaran list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat mata pelajaran' });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  try {
    const item = await prisma.mataPelajaran.findUnique({
      where: { id },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('MataPelajaran getById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat mata pelajaran' });
  }
};

exports.create = async (req, res) => {
  const { error, value } = createSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const data = {
    namaMapel: value.namaMapel.trim(),
    kodeMapel: value.kodeMapel?.trim() || null,
    deskripsi: value.deskripsi?.trim() || null,
  };

  try {
    const created = await prisma.mataPelajaran.create({
      data,
    });
    return res.status(201).json({ success: true, message: 'Mata pelajaran berhasil ditambah', data: created });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      const field = err.meta?.target?.[0];
      if (field === 'kode_mapel') {
        return res.status(409).json({ success: false, message: 'Kode mata pelajaran sudah digunakan' });
      }
      return res.status(409).json({ success: false, message: 'Data sudah ada' });
    }
    console.error('MataPelajaran create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah mata pelajaran' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const { error, value } = updateSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const data = {};
  if (value.namaMapel !== undefined) data.namaMapel = value.namaMapel.trim();
  if (value.kodeMapel !== undefined) data.kodeMapel = value.kodeMapel?.trim() || null;
  if (value.deskripsi !== undefined) data.deskripsi = value.deskripsi?.trim() || null;

  try {
    const updated = await prisma.mataPelajaran.update({
      where: { id },
      data,
    });
    return res.json({ success: true, message: 'Mata pelajaran berhasil diubah', data: updated });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({ success: false, message: 'Kode mata pelajaran sudah digunakan' });
    }
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    }
    console.error('MataPelajaran update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah mata pelajaran' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  try {
    await prisma.mataPelajaran.delete({ where: { id } });
    return res.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    }
    if (err?.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Mata pelajaran tidak dapat dihapus karena masih digunakan di bank soal' });
    }
    console.error('MataPelajaran remove error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus mata pelajaran' });
  }
};
