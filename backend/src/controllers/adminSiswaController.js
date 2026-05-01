const Joi = require('joi');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

// Validation schema for creating Siswa (includes User data)
const createSiswaSchema = Joi.object({
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
  nis: Joi.string().trim().max(20).allow(null, '').optional(),
  nisn: Joi.string().trim().max(20).allow(null, '').optional(),
  kelasId: Joi.number().integer().required().messages({
    'number.base': 'Kelas harus dipilih',
    'any.required': 'Kelas wajib diisi'
  }),
  status: Joi.string().valid('aktif', 'nonaktif').default('aktif'),
  id_angkatan: Joi.number().integer().allow(null).optional(),
  jk: Joi.string().valid('L', 'P').allow(null, '').optional(),
  foto: Joi.string().trim().max(255).allow(null, '').optional(),
  tempat_lahir: Joi.string().trim().max(100).allow(null, '').optional(),
  tgl_lahir: Joi.string().trim().max(20).allow(null, '').optional(),
  agama: Joi.string().trim().max(50).allow(null, '').optional(),
  nohp: Joi.string().trim().max(20).allow(null, '').optional(),
  provinsi: Joi.string().trim().max(100).allow(null, '').optional(),
  kabupaten: Joi.string().trim().max(100).allow(null, '').optional(),
  kecamatan: Joi.string().trim().max(100).allow(null, '').optional(),
  desa: Joi.string().trim().max(100).allow(null, '').optional(),
  alamat: Joi.string().trim().allow(null, '').optional()
});

const updateSiswaSchema = Joi.object({
  email: Joi.string().trim().email().max(100).optional(),
  password: Joi.string().trim().min(6).max(255).allow(null, '').optional(),
  namaLengkap: Joi.string().trim().min(2).max(100).optional(),
  nis: Joi.string().trim().max(20).allow(null, '').optional(),
  nisn: Joi.string().trim().max(20).allow(null, '').optional(),
  kelasId: Joi.number().integer().optional(),
  status: Joi.string().valid('aktif', 'nonaktif').optional(),
  id_angkatan: Joi.number().integer().allow(null).optional(),
  jk: Joi.string().valid('L', 'P').allow(null, '').optional(),
  foto: Joi.string().trim().max(255).allow(null, '').optional(),
  tempat_lahir: Joi.string().trim().max(100).allow(null, '').optional(),
  tgl_lahir: Joi.string().trim().max(20).allow(null, '').optional(),
  agama: Joi.string().trim().max(50).allow(null, '').optional(),
  nohp: Joi.string().trim().max(20).allow(null, '').optional(),
  provinsi: Joi.string().trim().max(100).allow(null, '').optional(),
  kabupaten: Joi.string().trim().max(100).allow(null, '').optional(),
  kecamatan: Joi.string().trim().max(100).allow(null, '').optional(),
  desa: Joi.string().trim().max(100).allow(null, '').optional(),
  alamat: Joi.string().trim().allow(null, '').optional()
});

exports.list = async (req, res) => {
  try {
    const items = await prisma.siswa.findMany({
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
        },
        kelas: true,
        angkatan: true
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
    console.error('Error listing siswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data siswa' });
  }
};

