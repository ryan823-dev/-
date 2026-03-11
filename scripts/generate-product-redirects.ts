/**
 * 生成产品级别 301 重定向规则
 *
 * 此脚本根据产品数据生成从旧分类路径到新分类路径的重定向规则
 * 用于处理 Google Search Console 中的 404 错误
 *
 * 使用方法:
 * 1. 从 Google Search Console 导出 404 错误报告
 * 2. 将旧路径映射到新产品路径
 * 3. 运行此脚本生成重定向规则
 * 4. 将生成的规则添加到 next.config.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProductRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

interface ProductData {
  SKU: string;
  slug: string;
  categorySlug: string;
  oldCategorySlug?: string;
}

/**
 * 生成 slug（与 Payload CMS 中的逻辑一致）
 */
function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * 从 Excel 数据生成产品重定向规则
 */
function generateProductRedirectsFromExcel(excelData: any[]): ProductRedirect[] {
  const redirects: ProductRedirect[] = [];
  const seenSources = new Set<string>();

  for (const row of excelData) {
    const sku = row.SKU;
    const productSlug = generateSlug(row.Name || '');

    // 获取新旧分类 slug
    const newL1Slug = generateSlug(row['L1 Category'] || '');
    const newL2Slug = generateSlug(row['L2 Category'] || '');
    const newL3Slug = generateSlug(row['L3 Category'] || '');

    // 产品 URL 使用 L2 或 L3 的 slug 作为分类路径
    // 根据代码逻辑，优先使用 L2 slug
    const newCategorySlug = newL2Slug || newL3Slug || 'products';

    // 如果有旧分类信息，生成重定向
    if (row['Old L1 Category'] || row['Old L2 Category'] || row['Old L3 Category']) {
      const oldL1Slug = generateSlug(row['Old L1 Category'] || '');
      const oldL2Slug = generateSlug(row['Old L2 Category'] || '');
      const oldL3Slug = generateSlug(row['Old L3 Category'] || '');
      const oldCategorySlug = oldL2Slug || oldL3Slug || 'products';

      if (oldCategorySlug !== newCategorySlug && productSlug) {
        const source = `/product/${oldCategorySlug}/${productSlug}`;
        const destination = `/product/${newCategorySlug}/${productSlug}`;

        if (!seenSources.has(source)) {
          seenSources.add(source);
          redirects.push({
            source,
            destination,
            permanent: true,
          });
        }
      }
    }

    // 处理 SKU 级别的重定向（如果有旧 SKU）
    if (row['Old SKU'] && row['Old SKU'] !== sku) {
      const oldProductSlug = generateSlug(row['Old Name'] || row.Name || '');
      const categorySlug = newL2Slug || newL3Slug || 'products';

      if (oldProductSlug && oldProductSlug !== productSlug) {
        const source = `/product/${categorySlug}/${oldProductSlug}`;
        const destination = `/product/${categorySlug}/${productSlug}`;

        if (!seenSources.has(source)) {
          seenSources.add(source);
          redirects.push({
            source,
            destination,
            permanent: true,
          });
        }
      }
    }
  }

  return redirects;
}

/**
 * 从 404 报告生成重定向规则
 */
function generateRedirectsFrom404Report(
  reportData: { oldPath: string; newPath?: string; suggestedCategory?: string }[]
): ProductRedirect[] {
  const redirects: ProductRedirect[] = [];
  const seenSources = new Set<string>();

  for (const item of reportData) {
    const { oldPath, newPath, suggestedCategory } = item;

    if (!oldPath) continue;

    let destination = newPath;

    // 如果没有提供新路径，尝试根据建议分类生成
    if (!destination && suggestedCategory) {
      const categorySlug = generateSlug(suggestedCategory);
      // 从旧路径中提取产品 slug
      const productSlugMatch = oldPath.match(/\/product\/[^/]+\/([^/]+)/);
      if (productSlugMatch) {
        destination = `/product/${categorySlug}/${productSlugMatch[1]}`;
      }
    }

    if (destination && destination !== oldPath) {
      if (!seenSources.has(oldPath)) {
        seenSources.add(oldPath);
        redirects.push({
          source: oldPath,
          destination,
          permanent: true,
        });
      }
    }
  }

  return redirects;
}

/**
 * 生成 Next.js 重定向配置代码
 */
function generateRedirectCode(redirects: ProductRedirect[]): string {
  const redirectLines = redirects.map(
    (r) => `    { source: '${r.source}', destination: '${r.destination}', permanent: ${r.permanent} }`
  );

  return `// 自动生成的 301 重定向规则
// 生成时间: ${new Date().toISOString()}
// 规则数量: ${redirects.length}

const productRedirects = [
${redirectLines.join(',\n')}
];

export default productRedirects;
`;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 生成产品级别 301 重定向规则...\n');

  // 示例：从 Excel 数据生成
  // const excelData = require('../machrio_export_consolidated1522.json');
  // const redirects = generateProductRedirectsFromExcel(excelData);

  // 示例：从 404 报告生成
  // const reportData = require('../404-report.json');
  // const redirects = generateRedirectsFrom404Report(reportData);

  // 目前生成一个空模板，等待具体数据
  const redirects: ProductRedirect[] = [];

  // 保存生成的重定向规则
  const outputPath = path.join(__dirname, '../generated/product-redirects.ts');

  // 确保目录存在
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, generateRedirectCode(redirects));

  console.log(`✅ 重定向规则已生成: ${outputPath}`);
  console.log(`📊 规则数量: ${redirects.length}`);

  if (redirects.length === 0) {
    console.log('\n⚠️  警告: 没有生成任何重定向规则');
    console.log('请提供以下数据之一:');
    console.log('  1. 包含旧分类信息的 Excel 文件');
    console.log('  2. Google Search Console 404 报告');
    console.log('\n使用方法:');
    console.log('  1. 将旧分类路径添加到 Excel 文件的 "Old L1/2/3 Category" 列');
    console.log('  2. 或创建 404-report.json 文件，包含旧路径和新路径的映射');
    console.log('  3. 取消注释 main() 函数中的相应代码行');
    console.log('  4. 重新运行此脚本');
  }

  // 生成 next.config.ts 更新说明
  console.log('\n📋 更新 next.config.ts 的方法:');
  console.log('  1. 将生成的规则导入到 next.config.ts:');
  console.log(`     import productRedirects from './generated/product-redirects';`);
  console.log('  2. 在 redirects() 函数中合并规则:');
  console.log('     return [...categoryRedirects, ...productRedirects];');
}

main().catch(console.error);
