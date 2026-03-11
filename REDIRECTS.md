# Machrio 301 重定向配置文档

## 概述

此文档说明 Machrio 网站的 301 重定向配置，用于处理分类路径重命名导致的 404 错误。

## 配置文件

重定向规则配置在 `next.config.ts` 中的 `redirects()` 函数内。

## 当前配置分类

### 1. L1 分类重定向（14 个主要分类）

处理主要分类的常见变体：

| 旧路径 | 新路径 |
|--------|--------|
| `/category/adhesives-tapes` | `/category/adhesives-sealants-and-tape` |
| `/category/safety-equipment` | `/category/safety` |
| `/category/materials-handling` | `/category/material-handling` |
| `/category/packaging-shipping-supplies` | `/category/packaging-shipping` |
| ... | ... |

### 2. L2 分类重定向（37 个子分类）

处理二级分类的常见变体：

| 旧路径 | 新路径 |
|--------|--------|
| `/category/hand-protection` | `/category/hand-arm-protection` |
| `/category/gloves` | `/category/hand-arm-protection` |
| `/category/casters` | `/category/casters-wheels` |
| `/category/hose-fittings` | `/category/hose-hose-fittings-hose-reels` |
| ... | ... |

### 3. L3 分类重定向（51 个产品分类）

处理三级分类的常见变体：

| 旧路径 | 新路径 |
|--------|--------|
| `/category/gloves` | `/category/safety-gloves` |
| `/category/work-gloves` | `/category/safety-gloves` |
| `/category/bump-cap` | `/category/bump-caps` |
| `/category/hose-reel` | `/category/hose-reels` |
| ... | ... |

### 4. 通用路径重定向

处理常见的旧路径格式：

| 旧路径 | 新路径 |
|--------|--------|
| `/products` | `/category/safety` |
| `/c/:slug` | `/category/:slug` |
| `/shop/:path*` | `/category/:path*` |
| `/catalog/:path*` | `/category/:path*` |
| `/category/:slug.html` | `/category/:slug` |

## 产品级别重定向

### 待处理

由于您提到有 1500+ 产品分类路径被重命名，但需要具体的旧路径到新路径的映射。

### 如何添加产品重定向

1. **从 Google Search Console 导出 404 报告**
   - 登录 Google Search Console
   - 进入 "页面" > "未找到 (404)"
   - 导出 CSV 报告

2. **创建映射文件**
   创建 `scripts/redirect-mapping.json`:
   ```json
   [
     {
       "oldPath": "/product/old-category/product-slug",
       "newPath": "/product/new-category/product-slug"
     }
   ]
   ```

3. **运行生成脚本**
   ```bash
   npx tsx scripts/generate-product-redirects.ts
   ```

4. **更新 next.config.ts**
   将生成的规则添加到 `redirects()` 函数中。

## 验证重定向

### 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试重定向（使用 curl）
curl -I http://localhost:3000/category/safety-equipment
# 应该返回 308 重定向到 /category/safety
```

### 生产环境测试

```bash
# 测试生产环境重定向
curl -I https://machrio.com/category/safety-equipment
```

## 监控

### 检查重定向效果

1. **Google Search Console**
   - 监控 404 错误数量是否减少
   - 检查覆盖率报告

2. **服务器日志**
   - 检查是否有剩余的 404 错误
   - 识别需要添加的新重定向

## 维护

### 添加新的重定向规则

1. 编辑 `next.config.ts`
2. 在 `redirects()` 函数中添加规则：
   ```typescript
   { source: '/category/old-slug', destination: '/category/new-slug', permanent: true }
   ```
3. 重新部署网站

### 批量添加重定向

如果有大量重定向需要添加：

1. 创建映射文件 `redirects-batch.json`
2. 使用脚本生成配置
3. 合并到 `next.config.ts`

## 统计

- **当前分类重定向规则**: 约 200+ 条
- **L1 分类**: 14 个
- **L2 分类**: 37 个
- **L3 分类**: 51 个
- **通用规则**: 10 条

## 注意事项

1. **permanent: true** 表示 301 永久重定向，会被搜索引擎缓存
2. **:path*** 通配符用于匹配子路径
3. **:slug** 动态参数用于匹配不同的分类/产品
4. 重定向规则按顺序匹配，第一个匹配的生效

## 联系

如有问题或需要添加新的重定向规则，请联系开发团队。
