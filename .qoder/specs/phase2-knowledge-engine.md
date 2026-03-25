# Phase 2 — 知识引擎 完整实现规范

> 原则：**先闭环、再扩展** — 资料接入 → 可检索 → 可引用证据 → 可生成企业认知草案 → 可编辑保存

---

## 架构总览

```
/c/knowledge/*  路由体系
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  assets  │ evidence │  company │guidelines│ profiles │
│ 素材资源  │  证据库   │ 企业认知  │ 品牌规范  │ 人设中心  │
└────┬─────┴────┬─────┴────┬─────┴──────────┴──────────┘
     │          │          │
  AssetChunk  Evidence  CompanyProfile (扩展)
     │          │
     └──────────┘
     sourceLocator（溯源锚点）
```

**依赖链**：2-0 → 2-1 → 2-2 → 2-3 → 2-5 ；2-4 可与 2-1 并行

---

## 当前代码库状态（实测确认）

| 文件 | 状态 |
|------|------|
| `prisma/schema.prisma` | Asset/CompanyProfile/Activity 已有，无 AssetChunk/Evidence/Guideline/Persona |
| `src/actions/assets.ts` (706L) | 完整的上传/CRUD/批量操作，无处理/分块逻辑 |
| `src/actions/knowledge.ts` (393L) | CompanyProfile AI分析 + 文本提取，无分块，60k字符截断 |
| `src/lib/ai-client.ts` (228L) | DashScope qwen-plus，chatCompletion + analyzeCompanyProfile |
| `src/types/assets.ts` (140L) | AssetStatus = uploading\|active\|archived\|deleted |
| `src/components/assets/` | 9 组件（upload-zone, card, detail-panel 等），可复用 |
| `/c/knowledge/page.tsx` (486L) | 企业认知页面（左侧素材列表 + 右侧画像展示），需迁移 |
| 侧边栏 | 扁平6项导航，知识引擎无子菜单展开 |
| 知识子页面 | **尚未创建**（/assets, /evidence, /company, /guidelines, /profiles 均不存在） |

---

## Phase 2-0：公共基础设施

### 0.1 Schema 变更 — `prisma/schema.prisma`

**新增 AssetChunk 模型**：

```prisma
model AssetChunk {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)

  content     String   @db.Text
  chunkIndex  Int                // chunk 在 asset 中的序号
  pageNumber  Int?               // 来源页码（PDF）
  charStart   Int?               // 起始字符偏移
  charEnd     Int?               // 结束字符偏移
  tokenCount  Int?               // 估算 token 数

  createdAt   DateTime @default(now())

  evidences   Evidence[]

  @@index([assetId])
  @@index([tenantId])
  @@index([assetId, chunkIndex])
}
```

**新增 Evidence 模型**：

```prisma
enum EvidenceType {
  claim
  statistic
  testimonial
  case_study
  certification
}

model Evidence {
  id            String       @id @default(cuid())
  tenantId      String
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title         String
  content       String       @db.Text
  type          EvidenceType @default(claim)
  sourceLocator Json         @default("{}")   // SourceLocator 结构
  chunkId       String?
  chunk         AssetChunk?  @relation(fields: [chunkId], references: [id], onDelete: SetNull)
  assetId       String?                       // 冗余便于查询
  tags          String[]
  status        String       @default("active") // draft | active | archived
  metadata      Json         @default("{}")
  createdById   String
  createdBy     User         @relation(fields: [createdById], references: [id])
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?

  @@index([tenantId])
  @@index([tenantId, type])
  @@index([chunkId])
  @@index([assetId])
}
```

**新增 BrandGuideline 模型**：

```prisma
enum GuidelineCategory {
  tone
  terminology
  visual
  messaging
}

model BrandGuideline {
  id        String            @id @default(cuid())
  tenantId  String
  tenant    Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category  GuidelineCategory
  title     String
  content   String            @db.Text
  examples  Json              @default("[]")  // { do: string[], dont: string[] }
  isActive  Boolean           @default(true)
  order     Int               @default(0)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@index([tenantId])
  @@index([tenantId, category])
}
```

