# CAT Backend API

Backend API untuk sistem Computer Assisted Test (CAT).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env` (copy dari `.env.example`):
```bash
cp .env.example .env
```

3. Konfigurasi database di `.env`:
- Pastikan MySQL sudah running
- Sesuaikan DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

4. Jalankan server:
```bash
# Development mode (dengan nodemon)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## Struktur Folder

```
backend/
├── src/
│   ├── config/          # Konfigurasi (database, env)
│   ├── controllers/      # Controller untuk handle request
│   ├── models/          # Database models
│   ├── routes/          # Route definitions
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── services/        # Business logic services
│   └── app.js           # Express app setup
├── uploads/             # Folder untuk file upload
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json
```

## API Endpoints

- `GET /api/health` - Health check endpoint

## Next Steps

1. Setup database schema (buat tabel-tabel sesuai dokumentasi)
2. Implement authentication routes (`/api/auth`)
3. Implement admin routes (`/api/admin`)
4. Implement guru routes (`/api/guru`)
5. Implement siswa routes (`/api/siswa`)

