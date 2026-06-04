const prisma = require('../config/prisma');

const generateToken = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token;
  let isUnique = false;
  
  while (!isUnique) {
    token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await prisma.jadwalUjian.findFirst({ where: { token } });
    if (!existing) isUnique = true;
  }
  return token;
};

exports.list = async (req, res) => {
  try {
    const jadwal = await prisma.jadwalUjian.findMany({
      where: {
        guruId: null, // Hanya mengambil jadwal resmi yang dibuat oleh Admin
        periodeId: { not: null }
      },
      include: {
        mataPelajaran: true,
        paketUjian: {
          include: {
            guru: {
              include: { user: true }
            }
          }
        },
        periode: true,
        jurusan: true,
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
    console.error('Error fetching jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat jadwal ujian' });
  }
};

exports.bulkGenerate = async (req, res) => {
  const { periodeId, slots } = req.body;
  
  if (!periodeId || !slots || !slots.length) {
    return res.status(400).json({ success: false, message: 'Data periode dan slots diperlukan' });
  }

  try {
    const periode = await prisma.periodeUjian.findUnique({ where: { id: Number(periodeId) } });
    if (!periode) return res.status(404).json({ success: false, message: 'Periode tidak ditemukan' });

    const results = [];
    
    await prisma.$transaction(async (tx) => {
      for (const slot of slots) {
        const tokenIn = await generateToken();
        const tokenOut = await generateToken();

        const jadwal = await tx.jadwalUjian.create({
          data: {
            nama: periode.nama,
            kategori: 'terjadwal',
            mataPelajaranId: Number(slot.mapelId),
            periodeId: Number(periodeId),
            jurusanId: slot.jurusanId ? Number(slot.jurusanId) : null,
            ruangan: slot.ruangan || null,
            mulai: new Date(slot.mulai),
            selesai: new Date(slot.selesai),
            durasi: Number(slot.durasi),
            token: tokenIn,
            tokenCheckOut: tokenOut,
            guruId: null,
            opsiKeamanan: Boolean(slot.opsiKeamanan)
          }
        });

        if (slot.kelasIds && slot.kelasIds.length) {
          for (const kelasId of slot.kelasIds) {
             await tx.kelasJadwal.create({
               data: {
                 jadwalUjianId: jadwal.id,
                 kelasId: Number(kelasId)
               }
             });
          }
        }
        results.push(jadwal);
      }
    });

    return res.json({ success: true, message: `${results.length} slot ujian berhasil digenerate`, data: results });
  } catch (error) {
    console.error('Error in bulk generate:', error);
    return res.status(500).json({ success: false, message: 'Gagal menggenerate jadwal' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.jadwalUjian.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus jadwal ujian' });
  }
};

exports.listAll = async (req, res) => {
   try {
    const jadwal = await prisma.jadwalUjian.findMany({
      include: {
        mataPelajaran: true,
        paketUjian: {
           include: { guru: { include: { user: true } } }
        },
        guru: { include: { user: true } },
        kelasJadwal: {
          include: { kelas: true }
        }
      },
      orderBy: { mulai: 'desc' }
    });
    return res.json({ success: true, data: jadwal });
   } catch(e) {
      return res.status(500).json({ success: false, message: 'Error loading all schedules' });
   }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { mulai, selesai, durasi, ruangan, opsiKeamanan, mataPelajaranId } = req.body;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID jadwal tidak valid' });
  }

  try {
    const updateData = {};
    if (mataPelajaranId) updateData.mataPelajaranId = Number(mataPelajaranId);
    if (ruangan !== undefined) updateData.ruangan = ruangan;
    if (mulai) updateData.mulai = new Date(mulai);
    if (selesai) updateData.selesai = new Date(selesai);
    if (durasi) updateData.durasi = Number(durasi);
    if (opsiKeamanan !== undefined) updateData.opsiKeamanan = Boolean(opsiKeamanan);

    const updated = await prisma.jadwalUjian.update({
      where: { id },
      data: updateData
    });

    return res.json({ success: true, message: 'Jadwal berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Error updating jadwal:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal ujian' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FITUR BARU 1: Ambil paket soal yang tersedia berdasarkan mapel jadwal
// GET /admin/jadwal-ujian/:id/available-pakets
// ─────────────────────────────────────────────────────────────────────────────
exports.getAvailablePakets = async (req, res) => {
  const jadwalId = Number(req.params.id);
  if (!jadwalId) {
    return res.status(400).json({ success: false, message: 'ID jadwal tidak valid' });
  }

  try {
    const jadwal = await prisma.jadwalUjian.findUnique({
      where: { id: jadwalId },
      select: { mataPelajaranId: true, guruId: true }
    });

    if (!jadwal) {
      return res.status(404).json({ success: false, message: 'Jadwal ujian tidak ditemukan' });
    }

    if (jadwal.guruId !== null) {
      return res.status(400).json({ success: false, message: 'Endpoint ini hanya untuk jadwal resmi admin' });
    }

    const pakets = await prisma.paketUjian.findMany({
      where: {
        mataPelajaranId: jadwal.mataPelajaranId
      },
      include: {
        guru: { include: { user: { select: { namaLengkap: true } } } },
        mataPelajaran: { select: { namaMapel: true } },
        _count: { select: { soalPaket: true } }
      },
      orderBy: [
        { guru: { user: { namaLengkap: 'asc' } } },
        { nama: 'asc' }
      ]
    });

    return res.json({ success: true, data: pakets });
  } catch (error) {
    console.error('getAvailablePakets error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat paket soal yang tersedia' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FITUR BARU 2: Admin set / ganti / lepas paket soal di jadwal resmi
// PUT /admin/jadwal-ujian/:id/set-paket
// Body: { paketUjianId: number | null }
// ─────────────────────────────────────────────────────────────────────────────
exports.adminSetPaket = async (req, res) => {
  const jadwalId = Number(req.params.id);
  const { paketUjianId } = req.body;

  if (!jadwalId) {
    return res.status(400).json({ success: false, message: 'ID jadwal tidak valid' });
  }

  try {
    const jadwal = await prisma.jadwalUjian.findUnique({
      where: { id: jadwalId },
      select: { id: true, guruId: true, mataPelajaranId: true, paketUjianId: true }
    });

    if (!jadwal) {
      return res.status(404).json({ success: false, message: 'Jadwal ujian tidak ditemukan' });
    }

    if (jadwal.guruId !== null) {
      return res.status(400).json({ success: false, message: 'Endpoint ini hanya untuk jadwal resmi admin' });
    }

    // Lepas paket jika null dikirim
    if (paketUjianId === null || paketUjianId === undefined || paketUjianId === '') {
      await prisma.jadwalUjian.update({
        where: { id: jadwalId },
        data: { paketUjianId: null }
      });
      return res.json({ success: true, message: 'Paket soal berhasil dilepas dari jadwal' });
    }

    const paketId = Number(paketUjianId);

    const paket = await prisma.paketUjian.findUnique({
      where: { id: paketId },
      include: { guru: { include: { user: { select: { namaLengkap: true } } } } }
    });

    if (!paket) {
      return res.status(404).json({ success: false, message: 'Paket soal tidak ditemukan' });
    }

    if (paket.mataPelajaranId !== jadwal.mataPelajaranId) {
      return res.status(400).json({
        success: false,
        message: 'Paket soal tidak sesuai dengan mata pelajaran jadwal ini'
      });
    }

    const activeExams = await prisma.ujianSiswa.count({ where: { jadwalUjianId: jadwalId } });
    if (activeExams > 0 && jadwal.paketUjianId !== null && jadwal.paketUjianId !== paketId) {
      return res.status(400).json({
        success: false,
        message: 'Ujian sudah/sedang berlangsung. Paket soal tidak dapat diganti.'
      });
    }

    const updated = await prisma.jadwalUjian.update({
      where: { id: jadwalId },
      data: { paketUjianId: paketId },
      include: {
        paketUjian: {
          include: { guru: { include: { user: true } } }
        }
      }
    });

    return res.json({
      success: true,
      message: `Paket soal "${paket.nama}" oleh ${paket.guru?.user?.namaLengkap || 'Guru'} berhasil dipasang`,
      data: updated
    });
  } catch (error) {
    console.error('adminSetPaket error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengatur paket soal' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FITUR BARU 3: Info token hari ini + sisa waktu regen untuk frontend countdown
// GET /admin/jadwal-ujian/today-tokens
// ─────────────────────────────────────────────────────────────────────────────
exports.getTodayTokensInfo = async (req, res) => {
  const REGEN_INTERVAL_MS = 15 * 60 * 1000;

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const jadwalHariIni = await prisma.jadwalUjian.findMany({
      where: {
        mulai:   { lte: endOfDay },
        selesai: { gte: startOfDay }
      },
      select: {
        id: true,
        token: true,
        tokenCheckOut: true
      }
    });

    const OFFSET_MS = 10 * 60 * 1000; // 10 minutes offset (menit ke 10, 25, 40, 55)
    const shiftedTime = now.getTime() - OFFSET_MS;
    const currentSlot = Math.floor(shiftedTime / REGEN_INTERVAL_MS);
    const nextSlotMs  = (currentSlot + 1) * REGEN_INTERVAL_MS + OFFSET_MS;
    const msUntilNext = nextSlotMs - now.getTime();

    const tokenMap = {};
    for (const j of jadwalHariIni) {
      tokenMap[j.id] = { token: j.token, tokenCheckOut: j.tokenCheckOut };
    }

    return res.json({
      success: true,
      data: {
        tokens: tokenMap,
        msUntilNextRegen: msUntilNext,
        nextRegenAt: new Date(nextSlotMs).toISOString()
      }
    });
  } catch (error) {
    console.error('getTodayTokensInfo error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat info token' });
  }
};
