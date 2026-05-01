const prisma = require('../config/prisma');

// Utils
function normalizeAnswer(v) {
  return (v || '').toString().trim().toUpperCase();
}

function normalizeMulti(v) {
  const parts = normalizeAnswer(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const uniq = [...new Set(parts)];
  uniq.sort();
  return uniq.join(',');
}

function getStatusFromAnswer(raw, fallbackStatus) {
  if (fallbackStatus && ['dijawab', 'kosong', 'ragu_ragu'].includes(fallbackStatus)) return fallbackStatus;
  const n = normalizeAnswer(raw);
  if (!n) return 'kosong';
  return 'dijawab';
}

function scoreByType(tipeSoal, kunci, jawaban) {
  const k = normalizeAnswer(kunci);
  const j = normalizeAnswer(jawaban);

  if (!j) return { isBenar: false, skorItem: 0 };

  if (tipeSoal === 'pilgan') {
    return { isBenar: k === j, skorItem: k === j ? 1 : 0 };
  }

  if (tipeSoal === 'pilgan_kompleks') {
    const kk = normalizeMulti(k);
    const jj = normalizeMulti(j);
    return { isBenar: kk === jj, skorItem: kk === jj ? 1 : 0 };
  }

  // pilgan_kategori (B/S comma separated)
  const kk = normalizeMulti(k);
  const jj = normalizeMulti(j);
  return { isBenar: kk === jj, skorItem: kk === jj ? 1 : 0 };
}

function seededShuffle(items, seed) {
  const arr = [...items];
  let state = seed >>> 0;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000; //4.294.967.296
  };

  for (let i = arr.length - 1; i > 0; i--) { //fisher yates shuffle algoritma
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mapBankSoalToQuestion(bankSoal, nomorSoal, jawaban) {
  const pick = (v) => (v == null ? '' : String(v).trim());

  const kategori = bankSoal.kategoriSoal;
  const soal = pick(bankSoal.soal);
  const gambar = bankSoal.gambar ? String(bankSoal.gambar).trim() : null;
  const pilihan = [pick(bankSoal.kolomA), pick(bankSoal.kolomB), pick(bankSoal.kolomC), pick(bankSoal.kolomD), pick(bankSoal.kolomE), pick(bankSoal.kolomF)];

  let type = 'simple';
  let options = pilihan.slice(0, 5);
  if (kategori === 'pilgan_kompleks') {
    type = 'complex';
    options = pilihan.slice(0, 6);
  } else if (kategori === 'pilgan_kategori') {
    type = 'category';
    options = pilihan.slice(0, 3);
  }

  return {
    bankSoalId: bankSoal.id,
    nomorSoal,
    questionText: soal || (type === 'category' ? 'Pilih Benar/Salah untuk pernyataan berikut.' : ''),
    imageUrl: gambar,
    type,
    options,
    // Kita hide correctOption di sisi klien saat sedang berlangsung ujian!
    correctOption: null, 
    jawabanSiswa: jawaban?.jawabanSiswa ?? null,
    statusJawaban: jawaban?.statusJawaban ?? 'kosong',
  };
}


// --- EXPORTS ---

// Untuk nge-cek jadwal dengan token 
exports.getJadwalByToken = async (req, res) => {
  const token = String(req.query.token || '').trim().toUpperCase();
  const siswa = req.user.siswa; // Dari resolveSiswa

  if (!token || token.length !== 6) {
    return res.status(400).json({ success: false, message: 'Token ujian wajib 6 digit kapital.' });
  }

  try {
    const jadwal = await prisma.jadwalUjian.findFirst({
      where: { token },
      include: {
        mataPelajaran: true,
        paketUjian: true,
        kelasJadwal: true
      }
    });

    if (!jadwal) {
      return res.status(404).json({ success: false, message: 'Jadwal ujian tidak ditemukan.' });
    }

    // 1. Cek Kelas
    if (siswa.kelasId) {
      const isEligible = jadwal.kelasJadwal.some(kj => kj.kelasId === siswa.kelasId);
      if (!isEligible) {
         return res.status(403).json({ success: false, message: 'Kelas Anda tidak terdaftar dalam jadwal ujian ini.' });
      }
    }

    // 2. Cek apakah Guru sudah memasukkan Paket
    if (!jadwal.paketUjianId) {
      return res.status(400).json({ success: false, message: 'Soal untuk ujian ini belum disiapkan oleh guru.'});
    }

    // 3. Cek Rentang Waktu (opsional jika mobile mengatur ketat)
    const now = new Date();
    if (now < jadwal.mulai) {
       return res.status(400).json({ success: false, message: 'Ujian belum dimulai.' });
    }
    if (now > jadwal.selesai) {
       return res.status(400).json({ success: false, message: 'Ujian telah berakhir.' });
    }

    return res.json({
       success: true,
       data: {
          id: jadwal.id,
          nama: jadwal.nama,
          durasi: jadwal.durasi,
          mulai: jadwal.mulai,
          selesai: jadwal.selesai,
          opsiKeamanan: jadwal.opsiKeamanan,
          mataPelajaran: jadwal.mataPelajaran.namaMapel,
          paketUjian: jadwal.paketUjian.nama,
          tipeUjian: jadwal.paketUjian.tipeUjian
       }
    });

  } catch(error) {
    console.error('getJadwalByToken error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
  }
};


exports.mulaiUjian = async (req, res) => {
  const siswaId = req.siswaId;
  const token = String(req.body?.token || '').trim().toUpperCase();

  try {
    const jadwal = await prisma.jadwalUjian.findFirst({
      where: { token },
      include: {
         paketUjian: {
            include: {
               soalPaket: {
                  include: { bankSoal: true }
               }
            }
         }
      }
    });

    if (!jadwal || !jadwal.paketUjianId) {
       return res.status(404).json({ success: false, message: 'Jadwal/Paket ujian tidak valid.' });
    }

    const existing = await prisma.ujianSiswa.findUnique({
      where: { siswaId_jadwalUjianId: { siswaId, jadwalUjianId: jadwal.id } },
      include: {
        jawabanSiswa: { include: { bankSoal: true }, orderBy: { nomorSoal: 'asc' } },
      },
    });

    if (existing && existing.status === 'selesai') {
      return res.status(400).json({
         success: false, message: `Anda sudah mengerjakannya dan telah selesai ujian ini.`
      });
    }

    let ujian = existing;

    if (!ujian) {
      const seed = Math.floor(Math.random() * 1000000000);
      const shuffled = seededShuffle(jadwal.paketUjian.soalPaket, seed);

      ujian = await prisma.ujianSiswa.create({
        data: {
          siswaId,
          jadwalUjianId: jadwal.id,
          status: 'berlangsung',
          randomSeed: seed,
          totalSoal: shuffled.length,
          jawabanSiswa: {
            create: shuffled.map((sp, idx) => ({
              bankSoalId: sp.bankSoalId,
              nomorSoal: idx + 1,
              tipeSoal: sp.bankSoal.kategoriSoal,
              statusJawaban: 'kosong',
            })),
          },
        },
        include: {
          jawabanSiswa: { include: { bankSoal: true }, orderBy: { nomorSoal: 'asc' } },
        },
      });
    }

    const soal = ujian.jawabanSiswa.map((j) => mapBankSoalToQuestion(j.bankSoal, j.nomorSoal, j));

    return res.json({
      success: true,
      data: {
        ujianSiswaId: ujian.id,
        status: ujian.status,
        mulaiPada: ujian.mulaiPada, // Ditambahkan untuk timer
        jadwalUjian: {
           id: jadwal.id,
           nama: jadwal.nama,
           durasi: jadwal.durasi,
           selesai: jadwal.selesai,
           opsiKeamanan: jadwal.opsiKeamanan
        },
        soal,
        totalQuestions: soal.length,
      },
    });
  } catch(err) {
    console.error('siswaUjian mulaiUjian error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memulai ujian' });
  }
};


exports.getUjianAktif = async (req, res) => {
  const siswaId = req.siswaId;

  try {
    const ujian = await prisma.ujianSiswa.findFirst({
      where: { siswaId, status: 'berlangsung' },
      include: {
        jadwalUjian: { include: { mataPelajaran: true } },
        jawabanSiswa: {
          include: { bankSoal: true },
          orderBy: { nomorSoal: 'asc' },
        },
      },
    });

    if (!ujian) {
      return res.json({ success: true, data: null, message: 'Tidak ada ujian aktif' });
    }

    const soal = ujian.jawabanSiswa.map((j) => mapBankSoalToQuestion(j.bankSoal, j.nomorSoal, j));

    return res.json({
      success: true,
      data: {
        ujianSiswaId: ujian.id,
        status: ujian.status,
        mulaiPada: ujian.mulaiPada, // Ditambahkan untuk timer
        jadwalUjian: {
          id: ujian.jadwalUjian.id,
          nama: ujian.jadwalUjian.nama,
          durasi: ujian.jadwalUjian.durasi,
          selesai: ujian.jadwalUjian.selesai,
          opsiKeamanan: ujian.jadwalUjian.opsiKeamanan,
          mataPelajaran: ujian.jadwalUjian.mataPelajaran,
        },
        soal,
        totalQuestions: soal.length,
      },
    });
  } catch (err) {
    console.error('siswaUjian getUjianAktif error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengecek ujian aktif' });
  }
};

exports.saveProgress = async (req, res) => {
  const siswaId = req.siswaId;
  const ujianSiswaId = Number(req.params.ujianSiswaId);
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  try {
    const ujian = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: { jawabanSiswa: true },
    });

    if (!ujian || ujian.siswaId !== siswaId || ujian.status !== 'berlangsung') {
      return res.status(404).json({ success: false, message: 'Sesi ujian tidak valid atau sudah selesai' });
    }

    const answerMap = new Map();
    for (const a of answers) {
      const key = Number(a?.bankSoalId);
      answerMap.set(key, { jawabanSiswa: a?.jawabanSiswa ?? '', statusJawaban: a?.statusJawaban });
    }

    const updates = [];
    ujian.jawabanSiswa.forEach((row) => {
      const incoming = answerMap.get(row.bankSoalId);
      if (incoming) {
        const statusJawaban = getStatusFromAnswer(incoming.jawabanSiswa, incoming.statusJawaban);
        updates.push(prisma.jawabanSiswa.update({
          where: { id: row.id },
          data: {
            jawabanSiswa: incoming.jawabanSiswa ? String(incoming.jawabanSiswa) : null,
            statusJawaban,
          },
        }));
      }
    });

    if (updates.length > 0) await prisma.$transaction(updates);

    return res.json({ success: true, message: 'Progress berhasil disimpan' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan progress ujian' });
  }
};


exports.submitUjian = async (req, res) => {
  const siswaId = req.siswaId;
  const ujianSiswaId = Number(req.params.ujianSiswaId);
  const tokenCheckOut = String(req.body?.tokenCheckOut || '').trim().toUpperCase();
  const isTimeUp = req.body?.isTimeUp === true;
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  if (!isTimeUp && (!tokenCheckOut || tokenCheckOut.length !== 6)) {
    return res.status(400).json({ success: false, message: 'Token Checkout wajib 6 karakter.' });
  }

  try {
    const ujian = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: { 
         jawabanSiswa: { include: { bankSoal: true } },
         jadwalUjian: { 
           select: { 
             tokenCheckOut: true,
             mulai: true,
             durasi: true,
             selesai: true
           } 
         }
      },
    });

    if (!ujian || ujian.siswaId !== siswaId || ujian.status === 'selesai') {
      return res.status(404).json({ success: false, message: 'Sesi ujian tidak valid atau sudah disubmit.' });
    }

    // Verifikasi Token atau Timeout
    if (isTimeUp) {
      // Verifikasi di server: apakah benar waktu sudah habis?
      const now = new Date();
      const startTime = new Date(ujian.mulaiPada);
      const examEndTime = new Date(startTime.getTime() + ujian.jadwalUjian.durasi * 60000);
      const scheduleEndTime = new Date(ujian.jadwalUjian.selesai);
      
      const deadline = examEndTime < scheduleEndTime ? examEndTime : scheduleEndTime;
      
      // Beri toleransi 30 detik untuk delay network
      if (now.getTime() < (deadline.getTime() - 30000)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bypass token ditolak. Waktu ujian di server masih tersedia.' 
        });
      }
    } else {
      if (ujian.jadwalUjian.tokenCheckOut !== tokenCheckOut) {
        return res.status(400).json({ success: false, message: 'Token Checkout salah atau tidak valid.' });
      }
    }

    const answerMap = new Map();
    for (const a of answers) {
       answerMap.set(Number(a?.bankSoalId), { jawabanSiswa: a?.jawabanSiswa ?? '', statusJawaban: a?.statusJawaban });
    }

    let benar = 0, salah = 0, kosong = 0, raguRagu = 0;

    await prisma.$transaction(
      ujian.jawabanSiswa.map((row) => {
        const incoming = answerMap.get(row.bankSoalId) || { jawabanSiswa: row.jawabanSiswa || '', statusJawaban: row.statusJawaban };
        const statusJawaban = getStatusFromAnswer(incoming.jawabanSiswa, incoming.statusJawaban);
        const { isBenar, skorItem } = scoreByType(row.tipeSoal, row.bankSoal.jawaban, incoming.jawabanSiswa);

        if (statusJawaban === 'kosong') kosong += 1;
        else if (statusJawaban === 'ragu_ragu') raguRagu += 1;

        if (isBenar) {
          benar += 1;
        } else {
          salah += 1; // Semua yang tidak benar (termasuk kosong/ragu) dihitung salah
        }

        return prisma.jawabanSiswa.update({
          where: { id: row.id },
          data: {
            jawabanSiswa: incoming.jawabanSiswa ? String(incoming.jawabanSiswa) : null,
            statusJawaban, isBenar, skorItem,
          },
        });
      })
    );

    const totalSoal = ujian.jawabanSiswa.length;
    const nilaiAkhir = totalSoal > 0 ? Number(((benar / totalSoal) * 100).toFixed(2)) : 0;

    await prisma.ujianSiswa.update({
      where: { id: ujianSiswaId },
      data: { status: 'selesai', benar, salah, kosong, raguRagu, nilaiAkhir, selesaiPada: new Date() },
    });

    return res.json({
      success: true, message: 'Jawaban berhasil disubmit dan dinilai secara otomatis',
      data: { ujianSiswaId, totalSoal, benar, salah, kosong, raguRagu, nilaiAkhir },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mensubmit ujian' });
  }
};


