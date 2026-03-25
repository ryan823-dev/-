# Phase 3: 双引擎 MVP — 实施规范

## 总览

将知识引擎产出"用起来"：版本底座 + 营销系统 MVP + 推进中台 MVP + 决策中心 Chat。

```
Wave A (基础层，并行)
├── A1: ArtifactVersion 通用版本表 + CRUD
├── A2: Activity 扩展 + 统一日志 helper
└── A3: ContentBrief 模型 + 页面 + 侧边栏子菜单

Wave B (业务层，依赖 Wave A)
├── B1: ContentPiece Editor (Evidence 引用 + Guideline 校验)
├── B2: 推进中台 MVP (集中式评论+任务)
└── B3: 决策中心 Chat (Prompt 注入，非 RAG)
```

---

## 关键设计决策

| 决策 | 结论 |
|------|------|
| 营销整合策略 | **替换**：新 Brief→Editor 流程完全替换旧关键词+内容生成，旧代码中可复用的 AI prompt 和 UI 模式迁移过来 |
| 协作入口 | **集中在 Hub**：评论/任务统一在 /c/hub 查看和操作，点击跳转到对应实体 |
| 版本存储 | JSON 全量快照（非 diff），回滚=创建新版本 |
| 状态机 UI | 只暴露到 `approved`，`published` 枚举保留但按钮隐藏 |
| Chat 实现 | Prompt 注入（Company+Personas+Evidence 拼入 system prompt），非向量检索 |
| Guideline 校验 | 前端关键词匹配+高亮，不做 AI 自动改写 |

---

## 一、Prisma Schema 变更

### 文件：`prisma/schema.prisma`

#### 新增 Enum

```prisma
enum ArtifactStatus {
  draft
  in_review
  client_feedback
  revised
  approved
  published    // UI 隐藏，后续启用
  archived
}
```

#### 新增模型：ArtifactVersion (A1)

```prisma
model ArtifactVersion {
  id          String          @id @default(cuid())
  tenantId    String
  tenant      Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  entityType  String          // "CompanyProfile"|"Evidence"|"BrandGuideline"|"Persona"|"ContentBrief"|"SeoContent"
  entityId    String
  version     Int             // 从 1 自增
  status      ArtifactStatus  @default(draft)
  content     Json            // 实体完整快照
  meta        Json            @default("{}") // { changeNote, generatedBy: "ai"|"human", wordCount }
  createdById String
  createdBy   User            @relation(fields: [createdById], references: [id])
  createdAt   DateTime        @default(now())

  comments    ArtifactComment[]
  tasks       ArtifactTask[]

  @@unique([entityType, entityId, version])
  @@index([tenantId])
  @@index([entityType, entityId])
  @@index([tenantId, status])
}
```

#### Activity 扩展 (A2) — 追加 3 个可空字段

```prisma
model Activity {
  // ... 现有字段不变 ...
  eventCategory String?   // "knowledge"|"marketing"|"review"|"chat"|"system"
  severity      String?   // "info"|"warn"|"error"，默认 info
  context       Json?     // { versionId, briefId, previousStatus, ... }
}
```

#### 新增模型：ContentBrief (A3)

```prisma
model ContentBrief {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title           String
  targetPersonaId String?
  targetPersona   Persona?  @relation(fields: [targetPersonaId], references: [id], onDelete: SetNull)
  targetKeywords  String[]
  intent          String    // "informational"|"commercial"|"transactional"|"navigational"
  cta             String?
  evidenceIds     String[]  // 引用的 Evidence id 列表
  notes           String?   @db.Text
  status          String    @default("draft") // "draft"|"ready"|"in_progress"|"done"
  createdById     String
  createdBy       User      @relation(fields: [createdById], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  contentPieces   SeoContent[]

  @@index([tenantId])
  @@index([tenantId, status])
}
```

#### SeoContent 扩展 (B1) — 追加字段

