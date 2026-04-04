/**
 * 导航测试
 * 测试主要导航链接和路由功能
 */
const { test, expect } = require('@playwright/test');

test.describe('主要导航测试', () => {
  test('首页应该可以访问', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/homepage.png',
      fullPage: true 
    });
  });

  test('应该可以访问登录页面', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('应该可以访问注册页面', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register.*/);
  });

  test('404 页面应该正常工作', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    
    // 应该显示 404 页面或重定向
    const statusCode = await page.evaluate(() => {
      return {
        url: window.location.href,
        body: document.body.innerText
      };
    });
    
    console.log('404 测试 - URL:', statusCode.url);
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/404-page.png',
      fullPage: true 
    });
  });
});

test.describe('客户视图导航测试', () => {
  test('客户首页应该可以访问', async ({ page }) => {
    await page.goto('/customer/home');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/customer-home.png',
      fullPage: true 
    });
  });

  test('获客雷达页面应该可以访问', async ({ page }) => {
    await page.goto('/customer/radar');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/radar-page.png',
      fullPage: true 
    });
  });

  test('知识引擎页面应该可以访问', async ({ page }) => {
    await page.goto('/customer/knowledge');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/knowledge-page.png',
      fullPage: true 
    });
  });

  test('营销中心页面应该可以访问', async ({ page }) => {
    await page.goto('/customer/marketing');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/marketing-page.png',
      fullPage: true 
    });
  });
});

test.describe('管理后台导航测试', () => {
  test('Tower 管理后台应该可以访问', async ({ page }) => {
    await page.goto('/tower');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/tower-admin.png',
      fullPage: true 
    });
  });

  test('租户管理页面应该可以访问', async ({ page }) => {
    await page.goto('/tower/tenants');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/tenants-page.png',
      fullPage: true 
    });
  });
});