**新增 ICPSegment + Persona + MessagingMatrix 模型**：

```prisma
model ICPSegment {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  industry    String?
  companySize String?           // startup | sme | enterprise | all
  regions     String[]
  description String?   @db.Text
  criteria    Json      @default("{}")
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  personas    Persona[]

  @@index([tenantId])
}

model Persona {
  id             String        @id @default(cuid())
  tenantId       String
  tenant         Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  segmentId      String?
  segment        ICPSegment?   @relation(fields: [segmentId], references: [id], onDelete: SetNull)
  name           String
  title          String
  seniority      String?       // junior | mid | senior | executive
  concerns       String[]
  messagingPrefs Json          @default("{}")
  evidenceRefs   String[]      // Evidence ID 数组
  order          Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  messagingMatrix MessagingMatrix[]

  @@index([tenantId])
  @@index([segmentId])
}

model MessagingMatrix {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  personaId    String
  persona      Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  valueProp    String
  message      String   @db.Text
  channel      String?  // email | linkedin | wechat
  evidenceRefs String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@index([personaId])
}
```

**Tenant 模型新增关系**（additive）：

```prisma
// 在 Tenant model 内追加：
assetChunks      AssetChunk[]
evidences        Evidence[]
brandGuidelines  BrandGuideline[]
icpSegments      ICPSegment[]
personas         Persona[]
messagingMatrices MessagingMatrix[]
```

**Asset 模型新增关系**（additive）：

```prisma
// 在 Asset model 内追加：
chunks  AssetChunk[]
```

**User 模型新增关系**（additive）：

```prisma
// 在 User model 内追加：
evidences  Evidence[]
```

### 0.2 类型定义 — 新建 `src/types/knowledge.ts`

```typescript
// SourceLocator — 证据溯源锚点
export interface SourceLocator {
  assetId: string;
  chunkId?: string;
  page?: number;
  paragraph?: number;
  highlightText?: string;  // 最多 200 字符
}

// Asset 处理状态（嵌入 Asset.metadata JSON）
export interface AssetProcessingMeta {
  processingStatus: 'unprocessed' | 'processing' | 'ready' | 'failed';
  processingError?: string;
  processedAt?: string;     // ISO 日期
  chunkCount?: number;
}

// Chunk 数据
export interface ChunkData {
  id: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  charStart: number | null;
  charEnd: number | null;
  tokenCount: number | null;
}

// Evidence 响应
export interface EvidenceData {
  id: string;
  title: string;
  content: string;
  type: 'claim' | 'statistic' | 'testimonial' | 'case_study' | 'certification';
  sourceLocator: SourceLocator;
  assetId: string | null;
  assetName?: string;       // join Asset.originalName
  chunkId: string | null;
  tags: string[];
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Guideline 响应
export interface GuidelineData {
  id: string;
  category: 'tone' | 'terminology' | 'visual' | 'messaging';
  title: string;
  content: string;
  examples: { do: string[]; dont: string[] };
  isActive: boolean;
  order: number;
}

// Persona 响应
export interface PersonaData {
  id: string;
  segmentId: string | null;
  segmentName?: string;
  name: string;
  title: string;
  seniority: string | null;
  concerns: string[];
  messagingPrefs: Record<string, unknown>;
  evidenceRefs: string[];
}

// Messaging Matrix 响应
export interface MessagingMatrixData {
  id: string;
  personaId: string;
  valueProp: string;
  message: string;
  channel: string | null;
  evidenceRefs: string[];
}
```

### 0.3 文本分块工具 — 新建 `src/lib/utils/chunk-utils.ts`

**核心函数**：
- `splitTextIntoChunks(text, opts?)` — 按 ~500 tokens/块切割，50 tokens 重叠
- `estimateTokenCount(text)` — 简单估算（中文字符×1.5，英文单词×1）
- 返回 `Array<{ content, chunkIndex, charStart, charEnd, tokenCount }>`

**设计决策**：在 metadata JSON 中嵌套 `processingStatus` 而非修改 Asset.status 字段，保持现有 status 过滤逻辑零破坏。