```prisma
model SeoContent {
  // ... 现有字段不变，追加：
  briefId       String?
  brief         ContentBrief?  @relation(fields: [briefId], references: [id], onDelete: SetNull)
  outline       Json?          // { sections: [{ heading, keyPoints }] }
  evidenceRefs  String[]       // 引用的 Evidence id
  schemaJson    Json?          // Schema.org 结构化数据
}
```

#### 新增模型：ArtifactComment (B2)

```prisma
model ArtifactComment {
  id         String           @id @default(cuid())
  tenantId   String
  versionId  String
  version    ArtifactVersion  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  content    String           @db.Text
  authorId   String
  author     User             @relation(fields: [authorId], references: [id])
  parentId   String?
  parent     ArtifactComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies    ArtifactComment[] @relation("CommentReplies")
  resolvedAt DateTime?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  @@index([versionId])
  @@index([tenantId])
}
```

#### 新增模型：ArtifactTask (B2)

```prisma
model ArtifactTask {
  id          String           @id @default(cuid())
  tenantId    String
  versionId   String
  version     ArtifactVersion  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  title       String
  assigneeId  String?
  assignee    User?            @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  status      String           @default("open") // "open"|"in_progress"|"done"|"cancelled"
  priority    String           @default("normal") // "urgent"|"normal"|"low"
  dueDate     DateTime?
  createdById String
  createdBy   User             @relation("TaskCreator", fields: [createdById], references: [id])
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([versionId])
  @@index([tenantId, status])
  @@index([assigneeId])
}
```

#### 新增模型：ChatConversation + ChatMessage (B3)

```prisma
model ChatConversation {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String?
  contextSnapshot Json?         // debug 用：记录构建时的上下文摘要
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages        ChatMessage[]

  @@index([tenantId, userId])
}

model ChatMessage {
  id             String           @id @default(cuid())
  conversationId String
  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String           // "user"|"assistant"|"system"
  content        String           @db.Text
  references     Json?            // [{ evidenceId, title, excerpt }]
  tokens         Int?
  createdAt      DateTime         @default(now())

  @@index([conversationId, createdAt])
}
```

#### Tenant/User 关系追加

```prisma
// Tenant 追加
artifactVersions   ArtifactVersion[]
contentBriefs      ContentBrief[]
chatConversations  ChatConversation[]

// User 追加
artifactVersions   ArtifactVersion[]
contentBriefs      ContentBrief[]
artifactComments   ArtifactComment[]
tasksCreated       ArtifactTask[]     @relation("TaskCreator")
tasksAssigned      ArtifactTask[]     @relation("TaskAssignee")
chatConversations  ChatConversation[]
```

---

## 二、文件级实施计划

### Wave A

#### A1: ArtifactVersion CRUD

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 新增 ArtifactStatus enum + ArtifactVersion 模型 + Tenant/User 关系 |
| `src/types/artifact.ts` | 新建 | ArtifactVersionData、ArtifactStatusValue 类型、状态机转换规则常量 |
| `src/actions/versions.ts` | 新建 | 版本管理 Server Actions |

**`src/actions/versions.ts` 函数签名：**

```typescript
// 创建新版本（自动递增 version 号）
export async function createVersion(
  entityType: string, entityId: string,
  content: Record<string, unknown>,
  meta?: { changeNote?: string; generatedBy?: 'ai' | 'human' }
): Promise<ArtifactVersionData>

// 列出版本历史（DESC）
export async function listVersions(
  entityType: string, entityId: string
): Promise<ArtifactVersionData[]>

// 获取最新版本
export async function getLatestVersion(
  entityType: string, entityId: string
): Promise<ArtifactVersionData | null>

// 获取指定版本
export async function getVersionById(versionId: string): Promise<ArtifactVersionData | null>

// 更新版本状态（含状态机校验）
export async function updateVersionStatus(
  versionId: string, newStatus: ArtifactStatus
): Promise<ArtifactVersionData>

// 回滚到指定版本（创建新版本，content=目标版本内容）
export async function revertToVersion(versionId: string): Promise<ArtifactVersionData>
```

