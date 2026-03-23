/**
 * 创建租户脚本
 */

import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少 DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const tenants = [
    {
      slug: 'tdpaint',
      name: '涂豆科技',
      domain: 'tdpaint.vertax.top',
    },
    {
      slug: 'machrio',
      name: 'MachRio',
      domain: 'machrio.vertax.top',
    },
  ];

  console.log('🏢 开始创建租户...\n');

  for (const tenant of tenants) {
    console.log(`📋 创建：${tenant.name} (${tenant.slug})`);

    // 检查是否已存在
    const existing = await pool.query(
      'SELECT id FROM "Tenant" WHERE slug = $1',
      [tenant.slug]
    );

    if (existing.rows.length > 0) {
      console.log(`✅ 租户已存在：${existing.rows[0].id}`);
      continue;
    }

    // 创建租户
    const result = await pool.query(
      `INSERT INTO "Tenant" (id, name, slug, domain, plan, status, settings) 
       VALUES (gen_random_uuid(), $1, $2, $3, 'pro', 'active', '{}') 
       RETURNING id`,
      [tenant.name, tenant.slug, tenant.domain]
    );

    console.log(`✅ 租户创建成功：${result.rows[0].id}`);
  }

  console.log('\n✅ 租户创建完成！');
  await pool.end();
}

main().catch(console.error);
