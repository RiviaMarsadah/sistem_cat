const prisma = require('../config/prisma');

/**
 * 1. Pencarian Real-time Data Siswa (Nama, Email, NIS, NISN, Kelas)
 * Akses Publik
 */
exports.searchRealtime = async (req, res) => {
  const { q } = req.query;

  try {
    let whereCondition = {
      kelas: { tingkat: { in: ['X', 'XI', 'XII'] } }
    };

    // Jika kata kunci pencarian disediakan, cari berdasarkan semua field di atas
    if (q && q.trim()) {
      const searchVal = q.trim();
      whereCondition = {
        AND: [
          { kelas: { tingkat: { in: ['X', 'XI', 'XII'] } } },
          {
            OR: [
              { user: { namaLengkap: { contains: searchVal } } },
              { user: { email: { contains: searchVal } } },
              { nis: { contains: searchVal } },
              { nisn: { contains: searchVal } },
              { kelas: { namaKelas: { contains: searchVal } } },
              { kelas: { inisial: { contains: searchVal } } },
              { kelas: { jurusan: { namaProdi: { contains: searchVal } } } }
            ]
          }
        ]
      };
    }

    // Ambil data siswa dengan limit maksimal 50 pencocokan agar responsif
    const listSiswa = await prisma.siswa.findMany({
      where: whereCondition,
      take: 50,
      include: {
        user: {
          select: {
            namaLengkap: true,
            email: true
          }
        },
        kelas: {
          include: {
            jurusan: true
          }
        }
      },
      orderBy: {
        user: {
          namaLengkap: 'asc'
        }
      }
    });

    // Petakan ke struktur data yang rapi dan aman (tanpa password/id sensitif)
    const formatted = listSiswa.map(s => {
      const tingkat = s.kelas ? s.kelas.tingkat : '';
      const prodi = s.kelas && s.kelas.jurusan ? s.kelas.jurusan.namaProdi : '';
      const inisial = s.kelas ? s.kelas.inisial : '';
      
      const showInisial = inisial && 
        inisial.toLowerCase() !== tingkat.toLowerCase() &&
        !['x', 'xi', 'xii'].includes(inisial.toLowerCase());

      const kelasLengkap = `${tingkat} ${prodi} ${showInisial ? inisial : ''}`.replace(/\s+/g, ' ').trim();

      return {
        id: s.id,
        namaLengkap: s.user ? s.user.namaLengkap : '',
        email: s.user ? s.user.email : '',
        nis: s.nis || '-',
        nisn: s.nisn || '-',
        kelas: kelasLengkap || 'Belum diatur'
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    console.error('Error realtime search:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mencari data siswa'
    });
  }
};

/**
 * 2. Update NIS dan NISN Siswa Mandiri
 * Akses Publik
 */
exports.updateNisNisn = async (req, res) => {
  const { id } = req.params;
  const { nis, nisn } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID Siswa tidak valid.'
    });
  }

  try {
    // Cari siswa terlebih dahulu
    const siswaExist = await prisma.siswa.findUnique({
      where: { id: parseInt(id) }
    });

    if (!siswaExist) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan.'
      });
    }

    // Helper format untuk memastikan string seperti "0" atau "0023" disimpan sempurna
    const formatStringValue = (val) => {
      if (val === undefined || val === null) return null;
      const trimmed = String(val).trim();
      return trimmed !== '' ? trimmed : null;
    };

    // Lakukan update data NIS dan NISN
    const updatedSiswa = await prisma.siswa.update({
      where: { id: parseInt(id) },
      data: {
        nis: formatStringValue(nis),
        nisn: formatStringValue(nisn)
      }
    });

    return res.json({
      success: true,
      message: 'Data NIS/NISN berhasil diperbarui!',
      data: {
        id: updatedSiswa.id,
        nis: updatedSiswa.nis || '-',
        nisn: updatedSiswa.nisn || '-'
      }
    });
  } catch (err) {
    console.error('Error update NIS/NISN:', err);
    
    // Tangani Unique Constraint Error di MySQL (P2002)
    if (err.code === 'P2002') {
      const field = err.meta?.target || 'NIS/NISN';
      return res.status(400).json({
        success: false,
        message: `Gagal menyimpan! Nomor ${field.includes('nisn') ? 'NISN' : 'NIS'} sudah digunakan oleh siswa lain.`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat memperbarui data NIS/NISN.'
    });
  }
};
