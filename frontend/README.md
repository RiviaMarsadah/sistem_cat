# CAT Frontend

Frontend web application untuk sistem Computer Assisted Test (CAT) menggunakan React + Vite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

3. Jalankan development server:
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## Build untuk Production

```bash
npm run build
```

File hasil build akan ada di folder `dist/`

## Struktur Folder

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── layout/          # Layout components
│   ├── services/        # API services
│   ├── context/         # React Context (Auth, dll)
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Entry point
├── public/              # Static files
├── .env                 # Environment variables
└── vite.config.js       # Vite configuration
```

## Dependencies

- **react-router-dom** - Routing
- **axios** - HTTP client
- **react-icons** - Icons
- **socket.io-client** - Real-time communication

## Next Steps

1. Implement halaman Login
2. Implement Admin Dashboard
3. Implement Guru Dashboard
4. Implement fitur-fitur sesuai dokumentasi
