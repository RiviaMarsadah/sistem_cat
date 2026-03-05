/**
 * Script satu kali: buat tabel bank_soal jika belum ada.
 * Struktur: tingkat (10/11/12) + jurusan_id (opsional = semua prodi).
 * Jalankan: node scripts/add-bank-soal-table.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM bank_soal LIMIT 1`);
    console.log('Tabel bank_soal sudah ada. Tidak perlu membuat lagi.');
    process.exit(0);
    return;
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes("doesn't exist") || msg.includes('exist') || e.code === 'P2021') {
      // Tabel belum ada, lanjut buat
    } else {
      throw e;
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
    CREATE TABLE bank_soal (
      id INT NOT NULL AUTO_INCREMENT,
      mata_pelajaran_id INT NOT NULL,
      tingkat ENUM('X', 'XI', 'XII') NOT NULL,
      jurusan_id INT NULL,
      guru_id INT NOT NULL,
      kategori_soal ENUM('single_choice', 'multi_choice', 'benar_salah') NOT NULL,
      soal TEXT NULL,
      kolom_a VARCHAR(500) NULL,
      kolom_b VARCHAR(500) NULL,
      kolom_c VARCHAR(500) NULL,
      kolom_d VARCHAR(500) NULL,
      kolom_e VARCHAR(500) NULL,
      kolom_f VARCHAR(500) NULL,
      jawaban VARCHAR(100) NOT NULL,
      gambar VARCHAR(500) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      CONSTRAINT bank_soal_mata_pelajaran_id_fkey FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT bank_soal_jurusan_id_fkey FOREIGN KEY (jurusan_id) REFERENCES jurusan(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT bank_soal_guru_id_fkey FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
    console.log('Tabel bank_soal berhasil dibuat (tingkat + jurusan_id).');
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log('Tabel bank_soal sudah ada.');
    } else {
      throw e;
    }
  }
  console.log('Silakan restart backend (npm run dev).');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
