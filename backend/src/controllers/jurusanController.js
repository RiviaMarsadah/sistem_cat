const Joi = require('joi');
const prisma = require('../config/prisma');

const jurusanSchema = Joi.object({
  idJurusan: Joi.string().trim().min(1).max(20).required().messages({
    'string.empty': 'ID Jurusan tidak boleh kosong',
    'string.min': 'ID Jurusan minimal 1 karakter',
    'string.max': 'ID Jurusan maksimal 20 karakter',
    'any.required': 'ID Jurusan wajib diisi'
  }),
  nama: Joi.string().trim().min(2).max(100).required(),
});

function isPrismaUniqueError(err) {
  return err && err.code === 'P2002';
}

exports.list = async (req, res) => {
  const items = await prisma.jurusan.findMany({
    orderBy: { nama: 'asc' },
  });

  return res.json({
    success: true,
    data: items,
  });
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const item = await prisma.jurusan.findUnique({ where: { id } });
  if (!item) {
    return res.status(404).json({ success: false, message: 'Jurusan not found' });
  }

  return res.json({ success: true, data: item });
};

exports.create = async (req, res) => {
  const { error, value } = jurusanSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    const created = await prisma.jurusan.create({
      data: { 
        idJurusan: value.idJurusan.trim(),
        nama: value.nama 
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Jurusan created',
      data: created,
    });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      const field = err.meta?.target?.[0];
      if (field === 'id_jurusan') {
        return res.status(409).json({
          success: false,
          message: 'ID Jurusan sudah digunakan',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Nama jurusan sudah ada',
      });
    }
    throw err;
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const { error, value } = jurusanSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    const updated = await prisma.jurusan.update({
      where: { id },
      data: { 
        idJurusan: value.idJurusan.trim(),
        nama: value.nama 
      },
    });

    return res.json({
      success: true,
      message: 'Jurusan updated',
      data: updated,
    });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      const field = err.meta?.target?.[0];
      if (field === 'id_jurusan') {
        return res.status(409).json({
          success: false,
          message: 'ID Jurusan sudah digunakan',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Nama jurusan sudah ada',
      });
    }

    // Prisma throws if not found
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Jurusan not found' });
    }

    throw err;
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  try {
    await prisma.jurusan.delete({ where: { id } });
    return res.json({ success: true, message: 'Jurusan deleted' });
  } catch (err) {
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Jurusan not found' });
    }
    throw err;
  }
};


