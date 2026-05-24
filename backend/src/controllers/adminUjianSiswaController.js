const prisma = require('../config/prisma');

exports.list = async (req, res) => {
  try {
    const { search } = req.query;

    let where = {};
    if (search && String(search).trim().length > 0) {
      const s = String(search).trim();
      where = {
        OR: [
          {
            siswa: {
              user: {
                namaLengkap: { contains: s }
              }
            }
          },
          {
            siswa: {
              nis: { contains: s }
            }
          },
          {
            jadwalUjian: {
              nama: { contains: s }
            }
          },
          {
            siswa: {
              kelas: {
                namaKelas: { contains: s }
              }
            }
          }
        ]
      };
    }

    const items = await prisma.ujianSiswa.findMany({
      where,
      include: {
        siswa: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                namaLengkap: true,
                status: true
              }
            },
            kelas: {
              include: { jurusan: true }
            }
          }
        },
        jadwalUjian: {
          select: {
            id: true,
            nama: true,
            mulai: true,
            selesai: true,
            durasi: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return res.json({
      success: true,
      data: items
    });
  } catch (err) {
    console.error('Error listing UjianSiswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat data ujian siswa' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.ujianSiswa.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data ujian siswa tidak ditemukan' });
    }

    // Deleting UjianSiswa automatically deletes all related JawabanSiswa due to Cascade constraints.
    await prisma.ujianSiswa.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Data ujian siswa dan seluruh jawaban terkait berhasil dihapus'
    });
  } catch (err) {
    console.error('Error deleting UjianSiswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data ujian siswa' });
  }
};

// --- HELPER SCORING FUNCTIONS FOR ADMIN SUBMISSION ---
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

function normalizeCategory(v) {
  return normalizeAnswer(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(',');
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
    return { isBenar: kk === jj, skorItem: kk === jj ? 2 : 0 };
  }

  if (tipeSoal === 'pilgan_kategori') {
    const kk = normalizeCategory(k);
    const jj = normalizeCategory(j);
    return { isBenar: kk === jj, skorItem: kk === jj ? 2 : 0 };
  }

  return { isBenar: false, skorItem: 0 };
}

exports.updateStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!['berlangsung', 'selesai'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status harus berlangsung atau selesai' });
  }

  try {
    const existing = await prisma.ujianSiswa.findUnique({
      where: { id },
      include: {
        jawabanSiswa: {
          include: { bankSoal: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data ujian siswa tidak ditemukan' });
    }

    if (status === 'selesai') {
      // Hitung skor berdasarkan jawaban yang tersimpan saat ini
      let benar = 0;
      let salah = 0;
      let kosong = 0;
      let raguRagu = 0;
      let nilaiBenar = 0;
      let nilaiTotal = 0;

      const updates = existing.jawabanSiswa.map((row) => {
        const rawAns = row.jawabanSiswa || '';
        let statusJawaban = row.statusJawaban || 'kosong';
        if (rawAns && statusJawaban === 'kosong') {
          statusJawaban = 'dijawab';
        }

        const { isBenar, skorItem } = scoreByType(row.tipeSoal, row.bankSoal.jawaban, rawAns);

        const weight = (row.tipeSoal === 'pilgan_kompleks' || row.tipeSoal === 'pilgan_kategori') ? 2 : 1;
        nilaiTotal += weight;

        if (statusJawaban === 'kosong') kosong += 1;
        else if (statusJawaban === 'ragu_ragu') raguRagu += 1;

        if (isBenar) {
          nilaiBenar += weight;
          benar += 1;
        } else {
          salah += 1;
        }

        return prisma.jawabanSiswa.update({
          where: { id: row.id },
          data: {
            isBenar,
            skorItem,
            statusJawaban
          }
        });
      });

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }

      const totalSoal = existing.jawabanSiswa.length;
      const nilaiAkhir = nilaiTotal > 0 ? Number(((nilaiBenar / nilaiTotal) * 100).toFixed(2)) : 0;

      await prisma.ujianSiswa.update({
        where: { id },
        data: {
          status: 'selesai',
          benar,
          salah,
          kosong,
          raguRagu,
          nilaiAkhir,
          selesaiPada: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Ujian berhasil diselesaikan dan dinilai secara otomatis oleh Admin'
      });

    } else if (status === 'berlangsung') {
      // Ubah status kembali ke berlangsung, hapus selesaiPada
      await prisma.ujianSiswa.update({
        where: { id },
        data: {
          status: 'berlangsung',
          selesaiPada: null
        }
      });

      return res.json({
        success: true,
        message: 'Ujian berhasil diaktifkan kembali oleh Admin'
      });
    }

  } catch (err) {
    console.error('Error updating UjianSiswa status:', err);
    return res.status(500).json({ success: false, message: 'Gagal merubah status ujian siswa' });
  }
};

