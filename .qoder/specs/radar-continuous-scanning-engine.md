# 24/7 持续雷达扫描引擎 - 实施方案

## 概述

将现有一次性搜索雷达升级为持续增量扫描系统。核心改动：在 `RadarSearchProfile` 上添加调度/锁字段，新增 `RadarScanCursor` 模型存储每个 Profile×Source 的游标状态，构建 Scheduler + ScanEngine + 4 个 Cron Routes。

---

## 架构总览

```
Vercel Cron (每5分钟)
  → GET /api/cron/radar-scan
    → RadarScheduler (scan-scheduler.ts)
      1. 查询 nextRunAt <= now 的 RadarSearchProfile
      2. 乐观锁争抢 (lockToken CAS)
      3. 对每个 Profile × Source:
        → IncrementalScanEngine (scan-engine.ts)
          1. 读 RadarScanCursor (profileId + sourceId)
          2. 注入 cursor 到 adapter.search()
          3. 预算循环 (maxRunSeconds)
          4. upsert 去重候选
          5. 写回新 cursorState
      4. 释放锁, 更新 nextRunAt

独立 Cron:
  radar-qualify  (每15分钟) → 批量 AI 合格化 NEW 候选
  radar-enrich   (每小时)   → getDetails() 补全 ENRICHING 候选
  radar-cleanup  (每日)     → TTL 清理 + 死锁释放
```

---

## 总负责人审阅补充条款 (A-F)

以下 6 条已全部纳入对应 Phase 的实现细节中，作为强制约束。

### 条款 A: 锁归属校验 — 防止游标回退/重复写入

1. **scan-engine 内部 lockToken 校验**: `runIncrementalScan()` 每次写 cursor/candidates 前，
   先查 `RadarSearchProfile.lockToken === myToken`，若不匹配立即中止（说明锁已被抢走）。
2. **释放锁用 lockToken 条件更新**:
   ```typescript
   await prisma.radarSearchProfile.updateMany({
     where: { id: profileId, lockToken: myToken },  // 条件释放
     data: { lockToken: null, lockedAt: null, lockedBy: null, lastRunAt: new Date(), nextRunAt }
   });
   ```
   若 count === 0 说明锁已不归自己，跳过后续更新。

### 条款 B: Candidate 去重键 — 三元组唯一约束

现有 schema 的 `@@unique([sourceId, externalId])` 已经保证不同 source 的 externalId 不冲突。
但为安全起见，scan-engine 的 upsert 写法必须显式使用复合键:
```typescript
await prisma.radarCandidate.upsert({
  where: { sourceId_externalId: { sourceId, externalId: item.externalId } },
  create: { tenantId, sourceId, externalId, profileId, ... },
  update: { updatedAt: new Date() }  // 仅更新时间戳, 不覆盖已有数据
});
```

### 条款 C: Time-Skew Buffer — 防止边界条目丢失

当 `isExhausted = true` 时，重置游标不用 `since = now`，改为:
```typescript
cursor.since = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 回退10分钟
cursor.nextPage = 0;
cursor.exhausted = true;
```
配合 upsert 去重，重叠的10分钟内条目会被 unique key 自动跳过，不会产生重复。

### 条款 D: qualify 按 profileId 分组 — 使用正确的 TargetingSpec

radar-qualify cron 的分组逻辑改为:
```typescript
// 查询时带上 profileId
const candidates = await prisma.radarCandidate.findMany({
  where: { status: 'NEW', profileId: { not: null }, createdAt: { gt: twentyFourHoursAgo } },
  take: 50,
  orderBy: { createdAt: 'asc' }
});

// 按 profileId 分组
const grouped = groupBy(candidates, 'profileId');

for (const [profileId, batch] of Object.entries(grouped)) {
  const profile = await prisma.radarSearchProfile.findUnique({ where: { id: profileId } });
  // 用该 profile 关联的 segmentId 加载 TargetingSpec
  // 用该 profile 的 exclusionRules 过滤
  await executeSkill(RADAR_QUALIFY_ACCOUNTS, { ... });
}
```

### 条款 E: ENRICHING 触发条件 — 避免无意义 enrich

