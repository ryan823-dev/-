# AI Skills 双引擎系统 - 实现规格

## 概述

实现统一的 AI Skills API，包含 14 个 Skill：
- **获客雷达 (7个)**: radar.buildTargetingSpec, radar.buildChannelMap, radar.planAccountDiscovery, radar.qualifyAccounts, radar.buildContactRoleMap, radar.generateOutreachPack, radar.generateWeeklyCadence
- **营销系统 (5个)**: marketing.buildTopicCluster, marketing.generateContentBrief, marketing.generateContentDraft, marketing.verifyClaims, marketing.buildPublishPack

## 核心设计决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 是否新增 DB 表 | **不新增** | ArtifactVersion.content (Json) 存储所有产物 |
| Skill 调用路径 | **Server Action → Runner 直调** | 避免 HTTP 往返 |
| openQuestions 处理 | **自动创建 Task** | 复用 ArtifactTask 模型 |
| Evidence 验证 | **白名单校验** | 防止 AI 幻觉引用 |

---

## 文件结构

```
src/
├── lib/skills/
│   ├── types.ts              # Skill 核心类型
│   ├── registry.ts           # Skill 注册表
│   ├── runner.ts             # 统一执行引擎
│   ├── evidence-loader.ts    # Evidence 加载工具
│   ├── radar/                # 7个雷达 Skills
│   │   ├── index.ts
│   │   ├── targeting-spec.ts
│   │   ├── channel-map.ts
│   │   ├── account-discovery.ts
│   │   ├── qualify-accounts.ts
│   │   ├── contact-role-map.ts
│   │   ├── outreach-pack.ts
│   │   └── weekly-cadence.ts
│   └── marketing/            # 5个营销 Skills
│       ├── index.ts
│       ├── topic-cluster.ts
│       ├── content-brief.ts
│       ├── content-draft.ts
│       ├── verify-claims.ts
│       └── publish-pack.ts
├── actions/skills.ts         # Server Action
└── app/api/ai/skills/[skillName]/route.ts  # API 路由
```

---

## 新增 EntityType

在 `src/types/artifact.ts` 扩展：

```typescript
export type EntityType =
  | 'CompanyProfile'
  | 'Evidence'
  | 'BrandGuideline'
  | 'Persona'
  | 'ContentBrief'
  | 'ContentPiece'
  | 'SeoContent'
  // 新增雷达产物
  | 'TargetingSpec'
  | 'ChannelMap'
  | 'AccountList'
  | 'ContactRoleMap'
  | 'OutreachPack'
  | 'WeeklyCadence'
  // 新增营销产物
  | 'TopicCluster'
  | 'ContentDraft'
  | 'ClaimsVerification'
  | 'PublishPack';
```

---

## 核心类型设计 (`src/lib/skills/types.ts`)

```typescript
import { z } from 'zod';
import type { EntityType } from '@/types/artifact';

export type SkillEngine = 'radar' | 'marketing';
export type SkillMode = 'generate' | 'refine' | 'verify';

export interface SkillDefinition {
  name: string;                    // radar.buildTargetingSpec
  displayName: string;             // 生成 Targeting Spec
  engine: SkillEngine;
  outputEntityType: EntityType;
  inputSchema: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
  systemPrompt: string;
  buildUserPrompt: (ctx: PromptContext) => string;
  suggestedNextSkills: string[];
  model?: 'qwen-plus' | 'qwen-max';
}

export interface SkillRequest {
  entityType: EntityType;
  entityId: string;
  artifactVersionId?: string;
  input: Record<string, unknown>;
  mode: SkillMode;
  evidenceIds?: string[];
  useCompanyProfile?: boolean;
}

export interface SkillResponse {
  ok: boolean;
  output: Record<string, unknown>;
  references: Array<{ evidenceId: string; title: string; why: string }>;
  confidence: number;
  openQuestions: string[];
  suggestedNextSkills: string[];
  versionId: string;
  taskIds: string[];
}
```

---

## 执行引擎流水线 (`src/lib/skills/runner.ts`)

```
1. 输入验证 (Zod inputSchema)
2. Context 加载 (CompanyProfile + Evidence + 已有版本)
3. Prompt 构建 (systemPrompt + userPrompt)
4. AI 调用 (chatCompletion)
5. 输出解析 (JSON + Zod outputSchema)
6. 后处理流水线:
   a. 创建 ArtifactVersion
   b. 写 Activity 日志
   c. openQuestions → Task
   d. missingProof → Task (urgent)
7. 返回 SkillResponse
```

---

## API 路由 (`/api/ai/skills/[skillName]/route.ts`)

```typescript
POST /api/ai/skills/{skillName}

Request:
{
  "entityType": "CompanyProfile",
  "entityId": "cly...",
  "input": { ... },
  "mode": "generate",
  "evidenceIds": ["cly...", "cly..."],
  "useCompanyProfile": true
}

Response:
{
  "ok": true,
  "output": { ... },
  "references": [...],
  "confidence": 0.85,
  "openQuestions": [...],
  "suggestedNextSkills": [...],
  "versionId": "cly...",
  "taskIds": ["cly...", "cly..."]
}
```

---

## 实现步骤

### Phase 1: 基础骨架 (4 files)
1. `src/types/artifact.ts` - 扩展 EntityType
2. `src/lib/skills/types.ts` - 类型定义
3. `src/lib/skills/registry.ts` - 注册表骨架
4. `src/lib/skills/runner.ts` - 执行引擎骨架

### Phase 2: API + Evidence (2 files)
5. `src/app/api/ai/skills/[skillName]/route.ts` - API 路由
6. `src/lib/skills/evidence-loader.ts` - Evidence 加载

### Phase 3: 雷达 Skills (8 files)
7-14. `src/lib/skills/radar/*.ts` - 7 个 Skill + index

### Phase 4: 营销 Skills (6 files)
15-20. `src/lib/skills/marketing/*.ts` - 5 个 Skill + index

### Phase 5: Server Action (1 file)
21. `src/actions/skills.ts` - 页面调用入口

---

## 关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/artifact.ts` | 编辑 | 扩展 EntityType |
| `src/lib/skills/types.ts` | 新建 | 核心类型 |
| `src/lib/skills/registry.ts` | 新建 | Skill 注册表 |
| `src/lib/skills/runner.ts` | 新建 | 执行引擎 |
| `src/lib/skills/evidence-loader.ts` | 新建 | Evidence 工具 |
| `src/app/api/ai/skills/[skillName]/route.ts` | 新建 | API 路由 |
| `src/lib/skills/radar/*.ts` | 新建 | 7个雷达 Skill |
| `src/lib/skills/marketing/*.ts` | 新建 | 5个营销 Skill |
| `src/actions/skills.ts` | 新建 | Server Action |

---

## 验证方案

1. **单元测试**: 每个 Skill 的 inputSchema/outputSchema 验证
2. **API 测试**: curl 调用 `/api/ai/skills/radar.buildTargetingSpec`
3. **集成测试**: 完整流程 - Skill 执行 → ArtifactVersion 创建 → Task 生成 → Activity 记录
4. **页面验证**: CollaborativeShell 显示新 EntityType 的版本历史

---

## 产物 Prompt 模板

所有 Skill 输出必须包含：
```json
{
  "confidence": 0.0-1.0,
  "openQuestions": ["..."],
  "assumptions": ["..."],
  "evidenceIds": ["cly...", "cly..."],
  "suggestedNextSkills": ["radar.buildChannelMap"]
}
```
