const { test, expect } = require('@playwright/test');

test.describe('知识引擎功能测试', () => {
  test('应该从根路径重定向到资料库', async ({ page }) => {
    await page.goto('/customer/knowledge');
    await expect(page).toHaveURL(/.*knowledge\/assets/);
    await expect(page.getByText('上传资料').first()).toBeVisible({ timeout: 20000 });
  });

  test('应该可以访问买家画像页面', async ({ page }) => {
    await page.goto('/customer/knowledge/profiles');
    // 等待页面加载（不转圈了）
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    
    // 灵活匹配多种状态
    const states = [
      page.getByText('买家画像', { exact: true }).first(),
      page.getByText('输入来源').first(),
      page.getByText('需要先生成企业档案').first()
    ];
    
    let found = false;
    for (const state of states) {
      if (await state.isVisible()) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('应该可以访问企业档案页面', async ({ page }) => {
    await page.goto('/customer/knowledge/company');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    
    const states = [
      page.getByText('企业概览').first(),
      page.getByText('尚未生成企业档案').first(),
      page.getByText('由 AI 自动生成').first()
    ];
    
    let found = false;
    for (const state of states) {
      if (await state.isVisible()) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('证据库页面应该可以访问', async ({ page }) => {
    await page.goto('/customer/knowledge/evidence');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    
    const states = [
      page.getByText('证据库').first(),
      page.getByText('添加证据').first(),
      page.getByText('批量提取').first(),
      page.getByText('暂无证据数据').first()
    ];
    
    let found = false;
    for (const state of states) {
      if (await state.isVisible()) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });
});
