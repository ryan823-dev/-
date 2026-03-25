# Collaborative Shell 通用协作壳实现方案

## 目标
实现统一的"通用协作壳"组件，让所有产出（Artifact）都能进入协作流转，覆盖 6 个原子能力：
1. **版本** - 新建版本、回看历史
2. **状态** - draft → in_review → client_feedback → revised → approved
3. **批注** - 可定位到具体内容位置（jsonPath / blockId / textRange / rowId）
4. **任务** - 评论转任务，可分配负责人
5. **审批** - 通过/驳回，通过后冻结版本（只读）
6. **留痕** - Activity 事件流追溯

## 架构全景

```
┌─────────────────────────────────────────────────────────────────┐
│                    Collaborative Shell 架构                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─── CompanyPage ───────────────────────────────────────────┐  │
│  │  [ JSON Section Editor ] [ CollaborativeShell ]            │  │
│  │            ↕ anchorType: jsonPath                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─── ContentPiecePage ──────────────────────────────────────┐  │
│  │  [ Rich Text Editor ]  [ CollaborativeShell (w-80) ]       │  │
│  │            ↕ anchorType: blockId                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─── CollaborativeShell 组件 ──────────────────────────────┐   │
│  │  [版本] [批注] [任务] [历史]  ← 4 Tabs                     │   │
│  │  ┌──────────────────────────────────────┐                  │   │
│  │  │  版本状态机 + 审批工作流              │                  │   │
│  │  │  Request Changes → client_feedback    │                  │   │
│  │  │  Approve → approved (frozen/只读)     │                  │   │
│  │  └──────────────────────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 当前状态分析

### 已有基础设施
- ✅ ArtifactVersion 多态快照存储 + 7 状态 + 状态机
- ✅ ArtifactComment 评论（支持嵌套回复 via parentId）
- ✅ ArtifactTask 任务（4 状态 + 3 优先级）
- ✅ Activity 日志 + Fire-and-forget 模式
- ✅ Hub 页面聚合展示（tabs: todos/tasks/comments）

### 缺失功能
- ❌ 评论锚点系统（anchorType/anchorValue/anchorLabel）
- ❌ 评论转任务链接（sourceCommentId / linkedTaskId）
- ❌ 审批工作流（requestChanges / approveVersion）
- ❌ 版本冻结机制（approved 状态只读）
- ❌ 统一的 CollaborativeShell UI 组件

---

## 实现方案

### Phase 1: Schema 增强

#### 1.1 ArtifactComment 添加锚点字段
```prisma
model ArtifactComment {
  // ... existing fields ...
  
  // 锚点定位 (新增)
  anchorType    String?   // "jsonPath"|"textRange"|"blockId"|"rowId"|null
  anchorValue   String?   // e.g. "coreProducts[0]", "block-uuid-xxx"
  anchorLabel   String?   // 人类可读标签，如"核心产品·第1项"
  linkedTaskId  String?   // 评论转任务后的关联
  linkedTask    ArtifactTask? @relation("CommentTask", ...)
}
```

#### 1.2 ArtifactTask 添加来源评论
```prisma
model ArtifactTask {
  // ... existing fields ...
  
  // 来源评论 (新增)
  sourceCommentId String?
  sourceComment   ArtifactComment? @relation("CommentTask", ...)
}
```

### Phase 2: CollaborativeShell 组件

#### 2.1 文件结构
```
src/components/collaboration/
├── collaborative-shell.tsx       ← 主容器（4 Tabs）
├── shell-version-tab.tsx         ← 版本管理
├── shell-comments-tab.tsx        ← 评论列表
├── shell-tasks-tab.tsx           ← 任务列表
├── shell-history-tab.tsx         ← 历史记录
├── comment-card.tsx              ← 评论卡片（含锚点徽章）
├── anchor-badge.tsx              ← 锚点标识徽章
├── approval-action-bar.tsx       ← 审批操作条
└── index.ts
```

#### 2.2 核心 Props
```typescript
interface CollaborativeShellProps {
  entityType: EntityType;
  entityId: string;
  versionId?: string;  // undefined 时用最新版本
  
  // 锚点系统
  anchorType: "jsonPath" | "textRange" | "blockId" | "rowId";
  activeAnchor?: AnchorSpec;  // 当前高亮锚点
  onAnchorClick?: (anchor: AnchorSpec) => void;  // 点击锚点回调
  
  // 审批回调
  onStatusChange?: (newStatus: ArtifactStatusValue) => void;
  
  className?: string;
}

interface AnchorSpec {
  type: "jsonPath" | "textRange" | "blockId" | "rowId";
  value: string;   // "coreProducts[0]" / "block-123"
  label: string;   // "核心产品·第1项"
}
```

#### 2.3 Tab 功能

| Tab | 功能 |
|-----|------|
| **版本** | 版本列表 + 状态徽章 + 审批操作条 + 回滚按钮 |
| **批注** | 评论列表（含锚点定位）+ 回复/解决/转任务 + 新建评论 |
| **任务** | 任务列表 + 状态切换 + 快速创建 |
| **历史** | Activity 时间线（版本状态变更事件）|

#### 2.4 ApprovalActionBar（仅 in_review 状态显示）
```
┌──────────────────────────────────────────────┐
│  ⚠ 请求修改        │   ✓ 批准此版本          │
│  (→client_feedback) │   (→approved, 冻结)     │
└──────────────────────────────────────────────┘
```

### Phase 3: 审批工作流

#### 3.1 Server Actions
```typescript
// src/actions/approval.ts

