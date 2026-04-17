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
        periode: true,
        jurusan: true,
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

exports.bulkGenerate = async (req, res) => {
  const { periodeId, slots } = req.body;
  
  if (!periodeId || !slots || !slots.length) {
    return res.status(400).json({ success: false, message: 'Data periode dan slots diperlukan' });
  }

  try {
    const periode = await prisma.periodeUjian.findUnique({ where: { id: Number(periodeId) } });
    if (!periode) return res.status(404).json({ success: false, message: 'Periode tidak ditemukan' });

    const results = [];
    
    await prisma.$transaction(async (tx) => {
      for (const slot of slots) {
        // slot: { jurusanId, kelasIds: [], mapelId, ruangan, mulai, selesai, durasi, opsiKeamanan }
        const tokenIn = await generateToken();
        const tokenOut = await generateToken();

        const jadwal = await tx.jadwalUjian.create({
          data: {
            nama: periode.nama,
            kategori: 'terjadwal',
            mataPelajaranId: Number(slot.mapelId),
            periodeId: Number(periodeId),
            jurusanId: slot.jurusanId ? Number(slot.jurusanId) : null,
            ruangan: slot.ruangan || null,
            mulai: new Date(slot.mulai),
            selesai: new Date(slot.selesai),
            durasi: Number(slot.durasi),
            token: tokenIn,
            tokenCheckOut: tokenOut,
            guruId: null, // Always true for admin scheduled exams
            opsiKeamanan: Boolean(slot.opsiKeamanan)
          }
        });

        if (slot.kelasIds && slot.kelasIds.length) {
          for (const kelasId of slot.kelasIds) {
             await tx.kelasJadwal.create({
               data: {
                 jadwalUjianId: jadwal.id,
                 kelasId: Number(kelasId)
               }
             });
          }
        }
        results.push(jadwal);
      }
    });

    return res.json({ success: true, message: `${results.length} slot ujian berhasil digenerate`, data: results });
  } catch (error) {
    console.error('Error in bulk generate:', error);
    return res.status(500).json({ success: false, message: 'Gagal menggenerate jadwal' });
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
