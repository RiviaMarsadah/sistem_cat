const Joi = require('joi');
const prisma = require('../config/prisma');

const tingkatMap = {
  X: '10',
  XI: '11',
  XII: '12',
};

const kelasSchema = Joi.object({
  tingkat: Joi.string().valid('X', 'XI', 'XII').required().messages({
    'any.only': 'Tingkat harus 10/11/12',
    'any.required': 'Tingkat wajib diisi',
  }),
  jurusanId: Joi.number().integer().positive().required().messages({
    'number.base': 'Jurusan wajib dipilih',
    'any.required': 'Jurusan wajib dipilih',
  }),
  inisial: Joi.string().trim().min(1).max(10).pattern(/^[A-Za-z0-9]+$/).required().messages({
    'string.empty': 'Inisial kelas tidak boleh kosong',
    'string.min': 'Inisial kelas minimal 1 karakter',
    'string.max': 'Inisial kelas maksimal 10 karakter',
    'string.pattern.base': 'Inisial kelas hanya boleh huruf/angka (tanpa spasi)',
    'any.required': 'Inisial kelas wajib diisi',
  }),
});

function isPrismaUniqueError(err) {
  return err && err.code === 'P2002';
}

async function buildNamaKelas({ tingkat, jurusanId, inisial }) {
  const jurusan = await prisma.jurusan.findUnique({
    where: { id: jurusanId },
    select: { id: true, idJurusan: true, nama: true },
  });
  if (!jurusan) {
    const e = new Error('Jurusan not found');
    e.statusCode = 400;
    e.publicMessage = 'Jurusan tidak ditemukan';
    throw e;
  }

  const tingkatLabel = tingkatMap[tingkat] || tingkat;
  const inisialUp = String(inisial).trim().toUpperCase();
  const namaKelas = `${tingkatLabel} ${jurusan.idJurusan} ${inisialUp}`.trim();

  return { jurusan, inisialUp, namaKelas };
}

exports.list = async (req, res) => {
  const items = await prisma.kelas.findMany({
    orderBy: [{ tingkat: 'asc' }, { namaKelas: 'asc' }],
    include: {
      jurusan: { select: { id: true, idJurusan: true, nama: true } },
    },
  });

  return res.json({ success: true, data: items });
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const item = await prisma.kelas.findUnique({
    where: { id },
    include: { jurusan: { select: { id: true, idJurusan: true, nama: true } } },
  });
  if (!item) {
    return res.status(404).json({ success: false, message: 'Kelas not found' });
  }

  return res.json({ success: true, data: item });
};

exports.create = async (req, res) => {
  const { error, value } = kelasSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    const { inisialUp, namaKelas } = await buildNamaKelas(value);
    const created = await prisma.kelas.create({
      data: {
        tingkat: value.tingkat,
        jurusanId: value.jurusanId,
        inisial: inisialUp,
        namaKelas,
      },
      include: { jurusan: { select: { id: true, idJurusan: true, nama: true } } },
    });

    return res.status(201).json({
      success: true,
      message: 'Kelas created',
      data: created,
    });
  } catch (err) {
    if (err && err.publicMessage) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.publicMessage });
    }
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({
        success: false,
        message: 'Kelas sudah ada (kombinasi tingkat, jurusan, dan inisial sama)',
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

  const { error, value } = kelasSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    const { inisialUp, namaKelas } = await buildNamaKelas(value);
    const updated = await prisma.kelas.update({
      where: { id },
      data: {
        tingkat: value.tingkat,
        jurusanId: value.jurusanId,
        inisial: inisialUp,
        namaKelas,
      },
      include: { jurusan: { select: { id: true, idJurusan: true, nama: true } } },
    });

    return res.json({
      success: true,
      message: 'Kelas updated',
      data: updated,
    });
  } catch (err) {
    if (err && err.publicMessage) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.publicMessage });
    }
    if (isPrismaUniqueError(err)) {
      return res.status(409).json({
        success: false,
        message: 'Kelas sudah ada (kombinasi tingkat, jurusan, dan inisial sama)',
      });
    }
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kelas not found' });
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
    await prisma.kelas.delete({ where: { id } });
    return res.json({ success: true, message: 'Kelas deleted' });
  } catch (err) {
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kelas not found' });
    }
    // FK constraints (e.g., siswa masih terkait) can be handled here if needed
    throw err;
  }
};