**状态机转换规则：**
```
draft → in_review
in_review → client_feedback | approved | draft(退回)
client_feedback → revised
revised → in_review
approved → archived
任意 → archived
```

#### A2: Activity Enhancement

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | Activity 追加 eventCategory/severity/context 字段 |
| `src/lib/utils/activity-logger.ts` | 新建 | 统一日志辅助函数 |
| `src/actions/hub.ts` | 修改 | getRecentActivity 返回新字段 |

**`src/lib/utils/activity-logger.ts`：**

```typescript
export async function logActivity(params: {
  tenantId: string;
  userId: string;
  action: string;           // "evidence.created" | "version.status_changed" | ...
  entityType: string;
  entityId: string;
  eventCategory?: string;   // "knowledge"|"marketing"|"review"|"chat"
  severity?: string;        // "info"|"warn"|"error"
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void>
// fire-and-forget，不抛异常，错误仅 console.error
```

#### A3: ContentBrief + 页面 + 侧边栏

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 新增 ContentBrief 模型 |
| `src/actions/briefs.ts` | 新建 | Brief CRUD + AI 生成 |
| `src/app/[locale]/(customer)/c/marketing/briefs/page.tsx` | 新建 | 内容简报列表+创建 |
| `src/components/marketing/brief-card.tsx` | 新建 | 简报卡片组件 |
| `src/components/customer/customer-sidebar.tsx` | 修改 | 营销系统展开为子菜单 |

**`src/actions/briefs.ts` 函数签名：**

```typescript
export async function getBriefs(filters?: { status?: string }): Promise<BriefData[]>
export async function getBriefById(id: string): Promise<BriefData | null>
export async function createBrief(data: CreateBriefInput): Promise<BriefData>
export async function updateBrief(id: string, data: Partial<CreateBriefInput>): Promise<BriefData>
export async function deleteBrief(id: string): Promise<boolean>

// AI 从 Persona 生成 Brief（读取 Persona + MessagingMatrix + CompanyProfile）
export async function generateBriefFromPersona(
  personaId: string, topic: string
): Promise<BriefData>
```

**侧边栏变更 — 营销系统展开：**
```
营销系统 (BarChart3)
├── 内容简报 /c/marketing/briefs  (ClipboardList)
└── 内容管理 /c/marketing         (FileText)
```

原 `/c/marketing` 保留为内容列表页面（SeoContent list），新增 `/c/marketing/briefs` 为 Brief 管理页面。

---

### Wave B

#### B1: ContentPiece Editor

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | SeoContent 追加 briefId/outline/evidenceRefs/schemaJson |
| `src/actions/marketing.ts` | 修改 | 增强 saveContent 支持新字段；新增 generateContentFromBrief |
| `src/app/[locale]/(customer)/c/marketing/editor/[id]/page.tsx` | 新建 | 结构化内容编辑器 |
| `src/components/marketing/content-editor.tsx` | 新建 | 编辑器主体容器 |
| `src/components/marketing/evidence-picker.tsx` | 新建 | 证据引用选择器 Sheet |
| `src/components/marketing/guideline-hint-panel.tsx` | 新建 | 品牌规范提示面板 |
| `src/components/marketing/seo-output-panel.tsx` | 新建 | 上线包字段面板 |
| `src/app/[locale]/(customer)/c/marketing/page.tsx` | 修改 | 重构：列表页 + 创建入口改为从 Brief 创建 |

**编辑器布局（两栏）：**
```
┌──────────────────────────────────────────────────────────┐
│ Header: [Brief标题] [状态Badge] [保存草稿] [提交审核]     │
├─────────────────────────┬────────────────────────────────┤
│                         │  Tab: 规范提示 | 证据库 | 版本  │
│  主编辑区                │  ┌──────────────────────────┐  │
│  ┌─ 标题 ───────────┐   │  │ Guideline 规范条目列表   │  │
│  ├─ 大纲 ───────────┤   │  │ 违规关键词高亮提示       │  │
│  ├─ 正文 (Textarea) ┤   │  ├──────────────────────────┤  │
│  ├─ FAQ ────────────┤   │  │ Evidence 可选列表        │  │
│  └─ AEO 段落 ───────┘   │  │ 已引用 Evidence 列表     │  │
│                         │  ├──────────────────────────┤  │
│                         │  │ 上线包: meta/slug/schema  │  │
│                         │  └──────────────────────────┘  │
└─────────────────────────┴────────────────────────────────┘
```

