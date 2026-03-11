/**
 * Buat tabel paket_ujian dan soal_paket_ujian.
 * Jalankan: node scripts/add-paket-ujian-tables.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS paket_ujian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(200) NOT NULL,
        mata_pelajaran_id INT NOT NULL,
        tingkat ENUM('X', 'XI', 'XII', 'SEMUA') NOT NULL,
        tipe_ujian ENUM('UH', 'UTS', 'UAS', 'Lainnya') NOT NULL,
        token_checkin VARCHAR(6) NOT NULL,
        token_checkout VARCHAR(6) NOT NULL,
        guru_id INT NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_paket_ujian_mapel FOREIGN KEY (mata_pelajaran_id) REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
        CONSTRAINT fk_paket_ujian_guru FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabel paket_ujian OK.');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS soal_paket_ujian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        paket_ujian_id INT NOT NULL,
        bank_soal_id INT NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY unique_paket_soal (paket_ujian_id, bank_soal_id),
        CONSTRAINT fk_soal_paket_ujian_paket FOREIGN KEY (paket_ujian_id) REFERENCES paket_ujian(id) ON DELETE CASCADE,
        CONSTRAINT fk_soal_paket_ujian_soal FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabel soal_paket_ujian OK.');
  } catch (e) {
    console.error(e);
    throw e;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    prisma.$disconnect();
    process.exit(1);
  });
