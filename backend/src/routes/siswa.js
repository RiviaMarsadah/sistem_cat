const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const resolveSiswa = require('../middleware/resolveSiswa');


const siswaUjianController = require('../controllers/siswaUjianController');

// Semua route siswa butuh JWT login (role: siswa)
router.use(authenticate);
router.use(requireRole('siswa'));
router.use(resolveSiswa);

// Mobile: Cek Jadwal Ujian beserta opsi keamanan dengan token
// GET /api/siswa/jadwal-ujian?token=ABCDEF
router.get('/jadwal-ujian', siswaUjianController.getJadwalByToken);
router.post('/ujian/mulai', siswaUjianController.mulaiUjian);
router.get('/ujian/aktif', siswaUjianController.getUjianAktif);
router.put('/ujian/:ujianSiswaId/save', siswaUjianController.saveProgress);
router.post('/ujian/:ujianSiswaId/submit', siswaUjianController.submitUjian);
router.get('/ujian/riwayat', siswaUjianController.getRiwayatUjian);
router.get('/ujian/:ujianSiswaId/hasil', siswaUjianController.getHasilUjian);
router.delete('/ujian/:ujianSiswaId/cancel-waiting', siswaUjianController.cancelWaitingUjian);

module.exports = router;

