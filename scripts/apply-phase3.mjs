import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration(name, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  // Split by semicolon, filter empty
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 10);
  let ok = 0, skip = 0, errors = [];
  for (const stmt of statements) {
    // Skip comment-only statements
    if (stmt.split('\n').every(l => l.trim().startsWith('--') || l.trim() === '')) continue;
    try {
      await pool.query(stmt);
      ok++;
    } catch(e) {
      skip++;
      if (!e.message.includes('already exists') && !e.message.includes('duplicate key')) {
        errors.push(e.message.slice(0, 100));
      }
    }
  }
  console.log(`${name}: ${ok} ok, ${skip} skipped`);
  if (errors.length) console.log(`  Errors: ${errors.join(' | ')}`);
}

await runMigration('wave_a', 'prisma/migrations/20260303164421_phase3_wave_a/migration.sql');
await runMigration('wave_b', 'prisma/migrations/20260303200000_phase3_wave_b/migration.sql');

const tables = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name != '_prisma_migrations' ORDER BY table_name"
);
console.log(`\nTotal tables: ${tables.rows.length}`);
console.log(tables.rows.map(r => r.table_name).join(', '));

await pool.end();