### 0.4 资产处理 Actions — 追加到 `src/actions/assets.ts`

新增 3 个函数（不修改已有函数）：

| 函数 | 职责 |
|------|------|
| `triggerAssetProcessing(assetId)` | 提取文本 → 分块 → 写入 AssetChunk → 更新 metadata.processingStatus |
| `getAssetChunks(assetId, pagination?)` | 返回 AssetChunk 列表（分页） |
| `searchAssetContent(query, filters?)` | PostgreSQL ILIKE 搜索 AssetChunk.content |

**triggerAssetProcessing 流程**：
1. 校验 asset 归属 tenant 且 status=active
2. 设 metadata.processingStatus = 'processing'
3. 复用现有 `extractTextFromAsset()` 提取文本（从 knowledge.ts 提取为共享函数）
4. 调用 `splitTextIntoChunks()` 分块
5. 批量创建 AssetChunk 记录
6. 成功：设 processingStatus='ready', chunkCount=N, processedAt=now
7. 失败：设 processingStatus='failed', processingError=message

### 0.5 交付验证

- [ ] `npx prisma validate` 通过
- [ ] `npx prisma generate` 通过
- [ ] `npm run build` 通过
- [ ] AssetChunk 写入/读取测试逻辑无报错

---

## Phase 2-1：素材资源页 `/c/knowledge/assets`

### 1.1 路由

新建 `src/app/[locale]/(customer)/c/knowledge/assets/page.tsx`

### 1.2 Server Actions 追加 — `src/actions/assets.ts`

| 函数 | 说明 |
|------|------|
| `getKnowledgeAssets(filters, pagination)` | 扩展 getAssets，附加 processingStatus 过滤 + 返回处理元数据 |

### 1.3 类型扩展 — `src/types/assets.ts`

- 新增 `AssetProcessingStatus = 'unprocessed' | 'processing' | 'ready' | 'failed'`
- `AssetFilters` 增加 `processingStatus?: AssetProcessingStatus`
- `AssetWithProcessingStatus` 扩展 `AssetWithFolder` + `processingMeta: AssetProcessingMeta`

### 1.4 新增 UI 组件 — `src/components/knowledge/`

| 组件 | 文件 | 说明 |
|------|------|------|
| ProcessingStatusBadge | `processing-status-badge.tsx` | ready=绿/processing=蓝+spinner/failed=红/unprocessed=灰 |
| AssetChunkPreview | `asset-chunk-preview.tsx` | Sheet 弹出层展示 chunks 列表，分页浏览 |
| KnowledgeAssetCard | `knowledge-asset-card.tsx` | 扩展 AssetCard + 处理状态 badge + "触发处理"/"查看文本"按钮 |
| ContentSearchBar | `content-search-bar.tsx` | 跨 chunks 全文搜索，300ms 防抖 |

### 1.5 页面布局

```
┌─────────────────────────────────────────────┐
│ 搜索框  | 状态过滤(Tabs) | 类型过滤 | +上传  │
├─────────────────────────────────────────────┤
│                                             │
│  KnowledgeAssetCard × N （网格布局）          │
│  [缩略图] [文件名] [状态Badge]               │
│  [大小] [上传时间]                           │
│  [触发处理/查看文本] 按钮                     │
│                                             │
├─────────────────────────────────────────────┤
│ 分页器                                      │
└─────────────────────────────────────────────┘

点击"查看文本" → 右侧 Sheet 滑出 AssetChunkPreview
点击"+上传" → Dialog 弹出 AssetUploadZone（复用现有组件）
```

### 1.6 交付验证

- [ ] 上传文件 → 显示在列表中（status=unprocessed）
- [ ] 点击"处理" → 状态流转 processing → ready
- [ ] 点击"查看文本" → Sheet 展示分块内容
- [ ] 搜索关键词 → 返回匹配的 chunks 所属资产
- [ ] 按状态过滤正常工作

---

## Phase 2-2：证据库 `/c/knowledge/evidence`

### 2.1 路由

