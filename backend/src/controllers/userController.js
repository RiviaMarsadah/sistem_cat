const Joi = require('joi');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const userSchema = Joi.object({
  email: Joi.string().trim().email().max(100).required().messages({
    'string.empty': 'Email tidak boleh kosong',
    'string.email': 'Format email tidak valid',
    'string.max': 'Email maksimal 100 karakter',
    'any.required': 'Email wajib diisi'
  }),
  password: Joi.string().trim().min(6).max(255).allow(null, '').optional().messages({
    'string.min': 'Password minimal 6 karakter',
    'string.max': 'Password maksimal 255 karakter'
  }),
  role: Joi.string().valid('admin', 'guru', 'siswa').required().messages({
    'any.only': 'Role harus admin, guru, atau siswa',
    'any.required': 'Role wajib diisi'
  }),
  namaLengkap: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Nama lengkap tidak boleh kosong',
    'string.min': 'Nama lengkap minimal 2 karakter',
    'string.max': 'Nama lengkap maksimal 100 karakter',
    'any.required': 'Nama lengkap wajib diisi'
  }),
  status: Joi.string().valid('aktif', 'nonaktif').default('aktif').messages({
    'any.only': 'Status harus aktif atau nonaktif'
  })
});

const userUpdateSchema = Joi.object({
  email: Joi.string().trim().email().max(100).optional(),
  password: Joi.string().trim().min(6).max(255).allow(null, '').optional().messages({
    'string.min': 'Password minimal 6 karakter',
    'string.max': 'Password maksimal 255 karakter'
  }),
  role: Joi.string().valid('admin', 'guru', 'siswa').optional(),
  namaLengkap: Joi.string().trim().min(2).max(100).optional(),
  status: Joi.string().valid('aktif', 'nonaktif').optional()
});

function isPrismaUniqueError(err) {
  return err && err.code === 'P2002';
}

exports.list = async (req, res) => {
  try {
    const items = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        namaLengkap: true,
        status: true,
        googleLinked: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error('Error listing users:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data user',
    });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  try {
    const item = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        namaLengkap: true,
        status: true,
        googleLinked: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Error getting user:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data user',
    });
  }
};

exports.create = async (req, res) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Hash password if provided
    let hashedPassword = null;
    if (value.password && value.password.trim()) {
      hashedPassword = await bcrypt.hash(value.password.trim(), 10);
    }

    const created = await prisma.user.create({
      data: {
        email: value.email.trim().toLowerCase(),
        password: hashedPassword,
        role: value.role,
        namaLengkap: value.namaLengkap.trim(),
        status: value.status || 'aktif',
        googleLinked: false
      },
      select: {
        id: true,
        email: true,
        role: true,
        namaLengkap: true,
        status: true,
        googleLinked: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created',
      data: created,
    });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      const field = err.meta?.target?.[0];
      if (field === 'email') {
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Data sudah ada',
      });
    }
    console.error('Error creating user:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat user',
    });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const { error, value } = userUpdateSchema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Prepare update data
    const updateData = {};
    
    if (value.email !== undefined) {
      updateData.email = value.email.trim().toLowerCase();
    }
    if (value.role !== undefined) {
      updateData.role = value.role;
    }
    if (value.namaLengkap !== undefined) {
      updateData.namaLengkap = value.namaLengkap.trim();
    }
    if (value.status !== undefined) {
      updateData.status = value.status;
    }
    
    // Hash password if provided
    if (value.password !== undefined && value.password !== null && value.password.trim()) {
      updateData.password = await bcrypt.hash(value.password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        namaLengkap: true,
        status: true,
        googleLinked: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      message: 'User updated',
      data: updated,
    });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      const field = err.meta?.target?.[0];
      if (field === 'email') {
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Data sudah ada',
      });
    }

    // Prisma throws if not found
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.error('Error updating user:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengupdate user',
    });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  try {
    // Check if user has relations (guru or siswa)
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        guru: true,
        siswa: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deletion if user has relations
    if (user.guru || user.siswa) {
      return res.status(400).json({
        success: false,
        message: 'User tidak dapat dihapus karena memiliki relasi dengan Guru atau Siswa',
      });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    if (err && err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check for foreign key constraint
    if (err && err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'User tidak dapat dihapus karena memiliki relasi dengan data lain',
      });
    }

    console.error('Error deleting user:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus user',
    });
  }
};

