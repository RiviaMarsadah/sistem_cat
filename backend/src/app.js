const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware - CORS (dev: izinkan semua akses untuk tes dari HP lain sejaringan)
app.use(cors({ origin: true, credentials: true }));
// Settingan asli (dipertahankan, dikomen untuk referensi):
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:5173",
//   credentials: true
// }));

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
    timezone: process.env.TZ,
    serverTime: new Date().toString(),
    timestamp: new Date().toISOString()
  });
});

// DEBUG SEMENTARA: cek nilai .env yang terbaca server
app.get('/api/debug-env', (req, res) => {
  const dbUrl = process.env.DATABASE_URL || 'TIDAK ADA';
  const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DATABASE_URL_MASKED: masked,
    FRONTEND_URL: process.env.FRONTEND_URL,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  });
});

// DEBUG SEMENTARA: test koneksi MySQL langsung
app.get('/api/debug-db', async (req, res) => {
  const mysql = require('mysql2/promise');
  const host = process.env.DB_HOST || 'localhost';
  
  // Coba beberapa konfigurasi koneksi
  const configs = [
    { label: 'localhost+port', host: 'localhost', port: 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME },
    { label: '127.0.0.1+port', host: '127.0.0.1', port: 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME },
    { label: 'socket', socketPath: '/var/run/mysqld/mysqld.sock', user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME },
    { label: 'socket-mysql', socketPath: '/tmp/mysql.sock', user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME },
  ];

  const results = [];
  for (const cfg of configs) {
    const { label, ...connOpts } = cfg;
    try {
      const conn = await mysql.createConnection({ ...connOpts, connectTimeout: 5000 });
      await conn.query('SELECT 1');
      await conn.end();
      results.push({ label, status: 'SUKSES' });
    } catch (err) {
      results.push({ label, status: 'GAGAL', code: err.code, message: err.message });
    }
  }
  res.json({ results });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
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

