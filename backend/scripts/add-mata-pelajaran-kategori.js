/**
 * Script satu kali: tambah kolom kategori dan jurusan_id ke tabel mata_pelajaran.
 * Jalankan: node scripts/add-mata-pelajaran-kategori.js
 * Pastikan backend/.env dan database sudah benar.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE mata_pelajaran
      ADD COLUMN kategori ENUM('prodi', 'muatan_lokal') NOT NULL DEFAULT 'prodi',
      ADD COLUMN jurusan_id INT NULL
    `);
    console.log('Kolom kategori dan jurusan_id berhasil ditambah.');
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('duplicate column') || msg.includes('already exists')) {
      console.log('Kolom sudah ada. Lanjut cek foreign key.');
    } else {
      throw e;
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE mata_pelajaran
      ADD CONSTRAINT mata_pelajaran_jurusan_id_fkey
      FOREIGN KEY (jurusan_id) REFERENCES jurusan(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('Foreign key jurusan_id berhasil ditambah.');
  } catch (e) {
    if (e.message?.includes('Duplicate foreign key') || e.message?.includes('already exists')) {
      console.log('Foreign key sudah ada. Skip.');
    } else {
      throw e;
    }
  }

  console.log('Selesai. Silakan restart backend (npm run dev).');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
