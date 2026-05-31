const prisma = require('../config/prisma');

// 1. Get list of packages that have been used in exams
exports.getAnalyzablePackages = async (req, res) => {
  const guruId = req.guruId;

  try {
    // Find packages that have been used in jadwalUjian with at least one selesai attempt
    // Include both: packages the guru owns, AND packages used in jadwal where guru is the supervisor
    const packages = await prisma.paketUjian.findMany({
      where: {
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
    // Verify ownership
    const paket = await prisma.paketUjian.findUnique({
      where: { id: paketId },
      include: {
        mataPelajaran: true,
        soalPaket: {
          include: {
            bankSoal: true
          }
        }
      }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
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
