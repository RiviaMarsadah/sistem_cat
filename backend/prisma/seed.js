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

  // 2. CREATE JURUSAN (PRODI) - API ALIGNED
  console.log('📚 Creating Jurusan...');
  const tkj = await prisma.jurusan.create({
    data: {
      kodeProdi: 'TKJ',
      namaProdi: 'Teknik Komputer dan Jaringan',
    },
  });

  const rpl = await prisma.jurusan.create({
    data: {
      kodeProdi: 'RPL',
      namaProdi: 'Rekayasa Perangkat Lunak',
    },
  });

  // 3. CREATE MATA PELAJARAN - API ALIGNED
  console.log('📖 Creating Mata Pelajaran...');
  await prisma.mataPelajaran.create({
    data: {
      kodeMapel: 'MATH01',
      namaMapel: 'Matematika',
      kategori: 'prodi',
      jurusanId: tkj.id,
    },
  });

  await prisma.mataPelajaran.create({
    data: {
      kodeMapel: 'PROG01',
      namaMapel: 'Pemrograman Dasar',
      kategori: 'prodi',
      jurusanId: rpl.id,
    },
  });

  // 4. CREATE ADMIN
  console.log('👤 Creating Admin...');
  await prisma.user.create({
    data: {
      email: 'riviamarsadah@gmail.com',
      namaLengkap: 'Rivia Admin',
      password: hashedPassword,
      role: 'admin',
      status: 'aktif',
    },
  });

  // 5. CREATE GURU
  console.log('👨‍🏫 Creating Guru...');
  const guruUser = await prisma.user.create({
    data: {
      email: 'riviadimong321@gmail.com',
      namaLengkap: 'Rivia Guru',
      password: hashedPassword,
      role: 'guru',
      status: 'aktif',
    },
  });

  await prisma.guru.create({
    data: {
      userId: guruUser.id,
      nip: '198001012005011001',
      jk: 'L',
      agama: 'Islam',
      noHp: '081234567890',
      alamat: 'Jl. Contoh Guru No. 1'
    },
  });

  // 6. CREATE SISWA
  console.log('👨‍🎓 Creating Siswa...');
  const siswaUser = await prisma.user.create({
    data: {
      email: 'riviasr1212@gmail.com',
      namaLengkap: 'Rivia Siswa',
      password: hashedPassword,
      role: 'siswa',
      status: 'aktif',
    },
  });

  await prisma.siswa.create({
    data: {
      userId: siswaUser.id,
      nis: '2024001',
      nisn: '0012345678',
      jk: 'P',
      agama: 'Islam',
      noHp: '089876543210',
      alamat: 'Jl. Contoh Siswa No. 12'
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
