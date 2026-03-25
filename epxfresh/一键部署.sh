#!/bin/bash

# EPXFresh 一键部署脚本
# 支持：阿里云 OSS、腾讯云 COS、Netlify、Vercel

echo "🌿 EPXFresh 网站部署脚本"
echo "========================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：需要安装 Node.js"
    echo "请访问：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 选择部署方式
echo "请选择部署方式："
echo "1. 阿里云 OSS（推荐，中国大陆访问快）"
echo "2. 腾讯云 COS（推荐，中国大陆访问快）"
echo "3. Vercel（全球，需要 VPN）"
echo "4. Netlify（全球，免费）"
echo "5. 本地预览"
echo "0. 取消"
echo ""
read -p "请输入选项 (0-5): " choice

case $choice in
    1)
        echo ""
        echo "☁️  部署到阿里云 OSS"
        echo "===================="
        echo ""
        
        # 检查 ossutil
        if ! command -v ossutil64 &> /dev/null; then
            echo "⚠️  未检测到 ossutil，请先安装"
            echo "下载地址：https://help.aliyun.com/document_detail/50496.html"
            echo ""
            read -p "是否继续配置？(y/n): " install
            if [ "$install" = "y" ]; then
                # 这里可以添加自动安装逻辑
                echo "请手动安装 ossutil 后重新运行此脚本"
                exit 1
            fi
        fi
        
        # 构建
        echo "📦 构建静态网站..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ 构建失败"
            exit 1
        fi
        
        echo "✅ 构建成功"
        echo ""
        
        # 获取 OSS 配置
        read -p "请输入 OSS Bucket 名称: " bucket_name
        read -p "请输入 OSS Endpoint (如 oss-cn-hangzhou.aliyuncs.com): " endpoint
        
        echo ""
        echo "📤 上传到 OSS: oss://${bucket_name}/"
        echo ""
        
        # 上传
        ossutil64 cp -r out/ oss://${bucket_name}/ --recursive --force
        
        if [ $? -ne 0 ]; then
            echo "❌ 上传失败"
            exit 1
        fi
        
        echo ""
        echo "✅ 上传成功！"
        echo ""
        echo "访问地址：http://${bucket_name}.${endpoint}"
        echo ""
        
        # 配置静态网站托管提示
        echo "📝 下一步操作："
        echo "1. 登录阿里云 OSS 控制台"
        echo "2. 进入 Bucket 设置 → 基础设置"
        echo "3. 配置静态页面："
        echo "   - 默认首页：index.html"
        echo "   - 默认 404 页：404.html"
        echo ""
        ;;
        
    2)
        echo ""
        echo "☁️  部署到腾讯云 COS"
        echo "===================="
        echo ""
        
        # 构建
        echo "📦 构建静态网站..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ 构建失败"
            exit 1
        fi
        
        echo "✅ 构建成功"
        echo ""
        
        echo "📤 请使用腾讯云 COS 控制台上传 out/ 目录"
        echo ""
        echo "步骤："
        echo "1. 访问：https://console.cloud.tencent.com/cos"
        echo "2. 创建 Bucket"
        echo "3. 上传 out/ 目录所有文件"
        echo "4. 配置静态网站托管"
        echo ""
        ;;
        
    3)
        echo ""
        echo "🚀 部署到 Vercel"
        echo "================"
        echo ""
        
        # 检查 Vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo "📦 安装 Vercel CLI..."
            npm install -g vercel
        fi
        
        # 构建
        echo "📦 构建静态网站..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ 构建失败"
            exit 1
        fi
        
        echo "✅ 构建成功"
        echo ""
        
        # 部署
        echo " 部署到 Vercel..."
        vercel --prod
        
        echo ""
        echo "✅ 部署完成！"
        echo ""
        ;;
        
    4)
        echo ""
        echo "🌐 部署到 Netlify"
        echo "================="
        echo ""
        
        # 检查 Netlify CLI
        if ! command -v netlify &> /dev/null; then
            echo "📦 安装 Netlify CLI..."
            npm install -g netlify-cli
        fi
        
        # 构建
        echo "📦 构建静态网站..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ 构建失败"
            exit 1
        fi
        
        echo "✅ 构建成功"
        echo ""
        
        # 部署
        echo "📤 部署到 Netlify..."
        netlify deploy --prod --dir=out
        
        echo ""
        echo "✅ 部署完成！"
        echo ""
        ;;
        
    5)
        echo ""
        echo "🖥️  本地预览"
        echo "==========="
        echo ""
        
        # 构建
        echo "📦 构建静态网站..."
        npm run build
        
        if [ $? -ne 0 ]; then
            echo "❌ 构建失败"
            exit 1
        fi
        
        echo "✅ 构建成功"
        echo ""
        
        # 启动本地服务器
        echo "🌐 启动本地服务器..."
        echo "访问：http://localhost:8080"
        echo ""
        
        # 使用 http-server 或 python
        if command -v http-server &> /dev/null; then
            npx http-server out -p 8080
        elif command -v python3 &> /dev/null; then
            cd out && python3 -m http.server 8080
        else
            echo "⚠️  请安装 http-server: npm install -g http-server"
            exit 1
        fi
        ;;
        
    0)
        echo "已取消"
        exit 0
        ;;
        
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo "✨ 完成！"
