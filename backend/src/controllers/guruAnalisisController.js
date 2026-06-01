const prisma = require('../config/prisma');
const XLSX = require('xlsx');

// 1. Get list of packages that have been used in exams
exports.getAnalyzablePackages = async (req, res) => {
  const guruId = req.guruId;

  try {
    // Find packages that have been used in jadwalUjian with at least one selesai attempt
    // Include both: packages the guru owns, AND packages used in jadwal where guru is the supervisor
    const packages = await prisma.paketUjian.findMany({
      where: {
        OR: [
          { guruId: guruId },
          { jadwalUjian: { some: { guruId: guruId } } }
        ],
        jadwalUjian: {
          some: {
            ujianSiswa: {
              some: { status: 'selesai' }
            }
          }
        }
      },

      include: {
        mataPelajaran: true,
        _count: {
          select: { soalPaket: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: packages });
  } catch (error) {
    console.error('getAnalyzablePackages error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar paket analisis' });
  }
};


// 2. Get detailed analysis per question for a package
exports.getQuestionAnalysis = async (req, res) => {
  const paketId = Number(req.params.id);
  const guruId = req.guruId;

  try {
    // Verify ownership or supervisor access
    const paket = await prisma.paketUjian.findUnique({
      where: { id: paketId },
      include: {
        mataPelajaran: true,
        soalPaket: {
          include: {
            bankSoal: true
          }
        },
        jadwalUjian: {
          select: { guruId: true }
        }
      }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    }

    const isOwner = paket.guruId === guruId;
    const isSupervisor = paket.jadwalUjian.some(j => j.guruId === guruId);

    if (!isOwner && !isSupervisor) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }



    // Get all completed exam attempts for this package
    const examAttempts = await prisma.ujianSiswa.findMany({
      where: {
        jadwalUjian: { paketUjianId: paketId },
        status: 'selesai'
      },
      select: { id: true }
    });

    const attemptIds = examAttempts.map(a => a.id);
    const totalParticipants = attemptIds.length;

    if (totalParticipants === 0) {
      return res.json({ 
        success: true, 
        data: {
          paket,
          totalParticipants: 0,
          analysis: []
        }
      });
    }

    // For each question in the package, calculate stats
    const analysis = await Promise.all(paket.soalPaket.map(async (sp) => {
      const bankSoalId = sp.bankSoalId;

      // Count how many students answered this question (not empty)
      const respondents = await prisma.jawabanSiswa.count({
        where: {
          ujianSiswaId: { in: attemptIds },
          bankSoalId: bankSoalId,
          statusJawaban: { not: 'kosong' }
        }
      });

      // Count correct answers
      const correctAnswers = await prisma.jawabanSiswa.count({
        where: {
          ujianSiswaId: { in: attemptIds },
          bankSoalId: bankSoalId,
          isBenar: true
        }
      });

      // Difficulty evaluation
      const ratio = respondents > 0 ? correctAnswers / respondents : 0;
      let difficulty = 'Sedang';
      if (respondents > 0) {
        if (ratio < 0.3) difficulty = 'Sulit';
        else if (ratio > 0.7) difficulty = 'Mudah';
      } else {
        difficulty = 'N/A';
      }

      return {
        bankSoalId,
        soal: sp.bankSoal.soal,
        kategori: sp.bankSoal.kategoriSoal,
        kolomA: sp.bankSoal.kolomA,
        kolomB: sp.bankSoal.kolomB,
        kolomC: sp.bankSoal.kolomC,
        kolomD: sp.bankSoal.kolomD,
        kolomE: sp.bankSoal.kolomE,
        jawaban: sp.bankSoal.jawaban,
        gambar: sp.bankSoal.gambar,
        respondents,
        correctAnswers,
        ratio: Number((ratio * 100).toFixed(1)),
        difficulty
      };
    }));

    return res.json({
      success: true,
      data: {
        paket: {
          id: paket.id,
          nama: paket.nama,
          mapel: paket.mataPelajaran.namaMapel
        },
        totalParticipants,
        analysis
      }
    });

  } catch (error) {
    console.error('getQuestionAnalysis error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses analisis soal' });
  }
};

// Helper to strip HTML tags from questions
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

exports.exportQuestionAnalysis = async (req, res) => {
  const paketId = Number(req.params.id);
  const guruId = req.guruId;

  try {
    const paket = await prisma.paketUjian.findUnique({
      where: { id: paketId },
      include: {
        mataPelajaran: true,
        soalPaket: {
          include: {
            bankSoal: true
          }
        },
        jadwalUjian: {
          select: { guruId: true }
        }
      }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    }

    const isOwner = paket.guruId === guruId;
    const isSupervisor = paket.jadwalUjian.some(j => j.guruId === guruId);

    if (!isOwner && !isSupervisor) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const examAttempts = await prisma.ujianSiswa.findMany({
      where: {
        jadwalUjian: { paketUjianId: paketId },
        status: 'selesai'
      },
      select: { id: true }
    });

    const attemptIds = examAttempts.map(a => a.id);
    const totalParticipants = attemptIds.length;

    let analysisData = [];

    if (totalParticipants > 0) {
      analysisData = await Promise.all(paket.soalPaket.map(async (sp, idx) => {
        const bankSoalId = sp.bankSoalId;

        const respondents = await prisma.jawabanSiswa.count({
          where: {
            ujianSiswaId: { in: attemptIds },
            bankSoalId: bankSoalId,
            statusJawaban: { not: 'kosong' }
          }
        });

        const correctAnswers = await prisma.jawabanSiswa.count({
          where: {
            ujianSiswaId: { in: attemptIds },
            bankSoalId: bankSoalId,
            isBenar: true
          }
        });

        const ratio = respondents > 0 ? correctAnswers / respondents : 0;
        let difficulty = 'Sedang';
        if (respondents > 0) {
          if (ratio < 0.3) difficulty = 'Sulit';
          else if (ratio > 0.7) difficulty = 'Mudah';
        } else {
          difficulty = 'N/A';
        }

        return {
          'No Soal': idx + 1,
          'Pertanyaan': stripHtml(sp.bankSoal.soal),
          'Kategori Soal': sp.bankSoal.kategoriSoal,
          'Kunci Jawaban': sp.bankSoal.jawaban,
          'Jumlah Responden': respondents,
          'Jawaban Benar': correctAnswers,
          'Persentase Benar (%)': Number((ratio * 100).toFixed(1)),
          'Tingkat Kesulitan': difficulty
        };
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(analysisData.length > 0 ? analysisData : [{
      'No Soal': '-', 'Pertanyaan': 'Tidak ada data peserta selesai', 'Kategori Soal': '-',
      'Kunci Jawaban': '-', 'Jumlah Responden': 0, 'Jawaban Benar': 0, 'Persentase Benar (%)': 0, 'Tingkat Kesulitan': '-'
    }]);

    if (analysisData.length > 0) {
      const max_len = {};
      analysisData.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const val = row[key] ? row[key].toString() : '';
          max_len[key] = Math.max(max_len[key] || 10, val.length);
        });
      });
      const cols = Object.keys(max_len).map((key) => ({ wch: Math.min(50, max_len[key] + 3) }));
      ws['!cols'] = cols;
    }

    XLSX.utils.book_append_sheet(wb, ws, "Analisis Soal");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeFilename = `Analisis_Soal_${paket.nama.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) {
    console.error('exportQuestionAnalysis error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengekspor analisis soal' });
  }
};
