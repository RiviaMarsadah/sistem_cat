const Joi = require('joi');
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

const createSchema = Joi.object({
  nama: Joi.string().trim().min(1).max(120).required(),
  mataPelajaranId: Joi.number().integer().allow(null).optional(),
  tingkat: Joi.string().valid('X', 'XI', 'XII', 'SEMUA').allow(null).optional(),
  jurusanId: Joi.number().integer().allow(null).optional(),
});

exports.list = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const items = await prisma.bankSoalKoleksi.findMany({
      where: { guruId },
      orderBy: [{ updatedAt: 'desc' }, { nama: 'asc' }],
      include: {
        _count: { select: { bankSoal: true } },
        mataPelajaran: {
          select: { id: true, namaMapel: true, kodeMapel: true }
        },
        jurusan: {
          select: { id: true, namaProdi: true }
        },
        bankSoal: {
          select: {
            mataPelajaranId: true,
            tingkat: true,
            jurusanId: true,
          }
        }
      },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('BankSoalKoleksi list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat koleksi bank soal' });
  }
};

exports.create = async (req, res) => {
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const { error, value } = createSchema.validate(req.body, { abortEarly: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const existing = await prisma.bankSoalKoleksi.findFirst({
      where: { guruId, nama: value.nama.trim() },
      select: { id: true, nama: true, createdAt: true, updatedAt: true },
    });
    if (existing) {
      return res.json({ success: true, message: 'Koleksi sudah ada', data: existing });
    }

    const created = await prisma.bankSoalKoleksi.create({
      data: {
        guruId,
        nama: value.nama.trim(),
        mataPelajaranId: value.mataPelajaranId ? Number(value.mataPelajaranId) : null,
        tingkat: value.tingkat || null,
        jurusanId: value.jurusanId ? Number(value.jurusanId) : null,
      },
    });

    return res.status(201).json({ success: true, message: 'Koleksi bank soal berhasil dibuat', data: created });
  } catch (err) {
    console.error('BankSoalKoleksi create error:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat koleksi bank soal' });
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  const { error, value } = createSchema.validate(req.body, { abortEarly: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const existing = await prisma.bankSoalKoleksi.findFirst({
      where: { id, guruId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Koleksi tidak ditemukan atau Anda tidak memiliki akses' });
    }

    const duplicate = await prisma.bankSoalKoleksi.findFirst({
      where: { guruId, nama: value.nama.trim(), id: { not: id } },
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Koleksi dengan nama tersebut sudah ada' });
    }

    const updated = await prisma.bankSoalKoleksi.update({
      where: { id },
      data: { 
        nama: value.nama.trim(),
        mataPelajaranId: value.mataPelajaranId ? Number(value.mataPelajaranId) : null,
        tingkat: value.tingkat || null,
        jurusanId: value.jurusanId ? Number(value.jurusanId) : null,
      },
    });

    return res.json({ success: true, message: 'Koleksi bank soal berhasil diubah', data: updated });
  } catch (err) {
    console.error('BankSoalKoleksi update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah koleksi bank soal' });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const guruId = req.guruId;
  
  try {
    const existing = await prisma.bankSoalKoleksi.findFirst({
      where: { id, guruId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Koleksi tidak ditemukan atau Anda tidak memiliki akses' });
    }

    // 1. Dapatkan semua soal terkait koleksi ini
    const associatedSoal = await prisma.bankSoal.findMany({
      where: { bankSoalKoleksiId: id },
      select: { id: true, gambar: true }
    });

    const soalIds = associatedSoal.map((s) => s.id);
    if (soalIds.length > 0) {
      // Periksa apakah ada soal yang digunakan di Paket Ujian
      const usedInPakets = await prisma.soalPaketUjian.findMany({
        where: { bankSoalId: { in: soalIds } },
        include: {
          paketUjian: { select: { nama: true } }
        }
      });

      // Periksa apakah ada soal yang digunakan di Ujian Siswa (Riwayat Ujian)
      const usedInJawabans = await prisma.jawabanSiswa.findMany({
        where: { bankSoalId: { in: soalIds } },
        include: {
          ujian: {
            include: {
              jadwalUjian: { select: { nama: true } }
            }
          }
        }
      });

      if (usedInPakets.length > 0 || usedInJawabans.length > 0) {
        const paketNames = Array.from(new Set(usedInPakets.map((p) => p.paketUjian?.nama))).filter(Boolean);
        const jadwalNames = Array.from(new Set(usedInJawabans.map((j) => j.ujian?.jadwalUjian?.nama))).filter(Boolean);

        let detailMessage = 'Tidak dapat menghapus bank soal karena beberapa butir soal di dalamnya masih digunakan:';
        if (paketNames.length > 0) {
          detailMessage += `\n• Paket Ujian: ${paketNames.join(', ')}`;
        }
        if (jadwalNames.length > 0) {
          detailMessage += `\n• Riwayat/Jadwal Ujian: ${jadwalNames.join(', ')}`;
        }
        detailMessage += '\n\nSilakan hapus paket ujian atau batalkan tautan soal terlebih dahulu.';

        return res.status(400).json({
          success: false,
          message: detailMessage
        });
      }
    }

    // 2. Hapus semua file gambar dari soal-soal tersebut jika ada
    for (const soal of associatedSoal) {
      if (soal.gambar) {
        const filePath = path.join(process.cwd(), 'uploads', soal.gambar);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (unlinkErr) {
          console.error(`Gagal menghapus file gambar ${soal.gambar}:`, unlinkErr);
        }
      }
    }

    // 3. Hapus seluruh soal yang terkait dengan koleksi ini dari database
    await prisma.bankSoal.deleteMany({
      where: { bankSoalKoleksiId: id }
    });

    // 4. Hapus koleksi bank soal itu sendiri
    await prisma.bankSoalKoleksi.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Koleksi bank soal beserta seluruh soal di dalamnya berhasil dihapus' });
  } catch (err) {
    console.error('BankSoalKoleksi delete error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus koleksi bank soal' });
  }
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  const guruId = req.guruId;
  if (!guruId) return res.status(403).json({ success: false, message: 'Guru tidak ditemukan' });

  try {
    const item = await prisma.bankSoalKoleksi.findFirst({
      where: { id, guruId },
      include: {
        mataPelajaran: {
          select: { id: true, namaMapel: true, kodeMapel: true }
        },
        jurusan: {
          select: { id: true, namaProdi: true }
        }
      }
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Koleksi tidak ditemukan' });
    }
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('BankSoalKoleksi getById error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail koleksi bank soal' });
  }
};
