const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const jurusanController = require('../controllers/jurusanController');
const kelasController = require('../controllers/kelasController');
const userController = require('../controllers/userController');
const mataPelajaranController = require('../controllers/mataPelajaranController');
const adminSiswaController = require('../controllers/adminSiswaController');
const adminGuruController = require('../controllers/adminGuruController');
const adminJadwalController = require('../controllers/adminJadwalController');
const adminPeriodeController = require('../controllers/adminPeriodeController');
const adminAngkatanController = require('../controllers/adminAngkatanController');
const adminSyncController = require('../controllers/adminSyncController');

// All admin routes are protected
router.use(authenticate);
router.use(requireRole('admin'));

// Jurusan CRUD
router.get('/jurusan', jurusanController.list);
router.post('/jurusan', jurusanController.create);
router.get('/jurusan/:id', jurusanController.getById);
router.put('/jurusan/:id', jurusanController.update);
router.delete('/jurusan/:id', jurusanController.remove);

// Mata Pelajaran CRUD
router.get('/mata-pelajaran', mataPelajaranController.list);
router.post('/mata-pelajaran', mataPelajaranController.create);
router.get('/mata-pelajaran/:id', mataPelajaranController.getById);
router.put('/mata-pelajaran/:id', mataPelajaranController.update);
router.delete('/mata-pelajaran/:id', mataPelajaranController.remove);

// Kelas CRUD
router.get('/kelas', kelasController.list);
router.post('/kelas', kelasController.create);
router.get('/kelas/:id', kelasController.getById);
router.put('/kelas/:id', kelasController.update);
router.delete('/kelas/:id', kelasController.remove);

// User CRUD (Master Data)
router.get('/user', userController.list);
router.post('/user', userController.create);
router.get('/user/:id', userController.getById);
router.put('/user/:id', userController.update);
router.delete('/user/:id', userController.remove);

// Siswa CRUD (Unified)
router.get('/siswa', adminSiswaController.list);
router.post('/siswa', adminSiswaController.create);
router.put('/siswa/:id', adminSiswaController.update);
router.delete('/siswa/:id', adminSiswaController.remove);
router.post('/siswa/import', upload.single('file'), adminSiswaController.importSiswa);

// Guru CRUD (Unified)
router.get('/guru', adminGuruController.list);
router.post('/guru', adminGuruController.create);
router.put('/guru/:id', adminGuruController.update);
router.delete('/guru/:id', adminGuruController.remove);
router.post('/guru/import', upload.single('file'), adminGuruController.importGuru);

// Periode Ujian
router.get('/periode', adminPeriodeController.list);
router.post('/periode', adminPeriodeController.create);
router.put('/periode/:id', adminPeriodeController.update);
router.delete('/periode/:id', adminPeriodeController.remove);

// Angkatan CRUD
router.get('/angkatan', adminAngkatanController.list);
router.post('/angkatan', adminAngkatanController.create);
router.get('/angkatan/:id', adminAngkatanController.getById);
router.put('/angkatan/:id', adminAngkatanController.update);
router.delete('/angkatan/:id', adminAngkatanController.remove);

// Jadwal Ujian
router.get('/jadwal-ujian/admin', adminJadwalController.list); // List official only
router.post('/jadwal-ujian/bulk-generate', adminJadwalController.bulkGenerate);
router.delete('/jadwal-ujian/:id', adminJadwalController.remove);

// API Sync
router.get('/sync/analyze', adminSyncController.analyze);
router.post('/sync/execute', adminSyncController.execute);

module.exports = router;