**Guideline 校验逻辑（前端）：**
1. 加载 `getGuidelines()` 中 `isActive=true` 的条目
2. 对 `terminology` 类 guideline 的 `examples.dont` 数组提取关键词
3. 在编辑区文本变化时，用简单字符串匹配检测违规词
4. 命中时：编辑区对应文字高亮 + 侧栏显示对应规范条目

**Evidence 引用流程：**
1. 用户点击"引用证据"按钮 → 打开 EvidencePicker Sheet
2. 展示 Evidence 列表（支持搜索和类型过滤）
3. 选中后在正文中插入 `[证据:{title}]` 标记
4. 保存时提取所有标记，填充 `evidenceRefs[]` 字段

**旧营销流程迁移：**
- 从现有 `generateContent()` 迁移 AI prompt 中的企业画像注入逻辑
- 从现有 `generateKeywords()` 迁移关键词建议功能到 Brief 创建流程
- 新增 `generateContentFromBrief(briefId)` — 读取 Brief 的 persona/keywords/evidence 构建更精准的 prompt

#### B2: 推进中台 MVP（集中在 Hub）

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 新增 ArtifactComment + ArtifactTask |
| `src/actions/artifact-collab.ts` | 新建 | 评论和任务 Server Actions |
| `src/actions/hub.ts` | 修改 | 新增 getMyTasks, 增强 getRecentActivity |
| `src/app/[locale]/(customer)/c/hub/page.tsx` | 修改 | 双 Tab：系统建议 + 我的任务 |
| `src/components/hub/task-board.tsx` | 新建 | 任务看板组件 |
| `src/components/hub/comment-thread.tsx` | 新建 | 评论线程组件 |
| `src/components/hub/version-detail-sheet.tsx` | 新建 | 版本详情+评论的 Sheet |

**`src/actions/artifact-collab.ts` 函数签名：**

```typescript
// 评论
export async function addComment(versionId: string, content: string, parentId?: string): Promise<CommentData>
export async function getComments(versionId: string): Promise<CommentData[]>  // 含嵌套 replies
export async function resolveComment(commentId: string): Promise<CommentData>

// 任务
export async function createTask(versionId: string, data: CreateTaskInput): Promise<TaskData>
export async function updateTaskStatus(taskId: string, status: string): Promise<TaskData>
export async function getMyTasks(): Promise<TaskData[]>           // 当前用户被分配的任务
export async function getVersionTasks(versionId: string): Promise<TaskData[]>
```

**Hub 页面改造：**
```
┌─────────────────────────────────────────────┐
│  推进中台                                     │
│  [系统建议] [我的任务]    ← Tab 切换           │
├─────────────────────────────────────────────┤
│ 「系统建议」Tab: 保留现有 getSystemTodos 逻辑  │
│ 「我的任务」Tab:                               │
│  ┌─────────────┬──────────┬──────────┐      │
│  │ 待处理 (3)   │ 进行中 (1)│ 已完成 (5)│      │
│  ├─────────────┤          │          │      │
│  │ TaskCard    │ TaskCard │ TaskCard │      │
│  │ - 实体类型   │          │          │      │
│  │ - 版本号     │          │          │      │
│  │ - 优先级     │          │          │      │
│  │ - 截止日期   │          │          │      │
│  │ [查看详情]   │          │          │      │
│  └─────────────┴──────────┴──────────┘      │
│                                              │
│  点击[查看详情] → 打开 VersionDetailSheet     │
│  Sheet 内含: 版本内容快照 + 评论线程 + 任务列表 │
└─────────────────────────────────────────────┘
```