新建 `src/app/[locale]/(customer)/c/knowledge/evidence/page.tsx`

### 2.2 Server Actions — 新建 `src/actions/evidence.ts`

| 函数 | 说明 |
|------|------|
| `getEvidences(filters, pagination)` | type/tags/assetId/status/search 过滤，join Chunk+Asset |
| `createEvidence(input)` | 创建证据，从 chunkId 自动填充 sourceLocator |
| `updateEvidence(id, input)` | patch 更新 title/content/type/tags/status |
| `deleteEvidence(id)` | 软删除（设 deletedAt） |
| `generateEvidenceFromChunk(chunkId)` | AI 读取 chunk → 识别 type → 提炼 title/content → 创建 |
| `batchGenerateEvidences(assetId)` | 获取 asset 全部 chunks → 3并发 AI 生成 → 批量创建 |

**AI 生成 Evidence 的 Prompt 要点**：
- 输入 chunk 内容，要求 AI 判断 type（claim/statistic/testimonial/case_study/certification）
- 提炼简洁的 title（≤30字）和精简的 content（≤200字）
- 输出 JSON：`{ type, title, content }`

### 2.3 新增 UI 组件 — `src/components/knowledge/`

| 组件 | 文件 | 说明 |
|------|------|------|
| EvidenceTypeTag | `evidence-type-tag.tsx` | 5种类型彩色标签 |
| EvidenceCard | `evidence-card.tsx` | 标题+类型tag+内容摘要+来源溯源区 |
| EvidenceCreateDialog | `evidence-create-dialog.tsx` | Dialog 表单：title/content/type/tags/chunk选择 |
| EvidenceFilters | `evidence-filters.tsx` | type多选 + search + 标签过滤 |
| ChunkSelector | `chunk-selector.tsx` | 从 AssetChunk 列表中选择文本片段 |

### 2.4 页面布局

```
┌─────────────────────────────────────────────┐
│ 证据库标题  | +新建证据  | AI批量生成(选asset) │
├──────────┬──────────────────────────────────┤
│ 类型过滤  │  EvidenceCard × N（2列网格）      │
│ ☐ claim  │  ┌──────────────────────────┐    │
│ ☐ stat   │  │ [类型tag] 标题            │    │
│ ☐ test   │  │ 内容摘要（150字截断）       │    │
│ ☐ case   │  │ 来源：[asset名] p.3       │    │
│ ☐ cert   │  │              [编辑][删除]  │    │
│          │  └──────────────────────────┘    │
│ 搜索     │                                  │
│ [______] │                                  │
│          │  分页器                           │
└──────────┴──────────────────────────────────┘
```

### 2.5 交付验证

- [ ] 手动创建证据（填表单+选 chunk 来源）→ 保存成功
- [ ] AI 一键生成（选 asset → batch generate）→ 生成证据列表
- [ ] 点击来源溯源 → 可查看原始 chunk 内容
- [ ] 按 type/搜索过滤正常
- [ ] 编辑/删除操作正常

---

## Phase 2-3：企业认知 `/c/knowledge/company`

### 3.1 路由

- 将现有 `/c/knowledge/page.tsx` 内容迁移至 `src/app/[locale]/(customer)/c/knowledge/company/page.tsx`
- `/c/knowledge/page.tsx` 改为知识引擎总览页（导航卡片）或重定向至 `/c/knowledge/company`

### 3.2 Schema 扩展 — CompanyProfile（additive）

在 CompanyProfile 模型追加字段：

```prisma
// 各 section 手动编辑记录
sectionEdits  Json @default("{}")  // { sectionKey: { content, editedAt, editedBy } }
// 各 section 关联的 Evidence IDs
evidenceRefs  Json @default("{}")  // { sectionKey: string[] }
```

### 3.3 Server Actions 扩展 — `src/actions/knowledge.ts`

