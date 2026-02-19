const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    console.log('🌱 Starting seed...');

    // Check if users already exist
    const [existingUsers] = await pool.query('SELECT email FROM users WHERE email IN (?, ?)', [
      'gadinglalala121212@gmail.com',
      'riviadimong321@gmail.com'
    ]);

    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  Users already exist. Skipping seed.');
      return;
    }

    // Insert users
    const users = [
      {
        email: 'gadinglalala121212@gmail.com',
        password: null, // No password for SSO users
        role: 'guru',
        nama_lengkap: 'Ilham Pangestu',
        status: 'aktif'
      },
      {
        email: 'riviadimong321@gmail.com',
        password: null, // No password for SSO users
        role: 'guru',
        nama_lengkap: 'Rivia Marsadah',
        status: 'aktif'
      }
    ];

    for (const userData of users) {
      const [result] = await pool.query(
        `INSERT INTO users (email, password, role, nama_lengkap, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userData.email,
          userData.password,
          userData.role,
          userData.nama_lengkap,
          userData.status
        ]
      );

      const userId = result.insertId;

      // Insert into guru table
      await pool.query(
        `INSERT INTO guru (user_id, nip, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [userId, null] // NIP bisa diisi nanti
      );

      console.log(`✅ Created user: ${userData.nama_lengkap} (${userData.email})`);
    }

    console.log('✅ Seed completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Run seed
seedUsers();

