const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if users already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['riviadimong321@gmail.com']
      }
    }
  });

  if (existingUsers.length > 0) {
    console.log('⚠️  Users already exist. Skipping seed.');
    return;
  }

  // Create users
  const users = [
    {
      username: 'rivia_marsadah',
      email: 'riviadimong321@gmail.com',
      password: null, // No password for SSO users
      role: 'guru',
      namaLengkap: 'Rivia Marsadah',
      status: 'aktif',
      googleLinked: false
    }
  ];

  for (const userData of users) {
    // Create user
    const user = await prisma.user.create({
      data: userData
    });

    // Create guru record
    await prisma.guru.create({
      data: {
        userId: user.id,
        nip: null // NIP bisa diisi nanti
      }
    });

    console.log(`✅ Created user: ${userData.namaLengkap} (${userData.email})`);
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

