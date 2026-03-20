const prisma = require('../config/prisma');

function normalizeText(v) {
  return v == null ? '' : String(v).trim();
}

function padTo(list, targetLen, fill = '') {
  if (list.length >= targetLen) return list.slice(0, targetLen);
  return [...list, ...Array.from({ length: targetLen - list.length }, () => fill)];
}

function mapBankSoalToQuestion(bankSoal) {
  const kategori = bankSoal.kategoriSoal;
  const soal = normalizeText(bankSoal.soal);
  const gambar = bankSoal.gambar ? String(bankSoal.gambar).trim() : null;

  const pilihan = {
    A: normalizeText(bankSoal.kolomA),
    B: normalizeText(bankSoal.kolomB),
    C: normalizeText(bankSoal.kolomC),
    D: normalizeText(bankSoal.kolomD),
    E: normalizeText(bankSoal.kolomE),
    F: normalizeText(bankSoal.kolomF),
  };

  // Mobile expects fixed option counts:
  // - Pilgan Sederhana (simple): 5 options (A..E)
  // - Pilgan Kompleks (complex): 6 options (A..F)
  // - Pilgan Kategori (category): 3 statements (A..C)
  if (kategori === 'pilgan') {
    return {
      questionText: soal,
      imageUrl: gambar,
      type: 'simple',
      options: padTo([pilihan.A, pilihan.B, pilihan.C, pilihan.D, pilihan.E], 5, ''),
      correctOption: normalizeText(bankSoal.jawaban),
    };
  }

  if (kategori === 'pilgan_kompleks') {
    return {
      questionText: soal,
      imageUrl: gambar,
      type: 'complex',
      options: padTo([pilihan.A, pilihan.B, pilihan.C, pilihan.D, pilihan.E, pilihan.F], 6, ''),
      correctOption: normalizeText(bankSoal.jawaban),
    };
  }

  // pilgan_kategori
  return {
    questionText: soal || 'Pilih Benar/Salah untuk pernyataan berikut.',
    imageUrl: null,
    type: 'category',
    options: padTo([pilihan.A, pilihan.B, pilihan.C], 3, ''),
    correctOption: normalizeText(bankSoal.jawaban),
  };
}

exports.getPaketUjianByTokenCheckIn = async (req, res) => {
  const tokenCheckIn = String(req.query.tokenCheckIn || '').trim();
  if (!tokenCheckIn || tokenCheckIn.length !== 6) {
    return res.status(400).json({ success: false, message: 'tokenCheckIn wajib 6 digit/karakter' });
  }

  try {
    const paketUjian = await prisma.paketUjian.findFirst({
      where: { tokenCheckIn },
      include: {
        mataPelajaran: { select: { id: true, namaMapel: true, kodeMapel: true } },
        soalPaket: {
          include: {
            bankSoal: {
              select: {
                id: true,
                soal: true,
                kategoriSoal: true,
                jawaban: true,
                gambar: true,
                kolomA: true,
                kolomB: true,
                kolomC: true,
                kolomD: true,
                kolomE: true,
                kolomF: true,
              },
            },
          },
        },
      },
    });

    if (!paketUjian) {
      return res.status(404).json({ success: false, message: 'Paket ujian tidak ditemukan untuk token tersebut' });
    }

    // Preserve stable order by soalPaket id ascending.
    const soal = (paketUjian.soalPaket || [])
      .slice()
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
      .map((sp) => sp.bankSoal)
      .filter(Boolean)
      .map(mapBankSoalToQuestion);

    return res.json({
      success: true,
      data: {
        paketUjian: {
          id: paketUjian.id,
          nama: paketUjian.nama,
          mataPelajaran: paketUjian.mataPelajaran,
          tingkat: paketUjian.tingkat,
          tipeUjian: paketUjian.tipeUjian,
        },
        soal,
        totalQuestions: soal.length,
      },
    });
  } catch (err) {
    console.error('siswaPaketUjian getByTokenCheckIn error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat paket ujian' });
  }
};

