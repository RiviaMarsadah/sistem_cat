const prisma = require('../config/prisma');
const XLSX = require('xlsx');

// 1. Get list of exams relevant to the teacher
exports.getExams = async (req, res) => {
  const guruId = req.guruId;

  try {
    const exams = await prisma.jadwalUjian.findMany({
      where: {
        OR: [
          { guruId: guruId },
          { paketUjian: { guruId: guruId } }
        ]
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

    return res.json({ success: true, data: exams });
  } catch (error) {
    console.error('getExams error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar ujian' });
  }
};

// 2. Get students and their results for a specific exam and class
exports.getResults = async (req, res) => {
  const { jadwalId, kelasId } = req.query;
  const guruId = req.guruId;

  if (!jadwalId) {
    return res.status(400).json({ success: false, message: 'ID Jadwal wajib diisi' });
  }

  try {
    // Verify teacher has access to this exam
    const exam = await prisma.jadwalUjian.findUnique({
      where: { id: Number(jadwalId) },
      include: { paketUjian: true }
    });

    if (!exam || (exam.guruId !== guruId && exam.paketUjian?.guruId !== guruId)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const whereClause = {
      jadwalUjianId: Number(jadwalId),
    };

    if (kelasId && kelasId !== 'all') {
      whereClause.siswa = {
        kelasId: Number(kelasId)
      };
    }

    const results = await prisma.ujianSiswa.findMany({
      where: whereClause,
      include: {
        siswa: {
          include: {
            kelas: {
              include: { jurusan: true }
            },

            user: {
              select: { namaLengkap: true, email: true }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { nilaiAkhir: 'desc' }
      ]
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat rekap hasil' });
  }
};

exports.exportResults = async (req, res) => {
  const { jadwalId, kelasId } = req.query;
  const guruId = req.guruId;

  if (!jadwalId) {
    return res.status(400).json({ success: false, message: 'ID Jadwal wajib diisi' });
  }

  try {
    const exam = await prisma.jadwalUjian.findUnique({
      where: { id: Number(jadwalId) },
      include: { paketUjian: true }
    });

    if (!exam || (exam.guruId !== guruId && exam.paketUjian?.guruId !== guruId)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const whereClause = {
      jadwalUjianId: Number(jadwalId),
    };

    if (kelasId && kelasId !== 'all') {
      whereClause.siswa = {
        kelasId: Number(kelasId)
      };
    }

    const results = await prisma.ujianSiswa.findMany({
      where: whereClause,
      include: {
        siswa: {
          include: {
            kelas: {
              include: { jurusan: true }
            },
            user: {
              select: { namaLengkap: true, email: true }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { nilaiAkhir: 'desc' }
      ]
    });

    const formattedData = results.map((item, idx) => ({
      'No': idx + 1,
      'Nama Siswa': item.siswa?.user?.namaLengkap || '-',
      'NIS': item.siswa?.nis || '-',
      'NISN': item.siswa?.nisn || '-',
      'Kelas': item.siswa?.kelas?.namaKelas || '-',
      'Benar': item.benar,
      'Salah': item.salah,
      'Kosong': item.kosong,
      'Ragu-ragu': item.raguRagu,
      'Nilai Akhir': Number(item.nilaiAkhir) || 0,
      'Status': item.status === 'selesai' ? 'Selesai' : 'Berlangsung'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);

    const max_len = {};
    formattedData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const val = row[key] ? row[key].toString() : '';
        max_len[key] = Math.max(max_len[key] || 10, val.length);
      });
    });
    const cols = Object.keys(max_len).map((key) => ({ wch: max_len[key] + 3 }));
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Ujian");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeFilename = `Rekap_Ujian_${exam.nama.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) {
    console.error('exportResults error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengekspor rekap hasil' });
  }
};

// 3. Get detailed answers for a specific student's attempt
exports.getDetail = async (req, res) => {
  const ujianSiswaId = Number(req.params.id);
  const guruId = req.guruId;

  try {
    const attempt = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: {
        siswa: {
          include: {
            user: { select: { namaLengkap: true } },
            kelas: {
              include: { jurusan: true }
            }

          }
        },
        jadwalUjian: {
          include: { mataPelajaran: true, paketUjian: true }
        },
        jawabanSiswa: {
          include: { bankSoal: true },
          orderBy: { nomorSoal: 'asc' }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // Verify access
    if (attempt.jadwalUjian.guruId !== guruId && attempt.jadwalUjian.paketUjian?.guruId !== guruId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    return res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('getDetail error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail jawaban' });
  }
};

// 4. Remove a student's result
exports.removeResult = async (req, res) => {
  const ujianSiswaId = Number(req.params.id);
  const guruId = req.guruId;

  try {
    const attempt = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: {
        jadwalUjian: {
          include: { paketUjian: true }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    // Verify access
    if (attempt.jadwalUjian.guruId !== guruId && attempt.jadwalUjian.paketUjian?.guruId !== guruId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Delete associated jawabanSiswa records will be handled by CASCADE in schema if defined, 
    // but let's be safe if it's not.
    // In our schema: model JawabanSiswa has onDelete: Cascade for ujianSiswa.
    
    await prisma.ujianSiswa.delete({
      where: { id: ujianSiswaId }
    });

    return res.json({ success: true, message: 'Hasil ujian siswa berhasil dihapus' });
  } catch (error) {
    console.error('removeResult error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus hasil ujian' });
  }
};
