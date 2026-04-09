const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Menghapus data sementara di ujian_siswa agar db push berhasil...");
    await prisma.jawabanSiswa.deleteMany({});
    await prisma.ujianSiswa.deleteMany({});
    console.log("Berhasil!");
  } catch (e) {
    console.error("Gagal: ", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
