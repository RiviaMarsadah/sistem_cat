const prisma = require('../config/prisma');

// 1. Jadwal Ujian Guru (Official and Custom)
exports.listAllJadwal = async (req, res) => {
  try {
    const jadwal = await prisma.jadwalUjian.findMany({
      include: {
        mataPelajaran: true,
        paketUjian: {
          include: { guru: { include: { user: true } } }
        },
        periode: true,
        guru: { include: { user: true } },
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
    console.error('Error fetching all guru jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat semua jadwal ujian' });
  }
};

// 2. Bank Soal Guru (All Collections)
exports.listAllBankSoal = async (req, res) => {
  try {
    const collections = await prisma.bankSoalKoleksi.findMany({
      include: {
        mataPelajaran: true,
        jurusan: true,
        guru: { include: { user: true } },
        _count: { select: { bankSoal: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: collections });
  } catch (error) {
    console.error('Error listing all bank soal collections:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat bank soal guru' });
  }
};

// 3. Bank Soal Detail (All Questions inside a collection)
exports.getBankSoalDetail = async (req, res) => {
  const collectionId = Number(req.params.id);
  try {
    const collection = await prisma.bankSoalKoleksi.findUnique({
      where: { id: collectionId },
      include: {
        mataPelajaran: true,
        jurusan: true,
        guru: { include: { user: true } },
        bankSoal: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Koleksi bank soal tidak ditemukan' });
    }
    return res.json({ success: true, data: collection });
  } catch (error) {
    console.error('Error fetching bank soal detail:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail bank soal' });
  }
};

// 4. Paket Ujian Guru (All packages)
exports.listAllPaket = async (req, res) => {
  try {
    const packages = await prisma.paketUjian.findMany({
      include: {
        mataPelajaran: true,
        guru: { include: { user: true } },
        soalPaket: {
          include: {
            bankSoal: {
              include: {
                mataPelajaran: true
              }
            }
          }
        },
        _count: { select: { soalPaket: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error listing all packages:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat paket ujian guru' });
  }
};

// 5. Rekap Ujian (Daftar Ujian dengan Attempt siswa)
exports.listAllRekapJadwal = async (req, res) => {
  try {
    const exams = await prisma.jadwalUjian.findMany({
      include: {
        mataPelajaran: true,
        paketUjian: {
          include: {
            guru: {
              include: { user: true }
            }
          }
        },
        guru: { include: { user: true } },
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
    console.error('Error fetching rekap jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar rekap ujian' });
  }
};

// 6. Rekap Hasil Ujian (Scores and Statuses)
exports.listAllResults = async (req, res) => {
  const { jadwalId, kelasId } = req.query;
  if (!jadwalId) {
    return res.status(400).json({ success: false, message: 'ID Jadwal wajib diisi' });
  }

  try {
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
    console.error('Error loading all results:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat rekap hasil' });
  }
};

// 7. Exam Attempt Review Detail (Student's selected answers breakdown)
exports.getExamDetail = async (req, res) => {
  const ujianSiswaId = Number(req.params.id);
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
          include: { 
            mataPelajaran: true, 
            paketUjian: true,
            guru: { include: { user: true } }
          }
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

    return res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('Error fetching result detail:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail jawaban' });
  }
};

// 8. list all analyzable packages
exports.listAllAnalisisPaket = async (req, res) => {
  try {
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
        guru: { include: { user: true } },
        _count: {
          select: { soalPaket: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error listing all analyzable packages:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar paket analisis' });
  }
};

// 9. detailed question difficulty analytics for any package
exports.getQuestionAnalysis = async (req, res) => {
  const paketId = Number(req.params.id);
  try {
    const paket = await prisma.paketUjian.findUnique({
      where: { id: paketId },
      include: {
        mataPelajaran: true,
        guru: { include: { user: true } },
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
          paket: {
            id: paket.id,
            nama: paket.nama,
            mapel: paket.mataPelajaran.namaMapel,
            guru: paket.guru?.user?.namaLengkap || 'Admin'
          },
          totalParticipants: 0,
          analysis: []
        }
      });
    }

    const analysis = await Promise.all(paket.soalPaket.map(async (sp) => {
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
          mapel: paket.mataPelajaran.namaMapel,
          guru: paket.guru?.user?.namaLengkap || 'Admin'
        },
        totalParticipants,
        analysis
      }
    });

  } catch (error) {
    console.error('Error fetching question analysis:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses analisis soal' });
  }
};
