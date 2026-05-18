# 4.1.2 Implementasi Kode (Backend)

Hasil implementasi kode backend pada sistem CAT ini dibangun menggunakan Node.js dengan framework Express sebagai web server dan API server. Prisma ORM digunakan sebagai media komunikasi antara aplikasi dengan database MySQL, sementara Socket.io dipakai untuk menangani komunikasi real-time antar client. Seluruh kode backend ditulis menggunakan bahasa pemrograman JavaScript dengan pendekatan modular, yaitu memisahkan setiap tanggung jawab ke dalam direktori yang berbeda seperti controllers, routes, middleware, dan config. Berikut merupakan图文 struktur direktori backend serta penjelasan dari potongan kode program yang dianggap penting dalam pembangunan sistem CAT.

**[][Gambar 4.17 Struktur Direktori Backend]**
*placeholder: screenshot struktur direktori backend (backend/src/)*

Gambar 4.17 merupakan图文 struktur direktori dari folder `backend/src/` yang menunjukkan pengorganisasian kode backend secara modular. Folder `config/` berisi konfigurasi database, environment, Google OAuth, dan Prisma client. Folder `controllers/` berisi seluruh logique bisnis sistem yang terbagi ke dalam file-file terpisah sesuai fitur, seperti `authController.js` untuk autentikasi, `bankSoalController.js` untuk bank soal, `siswaUjianController.js` untuk ujian siswa, dan lain-lain. Folder `middleware/` berisi fungsi middleware seperti autentikasi JWT, проверка peran, dan resolver data siswa serta guru. Folder `routes/` berisi pendefinisian endpoint API yang menghubungkan route dengan controller yang bersesuaian. Pendekatan modular ini bertujuan untuk memudahkan dalam pengelolaan, perawatan, dan pengembangan kode secara berkelanjutan.

---

## 4.1.2.1 Konfigurasi Server Utama

**[][Gambar 4.18 Konfigurasi Server Utama (server.js)]**
*placeholder: screenshot atau potogan kode server.js*

Gambar 4.18 merupakan图文 potongan kode pada file `server.js` yang merupakan entry point utama dalam menjalankan server sistem CAT. Kode ini bertanggung jawab dalam membuat HTTP server menggunakan modul `http` bawaan Node.js, menginisialisasi Socket.io untuk komunikasi real-time, serta mendengarkan permintaan client pada port yang telah ditentukan.

Potongan kode program server.js adalah sebagai berikut:

```javascript
require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Attach io to app
app.set('io', io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
```

Kode program di atas menunjukkan bahwa server menggunakan modul `http.createServer(app)` untuk membungkus aplikasi Express ke dalam HTTP server. Socket.io dikonfigurasi dengan opsi CORS yang mengizinkan akses dari alamat frontend yang telah ditentukan pada environment variable. Setiap koneksi client yang terhubung ke Socket.io akan dicatat melalui event `connection` dan `disconnect`. Server mendengarkan pada port yang ditentukan oleh environment variable atau default ke port 3000 jika tidak ditemukan konfigurasi.

---

## 4.1.2.2 Konfigurasi Prisma ORM

**[][Gambar 4.19 Konfigurasi Prisma ORM (prisma.js)]**
*placeholder: screenshot atau potongan kode prisma.js*

Gambar 4.19 merupakan图文 potongan kode pada file `config/prisma.js` yang berfungsi sebagai klien Prisma ORM untuk berinteraksi dengan database MySQL. Prisma ORM dipilih karena mampu memberikan type-safety dan query builder yang intuitif dalam pengelolaan basis data relasional.

Potongan kode program prisma.js adalah sebagai berikut:

```javascript
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
```

Kode program di atas menginisialisasi instance `PrismaClient` yang kemudian diekspor dan dapat digunakan di seluruh file controller. Pada kondisi lingkungan pengembangan (`development`), Prisma akan mencatat semua query, error, dan warning ke console, sedangkan pada kondisi produksi hanya error yang dicatat. Proses disconnect dilakukan secara otomatis pada saat aplikasi dimatikan melalui event `beforeExit`.