| 函数 | 说明 |
|------|------|
| `updateCompanyProfileSection(sectionKey, content)` | 局部更新单个 section |
| `regenerateSectionFromAssets(sectionKey, assetIds)` | 针对某 section 调用 AI 重新生成 |
| `linkEvidenceToSection(sectionKey, evidenceId)` | 维护 evidenceRefs |
| `unlinkEvidenceFromSection(sectionKey, evidenceId)` | 移除 evidenceRef |
| `getCompanyProfileWithEvidence()` | 返回 Profile + 各 section 关联 Evidence 详情 |

### 3.4 新增 UI 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| SectionEditor | `section-editor.tsx` | 查看/编辑切换，手动保存 + AI重新生成 + Evidence引用区 |
| EvidenceRefPicker | `evidence-ref-picker.tsx` | Popover + Command 从证据库选择关联 |
| KnowledgeTabs | `knowledge-tabs.tsx` | 顶部 Tab：企业认知 / 产品管理 |

### 3.5 页面布局

```
┌─────────────────────────────────────────────┐
│ [企业认知] [产品管理]  Tab切换    | AI分析按钮 │
├─────────────────────────────────────────────┤
│ ── 企业认知 Tab ──                           │
│                                             │
│ SectionEditor: 企业简介                      │
│ ┌─────────────────────────────────────┐     │
│ │ [查看模式内容]              [编辑][AI] │     │
│ │ 引用证据: [tag1][tag2][+添加]        │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ SectionEditor: 核心产品  (同上布局)           │
│ SectionEditor: 技术优势  (同上布局)           │
│ SectionEditor: 应用场景  (同上布局)           │
│ SectionEditor: 差异化优势 (同上布局)          │
│ SectionEditor: ICP画像   (同上布局)           │
│                                             │
│ ── 产品管理 Tab ──                           │
│ (复用现有 Product 管理逻辑)                   │
└─────────────────────────────────────────────┘
```

### 3.6 交付验证

- [ ] 现有企业认知数据完整迁移到新路由
- [ ] 各 section 独立编辑 → 保存成功
- [ ] 单 section AI 重新生成 → 只更新对应 section
- [ ] 关联 Evidence → 显示在 section 底部
- [ ] 产品管理 Tab 正常显示

---

## Phase 2-4：品牌规范 `/c/knowledge/guidelines`

### 4.1 路由

新建 `src/app/[locale]/(customer)/c/knowledge/guidelines/page.tsx`

### 4.2 Server Actions — 新建 `src/actions/guidelines.ts`

| 函数 | 说明 |
|------|------|
| `getGuidelines(category?)` | 按 category 过滤，按 order 排序 |
| `createGuideline(input)` | category/title/content/examples/isActive |
| `updateGuideline(id, input)` | patch 更新 |
| `deleteGuideline(id)` | 硬删除 |
| `reorderGuidelines(orderedIds)` | 批量更新 order 字段 |

### 4.3 新增 UI 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| GuidelineCategoryTabs | `guideline-category-tabs.tsx` | tone/terminology/visual/messaging 四 Tab |
| GuidelineCard | `guideline-card.tsx` | 标题+内容+Do/Don't展示+操作按钮 |
| GuidelineFormDialog | `guideline-form-dialog.tsx` | 新建/编辑对话框 |

### 4.4 页面布局

