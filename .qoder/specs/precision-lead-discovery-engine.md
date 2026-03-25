# Precision Lead Discovery Engine - Phase 1: Website Deep Analysis

## Overview

在现有 Discovery → Enrichment 流程之间插入 **Website Analysis** 阶段，通过爬取目标公司官网、AI 分析业务相关性，自动过滤不相关公司，只让真正对口的客户进入后续流程。

```
Discovery (existing) → Website Analysis (NEW) → Enrichment (enhanced) → Scoring (enhanced)
```

---

## Step 1: Company 数据模型扩展

### 修改文件: `models/Company.ts`

新增 `websiteAnalysis` 嵌入式子文档 Schema：

```typescript
const WebsiteAnalysisSchema = new Schema({
  status: { 
    type: String, 
    enum: ['pending', 'analyzing', 'qualified', 'maybe', 'disqualified', 'failed'],
    default: 'pending'
  },
  qualificationReason: String,
  relevanceScore: { type: Number, default: 0 },  // 0-100

  // 业务特征提取
  products: [{ name: String, description: String }],
  equipment: [{ type: String, brand: String, context: String }],
  technologies: [String],
  companySize: {
    employees: String,
    facilities: String,
    indicators: [String]
  },

  // 四维相关性评分
  breakdown: {
    industryMatch: { score: Number, reasoning: String },
    businessRelevance: { score: Number, reasoning: String },
    sizeMatch: { score: Number, reasoning: String },
    technologyGap: { score: Number, reasoning: String }
  },

  // 爬取元数据
  pagesCrawled: [{ url: String, pageType: String, success: Boolean }],
  language: String,
  analyzedAt: Date,
  errorMessage: String
}, { _id: false });
```

在 CompanySchema 中新增字段：
```typescript
websiteAnalysis: WebsiteAnalysisSchema
```

在 ICompany interface 中添加对应的 TypeScript 类型。

新增索引：
```typescript
CompanySchema.index({ 'websiteAnalysis.status': 1 });
CompanySchema.index({ domain: 1 });  // 跨 Run 去重用
```

### 修改文件: `types.ts`

新增前端 TypeScript 接口 `WebsiteAnalysis`，字段与上面 Schema 对应。
在 `Company` interface 中增加 `websiteAnalysis?: WebsiteAnalysis`。

---

## Step 2: 多页面智能爬虫模块

### 新建文件: `lib/website-crawler.ts`

**核心函数：**
```typescript
export async function crawlWebsite(url: string, maxPages?: number): Promise<CrawlResult>
```

**设计要点：**

1. **页面发现策略**
   - 从首页出发，用 Cheerio 提取所有 `<a>` 链接
   - 按 URL 路径关键词识别页面类型：
     - `/about|/company|/who-we-are|/ueber-uns` → `about`
     - `/products|/services|/solutions|/produkte` → `products`
     - `/contact|/inquiry|/kontakt` → `contact`
   - 优先爬取：home → products → about → contact
   - 最多爬 5 个页面（首页必爬 + 最多 4 个子页面）

2. **内容提取**
   - 复用现有 Cheerio 解析逻辑（参考 server.ts:2254-2269 的 fetch-url 实现）
   - 移除 script/style/nav/footer/header
   - 优先提取 main/article/.content 区域
   - 每页最多保留 4000 字符（5 页总计 ~20k 字符，控制 AI token 消耗）

3. **请求策略**
   - User-Agent: 模拟 Chrome 浏览器（不用 VertaX-Bot，减少被拦截概率）
   - 请求间隔: 1 秒
   - 单页超时: 5 秒
   - 总超时: 20 秒（为后续 AI 分析留 10 秒）
   - 仅爬同域名下的页面

4. **语言检测**
   - 优先读 `<html lang="...">`
   - 降级：检测常用词（德语 der/die/das、西班牙语 el/la/los 等）

5. **错误处理**
   - 网站无法访问 → 返回 `{ pages: [], error: 'unreachable' }`
   - 被 Cloudflare/WAF 阻止 → 返回 `{ pages: [], error: 'blocked' }`
   - 部分页面失败 → 继续爬其他页面，标记失败页面

**返回类型：**
```typescript
interface CrawlResult {
  pages: Array<{
    url: string
    pageType: 'home' | 'about' | 'products' | 'contact' | 'other'
    content: string  // 清洗后的文本
    success: boolean
  }>
  language: string
  error?: string
}
```

---

## Step 3: AI 业务相关性分析器

### 新建文件: `lib/ai/relevance-analyzer.ts`

**核心函数：**
```typescript
export async function analyzeRelevance(
  pages: CrawlResult['pages'],
  product: IProduct,
  language: string
): Promise<RelevanceResult>
```

**设计要点：**

1. **输入构建**
   - 合并所有页面内容，按类型分段标注（`=== PRODUCTS PAGE ===`）
   - 总输入控制在 ~15k 字符以内
   - 从 Product 和 ICP 中提取关键匹配条件