---

## 4.1.2.3 Konfigurasi Aplikasi Express

**[][Gambar 4.20 Konfigurasi Aplikasi Express (app.js)]**
*placeholder: screenshot atau potongan kode app.js*

Gambar 4.20 merupakan图文 potongan kode pada file `src/app.js` yang merupakan konfigurasi utama aplikasi Express. File ini mendefinisikan seluruh middleware yang digunakan, konfigurasi static file untuk melayani file upload, serta pendefinisian route API utama sistem CAT.

Potongan kode program app.js adalah sebagai berikut:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware - CORS (dev: izinkan semua akses untuk tes dari HP lain sejaringan)
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (untuk uploads & templates)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CAT Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/siswa', require('./routes/siswa'));

// Error handler middleware (harus di akhir)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
```

Kode program di atas menunjukkan bahwa Express dikonfigurasi dengan middleware CORS yang mengizinkan semua origin pada kondisi pengembangan, JSON body parser dengan batas ukuran 10MB untuk mengakomodasi data yang besar, serta static file serving untuk file upload dan template. Terdapat route health check di `/api/health` yang berguna untuk memeriksa apakah server berjalan dengan baik. Empat route utama注册 yaitu `/api/auth`, `/api/admin`, `/api/guru`, dan `/api/siswa` yang masing-masing mengarah ke file route yang bersesuaian. Error handler dan 404 handler ditempatkan di akhir middleware chain agar selalu dieksekusi ketika tidak ada middleware lain yang merespons.

---

## 4.1.2.4 Implementasi Route API

**[][Gambar 4.21 Route API Auth (routes/auth.js)]**
*placeholder: screenshot atau potongan kode routes/auth.js*

Gambar 4.21 merupakan图文 potongan kode pada file `routes/auth.js` yang mendefinisikan endpoint-endpoint untuk keperluan autentikasi pengguna dalam sistem CAT. Route ini menangani proses login menggunakan Google OAuth untuk platform web dan mobile, serta logout dan pengambilan profil pengguna.

Potongan kode program routes/auth.js adalah sebagai berikut:

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Google OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
// Login Google untuk mobile (pakai Google Sign-In idToken, bukan redirect)
router.post('/google', authController.mobileGoogleLogin);

// Profile routes (protected)
router.get('/profile', authenticate, authController.getProfile);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
```

**[][Gambar 4.22 Route API Admin (routes/admin.js)]**
*placeholder: screenshot atau potongan kode routes/admin.js*

Gambar 4.22 merupakan图文 potongan kode pada file `routes/admin.js` yang mendefinisikan endpoint-endpoint untuk keperluan pengelolaan data master oleh administrator sistem. Route ini melindungi seluruh endpoint dengan middleware autentikasi JWT dan проверка peran admin.

Potongan kode program routes/admin.js (sebagian) adalah sebagai berikut:

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// ... (import controller lainnya)

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
// ... dst

// Siswa Import Excel
router.post('/siswa/import', upload.single('file'), adminSiswaController.importSiswa);

// Guru Import Excel
router.post('/guru/import', upload.single('file'), adminGuruController.importGuru);

// Jadwal Ujian
router.post('/jadwal-ujian/bulk-generate', adminJadwalController.bulkGenerate);

module.exports = router;
```

**[][Gambar 4.23 Route API Guru (routes/guru.js)]**
*placeholder: screenshot atau potongan kode routes/guru.js*

Gambar 4.23 merupakan图文 potongan kode pada file `routes/guru.js` yang mendefinisikan endpoint-endpoint untuk keperluan pengelolaan bank soal, paket ujian, jadwal ujian, rekap hasil, dan analisis soal oleh guru. Route ini dilindungi dengan middleware autentikasi JWT dan проверка peran guru.

Potongan kode program routes/guru.js (sebagian) adalah sebagai berikut:

```javascript
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.use(requireRole('guru'));
router.use(resolveGuru);

