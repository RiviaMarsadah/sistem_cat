/**
 * Tambah nilai SEMUA ke kolom tingkat di bank_soal.
 * Ubah ENUM dari ('X','XI','XII') ke ('X','XI','XII','SEMUA').
 * Jalankan: node scripts/add-tingkat-soal-semua.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE bank_soal
      MODIFY COLUMN tingkat ENUM('X', 'XI', 'XII', 'SEMUA') NOT NULL
    `);
    console.log('Kolom bank_soal.tingkat berhasil diubah: nilai SEMUA ditambahkan.');
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('already exists')) {
      console.log('Enum SEMUA mungkin sudah ada. Cek struktur kolom.');
    } else {
      throw e;
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
