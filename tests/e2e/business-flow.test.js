/**
 * VertaX 核心业务流程端到端测试
 * 验证：登录 → 决策中心 → 获客雷达 → 知识引擎 → 增长系统 → 声量枢纽
 */
const { chromium } = require('playwright');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

// 测试账号
const TEST_ACCOUNT = {
  email: 'admin@tdpaint.com',
  password: 'Tdpaint2026!'
};

const TIMEOUT = 60000;
const results = { passed: [], failed: [], warnings: [] };

function log(icon, msg) { console.log(`${icon} ${msg}`); }
function pass(msg) { results.passed.push(msg); log('✅', msg); }
function fail(msg) { results.failed.push(msg); log('❌', msg); }
function warn(msg) { results.warnings.push(msg); log('⚠️', msg); }

(async () => {
  log('🚀', `VertaX 核心业务流程测试`);
  log('📍', `URL: ${TARGET_URL}`);
  log('👤', `账号: ${TEST_ACCOUNT.email}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // 收集控制台错误
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // =============================================
    // 流程 1: 登录认证
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 1: 登录认证');
    console.log('='.repeat(60));

    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    // 检查登录表单
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible({ timeout: 10000 })) {
      pass('登录页面 - 邮箱输入框可见');
    } else {
      fail('登录页面 - 邮箱输入框不可见');
    }

    if (await passwordInput.isVisible({ timeout: 5000 })) {
      pass('登录页面 - 密码输入框可见');
    } else {
      fail('登录页面 - 密码输入框不可见');
    }

    // 填写登录表单
    await emailInput.fill(TEST_ACCOUNT.email);
    await passwordInput.fill(TEST_ACCOUNT.password);
    await page.screenshot({ path: 'tests/screenshots/biz-01-login-filled.png' });

    // 点击登录
    await submitBtn.click();
    log('⏳', '等待登录响应...');

    // 等待跳转离开 /login
    try {
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 });
      const afterLoginUrl = page.url();
      pass(`登录成功 - 跳转到: ${new URL(afterLoginUrl).pathname}`);
      await page.screenshot({ path: 'tests/screenshots/biz-02-after-login.png' });
    } catch (e) {
      // 检查是否有错误提示
      const errorText = await page.locator('[role="alert"], .text-red, .text-destructive, .error').first().textContent().catch(() => null);
      if (errorText) {
        fail(`登录失败 - 错误信息: ${errorText.trim()}`);
      } else {
        fail(`登录失败 - 未跳转 (可能账号不存在或密码错误)`);
      }
      await page.screenshot({ path: 'tests/screenshots/biz-02-login-failed.png' });
      // 登录失败后续测试仍继续尝试直接导航
    }

    // =============================================
    // 流程 2: 决策中心（客户主页）
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 2: 决策中心');
    console.log('='.repeat(60));

    await page.goto(`${TARGET_URL}/customer/home`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      fail('决策中心 - 未登录，被重定向到登录页');
    } else {
      pass(`决策中心 - 页面可访问 (${new URL(currentUrl).pathname})`);

      // 检查关键组件
      const sidebar = page.locator('nav, [class*="sidebar"]').first();
      if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('决策中心 - 侧边栏导航可见');
      } else {
        warn('决策中心 - 侧边栏导航不可见');
      }

      // 检查 AI 聊天组件
      const chatInput = page.locator('textarea, input[placeholder*="请"], input[placeholder*="商机"]').first();
      if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('决策中心 - AI 对话输入框可见');
      } else {
        warn('决策中心 - AI 对话输入框不可见');
      }
    }
    await page.screenshot({ path: 'tests/screenshots/biz-03-decision-center.png' });

    // =============================================
    // 流程 3: 获客雷达
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 3: 获客雷达');
    console.log('='.repeat(60));

    // 3a. 雷达主页
    await page.goto(`${TARGET_URL}/customer/radar`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);

    if (!page.url().includes('/login')) {
      pass('获客雷达 - 主页可访问');
    } else {
      fail('获客雷达 - 被重定向到登录页');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-04-radar-home.png' });

    // 3b. 渠道管理
    await page.goto(`${TARGET_URL}/customer/radar/channels`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 渠道管理页可访问');
    } else {
      fail('获客雷达 - 渠道管理被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-05-radar-channels.png' });

    // 3c. 候选池
    await page.goto(`${TARGET_URL}/customer/radar/candidates`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 候选池页可访问');
      // 检查筛选器
      const filters = page.locator('select, [role="combobox"], button:has-text("筛选"), button:has-text("状态")').first();
      if (await filters.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('获客雷达 - 候选池筛选器可见');
      } else {
        warn('获客雷达 - 候选池筛选器不可见');
      }
    } else {
      fail('获客雷达 - 候选池被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-06-radar-candidates.png' });

    // 3d. 线索库
    await page.goto(`${TARGET_URL}/customer/radar/prospects`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 线索库页可访问');
    } else {
      fail('获客雷达 - 线索库被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-07-radar-prospects.png' });

    // 3e. 机会追踪
    await page.goto(`${TARGET_URL}/customer/radar/opportunities`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 机会追踪页可访问');
    } else {
      fail('获客雷达 - 机会追踪被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-08-radar-opportunities.png' });

    // 3f. 画像/定向
    await page.goto(`${TARGET_URL}/customer/radar/targeting`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 画像定向页可访问');
    } else {
      fail('获客雷达 - 画像定向被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-09-radar-targeting.png' });

    // 3g. 发现任务
    await page.goto(`${TARGET_URL}/customer/radar/tasks`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('获客雷达 - 发现任务页可访问');
    } else {
      fail('获客雷达 - 发现任务被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-10-radar-tasks.png' });

    // =============================================
    // 流程 4: 知识引擎
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 4: 知识引擎');
    console.log('='.repeat(60));

    // 4a. 资料库
    await page.goto(`${TARGET_URL}/customer/knowledge/assets`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('知识引擎 - 资料库页可访问');
      // 检查上传按钮
      const uploadBtn = page.locator('button:has-text("上传"), button:has-text("Upload")').first();
      if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('知识引擎 - 上传资料按钮可见');
      } else {
        warn('知识引擎 - 上传资料按钮不可见');
      }
    } else {
      fail('知识引擎 - 资料库被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-11-knowledge-assets.png' });

    // 4b. 证据库
    await page.goto(`${TARGET_URL}/customer/knowledge/evidence`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('知识引擎 - 证据库页可访问');
    } else {
      fail('知识引擎 - 证据库被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-12-knowledge-evidence.png' });

    // 4c. 企业档案
    await page.goto(`${TARGET_URL}/customer/knowledge/company`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('知识引擎 - 企业档案页可访问');
    } else {
      fail('知识引擎 - 企业档案被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-13-knowledge-company.png' });

    // 4d. 品牌手册
    await page.goto(`${TARGET_URL}/customer/knowledge/guidelines`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('知识引擎 - 品牌手册页可访问');
    } else {
      fail('知识引擎 - 品牌手册被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-14-knowledge-guidelines.png' });

    // 4e. 买家画像
    await page.goto(`${TARGET_URL}/customer/knowledge/profiles`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('知识引擎 - 买家画像页可访问');
    } else {
      fail('知识引擎 - 买家画像被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-15-knowledge-profiles.png' });

    // =============================================
    // 流程 5: 增长系统（营销中心）
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 5: 增长系统');
    console.log('='.repeat(60));

    // 5a. 增长主页
    await page.goto(`${TARGET_URL}/customer/marketing`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('增长系统 - 主页可访问');
    } else {
      fail('增长系统 - 主页被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-16-marketing-home.png' });

    // 5b. 内容管理
    await page.goto(`${TARGET_URL}/customer/marketing/contents`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('增长系统 - 内容管理页可访问');
    } else {
      fail('增长系统 - 内容管理被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-17-marketing-contents.png' });

    // 5c. 话题规划
    await page.goto(`${TARGET_URL}/customer/marketing/topics`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('增长系统 - 话题规划页可访问');
    } else {
      fail('增长系统 - 话题规划被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-18-marketing-topics.png' });

    // 5d. SEO/AEO
    await page.goto(`${TARGET_URL}/customer/marketing/seo-aeo`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('增长系统 - SEO/AEO页可访问');
    } else {
      fail('增长系统 - SEO/AEO被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-19-marketing-seo-aeo.png' });

    // 5e. GEO 分发
    await page.goto(`${TARGET_URL}/customer/marketing/geo-center`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('增长系统 - GEO分发中心可访问');
    } else {
      fail('增长系统 - GEO分发中心被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-20-marketing-geo.png' });

    // =============================================
    // 流程 6: 声量枢纽（社交媒体）
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 6: 声量枢纽');
    console.log('='.repeat(60));

    await page.goto(`${TARGET_URL}/customer/social`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('声量枢纽 - 主页可访问');
    } else {
      fail('声量枢纽 - 主页被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-21-social-home.png' });

    await page.goto(`${TARGET_URL}/customer/social/accounts`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('声量枢纽 - 账号管理页可访问');
    } else {
      fail('声量枢纽 - 账号管理被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-22-social-accounts.png' });

    // =============================================
    // 流程 7: Tower 管理后台
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 7: Tower 管理后台');
    console.log('='.repeat(60));

    await page.goto(`${TARGET_URL}/tower`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('Tower - 管理后台主页可访问');
    } else {
      fail('Tower - 管理后台被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-23-tower-home.png' });

    await page.goto(`${TARGET_URL}/tower/tenants`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('Tower - 租户管理页可访问');
    } else {
      fail('Tower - 租户管理被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-24-tower-tenants.png' });

    await page.goto(`${TARGET_URL}/tower/inquiries`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    if (!page.url().includes('/login')) {
      pass('Tower - 询盘管理页可访问');
    } else {
      fail('Tower - 询盘管理被重定向');
    }
    await page.screenshot({ path: 'tests/screenshots/biz-25-tower-inquiries.png' });

    // =============================================
    // 流程 8: 侧边栏导航完整性
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📋', '流程 8: 侧边栏导航完整性');
    console.log('='.repeat(60));

    await page.goto(`${TARGET_URL}/customer/home`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);

    const navItems = [
      { text: '决策中心', selector: 'a:has-text("决策中心")' },
      { text: '获客雷达', selector: 'a:has-text("获客雷达"), button:has-text("获客雷达")' },
      { text: '增长系统', selector: 'a:has-text("增长系统"), button:has-text("增长系统")' },
      { text: '声量枢纽', selector: 'a:has-text("声量枢纽"), button:has-text("声量枢纽")' },
      { text: '知识引擎', selector: 'a:has-text("知识引擎"), button:has-text("知识引擎")' },
    ];

    for (const item of navItems) {
      const el = page.locator(item.selector).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        pass(`侧边栏 - "${item.text}" 菜单项可见`);
      } else {
        fail(`侧边栏 - "${item.text}" 菜单项不可见`);
      }
    }

    // =============================================
    // 汇总报告
    // =============================================
    console.log('\n' + '='.repeat(60));
    log('📊', '业务流程测试结果汇总');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${results.passed.length} 项`);
    console.log(`❌ 失败: ${results.failed.length} 项`);
    console.log(`⚠️  警告: ${results.warnings.length} 项`);
    console.log(`🔴 控制台错误: ${consoleErrors.length} 条`);

    if (results.failed.length > 0) {
      console.log('\n❌ 失败项:');
      results.failed.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  警告项:');
      results.warnings.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    }

    if (consoleErrors.length > 0) {
      console.log('\n🔴 控制台错误 (前5条):');
      consoleErrors.slice(0, 5).forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 200)}`));
    }

    const total = results.passed.length + results.failed.length;
    const passRate = Math.round((results.passed.length / total) * 100);
    console.log(`\n📈 通过率: ${passRate}% (${results.passed.length}/${total})`);

  } catch (error) {
    console.error('💥 测试执行异常:', error.message);
  } finally {
    await browser.close();
  }
})();
