const prisma = require('../config/prisma');
const XLSX = require('xlsx');

exports.list = async (req, res) => {
  try {
    const { search, jadwalUjianId, mapelId, kelasId } = req.query;

    let where = {};
    const andConditions = [];

    if (search && String(search).trim().length > 0) {
      const s = String(search).trim();
      andConditions.push({
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
      });
    }

    if (jadwalUjianId && jadwalUjianId !== 'all') {
      if (String(jadwalUjianId).startsWith('periode-')) {
        const pId = Number(String(jadwalUjianId).replace('periode-', ''));
        andConditions.push({
          jadwalUjian: {
            periodeId: pId
          }
        });
      } else {
        andConditions.push({
          jadwalUjianId: Number(jadwalUjianId)
        });
      }
    }

    if (mapelId && mapelId !== 'all') {
      andConditions.push({
        jadwalUjian: {
          mataPelajaranId: Number(mapelId)
        }
      });
    }

    if (kelasId && kelasId !== 'all') {
      andConditions.push({
        siswa: {
          kelasId: Number(kelasId)
        }
      });
    }

    if (andConditions.length > 0) {
      where = { AND: andConditions };
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
          include: {
            mataPelajaran: true
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

exports.exportExcel = async (req, res) => {
  try {
    const { search, jadwalUjianId, mapelId, kelasId } = req.query;

    let where = {};
    const andConditions = [];

    if (search && String(search).trim().length > 0) {
      const s = String(search).trim();
      andConditions.push({
        OR: [
          { siswa: { user: { namaLengkap: { contains: s } } } },
          { siswa: { nis: { contains: s } } },
          { jadwalUjian: { nama: { contains: s } } },
          { siswa: { kelas: { namaKelas: { contains: s } } } }
        ]
      });
    }

    if (jadwalUjianId && jadwalUjianId !== 'all') {
      if (String(jadwalUjianId).startsWith('periode-')) {
        const pId = Number(String(jadwalUjianId).replace('periode-', ''));
        andConditions.push({
          jadwalUjian: {
            periodeId: pId
          }
        });
      } else {
        andConditions.push({
          jadwalUjianId: Number(jadwalUjianId)
        });
      }
    }

    if (mapelId && mapelId !== 'all') {
      andConditions.push({
        jadwalUjian: {
          mataPelajaranId: Number(mapelId)
        }
      });
    }

    if (kelasId && kelasId !== 'all') {
      andConditions.push({
        siswa: {
          kelasId: Number(kelasId)
        }
      });
    }

    if (andConditions.length > 0) {
      where = { AND: andConditions };
    }

    const items = await prisma.ujianSiswa.findMany({
      where,
      include: {
        siswa: {
          include: {
            user: {
              select: {
                email: true,
                namaLengkap: true
              }
            },
            kelas: true
          }
        },
        jadwalUjian: {
          include: {
            mataPelajaran: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const formattedData = items.map((item, idx) => ({
      'No': idx + 1,
      'Nama Siswa': item.siswa?.user?.namaLengkap || '-',
      'NIS': item.siswa?.nis || '-',
      'NISN': item.siswa?.nisn || '-',
      'Email': item.siswa?.user?.email || '-',
      'Kelas': item.siswa?.kelas?.namaKelas || '-',
      'Nama Ujian': item.jadwalUjian?.nama || '-',
      'Status': item.status,
      'Benar': item.benar,
      'Salah': item.salah,
      'Kosong': item.kosong,
      'Ragu-ragu': item.raguRagu,
      'Nilai Akhir': Number(item.nilaiAkhir) || 0,
      'Mulai': item.mulaiPada ? new Date(item.mulaiPada).toLocaleString('id-ID') : '-',
      'Selesai': item.selesaiPada ? new Date(item.selesaiPada).toLocaleString('id-ID') : '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Auto-fit columns
    const max_len = {};
    formattedData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const val = row[key] ? row[key].toString() : '';
        max_len[key] = Math.max(max_len[key] || 10, val.length);
      });
    });
    const cols = Object.keys(max_len).map((key) => ({ wch: max_len[key] + 3 }));
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, "Ujian Siswa");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Rekap_Ujian_Siswa_Admin.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('Error exporting UjianSiswa:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengekspor data ujian siswa' });
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

exports.getBelumMengerjakan = async (req, res) => {
  try {
    const { jadwalUjianId, mapelId, kelasId } = req.query;

    // 1. Cari JadwalUjian yang sesuai dengan filter
    let jadwalWhere = {};
    const andJadwal = [];

    if (jadwalUjianId && jadwalUjianId !== 'all') {
      if (String(jadwalUjianId).startsWith('periode-')) {
        const pId = Number(String(jadwalUjianId).replace('periode-', ''));
        andJadwal.push({ periodeId: pId });
      } else {
        andJadwal.push({ id: Number(jadwalUjianId) });
      }
    }
    if (mapelId && mapelId !== 'all') {
      andJadwal.push({ mataPelajaranId: Number(mapelId) });
    }
    if (kelasId && kelasId !== 'all') {
      andJadwal.push({
        kelasJadwal: {
          some: { kelasId: Number(kelasId) }
        }
      });
    }

    if (andJadwal.length > 0) {
      jadwalWhere = { AND: andJadwal };
    } else {
      return res.json({ success: true, data: [] });
    }

    const matchingJadwals = await prisma.jadwalUjian.findMany({
      where: jadwalWhere,
      include: {
        mataPelajaran: true,
        kelasJadwal: {
          include: {
            kelas: {
              include: { jurusan: true }
            }
          }
        }
      }
    });

    const results = [];

    // 2. Untuk setiap JadwalUjian, cari siswa di kelas-kelas target yang belum ada di UjianSiswa
    for (const jadwal of matchingJadwals) {
      let targetKelasIds = jadwal.kelasJadwal.map(kj => kj.kelasId);

      if (kelasId && kelasId !== 'all') {
        const kId = Number(kelasId);
        if (targetKelasIds.includes(kId)) {
          targetKelasIds = [kId];
        } else {
          continue;
        }
      }

      if (targetKelasIds.length === 0) continue;

      const siswaList = await prisma.siswa.findMany({
        where: {
          kelasId: { in: targetKelasIds },
          user: { status: 'aktif' }
        },
        include: {
          user: {
            select: { id: true, namaLengkap: true, email: true }
          },
          kelas: {
            include: { jurusan: true }
          }
        }
      });

      const ujianSiswaList = await prisma.ujianSiswa.findMany({
        where: {
          jadwalUjianId: jadwal.id
        },
        select: {
          siswaId: true
        }
      });

      const sudahMengerjakanSiswaIds = new Set(ujianSiswaList.map(us => us.siswaId));

      for (const siswa of siswaList) {
        if (!sudahMengerjakanSiswaIds.has(siswa.id)) {
          results.push({
            siswa: {
              id: siswa.id,
              nis: siswa.nis,
              user: siswa.user,
              kelas: siswa.kelas
            },
            jadwalUjian: {
              id: jadwal.id,
              nama: jadwal.nama,
              mataPelajaran: jadwal.mataPelajaran
            }
          });
        }
      }
    }

    results.sort((a, b) => {
      const nameCompare = (a.siswa?.user?.namaLengkap || '').localeCompare(b.siswa?.user?.namaLengkap || '');
      if (nameCompare !== 0) return nameCompare;
      return (a.siswa?.kelas?.namaKelas || '').localeCompare(b.siswa?.kelas?.namaKelas || '');
    });

    return res.json({
      success: true,
      data: results
    });

  } catch (err) {
    console.error('Error in getBelumMengerjakan:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses data siswa belum mengerjakan' });
  }
};


