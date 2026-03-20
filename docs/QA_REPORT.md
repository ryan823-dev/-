# QA 问题记录

## 严重 BUG (已修复)

### 1. TypeScript 类型错误
- **状态**: 已修复
- **问题**: 多个雷达适配器 (Hunter, PDL, Tavily, Exa) 缺少 `normalize` 方法实现
- **影响**: 编译失败
- **修复**: 为所有适配器添加 normalize 方法

### 2. cheerio 类型问题
- **状态**: 已修复
- **问题**: web-scraper.ts 中 cheerio.Element 类型导入错误
- **修复**: 使用 `any` 类型和 eslint-disable 注释

### 3. 元数据字段不匹配
- **状态**: 已修复
- **问题**: 多个适配器在 metadata 中使用了接口未定义的字段
  - UNGM: `method`, `error`
  - Exa: `cost`
  - Tavily: `responseTime`
- **修复**: 移除未定义的字段

---

## 小问题 (待后续处理)

### 1. 重复的路由结构
- **问题**: 项目存在两套路由结构:
  - `(dashboard)/` - 内部运营后台
  - `(customer)/c/` - 客户前台
- **建议**: 考虑统一或明确区分

### 2. Playwright 浏览器未安装
- **问题**: QA 测试无法使用 Playwright 进行端到端测试
- **建议**: 运行 `npx playwright install chromium`

### 3. API base-prompt 和 categories 缺失
- **问题**: 尝试访问 `/api/knowledge/base-prompt` 和 `/api/knowledge/categories` 返回 404
- **建议**: 如果这些 API 需要存在，创建相应的 route.ts 文件

### 4. 开发服务器稳定性
- **问题**: 开发服务器偶尔需要重启
- **建议**: 考虑使用 PM2 或类似工具管理进程

### 5. 重复的页面组件
- **问题**: 有些页面文件可能有重复内容
  - `(dashboard)/knowledge/page.tsx`
  - `(customer)/c/knowledge/page.tsx`
- **建议**: 审查并统一

---

## 改进建议

### 1. 添加更多 API 测试
- 需要为 API 端点添加自动化测试
- 特别是认证后的 API 调用

### 2. 性能监控
- 添加页面加载时间监控
- API 响应时间追踪

### 3. 移动端兼容性
- 未测试移动端视图

### 4. 国际化完整性
- 检查所有翻译 key 是否完整
- 验证 zh-CN 和 en 翻译一致性

---

## 测试结果汇总

| 页面 | 状态 |
|------|------|
| /zh-CN/dashboard | 200 OK |
| /zh-CN/knowledge | 200 OK |
| /zh-CN/assets | 200 OK |
| /zh-CN/products | 200 OK |
| /zh-CN/seo | 200 OK |
| /zh-CN/leads | 200 OK |
| /zh-CN/social | 200 OK |
| /zh-CN/settings | 200 OK |
| /zh-CN/c/radar | 200 OK |
| /zh-CN/c/radar/candidates | 200 OK |
| /zh-CN/c/knowledge/assets | 200 OK |
| /zh-CN/c/knowledge/evidence | 200 OK |

---

*生成时间: 2026-03-20*
