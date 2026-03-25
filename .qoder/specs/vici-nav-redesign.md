# ViciVidi 线索发现流程优化方案

## Context

**问题背景**：ViciVidi AI 是 B2B 获客雷达平台，核心目标是**帮助企业快速找到潜在客户线索**。

**现状分析**：
- ✅ 后端完整：已实现 4 个数据源（LinkedIn, GitHub, Product Hunt, AngelList）
- ✅ API 完善：`/api/prospects/discover` 支持多维度搜索
- ✅ 丰富化引擎：三层架构自动补充公司/联系人信息
- ❌ **前端缺失**：没有"线索发现"的 UI 入口
- ❌ **流程断裂**：用户无法直接触发线索发现功能
- ❌ **导航混乱**：14个导航项，核心功能被淹没

**当前可用方式（效率低）**：
1. 手动添加线索 - 填写表单
2. 批量导入 - 上传 CSV
3. 添加公司 - 输入域名

**核心问题**：用户登录后没有快速"找客户"的入口！

**预期结果**：登录后直接进入线索发现工作区，一键触发多数据源搜索。

---

## 核心修改：Leads 页面首屏设计

在 Leads 页面顶部添加醒目的"发现线索"区域：

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 发现线索                                 高效获客 →     │
├─────────────────────────────────────────────────────────────┤
│  [LinkedIn] [GitHub] [Product Hunt] [AngelList]              │
│                                                              │
│  数据源选择：○ LinkedIn  ○ GitHub  ○ Product Hunt  ○ AngelList│
│                                                              │
│  关键词：   [例如：SaaS, AI, CRM                          ]│
│  地区：     [例如：美国, 加州, 硅谷                       ]│
│  行业：     [例如：SaaS, 电商, 金融科技                   ]│
│                                                              │
│                     [开始搜索 →]                             │
│                                                              │
│  预计发现：20-50 条线索 | 预计耗时：5-10 秒                │
└─────────────────────────────────────────────────────────────┘
```

点击按钮打开线索发现对话框，展示搜索结果并支持批量导入。

---

## 实施步骤

### Step 1: 创建线索发现对话框组件

**新建文件**: `/src/components/leads/lead-discovery-dialog.tsx`

功能：
- 数据源选择（4个图标按钮：LinkedIn, GitHub, Product Hunt, AngelList）
- 搜索条件表单（关键词、地区、行业、技术栈等）
- 动态字段（根据数据源显示不同字段）
- 调用 `/api/prospects/discover` API
- 展示发现结果列表（可预览）
- 批量选择/全部导入功能
- 导入后自动触发数据丰富化

### Step 2: 修改 Leads 页面首屏

**修改文件**: `/src/app/(dashboard)/leads/page.tsx`

在页面顶部添加"发现线索"区域：
- 大标题："发现线索"
- 副标题："从 LinkedIn、GitHub、Product Hunt、AngelList 快速找到潜在客户"
- "立即发现"主按钮（大号、渐变色、显眼）
- 4 个数据源图标 + 简短说明
- 预计结果提示

点击按钮打开 `LeadDiscoveryDialog`

### Step 3: 精简侧边栏导航

**修改文件**: `/src/components/layout/sidebar.tsx`

主导航保留 3 项：
- 🎯 线索雷达 (`/leads`) - 默认首页
- 🏢 公司库 (`/companies`)
- 📊 数据分析 (`/analytics`)

移除/隐藏的导航项：
- Dashboard → 重定向到 /leads
- Lists → 合并到 Leads
- Schedules, Duplicates, Costs, Notifications, Addons, Api-access, Subscription → 移入用户菜单或设置

用户菜单添加：
- 订阅与计费 (`/billing`)
- 团队管理 (`/team`)
- 设置 (`/settings`)
- 退出登录

### Step 4: 修改登录后重定向

**修改文件**: `/src/app/(auth)/login/page.tsx`

- 登录成功后跳转到 `/leads`（而非 `/dashboard`）

### Step 5: 创建 Header 和 UserMenu

**新建文件**: `/src/components/layout/header.tsx`

- 全局搜索框
- 通知图标（带未读数量角标）
- 用户菜单入口

**新建文件**: `/src/components/layout/user-menu.tsx`

- 用户头像下拉菜单
- 包含：订阅与计费、团队管理、设置、退出登录

**修改文件**: `/src/app/(dashboard)/layout.tsx`

- 添加 Header 组件到布局

### Step 6: 更新国际化

**修改文件**: `/src/i18n/messages/zh.json`
**修改文件**: `/src/i18n/messages/en.json`

添加线索发现相关文案：
```json
{
  "leads": {
    "discover": {
      "title": "发现线索",
      "subtitle": "从 LinkedIn、GitHub、Product Hunt、AngelList 快速找到潜在客户",
      "button": "立即发现",
      "sources": {
        "linkedin": "LinkedIn - 全球职场人脉",
        "github": "GitHub - 开发者社区",
        "producthunt": "Product Hunt - 新产品发布",
        "angellist": "AngelList - 初创企业"
      },
      "form": {
        "source": "数据源",
        "keywords": "关键词",
        "location": "地区",
        "industry": "行业",
        "technologies": "技术栈",
        "search": "开始搜索",
        "estimated": "预计发现 {count} 条线索"
      },
      "results": {
        "title": "发现结果",
        "selectAll": "全选",
        "importSelected": "导入选中的 {count} 条线索",
        "importAll": "全部导入",
        "importing": "导入中...",
        "success": "成功导入 {count} 条线索"
      }
    }
  },
  "nav": {
    "leads": "线索雷达",
    "companies": "公司库",
    "analytics": "数据分析",
    "billing": "订阅与计费",
    "team": "团队管理",
    "settings": "设置",
    "logout": "退出登录"
  }
}
```

---

## 关键文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `/src/components/leads/lead-discovery-dialog.tsx` | 新建 | 核心功能组件 |
| `/src/app/(dashboard)/leads/page.tsx` | 修改 | 添加发现区域 |
| `/src/components/layout/sidebar.tsx` | 修改 | 精简导航 |
| `/src/components/layout/header.tsx` | 新建 | 顶部栏 |
| `/src/components/layout/user-menu.tsx` | 新建 | 用户菜单 |
| `/src/app/(dashboard)/layout.tsx` | 修改 | 添加 Header |
| `/src/app/(auth)/login/page.tsx` | 修改 | 修改重定向目标 |
| `/src/i18n/messages/zh.json` | 更新 | 中文文案 |
| `/src/i18n/messages/en.json` | 更新 | 英文文案 |

---

## 验证步骤

### 1. 启动开发服务器

```bash
cd /Users/oceanlink/Documents/Qoder-1/ViciVidi
npm run dev
```

### 2. 验证线索发现流程

- [ ] 登录成功后自动跳转到 `/leads`
- [ ] 首屏顶部显示"发现线索"区域
- [ ] 点击"立即发现"按钮打开对话框
- [ ] 选择数据源（如 LinkedIn）
- [ ] 输入关键词（如 "SaaS"）
- [ ] 点击"开始搜索"查看结果
- [ ] 勾选线索并点击"导入"
- [ ] 导入成功后 Leads 列表刷新

### 3. 验证导航结构

- [ ] 侧边栏只有 3 个核心项
- [ ] 点击用户头像显示下拉菜单
- [ ] 用户菜单可访问计费/团队/设置
- [ ] 顶部栏显示搜索框和通知图标

### 4. 验证数据流

- [ ] 调用 `/api/prospects/discover` API 成功
- [ ] 新线索添加到数据库
- [ ] 调用 `/api/enrichment` 自动丰富数据
- [ ] AI 评分和分层正常工作

---

## 后续优化建议

1. **通知面板**：点击通知图标显示下拉面板
2. **全局搜索**：实现跨线索/公司的实时搜索
3. **Dashboard 重定向**：访问 `/dashboard` 自动重定向到 `/leads`
4. **智能推荐**：根据历史搜索推荐相关数据源和关键词
5. **搜索历史**：保存用户的搜索条件供快速复用