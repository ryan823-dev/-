/**
 * 客户账号设置脚本 - 简化版
 * 使用 node-postgres 直接执行 SQL
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少 DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const customers = [
    {
      slug: 'tdpaint',
      name: '涂豆科技',
      email: 'admin@tdpaint.com',
      password: 'Tdpaint2026!',
      url: 'https://tdpaint.vertax.top',
    },
    {
      slug: 'machrio',
      name: 'MachRio',
      email: 'admin@machrio.com',
      password: 'Machrio2026!',
      url: 'https://machrio.vertax.top',
    },
  ];

  console.log('🚀 开始设置客户账号...\n');

  for (const customer of customers) {
    console.log(`\n📋 处理：${customer.name}`);
    console.log('─'.repeat(50));

    // 查找租户
    const tenantResult = await pool.query(
      'SELECT id, name FROM "Tenant" WHERE slug = $1',
      [customer.slug]
    );

    if (tenantResult.rows.length === 0) {
      console.warn(`⚠️  未找到租户：${customer.slug}`);
      continue;
    }

    const tenant = tenantResult.rows[0];
    console.log(`✅ 租户：${tenant.name} (${tenant.id})`);

    // 删除现有用户
    const deleteResult = await pool.query(
      'DELETE FROM "User" WHERE "tenantId" = $1',
      [tenant.id]
    );
    console.log(`🗑️  删除了 ${deleteResult.rowCount} 个旧用户`);

    // 查找或创建角色
    let roleResult = await pool.query(
      'SELECT id FROM "Role" WHERE name = $1',
      ['tenant_admin']
    );

    let roleId: string;
    if (roleResult.rows.length === 0) {
      roleResult = await pool.query(
        `INSERT INTO "Role" (id, name, "displayName", permissions, "isSystemRole") 
         VALUES (gen_random_uuid(), 'tenant_admin', '企业管理员', '{"all": true}', false) 
         RETURNING id`
      );
      console.log(`📝 创建角色：tenant_admin`);
    }
    roleId = roleResult.rows[0].id;
    console.log(`✅ 角色 ID: ${roleId}`);

    // 创建用户
    const hashedPassword = await bcrypt.hash(customer.password, 10);
    const userResult = await pool.query(
      `INSERT INTO "User" (id, email, name, password, "tenantId", "roleId") 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) 
       RETURNING id`,
      [customer.email, `${customer.name}管理员`, hashedPassword, tenant.id, roleId]
    );

    console.log(`✅ 用户创建成功`);
    console.log(`\n🌐 访问：${customer.url}`);
    console.log(`📧 邮箱：${customer.email}`);
    console.log(`🔑 密码：${customer.password}`);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ 完成！');
  console.log('═'.repeat(50));

  await pool.end();
}

main().catch(console.error);
