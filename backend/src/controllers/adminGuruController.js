const Joi = require('joi');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

// Validation schema for creating Guru (includes User data)
const createGuruSchema = Joi.object({
  email: Joi.string().trim().email().max(100).required().messages({
    'string.empty': 'Email tidak boleh kosong',
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().trim().min(6).max(255).allow(null, '').optional(),
  namaLengkap: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nama lengkap tidak boleh kosong',
    'any.required': 'Nama lengkap wajib diisi'
  }),
  nip: Joi.string().trim().max(20).allow(null, '').optional(),
  status: Joi.string().valid('aktif', 'nonaktif').default('aktif')
});

const updateGuruSchema = Joi.object({
  email: Joi.string().trim().email().max(100).optional(),
  password: Joi.string().trim().min(6).max(255).allow(null, '').optional(),
  namaLengkap: Joi.string().trim().min(2).max(100).optional(),
  nip: Joi.string().trim().max(20).allow(null, '').optional(),
  status: Joi.string().valid('aktif', 'nonaktif').optional()
});

exports.list = async (req, res) => {
  try {
    const items = await prisma.guru.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            namaLengkap: true,
            status: true,
            googleLinked: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return res.json({
      success: true,
      data: items
    });
  } catch (err) {
    console.error('Error listing guru:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data guru' });
  }
};

exports.create = async (req, res) => {
  const { error, value } = createGuruSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      let hashedPassword = null;
      if (value.password) {
        hashedPassword = await bcrypt.hash(value.password, 10);
      }

      const user = await tx.user.create({
        data: {
          email: value.email.toLowerCase(),
          password: hashedPassword,
          namaLengkap: value.namaLengkap,
          role: 'guru',
          status: value.status || 'aktif'
        }
      });

      // 2. Create Guru detail
      const guru = await tx.guru.create({
        data: {
          userId: user.id,
          nip: value.nip
        },
        include: {
          user: true
        }
      });

      return guru;
    });

    return res.status(201).json({
      success: true,
      message: 'Data guru berhasil ditambahkan',
      data: result
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email atau NIP sudah terdaftar' });
    }
    console.error('Error creating guru:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data guru' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id); // Ini ID Guru
  const { error, value } = updateGuruSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Check if guru exists
    const existingGuru = await prisma.guru.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingGuru) {
      return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update User data
      const userData = {};
      if (value.email) userData.email = value.email.toLowerCase();
      if (value.namaLengkap) userData.namaLengkap = value.namaLengkap;
      if (value.status) userData.status = value.status;
      if (value.password) {
        userData.password = await bcrypt.hash(value.password, 10);
      }

      await tx.user.update({
        where: { id: existingGuru.userId },
        data: userData
      });

      // Update Guru details
      const guruData = {};
      if (value.nip !== undefined) guruData.nip = value.nip;

      const updatedGuru = await tx.guru.update({
        where: { id },
        data: guruData,
        include: {
          user: true
        }
      });

      return updatedGuru;
    });

    return res.json({
      success: true,
      message: 'Data guru berhasil diperbarui',
      data: result
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email atau NIP sudah digunakan' });
    }
    console.error('Error updating guru:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data guru' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existingGuru = await prisma.guru.findUnique({
      where: { id }
    });

    if (!existingGuru) {
      return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan' });
    }

    await prisma.$transaction(async (tx) => {
      // Cascade delete: Guru and user record
      await tx.user.delete({
        where: { id: existingGuru.userId }
      });
    });

    return res.json({ success: true, message: 'Data guru berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting guru:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data guru' });
  }
};

exports.importGuru = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const { namaLengkap, email, nip } = row;

        if (!email || !namaLengkap) {
          errorCount++;
          continue;
        }

        // Check duplicate email
        const existingUser = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase() }
        });

        if (existingUser) {
          skipCount++;
          continue;
        }

        // Create
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: String(email).toLowerCase(),
              namaLengkap: String(namaLengkap),
              role: 'guru',
              status: 'aktif',
              password: null
            }
          });

          await tx.guru.create({
            data: {
              userId: user.id,
              nip: nip ? String(nip) : null
            }
          });
        });

        successCount++;
      } catch (err) {
        console.error('Error importing row:', err);
        errorCount++;
      }
    }

    return res.json({
      success: true,
      message: `Import selesai: ${successCount} berhasil, ${skipCount} dilewati (email ganda), ${errorCount} gagal.`,
      details: { successCount, skipCount, errorCount }
    });
  } catch (err) {
    console.error('Error processing excel:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses file Excel' });
  }
};
