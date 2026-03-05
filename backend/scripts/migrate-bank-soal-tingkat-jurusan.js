/**
 * Migrasi: ganti kelas_id dengan tingkat + jurusan_id di bank_soal.
 * Jalankan: node scripts/migrate-bank-soal-tingkat-jurusan.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cek apakah kolom tingkat sudah ada
  try {
    await prisma.$queryRawUnsafe('SELECT tingkat, jurusan_id FROM bank_soal LIMIT 1');
    console.log('Kolom tingkat dan jurusan_id sudah ada. Migrasi tidak diperlukan.');
    process.exit(0);
    return;
  } catch (e) {
    // Lanjut migrasi
  }

  try {
    // Tambah kolom baru
    await prisma.$executeRawUnsafe(`
      ALTER TABLE bank_soal
      ADD COLUMN tingkat ENUM('X', 'XI', 'XII') NULL,
      ADD COLUMN jurusan_id INT NULL
    `);
    console.log('Kolom tingkat dan jurusan_id ditambah.');
  } catch (e) {
    if ((e.message || '').toLowerCase().includes('duplicate column')) {
      console.log('Kolom sudah ada.');
    } else {
      throw e;
    }
  }

  // Isi tingkat dan jurusan_id dari kelas (jika ada kolom kelas_id)
  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT bs.id, k.tingkat, k.jurusan_id FROM bank_soal bs INNER JOIN kelas k ON bs.kelas_id = k.id'
    );
    for (const row of rows) {
      await prisma.$executeRawUnsafe(
        'UPDATE bank_soal SET tingkat = ?, jurusan_id = ? WHERE id = ?',
        row.tingkat,
        row.jurusan_id,
        row.id
      );
    }
    if (rows.length > 0) console.log(`${rows.length} baris di-update dari data kelas.`);
  } catch (e) {
    // Kolom kelas_id mungkin sudah tidak ada atau tabel kosong
  }

  // Set default untuk yang masih null
  await prisma.$executeRawUnsafe("UPDATE bank_soal SET tingkat = 'X' WHERE tingkat IS NULL");
  await prisma.$executeRawUnsafe('ALTER TABLE bank_soal MODIFY tingkat ENUM(\'X\', \'XI\', \'XII\') NOT NULL');

  // Hapus FK dan kolom kelas_id (jika masih ada)
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE bank_soal DROP FOREIGN KEY bank_soal_kelas_id_fkey');
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (!msg.includes('check that it exists') && !msg.includes('unknown')) console.error(e.message);
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE bank_soal DROP COLUMN kelas_id');
    console.log('Kolom kelas_id dihapus.');
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (!msg.includes('check that column') && !msg.includes("unknown column 'kelas_id'")) console.error(e.message);
  }

  // Tambah FK jurusan_id
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE bank_soal ADD CONSTRAINT bank_soal_jurusan_id_fkey
      FOREIGN KEY (jurusan_id) REFERENCES jurusan(id) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('Foreign key jurusan_id ditambah.');
  } catch (e) {
    if ((e.message || '').toLowerCase().includes('duplicate')) console.log('FK jurusan_id sudah ada.');
    else throw e;
  }

  console.log('Migrasi selesai. Restart backend.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