只在以下条件同时满足时将 candidate 标记为 ENRICHING:
1. qualifyTier 为 'A' 或 'B'（C 级不值得消耗 API 配额）
2. 候选缺少关键字段: `!phone && !website`（或 opportunity 缺 buyerName 的官网）
3. 对应 source 的 adapter `supportsDetails === true`
4. source.storagePolicy !== 'ID_ONLY'（ID_ONLY 模式禁止缓存详情）

enrich cron 同样加预算控制: `maxRunSeconds = 50`，每批 `limit = 20`。

### 条款 F: 所有 Cron 硬超时保护

| Cron Route | maxRunSeconds | maxItems/Batch | deadline 检查 |
|-----------|--------------|----------------|--------------|
| radar-scan | 45 (Profile.maxRunSeconds) | 由 adapter 决定 | 每次 adapter.search() 前检查 |
| radar-qualify | 50 | 50 candidates | 每批 skill 调用前检查 |
| radar-enrich | 50 | 20 candidates | 每条 getDetails() 前检查 |
| radar-cleanup | 55 | 无限制 (deleteMany) | 无需 (单次操作) |

实现模式（统一）:
```typescript
const deadline = Date.now() + maxRunSeconds * 1000;
for (const item of batch) {
  if (Date.now() >= deadline) { results.push({ skipped: 'timeout' }); break; }
  // ... process item
}
```

---

## Phase 0: Schema 迁移

### 文件: `prisma/schema.prisma`

#### 0.1 扩展 `RadarSearchProfile` (第1316行起)

新增字段:
```prisma
  // === 调度引擎 ===
  nextRunAt       DateTime?          // 预计算下次运行时间 (索引查询)
  lockToken       String?            // 乐观锁 UUID
  lockedAt        DateTime?          // 锁定时间 (5分钟超时释放)
  lockedBy        String?            // 实例标识
  maxRunSeconds   Int      @default(45) // 单次预算 (留15s给Vercel 60s timeout)
  autoQualify     Boolean  @default(true)
  autoEnrich      Boolean  @default(false)
  runStats        Json?              // { totalRuns, totalNew, lastError, avgDurationMs }
  exclusionRules  Json?              // 从 rejected 反向学习的排除词
```

更新索引:
```prisma
  @@index([isActive, nextRunAt])  // 替换原 [tenantId, isActive]
  @@index([tenantId, isActive])   // 保留
```

#### 0.2 新增 `RadarScanCursor` 模型

```prisma
model RadarScanCursor {
  id          String   @id @default(cuid())
  profileId   String
  sourceId    String
  cursorState Json     // { nextPage, nextPageToken, since, queryIndex, exhausted }
  lastScanAt  DateTime?
  scanCount   Int      @default(0)
  totalFetched Int     @default(0)
  totalNew    Int      @default(0)
  lastError   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([profileId, sourceId])
  @@index([profileId])
}
```

#### 0.3 扩展 `CandidateStatus` 枚举

```prisma
enum CandidateStatus {
  NEW
  REVIEWING
  QUALIFIED
  IMPORTED
  EXCLUDED
  EXPIRED
  ENRICHING    // 新增: 等待 getDetails() 补全
}
```

#### 0.4 扩展 `RadarCandidate`

新增字段:
```prisma
  profileId    String?    // 触发该候选的 SearchProfile
  publishedAt  DateTime?  // 招标发布时间
  enrichedAt   DateTime?  // 详情补全完成时间
```

### 迁移文件: `prisma/migrations/YYYYMMDD_radar_continuous_scan/migration.sql`

运行 `npx prisma migrate dev --name radar_continuous_scan`

---

## Phase 1: 适配器接口扩展

### 文件: `src/lib/radar/adapters/types.ts`

#### 1.1 扩展 `RadarSearchQuery`

```typescript
// 新增字段 (向后兼容, 都是可选):
cursor?: {
  nextPage?: number;
  nextPageToken?: string;
  since?: string;        // ISO8601
  queryIndex?: number;
};
maxResults?: number;     // 本次最多抓取条数
```

#### 1.2 扩展 `RadarSearchResult`

