import { Pool } from 'pg';
import 'dotenv/config';

async function test() {
  console.log('测试数据库连接...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });

  try {
    console.log('\n尝试连接...');
    const client = await pool.connect();
    console.log('✅ 连接成功！');

    const result = await client.query('SELECT NOW()');
    console.log('数据库时间:', result.rows[0].now);

    // 检查表是否存在
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\n📊 数据库表:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    client.release();
  } catch (error: any) {
    console.error('❌ 连接失败:', error.message);
  } finally {
    await pool.end();
  }
}

test();
