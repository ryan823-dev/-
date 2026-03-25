#!/bin/bash

# EPXFresh Sanity CMS Quick Setup Script
# This script helps you set up Sanity CMS quickly

echo "🌿 EPXFresh Sanity CMS Setup"
echo "============================"
echo ""

# Check if Sanity CLI is installed
if ! command -v sanity &> /dev/null
then
    echo "📦 Installing Sanity CLI..."
    npm install -g @sanity/cli
fi

# Check if user is logged in
echo ""
echo "🔐 Checking Sanity login status..."
sanity whoami 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in. Opening login page..."
    sanity login
fi

# Create Sanity project
echo ""
echo "🏗️  Creating Sanity project..."
echo "This will open an interactive setup."
echo "Recommended settings:"
echo "  - Project name: epxfresh-cms"
echo "  - Dataset: production"
echo "  - Output path: ./sanity-studio"
echo "  - Template: Empty project"
echo ""

read -p "Press Enter to continue..."

mkdir -p sanity-studio
cd sanity-studio

# Check if already initialized
if [ -f "sanity.config.ts" ]; then
    echo "✅ Sanity studio already exists!"
else
    npx sanity init
fi

# Get project ID
echo ""
echo "📋 Getting project credentials..."
PROJECT_ID=$(grep -oP 'projectId:.*?"\K[^"]+' sanity.config.ts | head -1)
DATASET=$(grep -oP 'dataset:.*?"\K[^"]+' sanity.config.ts | head -1)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not find project ID. Please check sanity.config.ts"
    exit 1
fi

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Dataset: $DATASET"

# Go back to root
cd ..

# Create .env.local
echo ""
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=$PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=$DATASET

# AI Assistant (OpenAI)
# TODO: Add your OpenAI API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Site URL
NEXT_PUBLIC_SITE_URL=https://epxfresh.vercel.app
EOF

echo "✅ .env.local created with Sanity credentials"

# Deploy Sanity Studio
echo ""
echo "🚀 Deploying Sanity Studio..."
cd sanity-studio
npx sanity deploy

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Add your OPENAI_API_KEY to .env.local"
echo "2. Run 'npm run dev' to test locally"
echo "3. Access Sanity Studio at your deployed URL"
echo "4. Add products and content via Sanity Studio"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