```typescript
// 新增字段:
nextCursor?: {
  nextPage?: number;
  nextPageToken?: string;
  since?: string;
  queryIndex?: number;
};
isExhausted?: boolean;   // 该查询维度已无更多数据
```

#### 1.3 适配器 search() 兼容改造

每个适配器在 `search()` 中读取 `query.cursor`，返回 `nextCursor`:

| 适配器 | cursor 字段 | 增量策略 |
|--------|-----------|---------|
| `ungm.ts` | cursor.since → publishedAfter, cursor.nextPage → page | 时间增量 + 分页 |
| `ted.ts` | cursor.since → publishedAfter, cursor.nextPage → page | 时间增量 + 分页 |
| `google-places.ts` | cursor.nextPageToken → Google token | 原生 token |
| `brave-search.ts` | cursor.queryIndex → 第N个关键词组 | 多查询轮询 |
| `ai-search.ts` | cursor.queryIndex → 第N个关键词组 | 多查询轮询 |

修改文件:
- `src/lib/radar/adapters/ungm.ts` - search() 读取/返回 cursor
- `src/lib/radar/adapters/ted.ts` - search() 读取/返回 cursor
- `src/lib/radar/adapters/google-places.ts` - search() 读取/返回 cursor
- `src/lib/radar/adapters/brave-search.ts` - search() 读取/返回 cursor
- `src/lib/radar/adapters/ai-search.ts` - search() 读取/返回 cursor

---

## Phase 2: 核心扫描引擎

### 新文件: `src/lib/radar/scan-engine.ts`

```typescript
export interface ScanOptions {
  maxRunSeconds: number;    // 默认 45
  maxResults?: number;      // 可选上限
}

export interface ScanResult {
  fetched: number;
  created: number;
  duplicates: number;
  errors: string[];
  duration: number;
  cursorAdvanced: boolean;
  exhausted: boolean;
}

export async function runIncrementalScan(
  profileId: string,
  sourceId: string,
  options: ScanOptions
): Promise<ScanResult>
```

核心逻辑:
1. 读取 `RadarScanCursor` (profileId + sourceId), 不存在则初始化
2. 从 `RadarSearchProfile` 读取 keywords/targetCountries/categoryFilters
3. 从 `exclusionRules` 构建 negativeKeywords
4. 时间预算循环: `while (Date.now() < deadline && !exhausted)`
   - `adapter.search(query with cursor)`
   - 批量 `upsert` 候选 (用 sourceId_externalId 唯一键, 避免竞态)
   - 更新 cursor = result.nextCursor
   - 若 result.isExhausted: 重置 cursor.since = now, nextPage = 0
   - sleep(rateLimit delay)
5. 写回 `RadarScanCursor` (upsert by profileId+sourceId)
6. 每次扫描同时创建 `RadarTask` 记录 (triggeredBy: 'scheduler') 用于审计

关键改进 vs sync-service.ts:
- `upsert` 替代 findUnique+create (避免竞态)
- 时间预算控制 (不是页数上限)
- 游标持久化 (下次从上次位置继续)
- 写入 profileId 到 RadarCandidate

---

## Phase 3: 调度器

### 新文件: `src/lib/radar/scan-scheduler.ts`

```typescript
export interface SchedulerResult {
  profilesProcessed: number;
  totalNew: number;
  totalDuplicates: number;
  totalDuration: number;
  profiles: Array<{
    profileId: string;
    name: string;
    sources: Array<{ sourceId: string; result: ScanResult }>;
  }>;
  errors: string[];
}

export async function runScheduledScans(): Promise<SchedulerResult>
```

核心逻辑:
1. 查询到期 Profile:
   ```sql
   WHERE isActive = true AND nextRunAt <= now()
   ORDER BY nextRunAt ASC
   LIMIT 3
   ```
2. 乐观锁争抢 (对每个 Profile):
   ```typescript
   const result = await prisma.radarSearchProfile.updateMany({
     where: {
       id: profileId,
       OR: [
         { lockToken: null },
         { lockedAt: { lt: fiveMinutesAgo } }  // 死锁超时
       ]
     },
     data: {
       lockToken: crypto.randomUUID(),
       lockedAt: new Date(),
       lockedBy: `${process.env.VERCEL_REGION || 'local'}_${Date.now()}`
     }
   });
   if (result.count === 0) continue; // 被其他实例抢走
   ```
