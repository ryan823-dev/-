#!/bin/bash
# ViciVidi 背调功能代码同步脚本

set -e

REPO_URL="https://github.com/ryan823-dev/ViciVidi.git"
TEMP_DIR="/tmp/ViciVidi-sync"

echo "🔄 同步 ViciVidi 背调功能到 GitHub..."

# 清理临时目录
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 克隆仓库
echo "📦 克隆仓库..."
git clone "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"

# 创建背调功能目录
mkdir -p src/lib/due-diligence
mkdir -p src/components/leads
mkdir -p src/app/api/leads/\[id\]/due-diligence
mkdir -p docs

echo "✅ 目录结构已创建"
echo "⚠️  由于代码在 Qoder 历史记录中，需要从历史记录恢复文件"
echo "📝 请手动复制以下文件到 $TEMP_DIR："
echo "   - src/lib/due-diligence/*.ts"
echo "   - src/components/leads/DueDiligence*.tsx"
echo "   - src/app/api/leads/[id]/due-diligence/route.ts"
echo ""
echo "然后运行："
echo "   cd $TEMP_DIR"
echo "   git add -A"
echo "   git commit -m 'feat: add lead due diligence feature with real data integration'"
echo "   git push origin master"
