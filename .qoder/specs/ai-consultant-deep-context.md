# AI 顾问深度上下文增强

## 目标
让 AI 顾问真正理解业务，从"只知道统计数字"升级为"深度了解产品、客户、进展、瓶颈"的专属出海战略顾问。

## 当前问题
`/api/chat` 端点 (`-/server.ts:2527-2560`) 仅注入：productCount, runCount, companyCount, postCount, 前3个产品名。AI 对 ICP 画像、公司信号、内容管线、社媒渠道一无所知。

---

## 实现方案（4 步）

### Step 1: 创建上下文构建器
**新建**: `-/lib/ai/context-builder.ts`

```typescript
// 导入所有 Model
import { Product, LeadRun, Company, ContentAsset, SocialPost, SocialAccount } from '../../models';

interface ContextOptions {
  role: 'BOSS' | 'STAFF';
  currentPage?: string;
}
export async function buildAIContext(options: ContextOptions): Promise<string>
```

**数据聚合策略**（~2500 tokens Markdown）：

| 数据源 | 查询 | 摘要策略 |
|--------|------|---------|
| Product + ICP | `Product.find().lean()` | 全部产品（通常<10），每个含名称/类型/目标国/ICP成熟度 |
| LeadRun | `LeadRun.find().lean()` | 按状态分组：running 含进度%，done 含公司发现数 |
| Company | `Company.find({'score.tier':{$in:['Tier A...','Tier B...']}}).sort({'score.total':-1}).limit(20).lean()` | Tier A 全部 + Tier B 前10，每家1行：名称(国家,行业)[分数,Tier] + 顶级信号 |
| ContentAsset | `ContentAsset.aggregate([{$group:{_id:'$status',count:{$sum:1}}}])` | 按状态统计：draft/optimized/published |
| SocialPost | `SocialPost.aggregate([{$group:{_id:'$status',count:{$sum:1}}}])` | 按状态统计 |
| SocialAccount | `SocialAccount.find({status:'active'}).lean()` | 已连接平台名称列表 |

**公司摘要格式**（紧凑，避免 dump 原始数据）：
```
- Schmidt Metalworks (德国, 金属加工) [92分, Tier A] 信号：招标 "自动化喷涂设备采购"
```

**currentPage 逻辑**：根据 `options.currentPage` 值调整上下文优先级:
- `knowledge-engine`: 扩展产品 ICP 细节（queryPack, signalPack）
- `ai-prospecting`: 扩展 LeadRun 进度 + Company 详情（含 research.keyHooks）
- `marketing-drive`: 扩展 ContentAsset 标题列表 + SEO 分数
- `social-presence`: 扩展 SocialPost + SocialAccount 详情
- 其他/默认: 均衡摘要

### Step 2: 创建 Prompt 模板
**新建**: `-/lib/ai/prompt-templates.ts`

```typescript
export function getBossPrompt(context: string): string
export function getStaffPrompt(context: string): string
```

**Boss 模板核心要素**：
- 身份：VertaX 出海增长战略顾问，直接向老板汇报
- 指令：用数据说话、聚焦 ROI、识别瓶颈、风险预警、给出可执行建议
- 风格：简洁精炼、结构化、不废话
- 特殊指令处理：
  - "一分钟汇报" → 3个关键数据 + 1个行动建议，不超过150字
  - "本周战果" → 三板块汇总（线索获取 / 内容产出 / 社媒覆盖）
- 注入 `{context}` 占位符插入 buildAIContext 输出

**Staff 模板核心要素**：
- 身份：VertaX 执行助手，陪伴员工操作
- 指令：任务指引、操作步骤、问题排查、资料规范
- 风格：手把手、友好耐心、步骤清晰
- 注入 `{context}` 同上

### Step 3: 改造 `/api/chat` 端点
**修改**: `-/server.ts` 行 2527-2560

在文件头部添加导入：
```typescript
import { buildAIContext } from './lib/ai/context-builder';
import { getBossPrompt, getStaffPrompt } from './lib/ai/prompt-templates';
```

替换整个 handler 内部实现：
```typescript
app.post('/api/chat', async (req, res) => {
  try {
    const { message, role, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // 判断角色
    const roleType = (role === '决策者' || role === 'CEO') ? 'BOSS' : 'STAFF';

    // 构建业务上下文
    const aiContext = await buildAIContext({
      role: roleType,
      currentPage: context?.currentPage
    });

    // 选择对应角色的系统提示词
    const systemPrompt = roleType === 'BOSS'
      ? getBossPrompt(aiContext)
      : getStaffPrompt(aiContext);

    const { content: reply } = await generateAIContent(
      `用户提问: ${message}`,
      { systemPrompt }
    );

    res.json({ reply: reply || '抱歉，我暂时无法处理这个请求。' });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});
```

### Step 4: 前端传递页面上下文

**修改**: `-/App.tsx` (行 272-274)
```diff
- {showAISidebar && (
-   <AISidebar role={currentRole} />
- )}
+ {showAISidebar && (
+   <AISidebar role={currentRole} currentPage={activeItem} />
+ )}
```

**修改**: `-/components/AISidebar.tsx`

1. Props 接口扩展（需导入 NavItem 类型）：
```typescript
interface AISidebarProps {
  role: UserRole;
  currentPage?: string;  // NavItem 值如 'strategic-home', 'ai-prospecting' 等
}
```

2. handleSend 中 body 增加 context：
```diff
  body: JSON.stringify({
    message: q,
-   role: role.label
+   role: role.label,
+   context: { currentPage: currentPage }
  })
```

---

## 关键文件清单

| 文件 | 操作 | 关键行 |
|------|------|--------|
| `-/lib/ai/context-builder.ts` | **新建** | 核心：6 个 Model 数据聚合 → Markdown 摘要 |
| `-/lib/ai/prompt-templates.ts` | **新建** | Boss/Staff 两套 system prompt 模板 |
| `-/server.ts` | **修改** | L2527-2560: 替换 /api/chat handler + 文件头新增 import |
| `-/components/AISidebar.tsx` | **修改** | Props 增加 currentPage + handleSend body 增加 context |
| `-/App.tsx` | **修改** | L272: 传递 activeItem 给 AISidebar |

## 验证方式

1. `npm run build` — 无编译错误
2. 本地 `npm run dev` 启动，打开 AI 顾问
3. 以 Boss 角色发送 "一分钟汇报" — 验证回复包含真实产品名、公司数据、进度信息
4. 切换到获客雷达页面，问 "哪些线索值得优先跟进" — 验证回复基于实际 Company Tier A 数据
5. 切换 Staff 角色，问 "今日任务" — 验证回复为执行导向的步骤指引
6. 部署到 vertax.top 验证生产环境
