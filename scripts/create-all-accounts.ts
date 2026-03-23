/**
 * 创建所有账号（客户 + 运营后台）
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const accounts = [
    // 客户账号
    {
      type: 'customer',
      slug: 'tdpaint',
      name: '涂豆科技',
      email: 'admin@tdpaint.com',
      password: 'Tdpaint2026!',
      url: 'https://tdpaint.vertax.top',
      roleName: '企业管理员',
    },
    {
      type: 'customer',
      slug: 'machrio',
      name: 'MachRio',
      email: 'admin@machrio.com',
      password: 'Machrio2026!',
      url: 'https://machrio.vertax.top',
      roleName: '企业管理员',
    },
    // 运营后台账号
    {
      type: 'tower',
      slug: 'tower',
      name: 'VertaX 运营团队',
      email: 'admin@vertax.top',
      password: 'Vertax2026!',
      url: 'https://tower.vertax.top',
      roleName: 'platform_admin',
    },
  ];

  console.log('🚀 开始创建所有账号...\n');

  for (const account of accounts) {
    console.log(`\n📋 处理：${account.name}`);
    console.log('═'.repeat(60));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 创建或查找租户（仅客户需要）
      let tenantId: string | null = null;
      if (account.type === 'customer') {
        const existingTenant = await client.query(
          'SELECT id FROM "Tenant" WHERE slug = $1',
          [account.slug]
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
            [account.name, account.slug, `${account.slug}.vertax.top`, now]
          );
          tenantId = tenantResult.rows[0].id;
          console.log(`✅ 租户创建成功：${tenantId}`);
        }
      }

      // 2. 删除现有用户
      if (tenantId) {
        const deleteResult = await client.query(
          'DELETE FROM "User" WHERE "tenantId" = $1',
          [tenantId]
        );
        console.log(`🗑️  删除了 ${deleteResult.rowCount} 个旧用户`);
      }

      // 3. 创建或查找角色
      let roleId: string;
      const now = new Date().toISOString();
      const existingRole = await client.query(
        'SELECT id FROM "Role" WHERE name = $1',
        [account.roleName]
      );

      if (existingRole.rows.length > 0) {
        roleId = existingRole.rows[0].id;
        console.log(`✅ 角色已存在：${account.roleName}`);
      } else {
        const permissions = account.type === 'tower' 
          ? '{"all": true, "platform": true}' 
          : '{"all": true}';
        
        const roleResult = await client.query(
          `INSERT INTO "Role" (id, name, "displayName", permissions, "isSystemRole", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, false, $4, $4) 
           RETURNING id`,
          [account.roleName, account.type === 'tower' ? '平台管理员' : '企业管理员', permissions, now]
        );
        roleId = roleResult.rows[0].id;
        console.log(`📝 创建角色：${account.roleName}`);
      }

      // 4. 创建管理员用户
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      // Tower 用户不需要 tenantId
      let userResult;
      if (account.type === 'tower') {
        userResult = await client.query(
          `INSERT INTO "User" (id, email, name, password, "tenantId", "roleId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, NULL, $4, $5, $5) 
           RETURNING id, email`,
          [account.email, `${account.name}管理员`, hashedPassword, roleId, now]
        );
      } else {
        userResult = await client.query(
          `INSERT INTO "User" (id, email, name, password, "tenantId", "roleId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6) 
           RETURNING id, email`,
          [account.email, `${account.name}管理员`, hashedPassword, tenantId, roleId, now]
        );
      }

      console.log(`✅ 账号创建成功：${userResult.rows[0].email}`);
      console.log(`\n🌐 访问：${account.url}`);
      console.log(`📧 邮箱：${account.email}`);
      console.log(`🔑 密码：${account.password}`);

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`❌ 错误：${error.message}`);
    } finally {
      client.release();
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 所有账号创建完成！');
  console.log('═'.repeat(60));
  console.log('\n📋 账号汇总：');
  console.log('\n【涂豆科技】');
  console.log('  网址：https://tdpaint.vertax.top');
  console.log('  邮箱：admin@tdpaint.com');
  console.log('  密码：Tdpaint2026!');
  console.log('\n【MachRio】');
  console.log('  网址：https://machrio.vertax.top');
  console.log('  邮箱：admin@machrio.com');
  console.log('  密码：Machrio2026!');
  console.log('\n【运营后台】');
  console.log('  网址：https://tower.vertax.top');
  console.log('  邮箱：admin@vertax.top');
  console.log('  密码：Vertax2026!');
  
  await pool.end();
}

main().catch(console.error);