// Bank Soal CRUD & Import
router.get('/bank-soal', bankSoalController.list);
router.post('/bank-soal', bankSoalController.create);
router.put('/bank-soal/:id', bankSoalController.update);
router.delete('/bank-soal/:id', bankSoalController.remove);
router.post('/bank-soal/import', upload.single('file'), bankSoalImportController.importExcel);
router.get('/bank-soal/template', bankSoalImportController.downloadTemplate);

// Jadwal Ujian Custom
router.post('/jadwal-ujian/custom', guruJadwalController.createCustom);

// Analisis Soal
router.get('/analisis/paket/:id', guruAnalisisController.getQuestionAnalysis);

module.exports = router;
```

**[][Gambar 4.24 Route API Siswa — Mobile (routes/siswa.js)]**
*placeholder: screenshot atau potongan kode routes/siswa.js*

Gambar 4.24 merupakan图文 potongan kode pada file `routes/siswa.js` yang mendefinisikan endpoint-endpoint untuk keperluan ujian siswa yang diakses melalui aplikasi mobile. Route ini dilindungi dengan middleware autentikasi JWT, проверка peran siswa, serta resolve siswa untuk memuat data siswa dari database.

Potongan kode program routes/siswa.js adalah sebagai berikut:

```javascript
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
router.get('/jadwal-ujian', siswaUjianController.getJadwalByToken);
router.get('/ujian/hari-ini', siswaUjianController.getJadwalHariIni);
router.post('/ujian/mulai', siswaUjianController.mulaiUjian);
router.get('/ujian/aktif', siswaUjianController.getUjianAktif);
router.put('/ujian/:ujianSiswaId/save', siswaUjianController.saveProgress);
router.post('/ujian/:ujianSiswaId/submit', siswaUjianController.submitUjian);
router.get('/ujian/riwayat', siswaUjianController.getRiwayatUjian);
router.get('/ujian/:ujianSiswaId/hasil', siswaUjianController.getHasilUjian);
router.delete('/ujian/:ujianSiswaId/cancel-waiting', siswaUjianController.cancelWaitingUjian);