3. 获锁成功 → 解析 sourceIds → 逐个调用 `runIncrementalScan()`
4. 完成后释放锁 + 更新:
   - `lockToken = null, lockedAt = null`
   - `lastRunAt = now`
   - `nextRunAt = 用 cron-parser 计算下次时间`
   - `runStats` 累加

依赖: `cron-parser` npm 包 (解析 cron 表达式计算 nextRunAt)

---

## Phase 4: Cron Routes

### 4.1 新文件: `src/app/api/cron/radar-scan/route.ts`

- 每5分钟触发
- 验证 `CRON_SECRET`
- 调用 `runScheduledScans()`
- 返回 JSON 统计

### 4.2 新文件: `src/app/api/cron/radar-qualify/route.ts`

- 每15分钟触发
- 查询 `status=NEW, createdAt > 24h ago, limit 50` 按 tenantId 分组
- 对每组: 加载最新 TargetingSpec → 调用 `executeSkill(RADAR_QUALIFY_ACCOUNTS, ...)`
- 根据输出更新: qualified → QUALIFIED + qualifyTier; rejected → EXCLUDED + qualifyReason
- Tier A/B + missing data → status=ENRICHING
- Feedback loop: rejected exclusionReason → append 到 Profile.exclusionRules

### 4.3 新文件: `src/app/api/cron/radar-enrich/route.ts`

- 每小时触发
- 查询 `status=ENRICHING, limit 20` 按 sourceId 分组
- 对每条: `adapter.getDetails(externalId)` → upsert 详情字段
- 更新 `status=QUALIFIED, enrichedAt=now`

### 4.4 新文件: `src/app/api/cron/radar-cleanup/route.ts`

- 每日凌晨2点触发
- 调用现有 `cleanupExpiredCandidates()`
- 释放死锁: `UPDATE RadarSearchProfile SET lockToken=null WHERE lockedAt < now-1hour`

### 4.5 Vercel Cron 配置: `vercel.json` (项目根目录新建)

```json
{
  "crons": [
    { "path": "/api/cron/radar-scan", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/radar-qualify", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/radar-enrich", "schedule": "0 * * * *" },
    { "path": "/api/cron/radar-cleanup", "schedule": "0 2 * * *" },
    { "path": "/api/cron/push-timeout", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/publish-scheduled", "schedule": "*/5 * * * *" }
  ]
}
```

---

## Phase 5: GenericFeedAdapter

### 新文件: `src/lib/radar/adapters/generic-feed.ts`

RSS/JSON 通用 Feed 适配器:
- 支持 RSS 2.0 / Atom / 自定义 JSON Feed
- `adapterConfig` 指定: feedUrl, feedType (rss|json), fieldMapping
- 通过 `cursor.since` 时间过滤 (只取比上次更新时间新的条目)
- 每次返回 `isExhausted: true` (Feed 本身最新 N 条)
- 解析 `<item>` 或 JSON 数组 → `NormalizedCandidate`

### 修改文件: `src/lib/radar/adapters/registry.ts`

注册 `generic_feed` 适配器, code='generic_feed'

---

## Phase 6: Feedback Loop

在 `radar-qualify` cron 中实现:
1. rejected candidates 的 `qualifyReason` → 提取关键词
2. Append 到 `RadarSearchProfile.exclusionRules` JSON 数组
3. `scan-engine.ts` 的 `buildQuery()` 读取 exclusionRules → 注入 negativeKeywords

---

## 完整文件变更清单

### 新增 (8个文件)

| 文件 | 用途 |
|------|------|
| `prisma/migrations/..._radar_continuous_scan/migration.sql` | Schema 迁移 |
| `src/lib/radar/scan-engine.ts` | 增量扫描引擎 |
| `src/lib/radar/scan-scheduler.ts` | 调度器 + 乐观锁 |
| `src/lib/radar/adapters/generic-feed.ts` | RSS/JSON Feed 适配器 |
| `src/app/api/cron/radar-scan/route.ts` | 扫描 Cron |
| `src/app/api/cron/radar-qualify/route.ts` | AI 合格化 Cron |
| `src/app/api/cron/radar-enrich/route.ts` | 详情补全 Cron |
| `src/app/api/cron/radar-cleanup/route.ts` | 清理 Cron |

