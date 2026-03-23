/**
 * 完整客户设置脚本
 * 创建租户 + 用户账号
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少 DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const customers = [
    {
      slug: 'tdpaint',
      name: '涂豆科技',
      domain: 'tdpaint.vertax.top',
      email: 'admin@tdpaint.com',
      password: 'Tdpaint2026!',
      url: 'https://tdpaint.vertax.top',
    },
    {
      slug: 'machrio',
      name: 'MachRio',
      domain: 'machrio.vertax.top',
      email: 'admin@machrio.com',
      password: 'Machrio2026!',
      url: 'https://machrio.vertax.top',
    },
  ];

  console.log('🚀 开始设置客户系统...\n');

  for (const customer of customers) {
    console.log(`\n📋 处理：${customer.name}`);
    console.log('═'.repeat(60));

    try {
      // 1. 创建或查找租户
      let tenantId: string;
      const existingTenant = await pool.query(
        'SELECT id FROM "Tenant" WHERE slug = $1',
        [customer.slug]
      );

      if (existingTenant.rows.length > 0) {
        tenantId = existingTenant.rows[0].id;
        console.log(`✅ 租户已存在：${tenantId}`);
      } else {
        const now = new Date().toISOString();
        const tenantResult = await pool.query(
          `INSERT INTO "Tenant" (id, name, slug, domain, plan, status, settings, "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, 'pro', 'active', '{}', $4, $4) 
           RETURNING id`,
          [customer.name, customer.slug, customer.domain, now]
        );
        tenantId = tenantResult.rows[0].id;
        console.log(`✅ 租户创建成功：${tenantId}`);
      }

      // 2. 删除现有用户
      const deleteResult = await pool.query(
        'DELETE FROM "User" WHERE "tenantId" = $1',
        [tenantId]
      );
      console.log(`🗑️  删除了 ${deleteResult.rowCount} 个旧用户`);

      // 3. 创建或查找角色
      let roleId: string;
      const existingRole = await pool.query(
        'SELECT id FROM "Role" WHERE name = $1',
        ['tenant_admin']
      );

      if (existingRole.rows.length > 0) {
        roleId = existingRole.rows[0].id;
        console.log(`✅ 角色已存在：tenant_admin`);
      } else {
        const roleResult = await pool.query(
          `INSERT INTO "Role" (id, name, "displayName", permissions, "isSystemRole") 
           VALUES (gen_random_uuid(), 'tenant_admin', '企业管理员', '{"all": true}', false) 
           RETURNING id`
        );
        roleId = roleResult.rows[0].id;
        console.log(`📝 创建角色：tenant_admin`);
      }

      // 4. 创建管理员用户
      const hashedPassword = await bcrypt.hash(customer.password, 10);
      const userResult = await pool.query(
        `INSERT INTO "User" (id, email, name, password, "tenantId", "roleId") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) 
         RETURNING id`,
        [customer.email, `${customer.name}管理员`, hashedPassword, tenantId, roleId]
      );

      console.log(`✅ 管理员账号创建成功`);
      console.log(`\n🌐 访问地址：${customer.url}`);
      console.log(`📧 登录邮箱：${customer.email}`);
      console.log(`🔑 登录密码：${customer.password}`);

    } catch (error: any) {
      console.error(`❌ 处理 ${customer.name} 时出错：`, error.message);
    }

    await sleep(500); // 避免连接过载
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 所有客户设置完成！');
  console.log('═'.repeat(60));
  console.log('\n⚠️  重要提示：');
  console.log('1. 请将登录信息保密，仅发送给对应客户的管理员');
  console.log('2. 建议客户首次登录后立即修改密码');
  console.log('3. 管理员可以在系统内创建更多子账号');

  await pool.end();
}

main().catch(console.error);