module.exports = router;
```

---

## 4.1.2.5 Implementasi Autentikasi (JWT + Google OAuth)

**[][Gambar 4.25 Middleware Autentikasi JWT (middleware/auth.js)]**
*placeholder: screenshot atau potongan kode middleware/auth.js*

Gambar 4.25 merupakan图文 potongan kode pada file `middleware/auth.js` yang merupakan middleware untuk memverifikasi dan mendekode JWT token yang dikirimkan oleh client melalui header Authorization. Middleware ini memastikan bahwa setiap permintaan yang masuk memiliki token yang valid dan tidak kedaluwarsa.

Potongan kode program middleware/auth.js adalah sebagai berikut:

```javascript
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = authenticate;
```

**[][Gambar 4.26 Controller Autentikasi — Mobile Login (authController.js)]**
*placeholder: screenshot atau potongan kode authController.js*

Gambar 4.26 merupakan图文 potongan kode pada file `authController.js` yang menangani proses autentikasi Google Sign-In untuk platform mobile. Berbeda dengan platform web yang menggunakan redirect OAuth, mobile menggunakan verifikasi `idToken` secara langsung dari Google Sign-In SDK yang dikirimkan oleh aplikasi mobile.

Potongan kode program fungsi `mobileGoogleLogin` pada authController.js adalah sebagai berikut:

```javascript
// Google Sign-In untuk mobile (idToken langsung dari client)
exports.mobileGoogleLogin = async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'idToken is required'
    });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid idToken'
    });
  }

  const email = (payload?.email || '').trim().toLowerCase();
  const picture = payload?.picture || null;
  const googleId = payload?.sub || null;

  if (!email || !googleId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid idToken'
    });
  }

  // Cari user berdasarkan email.
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      guru: true,
      siswa: {
        include: {
          kelas: {
            include: {
              jurusan: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Validasi akses mobile sementara: cukup berdasarkan `users.role`
  if (user.role !== 'siswa') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya akun siswa yang dapat menggunakan aplikasi ini.'
    });
  }

  // Update Google linkage (idempotent)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleId: googleId,
      googlePicture: picture,
      googleLinked: true
    }
  });

  const token = jwt.sign(
    {
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return res.status(200).json({
    success: true,
    token,
    user: userData
  });
};
```

---

## 4.1.2.6 Implementasi Route Admin (CRUD Data Master)

**[][Gambar 4.27 Controller Admin — Manajemen Siswa (adminSiswaController.js)]**
*placeholder: screenshot atau potongan kode adminSiswaController.js*

Gambar 4.27 merupakan图文 potongan kode pada file `adminSiswaController.js` yang menangani keseluruhan operasi CRUD data siswa serta fitur import data siswa dari file Excel. Controller ini digunakan oleh admin untuk mengelola data siswa yang akan menggunakan aplikasi ujian mobile.

Potongan kode program fungsi `importSiswa` pada adminSiswaController.js adalah sebagai berikut:

```javascript
// Fungsi importSiswa — membaca file Excel dan bulk insert/update data siswa
exports.importSiswa = async (req, res) => {
  // ... (multer upload handling)
  const worksheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Proses parsing baris per baris dari Excel
  // Buat user + siswa record di database
  // Return hasil import (jumlah berhasil, gagal, duplikat)
};
```

---

## 4.1.2.7 Implementasi Route Guru (Bank Soal & Jadwal Ujian)

**[][Gambar 4.28 Controller Bank Soal (bankSoalController.js)]**
*placeholder: screenshot atau potongan kode bankSoalController.js*

Gambar 4.28 merupakan图文 potongan kode pada file `bankSoalController.js` yang menangani operasi CRUD bank soal dengan dukungan tiga tipe soal, yaitu Pilihan Ganda (pilgan), Pilihan Ganda Kompleks (pilgan_kompleks), dan Pilihan Ganda Kategori Benar/Salah (pilgan_kategori). Setiap tipe soal memiliki schema validasi yang berbeda untuk memastikan data yang masuk sesuai dengan format yang telah ditentukan.

Potongan kode program schema validasi pada bankSoalController.js adalah sebagai berikut:

```javascript
const KATEGORI = ['pilgan', 'pilgan_kompleks', 'pilgan_kategori'];
const TINGKAT = ['X', 'XI', 'XII', 'SEMUA'];

const baseSchema = {
  bankSoalKoleksiId: Joi.number().integer().positive().allow(null).optional(),
  mataPelajaranId: Joi.number().integer().positive().required(),
  tingkat: Joi.string().valid(...TINGKAT).required(),
  kategoriSoal: Joi.string().valid(...KATEGORI).required(),
};

const singleChoiceSchema = Joi.object({
  ...baseSchema,
  soal: Joi.string().trim().min(1).required(),
  kolomA: Joi.string().trim().max(500).allow('', null),
  kolomB: Joi.string().trim().max(500).allow('', null),
  kolomC: Joi.string().trim().max(500).allow('', null),
  kolomD: Joi.string().trim().max(500).allow('', null),
  kolomE: Joi.string().trim().max(500).allow('', null),
  kolomF: Joi.string().trim().max(500).allow('', null),
  jawaban: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),
  gambar: Joi.string().trim().max(500).allow('', null),
}).custom((value, helpers) => {
  const cols = [value.kolomA, value.kolomB, value.kolomC, value.kolomD, value.kolomE, value.kolomF].filter(Boolean);
  if (cols.length < 3) return helpers.message('Minimal 3 kolom jawaban harus diisi');
  return value;
});

const multiChoiceSchema = Joi.object({
  ...baseSchema,
  jawaban: Joi.string().pattern(/^[A-F](,[A-F])*$/).required().messages({
    'string.pattern.base': 'Jawaban harus huruf A-F dipisah koma, contoh: A,B,F',
  }),
  // ... kolom lainnya
});

