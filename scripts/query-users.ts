import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('查询用户列表...\n');

  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      tenantId: true,
      roleId: true,
    },
    take: 20,
  });

  console.log('=== 用户列表 ===');
  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email}`);
    console.log(`   姓名: ${user.name || '未设置'}`);
    console.log(`   租户ID: ${user.tenantId}`);
    console.log(`   角色ID: ${user.roleId}`);
    console.log('');
  });

  if (users.length === 0) {
    console.log('数据库中没有用户！');
  }

  console.log(`总计: ${users.length} 个用户`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());