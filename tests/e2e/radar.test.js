const { test, expect } = require('@playwright/test');

test.describe('获客雷达功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customer/radar');
    // 两种渲染状态都会出现"发现任务"链接，以此判断内容已加载完成
    await page.waitForSelector('a:has-text("发现任务")', { timeout: 20000 });
  });

  test('页面应该显示获客雷达标题', async ({ page }) => {
    // exact: true 避免匹配到"五步启动获客雷达"的 h3
    await expect(page.getByRole('heading', { name: '获客雷达', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('应该显示五步启动引导或统计卡片', async ({ page }) => {
    const hasFiveSteps = await page.getByRole('heading', { name: '五步启动获客雷达', exact: true }).isVisible().catch(() => false);
    const hasStats = await page.getByText('本周新增').isVisible().catch(() => false);
    expect(hasFiveSteps || hasStats).toBeTruthy();
  });

  test('快捷入口应该可以点击跳转', async ({ page }) => {
    const tasksLink = page.getByRole('link', { name: '发现任务' });
    await expect(tasksLink).toBeVisible({ timeout: 10000 });
    await tasksLink.click();
    await expect(page).toHaveURL(/.*radar\/tasks/);
  });

  test('智能获客助手按钮应可交互', async ({ page }) => {
    const assistantSection = page.getByText('智能获客助手');
    const isVisible = await assistantSection.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }
    const triggerBtn = page.getByText('描述你的目标客户，AI帮你自动搜索...');
    await expect(triggerBtn).toBeVisible();
    await triggerBtn.click();
    const input = page.locator('input[placeholder*="例如：帮我寻找美国的"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('寻找日本精密制造工厂');
    const sendBtn = page.locator('button[class*="bg-\\[\\#D4AF37\\]"]').last();
    await expect(sendBtn).toBeEnabled();
  });
});
