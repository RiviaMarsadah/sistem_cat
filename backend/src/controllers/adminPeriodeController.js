const prisma = require('../config/prisma');

exports.list = async (req, res) => {
  try {
    const periode = await prisma.periodeUjian.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jadwalUjians: true }
        }
      }
    });
    res.json({ success: true, data: periode });
  } catch (error) {
    console.error('Error fetching periode:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat list periode' });
  }
};

exports.create = async (req, res) => {
  const { nama, mulai, selesai, semester, tahunAjaran } = req.body;
  const adminId = req.user?.userId;
  
  if (!nama || !mulai || !selesai || !semester || !tahunAjaran) {
     return res.status(400).json({ success: false, message: 'Semua field periode wajib diisi' });
  }

  try {
    const periode = await prisma.periodeUjian.create({
      data: { 
        nama, 
        mulai: new Date(mulai), 
        selesai: new Date(selesai), 
        semester, 
        tahunAjaran, 
        createdBy: adminId 
      }
    });
    res.json({ success: true, message: 'Periode Ujian berhasil dibuat', data: periode });
  } catch (error) {
    console.error('Error creating periode:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat periode ujian' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.periodeUjian.delete({ where: { id }});
    res.json({ success: true, message: 'Periode ujian dihapus' });
  } catch(error) {
    console.error('Error deleting periode:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus periode ujian' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, mulai, selesai, semester, tahunAjaran } = req.body;
  
  if (!nama || !mulai || !selesai || !semester || !tahunAjaran) {
     return res.status(400).json({ success: false, message: 'Semua field periode wajib diisi' });
  }

  try {
    const periode = await prisma.periodeUjian.update({
      where: { id },
      data: { 
        nama, 
        mulai: new Date(mulai), 
        selesai: new Date(selesai), 
        semester, 
        tahunAjaran 
      }
    });

    // Update names of existing official scheduled exams under this period to sync
    await prisma.jadwalUjian.updateMany({
       where: { periodeId: id, kategori: 'terjadwal' },
       data: { nama }
    });

    res.json({ success: true, message: 'Periode Ujian berhasil diperbarui', data: periode });
  } catch (error) {
    console.error('Error updating periode:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui periode ujian' });
  }
};
