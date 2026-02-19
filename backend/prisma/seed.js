const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if users already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['riviadimong321@gmail.com', 'riviamarsadah@gmail.com']
      }
    }
  });

  if (existingUsers.length > 0) {
    console.log('⚠️  Some users already exist. Skipping existing users...');
  }

  // Create users
  const users = [
    {
      email: 'riviadimong321@gmail.com',
      password: null, // No password for SSO users
      role: 'guru',
      namaLengkap: 'Rivia Marsadah',
      status: 'aktif',
      googleLinked: false
    },
    {
      email: 'riviamarsadah@gmail.com',
      password: null, // No password for SSO users
      role: 'admin',
      namaLengkap: 'Rivia Marsadah',
      status: 'aktif',
      googleLinked: false
    }
  ];

  for (const userData of users) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⏭️  User already exists: ${userData.namaLengkap} (${userData.email})`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: userData
    });

    // Create guru record only for guru role
    if (userData.role === 'guru') {
      await prisma.guru.create({
        data: {
          userId: user.id,
          nip: null // NIP bisa diisi nanti
        }
      });
    }

    console.log(`✅ Created user: ${userData.namaLengkap} (${userData.email}) - Role: ${userData.role}`);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

