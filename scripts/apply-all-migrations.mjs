import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Smart SQL splitter that respects dollar-quoted strings (DO $$ ... $$;)
 */
function splitSQL(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  
  while (i < sql.length) {
    // Check for dollar-quoting: $$ or $tag$
    if (sql[i] === '$') {
      const dollarMatch = sql.slice(i).match(/^(\$[^$]*\$)/);
      if (dollarMatch) {
        const tag = dollarMatch[1];
        current += tag;
        i += tag.length;
        // Find the closing dollar-quote
        const closeIdx = sql.indexOf(tag, i);
        if (closeIdx !== -1) {
          current += sql.slice(i, closeIdx + tag.length);
          i = closeIdx + tag.length;
          continue;
        }
      }
    }
    
    // Check for line comments
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const nlIdx = sql.indexOf('\n', i);
      if (nlIdx !== -1) {
        current += sql.slice(i, nlIdx + 1);
        i = nlIdx + 1;
        continue;
      }
    }
    
    // Check for string literals
    if (sql[i] === "'") {
      current += "'";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          current += "''";
          i += 2;
        } else if (sql[i] === "'") {
          current += "'";
          i++;
          break;
        } else {
          current += sql[i];
          i++;
        }
      }
      continue;
    }
    
    // Statement terminator
    if (sql[i] === ';') {
      current += ';';
      const trimmed = current.trim();
      // Only add non-empty, non-comment-only statements
      const meaningful = trimmed.split('\n').some(l => {
        const t = l.trim();
        return t.length > 0 && !t.startsWith('--');
      });
      if (meaningful && trimmed.length > 5) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }
    
    current += sql[i];
    i++;
  }
  
  // Handle any remaining content
  const trimmed = current.trim();
  if (trimmed.length > 5) {
    const meaningful = trimmed.split('\n').some(l => {
      const t = l.trim();
      return t.length > 0 && !t.startsWith('--');
    });
    if (meaningful) statements.push(trimmed);
  }
  
  return statements;
}

async function runMigration(name, filePath) {
  console.log(`\n--- ${name} ---`);
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSQL(sql);
  console.log(`  Total statements: ${statements.length}`);
  
  let ok = 0, skip = 0, errors = [];
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      ok++;
    } catch(e) {
      skip++;
      const msg = e.message;
      if (!msg.includes('already exists') && !msg.includes('duplicate key') && !msg.includes('does not exist')) {
        errors.push(msg.slice(0, 120));
      }
    }
  }
  console.log(`  Result: ${ok} ok, ${skip} skipped`);
  if (errors.length) {
    console.log(`  Unique errors:`);
    [...new Set(errors)].forEach(e => console.log(`    - ${e}`));
  }
  return { ok, skip };
}

// Step 1: Apply prerequisite migrations first
console.log('=== Step 1: Apply prerequisite migrations ===');
await runMigration('add_asset_hub', 'prisma/migrations/20260303081953_add_asset_hub/migration.sql');
await runMigration('add_api_keys', 'prisma/migrations/20260303092903_add_api_keys/migration.sql');

// Step 2: Apply Phase 3 migrations  
console.log('\n=== Step 2: Apply Phase 3 migrations ===');
await runMigration('phase3_wave_a', 'prisma/migrations/20260303164421_phase3_wave_a/migration.sql');
await runMigration('phase3_wave_b', 'prisma/migrations/20260303200000_phase3_wave_b/migration.sql');

// Step 3: Apply content push pipeline
console.log('\n=== Step 3: Apply content push pipeline ===');
await runMigration('content_push_pipeline', 'prisma/migrations/20260303210000_content_push_pipeline/migration.sql');

// Step 4: Verify tables
const tables = await pool.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name != '_prisma_migrations' ORDER BY table_name"
);
console.log(`\n=== Final: ${tables.rows.length} tables ===`);
console.log(tables.rows.map(r => r.table_name).join(', '));

// Step 5: Check for critical tables needed by the app
const critical = ['Asset', 'AssetFolder', 'ApiKey', 'CompanyProfile', 'Evidence', 'Persona', 'ContentBrief', 'PushRecord', 'WebsiteConfig', 'SeoContent'];
const existing = new Set(tables.rows.map(r => r.table_name));
const missing = critical.filter(t => !existing.has(t));
if (missing.length) {
  console.log(`\n⚠️  Missing critical tables: ${missing.join(', ')}`);
} else {
  console.log(`\n✅ All critical tables present!`);
}

await pool.end();
