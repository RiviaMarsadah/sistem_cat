# CAT System - Computer Assisted Test

Sistem ujian online untuk Admin, Guru, dan Siswa.

## Struktur Proyek

```
Website CAT/
├── backend/          # Express.js API Server
├── frontend/         # React + Vite Web Application
└── docs/             # Dokumentasi proyek
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env sesuai konfigurasi database Anda
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend
npm install
# File .env sudah dibuat, sesuaikan jika perlu
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Konfigurasi Awal

### Backend (.env)
- `PORT=3000` - Port server
- `DB_HOST=localhost` - MySQL host
- `DB_USER=root` - MySQL user
- `DB_PASSWORD=` - MySQL password
- `DB_NAME=cat_system` - Database name
- `JWT_SECRET` - Secret key untuk JWT
- `FRONTEND_URL=http://localhost:5173` - Frontend URL untuk CORS

### Frontend (.env)
- `VITE_API_URL=http://localhost:3000/api` - Backend API URL
- `VITE_SOCKET_URL=http://localhost:3000` - Socket.io URL

## Status Konfigurasi

✅ Backend structure ready
✅ Frontend structure ready
✅ API service configured
✅ Authentication context ready
✅ Routing setup
✅ Socket.io configured

## Next Steps

1. **Setup Database**: Buat database MySQL dan tabel-tabel sesuai schema
2. **Implement Authentication**: Buat API login/register
3. **Build Features**: Mulai implementasi fitur sesuai dokumentasi

Lihat `DETAIL_RANCANGAN_PROYEK_CAT.md` untuk dokumentasi lengkap.