```
┌─────────────────────────────────────────────┐
│ 品牌规范标题                    | +新建规范   │
├─────────────────────────────────────────────┤
│ [语气] [术语] [视觉] [信息]  Category Tabs   │
├─────────────────────────────────────────────┤
│ GuidelineCard ×N（单列列表）                  │
│ ┌─────────────────────────────────────┐     │
│ │ 标题           [active开关][编辑][删] │     │
│ │ 内容正文                             │     │
│ │ ✅ Do: 正例1、正例2                   │     │
│ │ ❌ Don't: 反例1、反例2               │     │
│ └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### 4.5 交付验证

- [ ] 创建规范（各 category）→ 保存显示
- [ ] 编辑 → 更新成功
- [ ] 删除 → 消失
- [ ] Tab 切换 → 只显示对应 category
- [ ] Active/Inactive 开关正常

---

## Phase 2-5：人设中心 `/c/knowledge/profiles`

### 5.1 路由

新建 `src/app/[locale]/(customer)/c/knowledge/profiles/page.tsx`

### 5.2 Server Actions — 新建 `src/actions/personas.ts`

| 函数 | 说明 |
|------|------|
| `getICPSegments()` | 全部 segments + persona 数量 |
| `createICPSegment(input)` | 创建细分市场 |
| `updateICPSegment(id, input)` | 更新 |
| `deleteICPSegment(id)` | 删除（级联 persona SetNull） |
| `getPersonasBySegment(segmentId?)` | 获取 Persona 列表 |
| `createPersona(input)` | 创建 persona |
| `updatePersona(id, input)` | 更新 |
| `deletePersona(id)` | 删除 |
| `getMessagingMatrix(personaId)` | 获取某 persona 的矩阵 |
| `upsertMessagingMatrixEntry(personaId, valueProp, input)` | 创建/更新矩阵条目 |
| `generatePersonaMessaging(personaId, valuePropList)` | AI 生成定制 messaging |

### 5.3 新增 UI 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| ICPSegmentPanel | `icp-segment-panel.tsx` | 左侧 segment 列表 |
| PersonaCard | `persona-card.tsx` | 角色名+职位+concerns+证据数 |
| PersonaFormDialog | `persona-form-dialog.tsx` | 新建/编辑 Persona 对话框 |
| MessagingMatrixTable | `messaging-matrix-table.tsx` | valueProp×channel 矩阵表格 |

### 5.4 页面布局

```
┌─────────────────────────────────────────────────────┐
│ 人设中心                        | +新建细分 | +新建角色 │
├──────────┬──────────────┬───────────────────────────┤
│ Segments │ PersonaCards  │ MessagingMatrix            │
│ (1/5)    │ (2/5 网格)    │ (2/5 表格)                 │
│          │              │                            │
│ [工业]   │ [采购经理]    │ valueProp | email | linkedin│
│ [科技]→  │ [CTO]        │ 降本增效  | msg1  | msg2    │
│ [医疗]   │ [+新建]      │ 提质升级  | msg3  | msg4    │
│          │              │          [AI一键生成]        │
└──────────┴──────────────┴───────────────────────────┘
```

### 5.5 交付验证

- [ ] 创建 ICP Segment → 显示在左栏
- [ ] 创建 Persona → 显示在中栏对应 segment 下
- [ ] 编辑 Persona concerns + evidence refs
- [ ] Messaging Matrix 手动编辑 → 保存
- [ ] AI 一键生成 messaging → 填充矩阵

---

## 侧边栏导航改造

### 修改 `src/components/customer/customer-sidebar.tsx`

将"知识引擎"导航项改为可展开子菜单：

```
知识引擎 ▾
  ├─ 素材资源  /c/knowledge/assets
  ├─ 证据库    /c/knowledge/evidence
  ├─ 企业认知  /c/knowledge/company
  ├─ 品牌规范  /c/knowledge/guidelines
  └─ 人设中心  /c/knowledge/profiles
