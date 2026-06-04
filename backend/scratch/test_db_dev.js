const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://root@127.0.0.1:3306/db_cat"
    }
  }
});
async function main() {
  const count = await prisma.jadwalUjian.count();
  console.log('Jadwal count:', count);
  const nullPeriodJadwals = await prisma.jadwalUjian.findMany({
    where: {
      guruId: null,
      periodeId: null
    }
  });
  console.log('Jadwal with null guruId and null periodeId:', nullPeriodJadwals.length);
}
main().catch(console.error);