### 修改 (8个文件)

| 文件 | 变更 |
|------|------|
| `prisma/schema.prisma` | 新增 RadarScanCursor, 扩展 RadarSearchProfile/CandidateStatus/RadarCandidate |
| `src/lib/radar/adapters/types.ts` | RadarSearchQuery 增 cursor/maxResults, RadarSearchResult 增 nextCursor/isExhausted |
| `src/lib/radar/adapters/registry.ts` | 注册 generic_feed |
| `src/lib/radar/adapters/ungm.ts` | search() 支持 cursor |
| `src/lib/radar/adapters/ted.ts` | search() 支持 cursor |
| `src/lib/radar/adapters/google-places.ts` | search() 支持 cursor |
| `src/lib/radar/adapters/brave-search.ts` | search() 支持 cursor |
| `src/lib/radar/adapters/ai-search.ts` | search() 支持 cursor |
| `vercel.json` | 新建, 注册 6 个 cron jobs |

### 新增依赖

- `cron-parser` - 解析 cron 表达式计算 nextRunAt

---

## 关键架构决策

| 决策 | 选择 | 理由 |
|------|------|------|
| cursorState 存放位置 | 独立 RadarScanCursor 模型 | Profile × Source 笛卡尔积, 独立模型可原子更新 |
| 锁机制 | 乐观锁 (lockToken CAS) | Vercel Serverless 无法持有长事务 |
| auto-qualify 时机 | 独立 Cron (15min) | AI 调用耗时 5-30s, 与扫描解耦避免超时 |
| nextRunAt | 预计算写入 DB | 索引查询 O(1), 无需运行时解析所有 cron 表达式 |
| 向后兼容 | 保留 runRadarTask + createRadarTask | one-shot 手动任务不受影响 |

---

## 验证步骤

### Phase 0 验证
```bash
npx prisma migrate dev --name radar_continuous_scan
npx prisma generate
# 确认 TypeScript 编译无报错
npx tsc --noEmit
```

### Phase 1-2 验证
```bash
# 构建成功
npm run build
# scan-engine 单元逻辑: mock adapter 验证预算截断
```

### Phase 3-4 验证
```bash
# 手动触发 cron (本地开发):
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/radar-scan
# 预期: 返回 JSON { profilesProcessed: 0 } (无激活 profile 时)

# 创建测试 Profile 后再次触发:
# 预期: profilesProcessed > 0, 候选写入 RadarCandidate 表
```

### 端到端验证
1. 创建 RadarSearchProfile (isActive=true, scheduleRule="*/5 * * * *", sourceIds 含 ted/ungm)
2. 手动设置 nextRunAt = 5分钟前
3. 触发 radar-scan cron → 确认候选入库
4. 触发 radar-qualify cron → 确认 NEW → QUALIFIED/EXCLUDED
5. 检查 RadarScanCursor 游标已推进
6. 再次触发 radar-scan → 确认从上次位置继续 (不重复)

### 持续有效验收标准 (5 条硬指标)

| # | 验收项 | 验证方法 | 通过标准 |
|---|--------|---------|---------|
| 1 | **增量有效 + 去重有效** | 同一 profile 连续跑 3 次 scan | NEW created 数逐步下降 |
| 2 | **游标推进可观测** | 查询 RadarScanCursor 表 | scanCount 递增, cursorState.since/nextPage 变化 |
| 3 | **exclusionRules 生效** | 第2次 scan 后检查 duplicates/excluded 数 | 噪声占比下降, excluded 上升 |
| 4 | **Tier A/B 占比提升** | 对比前后两轮 qualify 的 tier 分布 | A/B 占比 ≥ 前一轮 (哪怕+5%) |
| 5 | **超时保护** | 极端场景 (大量数据/慢 API) | scan/qualify/enrich 均在 60s 内返回, 无死锁残留 |
