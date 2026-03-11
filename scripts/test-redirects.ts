/**
 * 测试 301 重定向规则
 *
 * 此脚本用于验证 next.config.ts 中的重定向配置是否正确工作
 */

import * as http from 'http';
import * as https from 'https';

interface RedirectTest {
  name: string;
  source: string;
  expectedDestination: string;
  expectedStatus: number;
}

// 测试用例
const testCases: RedirectTest[] = [
  // L1 分类重定向测试
  { name: 'Adhesives 变体 1', source: '/category/adhesives-tapes', expectedDestination: '/category/adhesives-sealants-and-tape', expectedStatus: 308 },
  { name: 'Adhesives 变体 2', source: '/category/adhesive-tape', expectedDestination: '/category/adhesives-sealants-and-tape', expectedStatus: 308 },
  { name: 'Safety 变体 1', source: '/category/safety-equipment', expectedDestination: '/category/safety', expectedStatus: 308 },
  { name: 'Safety 变体 2', source: '/category/ppe', expectedDestination: '/category/safety', expectedStatus: 308 },
  { name: 'Material Handling 变体', source: '/category/materials-handling', expectedDestination: '/category/material-handling', expectedStatus: 308 },

  // L2 分类重定向测试
  { name: 'Hand Protection 变体', source: '/category/hand-protection', expectedDestination: '/category/hand-arm-protection', expectedStatus: 308 },
  { name: 'Gloves 重定向', source: '/category/gloves', expectedDestination: '/category/safety-gloves', expectedStatus: 308 },
  { name: 'Casters 重定向', source: '/category/casters', expectedDestination: '/category/casters-wheels', expectedStatus: 308 },

  // L3 分类重定向测试
  { name: 'Safety Gloves 变体 1', source: '/category/work-gloves', expectedDestination: '/category/safety-gloves', expectedStatus: 308 },
  { name: 'Safety Gloves 变体 2', source: '/category/protective-gloves', expectedDestination: '/category/safety-gloves', expectedStatus: 308 },
  { name: 'Bump Caps 单数', source: '/category/bump-cap', expectedDestination: '/category/bump-caps', expectedStatus: 308 },
  { name: 'Hose Reels 单数', source: '/category/hose-reel', expectedDestination: '/category/hose-reels', expectedStatus: 308 },

  // 通用路径重定向测试
  { name: '旧产品列表页', source: '/products', expectedDestination: '/category/safety', expectedStatus: 308 },
  { name: '旧分类路径格式', source: '/c/safety', expectedDestination: '/category/safety', expectedStatus: 308 },
  { name: '旧商店路径', source: '/shop', expectedDestination: '/', expectedStatus: 308 },
  { name: '旧目录路径', source: '/catalog', expectedDestination: '/', expectedStatus: 308 },

  // 有效路径测试（不应重定向）
  { name: '有效 L1 分类', source: '/category/safety', expectedDestination: '/category/safety', expectedStatus: 200 },
  { name: '有效 L2 分类', source: '/category/hand-arm-protection', expectedDestination: '/category/hand-arm-protection', expectedStatus: 200 },
  { name: '有效 L3 分类', source: '/category/safety-gloves', expectedDestination: '/category/safety-gloves', expectedStatus: 200 },
];

/**
 * 发送 HTTP 请求并获取响应
 */
function makeRequest(url: string, baseUrl: string): Promise<{ status: number; location?: string }> {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(url, baseUrl);
    const client = fullUrl.protocol === 'https:' ? https : http;

    const req = client.request(
      fullUrl,
      { method: 'HEAD', timeout: 10000 },
      (res) => {
        resolve({
          status: res.statusCode || 0,
          location: res.headers.location,
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * 运行测试
 */
async function runTests(baseUrl: string) {
  console.log(`🧪 测试重定向规则: ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      const response = await makeRequest(test.source, baseUrl);

      // 检查状态码
      const statusMatch = response.status === test.expectedStatus;

      // 检查重定向目标
      let destinationMatch = true;
      if (test.expectedStatus >= 300 && test.expectedStatus < 400) {
        const expectedUrl = new URL(test.expectedDestination, baseUrl).href;
        destinationMatch = response.location === expectedUrl ||
                          response.location === test.expectedDestination;
      }

      if (statusMatch && destinationMatch) {
        console.log(`✅ ${test.name}`);
        console.log(`   ${test.source} -> ${response.location || '(no redirect)'}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   期望: ${test.expectedStatus} -> ${test.expectedDestination}`);
        console.log(`   实际: ${response.status} -> ${response.location}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   错误: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log(`\n📊 测试结果:`);
  console.log(`   通过: ${passed}/${testCases.length}`);
  console.log(`   失败: ${failed}/${testCases.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    console.error('错误: 请提供有效的 URL，例如 http://localhost:3000');
    process.exit(1);
  }

  await runTests(baseUrl);
}

main().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});