exports.getRiwayatUjian = async (req, res) => {
  const siswaId = req.siswaId;

  try {
    const riwayat = await prisma.ujianSiswa.findMany({
      where: { siswaId, status: 'selesai' },
      include: {
        jadwalUjian: {
          include: { mataPelajaran: true },
        },
      },
      orderBy: { selesaiPada: 'desc' },
    });

    return res.json({
      success: true,
      data: riwayat.map((u) => ({
        ujianSiswaId: u.id,
        namaJadwal: u.jadwalUjian.nama,
        mataPelajaran: u.jadwalUjian.mataPelajaran,
        totalSoal: u.totalSoal,
        benar: u.benar,
        salah: u.salah,
        kosong: u.kosong,
        nilaiAkhir: Number(u.nilaiAkhir),
        mulaiPada: u.mulaiPada,
        selesaiPada: u.selesaiPada,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat riwayat ujian' });
  }
};

exports.getHasilUjian = async (req, res) => {
  const siswaId = req.siswaId;
  const ujianSiswaId = Number(req.params.ujianSiswaId);

  try {
    const ujian = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: {
        jadwalUjian: { include: { mataPelajaran: true } },
        jawabanSiswa: {
          include: { bankSoal: true }, orderBy: { nomorSoal: 'asc' },
        },
      },
    });

    if (!ujian || ujian.siswaId !== siswaId) {
      return res.status(404).json({ success: false, message: 'Hasil ujian tidak ditemukan' });
    }

    const pick = (v) => (v == null ? '' : String(v).trim());

    return res.json({
      success: true,
      data: {
        ujianSiswaId: ujian.id,
        status: ujian.status,
        rekap: {
          totalSoal: ujian.totalSoal, benar: ujian.benar, salah: ujian.salah, kosong: ujian.kosong,
          raguRagu: ujian.raguRagu, nilaiAkhir: Number(ujian.nilaiAkhir), mulaiPada: ujian.mulaiPada, selesaiPada: ujian.selesaiPada,
        },
        jadwalUjian: {
          id: ujian.jadwalUjian.id, nama: ujian.jadwalUjian.nama, mataPelajaran: ujian.jadwalUjian.mataPelajaran,
        },
        // Di hasil ujian, correctOption dipertontonkan
        detail: ujian.jawabanSiswa.map((j) => {
          const b = j.bankSoal;
          const k = b.kategoriSoal;
          const opts = k === 'pilgan_kompleks' ? [b.kolomA, b.kolomB, b.kolomC, b.kolomD, b.kolomE, b.kolomF] : 
                       k === 'pilgan_kategori' ? [b.kolomA, b.kolomB, b.kolomC] : 
                       [b.kolomA, b.kolomB, b.kolomC, b.kolomD, b.kolomE];
          return {
            nomorSoal: j.nomorSoal, tipeSoal: j.tipeSoal, soal: b.soal, gambar: b.gambar, options: opts.filter(Boolean),
            jawabanSiswa: j.jawabanSiswa, statusJawaban: j.statusJawaban, isBenar: j.isBenar, correctOption: b.jawaban
          };
        }),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat hasil ujian' });
  }
};
