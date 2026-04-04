# VertaX 自动化测试指南

## 📋 测试概览

本项目已配置完整的自动化测试环境，使用 [Playwright](https://playwright.dev/) 框架进行端到端测试。

### 已创建的测试文件

1. **tests/e2e/homepage.test.js** - 首页功能测试
   - 页面加载测试
   - 响应式布局测试（Desktop/Tablet/Mobile）
   - 关键元素检查
   - 链接检查
   - 性能检查

2. **tests/e2e/login.test.js** - 登录功能测试
   - 登录页面显示
   - 表单验证
   - 表单输入
   - 注册链接
   - 导航跳转

3. **tests/e2e/navigation.test.js** - 导航测试
   - 主要页面访问
   - 客户视图导航
   - 管理后台导航
   - 404 页面处理

### 配置文件

- **playwright.config.js** - Playwright 配置文件
- **tests/run-tests.bat** - Windows 测试运行脚本
- **tests/check-env.bat** - 环境检查脚本
- **tests/README.md** - 测试文档

## 🚀 快速开始

### 步骤 1: 环境检查

运行环境检查脚本：

```bash
cd d:/vertax
.\tests\check-env.bat
```

该脚本会自动：
- ✅ 检查 Node.js 安装
- ✅ 检查 npm 安装
- ✅ 检查 Playwright 安装
- ✅ 检查开发服务器状态
- ✅ 创建必要的目录

### 步骤 2: 启动开发服务器

在运行测试之前，需要启动 Next.js 开发服务器：

```bash
cd d:/vertax
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 步骤 3: 运行测试

#### 方式 1: 使用运行脚本（推荐）

```bash
.\tests\run-tests.bat
```

#### 方式 2: 直接使用 Playwright 命令

```bash
# 运行所有测试
npx playwright test

# 运行特定测试
npx playwright test tests/e2e/homepage.test.js

# 有头模式（显示浏览器）
npx playwright test --headed

# 无头模式（后台运行）
npx playwright test --headless

# 生成 HTML 报告
npx playwright test --reporter=html
npx playwright show-report tests/playwright-report
```

## 📊 测试报告

测试完成后，可以查看：

1. **HTML 报告**: `tests/playwright-report/index.html`
2. **JSON 结果**: `tests/test-results.json`
3. **截图**: `tests/screenshots/` 目录

## 🎯 测试覆盖范围

### 当前测试覆盖

- ✅ 首页加载和布局
- ✅ 响应式设计（Desktop/Tablet/Mobile）
- ✅ 登录页面功能
- ✅ 导航路由
- ✅ 关键 UI 元素
- ✅ 链接完整性
- ✅ 404 页面处理

### 计划扩展的测试

- [ ] API 接口测试
- [ ] 获客雷达功能测试
- [ ] 知识引擎功能测试
- [ ] 营销中心功能测试
- [ ] 管理后台功能测试
- [ ] 用户认证流程测试
- [ ] 表单提交测试
- [ ] 数据导出测试

## 🛠️ 自定义测试

### 添加新测试示例

创建新的测试文件 `tests/e2e/radar.test.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('获客雷达测试', () => {
  test('雷达首页应该显示 5 步流程', async ({ page }) => {
    await page.goto('/c/radar');
    
    // 检查 5 步流程指示器
    const stepper = page.locator('[data-testid="radar-stepper"]');
    await expect(stepper).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: 'tests/screenshots/radar-stepper.png',
      fullPage: true 
    });
  });
});
```

## 📈 CI/CD 集成

### GitHub Actions 配置

创建 `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run Playwright tests
        run: npx playwright test --project=chromium
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## 🔧 故障排除

### 常见问题

**Q: 测试超时**
```bash
# 增加超时时间
npx playwright test --timeout=120000
```

**Q: 浏览器无法启动**
```bash
# 重新安装浏览器
npx playwright install chromium
```

**Q: 端口被占用**
```bash
# 修改 baseURL
set BASE_URL=http://localhost:3001
npx playwright test
```

**Q: 测试失败但没有截图**
检查 `playwright.config.js` 中的配置:
```javascript
use: {
  screenshot: 'only-on-failure',
}
```

## 📚 最佳实践

1. **保持测试独立性**: 每个测试应该独立运行，不依赖其他测试
2. **使用有意义的测试名称**: 描述测试的目的和预期结果
3. **添加适当的等待**: 使用 `waitForSelector` 而不是固定延迟
4. **截图保存关键步骤**: 便于调试和验证
5. **定期清理旧测试**: 删除过时的测试用例
6. **使用 Page Object 模式**: 对于复杂场景，封装页面操作

## 🎓 学习资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 测试最佳实践](https://playwright.dev/docs/best-practices)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [调试指南](https://playwright.dev/docs/debug)

## 📞 支持

如有测试相关问题，请：
1. 查看 `tests/README.md` 获取详细文档
2. 查看 Playwright 官方文档
3. 联系开发团队

---

**最后更新**: 2026-04-04
**测试框架**: Playwright v1.47+
**浏览器**: Chromium
