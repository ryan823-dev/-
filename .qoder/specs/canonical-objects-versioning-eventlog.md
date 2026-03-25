# VertaX 统一对象模型 + 版本系统 + 事件日志

## 目标

在现有 23 个 Prisma 模型基础上，新增 **16 个模型**、**12 个 Enum**，修改 **2 个现有模型**（Lead、Activity），为 Tenant 补充关联声明。这三项公共能力是未来各模块"互相喂数据"的前提。

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `prisma/schema.prisma` | 核心：新增 enum + 新模型 + 修改 Lead/Activity/Tenant |
| `prisma/seed.ts` | 补充基础种子数据（Market、角色权限等） |

迁移通过 `prisma migrate dev` 自动生成，无需手写 SQL。

---

## 一、新增 Enum（12 个）

```prisma
enum ContentType {
  ARTICLE
  LANDING_PAGE
  FAQ
  EMAIL_TEMPLATE
  PR_DRAFT
  SOCIAL_DRAFT
  CASE_STUDY
  WHITE_PAPER
  AD_COPY
}

enum ArtifactStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
}

enum TouchpointChannel {
  EMAIL
  WHATSAPP
  LINKEDIN
  PHONE
  MEETING
  OTHER
}

enum TouchpointDirection {
  OUTBOUND
  INBOUND
}

enum FeedbackType {
  COMMENT
  REVISION
  APPROVAL
  REJECTION
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
  CANCELLED
}

enum DecisionStatus {
  PROPOSED
  DECIDED
  SUPERSEDED
}

enum EventCategory {
  SYSTEM
  CONTENT
  OUTREACH
  APPROVAL
  CONVERSION
}

enum EventSeverity {
  INFO
  WARNING
  ERROR
}

enum EventSource {
  MANUAL
  AI
  SYSTEM
  API
}
```

> 设计原则：现有模型继续用 String 存状态不改动，新模型对核心状态机用 Enum 保证数据完整性。

---

## 二、新增模型（16 个）

### Layer 1: Knowledge/Strategy（6 个）

#### Market（目标市场）
```
id, tenantId, name, code, region, timezone, language, currency, notes(@db.Text), metadata(Json)
createdAt, updatedAt
@@unique([tenantId, code])
@@index([tenantId])
关联: targetAccounts[], icpSegments[], leads[]
```

#### ICPSegment（理想客户画像细分）
```
id, tenantId, name, industry, companySizeMin(Int?), companySizeMax(Int?), region
painPoints(Json), buyingTriggers(Json), qualificationCriteria(Json)
priority(String @default("medium")), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, industry]), @@index([priority])
关联: personas[], contentPieces[], valueProps[], targetAccounts[]
```

#### Persona（买家角色）
```
id, tenantId, icpSegmentId(String?), name, title, department, seniority
goals(Json), challenges(Json), preferredChannels(String[]), messagingAngle(@db.Text)
metadata(Json), createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, icpSegmentId])
关联: icpSegment?, contentPieces[], leads[]
```

#### ValueProp（价值主张）
```
id, tenantId, title, statement(@db.Text), targetSegmentId(String?)
evidence(Json), differentiators(Json), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, targetSegmentId])
关联: targetSegment(ICPSegment?)
```

#### UseCase（使用场景）
```
id, tenantId, title, description(@db.Text), industry
problem(@db.Text), solution(@db.Text), outcomes(Json), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, industry])
```

#### Competitor（竞争对手）
```
id, tenantId, name, website(String?), description(@db.Text)
strengths(Json), weaknesses(Json), positioning(@db.Text), marketOverlap(Json)
metadata(Json), createdAt, updatedAt, deletedAt
@@unique([tenantId, name])
@@index([tenantId])
```

### Layer 2: Content（2 个）

#### KeywordCluster（关键词集群）
```
id, tenantId, name, primaryKeyword, secondaryKeywords(String[])
searchVolume(Int?), difficulty(Int?), intent(String), contentGap(@db.Text?)
metadata(Json), createdAt, updatedAt
@@index([tenantId]), @@index([tenantId, intent]), @@index([primaryKeyword])
关联: contentPieces[]
```

