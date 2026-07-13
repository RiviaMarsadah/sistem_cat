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

// 1. Get List Jadwal Resmi Admin
// Menampilkan jadwal yang guruId = null. Jika sudah diisi oleh guru lain,
// mungkin bisa disable di UI. Tapi sementara beri saja semua official.
exports.listOfficial = async (req, res) => {
  try {
    const jadwal = await prisma.jadwalUjian.findMany({
      where: { 
        guruId: null,
        periodeId: { not: null }
      },
      include: {
        mataPelajaran: true,
        paketUjian: {
          include: { guru: { include: { user: true } } }
        },
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
    console.error('Error fetching official jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal resmi' });
  }
};

// 2. Set Paket Soal untuk Jadwal Admin
exports.setPaket = async (req, res) => {
  const jadwalId = Number(req.params.id);
  const { paketUjianId } = req.body;
  const guruId = req.guruId;
  
  try {
    const paket = await prisma.paketUjian.findUnique({
      where: { id: Number(paketUjianId) }
    });
    
    const mapels = await prisma.mataPelajaran.findMany({
      where: {
        OR: [
          { paketUjian: { some: { guruId } } },
          { bankSoal: { some: { guruId } } },
          { bankSoalKoleksis: { some: { guruId } } },
          { jadwalUjians: { some: { guruId } } },
        ]
      },
      select: { id: true }
    });
    const mapelIds = mapels.map(m => m.id);

    if (!paket || (paket.guruId !== guruId && !mapelIds.includes(paket.mataPelajaranId))) {
      return res.status(403).json({ success: false, message: 'Paket soal tidak valid atau Anda tidak memiliki akses' });
    }

    const jadwal = await prisma.jadwalUjian.findUnique({ where: { id: jadwalId } });
    if (!jadwal || jadwal.guruId !== null) {
      return res.status(400).json({ success: false, message: 'Jadwal tidak valid atau bukan jadwal resmi' });
    }
    
    // Pastikan jadwal belum dikerjakan siswa (contoh sederhana pengecekan: belum lewat waktu atau tidak ada record ujian)
    const activeExams = await prisma.ujianSiswa.count({ where: { jadwalUjianId: jadwalId } });
    if (activeExams > 0 && jadwal.paketUjianId !== null && jadwal.paketUjianId !== paket.id) {
       return res.status(400).json({ success: false, message: 'Ujian sudah/sedang berlangsung, tidak bisa ubah paket soal' });
    }

    const updated = await prisma.jadwalUjian.update({
      where: { id: jadwalId },
      data: { paketUjianId: Number(paketUjianId) }
    });

    return res.json({ success: true, message: 'Paket ujian berhasil dipasang', data: updated });
  } catch (error) {
    console.error('Error setting paket:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengatur paket ujian' });
  }
};

// 3. Hapus Paket dari Jadwal Resmi
exports.removePaket = async (req, res) => {
  const jadwalId = Number(req.params.id);
  const guruId = req.guruId;

  try {
    const jadwal = await prisma.jadwalUjian.findUnique({
       where: { id: jadwalId },
       include: { paketUjian: true }
    });

    const mapels = await prisma.mataPelajaran.findMany({
      where: {
        OR: [
          { paketUjian: { some: { guruId } } },
          { bankSoal: { some: { guruId } } },
          { bankSoalKoleksis: { some: { guruId } } },
          { jadwalUjians: { some: { guruId } } },
        ]
      },
      select: { id: true }
    });
    const mapelIds = mapels.map(m => m.id);

    if (!jadwal || (jadwal.paketUjian?.guruId !== guruId && !mapelIds.includes(jadwal.paketUjian?.mataPelajaranId))) {
      return res.status(403).json({ success: false, message: 'Hanya bisa menghapus paket dari mata pelajaran Anda' });
    }

    const activeExams = await prisma.ujianSiswa.count({ where: { jadwalUjianId: jadwalId } });
    if (activeExams > 0) {
       return res.status(400).json({ success: false, message: 'Ujian sudah dimulai, paket tidak bisa dilepas' });
    }

    await prisma.jadwalUjian.update({
      where: { id: jadwalId },
      data: { paketUjianId: null }
    });

    return res.json({ success: true, message: 'Paket ujian berhasil dilepas' });
  } catch(error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Gagal melepas paket ujian' });
  }
};


// 4. Daftar Ujian Custom (Milikan Guru Tersebut)
exports.listCustom = async (req, res) => {
  const guruId = req.guruId;
  try {
    const jadwal = await prisma.jadwalUjian.findMany({
      where: { guruId: guruId },
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
    console.error('Error fetching custom jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal custom' });
  }
};

// 5. Create Ujian Custom
exports.createCustom = async (req, res) => {
  const guruId = req.guruId;
  const { nama, mataPelajaranId, paketUjianId, mulai, selesai, durasi, opsiKeamanan, kelasIds } = req.body;
  
  if (!nama || !paketUjianId || !mataPelajaranId || !mulai || !selesai || !durasi || !kelasIds || !kelasIds.length) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  try {
    const token = await generateToken();

    const result = await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalUjian.create({
        data: {
          nama: nama,
          kategori: 'custom',
          mataPelajaranId: Number(mataPelajaranId),
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          durasi: Number(durasi),
          token,
          tokenCheckOut: await generateToken(), // Token keluar khusus custom exam
          paketUjianId: Number(paketUjianId),
          guruId: guruId,
          opsiKeamanan: Boolean(opsiKeamanan)
        }
      });

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

    return res.json({ success: true, message: 'Ujian Custom berhasil dibuat', data: result });
  } catch (error) {
    console.error('Error creating custom jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat ujian custom' });
  }
};

// 6. Update Ujian Custom
exports.updateCustom = async (req, res) => {
  const id = Number(req.params.id);
  const guruId = req.guruId;
  const { nama, mataPelajaranId, paketUjianId, mulai, selesai, durasi, opsiKeamanan, kelasIds } = req.body;

  try {
    const existing = await prisma.jadwalUjian.findUnique({ where: { id } });
    if (!existing || existing.guruId !== guruId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak untuk mengubah jadwal ini' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.jadwalUjian.update({
        where: { id },
        data: {
          nama: nama,
          kategori: 'custom',
          mataPelajaranId: Number(mataPelajaranId),
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          durasi: Number(durasi),
          paketUjianId: Number(paketUjianId),
          opsiKeamanan: Boolean(opsiKeamanan)
        }
      });

      if (kelasIds && kelasIds.length > 0) {
        await tx.kelasJadwal.deleteMany({ where: { jadwalUjianId: id } });
        for (const kelasId of kelasIds) {
          await tx.kelasJadwal.create({
            data: {
              jadwalUjianId: id,
              kelasId: Number(kelasId)
            }
          });
        }
      }

      return updated;
    });

    return res.json({ success: true, message: 'Ujian Custom berhasil diperbarui', data: result });
  } catch (error) {
    console.error('Error updating custom jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui ujian custom' });
  }
};

// 7. Delete Custom Exam
exports.removeCustom = async (req, res) => {
  const id = Number(req.params.id);
  const guruId = req.guruId;

  try {
     const jadwal = await prisma.jadwalUjian.findUnique({ where: { id } });
     if (!jadwal || jadwal.guruId !== guruId) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak untuk menghapus jadwal ini' });
     }
     await prisma.jadwalUjian.delete({ where: { id } });
     return res.json({ success: true, message: 'Ujian Custom berhasil dihapus' });
  } catch(error) {
     return res.status(500).json({ success: false, message: 'Gagal menghapus ujian custom' });
  }
}
