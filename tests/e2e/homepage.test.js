/**
 * VertaX 首页自动化测试
 * 测试首页的基本功能、响应式布局和内容完整性
 */
const { chromium } = require('playwright');
const path = require('path');

// 配置 URL - 可通过环境变量覆盖
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

// 测试配置
const CONFIG = {
  headless: false, // 显示浏览器便于调试
  slowMo: 100, // 放慢操作速度
  viewport: { width: 1920, height: 1080 }
};

(async () => {
  console.log('🚀 开始 VertaX 首页自动化测试');
  console.log('📍 测试 URL:', TARGET_URL);
  console.log('---');

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  const page = await browser.newPage();
  const results = {
    passed: [],
    failed: [],
    screenshots: []
  };

  try {
    // ========== 测试 1: 页面加载 ==========
    console.log('\n📋 测试 1: 页面加载测试');
    try {
      await page.goto(TARGET_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const title = await page.title();
      console.log(`✅ 页面成功加载，标题：${title}`);
      results.passed.push('页面加载成功');
      
      // 截图
      const screenshotPath = path.join('d:/vertax/tests/screenshots', 'homepage-loaded.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 截图已保存：${screenshotPath}`);
      results.screenshots.push(screenshotPath);
    } catch (error) {
      console.log(`❌ 页面加载失败：${error.message}`);
      results.failed.push(`页面加载：${error.message}`);
    }

    // ========== 测试 2: 响应式布局测试 ==========
    console.log('\n📋 测试 2: 响应式布局测试');
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height
        });
        
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        const screenshotPath = path.join('d:/vertax/tests/screenshots', `homepage-${viewport.name.toLowerCase()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) - 截图已保存`);
        results.passed.push(`${viewport.name} 响应式布局`);
        results.screenshots.push(screenshotPath);
      } catch (error) {
        console.log(`❌ ${viewport.name} 测试失败：${error.message}`);
        results.failed.push(`${viewport.name} 响应式：${error.message}`);
      }
    }

    // ========== 测试 3: 关键元素检查 ==========
    console.log('\n📋 测试 3: 关键元素检查');
    const criticalElements = [
      { selector: 'nav', description: '导航栏' },
      { selector: 'header', description: '页头' },
      { selector: 'main', description: '主内容区' },
      { selector: 'footer', description: '页脚' },
      { selector: '[href*="/login"]', description: '登录链接' },
      { selector: '[href*="/register"]', description: '注册链接' }
    ];

    for (const element of criticalElements) {
      try {
        const locator = page.locator(element.selector).first();
        const isVisible = await locator.isVisible({ timeout: 5000 });
        
        if (isVisible) {
          console.log(`✅ ${element.description} - 存在且可见`);
          results.passed.push(`${element.description} 显示正常`);
        } else {
          console.log(`⚠️  ${element.description} - 存在但不可见`);
          results.failed.push(`${element.description} 不可见`);
        }
      } catch (error) {
        console.log(`❌ ${element.description} - 未找到：${error.message}`);
        results.failed.push(`${element.description} 未找到`);
      }
    }

    // ========== 测试 4: 链接检查 ==========
    console.log('\n📋 测试 4: 主要链接检查');
    try {
      const links = await page.locator('a[href^="/"]').all();
      const linkCount = links.length;
      console.log(`✅ 发现 ${linkCount} 个内部链接`);
      results.passed.push(`发现 ${linkCount} 个内部链接`);
      
      // 测试前 5 个链接是否可点击
      const clickableLinks = [];
      for (let i = 0; i < Math.min(5, links.length); i++) {
        const href = await links[i].getAttribute('href');
        try {
          await links[i].scrollIntoViewIfNeeded();
          await links[i].hover();
          clickableLinks.push(href);
        } catch (error) {
          console.log(`⚠️  链接 ${href} 不可点击`);
        }
      }
      console.log(`✅ ${clickableLinks.length} 个链接可正常交互`);
      results.passed.push(`${clickableLinks.length} 个链接可交互`);
    } catch (error) {
      console.log(`❌ 链接检查失败：${error.message}`);
      results.failed.push(`链接检查：${error.message}`);
    }

    // ========== 测试 5: 性能检查 ==========
    console.log('\n📋 测试 5: 基础性能检查');
    try {
      const performanceMetrics = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          pageLoadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
        };
      });

      console.log(`⏱️  页面加载时间：${performanceMetrics.pageLoadTime}ms`);
      console.log(`⏱️  DOM 加载时间：${performanceMetrics.domContentLoaded}ms`);
      
      if (performanceMetrics.pageLoadTime < 3000) {
        console.log('✅ 页面加载性能良好 (<3s)');
        results.passed.push('页面加载性能良好');
      } else {
        console.log('⚠️  页面加载时间较长 (>3s)');
        results.failed.push('页面加载时间超过 3 秒');
      }
    } catch (error) {
      console.log(`❌ 性能检查失败：${error.message}`);
    }

    // ========== 测试总结 ==========
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过：${results.passed.length} 项`);
    console.log(`❌ 失败：${results.failed.length} 项`);
    console.log(`📸 截图：${results.screenshots.length} 张`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ 失败详情:');
      results.failed.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
    }

    console.log('\n✨ 测试完成');

  } catch (error) {
    console.error('💥 测试执行出错:', error.message);
  } finally {
    await browser.close();
  }
})();