#### ContentPiece（统一内容对象）
```
id, tenantId, authorId, contentType(ContentType enum)
title, slug(String?), body(@db.Text), excerpt(@db.Text?)
targetPersonaId(String?), targetSegmentId(String?), keywordClusterId(String?)
publishedUrl(String?), status(ArtifactStatus @default(DRAFT))
publishedAt(DateTime?), scheduledAt(DateTime?), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, contentType]), @@index([tenantId, status])
@@index([authorId]), @@index([keywordClusterId]), @@index([targetSegmentId])
关联: author(User), targetPersona?, targetSegment?, keywordCluster?
```

> ContentPiece 与 SeoContent 并存，新类型内容（邮件模板、PR稿等）写入 ContentPiece，后续提供迁移脚本。

### Layer 3: Acquisition（3 个）

#### TargetAccount（目标企业）
```
id, tenantId, companyName, website(String?), industry(String?), country(String?), city(String?)
size(String?), description(@db.Text?), source(String), matchScore(Float?)
marketId(String?), icpSegmentId(String?)
researchData(Json), status(String @default("discovered")), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, status]), @@index([tenantId, country])
@@index([tenantId, industry]), @@index([icpSegmentId])
关联: market?, icpSegment?, leads[]
```

#### Touchpoint（触达记录）
```
id, tenantId, leadId, userId
channel(TouchpointChannel), direction(TouchpointDirection @default(OUTBOUND))
subject(String?), content(@db.Text?), sequenceId(String?), sequenceStep(Int?)
sentAt(DateTime?), openedAt(DateTime?), repliedAt(DateTime?)
status(String @default("draft")), metadata(Json)
createdAt, updatedAt
@@index([tenantId]), @@index([leadId]), @@index([userId])
@@index([sequenceId]), @@index([tenantId, status]), @@index([sentAt])
关联: lead(Lead), user(User), sequence?
```

#### Sequence（触达序列模板）
```
id, tenantId, name, description(@db.Text?), channel(TouchpointChannel)
steps(Json), status(String @default("draft")), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, status])
关联: touchpoints[]
```

### Layer 4: Collaboration（4 个）

#### FeedbackItem（反馈条目）
```
id, tenantId, entityType, entityId, authorId
content(@db.Text), type(FeedbackType), status(String @default("open"))
resolvedAt(DateTime?), resolvedById(String?)
parentId(String?) -- 自关联，支持回复线程
metadata(Json), createdAt, updatedAt
@@index([tenantId]), @@index([entityType, entityId])
@@index([authorId]), @@index([tenantId, status])
关联: author(User), resolvedBy(User?), parent?, replies[]
```

#### Task（工作任务）
```
id, tenantId, title, description(@db.Text?)
assigneeId(String?), creatorId, entityType(String?), entityId(String?)
priority(TaskPriority @default(MEDIUM)), status(TaskStatus @default(TODO))
dueAt(DateTime?), completedAt(DateTime?), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([assigneeId]), @@index([tenantId, status])
@@index([entityType, entityId]), @@index([dueAt])
关联: assignee(User?), creator(User)
```

#### Approval（审批工作流）
```
id, tenantId, entityType, entityId
requesterId, approverId(String?)
status(ApprovalStatus @default(PENDING))
requestNote(@db.Text?), comments(@db.Text?), decidedAt(DateTime?)
metadata(Json), createdAt, updatedAt
@@index([tenantId]), @@index([entityType, entityId])
@@index([requesterId]), @@index([approverId]), @@index([tenantId, status])
关联: requester(User), approver(User?)
```

#### Decision（战略决策）
```
id, tenantId, title, summary(@db.Text), context(@db.Text?)
recommendation(@db.Text), impact(Json)
status(DecisionStatus @default(PROPOSED))
decidedById(String?), decidedAt(DateTime?), metadata(Json)
createdAt, updatedAt, deletedAt
@@index([tenantId]), @@index([tenantId, status])
关联: decidedBy(User?)
```

### Cross-Cutting: Versioning（1 个）

