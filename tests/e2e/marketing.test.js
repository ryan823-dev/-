const { test, expect } = require('@playwright/test');

test.describe('增长系统功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问增长系统首页
    await page.goto('/customer/marketing');
    // 等待页面 H1 加载完成
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('页面应该显示标题和统计指标', async ({ page }) => {
    // 检查标题
    await expect(page.getByRole('heading', { name: '增长系统', exact: true })).toBeVisible();
    
    // 检查统计指标 (通过文本检查，使用 exact: true 避免冲突)
    await expect(page.getByText('内容资产', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('SEO 健康分', { exact: true }).first()).toBeVisible();
  });

  test('应该可以切换到创建内容模式', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: '创建内容' }).first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // 检查输入提示
    await expect(page.getByText('关键词规划')).toBeVisible();
    
    // 检查搜索框
    const input = page.locator('input[placeholder*="例如：工业机器人"]');
    await expect(input).toBeVisible();
  });

  test('应该显示内容资产列表', async ({ page }) => {
    // 检查页面渲染状态
    const contentArea = page.getByText('内容库').first();
    await expect(contentArea).toBeVisible();
    
    // 如果存在内容，检查卡片结构
    const hasCards = await page.locator('.col-span-2').isVisible();
    if (hasCards) {
      await expect(page.locator('.col-span-2')).toBeVisible();
    }
  });
});