const benarSalahSchema = Joi.object({
  ...baseSchema,
  jawaban: Joi.string().pattern(/^[BS](,[BS])*$/).required().messages({
    'string.pattern.base': 'Jawaban benar/salah: B atau S dipisah koma, contoh: B,B,S',
  }),
  // ... kolom lainnya
});
```

**[][Gambar 4.29 Controller Jadwal Ujian — Generate Token (guruJadwalController.js)]**
*placeholder: screenshot atau potongan kode guruJadwalController.js*

Gambar 4.29 merupakan图文 potongan kode pada file `guruJadwalController.js` yang menangani operasi pengelolaan jadwal ujian, termasuk pembuatan token ujian secara otomatis. Token digunakan sebagai keamanan akses bagi siswa sebelum mengikuti ujian.

Potongan kode program fungsi `generateToken` dan `createCustom` pada guruJadwalController.js adalah sebagai berikut:

```javascript
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

// 5. Create Ujian Custom
exports.createCustom = async (req, res) => {
  const guruId = req.guruId;
  const { nama, mataPelajaranId, paketUjianId, mulai, selesai, durasi, opsiKeamanan, kelasIds } = req.body;

  // ... validasi input

  try {
    const token = await generateToken();

    const result = await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalUjian.create({
        data: {
          nama: nama,
          kategori: 'custom',
          mataPelajaranId: Number(mataPelajaranId),
          mulai: new Date(mulai),
          selesai: new Date(selesai),
          durasi: Number(durasi),
          token,
          tokenCheckOut: await generateToken(), // Token keluar khusus custom exam
          paketUjianId: Number(paketUjianId),
          guruId: guruId,
          opsiKeamanan: Boolean(opsiKeamanan)
        }
      });

      for (const kelasId of kelasIds) {
        await tx.kelasJadwal.create({
          data: {
            jadwalUjianId: jadwal.id,
            kelasId: Number(kelasId)
          }
        });
      }

      return jadwal;
    });

    return res.json({ success: true, message: 'Ujian Custom berhasil dibuat', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal membuat ujian custom' });
  }
};
```

---

## 4.1.2.8 Implementasi Route Siswa (API Mobile Ujian)

**[][Gambar 4.30 Controller Ujian Siswa — Algoritma Pengacakan (siswaUjianController.js)]**
*placeholder: screenshot atau potongan kode siswaUjianController.js*

Gambar 4.30 merupakan图文 potongan kode pada file `siswaUjianController.js` yang menangani keseluruhan logic ujian siswa, termasuk algoritma pengacakan soal menggunakan random seed. Setiap siswa akan mendapatkan urutan soal dan pilihan jawaban yang berbeda karena menggunakan seed yang unik dan berbeda pada setiap sesi ujian.

Potongan kode program algoritma `seededShuffle` dan fungsi `mulaiUjian` pada siswaUjianController.js adalah sebagai berikut:

```javascript
function seededShuffle(items, seed) {
  const arr = [...items];
  let state = seed >>> 0;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000; // 4.294.967.296
  };

  for (let i = arr.length - 1; i > 0; i--) { // Fisher-Yates shuffle algorithm
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

exports.mulaiUjian = async (req, res) => {
  const siswaId = req.siswaId;
  const token = String(req.body?.token || '').trim().toUpperCase();
  const jadwalUjianId = req.body?.jadwalUjianId ? Number(req.body.jadwalUjianId) : undefined;

  try {
    const whereClause = { token };
    if (jadwalUjianId) {
      whereClause.id = jadwalUjianId;
    }

    const jadwal = await prisma.jadwalUjian.findFirst({
      where: whereClause,
      include: {
        paketUjian: {
          include: {
            soalPaket: {
              include: { bankSoal: true }
            }
          }
        }
      }
    });

    if (!jadwal || !jadwal.paketUjianId) {
      return res.status(404).json({ success: false, message: 'Jadwal/Paket ujian tidak valid.' });
    }

    const existing = await prisma.ujianSiswa.findUnique({
      where: { siswaId_jadwalUjianId: { siswaId, jadwalUjianId: jadwal.id } }
    });

    if (existing && existing.status === 'selesai') {
      return res.status(400).json({
        success: false, message: `Anda sudah mengerjakannya dan telah selesai ujian ini.`
      });
    }

    let ujian = existing;

    if (!ujian) {
      const seed = Math.floor(Math.random() * 1000000000);
      const shuffled = seededShuffle(jadwal.paketUjian.soalPaket, seed);

      const now = new Date();
      const status = now < jadwal.mulai ? 'waiting' : 'berlangsung';

      ujian = await prisma.ujianSiswa.create({
        data: {
          siswaId,
          jadwalUjianId: jadwal.id,
          status: status,
          randomSeed: seed,
          totalSoal: shuffled.length,
          jawabanSiswa: {
            create: shuffled.map((sp, idx) => ({
              bankSoalId: sp.bankSoalId,
              nomorSoal: idx + 1,
              tipeSoal: sp.bankSoal.kategoriSoal,
              statusJawaban: 'kosong',
            })),
          },
        },
        include: {
          jawabanSiswa: { include: { bankSoal: true }, orderBy: { nomorSoal: 'asc' } },
        },
      });
    }

    const soal = ujian.jawabanSiswa.map((j) => mapBankSoalToQuestion(j.bankSoal, j.nomorSoal, j));

    return res.json({
      success: true,
      data: {
        serverTime: new Date(),
        ujianSiswaId: ujian.id,
        status: ujian.status,
        mulaiPada: ujian.mulaiPada,
        jadwalUjian: {
          id: jadwal.id,
          nama: jadwal.nama,
          durasi: jadwal.durasi,
          selesai: jadwal.selesai,
          opsiKeamanan: jadwal.opsiKeamanan
        },
        soal,
        totalQuestions: soal.length,
      },
    });
  } catch(err) {
    console.error('siswaUjian mulaiUjian error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memulai ujian' });
  }
};
```

**[][Gambar 4.31 Controller Ujian Siswa — Auto Save (Smart Sync) (siswaUjianController.js)]**
*placeholder: screenshot atau potongan kode siswaUjianController.js*

Gambar 4.31 merupakan图文 potongan kode pada file `siswaUjianController.js` yang menangani operasi penyimpanan progres jawaban siswa secara otomatis (Smart Sync). Fitur ini memungkinkan jawaban siswa tersimpan ke database secara real-time tanpa harus menunggu siswa menekan tombol submit, sehingga menjaga agar data jawaban tidak hilang ketika terjadi masalah koneksi atau aplikasi ditutup secara tidak sengaja.

Potongan kode program fungsi `saveProgress` pada siswaUjianController.js adalah sebagai berikut:

```javascript
exports.saveProgress = async (req, res) => {
  const siswaId = req.siswaId;
  const ujianSiswaId = Number(req.params.ujianSiswaId);
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  try {
    const ujian = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: { jawabanSiswa: true },
    });

    if (!ujian || ujian.siswaId !== siswaId || ujian.status !== 'berlangsung') {
      return res.status(404).json({ success: false, message: 'Sesi ujian tidak valid atau sudah selesai' });
    }

    const answerMap = new Map();
    for (const a of answers) {
      const key = Number(a?.bankSoalId);
      answerMap.set(key, { jawabanSiswa: a?.jawabanSiswa ?? '', statusJawaban: a?.statusJawaban });
    }

    const updates = [];
    ujian.jawabanSiswa.forEach((row) => {
      const incoming = answerMap.get(row.bankSoalId);
      if (incoming) {
        const statusJawaban = getStatusFromAnswer(incoming.jawabanSiswa, incoming.statusJawaban);
        updates.push(prisma.jawabanSiswa.update({
          where: { id: row.id },
          data: {
            jawabanSiswa: incoming.jawabanSiswa ? String(incoming.jawabanSiswa) : null,
            statusJawaban,
          },
        }));
      }
    });

    if (updates.length > 0) await prisma.$transaction(updates);

    return res.json({ success: true, message: 'Progress berhasil disimpan' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan progress ujian' });
  }
};
```

**[][Gambar 4.32 Controller Ujian Siswa — Submit & Penskoran (siswaUjianController.js)]**
*placeholder: screenshot atau potongan kode siswaUjianController.js*

Gambar 4.32 merupakan图文 potongan kode pada file `siswaUjianController.js` yang menangani operasi submit jawaban siswa beserta penskoran otomatis. Sistem penskoran berbeda untuk setiap tipe soal: Pilihan Ganda menggunakan perbandingan string sederhana, Pilihan Ganda Kompleks menggunakan normalisasi dan sorting sebelum dibandingkan, dan Pilihan Ganda Kategori menggunakan normalisisasi tanpa sorting untuk menjaga urutan Benar/Salah.

Potongan kode program fungsi `scoreByType` dan `submitUjian` pada siswaUjianController.js adalah sebagai berikut:

```javascript
function scoreByType(tipeSoal, kunci, jawaban) {
  const k = normalizeAnswer(kunci);
  const j = normalizeAnswer(jawaban);

  if (!j) return { isBenar: false, skorItem: 0 };

  if (tipeSoal === 'pilgan') {
    return { isBenar: k === j, skorItem: k === j ? 1 : 0 };
  }

  if (tipeSoal === 'pilgan_kompleks') {
    const kk = normalizeMulti(k);
    const jj = normalizeMulti(j);
    return { isBenar: kk === jj, skorItem: kk === jj ? 1 : 0 };
  }

  if (tipeSoal === 'pilgan_kategori') {
    const kk = normalizeCategory(k);
    const jj = normalizeCategory(j);
    return { isBenar: kk === jj, skorItem: kk === jj ? 1 : 0 };
  }

  return { isBenar: false, skorItem: 0 };
}

