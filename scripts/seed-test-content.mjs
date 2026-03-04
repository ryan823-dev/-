import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const tenantId = 'cmmanspb30000anfp2ldflrov';

// Ensure default category
let catRes = await pool.query(
  `SELECT id FROM "ContentCategory" WHERE "tenantId" = $1 LIMIT 1`,
  [tenantId]
);
if (catRes.rows.length === 0) {
  catRes = await pool.query(
    `INSERT INTO "ContentCategory" (id, "tenantId", name, slug, description, "order", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, '默认分类', 'default', '默认', 0, NOW(), NOW())
     RETURNING id`,
    [tenantId]
  );
}
const categoryId = catRes.rows[0].id;

// Get user
const userRes = await pool.query(
  `SELECT id FROM "User" WHERE email = $1`,
  ['admin@tdpaintcell.com']
);
const authorId = userRes.rows[0].id;

console.log('categoryId:', categoryId, 'authorId:', authorId);

// Insert test content
const slug = 'industrial-coating-guide-' + Date.now().toString(36);
const content = await pool.query(
  `INSERT INTO "SeoContent" (
    id, "tenantId", "categoryId", "authorId",
    title, slug, excerpt, content,
    "metaTitle", "metaDescription", keywords, status,
    "aiMetadata", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid()::text, $1, $2, $3,
    $4, $5, $6, $7, $8, $9, $10,
    'draft', '{}', NOW(), NOW()
  ) RETURNING id, title`,
  [
    tenantId,
    categoryId,
    authorId,
    '工业涂料选型指南：如何为您的项目选择合适的防腐涂料',
    slug,
    '全面了解工业涂料的分类、性能特点和选型要素。',
    `## 工业涂料选型指南

工业涂料在现代制造业中扮演着至关重要的角色。无论是建筑钢结构、石油化工设备还是海洋工程装备，合适的涂料选择直接关系到设备的使用寿命和维护成本。

### 一、涂料分类

1. **环氧涂料** - 优异的附着力和耐化学品性能
2. **聚氨酯涂料** - 出色的耐候性和装饰性
3. **氟碳涂料** - 超长耐候性，适用于严苛环境
4. **无机富锌涂料** - 卓越的阴极保护功能

### 二、选型要素

- **使用环境**：温度、湿度、化学介质
- **基材类型**：碳钢、不锈钢、铝合金
- **防护等级**：C1-C5 腐蚀环境分级
- **施工条件**：喷涂、刷涂、辊涂

### 三、涂豆科技的解决方案

涂豆科技提供全方位的涂料解决方案，从选型咨询到施工指导，确保每个项目都能找到最优的防护方案。我们的技术团队拥有超过15年的行业经验，服务过3000+工业项目。`,
    '工业涂料选型指南 | 涂豆科技',
    '全面解析工业涂料分类、性能对比和选型方法。涂豆科技为您提供最优涂料方案。',
    '{工业涂料,防腐涂料,涂料选型,industrial coating}'
  ]
);

console.log('Created content:', JSON.stringify(content.rows[0]));
await pool.end();
