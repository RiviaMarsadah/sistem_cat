const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Seeding Process...');

  // Default password for all seed users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 1. CLEANUP
  console.log('🧹 Cleaning up existing data...');
  await prisma.$transaction([
    prisma.mataPelajaran.deleteMany({}),
    prisma.kelas.deleteMany({}),
    prisma.jurusan.deleteMany({}),
    prisma.siswa.deleteMany({}),
    prisma.guru.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  // 2. CREATE ADMIN (ONLY USER IN SEED)
  console.log('👤 Creating Admin (Rivia Marsadah)...');
  await prisma.user.create({
    data: {
      email: 'riviamarsadah@gmail.com',
      namaLengkap: 'Rivia Marsadah',
      password: hashedPassword,
      role: 'admin',
      status: 'aktif',
    },
  });

  console.log('✅ Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
