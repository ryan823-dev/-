# 客户素材中心 (Client Asset Hub) — Step 1 实施方案

## 目标

构建素材中心基础层，支持：
- 文件直传阿里云 OSS（浏览器通过预签名 URL 直传）
- 元数据存储到 PostgreSQL
- 缩略图/预览生成（利用 OSS 图片处理能力）
- 分类、标签、搜索
- 网格/列表视图浏览

## 技术决策

| 决策点 | 选择 |
|--------|------|
| 文件存储 | 阿里云 OSS（私有 Bucket + 预签名 URL） |
| 元数据存储 | Prisma + PostgreSQL（与主应用一致） |
| 缩略图 | OSS 原生图片/视频处理，零额外存储 |
| 架构位置 | 主 Next.js 应用内（非 Express 知识引擎） |

## 数据流

```
浏览器选择文件 → Server Action 生成预签名 URL → 浏览器直传 OSS → 确认上传完成
      ↓                    ↓                         ↓              ↓
   前端校验          PostgreSQL 创建记录        OSS 存储文件    更新状态为 active
                    (status=uploading)
```

---

## 实施步骤

### Phase 1: 基础设施（无 UI）

#### 1.1 安装依赖
```bash
npm install ali-oss
npm install -D @types/ali-oss
```

#### 1.2 数据库模型 — `prisma/schema.prisma`

在 `Tenant` 模型后追加：

```prisma
// ==================== MODULE 5: ASSET HUB ====================

model AssetFolder {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  parentId    String?
  parent      AssetFolder?  @relation("FolderTree", fields: [parentId], references: [id])
  children    AssetFolder[] @relation("FolderTree")
  color       String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  assets Asset[]

  @@unique([tenantId, name, parentId])
  @@index([tenantId])
  @@index([parentId])
}

model Asset {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  folderId     String?
  folder       AssetFolder? @relation(fields: [folderId], references: [id])

  // 文件信息
  originalName String
  storageKey   String
  mimeType     String
  fileSize     BigInt
  extension    String

  // 分类
  fileCategory String   // video | image | document | audio | other
  purpose      String[] // knowledge | marketing | reference
  tags         String[]

  // 内容
  title       String
  description String?
  metadata    Json     @default("{}")

  // 状态
  status    String    @default("uploading") // uploading | active | archived | deleted
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([tenantId])
  @@index([tenantId, fileCategory])
  @@index([tenantId, status])
  @@index([folderId])
  @@index([uploadedById])
  @@index([createdAt])
}
```

同时在 `Tenant` 模型追加关联：
```prisma
assetFolders AssetFolder[]
assets       Asset[]
```

在 `User` 模型追加关联：
```prisma
assets Asset[]
```

#### 1.3 OSS 封装 — `src/lib/oss.ts`

```typescript
// 核心函数
- generateStorageKey(tenantId, originalName) → tenants/{tenantId}/assets/{YYYY}/{MM}/{uuid}.{ext}
- generatePresignedPutUrl(storageKey, mimeType, fileSize) → 1小时有效的上传 URL
- generatePresignedGetUrl(storageKey, expiresSeconds?) → 7天有效的访问 URL
- getThumbnailUrl(storageKey, fileCategory, mimeType) → OSS 图片处理 URL
- deleteObject(storageKey)
```

环境变量（`.env.local`）：
```
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
```

#### 1.4 类型定义 — `src/types/assets.ts`

```typescript
export type FileCategory = "video" | "image" | "document" | "audio" | "other"
export type AssetStatus = "uploading" | "active" | "archived" | "deleted"
export type AssetPurpose = "knowledge" | "marketing" | "reference"
export type AssetUploadSession = { assetId: string; presignedUrl: string; storageKey: string }
export type AssetFilters = { search?: string; fileCategory?: FileCategory; folderId?: string; ... }
```

#### 1.5 工具函数 — `src/lib/utils/file-utils.ts`

```typescript
- detectFileCategory(mimeType, extension) → FileCategory
- formatFileSize(bytes) → "1.2 GB"
- getFileCategoryLabel(category) → "视频"
- getFileCategoryIcon(category) → Lucide 图标组件
```

#### 1.6 Server Actions — `src/actions/assets.ts`

```typescript
"use server"

// 上传流程
- createAssetUploadSession(files[]) → AssetUploadSession[] // 批量创建，返回预签名 URL
- confirmAssetUpload(assetId, metadata?) → Asset // 确认上传完成
- abortAssetUpload(assetId) → void // 中断上传

// 文件夹
- getFolders() → AssetFolder[]
- createFolder(data) → AssetFolder
- updateFolder(id, data) → AssetFolder
- deleteFolder(id) → void

// 资产 CRUD
- getAssets(filters, pagination, sort) → { items, total }
- getAsset(id) → Asset (含 presigned GET URL)
- updateAsset(id, data) → Asset
- deleteAssets(ids[]) → void // 软删除
- moveAssets(ids[], targetFolderId) → void

// 统计
- getAssetStats() → { total, byCategory, totalSize }
```

