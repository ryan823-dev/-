/**
 * 创建客户管理员账号脚本
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

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

  console.log('🚀 开始创建客户账号...\n');

  for (const customer of customers) {
    console.log(`\n📋 处理：${customer.name}`);
    console.log('═'.repeat(60));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 创建或查找租户
      let tenantId: string;
      const existingTenant = await client.query(
        'SELECT id FROM "Tenant" WHERE slug = $1',
        [customer.slug]
      );

      if (existingTenant.rows.length > 0) {
        tenantId = existingTenant.rows[0].id;
        console.log(`✅ 租户已存在：${tenantId}`);
      } else {
        const now = new Date().toISOString();
        const tenantResult = await client.query(
          `INSERT INTO "Tenant" (id, name, slug, domain, plan, status, settings, "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, 'pro', 'active', '{}', $4, $4) 
           RETURNING id`,
          [customer.name, customer.slug, customer.domain, now]
        );
        tenantId = tenantResult.rows[0].id;
        console.log(`✅ 租户创建成功：${tenantId}`);
      }

      // 2. 删除现有用户
      const deleteResult = await client.query(
        'DELETE FROM "User" WHERE "tenantId" = $1',
        [tenantId]
      );
      console.log(`🗑️  删除了 ${deleteResult.rowCount} 个旧用户`);

      // 3. 查找或创建角色
      let roleId: string;
      const now = new Date().toISOString();
      const existingRole = await client.query(
        'SELECT id FROM "Role" WHERE name = $1',
        ['tenant_admin']
      );

      if (existingRole.rows.length > 0) {
        roleId = existingRole.rows[0].id;
        console.log(`✅ 角色已存在：tenant_admin`);
      } else {
        const roleResult = await client.query(
          `INSERT INTO "Role" (id, name, "displayName", permissions, "isSystemRole", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), 'tenant_admin', '企业管理员', '{"all": true}', false, $1, $1) 
           RETURNING id`,
          [now]
        );
        roleId = roleResult.rows[0].id;
        console.log(`📝 创建角色：tenant_admin`);
      }

      // 4. 创建管理员用户
      const hashedPassword = await bcrypt.hash(customer.password, 10);
      const userResult = await client.query(
        `INSERT INTO "User" (id, email, name, password, "tenantId", "roleId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6) 
         RETURNING id, email`,
        [customer.email, `${customer.name}管理员`, hashedPassword, tenantId, roleId, now]
      );

      console.log(`✅ 管理员账号创建成功：${userResult.rows[0].email}`);
      console.log(`\n🌐 访问：${customer.url}`);
      console.log(`📧 邮箱：${customer.email}`);
      console.log(`🔑 密码：${customer.password}`);

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`❌ 错误：${error.message}`);
    } finally {
      client.release();
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 完成！');
  await pool.end();
}

main().catch(console.error);
