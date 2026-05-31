const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// 1. Pencarian persis (exact match) data detail siswa
router.post('/siswa/search', publicController.searchStudent);

// 2. Mendapatkan daftar kelas dengan nama lengkap tingkat + prodi + inisial
router.get('/classes', publicController.getClasses);

// 3. Mendapatkan daftar agama unik untuk dropdown default
router.get('/religions', publicController.getReligions);

// 4. Mengajukan pendaftaran mandiri (Kirim OTP via email)
router.post('/siswa/register/request', publicController.requestOtp);

// 5. Memverifikasi OTP dan menyimpan siswa ke database
router.post('/siswa/register/verify', publicController.verifyOtp);

module.exports = router;
