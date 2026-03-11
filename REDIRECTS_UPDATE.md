# Machrio 301 重定向更新 - 基于 Google Search Console 404 报告

## 更新日期
2026-03-10

## 更新内容

基于 Google Search Console 中的 404 错误报告，添加了以下产品页面和分类页面的 301 重定向规则。

## 新增产品页面重定向 (18 条)

| 旧分类路径 | 新分类路径 | 示例 404 URL |
|------------|------------|--------------|
| `/product/welding-protection/*` | `/product/welding-protective-clothing/*` | welding-apron |
| `/product/cable-ties-wire-accessories/*` | `/product/wire-cable-management/*` | heat-shrink-tubing |
| `/product/tape/*` | `/product/adhesives-sealants-and-tape/*` | acrylic-foam-tape |
| `/product/hand-protection/*` | `/product/hand-arm-protection/*` | low-temperature-gloves |
| `/product/hand-and-arm-protection/*` | `/product/hand-arm-protection/*` | heat-resistant-gloves |
| `/product/storage-shelving/*` | `/product/tool-storage/*` | drawer-type-parts-box |
| `/product/entrance-mats-floor-safety/*` | `/product/floor-mats/*` | acrylic-safety-sign |
| `/product/valves-hose-fittings/*` | `/product/pipe-hose-tube-fittings/*` | pvc-u-drainage-joint |
| `/product/air-filters/*` | `/product/hvac-and-refrigeration/*` | air-purifier-filter |
| `/product/slings-rigging/*` | `/product/lifting-pulling-positioning/*` | flexible-nylon-sling |
| `/product/first-aid-kits/*` | `/product/first-aid-wound-care/*` | medical-first-aid-kit |
| `/product/carts-trucks/*` | `/product/material-handling/*` | pure-copper-braided-strap |
| `/product/transporting/*` | `/product/material-handling/*` | tool-cart-accessory |
| `/product/gears-gear-drives/*` | `/product/power-transmission/*` | carbon-steel-washer |
| `/product/work-platforms/*` | `/product/ladders-platforms-personnel-lifts/*` | platform-truck |
| `/product/hearing-protection/*` | `/product/safety/*` | foam-corded-earplugs |
| `/product/linen-carts/*` | `/product/cleaning-and-janitorial/*` | (分类页面) |
| `/product/task-jobsite-lighting/*` | `/product/lighting/*` | (分类页面) |

## 新增分类页面重定向 (2 条)

| 旧分类路径 | 新分类路径 |
|------------|------------|
| `/category/linen-carts` | `/category/cleaning-and-janitorial` |
| `/category/task-jobsite-lighting` | `/category/lighting` |

## 修复的 404 URL 示例

以下是 Google Search Console 中报告的已修复 404 URL：

1. ✅ `https://machrio.com/product/welding-protection/cowhide-welding-apron...`
2. ✅ `https://machrio.com/product/cable-ties-wire-accessories/heat-shrink-tubing...`
3. ✅ `https://machrio.com/product/tape/primerless-acrylic-foam-tape...`
4. ✅ `https://machrio.com/product/hand-protection/low-temperature-gloves...`
5. ✅ `https://machrio.com/product/storage-shelving/drawer-type-parts-box...`
6. ✅ `https://machrio.com/product/entrance-mats-floor-safety/acrylic-safety-sign...`
7. ✅ `https://machrio.com/product/valves-hose-fittings/pvc-u-drainage...`
8. ✅ `https://machrio.com/product/hand-and-arm-protection/180-f-heat-resistant...`
9. ✅ `https://machrio.com/product/air-filters/air-purifier-filter-cartridge...`
10. ✅ `https://machrio.com/product/slings-rigging/flexible-nylon-sling...`
11. ✅ `https://machrio.com/product/first-aid-kits/medical-first-aid-kit...`
12. ✅ `https://machrio.com/product/carts-trucks/pure-copper-braided-strap...`
13. ✅ `https://machrio.com/product/transporting/tool-cart-accessory-partition...`
14. ✅ `https://machrio.com/product/gears-gear-drives/carbon-steel-washer...`
15. ✅ `https://machrio.com/product/work-platforms/platform-truck...`
16. ✅ `https://machrio.com/product/cable-ties-wire-accessories/heat-shrink-tubing-rated...`
17. ✅ `https://machrio.com/product/tape/vhb-foam-double-sided-tape...`
18. ✅ `https://machrio.com/product/hand-protection/level-5-cut-resistant-arm-sleeves...`
19. ✅ `https://machrio.com/product/carts-trucks/stone-ball-fork...`
20. ✅ `https://machrio.com/product/hearing-protection/bullet-shaped-pu-foam-corded-earplugs...`
21. ✅ `https://machrio.com/category/linen-carts`
22. ✅ `https://machrio.com/category/task-jobsite-lighting`

## 配置统计

- **分类页面重定向**: 200+ 条
- **产品页面重定向**: 18 条（新增）
- **通用路径重定向**: 10 条
- **总计**: 约 230 条重定向规则

## 部署说明

1. 配置已更新到 `next.config.ts`
2. 构建成功，无错误
3. 部署后将自动生效

## 后续监控

部署后请在 Google Search Console 中监控：

1. **覆盖率报告** - 检查 404 错误是否减少
2. **索引状态** - 确认新 URL 被正确索引
3. **搜索性能** - 监控流量是否恢复正常

## 如有更多 404 错误

如果发现更多 404 错误：

1. 从 Google Search Console 导出新的 404 报告
2. 运行分析脚本：
   ```bash
   python3 scripts/analyze-404-urls.py
   ```
3. 将新的重定向规则添加到 `next.config.ts`
4. 重新部署

## 联系

如有问题，请联系开发团队。
