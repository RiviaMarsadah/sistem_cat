const express = require('express');
const multer = require('multer');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const resolveGuru = require('../middleware/resolveGuru');
const prisma = require('../config/prisma');
const bankSoalController = require('../controllers/bankSoalController');
const bankSoalImportController = require('../controllers/bankSoalImportController');
const bankSoalKoleksiController = require('../controllers/bankSoalKoleksiController');
const paketUjianController = require('../controllers/paketUjianController');
const guruJadwalController = require('../controllers/guruJadwalController');
const guruRekapController = require('../controllers/guruRekapController');
const guruAnalisisController = require('../controllers/guruAnalisisController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.use(requireRole('guru'));
router.use(resolveGuru);

// Options for dropdowns (mata pelajaran & kelas with jurusan)
router.get('/mata-pelajaran', async (req, res) => {
  try {
    const items = await prisma.mataPelajaran.findMany({
      orderBy: { namaMapel: 'asc' },
      select: { id: true, namaMapel: true, kodeMapel: true },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('mata-pelajaran list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat mata pelajaran' });
  }
});

router.get('/kelas', async (req, res) => {
  try {
    const items = await prisma.kelas.findMany({
      orderBy: [{ tingkat: 'asc' }, { namaKelas: 'asc' }],
      include: {
        jurusan: { select: { id: true, kodeProdi: true, namaProdi: true } },
      },
    });
    // Selalu kirim namaKelas, tingkat, inisial agar frontend bisa tampilkan nama lengkap
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('kelas list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat kelas' });
  }
});

router.get('/jurusan', async (req, res) => {
  try {
    const items = await prisma.jurusan.findMany({
      orderBy: { namaProdi: 'asc' },
      select: { id: true, kodeProdi: true, namaProdi: true },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('jurusan list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat jurusan' });
  }
});

// Paket Ujian CRUD
router.get('/paket-ujian', paketUjianController.list);
router.get('/paket-ujian/:id', paketUjianController.getById);
router.post('/paket-ujian', paketUjianController.create);
router.put('/paket-ujian/:id', paketUjianController.update);
router.delete('/paket-ujian/:id', paketUjianController.remove);

// Bank Soal CRUD & Import
router.get('/bank-soal-koleksi', bankSoalKoleksiController.list);
router.get('/bank-soal-koleksi/:id', bankSoalKoleksiController.getById);
router.post('/bank-soal-koleksi', bankSoalKoleksiController.create);
router.put('/bank-soal-koleksi/:id', bankSoalKoleksiController.update);
router.delete('/bank-soal-koleksi/:id', bankSoalKoleksiController.remove);
router.get('/bank-soal/template', bankSoalImportController.downloadTemplate);
router.post('/bank-soal/import', upload.single('file'), bankSoalImportController.importExcel);
router.post('/bank-soal/upload-image', upload.single('image'), bankSoalController.uploadImage);
router.get('/bank-soal', bankSoalController.list);
router.get('/bank-soal/:id', bankSoalController.getById);
router.post('/bank-soal', bankSoalController.create);
router.put('/bank-soal/:id', bankSoalController.update);
router.delete('/bank-soal/:id', bankSoalController.remove);

// Jadwal Ujian
router.get('/jadwal-ujian/official', guruJadwalController.listOfficial);
router.put('/jadwal-ujian/official/:id/paket', guruJadwalController.setPaket);
router.delete('/jadwal-ujian/official/:id/paket', guruJadwalController.removePaket);

router.get('/jadwal-ujian/custom', guruJadwalController.listCustom);
router.post('/jadwal-ujian/custom', guruJadwalController.createCustom);
router.put('/jadwal-ujian/custom/:id', guruJadwalController.updateCustom);
router.delete('/jadwal-ujian/custom/:id', guruJadwalController.removeCustom);

// Rekap Ujian
router.get('/rekap/export', guruRekapController.exportResults);
router.get('/rekap/jadwal', guruRekapController.getExams);
router.get('/rekap/results', guruRekapController.getResults);
router.get('/rekap/detail/:id', guruRekapController.getDetail);
router.delete('/rekap/results/:id', guruRekapController.removeResult);


// Analisis Soal
router.get('/analisis/export/:id', guruAnalisisController.exportQuestionAnalysis);
router.get('/analisis/paket', guruAnalisisController.getAnalyzablePackages);
router.get('/analisis/paket/:id', guruAnalisisController.getQuestionAnalysis);

module.exports = router;