#### B3: 决策中心 Chat MVP

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 新增 ChatConversation + ChatMessage |
| `src/actions/chat.ts` | 新建 | 对话管理 + AI 消息发送 |
| `src/app/[locale]/(customer)/c/home/page.tsx` | 修改 | 替换简单输入框为完整 Chat UI |
| `src/components/chat/chat-panel.tsx` | 新建 | 对话面板主体 |
| `src/components/chat/conversation-list.tsx` | 新建 | 历史对话侧栏 |
| `src/components/chat/message-bubble.tsx` | 新建 | 消息气泡（含引用卡片） |
| `src/components/chat/reference-card.tsx` | 新建 | Evidence 引用卡片 |

**`src/actions/chat.ts` 函数签名：**

```typescript
export async function createConversation(title?: string): Promise<ConversationData>
export async function getConversations(): Promise<ConversationData[]>  // 最近 20 条
export async function getMessages(conversationId: string): Promise<ChatMessageData[]>
export async function sendMessage(conversationId: string, userMessage: string): Promise<ChatMessageData>
export async function deleteConversation(conversationId: string): Promise<boolean>
```

**Prompt 注入上下文构建 (`buildSystemContext`)：**

```typescript
async function buildSystemContext(tenantId: string): Promise<string> {
  // 1. CompanyProfile → 公司名、核心产品(前3)、技术优势(前3)、差异化卖点
  // 2. Personas → 前3个的 name + concerns
  // 3. Evidence → isActive的前10条（优先 certification > case_study > statistic）
  // 4. BrandGuideline → isActive=true 的 messaging 类规范
  
  return `[企业知识库]
公司：${name} — ${intro}
核心产品：${products}
关键买家：${personas}
证据库（引用时请标注来源）：
[E1] ${title}: ${content前100字}
...
[品牌规范]：${guidelines}

回答要求：
1. 给出明确结论
2. 建议可执行行动
3. 引用证据时用 [引用:E{n}] 格式
4. 用中文回答`;
}
```

**消息流程：**
1. 用户输入消息 → INSERT ChatMessage(role=user)
2. 读取历史消息(最近10条) + buildSystemContext
3. 调用 `aiClient.chat.completions.create` (model: deepseek-v3)
4. 解析回复中 `[引用:E{n}]` 标记 → 映射到 Evidence ID
5. INSERT ChatMessage(role=assistant, references=[...])
6. 前端渲染：消息文本 + ReferenceCard 组件

**Home 页面改造：**
```
┌─────────────────────────────────────────────────────────┐
│ 决策中心                                                  │
├────────────────────────────────────┬────────────────────┤
│                                    │                    │
│  聊天区域                          │  右侧栏            │
│  ┌────────────────────────────┐   │  ┌────────────────┐│
│  │ 对话历史列表 (左侧可折叠)    │   │  │ 待决策 (3)     ││
│  │ ┌─ 今日对话 ─────────────┐ │   │  │ - 高意向线索    ││
│  │ │ "核心优势分析" 10:30    │ │   │  │ - 内容待发布    ││
│  │ │ "竞品比较" 09:15       │ │   │  │                ││
│  │ └────────────────────────┘ │   │  │ 模块健康度      ││
│  ├────────────────────────────┤   │  │ ● 知识引擎 ✓    ││
│  │ 消息流                     │   │  │ ◐ 营销系统 !    ││
│  │ 🧑 我们的核心优势是什么？    │   │  │                ││
│  │ 🤖 根据贵司资料分析...      │   │  │ 快捷提问        ││
│  │    [引用:E1] [引用:E3]     │   │  │ [一分钟汇报]    ││
│  │    ┌ ReferenceCard ──────┐ │   │  │ [增长瓶颈]      ││
│  │    │ E1: 产品认证ISO9001 │ │   │  └────────────────┘│
│  │    └─────────────────────┘ │   │                    │
│  ├────────────────────────────┤   │                    │
│  │ [输入框...]         [发送] │   │                    │
│  └────────────────────────────┘   │                    │
└────────────────────────────────────┴────────────────────┘
```

