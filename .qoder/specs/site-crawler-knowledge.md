# 整站抓取功能设计方案

## 概述

扩展知识引擎的网页抓取功能，支持用户输入域名后自动发现并抓取整站关键页面（最多30个），分批提取生成知识卡片。

## 架构流程

```
用户输入域名 → 启动抓取任务 → BFS发现页面 → 分批抓取内容 → AI提取知识 → 合并卡片
     ↑                                    ↓
     └────────────── 前端轮询进度 ←────────┘
```

## 实现步骤

### Phase 1: 数据模型 (models/SiteCrawl.ts)

**新建** MongoDB 模型存储抓取任务状态：

```typescript
interface ISiteCrawl {
  tenantId: ObjectId;
  rootUrl: string;                    // 起始域名
  status: 'pending' | 'discovering' | 'crawling' | 'extracting' | 'completed' | 'failed';
  
  // 配置
  maxPages: number;                   // 默认 30
  maxDepth: number;                   // 默认 3
  
  // 队列
  pageQueue: [{
    url: string;
    depth: number;
    pageType: 'home' | 'about' | 'products' | 'cases' | 'news' | 'contact' | 'other';
    priority: number;                 // 0=最高
    status: 'pending' | 'fetching' | 'done' | 'failed';
    title?: string;
    content?: string;                 // 抓取后的文本
    error?: string;
  }];
  
  // 进度
  discoveredCount: number;
  fetchedCount: number;
  extractedCount: number;
  failedCount: number;
  
  // 结果
  knowledgeCards: IKnowledgeCard[];   // 最终合并的卡片
  error?: string;
}
```

**页面类型优先级**：
| 类型 | 优先级 | 匹配路径 |
|------|--------|---------|
| home | 0 | `/` |
| about | 1 | `/about`, `/company`, `/profile` |
| products | 2 | `/products`, `/solutions`, `/services` |
| cases | 3 | `/cases`, `/projects`, `/portfolio` |
| news | 8 | `/news`, `/blog` |
| contact | 9 | `/contact` |
| other | 10 | 其他 |

### Phase 2: 爬取核心逻辑 (lib/site-crawl.ts)

**新建** 模块，复用 `website-crawler.ts` 的基础函数：

```typescript
// 1. 链接发现（BFS）
export async function discoverPages(
  crawlId: string, 
  rootUrl: string, 
  maxPages: number, 
  maxDepth: number
): Promise<void>

// 2. 分批抓取页面内容
export async function fetchPageBatch(
  crawlId: string, 
  batchSize: number = 3
): Promise<{ fetched: number; remaining: number }>

// 3. 分批AI提取
export async function extractBatch(
  crawlId: string, 
  batchSize: number = 3
): Promise<{ extracted: number; remaining: number; cards: IKnowledgeCard[] }>

// 内部函数
function classifyPageType(url: string): PageType
function extractInternalLinks(html: string, rootDomain: string): string[]
```

**并发控制**：
- 同时最多 2 个页面在抓取
- 请求间隔 500ms
- 单页超时 8s

### Phase 3: API 端点 (server.ts)

在 `// ==================== Knowledge Engine AI ====================` 区块添加：

```typescript
// 3.1 启动整站抓取
POST /api/knowledge/crawl-site
Body: { url: string, maxPages?: number, maxDepth?: number }
Response: { crawlId: string, status: 'pending' }

// 3.2 查询进度
GET /api/knowledge/crawl-site/:id/status
Response: {
  status, rootUrl, maxPages,
  discoveredCount, fetchedCount, extractedCount, failedCount,
  pages: [{ url, pageType, status, title }],
  knowledgeCards,
  error
}

// 3.3 处理下一批（前端轮询调用）
POST /api/knowledge/crawl-site/:id/process-batch
Response: { phase, processed, remaining, cards? }
```

### Phase 4: 前端交互 (components/KnowledgeEngine.tsx)

**修改点**：

1. **新增状态**：
```typescript
const [siteCrawl, setSiteCrawl] = useState<{
  id: string | null;
  status: string;
  progress: SiteCrawlProgress | null;
} | null>(null);
```

2. **URL 弹窗增加「整站抓取」按钮**：
   - 位于现有「提取」按钮旁边
   - 点击后调用 `/api/knowledge/crawl-site`

3. **进度面板 UI**：
```
┌─────────────────────────────────────┐
│ 正在抓取 example.com                │
│ ═══════════════     65%             │
│                                     │
│ 发现: 18页 | 抓取: 12页 | 提取: 8页 │
│                                     │
│ ✓ 首页                              │
│ ✓ 关于我们                          │
│ ⟳ 产品中心 (抓取中...)              │
│ ○ 客户案例                          │
│                                     │
│ [取消]                              │
└─────────────────────────────────────┘
```

4. **轮询逻辑**：
   - 每 2s 调用 status + process-batch
   - 直到 status 为 completed/failed
   - 完成后将 knowledgeCards 合并到主卡片列表

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `models/SiteCrawl.ts` | 新建 | 抓取任务数据模型 |
| `lib/site-crawl.ts` | 新建 | BFS 发现 + 批量抓取 + 批量提取 |
| `server.ts` | 修改 | 添加 3 个 API 端点 |
| `components/KnowledgeEngine.tsx` | 修改 | 整站抓取入口 + 进度面板 |
| `lib/website-crawler.ts` | 参考 | 复用 fetchPage, extractContent |

## 验证方案

1. **单元测试**：
   - `classifyPageType()` 分类准确性
   - `extractInternalLinks()` 链接提取

2. **集成测试**：
   - 在 tdpaintcell.vertax.top 测试完整流程
   - 输入 `tdpaintcell.com`，验证：
     - 发现关键页面（首页、产品、关于）
     - 进度实时更新
     - 生成多张知识卡片
     - 卡片正确合并去重

3. **边界测试**：
   - 单页面网站
   - 页面 404/超时
   - 内容过少的页面
