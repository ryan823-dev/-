# VertaX 自动化测试

本项目使用 [Playwright](https://playwright.dev/) 进行端到端自动化测试。

## 📦 安装

### 首次安装

```bash
# 安装 Playwright 依赖
npm install -D playwright @playwright/test

# 安装 Chromium 浏览器
npx playwright install chromium
```

## 🚀 运行测试

### 方式 1: 使用运行脚本（推荐）

```bash
# Windows
.\tests\run-tests.bat

# Linux/Mac
bash tests/run-tests.sh
```

### 方式 2: 直接使用 Playwright 命令

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/homepage.test.js

# 运行特定测试用例
npx playwright test --grep "登录功能"

# 有头模式（显示浏览器）
npx playwright test --headed

# 无头模式（后台运行）
npx playwright test --headless

# 指定浏览器
npx playwright test --project=chromium
npx playwright test --project=firefox

# 指定 baseURL
npx playwright test --config=playwright.config.js

# 生成 HTML 报告
npx playwright test --reporter=html

# 查看报告
npx playwright show-report tests/playwright-report
```

## 📁 测试目录结构

```
tests/
├── e2e/                      # 端到端测试用例
│   ├── homepage.test.js      # 首页测试
│   ├── login.test.js         # 登录功能测试
│   └── navigation.test.js    # 导航测试
├── screenshots/              # 测试截图（自动生成）
├── playwright-report/        # HTML 测试报告（自动生成）
├── run-tests.bat             # Windows 运行脚本
├── run-tests.sh              # Linux/Mac 运行脚本
└── README.md                 # 测试文档
```

## 📝 测试用例说明

### 1. 首页测试 (`homepage.test.js`)

- ✅ 页面加载测试
- ✅ 响应式布局测试（Desktop/Tablet/Mobile）
- ✅ 关键元素检查（导航栏、页头、主内容、页脚）
- ✅ 链接检查
- ✅ 性能检查

### 2. 登录功能测试 (`login.test.js`)

- ✅ 登录页面显示
- ✅ 表单验证
- ✅ 表单输入
- ✅ 注册链接
- ✅ 导航跳转

### 3. 导航测试 (`navigation.test.js`)

- ✅ 主要页面访问
- ✅ 客户视图导航
- ✅ 管理后台导航
- ✅ 404 页面处理

## 🔧 配置选项

### 环境变量

```bash
# 设置测试的 baseURL
set BASE_URL=http://localhost:3001
npx playwright test

# 或使用 .env 文件
BASE_URL=http://localhost:3001
```

### Playwright 配置 (`playwright.config.js`)

```javascript
module.exports = {
  timeout: 60000,           // 测试超时时间
  retries: 0,               // 失败重试次数
  workers: 1,               // 并行工作线程数
  
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,        // 是否无头模式
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
};
```

## 📊 测试报告

### HTML 报告

运行测试后，生成 HTML 报告：

```bash
npx playwright test --reporter=html
npx playwright show-report tests/playwright-report
```

### JSON 报告

测试结果会保存为 JSON 文件：

```
tests/test-results.json
```

## 🎯 添加新测试

### 示例：添加 API 测试

```javascript
// tests/e2e/api.test.js
const { test, expect } = require('@playwright/test');

test.describe('API 测试', () => {
  test('GET /api/health 应该返回健康状态', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});
```

### 示例：添加组件测试

```javascript
// tests/e2e/components.test.js
const { test, expect } = require('@playwright/test');

test.describe('组件测试', () => {
  test('导航栏应该显示所有菜单项', async ({ page }) => {
    await page.goto('/');
    
    const navItems = page.locator('nav a');
    await expect(navItems).toHaveCount(5);
    
    // 验证菜单项文本
    const texts = await navItems.allTextContents();
    expect(texts).toContain('首页');
    expect(texts).toContain('产品');
  });
});
```

## 🐛 调试技巧

### 1. 使用 Playwright Inspector

```bash
# 调试模式运行
PWDEBUG=1 npx playwright test

# 或
npx playwright test --debug
```

### 2. 添加断点

在测试代码中添加：

```javascript
await page.pause(); // 暂停执行
```

### 3. 慢动作回放

```javascript
const browser = await chromium.launch({ slowMo: 1000 });
```

### 4. 控制台日志

```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

## 📈 CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/e2e-tests.yml
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
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## 📚 参考文档

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [测试最佳实践](https://playwright.dev/docs/best-practices)

## 🆘 常见问题

### Q: 测试超时怎么办？

A: 增加超时时间：

```bash
npx playwright test --timeout=120000
```

或在配置文件中修改：

```javascript
timeout: 120000,
```

### Q: 如何在 CI 环境中运行？

A: 使用无头模式并安装浏览器依赖：

```bash
npx playwright install --with-deps
npx playwright test --headless
```

### Q: 测试失败如何查看截图？

A: 失败的截图保存在 `tests/screenshots/` 目录，HTML 报告中也包含截图。

### Q: 如何只运行失败的测试？

A: 使用 `--last-failed` 标志：

```bash
npx playwright test --last-failed
```

## 📞 联系支持

如有测试相关问题，请联系开发团队或查看 Playwright 官方文档。
