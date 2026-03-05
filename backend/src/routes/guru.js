const express = require('express');
const multer = require('multer');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const resolveGuru = require('../middleware/resolveGuru');
const prisma = require('../config/prisma');
const bankSoalController = require('../controllers/bankSoalController');
const bankSoalImportController = require('../controllers/bankSoalImportController');

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
        jurusan: { select: { id: true, idJurusan: true, nama: true } },
      },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('kelas list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat kelas' });
  }
});

router.get('/jurusan', async (req, res) => {
  try {
    const items = await prisma.jurusan.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, idJurusan: true, nama: true },
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('jurusan list error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat jurusan' });
  }
});

// Bank Soal CRUD & Import
router.get('/bank-soal/template', bankSoalImportController.downloadTemplate);
router.post('/bank-soal/import', upload.single('file'), bankSoalImportController.importExcel);
router.get('/bank-soal', bankSoalController.list);
router.get('/bank-soal/:id', bankSoalController.getById);
router.post('/bank-soal', bankSoalController.create);
router.put('/bank-soal/:id', bankSoalController.update);
router.delete('/bank-soal/:id', bankSoalController.remove);

module.exports = router;
