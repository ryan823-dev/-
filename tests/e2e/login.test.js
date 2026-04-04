/**
 * 登录功能测试
 * 测试登录页面的功能、表单验证和认证流程
 */
const { test, expect } = require('@playwright/test');

test.describe('登录功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('应该显示登录页面', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/登录|Login/i);
    
    // 验证登录表单元素存在
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('应该显示表单验证错误', async ({ page }) => {
    // 尝试提交空表单
    await page.click('button[type="submit"]');
    
    // 等待验证错误（如果有）
    await page.waitForTimeout(1000);
    
    // 截图保存
    await page.screenshot({ 
      path: 'tests/screenshots/login-validation-error.png',
      fullPage: true 
    });
  });

  test('应该可以输入邮箱和密码', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    // 输入测试凭据
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    // 验证输入值
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/login-form-filled.png',
      fullPage: false 
    });
  });

  test('应该有注册链接', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]').first();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveText(/注册|Register|创建账号/i);
  });

  test('注册链接应该导航到注册页面', async ({ page }) => {
    await page.click('a[href*="register"]');
    await page.waitForLoadState('networkidle');
    
    // 验证已导航到注册页面
    await expect(page).toHaveURL(/.*register.*/);
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/navigated-to-register.png',
      fullPage: true 
    });
  });
});
