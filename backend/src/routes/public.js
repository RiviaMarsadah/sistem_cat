const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// 1. Pencarian data siswa secara real-time dan ter-filter aman
router.get('/siswa/search-realtime', publicController.searchRealtime);

// 2. Update NIS dan NISN siswa secara mandiri
router.put('/siswa/:id/nis-nisn', publicController.updateNisNisn);

module.exports = router;