---

## 三、数据兼容与迁移

| 变更 | 影响 | 策略 |
|------|------|------|
| Activity 新增 3 字段 | 全部 nullable | 旧记录新字段为 null，零破坏 |
| SeoContent 新增 4 字段 | 全部 nullable/有默认值 | 旧内容 briefId=null，兼容 |
| 新增 6 个模型 | 纯增量 | 无影响 |
| 营销页面重构 | 旧 SeoContent 数据保留 | 列表页继续展示旧内容，新内容通过 Brief 创建 |

**迁移命令：**
```bash
npx prisma migrate dev --name phase3_dual_engine
npx prisma generate
```

---

## 四、验证策略

### Wave A 验证

**A1 — 版本管理：**
1. `npx prisma validate && npx prisma generate` 通过
2. 对 Evidence 创建 2 个版本，确认 version 自增 (1→2)
3. revertToVersion 创建 version 3，内容=version 1 快照
4. 状态机：draft→in_review 成功，draft→approved 被拒

**A2 — Activity Logger：**
1. 调用 logActivity 后查询 Activity 表确认新字段写入
2. getRecentActivity 返回含 eventCategory/severity 的记录
3. 旧 Activity 记录（新字段 null）正常返回不崩溃

**A3 — ContentBrief：**
1. 创建 Brief → getBriefs 列出
2. generateBriefFromPersona 返回含 targetKeywords 的结构
3. Briefs 页面渲染列表 + 空状态
4. 侧边栏营销系统子菜单展开显示

### Wave B 验证

**B1 — ContentPiece Editor：**
1. 从 Brief 进入编辑器，Guidelines 提示面板加载规范
2. 输入违规关键词 → 高亮出现
3. 插入 Evidence 引用 → 保存后 evidenceRefs 持久化
4. 保存时自动创建 ArtifactVersion

**B2 — 推进中台：**
1. 对 ArtifactVersion 添加评论 + 嵌套回复
2. 创建任务 → 在 Hub "我的任务" Tab 显示
3. 更新任务状态 open→done

**B3 — 决策中心 Chat：**
1. 创建对话 → 发送消息 → AI 回复含 [引用:En]
2. ReferenceCard 正确展示引用的 Evidence
3. 历史对话列表按时间倒序

### 最终端到端验证

```
选择一个 Persona
  → generateBriefFromPersona 生成 Brief
    → 从 Brief 进入 Editor 创建内容
      → 引用 3 条 Evidence
        → 提交审核（状态 → in_review）
          → Hub 显示审核任务
            → 添加评论 "请修改第二段"
              → 修订产新版本（revised）
                → 批准（approved）
全流程可追溯 ✓
```

---

## 五、关键文件路径汇总

### 新建文件 (14)
```
src/types/artifact.ts
src/actions/versions.ts
src/actions/briefs.ts
src/actions/artifact-collab.ts
src/actions/chat.ts
src/lib/utils/activity-logger.ts
src/app/[locale]/(customer)/c/marketing/briefs/page.tsx
src/app/[locale]/(customer)/c/marketing/editor/[id]/page.tsx
src/components/marketing/brief-card.tsx
src/components/marketing/content-editor.tsx
src/components/marketing/evidence-picker.tsx
src/components/marketing/guideline-hint-panel.tsx
src/components/hub/task-board.tsx
src/components/hub/comment-thread.tsx
src/components/hub/version-detail-sheet.tsx
src/components/chat/chat-panel.tsx
src/components/chat/conversation-list.tsx
src/components/chat/message-bubble.tsx
src/components/chat/reference-card.tsx
```

### 修改文件 (7)
```
prisma/schema.prisma
src/actions/hub.ts
src/actions/marketing.ts
src/components/customer/customer-sidebar.tsx
src/app/[locale]/(customer)/c/hub/page.tsx
src/app/[locale]/(customer)/c/home/page.tsx
src/app/[locale]/(customer)/c/marketing/page.tsx
```