#### ArtifactVersion（通用版本记录）
```
id, tenantId, entityType, entityId, version(Int)
snapshot(Json), changeDescription(@db.Text?)
generationParams(Json @default("{}")), sourceEvidence(Json @default("[]"))
authorId, status(ArtifactStatus @default(DRAFT)), metadata(Json)
createdAt(DateTime @default(now()))  -- 版本不可变，无 updatedAt
@@unique([tenantId, entityType, entityId, version])
@@index([tenantId]), @@index([entityType, entityId])
@@index([authorId]), @@index([status])
关联: author(User)
```

---

## 三、修改现有模型

### Lead — 新增 2 个可选外键
```diff
+ targetAccountId  String?
+ targetAccount    TargetAccount?  @relation(fields: [targetAccountId], references: [id], onDelete: SetNull)
+ personaId        String?
+ persona          Persona?        @relation(fields: [personaId], references: [id], onDelete: SetNull)
+ touchpoints      Touchpoint[]
+ @@index([targetAccountId])
```

### Activity — 增强为事件日志
```diff
+ eventCategory   EventCategory  @default(SYSTEM)
+ severity        EventSeverity  @default(INFO)
+ correlationId   String?
+ context         Json           @default("{}")
+ source          EventSource    @default(SYSTEM)
+ @@index([tenantId, eventCategory])
+ @@index([correlationId])
+ @@index([tenantId, severity])
```

> 所有新增字段均有默认值，现有数据自动填充，完全向后兼容。

### Tenant — 补充关联声明
新增 16 个关联字段（markets, icpSegments, personas, valueProps, useCases, competitors, keywordClusters, contentPieces, targetAccounts, touchpoints, sequences, feedbackItems, tasks, approvals, decisions, artifactVersions）。

### User — 补充关联声明
新增关联: contentPieces, touchpoints, createdTasks, assignedTasks, requestedApprovals, assignedApprovals, feedbackItems, resolvedFeedbackItems, artifactVersions, decisions。

---

## 四、迁移策略

**单次迁移**，命名 `add_canonical_objects`。

理由：
- 所有新增表无数据依赖，一次创建更干净
- Lead/Activity 的修改均为新增可选字段，安全
- 迁移失败可完整回滚

执行命令：
```bash
cd /Users/oceanlink/Documents/Qoder-1/temp_clone
npx prisma migrate dev --name add_canonical_objects
```

---

## 五、Seed 数据补充

在 `prisma/seed.ts` 中为 demo-company 租户添加：
- 3-5 个 Market（如 Germany, USA, Southeast Asia, Middle East, Japan）
- 2-3 个 ICPSegment（如 "European Mid-size Manufacturers", "US Large Enterprises"）
- 2-3 个 Persona（如 "Procurement Director", "Plant Manager"）
- 1-2 个 Competitor
- 1-2 个 KeywordCluster

---

## 六、验证步骤

1. **Schema 验证**: `npx prisma validate` — 确认语法正确
2. **迁移生成**: `npx prisma migrate dev --name add_canonical_objects` — 生成并执行迁移
3. **Client 生成**: `npx prisma generate` — 确认新模型类型可用
4. **构建验证**: `npx next build` — 确认无 TypeScript 编译错误（现有代码不引用新模型，应零影响）
5. **Seed 测试**: `npx prisma db seed` — 确认种子数据插入成功（需有数据库连接）

---

## 七、数据层次关系图

```
Tenant
├── Market (目标市场)
├── ICPSegment (客户画像细分)
│   ├── Persona (买家角色)
│   ├── ValueProp (价值主张)
│   └── TargetAccount.icpSegmentId
├── Competitor (竞争对手)
├── UseCase (使用场景)
├── KeywordCluster (关键词集群)
│   └── ContentPiece.keywordClusterId
├── ContentPiece (统一内容) → ArtifactVersion
├── TargetAccount (目标企业)
│   └── Lead (联系人)
│       └── Touchpoint (触达记录) → Sequence
├── FeedbackItem (反馈) ← 多态: entityType+entityId
├── Task (任务) ← 多态
├── Approval (审批) ← 多态
├── Decision (战略决策)
├── ArtifactVersion (版本) ← 多态
└── Activity (事件日志, 增强版) ← 多态
```