2. **AI Prompt 设计**（使用 generateAIContent + JSON Schema）

```
You are a B2B lead qualification expert. Analyze this company's website content 
and determine if they are a potential customer for "{product.name}".

## Our Product
- Name: {product.name}
- Type: {product.productType}  
- Target Industries: {icp.industryTags.join(', ')}
- Target Customer Types: {icp.targetCustomerTypes.join(', ')}
- Disqualifiers: {icp.disqualifiers.join(', ')}

## Company Website Content ({language})
{mergedPageContent}

## Analysis Tasks
1. Extract: What products/services does this company offer?
2. Extract: What equipment/technology do they use or mention?
3. Estimate: Company size (employees, facilities)
4. Score (0-100) on 4 dimensions:
   - industryMatch: Are they in our target industry?
   - businessRelevance: Do they need/use equipment like ours?
   - sizeMatch: Right size for our product?
   - technologyGap: Signs of outdated equipment or upgrade needs?
5. Final qualification: QUALIFIED / MAYBE / DISQUALIFIED
   - QUALIFIED: Clear industry match + business relevance >= 60
   - DISQUALIFIED: Wrong industry, pure trader, or hits disqualifiers
   - MAYBE: Partial match or insufficient information

Return JSON only.
```

3. **JSON Schema**（新增到 `lib/ai/schemas.ts`）

```typescript
export const websiteAnalysisSchema = {
  type: 'object',
  properties: {
    qualification: { type: 'string', enum: ['QUALIFIED', 'MAYBE', 'DISQUALIFIED'] },
    qualificationReason: { type: 'string' },
    relevanceScore: { type: 'number' },
    products: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } },
    equipment: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, brand: { type: 'string' }, context: { type: 'string' } } } },
    technologies: { type: 'array', items: { type: 'string' } },
    companySize: { type: 'object', properties: { employees: { type: 'string' }, facilities: { type: 'string' }, indicators: { type: 'array', items: { type: 'string' } } } },
    breakdown: {
      type: 'object',
      properties: {
        industryMatch: { type: 'object', properties: { score: { type: 'number' }, reasoning: { type: 'string' } } },
        businessRelevance: { type: 'object', properties: { score: { type: 'number' }, reasoning: { type: 'string' } } },
        sizeMatch: { type: 'object', properties: { score: { type: 'number' }, reasoning: { type: 'string' } } },
        technologyGap: { type: 'object', properties: { score: { type: 'number' }, reasoning: { type: 'string' } } }
      }
    }
  },
  required: ['qualification', 'qualificationReason', 'relevanceScore', 'products', 'breakdown']
}
```

4. **无网站降级**
   - 如果公司没有 website 或爬取完全失败
   - 使用 Brave Search 搜索 `"公司名" site:linkedin.com OR site:kompass.com` 获取基础信息
   - AI 基于搜索结果做判定，默认标记为 `MAYBE`

---

## Step 4: API 端点实现

### 修改文件: `server.ts`

#### 新增端点: `POST /api/runs/:runId/analyze-website/:companyId`

**流程：**
```
1. 加载 LeadRun, Company, Product (含 ICP)
2. 检查 company.website 是否存在
   - 无网站 → Brave搜索降级 → 标记 MAYBE
3. 调用 crawlWebsite(company.website)
   - 完全失败 → 标记 MAYBE + errorMessage
4. 调用 analyzeRelevance(pages, product, language)
5. 写入 company.websiteAnalysis = { ...result, analyzedAt: new Date() }
6. 更新 company.status:
   - QUALIFIED → 'researching' (继续进入 enrichment)
   - MAYBE → 'researching' (继续进入 enrichment)  
   - DISQUALIFIED → 'failed' (跳过 enrichment，节省 API)
7. 更新 LeadRun progress.websiteAnalysis++
8. 返回结果
```

**超时控制：** 爬虫 20s + AI 10s = 总计 < 30s

#### 修改端点: `POST /api/runs/:runId/enrich/:companyId`

在 Enrichment 中利用网站分析数据增强搜索：

```typescript
// 如果有网站分析数据，构建更精准的搜索查询
if (company.websiteAnalysis?.products?.length) {
  const productKeywords = company.websiteAnalysis.products
    .slice(0, 2).map(p => p.name).join(' ');
  searchQuery = `"${company.name}" ${productKeywords} automation upgrade ${company.country}`;
} else {
  searchQuery = `"${company.name}" ${company.country} news hiring expansion`; // 旧逻辑
}
```

在 AI 分析 prompt 中注入网站分析上下文：
```
已知该公司业务: ${websiteAnalysis.products.map(p => p.name)}
已知设备情况: ${websiteAnalysis.equipment.map(e => e.type)}
```

#### 修改 Scoring 逻辑（在 enrich 端点内）