exports.create = async (req, res) => {
  const { error, value } = createSiswaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: value.email.trim().toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
    }

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
          role: 'siswa',
          status: value.status || 'aktif'
        }
      });

      // 2. Create Siswa detail
      const siswa = await tx.siswa.create({
        data: {
          userId: user.id,
          nis: value.nis,
          nisn: value.nisn,
          kelasId: value.kelasId,
          idAngkatan: value.id_angkatan,
          jk: value.jk,
          foto: value.foto,
          tempatLahir: value.tempat_lahir,
          tglLahir: value.tgl_lahir,
          agama: value.agama,
          noHp: value.nohp,
          provinsi: value.provinsi,
          kabupaten: value.kabupaten,
          kecamatan: value.kecamatan,
          desa: value.desa,
          alamat: value.alamat
        },
        include: {
          user: true,
          kelas: true
        }
      });

      return siswa;
    });

    return res.status(201).json({
      success: true,
      message: 'Data siswa berhasil ditambahkan',
      data: result
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email, NIS, atau NISN sudah terdaftar' });
    }
    console.error('Error creating siswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data siswa' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id); // Ini ID Siswa
  const { error, value } = updateSiswaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  try {
    // Check if siswa exists
    const existingSiswa = await prisma.siswa.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingSiswa) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
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
        where: { id: existingSiswa.userId },
        data: userData
      });

      // Update Siswa details
      const siswaData = {};
      if (value.nis !== undefined) siswaData.nis = value.nis;
      if (value.nisn !== undefined) siswaData.nisn = value.nisn;
      if (value.kelasId !== undefined) siswaData.kelasId = value.kelasId;
      if (value.id_angkatan !== undefined) siswaData.idAngkatan = value.id_angkatan;
      if (value.jk !== undefined) siswaData.jk = value.jk;
      if (value.foto !== undefined) siswaData.foto = value.foto;
      if (value.tempat_lahir !== undefined) siswaData.tempatLahir = value.tempat_lahir;
      if (value.tgl_lahir !== undefined) siswaData.tglLahir = value.tgl_lahir;
      if (value.agama !== undefined) siswaData.agama = value.agama;
      if (value.nohp !== undefined) siswaData.noHp = value.nohp;
      if (value.provinsi !== undefined) siswaData.provinsi = value.provinsi;
      if (value.kabupaten !== undefined) siswaData.kabupaten = value.kabupaten;
      if (value.kecamatan !== undefined) siswaData.kecamatan = value.kecamatan;
      if (value.desa !== undefined) siswaData.desa = value.desa;
      if (value.alamat !== undefined) siswaData.alamat = value.alamat;

      const updatedSiswa = await tx.siswa.update({
        where: { id },
        data: siswaData,
        include: {
          user: true,
          kelas: true
        }
      });

      return updatedSiswa;
    });

    return res.json({
      success: true,
      message: 'Data siswa berhasil diperbarui',
      data: result
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email, NIS, atau NISN sudah digunakan' });
    }
    console.error('Error updating siswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existingSiswa = await prisma.siswa.findUnique({
      where: { id }
    });

    if (!existingSiswa) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete Siswa detail first (though onDelete: Cascade on Siswa -> User relationship in schema.prisma might handle this)
      // Actually, in schema.prisma: `siswa Siswa?` in User and `user User @relation(fields: [userId], references: [id], onDelete: Cascade)` in Siswa.
      // If we delete User, Siswa will be deleted. But here we have ID Siswa.
      
      // Better to delete the User which will cascade to Siswa
      await tx.user.delete({
        where: { id: existingSiswa.userId }
      });
    });

    return res.json({ success: true, message: 'Data siswa berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting siswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data siswa' });
  }
};

exports.importSiswa = async (req, res) => {
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
        const { namaLengkap, email, nis, nisn, namaKelas } = row;

        if (!email || !namaLengkap || !namaKelas) {
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

        // Find Kelas
        const kelas = await prisma.kelas.findFirst({
          where: { 
            namaKelas: { 
              equals: String(namaKelas).trim(), 
              // mode: 'insensitive' // Opsional jika MySQL case-insensitive defaultly
            } 
          }
        });

        if (!kelas) {
          errorCount++;
          continue;
        }

        // Create
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: String(email).toLowerCase(),
              namaLengkap: String(namaLengkap),
              role: 'siswa',
              status: 'aktif',
              password: null
            }
          });

          await tx.siswa.create({
            data: {
              userId: user.id,
              nis: nis ? String(nis) : null,
              nisn: nisn ? String(nisn) : null,
              kelasId: kelas.id
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
      message: `Import selesai: ${successCount} berhasil, ${skipCount} dilewati (email ganda), ${errorCount} gagal (data tidak valid/kelas tidak ditemukan).`,
      details: { successCount, skipCount, errorCount }
    });
  } catch (err) {
    console.error('Error processing excel:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses file Excel' });
  }
};
