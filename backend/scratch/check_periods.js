const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== DIAGNOSTIK JADWAL UJIAN & PERIODE ===");
    
    const jadwalList = await prisma.jadwalUjian.findMany({
      select: {
        id: true,
        nama: true,
        guruId: true,
        periodeId: true,
        periode: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    });

    console.log(`Ditemukan ${jadwalList.length} jadwal.`);
    jadwalList.forEach(j => {
      console.log(`ID: ${j.id} | Nama: "${j.nama}" | guruId: ${j.guruId} | periodeId: ${j.periodeId} | Periode Nama: "${j.periode?.nama || 'NULL'}"`);
    });

  } catch (e) {
    console.error("Gagal: ", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
