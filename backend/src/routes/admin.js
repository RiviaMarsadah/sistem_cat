const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const jurusanController = require('../controllers/jurusanController');
const kelasController = require('../controllers/kelasController');
const userController = require('../controllers/userController');

// All admin routes are protected
router.use(authenticate);
router.use(requireRole('admin'));

// Jurusan CRUD
router.get('/jurusan', jurusanController.list);
router.post('/jurusan', jurusanController.create);
router.get('/jurusan/:id', jurusanController.getById);
router.put('/jurusan/:id', jurusanController.update);
router.delete('/jurusan/:id', jurusanController.remove);

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

module.exports = router;


