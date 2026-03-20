const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const siswaPaketUjianController = require('../controllers/siswaPaketUjianController');

// Semua route siswa butuh JWT login (role: siswa)
router.use(authenticate);
router.use(requireRole('siswa'));

// Mobile: ambil paket + seluruh soal berdasarkan tokenCheckIn
// GET /api/siswa/paket-ujian?tokenCheckIn=ABCDEF
router.get('/paket-ujian', siswaPaketUjianController.getPaketUjianByTokenCheckIn);

module.exports = router;

