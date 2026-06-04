const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'u777555761_root',
    password: 'Sistemcat2026',
    database: 'u777555761_cat'
  });
  console.log('Connected successfully using mysql2!');
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_ujian');
  console.log('Total schedules:', rows[0].count);
  const [orphans] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_ujian WHERE guru_id IS NULL AND periode_id IS NULL');
  console.log('Orphaned schedules:', orphans[0].count);
  await connection.end();
}
main().catch(console.error);