---

### Phase 2: 上传核心

#### 2.1 上传进度组件 — `src/components/assets/upload-progress.tsx`
- 单文件进度条
- 状态颜色：上传中=蓝、完成=绿、失败=红

#### 2.2 上传区域 — `src/components/assets/asset-upload-zone.tsx`
- 拖拽上传 + 点击选择
- 多文件支持（批次 ≤20 个，单文件 ≤4GB）
- XMLHttpRequest 直传 OSS（支持 onprogress）
- 并发控制（最多 3 个同时上传）
- 状态机：idle → requesting-urls → uploading → confirming → done

---

### Phase 3: 浏览 UI

#### 3.1 缩略图 — `src/components/assets/asset-thumbnail.tsx`
- 图片/视频：OSS 图片处理 URL
- 文档/其他：Lucide 图标占位

#### 3.2 网格卡片 — `src/components/assets/asset-card.tsx`
- 缩略图（4:3）+ 文件名 + 大小 + 类型 Badge
- 多选 Checkbox + 操作菜单

#### 3.3 列表行 — `src/components/assets/asset-list-row.tsx`
- 列：Checkbox | 缩略图 | 文件名 | 类型 | 大小 | 文件夹 | 时间 | 操作

#### 3.4 筛选器 — `src/components/assets/asset-filters.tsx`
- 文件类型 Tabs
- 关键词搜索（防抖 300ms）
- 日期范围

#### 3.5 批量操作栏 — `src/components/assets/asset-toolbar.tsx`
- 移动 | 标记目的 | 添加标签 | 删除

#### 3.6 文件夹树 — `src/components/assets/folder-tree.tsx`
- 两级目录结构
- 新建/重命名/删除操作

#### 3.7 详情面板 — `src/components/assets/asset-detail-panel.tsx`
- Shadcn Sheet（右侧抽屉）
- 大尺寸预览 + 可编辑字段

#### 3.8 统计栏 — `src/components/assets/asset-stats-bar.tsx`
- 总文件数 | 总大小 | 类型分布

---

### Phase 4: 页面组装

#### 4.1 主页面 — `src/app/[locale]/(dashboard)/assets/page.tsx`

布局：
```
┌────────────────────────────────────────────────┐
│ PageHeader "客户素材中心"      [上传素材 按钮] │
├────────────────────────────────────────────────┤
│ AssetStatsBar                                  │
├──────────────┬─────────────────────────────────┤
│ FolderTree   │ AssetFilters + ViewToggle       │
│ (250px)      │ AssetToolbar（选中时显示）      │
│              ├─────────────────────────────────┤
│              │ AssetGrid / AssetList           │
│              │ (分页 48/页)                    │
└──────────────┴─────────────────────────────────┘
```

#### 4.2 侧边栏 — `src/components/layout/app-sidebar.tsx`

在 `products` 组之前插入：
```typescript
{
  key: "assets",
  label: t("assets"),
  icon: FolderOpen,  // 或 ImageIcon
  items: [
    { title: t("assetAll"), url: "/zh-CN/assets", icon: LayoutGrid },
  ],
}
```

#### 4.3 i18n — `src/i18n/locales/zh-CN.json` + `en.json`

追加翻译 key：`assets`, `assetAll`, 以及所有 UI 文案

---

## 关键文件清单

| 文件 | 说明 |
|------|------|
| `prisma/schema.prisma` | 追加 AssetFolder + Asset 模型 |
| `src/lib/oss.ts` | OSS 客户端封装（核心） |
| `src/types/assets.ts` | TypeScript 类型定义 |
| `src/lib/utils/file-utils.ts` | 文件工具函数 |
| `src/actions/assets.ts` | 所有 Server Actions |
| `src/components/assets/asset-upload-zone.tsx` | 上传组件（最复杂） |
| `src/components/assets/asset-thumbnail.tsx` | 缩略图组件 |
| `src/components/assets/asset-card.tsx` | 网格卡片 |
| `src/components/assets/asset-detail-panel.tsx` | 详情抽屉 |
| `src/app/[locale]/(dashboard)/assets/page.tsx` | 主页面 |
| `src/components/layout/app-sidebar.tsx` | 追加导航项 |

---

## 验证方案

1. **Phase 1 验证**
   - `prisma migrate dev` 成功
   - TypeScript 编译无错误
   - Prisma Studio 可见新表

2. **Phase 2 验证**
   - 上传一个图片 + 一个视频到 OSS
   - OSS 控制台确认文件存在
   - 数据库 Asset 记录 status = "active"

3. **Phase 3-4 验证**
   - 浏览器访问 `/zh-CN/assets`
   - 上传文件 → 刷新后可见
   - 筛选/搜索/分页正常
   - 详情面板可打开
   - 视频可内联播放

---

## Step 2 接口预留

- `Asset.metadata` — 预留 AI 分析结果字段（transcript, summary）
- `Asset.purpose` 含 `"knowledge"` — 供知识引擎筛选
- `Asset.storageKey` — 可直接传给知识引擎处理
