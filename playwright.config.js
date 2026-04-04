/**
 * Playwright 配置文件
 * 用于 VertaX 项目的端到端测试
 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 超时设置
  timeout: 60 * 1000, // 每个测试 60 秒
  expect: {
    timeout: 5000 // 每个断言 5 秒
  },
  
  // 失败重试
  retries: process.env.CI ? 2 : 0,
  
  // 并行执行
  workers: process.env.CI ? 1 : undefined,
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['list'],
    ['json', { outputFile: 'tests/test-results.json' }]
  ],
  
  // 共享配置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 浏览器上下文
    headless: false, // 显示浏览器便于调试
    
    // 截图
    screenshot: 'only-on-failure',
    
    // 视频
    video: 'retain-on-failure',
    
    // 追踪
    trace: 'retain-on-failure',
    
    // 浏览器选项
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // 浏览器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/*'], // 暂时禁用 Firefox 测试
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/*'], // 暂时禁用 WebKit 测试
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: ['**/*'], // 暂时禁用移动测试
    },
  ],
  
  // Web 服务器配置（可选）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
