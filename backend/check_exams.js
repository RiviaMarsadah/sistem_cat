const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== DIAGNOSTIK JADWAL UJIAN ===");
    
    const now = new Date();
    console.log("Waktu Server (JS):", now.toString());
    console.log("ISO String:", now.toISOString());
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    console.log("Start of Today:", startOfToday.toISOString());
    console.log("End of Today:", endOfToday.toISOString());

    console.log("\n=== DAFTAR SISWA & KELAS ===");
    const siswaList = await prisma.siswa.findMany({
      include: {
        kelas: true,
        user: true
      }
    });
    siswaList.forEach(s => {
      console.log(`Siswa ID: ${s.id} | Nama: ${s.user.namaLengkap} | Kelas: ${s.kelas?.namaKelas || 'Tanpa Kelas'} (ID: ${s.kelasId})`);
    });

    console.log("\n=== SEMUA JADWAL UJIAN ===");
    const jadwalList = await prisma.jadwalUjian.findMany({
      include: {
        mataPelajaran: true,
        paketUjian: true,
        kelasJadwal: {
          include: {
            kelas: true
          }
        }
      }
    });

    jadwalList.forEach(j => {
      const kelasNames = j.kelasJadwal.map(kj => kj.kelas.namaKelas).join(", ");
      console.log(`--------------------------------------------------`);
      console.log(`ID: ${j.id}`);
      console.log(`Nama Ujian: ${j.nama}`);
      console.log(`Mata Pelajaran: ${j.mataPelajaran?.namaMapel}`);
      console.log(`Paket Ujian ID: ${j.paketUjianId} (${j.paketUjian?.nama || 'Belum Diset'})`);
      console.log(`Mulai: ${j.mulai.toISOString()} (${j.mulai})`);
      console.log(`Selesai: ${j.selesai.toISOString()} (${j.selesai})`);
      console.log(`Untuk Kelas: ${kelasNames}`);
      
      // Check if it fits today's boundary
      const inDateRange = j.mulai <= endOfToday && j.selesai >= startOfToday;
      console.log(`Masuk rentang hari ini? ${inDateRange ? "YA" : "TIDAK"}`);
    });
    console.log(`--------------------------------------------------`);

  } catch (e) {
    console.error("Gagal: ", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
