# Cara Menjalankan Seed Database

## 1. Pastikan Database Sudah Dibuat

Buat database `cat_system` di MySQL:

```sql
CREATE DATABASE cat_system;
```

## 2. Jalankan Migration

Jalankan migration untuk membuat tabel-tabel yang diperlukan (sesuai schema di dokumentasi).

## 3. Jalankan Seed

```bash
cd backend
node src/utils/seed.js
```

Atau jika menggunakan npm script, tambahkan di `package.json`:

```json
{
  "scripts": {
    "seed": "node src/utils/seed.js"
  }
}
```

Lalu jalankan:
```bash
npm run seed
```

## 4. User yang Akan Dibuat

Seed akan membuat 2 user:

1. **Ilham Pangestu**
   - Email: `gadinglalala121212@gmail.com`
   - Role: `guru`
   - Username: `ilham_pangestu`

2. **Rivia Marsadah**
   - Email: `riviadimong321@gmail.com`
   - Role: `guru`
   - Username: `rivia_marsadah`

## Catatan

- Seed akan skip jika user sudah ada (berdasarkan email)
- User dibuat tanpa password (karena menggunakan SSO Google)
- User otomatis dibuat sebagai guru di tabel `guru`