```

现有 `/c/knowledge` 路由改为知识中心聚合导航页或重定向到 `/c/knowledge/company`。

---

## 共享工具函数提取

从 `src/actions/knowledge.ts` 提取 `extractTextFromAsset()` 到 `src/lib/utils/text-extract.ts`，供 assets.ts 和 evidence.ts 共同调用。

---

## 关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| Asset 处理状态存储方式 | metadata JSON 嵌套 processingStatus | 保持 status 字段过滤逻辑不变，零破坏 |
| 全文搜索 | PostgreSQL ILIKE on AssetChunk.content | 数据量可控，无需引入 ES |
| Evidence↔Profile 关联 | evidenceRefs String[] 存 ID | 避免多对多中间表复杂度 |
| 文本分块大小 | ~500 tokens/块，50 重叠 | 兼顾 qwen-plus 4096 token 上下文窗口 |
| MessagingMatrix | 独立模型 | 需按 valueProp/channel 单独查询更新 |
| CompanyProfile 扩展 | JSON 字段（sectionEdits/evidenceRefs） | 保持单记录设计，减少 join |

---

## 文件清单汇总

### 新建文件

| 路径 | Phase |
|------|-------|
| `src/types/knowledge.ts` | 2-0 |
| `src/lib/utils/chunk-utils.ts` | 2-0 |
| `src/lib/utils/text-extract.ts` | 2-0 |
| `src/app/[locale]/(customer)/c/knowledge/assets/page.tsx` | 2-1 |
| `src/components/knowledge/processing-status-badge.tsx` | 2-1 |
| `src/components/knowledge/asset-chunk-preview.tsx` | 2-1 |
| `src/components/knowledge/knowledge-asset-card.tsx` | 2-1 |
| `src/components/knowledge/content-search-bar.tsx` | 2-1 |
| `src/actions/evidence.ts` | 2-2 |
| `src/app/[locale]/(customer)/c/knowledge/evidence/page.tsx` | 2-2 |
| `src/components/knowledge/evidence-type-tag.tsx` | 2-2 |
| `src/components/knowledge/evidence-card.tsx` | 2-2 |
| `src/components/knowledge/evidence-create-dialog.tsx` | 2-2 |
| `src/components/knowledge/evidence-filters.tsx` | 2-2 |
| `src/components/knowledge/chunk-selector.tsx` | 2-2 |
| `src/app/[locale]/(customer)/c/knowledge/company/page.tsx` | 2-3 |
| `src/components/knowledge/section-editor.tsx` | 2-3 |
| `src/components/knowledge/evidence-ref-picker.tsx` | 2-3 |
| `src/components/knowledge/knowledge-tabs.tsx` | 2-3 |
| `src/actions/guidelines.ts` | 2-4 |
| `src/app/[locale]/(customer)/c/knowledge/guidelines/page.tsx` | 2-4 |
| `src/components/knowledge/guideline-category-tabs.tsx` | 2-4 |
| `src/components/knowledge/guideline-card.tsx` | 2-4 |
| `src/components/knowledge/guideline-form-dialog.tsx` | 2-4 |
| `src/actions/personas.ts` | 2-5 |
| `src/app/[locale]/(customer)/c/knowledge/profiles/page.tsx` | 2-5 |
| `src/components/knowledge/icp-segment-panel.tsx` | 2-5 |
| `src/components/knowledge/persona-card.tsx` | 2-5 |
| `src/components/knowledge/persona-form-dialog.tsx` | 2-5 |
| `src/components/knowledge/messaging-matrix-table.tsx` | 2-5 |

### 修改文件

| 路径 | Phase | 变更类型 |
|------|-------|---------|
| `prisma/schema.prisma` | 2-0 | 新增 6 模型 + 2 枚举 + 3 关系 |
| `src/actions/assets.ts` | 2-0, 2-1 | 追加 4 函数 |
| `src/actions/knowledge.ts` | 2-3 | 追加 5 函数 + 提取 extractText |
| `src/types/assets.ts` | 2-1 | 追加 processingStatus 类型 |
| `src/components/customer/customer-sidebar.tsx` | 2-1 | 知识引擎子菜单展开 |
| `src/app/[locale]/(customer)/c/knowledge/page.tsx` | 2-3 | 改为聚合页/重定向 |

---

## 验证计划（端到端）

完成所有 Phase 后的端到端验证：

1. **Schema**：`npx prisma validate && npx prisma generate`
2. **Build**：`npm run build` 无错误
3. **上传闭环**：上传 PDF → 触发处理 → 查看 chunks → 搜索内容
4. **证据闭环**：从 chunk 创建证据 → AI 批量生成 → 按 type 过滤 → 溯源查看
5. **认知闭环**：AI 分析生成画像 → section 编辑 → 关联证据 → AI 重新生成单 section
6. **规范闭环**：创建/编辑/删除规范 → Tab 切换 → 开关状态
7. **人设闭环**：创建 segment/persona → messaging matrix → AI 生成 → 编辑保存
8. **导航闭环**：侧边栏展开子菜单 → 各页面可达 → 活动状态高亮正确
