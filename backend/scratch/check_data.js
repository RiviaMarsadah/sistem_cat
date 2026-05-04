const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pakets = await prisma.paketUjian.findMany({
    include: {
      mataPelajaran: true,
      _count: { select: { soalPaket: true } }
    }
  });
  console.log('Total Pakets:', pakets.length);
  pakets.forEach(p => {
    console.log(`ID: ${p.id}, Nama: ${p.nama}, MapelID: ${p.mataPelajaranId}, SoalCount: ${p._count.soalPaket}, GuruID: ${p.guruId}`);
  });

  const mapels = await prisma.mataPelajaran.findMany();
  console.log('Total Mapels:', mapels.length);
  mapels.forEach(m => {
    console.log(`ID: ${m.id}, Nama: ${m.namaMapel}`);
  });
  
  const gurus = await prisma.guru.findMany({
      include: { user: true }
  });
  console.log('Total Gurus:', gurus.length);
  gurus.forEach(g => {
      console.log(`ID: ${g.id}, Nama: ${g.user.namaLengkap}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
