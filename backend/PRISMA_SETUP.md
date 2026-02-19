# Setup Prisma untuk CAT System

## 1. Konfigurasi Database URL

Tambahkan `DATABASE_URL` ke file `backend/.env`:

```env
DATABASE_URL="mysql://root@localhost:3306/db_cat"
```

**Format:**
- **Dengan password**: `mysql://username:password@host:port/database`
- **Tanpa password**: `mysql://username@host:port/database`

**Ganti**:
- `root` dengan username MySQL Anda
- `db_cat` dengan nama database Anda
- `3306` dengan port MySQL Anda (default 3306)

## 2. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

Atau:
```bash
npx prisma generate
```

## 3. Buat Migration

```bash
npm run prisma:migrate
```

Atau:
```bash
npx prisma migrate dev --name init
```

Saat diminta nama migration, ketik: `init`

Ini akan:
- Membuat tabel-tabel di database sesuai schema
- Menyimpan migration files di `prisma/migrations/`

## 4. Jalankan Seed

```bash
npm run seed
```

Atau:
```bash
npx prisma db seed
```

Seed akan membuat 2 user:
- **Ilham Pangestu** (gadinglalala121212@gmail.com) - Role: guru
- **Rivia Marsadah** (riviadimong321@gmail.com) - Role: guru

## 5. Prisma Studio (Optional)

Untuk melihat dan mengelola data di database:

```bash
npm run prisma:studio
```

Atau:
```bash
npx prisma studio
```

Akan membuka browser di `http://localhost:5555`

## Schema Database

Schema sudah include model dasar:
- **User** - Tabel users dengan Google OAuth support
- **Guru** - Data guru
- **Siswa** - Data siswa
- **MataPelajaran** - Mata pelajaran
- **Kelas** - Kelas

## Catatan

- Pastikan database sudah dibuat sebelum menjalankan migration
- Seed akan skip jika user sudah ada (berdasarkan email)
- Prisma versi 6.x digunakan (lebih stabil untuk MySQL)
