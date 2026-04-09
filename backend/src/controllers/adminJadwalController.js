const prisma = require('../config/prisma');

const generateToken = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token;
  let isUnique = false;
  
  while (!isUnique) {
    token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await prisma.jadwalUjian.findFirst({ where: { token } });
    if (!existing) isUnique = true;
  }
  return token;
};

exports.list = async (req, res) => {
  try {
    const jadwal = await prisma.jadwalUjian.findMany({
      where: {
        guruId: null // Hanya mengambil jadwal resmi yang dibuat oleh Admin
      },
      include: {
        mataPelajaran: true,
        paketUjian: true,
        kelasJadwal: {
          include: {
            kelas: {
              include: { jurusan: true }
            }
          }
        }
      },
      orderBy: { mulai: 'desc' }
    });

    return res.json({ success: true, data: jadwal });
  } catch (error) {
    console.error('Error fetching jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal ujian' });
  }
};

exports.create = async (req, res) => {
  const { nama, mataPelajaranId, mulai, selesai, durasi, kelasIds } = req.body;
  
  if (!nama || !mataPelajaranId || !mulai || !selesai || !durasi || !kelasIds || !kelasIds.length) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  }

  try {
    const token = await generateToken();

    const result = await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalUjian.create({
        data: {
          nama,
          mataPelajaranId: Number(mataPelajaranId),
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          durasi: Number(durasi),
          token,
          tokenCheckOut: await generateToken(), // Token keluar
          guruId: null // Dibuat oleh admin
        }
      });

      // Insert pivot kelas
      for (const kelasId of kelasIds) {
        await tx.kelasJadwal.create({
          data: {
            jadwalUjianId: jadwal.id,
            kelasId: Number(kelasId)
          }
        });
      }

      return jadwal;
    });

    return res.json({ success: true, message: 'Jadwal berhasil dibuat', data: result });
  } catch (error) {
    console.error('Error creating jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat jadwal ujian' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, mataPelajaranId, mulai, selesai, durasi, kelasIds } = req.body;
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.jadwalUjian.update({
        where: { id },
        data: {
          nama,
          mataPelajaranId: Number(mataPelajaranId),
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          durasi: Number(durasi)
        }
      });

      // Update kelasIds (hapus yang lama, insert yang baru)
      if (kelasIds && kelasIds.length > 0) {
        await tx.kelasJadwal.deleteMany({
          where: { jadwalUjianId: id }
        });
        for (const kelasId of kelasIds) {
          await tx.kelasJadwal.create({
            data: {
              jadwalUjianId: id,
              kelasId: Number(kelasId)
            }
          });
        }
      }
    });

    return res.json({ success: true, message: 'Jadwal berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal ujian' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.jadwalUjian.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus jadwal ujian' });
  }
};

// API tambahan untuk melihat daftar jadwal berdasarkan mapel agar Admin tahu progress
exports.listAll = async (req, res) => {
   try {
    const jadwal = await prisma.jadwalUjian.findMany({
      include: {
        mataPelajaran: true,
        paketUjian: {
           include: { guru: { include: { user: true } } }
        },
        guru: { include: { user: true } }, // Kalo ujian custom
        kelasJadwal: {
          include: { kelas: true }
        }
      },
      orderBy: { mulai: 'desc' }
    });
    return res.json({ success: true, data: jadwal });
   } catch(e) {
      return res.status(500).json({ success: false, message: 'Error loading all schedules' });
   }
}
