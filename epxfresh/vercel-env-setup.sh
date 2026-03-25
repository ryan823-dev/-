#!/bin/bash

# EPXFresh Vercel Environment Variables Setup Script
# This script helps you configure environment variables in Vercel

echo "🔧 EPXFresh Vercel Environment Setup"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
echo "🔐 Checking Vercel login..."
VERCEL_USER=$(vercel whoami 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Not logged in. Please login to Vercel..."
    vercel login
    VERCEL_USER=$(vercel whoami)
fi

echo "✅ Logged in as: $VERCEL_USER"
echo ""

# Get project info
echo "📊 Fetching project information..."
cd /Users/oceanlink/Documents/Qoder-1/epxfresh

# Check if .vercel folder exists
if [ ! -d ".vercel" ]; then
    echo "❌ Project not linked to Vercel. Linking now..."
    vercel link
fi

# Get project ID from .vercel/project.json
PROJECT_ID=$(cat .vercel/project.json | grep -oP '"projectId":\s*"\K[^"]+')
ORG_ID=$(cat .vercel/project.json | grep -oP '"orgId":\s*"\K[^"]+')

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Organization ID: $ORG_ID"
echo ""

# Prompt for environment variables
echo "📝 Enter your environment variables:"
echo "-----------------------------------"
echo ""

# Sanity Project ID
read -p "Sanity Project ID: " SANITY_PROJECT_ID
if [ -z "$SANITY_PROJECT_ID" ]; then
    echo "⚠️  Skipping Sanity Project ID (you can add it later)"
else
    echo "Setting NEXT_PUBLIC_SANITY_PROJECT_ID..."
    vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID "$SANITY_PROJECT_ID" --environment production --environment preview --environment development
fi

# Sanity Dataset
echo ""
read -p "Sanity Dataset (default: production): " SANITY_DATASET
SANITY_DATASET=${SANITY_DATASET:-production}
echo "Setting NEXT_PUBLIC_SANITY_DATASET..."
vercel env add NEXT_PUBLIC_SANITY_DATASET "$SANITY_DATASET" --environment production --environment preview --environment development

# OpenAI API Key
echo ""
echo "⚠️  OpenAI API Key is required for AI Assistant functionality"
read -p "OpenAI API Key (sk-...): " OPENAI_KEY
if [ -z "$OPENAI_KEY" ]; then
    echo "⚠️  Skipping OpenAI API Key (AI Assistant will not work)"
else
    echo "Setting OPENAI_API_KEY..."
    vercel env add OPENAI_API_KEY "$OPENAI_KEY" --environment production --environment preview --environment development
fi

# Site URL
echo ""
echo "Setting NEXT_PUBLIC_SITE_URL..."
vercel env add NEXT_PUBLIC_SITE_URL "https://epxfresh.vercel.app" --environment production --environment preview --environment development

echo ""
echo "✨ Environment variables configured!"
echo ""
echo "🚀 Deploying to apply changes..."
read -p "Deploy now? (y/n): " DEPLOY
if [ "$DEPLOY" = "y" ]; then
    vercel --prod
fi

echo ""
echo "📋 Summary:"
echo "----------"
echo "Environment variables set for:"
echo "  - NEXT_PUBLIC_SANITY_PROJECT_ID"
echo "  - NEXT_PUBLIC_SANITY_DATASET"
echo "  - OPENAI_API_KEY (if provided)"
echo "  - NEXT_PUBLIC_SITE_URL"
echo ""
echo "⚠️  Note: You may need to redeploy for changes to take effect."
echo ""
echo "🔗 Manage environment variables at:"
echo "   https://vercel.com/dashboard/projects/$PROJECT_ID/settings/environment-variables"
