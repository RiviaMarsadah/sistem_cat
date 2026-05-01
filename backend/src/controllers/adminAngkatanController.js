const Joi = require('joi');
const prisma = require('../config/prisma');

const angkatanSchema = Joi.object({
  namaAngkatan: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Nama angkatan tidak boleh kosong',
    'any.required': 'Nama angkatan wajib diisi',
  }),
  tahunAngkatan: Joi.number().integer().min(2000).max(2100).required().messages({
    'number.base': 'Tahun angkatan harus berupa angka',
    'number.min': 'Tahun minimal 2000',
    'number.max': 'Tahun maksimal 2100',
    'any.required': 'Tahun angkatan wajib diisi',
  }),
});

function isPrismaUniqueError(err) {
  return err && err.code === 'P2002';
}

exports.list = async (req, res) => {
  try {
    const items = await prisma.angkatan.findMany({
      orderBy: { tahunAngkatan: 'desc' },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('Angkatan list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data angkatan' });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

  try {
    const item = await prisma.angkatan.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Angkatan tidak ditemukan' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Angkatan getById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data angkatan' });
  }
};

exports.create = async (req, res) => {
  const { error, value } = angkatanSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const created = await prisma.angkatan.create({
      data: {
        namaAngkatan: value.namaAngkatan,
        tahunAngkatan: value.tahunAngkatan,
      },
    });
    return res.status(201).json({ success: true, message: 'Angkatan berhasil ditambah', data: created });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({ success: false, message: 'Angkatan dengan tahun ini sudah ada' });
    }
    console.error('Angkatan create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah angkatan' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

  const { error, value } = angkatanSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const updated = await prisma.angkatan.update({
      where: { id },
      data: {
        namaAngkatan: value.namaAngkatan,
        tahunAngkatan: value.tahunAngkatan,
      },
    });
    return res.json({ success: true, message: 'Angkatan berhasil diperbarui', data: updated });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({ success: false, message: 'Angkatan dengan tahun ini sudah ada' });
    }
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Angkatan tidak ditemukan' });
    console.error('Angkatan update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui angkatan' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

  try {
    await prisma.angkatan.delete({ where: { id } });
    return res.json({ success: true, message: 'Angkatan berhasil dihapus' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Angkatan tidak ditemukan' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Tidak dapat dihapus karena masih ada siswa di angkatan ini' });
    console.error('Angkatan delete error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus angkatan' });
  }
};