// 请求修改：status → client_feedback，需要填写原因
export async function requestChanges(versionId: string, note: string): Promise<void>

// 批准：status → approved，版本冻结
export async function approveVersion(versionId: string): Promise<void>

// 评论转任务：创建 Task 并关联 Comment
export async function convertCommentToTask(commentId: string, input: CreateTaskInput): Promise<TaskData>
```

#### 3.2 版本冻结规则
```typescript
const isReadOnly = 
  currentVersion?.status === 'approved' || 
  currentVersion?.status === 'archived';
```

- approved 版本所有编辑入口禁用
- 页面顶部显示只读横幅
- 后续编辑必须创建新版本

### Phase 4: 页面集成

#### 4.1 Company Profile 页面
- **锚点类型**: `jsonPath`
- **支持锚点**: `companyIntro`, `coreProducts[n]`, `techAdvantages[n]`, `scenarios[n]`...
- **交互**: Section 悬停显示"添加评论"按钮，点击后锚定到该 Section
- **高亮**: 点击评论锚点 → 对应 Section 显示 `ring-2 ring-[#C7A56A]/40`
- **只读**: approved 状态隐藏编辑按钮，显示只读横幅

#### 4.2 ContentPiece 编辑器
- **锚点类型**: `blockId` (段落级)
- **支持锚点**: outline sections, content paragraphs
- **交互**: 选中文字后显示"评论"按钮，锚定到选中段落
- **右侧栏**: 保留证据引用+规范校验面板，上方插入 CollaborativeShell

---

## 关键文件

### 需新建
| 文件 | 用途 |
|-----|------|
| `src/components/collaboration/collaborative-shell.tsx` | 主组件 |
| `src/components/collaboration/shell-version-tab.tsx` | 版本面板 |
| `src/components/collaboration/shell-comments-tab.tsx` | 评论面板 |
| `src/components/collaboration/shell-tasks-tab.tsx` | 任务面板 |
| `src/components/collaboration/shell-history-tab.tsx` | 历史面板 |
| `src/components/collaboration/comment-card.tsx` | 评论卡片 |
| `src/components/collaboration/anchor-badge.tsx` | 锚点徽章 |
| `src/components/collaboration/approval-action-bar.tsx` | 审批操作条 |
| `src/actions/approval.ts` | 审批动作 |

### 需修改
| 文件 | 修改内容 |
|-----|---------|
| `prisma/schema.prisma` | 添加锚点字段 + sourceCommentId |
| `src/types/artifact.ts` | 添加 AnchorSpec 类型、扩展 CommentData |
| `src/actions/collaboration.ts` | 增强 createComment 支持锚点 |
| `src/app/.../c/knowledge/company/page.tsx` | 集成 Shell + jsonPath 锚点 |
| `src/app/.../c/marketing/contents/[id]/page.tsx` | 集成 Shell + blockId 锚点 |

---

## 验收标准

跨 2 个模块跑通协作闭环：

### 场景 1: Knowledge → Company
1. ☐ 在"核心产品"section 添加评论（锚点 `coreProducts[0]`）
2. ☐ 将评论转为任务
3. ☐ 提交审核（draft → in_review）
4. ☐ 审批通过（in_review → approved）
5. ☐ 验证版本冻结（编辑按钮禁用）

### 场景 2: Marketing → ContentPiece
1. ☐ 引用 Company 最新 approved 版本的数据
2. ☐ 在正文段落添加批注
3. ☐ 客户请求修改（in_review → client_feedback）
4. ☐ 修订后新建版本
5. ☐ 审批通过（approved）

---

## 实现顺序

| 阶段 | 内容 | 预估 |
|------|------|------|
| **C1** | Schema 增强 + Prisma 迁移 + 类型定义 | 0.5 天 |
| **C2** | Server Actions (approval.ts + collaboration.ts 扩展) | 0.5 天 |
| **C3** | CollaborativeShell UI 组件 (8 个文件) | 2 天 |
| **C4** | Company 页面集成 (jsonPath 锚点 + 只读模式) | 1 天 |
| **C5** | ContentPiece 页面集成 (blockId 锚点) | 1 天 |
| **C6** | 验收测试 + Bug 修复 | 0.5 天 |

**总计**: ~5.5 天

---

## 视觉设计规范

### 颜色主题
- **浅色（Company 页）**: `bg-[#FFFCF6]`, `border-[#E7E0D3]`, `text-[#0B1B2B]`
- **深色（ContentPiece）**: `bg-[#10263B]/30`, `border-[#10263B]/50`, `text-white`
- **强调色**: `#C7A56A` (金色)

### 锚点徽章图标
| anchorType | 图标 | 颜色 |
|------------|------|------|
| jsonPath | `{}` Braces | amber |
| blockId | `⬡` Blocks | blue |
| textRange | `T↕` TextSelect | purple |
| rowId | `≡` AlignLeft | emerald |

### 只读横幅
```
┌──────────────────────────────────────────────────────────┐
│ 🔒  此版本已于 2026-03-03 批准 · 内容已锁定              │
│      [查看最新草稿 →]                                    │
└──────────────────────────────────────────────────────────┘
背景: bg-[#C7A56A]/10 border-[#C7A56A]/30
```
