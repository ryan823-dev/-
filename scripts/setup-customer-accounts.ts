/**
 * 客户账号设置脚本
 * 
 * 为 tdpaint 和 machrio 两个客户创建全新的管理员账号
 * 
 * 运行方式：npx tsx scripts/setup-customer-accounts.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// 检查环境变量
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误：缺少 DATABASE_URL 环境变量');
  console.error('\n请检查 .env 文件是否存在');
  process.exit(1);
}

const prisma = new PrismaClient();

// 客户配置
const CUSTOMERS = [
  {
    slug: 'tdpaint',
    name: '涂豆科技',
    adminEmail: 'admin@tdpaint.com',
    adminName: '涂豆管理员',
    adminPassword: 'Tdpaint2026!',
    accessUrl: 'https://tdpaint.vertax.top',
  },
  {
    slug: 'machrio',
    name: 'MachRio',
    adminEmail: 'admin@machrio.com',
    adminName: 'MachRio 管理员',
    adminPassword: 'Machrio2026!',
    accessUrl: 'https://machrio.vertax.top',
  },
];

async function main() {
  console.log('🚀 开始设置客户管理员账号...\n');

  try {
    for (const customer of CUSTOMERS) {
      console.log(`\n📋 处理客户：${customer.name} (${customer.slug})`);
      console.log('─'.repeat(50));

      // 1. 查找租户
      const tenant = await prisma.tenant.findFirst({
        where: { slug: customer.slug },
      });

      if (!tenant) {
        console.warn(`⚠️  未找到租户 ${customer.slug}，跳过`);
        continue;
      }

      console.log(`✅ 找到租户：${tenant.name} (ID: ${tenant.id})`);

      // 2. 清空该租户的现有用户
      const existingUsersCount = await prisma.user.count({
        where: { tenantId: tenant.id },
      });

      if (existingUsersCount > 0) {
        console.log(`🗑️  删除 ${existingUsersCount} 个现有用户...`);
        await prisma.user.deleteMany({
          where: { tenantId: tenant.id },
        });
        console.log(`✅ 已清空现有用户`);
      } else {
        console.log(`ℹ️  没有现有用户需要清理`);
      }

      // 3. 查找或创建角色
      let role = await prisma.role.findFirst({
        where: { name: 'tenant_admin' },
      });

      if (!role) {
        console.log(`📝 创建角色：tenant_admin`);
        role = await prisma.role.create({
          data: {
            name: 'tenant_admin',
            displayName: '企业管理员',
            permissions: { all: true },
            isSystemRole: false,
            description: '企业客户管理员，拥有该企业的所有权限',
          },
        });
        console.log(`✅ 角色创建完成`);
      } else {
        console.log(`✅ 使用现有角色：${role.displayName}`);
      }

      // 4. 创建新管理员账号
      console.log(`\n👤 创建管理员账号：`);
      console.log(`   邮箱：${customer.adminEmail}`);
      console.log(`   姓名：${customer.adminName}`);
      console.log(`   密码：${customer.adminPassword}`);

      const hashedPassword = await bcrypt.hash(customer.adminPassword, 10);

      const user = await prisma.user.create({
        data: {
          email: customer.adminEmail,
          name: customer.adminName,
          password: hashedPassword,
          tenantId: tenant.id,
          roleId: role.id,
        },
      });

      console.log(`✅ 管理员账号创建成功 (ID: ${user.id})`);

      // 5. 显示访问信息
      console.log(`\n🌐 访问地址：${customer.accessUrl}`);
      console.log(`📧 登录邮箱：${customer.adminEmail}`);
      console.log(`🔑 登录密码：${customer.adminPassword}`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✅ 所有客户账号设置完成！');
    console.log('═'.repeat(50));
    console.log('\n⚠️  重要提示：');
    console.log('1. 请将登录信息保密，仅发送给对应客户的管理员');
    console.log('2. 建议客户首次登录后立即修改密码');
    console.log('3. 管理员可以在系统内创建更多子账号');
    console.log('\n💡 后续操作：');
    console.log('- 登录系统后，配置获客雷达的数据源');
    console.log('- 设置企业画像和 ICP 定位');
    console.log('- 开始使用内容创作和营销功能');
  } catch (error) {
    console.error('\n❌ 发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