exports.submitUjian = async (req, res) => {
  const siswaId = req.siswaId;
  const ujianSiswaId = Number(req.params.ujianSiswaId);
  const tokenCheckOut = String(req.body?.tokenCheckOut || '').trim().toUpperCase();
  const isTimeUp = req.body?.isTimeUp === true;
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  if (!isTimeUp && (!tokenCheckOut || tokenCheckOut.length !== 6)) {
    return res.status(400).json({ success: false, message: 'Token Checkout wajib 6 karakter.' });
  }

  try {
    const ujian = await prisma.ujianSiswa.findUnique({
      where: { id: ujianSiswaId },
      include: {
        jawabanSiswa: { include: { bankSoal: true } },
        jadwalUjian: {
          select: {
            tokenCheckOut: true,
            mulai: true,
            durasi: true,
            selesai: true
          }
        }
      },
    });

    if (!ujian || ujian.siswaId !== siswaId || ujian.status === 'selesai') {
      return res.status(404).json({ success: false, message: 'Sesi ujian tidak valid atau sudah disubmit.' });
    }

    // Verifikasi Token atau Timeout
    if (isTimeUp) {
      const now = new Date();
      const startTime = new Date(ujian.mulaiPada);
      const examEndTime = new Date(startTime.getTime() + ujian.jadwalUjian.durasi * 60000);
      const scheduleEndTime = new Date(ujian.jadwalUjian.selesai);

      const deadline = examEndTime < scheduleEndTime ? examEndTime : scheduleEndTime;

      // Beri toleransi 30 detik untuk delay network
      if (now.getTime() < (deadline.getTime() - 30000)) {
        return res.status(400).json({
          success: false,
          message: 'Bypass token ditolak. Waktu ujian di server masih tersedia.'
        });
      }
    } else {
      if (ujian.jadwalUjian.tokenCheckOut !== tokenCheckOut) {
        return res.status(400).json({ success: false, message: 'Token Checkout salah atau tidak valid.' });
      }
    }

    let benar = 0, salah = 0, kosong = 0, raguRagu = 0;

    await prisma.$transaction(
      ujian.jawabanSiswa.map((row) => {
        const incoming = answerMap.get(row.bankSoalId) || { jawabanSiswa: row.jawabanSiswa || '', statusJawaban: row.statusJawaban };
        const statusJawaban = getStatusFromAnswer(incoming.jawabanSiswa, incoming.statusJawaban);
        const { isBenar, skorItem } = scoreByType(row.tipeSoal, row.bankSoal.jawaban, incoming.jawabanSiswa);

        if (statusJawaban === 'kosong') kosong += 1;
        else if (statusJawaban === 'ragu_ragu') raguRagu += 1;

        if (isBenar) {
          benar += 1;
        } else {
          salah += 1;
        }

        return prisma.jawabanSiswa.update({
          where: { id: row.id },
          data: {
            jawabanSiswa: incoming.jawabanSiswa ? String(incoming.jawabanSiswa) : null,
            statusJawaban, isBenar, skorItem,
          },
        });
      })
    );

    const totalSoal = ujian.jawabanSiswa.length;
    const nilaiAkhir = totalSoal > 0 ? Number(((benar / totalSoal) * 100).toFixed(2)) : 0;

    await prisma.ujianSiswa.update({
      where: { id: ujianSiswaId },
      data: { status: 'selesai', benar, salah, kosong, raguRagu, nilaiAkhir, selesaiPada: new Date() },
    });

    return res.json({
      success: true, message: 'Jawaban berhasil disubmit dan dinilai secara otomatis',
      data: { ujianSiswaId, totalSoal, benar, salah, kosong, raguRagu, nilaiAkhir },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mensubmit ujian' });
  }
};
```

---

## 4.1.2.9 Implementasi Algoritma Pengacakan Soal

**[][Gambar 4.33 Implementasi Algoritma Fisher-Yates Shuffle dengan Random Seed (siswaUjianController.js)]**
*placeholder: screenshot atau potongan kode siswaUjianController.js*

Gambar 4.33 merupakan图文 potongan kode pada file `siswaUjianController.js` yang mendemonstrasikan implementasi algoritma Fisher-Yates Shuffle yang dimodifikasi menggunakan Linear Congruential Generator (LCG) sebagai pseudo-random number generator yang seedable. Algoritma ini digunakan untuk memastikan bahwa setiap siswa mendapatkan urutan soal yang berbeda namun tetap deterministik berdasarkan seed yang diberikan.

Potongan kode program lengkap fungsi `seededShuffle` dan fungsi normalisasi jawaban adalah sebagai berikut:

```javascript
function normalizeAnswer(v) {
  return (v || '').toString().trim().toUpperCase();
}

function normalizeMulti(v) {
  const parts = normalizeAnswer(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const uniq = [...new Set(parts)];
  uniq.sort();
  return uniq.join(',');
}

function normalizeCategory(v) {
  // Untuk kategori (B/S), urutan sangat penting dan duplikat (B,B,S) adalah sah.
  // Jadi JANGAN di-sort atau di-uniq.
  return normalizeAnswer(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(',');
}

function getStatusFromAnswer(raw, fallbackStatus) {
  if (fallbackStatus && ['dijawab', 'kosong', 'ragu_ragu'].includes(fallbackStatus)) return fallbackStatus;
  const n = normalizeAnswer(raw);
  if (!n) return 'kosong';
  return 'dijawab';
}

function seededShuffle(items, seed) {
  const arr = [...items];
  let state = seed >>> 0;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000; // 4.294.967.296
  };

  for (let i = arr.length - 1; i > 0; i--) { // Fisher-Yates shuffle algorithm
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

Kode program di atas menunjukkan bahwa fungsi `seededShuffle` menggunakan Linear Congruential Generator (LCG) dengan konstanta `a = 1664525` dan `c = 1013904223` untuk menghasilkan bilangan pseudo-random yang deterministik. Konstanta ini merupakan parameter yang umum digunakan dalam implementasi LCG dan memberikan perioda yang memadai untuk pengacakan soal ujian. Untuk tipe soal Pilihan Ganda Kompleks, jawaban yang benar akan di-sort terlebih dahulu sebelum dibandingkan untuk mengakomodasi jawaban yang memiliki multiple correct option dengan urutan berbeda. Untuk tipe soal Kategori Benar/Salah, jawaban tidak di-sort karena urutan Benar/Salah pada setiap pernyataan bersifat krusial.