```typescript
// 新评分：网站相关性 (40%) + 信号强度 (60%)
const relevanceScore = company.websiteAnalysis?.relevanceScore || 50;
const signalScore = calculateSignalScore(processedSignals);
const totalScore = Math.round(relevanceScore * 0.4 + signalScore * 0.6);

// 新增 breakdown.relevanceScore 字段
company.score.breakdown.relevanceScore = relevanceScore;
```

#### 修改 LeadRun progress 结构

在 LeadRun 创建时（line ~617）增加：
```typescript
progress: {
  discovery: 0,
  websiteAnalysis: 0,  // 新增
  enrichment: 0,
  contact: 0,
  ...
}
```

---

## Step 5: 前端流程编排更新

### 修改文件: `components/LeadRuns.tsx`

1. **Pipeline 阶段更新**
   - 在现有 stages 中插入 `website-analysis`
   - 进度条新增该阶段

2. **执行逻辑**（修改 executePipeline 函数）

```typescript
// Phase 2: Website Analysis (新增)
for (const companyId of allCompanyIds) {
  const company = companies.find(c => c.id === companyId);
  if (!company?.website) {
    addLog(`⏭ ${company.name}: 无网站，跳过分析`);
    continue;
  }
  
  const result = await fetch(`/api/runs/${runId}/analyze-website/${companyId}`, 
    { method: 'POST' }).then(r => r.json());
  
  addLog(`${result.qualification === 'DISQUALIFIED' ? '✗' : '✓'} ${company.name}: ${result.qualification} (${result.relevanceScore}分)`);
  
  if (result.qualification === 'DISQUALIFIED') {
    disqualifiedCount++;
  }
}

// Phase 3: Enrichment (只处理非 DISQUALIFIED 的公司)
const qualifiedCompanies = allCompanyIds.filter(id => {
  const c = companies.find(co => co.id === id);
  return c?.status !== 'failed';
});
for (const companyId of qualifiedCompanies) { ... }
```

3. **UI 统计展示**
   - 实时显示：`已分析 15/30 | 合格 10 | 待定 3 | 已过滤 2`
   - 过滤的公司显示原因摘要

### 修改文件: `components/CompanyDetail.tsx`

新增 Website Analysis 区域展示：
- 资格判定标签（绿色 QUALIFIED / 黄色 MAYBE / 红色 DISQUALIFIED）
- 四维评分雷达图或进度条
- 提取的产品/设备/规模信息

### 修改文件: `components/LeadPool.tsx`

- 新增 `websiteAnalysis.status` 筛选器
- 列表中显示 relevanceScore 列

---

## Step 6: 跨 Run 去重（低成本 Bonus）

### 修改文件: `server.ts` (Discovery 端点)

在保存新发现公司时，检查是否已有相同 domain 的历史分析：

```typescript
if (domain) {
  const existing = await CompanyModel.findOne({ 
    domain, 
    'websiteAnalysis.status': { $in: ['qualified', 'maybe', 'disqualified'] }
  }).sort({ 'websiteAnalysis.analyzedAt': -1 });
  
  if (existing?.websiteAnalysis) {
    // 复用历史网站分析结果，跳过重复爬取
    newCompany.websiteAnalysis = existing.websiteAnalysis;
  }
}
```

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `models/Company.ts` | 修改 | 新增 WebsiteAnalysisSchema + 索引 |
| `types.ts` | 修改 | 新增 WebsiteAnalysis 接口 |
| `lib/website-crawler.ts` | **新建** | 多页面智能爬虫 |
| `lib/ai/relevance-analyzer.ts` | **新建** | AI 业务相关性分析器 |
| `lib/ai/schemas.ts` | 修改 | 新增 websiteAnalysisSchema |
| `server.ts` | 修改 | 新增 analyze-website 端点 + 增强 enrich/scoring |
| `components/LeadRuns.tsx` | 修改 | Pipeline 新增 website-analysis 阶段 |
| `components/CompanyDetail.tsx` | 修改 | 展示网站分析结果 |
| `components/LeadPool.tsx` | 修改 | 新增筛选器和 relevanceScore 列 |

---

## 验证计划

1. **单元验证**
   - 用 3-5 个真实工业公司网站测试爬虫（德国/越南/墨西哥各 1-2 个）
   - 验证页面发现、内容提取、语言检测

2. **AI 分析验证**
   - 准备 10 个测试用例（5 个应 QUALIFIED，3 个 MAYBE，2 个 DISQUALIFIED）
   - 验证判定准确率 > 80%

3. **端到端验证**
   - 创建一个完整 LeadRun，目标 20 家公司
   - 验证 Pipeline 四阶段（discovery → website-analysis → enrichment → contacts）顺序执行
   - 确认 DISQUALIFIED 公司被跳过，不进入 enrichment
   - 确认评分公式正确（relevance 40% + signal 60%）

4. **边界情况**
   - 无网站的公司：应标记 MAYBE 并继续
   - 网站被阻止：应降级处理并继续
   - AI 返回异常：应有默认 MAYBE 兜底
