import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB } from './lib/db';
import { generateAIContent } from './lib/ai/chat';
import * as schemas from './lib/ai/schemas';
import { Product as ProductModel } from './models/Product';
import { LeadRun as LeadRunModel } from './models/LeadRun';
import { Company as CompanyModel } from './models/Company';
import { SocialAccount as SocialAccountModel } from './models/SocialAccount';
import { SocialPost as SocialPostModel } from './models/SocialPost';
import { SocialMetric as SocialMetricModel } from './models/SocialMetric';
import { PRArticle as PRArticleModel } from './models/PRArticle';
import { ICPProfile, LeadTier, SignalType, SignalStrength, ShadowSignal } from './types';
import { KeywordCluster } from './models/KeywordCluster';
import { ContentPlan } from './models/ContentPlan';
import { ContentAsset } from './models/ContentAsset';
import { DerivedContent } from './models/DerivedContent';
import { getLinkedInAuthorizationUrl, exchangeLinkedInCode, getLinkedInOAuthConfig } from './auth/linkedin';
import { getTenderPlatforms, calculateTenderStrength } from './lib/tender/platforms';
import { parseDocument, getSupportedFormats } from './lib/document-parser';
import { initStageContext, stageTerminology, stageCompetitors, stageCertifications, stageChannels, stageExhibitions, stageTrends, stageStrategy, stageICP } from './lib/research-stages';
import multer from 'multer';
import { ClientSiteConfig } from './models/ClientSiteConfig';
import { PushRecord } from './models/PushRecord';
import { PublisherAdapterFactory } from './lib/publisher';
import { initPushTimeoutChecker } from './services/push-timeout-checker';

dotenv.config();

// Multer config for in-memory file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// __dirname: safe for both ESM and Vercel's bundled CJS
let __dirname_resolved: string;
try {
  __dirname_resolved = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname_resolved = process.cwd();
}

// --- Gemini (retained for googleSearch tool in lead discovery only) ---
const getGeminiAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Gemini usage limiter (in-memory, resets on cold start) ---
const GEMINI_DAILY_LIMIT = 35; // max Gemini research calls per day (5 products x 7 stages)
let geminiUsage = { count: 0, date: new Date().toISOString().slice(0, 10) };

function canUseGemini(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (geminiUsage.date !== today) {
    geminiUsage = { count: 0, date: today };
  }
  return geminiUsage.count < GEMINI_DAILY_LIMIT && !!process.env.GEMINI_API_KEY;
}

function recordGeminiUsage() {
  const today = new Date().toISOString().slice(0, 10);
  if (geminiUsage.date !== today) {
    geminiUsage = { count: 1, date: today };
  } else {
    geminiUsage.count++;
  }
  console.log(`[Gemini Limiter] Usage today: ${geminiUsage.count}/${GEMINI_DAILY_LIMIT}`);
}

// --- Fallback Research using DashScope (without web search) ---
async function fallbackProductResearch(productName: string, productDescription?: string, targetMarkets?: string[]) {
  console.log('[Fallback Research] Using DashScope without web search...');
  
  const prompt = `你是一位专业的国际贸易和出口市场分析师。请为以下中国制造商的产品生成出海调研报告：

产品名称：${productName}
产品描述：${productDescription || '无'}
目标市场：${targetMarkets?.join(', ') || '欧洲、北美、东南亚'}

请基于你的专业知识，生成以下内容：

1. 产品英文名称和国际通用术语
2. 3-5个主要国际竞争对手（公司名、国家、优势）
3. 出口所需的主要认证要求（CE、UL、ISO等）
4. 推荐的自主获客渠道（严禁推荐阿里巴巴国际站、Made-in-China、Global Sources、中国制造网等B2B交易平台（这些平台是流量二道贩子，工业类目无权重，开户代价高且无意义）。推荐：独立站SEO、行业目录Kompass/Europages/ThomasNet、展会、LinkedIn社交销售、分销商等）
5. 相关行业展会
6. 市场趋势和机会
7. 差异化策略建议
8. 优先行动项（P0/P1/P2）

请以JSON格式返回。`;

  const schema = {
    type: 'object',
    properties: {
      productNameEN: { type: 'string' },
      alternativeTerms: { type: 'array', items: { type: 'string' } },
      competitors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            country: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            priceRange: { type: 'string' }
          }
        }
      },
      certifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            region: { type: 'string' },
            importance: { type: 'string' },
            description: { type: 'string' }
          }
        }
      },
      channels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            priority: { type: 'string' }
          }
        }
      },
      exhibitions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string' },
            timing: { type: 'string' }
          }
        }
      },
      trends: { type: 'array', items: { type: 'string' } },
      differentiationStrategy: {
        type: 'object',
        properties: {
          suggestedApproach: { type: 'string' },
          uniqueSellingPoints: { type: 'array', items: { type: 'string' } }
        }
      },
      actionItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            priority: { type: 'string' },
            action: { type: 'string' },
            category: { type: 'string' }
          }
        }
      }
    }
  };

  const result = await generateAIContent(prompt, { 
    responseSchema: schema,
    temperature: 0.7,
    maxTokens: 4096
  });

  const data = result.parsed || {};
  
  return {
    productNameCN: productName,
    productNameEN: data.productNameEN || productName,
    internationalTerms: data.alternativeTerms || [],
    competitorAnalysis: data.competitors || [],
    certifications: {
      required: data.certifications || [],
      gaps: []
    },
    channels: data.channels || [],
    exhibitions: data.exhibitions || [],
    trends: data.trends || [],
    marketPositioning: {
      suggestedPosition: data.differentiationStrategy?.suggestedApproach || '专业制造商',
      targetRegions: targetMarkets || ['Europe', 'North America']
    },
    differentiationStrategy: data.differentiationStrategy || { suggestedApproach: '', uniqueSellingPoints: [] },
    actionItems: data.actionItems || [],
    researchedAt: new Date().toISOString(),
    dataSource: 'offline' // Mark as offline/fallback data
  };
}

// --- Brave Search API helper ---
async function braveSearch(query: string, count: number = 10): Promise<any[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY not configured');

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brave Search API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  return (data.web?.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description
  }));
}

// --- Brave Search + DashScope Research Pipeline ---
async function braveProductResearch(productName: string, productDescription?: string, targetMarkets?: string[]) {
  console.log('[Brave+DashScope Research] Starting...');

  // Step 1: Translate product name using DashScope
  console.log('[Brave Research Phase 1] Translating product name...');
  const translateResult = await generateAIContent(
    `将以下中国工业产品名称翻译为英文，并提供国际通用术语。
产品名称：${productName}
产品描述：${productDescription || '无'}

返回JSON：{"productNameEN": "...", "alternativeTerms": ["..."], "industryCategory": "..."}`,
    { responseSchema: { type: 'object', properties: { productNameEN: { type: 'string' }, alternativeTerms: { type: 'array', items: { type: 'string' } }, industryCategory: { type: 'string' } } }, temperature: 0.3 }
  );
  const terminology = translateResult.parsed || {};
  const enName = terminology.productNameEN || productName;
  console.log(`[Brave Research] English name: ${enName}`);

  // Step 2-6: Parallel Brave searches
  console.log('[Brave Research Phase 2] Running parallel web searches...');
  const searchQueries = [
    `top manufacturers "${enName}" international competitors market leaders`,
    `export certification requirements "${enName}" CE UL ISO standards`,
    `best B2B sales channels platforms "${enName}" export from China`,
    `industry trade shows exhibitions "${enName}" 2025 2026`,
    `"${enName}" market trends industry outlook global demand`
  ];

  const searchResults = await Promise.all(
    searchQueries.map(q => braveSearch(q, 8).catch(() => []))
  );

  const [competitorResults, certResults, channelResults, exhibitionResults, trendResults] = searchResults;

  // Step 7: Feed all search results to DashScope for structured analysis
  console.log('[Brave Research Phase 3] Analyzing search results with DashScope...');
  const analysisPrompt = `你是一位专业的国际贸易和出口市场分析师。基于以下网络搜索结果，为中国制造商的"${productName}"(${enName})生成出海调研报告。

## 竞争对手搜索结果
${competitorResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

## 认证要求搜索结果
${certResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

## 销售渠道搜索结果
${channelResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

## 展会信息搜索结果
${exhibitionResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

## 市场趋势搜索结果
${trendResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n')}

目标市场：${targetMarkets?.join(', ') || '欧洲、北美、东南亚'}

请基于以上搜索结果，生成结构化的出海调研报告，包括：
1. 3-5个主要国际竞争对手（公司名、国家、核心优势、价格定位、官网）
2. 出口认证要求（认证名、适用地区、重要程度：必备/强烈建议/加分项）
3. 推荐销售渠道（渠道名、类型、优先级：高/中/低）
4. 重点行业展会（展会名、地点、时间）
5. 市场趋势（3-5条）
6. 差异化策略建议
7. 优先行动项（P0/P1/P2）
8. 市场定位建议

请以JSON格式返回。`;

  const analysisSchema = {
    type: 'object',
    properties: {
      competitors: {
        type: 'array', items: { type: 'object', properties: {
          name: { type: 'string' }, country: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          priceRange: { type: 'string' }, website: { type: 'string' }
        }}
      },
      certifications: {
        type: 'array', items: { type: 'object', properties: {
          name: { type: 'string' }, region: { type: 'string' },
          importance: { type: 'string' }, description: { type: 'string' }
        }}
      },
      channels: {
        type: 'array', items: { type: 'object', properties: {
          name: { type: 'string' }, type: { type: 'string' }, priority: { type: 'string' }
        }}
      },
      exhibitions: {
        type: 'array', items: { type: 'object', properties: {
          name: { type: 'string' }, location: { type: 'string' }, timing: { type: 'string' }
        }}
      },
      trends: { type: 'array', items: { type: 'string' } },
      differentiationStrategy: {
        type: 'object', properties: {
          suggestedApproach: { type: 'string' },
          uniqueSellingPoints: { type: 'array', items: { type: 'string' } }
        }
      },
      marketPositioning: {
        type: 'object', properties: {
          suggestedPosition: { type: 'string' },
          targetRegions: { type: 'array', items: { type: 'string' } }
        }
      },
      actionItems: {
        type: 'array', items: { type: 'object', properties: {
          priority: { type: 'string' }, action: { type: 'string' }, category: { type: 'string' }
        }}
      }
    }
  };

  const analysis = await generateAIContent(analysisPrompt, {
    responseSchema: analysisSchema,
    temperature: 0.5,
    maxTokens: 4096
  });

  const data = analysis.parsed || {};

  return {
    productNameCN: productName,
    productNameEN: enName,
    internationalTerms: terminology.alternativeTerms || [],
    industryCategory: terminology.industryCategory,
    competitorAnalysis: data.competitors || [],
    certifications: {
      required: (data.certifications || []).map((c: any) => ({
        ...c,
        importance: c.importance === 'Mandatory' || c.importance === '必备' ? '必备' :
                   c.importance === 'Recommended' || c.importance === '强烈建议' ? '强烈建议' : '加分项'
      })),
      gaps: []
    },
    channels: (data.channels || []).map((ch: any) => ({
      ...ch,
      priority: ch.priority === 'High' || ch.priority === '高' ? '高' :
               ch.priority === 'Medium' || ch.priority === '中' ? '中' : ch.priority
    })),
    exhibitions: data.exhibitions || [],
    trends: data.trends || [],
    marketPositioning: data.marketPositioning || {
      suggestedPosition: '专业制造商',
      targetRegions: targetMarkets || ['Europe', 'North America']
    },
    differentiationStrategy: data.differentiationStrategy || { suggestedApproach: '', uniqueSellingPoints: [] },
    actionItems: data.actionItems || [],
    researchedAt: new Date().toISOString(),
    dataSource: 'brave+dashscope'
  };
}

// --- Stage-level fallback executor for decomposed research ---
async function executeStageWithFallback(
  stageName: string,
  geminiCall: (ai: any) => Promise<any>,
  braveCall: () => Promise<any>,
  dashscopeCall: () => Promise<any>,
  skipGemini: boolean = false
): Promise<{ data: any; source: string; geminiAvailable: boolean }> {
  if (!skipGemini && canUseGemini()) {
    try {
      const ai = getGeminiAI();
      const data = await geminiCall(ai);
      recordGeminiUsage();
      return { data, source: 'gemini', geminiAvailable: true };
    } catch (e: any) {
      console.log(`[${stageName}] Gemini failed: ${e.message}`);
    }
  }
  if (process.env.BRAVE_SEARCH_API_KEY) {
    try {
      const data = await braveCall();
      return { data, source: 'brave+dashscope', geminiAvailable: false };
    } catch (e: any) {
      console.log(`[${stageName}] Brave+DashScope failed: ${e.message}`);
    }
  }
  const data = await dashscopeCall();
  return { data, source: 'dashscope', geminiAvailable: false };
}

// --- Brave+DashScope research helper for individual stages ---
async function braveStageResearch(searchQuery: string, analysisPrompt: string, schema: any): Promise<any> {
  const results = await braveSearch(searchQuery, 8);
  const context = results.map((r: any) => `- ${r.title}: ${r.description}`).join('\n');
  const r = await generateAIContent(analysisPrompt + '\n\n参考以下网络搜索结果:\n' + context, { responseSchema: schema, temperature: 0.5 });
  return r.parsed;
}

// --- Initialize decomposed research stage context ---

initStageContext({ canUseGemini, getGeminiAI, recordGeminiUsage, braveSearch });



// --- Seed Initial Data ---
async function seedInitialData() {
  const count = await ProductModel.countDocuments();
  if (count === 0) {
    await ProductModel.create({
      slug: 'tdpaintcell',
      customDomain: 'tdpaintcell.vertax.top',
      name: '涂豆科技 - 喷漆自动化机器人',
      productType: 'Paint Cell',
      coatingType: 'Liquid',
      workpieceSize: 'Medium',
      automationLevel: 'High',
      advantages: [
        { label: 'ROI', value: '18 months' },
        { label: 'Precision', value: '±0.1mm' }
      ],
      targetCountries: ['Germany', 'Vietnam', 'Mexico'],
      applicationIndustries: ['Automotive', 'Furniture', 'Metal Fabrication'],
    });
    console.log('Seeded initial product data');
  }
}

// --- Lazy DB initialization (for Vercel serverless cold start) ---
let dbReady = false;
async function ensureDB() {
  if (dbReady) return;
  await connectDB();
  await seedInitialData();
  dbReady = true;
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));

// Health endpoint (no DB required) - for deployment diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      VERCEL: !!process.env.VERCEL,
      AI_PROVIDER: process.env.AI_PROVIDER || 'not set',
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'missing',
      DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY ? 'configured' : 'missing',
      BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY ? 'configured' : 'missing',
      GEMINI_USAGE: `${geminiUsage.count}/${GEMINI_DAILY_LIMIT} today`,
    }
  });
});

// Lazy DB middleware: connects on first request (skip for /api/health)
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

  // --- API Routes ---

  // ==================== Products ====================
  app.get('/api/products', async (req, res) => {
    try {
      const products = await ProductModel.find().sort({ createdAt: -1 });
      // Map _id to id for frontend compatibility
      res.json(products.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const product = await ProductModel.create(req.body);
      res.json({ ...product.toObject(), id: product._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create product', details: err.message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ ...product.toObject(), id: product._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update product', details: err.message });
    }
  });

  // ==================== ICP Generation (AI Driven) ====================
  app.post('/api/products/:id/icp/generate', async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      console.log(`Generating ICP for product: ${product.name}`);

      const { parsed: icpData } = await generateAIContent(
        `Act as a senior B2B Industrial Export Consultant. Generate a high-precision Ideal Customer Profile (ICP) for this product:
        
        PRODUCT DATA:
        - Name: ${product.name}
        - Category: ${product.productType}
        - Technical Specs: ${product.coatingType} coating, ${product.workpieceSize} workpiece size, ${product.automationLevel} automation.
        - Core Advantages: ${product.advantages.map(a => `${a.label}: ${a.value}`).join(', ')}
        - Initial Target Industries: ${product.applicationIndustries.join(', ')}
        
        LOGIC REQUIREMENTS:
        1. Industry Tags: Identify high-value sub-sectors.
        2. Customer Types: Define the role in the supply chain.
        3. Target Titles: Rank by decision power.
        4. Query Pack: Generate search strings for Google, LinkedIn, Directories.
        5. Tender Pack: Generate 4-6 procurement/tender search queries for government bidding platforms (e.g., "industrial coating equipment tender", "automated paint system RFP", "spray booth procurement").
        6. Signal Pack: Identify "Shadow Signals" that indicate pain (Regulation, Hiring, Expansion, Automation).
        7. Disqualifiers: Technical or financial "red flags".
        8. Scenarios: Business triggers.
        
        The output must be a structured JSON matching the ICPProfile schema.`,
        { responseSchema: schemas.icpSchema }
      );

      if (!icpData) {
        throw new Error('AI returned empty response');
      }

      const icp = {
        ...icpData,
        version: (product.icpProfile?.version || 0) + 1,
        updatedAt: new Date()
      };
      
      product.icpProfile = icp;
      await product.save();
      res.json(icp);
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate ICP via AI',
        details: error.message || 'Unknown error'
      });
    }
  });

  // ==================== Lead Runs ====================
  app.get('/api/runs', async (req, res) => {
    try {
      const runs = await LeadRunModel.find().sort({ createdAt: -1 });
      res.json(runs.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch runs', details: err.message });
    }
  });

  app.post('/api/runs', async (req, res) => {
    try {
      const { productId, productName, countries, targetCompanyCount, strategy } = req.body;
      
      const product = await ProductModel.findById(productId);
      if (!product || !product.icpProfile) {
        return res.status(400).json({ error: 'Product or ICP Profile not found. Please generate ICP first.' });
      }

      const icp = product.icpProfile;
      
      // 计算总查询数
      const totalQueries = (countries || []).reduce((sum: number, c: any) => sum + (c.allocatedQueries || 1), 0);

      // 设置第一个国家为 running 状态
      const countriesWithStatus = (countries || []).map((c: any, idx: number) => ({
        ...c,
        status: idx === 0 ? 'running' : 'pending'
      }));

      const run = await LeadRunModel.create({
        productId, 
        productName, 
        countries: countriesWithStatus,
        targetCompanyCount: targetCompanyCount || 30,
        strategy: strategy || 'comprehensive',
        status: 'queued',
        progress: {
          discovery: 0, enrichment: 0, contact: 0, research: 0, outreach: 0, total: 0,
          currentStage: 'idle', 
          totalQueries,
          completedQueries: 0,
          currentCountryIndex: 0,
          currentCountry: countriesWithStatus[0]?.countryCode
        }
      });

      res.json({ ...run.toObject(), id: run._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create run', details: err.message });
    }
  });

  // ==================== Lead Run Pipeline Stages ====================
  // Each stage < 10s, frontend-orchestrated (mirrors Knowledge Engine pattern)

  // --- Stage: Company Discovery (per query) ---
  // --- Stage: Company Discovery (Multi-Country Serial Execution) ---
  app.post('/api/runs/:runId/discover', async (req, res) => {
    try {
      const run = await LeadRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found' });

      const product = await ProductModel.findById(run.productId);
      if (!product || !product.icpProfile) {
        return res.status(400).json({ error: 'Product or ICP Profile missing' });
      }

      const icp = product.icpProfile;
      const strategy = (run as any).strategy || 'comprehensive';
      const targetCompanyCount = (run as any).targetCompanyCount || 30;
      const countries = (run as any).countries || [];
      const progress = run.progress as any;

      // 检查是否已达到目标公司数
      if (progress.discovery >= targetCompanyCount) {
        return res.json({
          reachedTarget: true,
          totalDiscovered: progress.discovery,
          message: 'Target company count reached'
        });
      }

      // 获取当前国家配置
      const currentCountryIndex = progress.currentCountryIndex || 0;
      if (currentCountryIndex >= countries.length) {
        return res.json({
          allCountriesExhausted: true,
          totalDiscovered: progress.discovery,
          message: 'All countries have been processed'
        });
      }

      const currentCountry = countries[currentCountryIndex];
      
      // 计算当前国家已执行的查询次数
      const countryCompanies = await CompanyModel.countDocuments({
        leadRunId: run._id,
        country: currentCountry.countryName
      });
      const currentCountryQueries = Math.ceil(countryCompanies / 4); // 假设平均每个 query 4 家公司

      // 检查当前国家是否已完成配额
      if (currentCountryQueries >= (currentCountry.allocatedQueries || 2)) {
        // 更新当前国家状态为完成
        currentCountry.status = 'done';
        currentCountry.companiesFound = countryCompanies;
        
        // 切换到下一个国家
        progress.currentCountryIndex = currentCountryIndex + 1;
        const nextCountry = countries[currentCountryIndex + 1];
        if (nextCountry) {
          nextCountry.status = 'running';
          progress.currentCountry = nextCountry.countryCode;
        }
        
        await run.save();
        
        return res.json({
          switchedCountry: true,
          currentCountryIndex: currentCountryIndex + 1,
          nextCountry: nextCountry,
          totalDiscovered: progress.discovery
        });
      }

      // 生成查询
      let queries: string[] = [];
      switch (strategy) {
        case 'directory':
          queries = [...(icp.queryPack.directories || []), ...(icp.queryPack.google || [])].slice(0, 5);
          break;
        case 'tender':
          queries = [...(icp.queryPack.tender || []), ...(icp.queryPack.google || [])].slice(0, 5);
          break;
        case 'exhibition':
          queries = (icp.queryPack.google || []).map((q: string) => q + ' exhibition exhibitor').slice(0, 4);
          break;
        default:
          queries = [
            ...(icp.queryPack.google || []).slice(0, 3),
            ...(icp.queryPack.directories || []).slice(0, 1),
            ...(icp.queryPack.tender || []).slice(0, 1)
          ];
      }

      // 轮换使用不同的 query
      const queryIndex = currentCountryQueries % queries.length;
      const query = queries[queryIndex] || queries[0];
      const fullQuery = `${query} in ${currentCountry.countryName}`;

      run.status = 'running';
      run.startedAt = run.startedAt || new Date();
      progress.currentStage = 'discovery';
      await run.save();

      console.log(`[Discovery] Query: ${fullQuery} (Country ${currentCountryIndex + 1}/${countries.length})`);

      let foundCompanies: any[] = [];
      const skipGemini = req.query.skipGemini === 'true';

      // Tier 1: Gemini with googleSearch
      if (!skipGemini && canUseGemini()) {
        try {
          const ai = getGeminiAI();
          const searchResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Find 5-8 real companies in ${currentCountry.countryName} matching: "${fullQuery}". For each: name, website URL, industry, matchReason. Focus on real existing industrial companies.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    website: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    matchReason: { type: Type.STRING }
                  },
                  required: ['name', 'industry']
                }
              }
            }
          });
          foundCompanies = JSON.parse(searchResponse.text || '[]');
          recordGeminiUsage();
          console.log(`[Discovery] Gemini found ${foundCompanies.length} companies`);
        } catch (e: any) {
          console.log(`[Discovery] Gemini failed: ${e.message}`);
        }
      }

      // Tier 2: Brave + DashScope
      if (foundCompanies.length === 0 && process.env.BRAVE_SEARCH_API_KEY) {
        try {
          const searchResults = await braveSearch(fullQuery, 10);
          const context = searchResults.map((r: any) => `- ${r.title}: ${r.description} (${r.url})`).join('\n');
          const parsePrompt = `From these search results about "${fullQuery}", extract real company entities.\nFor each: name, website, industry, matchReason. Return JSON array.\n\nSearch results:\n${context}`;
          const parseResult = await generateAIContent(parsePrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, website: { type: 'string' }, industry: { type: 'string' }, matchReason: { type: 'string' } } } },
            temperature: 0.3
          });
          foundCompanies = parseResult.parsed || [];
          console.log(`[Discovery] Brave+DashScope found ${foundCompanies.length} companies`);
        } catch (e: any) {
          console.log(`[Discovery] Brave+DashScope failed: ${e.message}`);
        }
      }

      // Tier 3: Pure DashScope
      if (foundCompanies.length === 0) {
        try {
          const fallbackPrompt = `List 5-8 real companies in ${currentCountry.countryName} that would be potential buyers for: "${query}". For each: name, website (if known), industry, matchReason. Return JSON array.`;
          const fallbackResult = await generateAIContent(fallbackPrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, website: { type: 'string' }, industry: { type: 'string' }, matchReason: { type: 'string' } } } },
            temperature: 0.5
          });
          foundCompanies = fallbackResult.parsed || [];
          console.log(`[Discovery] DashScope found ${foundCompanies.length} companies`);
        } catch (e: any) {
          console.log(`[Discovery] DashScope failed: ${e.message}`);
        }
      }

      // Save discovered companies (dedup)
      const saved: any[] = [];
      for (const fc of foundCompanies) {
        if (!fc.name) continue;
        
        // 检查是否达到目标数
        if (progress.discovery >= targetCompanyCount) break;
        
        const existing = await CompanyModel.findOne({ name: fc.name, leadRunId: run._id });
        if (existing) continue;

        let domain = '';
        try { if (fc.website) domain = new URL(fc.website).hostname.replace('www.', ''); } catch {}

        const company = await CompanyModel.create({
          leadRunId: run._id,
          name: fc.name,
          website: fc.website || '',
          domain,
          country: currentCountry.countryName,
          industry: fc.industry || 'Unknown',
          source: `${strategy} search: ${query}`,
          status: 'discovered',
          notes: fc.matchReason || ''
        });
        saved.push({ ...company.toObject(), id: company._id.toString() });
        progress.discovery++;
        currentCountry.companiesFound = (currentCountry.companiesFound || 0) + 1;
      }

      progress.completedQueries = (progress.completedQueries || 0) + 1;
      progress.total = progress.discovery;
      await run.save();

      res.json({
        companies: saved,
        currentCountry,
        queryUsed: fullQuery,
        totalDiscovered: progress.discovery,
        targetCompanyCount,
        reachedTarget: progress.discovery >= targetCompanyCount,
        allCountriesExhausted: false
      });
    } catch (err: any) {
      console.error('[Discovery] Error:', err);
      res.status(500).json({ error: 'Discovery failed', details: err.message });
    }
  });

  // --- Stage: Company Enrichment (per company) ---
  app.post('/api/runs/:runId/enrich/:companyId', async (req, res) => {
    try {
      const run = await LeadRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found' });

      const company = await CompanyModel.findById(req.params.companyId);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      (run.progress as any).currentStage = 'enrichment';
      await run.save();

      console.log(`[Enrich] Processing: ${company.name} in ${company.country}`);

      const product = await ProductModel.findById(run.productId);
      const icp = product?.icpProfile;
      let signals: any[] = [];
      const skipGemini = req.query.skipGemini === 'true';

      // Tier 1: Gemini
      if (!skipGemini && canUseGemini()) {
        try {
          const ai = getGeminiAI();
          const signalResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Search for recent news, job openings, expansion plans, or regulatory issues for "${company.name}" in ${company.country}. Look for: 1) Hiring (technicians, engineers), 2) Environmental/regulatory issues, 3) Expansion (new factory, production line), 4) Automation upgrades, 5) Procurement/tenders. Return array of signals found.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    subType: { type: Type.STRING },
                    strength: { type: Type.STRING },
                    snippet: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ['type', 'subType', 'strength', 'snippet']
                }
              }
            }
          });
          signals = JSON.parse(signalResponse.text || '[]');
          recordGeminiUsage();
          console.log(`[Enrich] Gemini found ${signals.length} signals`);
        } catch (e: any) {
          console.log(`[Enrich] Gemini failed: ${e.message}`);
        }
      }

      // Tier 2: Brave + DashScope
      if (signals.length === 0 && process.env.BRAVE_SEARCH_API_KEY) {
        try {
          const searchResults = await braveSearch(`${company.name} ${company.country} news hiring expansion`, 8);
          const context = searchResults.map((r: any) => `- ${r.title}: ${r.description}`).join('\n');
          const parsePrompt = `Analyze these results about "${company.name}" and identify business signals: hiring, regulation, expansion, automation, tender. Return JSON array with type, subType, strength (trigger/high/medium/low), snippet.\n\nResults:\n${context}`;
          const parseResult = await generateAIContent(parsePrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, subType: { type: 'string' }, strength: { type: 'string' }, snippet: { type: 'string' } } } },
            temperature: 0.3
          });
          signals = parseResult.parsed || [];
          console.log(`[Enrich] Brave+DashScope found ${signals.length} signals`);
        } catch (e: any) {
          console.log(`[Enrich] Brave+DashScope failed: ${e.message}`);
        }
      }

      // Tier 3: Pure DashScope
      if (signals.length === 0) {
        try {
          const industryCtx = icp ? `Target industries: ${(icp.industryTags || []).join(', ')}. Pain points: ${((icp as any).painPoints || []).join(', ')}` : '';
          const fallbackPrompt = `Based on your knowledge of "${company.name}" (${company.industry}, ${company.country}), identify potential purchase-intent signals. ${industryCtx} Return JSON array with type, subType, strength, snippet.`;
          const fallbackResult = await generateAIContent(fallbackPrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, subType: { type: 'string' }, strength: { type: 'string' }, snippet: { type: 'string' } } } },
            temperature: 0.5
          });
          signals = fallbackResult.parsed || [];
        } catch (e: any) {
          console.log(`[Enrich] DashScope failed: ${e.message}`);
        }
      }

      // Process signals
      const processedSignals = signals.map((s: any) => ({
        type: s.type || 'other',
        subType: s.subType || 'unknown',
        strength: s.strength || 'medium',
        score: s.strength === 'trigger' ? 100 : s.strength === 'high' ? 70 : s.strength === 'medium' ? 40 : 20,
        evidence: { url: s.url || '', snippet: s.snippet || '', timestamp: new Date() },
        source: 'AI Analysis',
        confidence: 0.8
      }));

      // Auto-inject tender signal
      if (company.tenderMetadata) {
        processedSignals.push({
          type: 'tender', subType: 'active_procurement', strength: 'trigger', score: 100,
          evidence: {
            url: company.tenderMetadata.tenderUrl || '',
            snippet: `Active tender: ${company.tenderMetadata.tenderTitle}${company.tenderMetadata.estimatedValue ? ` (${company.tenderMetadata.estimatedValue})` : ''}`,
            timestamp: new Date()
          },
          source: company.tenderMetadata.platform || 'Tender', confidence: 1.0
        });
      }

      // Score
      let tier = 'Tier D (Cold Lead)';
      if (processedSignals.some((s: any) => s.strength === 'trigger')) tier = 'Tier A (Critical Pain)';
      else if (processedSignals.some((s: any) => s.strength === 'high')) tier = 'Tier B (Active Change)';
      else if (processedSignals.length > 0) tier = 'Tier C (High Potential)';

      const totalScore = tier.includes('A') ? 95 : tier.includes('B') ? 75 : tier.includes('C') ? 50 : 25;

      company.research = {
        summary: `AI analyzed ${company.name}: ${processedSignals.length} signals found.`,
        signals: processedSignals,
        purchaseIntent: tier.includes('A') || tier.includes('B') ? 'high' : 'medium',
        keyHooks: processedSignals.map((s: any) => s.evidence.snippet).filter(Boolean),
        updatedAt: new Date()
      } as any;

      company.score = {
        total: totalScore, tier,
        breakdown: {
          triggerScore: processedSignals.filter((s: any) => s.strength === 'trigger').length * 30,
          behaviorScore: processedSignals.filter((s: any) => s.strength === 'high').length * 20,
          structuralScore: processedSignals.length > 0 ? 50 : 20
        },
        reasons: processedSignals.map((s: any) => s.subType),
        updatedAt: new Date()
      } as any;

      company.status = 'scored';
      await company.save();

      run.progress.enrichment = (run.progress as any).enrichment + 1;
      run.progress.research = (run.progress as any).enrichment;
      run.progress.total = run.progress.discovery + (run.progress as any).enrichment;
      await run.save();

      res.json({
        company: { ...company.toObject(), id: company._id.toString() },
        signals: processedSignals, tier, score: totalScore,
        progress: run.progress
      });
    } catch (err: any) {
      console.error('[Enrich] Error:', err);
      res.status(500).json({ error: 'Enrichment failed', details: err.message });
    }
  });

  // --- Stage: Contact Mining (per company) ---
  app.post('/api/runs/:runId/contacts/:companyId', async (req, res) => {
    try {
      const run = await LeadRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found' });

      const company = await CompanyModel.findById(req.params.companyId);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const product = await ProductModel.findById(run.productId);
      const icp = product?.icpProfile;
      const targetTitles = icp?.targetTitles || ['Purchasing Manager', 'Technical Director', 'Plant Manager'];

      (run.progress as any).currentStage = 'contacts';
      await run.save();

      console.log(`[Contacts] Mining: ${company.name}`);

      let contacts: any[] = [];
      const skipGemini = req.query.skipGemini === 'true';
      let domain = company.domain || '';
      if (!domain && company.website) {
        try { domain = new URL(company.website).hostname.replace('www.', ''); } catch {}
      }

      // Tier 1: Gemini
      if (!skipGemini && canUseGemini()) {
        try {
          const ai = getGeminiAI();
          const contactResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Find key decision makers at "${company.name}" (${company.country}) for industrial equipment purchasing. Target roles: ${targetTitles.join(', ')}. For each: name, title, LinkedIn URL, email. Search LinkedIn and company website.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    title: { type: Type.STRING },
                    linkedinUrl: { type: Type.STRING },
                    email: { type: Type.STRING }
                  },
                  required: ['name', 'title']
                }
              }
            }
          });
          contacts = JSON.parse(contactResponse.text || '[]');
          recordGeminiUsage();
          console.log(`[Contacts] Gemini found ${contacts.length} contacts`);
        } catch (e: any) {
          console.log(`[Contacts] Gemini failed: ${e.message}`);
        }
      }

      // Tier 2: Brave + DashScope
      if (contacts.length === 0 && process.env.BRAVE_SEARCH_API_KEY) {
        try {
          const searchResults = await braveSearch(`"${company.name}" ${targetTitles.slice(0, 2).join(' OR ')} linkedin`, 8);
          const context = searchResults.map((r: any) => `- ${r.title}: ${r.description} (${r.url})`).join('\n');
          const parsePrompt = `From these results, extract contact persons at "${company.name}". Target roles: ${targetTitles.join(', ')}. For each: name, title, linkedinUrl, email. Return JSON array.\n\nResults:\n${context}`;
          const parseResult = await generateAIContent(parsePrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, title: { type: 'string' }, linkedinUrl: { type: 'string' }, email: { type: 'string' } } } },
            temperature: 0.3
          });
          contacts = parseResult.parsed || [];
          console.log(`[Contacts] Brave+DashScope found ${contacts.length} contacts`);
        } catch (e: any) {
          console.log(`[Contacts] Brave+DashScope failed: ${e.message}`);
        }
      }

      // Tier 3: DashScope generate likely contacts
      if (contacts.length === 0) {
        try {
          const emailDomain = domain || 'company.com';
          const fallbackPrompt = `For "${company.name}" in ${company.industry}, ${company.country}, generate 2-3 realistic decision maker profiles who would purchase ${product?.name || 'industrial equipment'}. For each: plausible name (common in ${company.country}), title, email (format: firstname.lastname@${emailDomain}). Return JSON array.`;
          const fallbackResult = await generateAIContent(fallbackPrompt, {
            responseSchema: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, title: { type: 'string' }, email: { type: 'string' } } } },
            temperature: 0.7
          });
          contacts = fallbackResult.parsed || [];
        } catch (e: any) {
          console.log(`[Contacts] DashScope failed: ${e.message}`);
        }
      }

      // Save contacts
      const savedContacts = contacts.map((c: any) => ({
        name: c.name || 'Unknown',
        title: c.title || 'Decision Maker',
        linkedinUrl: c.linkedinUrl || '',
        emailBest: c.email || '',
        emailCandidates: c.email ? [c.email] : [],
        emailStatus: c.email ? 'likely' : 'unverified',
        whatsappPossible: false,
        source: 'AI Mining',
        confidence: c.linkedinUrl ? 0.8 : c.email ? 0.6 : 0.4,
        createdAt: new Date()
      }));

      company.contacts = savedContacts as any;
      company.status = 'outreached';
      await company.save();

      run.progress.contact += savedContacts.length;
      run.progress.total = run.progress.discovery + (run.progress as any).enrichment + run.progress.contact;
      await run.save();

      res.json({ contacts: savedContacts, companyId: company._id.toString(), progress: run.progress });
    } catch (err: any) {
      console.error('[Contacts] Error:', err);
      res.status(500).json({ error: 'Contact mining failed', details: err.message });
    }
  });

  // --- Stage: Finalize Run ---
  app.post('/api/runs/:runId/finalize', async (req, res) => {
    try {
      const run = await LeadRunModel.findById(req.params.runId);
      if (!run) return res.status(404).json({ error: 'Run not found' });

      run.status = 'done';
      run.finishedAt = new Date();
      (run.progress as any).currentStage = 'done';
      await run.save();

      const companies = await CompanyModel.find({ leadRunId: run._id });
      res.json({
        run: { ...run.toObject(), id: run._id.toString() },
        summary: {
          totalCompanies: companies.length,
          enriched: companies.filter(c => c.status === 'scored' || c.status === 'outreached').length,
          withContacts: companies.filter(c => (c.contacts?.length || 0) > 0).length,
          tierA: companies.filter(c => (c.score as any)?.tier?.includes('Tier A')).length,
          tierB: companies.filter(c => (c.score as any)?.tier?.includes('Tier B')).length,
          tierC: companies.filter(c => (c.score as any)?.tier?.includes('Tier C')).length
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Finalize failed', details: err.message });
    }
  });

  // ==================== Companies ====================
  app.get('/api/companies', async (req, res) => {
    try {
      let query: any = {};
      if (req.query.runId) {
        query.leadRunId = req.query.runId;
      }
      const companies = await CompanyModel.find(query).sort({ createdAt: -1 });
      res.json(companies.map(c => ({ ...c.toObject(), id: c._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch companies', details: err.message });
    }
  });

  app.get('/api/companies/:id', async (req, res) => {
    try {
      const company = await CompanyModel.findById(req.params.id);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const obj = company.toObject();
      res.json({
        ...obj,
        id: obj._id.toString(),
        contacts: obj.contacts || [],
        research: obj.research || null,
        score: obj.score || null,
        outreach: obj.outreach || null,
        evidence: obj.evidence || []
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch company', details: err.message });
    }
  });

  // ==================== Social Media API ====================
  
  // Social Accounts
  app.get('/api/social/accounts', async (req, res) => {
    try {
      const accounts = await SocialAccountModel.find().sort({ createdAt: -1 });
      res.json(accounts.map(a => ({
        ...a.toObject(),
        id: a._id.toString(),
        // Strip tokens from response
        accessToken: undefined,
        refreshToken: undefined
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch social accounts', details: err.message });
    }
  });

  // Social Posts
  app.get('/api/social/posts', async (req, res) => {
    try {
      const { status, platform } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (platform) query.platforms = platform;

      const posts = await SocialPostModel.find(query).sort({ createdAt: -1 }).limit(50);
      res.json(posts.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch posts', details: err.message });
    }
  });

  app.post('/api/social/posts', async (req, res) => {
    try {
      const { content, platforms, scheduledFor, mediaUrls, tags } = req.body;
      if (!content || !platforms || platforms.length === 0) {
        return res.status(400).json({ error: 'Content and platforms are required' });
      }

      const status = scheduledFor ? 'scheduled' : 'published';
      const post = await SocialPostModel.create({
        content,
        platforms,
        mediaUrls: mediaUrls || [],
        tags: tags || [],
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        publishedAt: !scheduledFor ? new Date() : undefined,
        metrics: !scheduledFor ? {
          impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0, engagementRate: 0
        } : undefined
      });

      res.json({ ...post.toObject(), id: post._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create post', details: err.message });
    }
  });

  app.get('/api/social/posts/:id', async (req, res) => {
    try {
      const post = await SocialPostModel.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json({ ...post.toObject(), id: post._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch post', details: err.message });
    }
  });

  app.put('/api/social/posts/:id', async (req, res) => {
    try {
      const post = await SocialPostModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json({ ...post.toObject(), id: post._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update post', details: err.message });
    }
  });

  app.delete('/api/social/posts/:id', async (req, res) => {
    try {
      const post = await SocialPostModel.findByIdAndDelete(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete post', details: err.message });
    }
  });

  // Social Analytics
  app.get('/api/social/analytics/overview', async (req, res) => {
    try {
      const totalPosts = await SocialPostModel.countDocuments({ status: 'published' });
      const scheduledPosts = await SocialPostModel.countDocuments({ status: 'scheduled' });
      
      const publishedPosts = await SocialPostModel.find({ status: 'published' });
      let totalImpressions = 0;
      let totalEngagement = 0;
      for (const post of publishedPosts) {
        if (post.metrics) {
          totalImpressions += post.metrics.impressions;
          totalEngagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
        }
      }

      const accounts = await SocialAccountModel.find();
      const connectedAccounts = accounts.filter(a => a.status === 'active').length;

      res.json({
        totalPosts,
        scheduledPosts,
        totalImpressions,
        totalEngagement,
        connectedAccounts,
        totalAccounts: accounts.length
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
    }
  });

  app.get('/api/social/analytics/engagement', async (req, res) => {
    try {
      const metrics = await SocialMetricModel.find()
        .sort({ metricDate: -1 })
        .limit(30);
      res.json(metrics.map(m => ({ ...m.toObject(), id: m._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch engagement data', details: err.message });
    }
  });

  // ==================== PR Articles CRUD ====================

  app.get('/api/pr/articles', async (req, res) => {
    try {
      const { status, category } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (category) query.category = category;

      const articles = await PRArticleModel.find(query).sort({ createdAt: -1 }).limit(50);
      res.json(articles.map(a => ({ ...a.toObject(), id: a._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch PR articles', details: err.message });
    }
  });

  app.post('/api/pr/articles', async (req, res) => {
    try {
      const { title, subtitle, body, category, keywords, aboutCompany, sourceContentAssetId } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }

      const article = await PRArticleModel.create({
        title,
        subtitle,
        body,
        category: category || 'news-release',
        status: 'draft',
        keywords: keywords || [],
        aboutCompany,
        sourceContentAssetId,
        distributions: []
      });

      res.json({ ...article.toObject(), id: article._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create PR article', details: err.message });
    }
  });

  app.get('/api/pr/articles/:id', async (req, res) => {
    try {
      const article = await PRArticleModel.findById(req.params.id);
      if (!article) return res.status(404).json({ error: 'PR article not found' });
      res.json({ ...article.toObject(), id: article._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch PR article', details: err.message });
    }
  });

  app.put('/api/pr/articles/:id', async (req, res) => {
    try {
      const article = await PRArticleModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!article) return res.status(404).json({ error: 'PR article not found' });
      res.json({ ...article.toObject(), id: article._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update PR article', details: err.message });
    }
  });

  app.delete('/api/pr/articles/:id', async (req, res) => {
    try {
      const article = await PRArticleModel.findByIdAndDelete(req.params.id);
      if (!article) return res.status(404).json({ error: 'PR article not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete PR article', details: err.message });
    }
  });

  // PR Distribution tracking
  app.post('/api/pr/articles/:id/distribute', async (req, res) => {
    try {
      const { platform, distributionUrl } = req.body;
      if (!platform) return res.status(400).json({ error: 'Platform is required' });

      const article = await PRArticleModel.findById(req.params.id);
      if (!article) return res.status(404).json({ error: 'PR article not found' });

      article.distributions.push({
        platform,
        distributedAt: new Date(),
        distributionUrl,
        status: 'pending'
      });
      article.status = 'distributed';
      await article.save();

      res.json({ ...article.toObject(), id: article._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record distribution', details: err.message });
    }
  });

  // ==================== AI Content Rewrite Engine ====================

  app.post('/api/content/rewrite', async (req, res) => {
    try {
      const { sourceText, targetFormat, platform, tone, maxLength } = req.body;
      if (!sourceText || !targetFormat) {
        return res.status(400).json({ error: 'sourceText and targetFormat are required' });
      }

      const platformHint = platform ? `目标平台: ${platform}` : '';
      const toneHint = tone ? `语调风格: ${tone}` : '语调风格: 专业商务';
      const lengthHint = maxLength ? `字数限制: 不超过${maxLength}字` : '';

      const prompt = `你是一位跨境B2B内容营销专家。请将以下长文内容改写为 ${targetFormat} 格式的短内容。
${platformHint}
${toneHint}
${lengthHint}

原文内容：
${sourceText}

要求：
1. 保留核心卖点和关键数据
2. 适配目标平台的内容风格和长度限制
3. 加入行动号召(CTA)
4. 如果是社交媒体帖子，建议合适的 hashtags
5. 返回JSON: { "rewritten": "改写后的内容", "hashtags": ["tag1","tag2"], "cta": "行动号召语", "wordCount": 数字 }`;

      const { parsed: result } = await generateAIContent(prompt, {
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewritten: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            cta: { type: Type.STRING },
            wordCount: { type: Type.NUMBER }
          },
          required: ['rewritten']
        }
      });

      if (!result) throw new Error('AI returned empty response');

      res.json({
        rewritten: result.rewritten,
        hashtags: result.hashtags || [],
        cta: result.cta || '',
        wordCount: result.wordCount || result.rewritten.length,
        sourceLength: sourceText.length,
        targetFormat,
        platform: platform || 'general'
      });
    } catch (err: any) {
      console.error('Content rewrite error:', err);
      res.status(500).json({ error: 'AI rewrite failed', details: err.message });
    }
  });

  // ==================== PR Generation from ContentAsset ====================

  app.post('/api/pr/generate-from-asset', async (req, res) => {
    try {
      const { assetTitle, assetBody, category, companyName, keywords } = req.body;
      if (!assetBody) {
        return res.status(400).json({ error: 'assetBody is required' });
      }

      const catLabel = category === 'case-study' ? '客户案例稿' : category === 'industry-article' ? '行业分析文' : '新闻通稿';

      const prompt = `你是一位专业的B2B公关撰稿人。请根据以下营销素材，生成一篇${catLabel}。

素材标题：${assetTitle || '(无标题)'}
素材内容：
${assetBody}

公司名称：${companyName || '(请使用通用企业称呼)'}
关键词：${(keywords || []).join(', ') || '(无)'}

要求：
1. 符合${catLabel}的行业标准格式和语调
2. 标题要有新闻价值和吸引力
3. 正文800-1200字，结构清晰
4. 包含合适的副标题
5. 末尾附企业简介段落
6. 返回JSON: { "title": "标题", "subtitle": "副标题", "body": "正文", "aboutCompany": "企业简介段", "keywords": ["关键词1","关键词2"] }`;

      const { parsed: result } = await generateAIContent(prompt, {
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            body: { type: Type.STRING },
            aboutCompany: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'body']
        }
      });

      if (!result) throw new Error('AI returned empty response');

      // Persist as draft PR article
      const article = await PRArticleModel.create({
        title: result.title,
        subtitle: result.subtitle || '',
        body: result.body,
        category: category || 'news-release',
        status: 'draft',
        keywords: result.keywords || keywords || [],
        aboutCompany: result.aboutCompany || '',
        distributions: []
      });

      res.json({
        ...article.toObject(),
        id: article._id.toString(),
        _generated: true
      });
    } catch (err: any) {
      console.error('PR generation error:', err);
      res.status(500).json({ error: 'AI PR generation failed', details: err.message });
    }
  });

  // ==================== LinkedIn OAuth (Placeholder/Mock) ====================

  app.get('/api/auth/linkedin/authorize', (req, res) => {
    try {
      const config = getLinkedInOAuthConfig();
      if (!config.clientId) {
        // Mock mode: return simulated auth URL
        return res.json({
          authUrl: '/api/auth/linkedin/callback?code=mock_code&state=mock_state',
          state: 'mock_state',
          mock: true,
          message: 'LinkedIn OAuth is in mock mode. Set LINKEDIN_CLIENT_ID to enable real OAuth.'
        });
      }
      const { authUrl, state } = getLinkedInAuthorizationUrl(config);
      res.json({ authUrl, state, mock: false });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate LinkedIn auth URL', details: err.message });
    }
  });

  app.get('/api/auth/linkedin/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).json({ error: 'Authorization code is required' });

      const config = getLinkedInOAuthConfig();
      if (!config.clientId) {
        // Mock mode: create a mock account
        const mockAccount = await SocialAccountModel.create({
          platform: 'linkedin',
          accountHandle: '@mock_linkedin',
          accountName: 'Mock LinkedIn Account',
          status: 'active',
          accessToken: 'mock_access_token',
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        });
        return res.json({
          success: true,
          mock: true,
          account: { ...mockAccount!.toObject(), id: mockAccount!._id.toString() }
        });
      }

      const tokenData = await exchangeLinkedInCode(code as string, config);
      const account = await SocialAccountModel.create({
        platform: 'linkedin',
        accountHandle: '@linkedin_user',
        accountName: 'LinkedIn Account',
        status: 'active',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });

      res.json({
        success: true,
        mock: false,
        account: { ...account!.toObject(), id: account!._id.toString() }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'LinkedIn OAuth callback failed', details: err.message });
    }
  });

  // ==================== Knowledge Engine AI ====================
  app.post('/api/knowledge/extract', async (req, res) => {
    try {
      const { text, sourceName } = req.body;
      if (!text) return res.status(400).json({ error: 'Text content is required' });

      const { parsed: result } = await generateAIContent(
        `你是一个专业的工业数据分析师。请从以下技术文本中提取关键信息，并将其转化为结构化的知识卡片。
        
文本内容：
${text}

要求：
1. 识别这属于"产品服务 (Offering)"还是"企业画像 (Company)"还是"案例证明 (Proof)"。
2. 提取至少3个核心字段。
3. 识别可能的缺失字段及其对业务的影响。
4. 返回符合定义的JSON结构。`,
        { responseSchema: schemas.knowledgeExtractionSchema }
      );

      if (!result) throw new Error('AI returned empty response');

      res.json({
        id: `k-${Date.now()}`,
        ...result,
        missingFields: result.missingFields || [],
        evidence: [{ sourceId: `src-${Date.now()}`, sourceName: sourceName || '手动粘贴文本' }]
      });
    } catch (error: any) {
      console.error('Knowledge extraction error:', error);
      res.status(500).json({ error: 'AI extraction failed', details: error.message });
    }
  });

  // ==================== Document Parsing API ====================
  app.post('/api/knowledge/parse-document', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, buffer } = req.file;
      console.log(`[Document Parser] Processing: ${originalname} (${buffer.length} bytes)`);

      const result = await parseDocument(buffer, originalname);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Document parsing failed', 
          details: result.metadata?.error || 'Unknown error',
          format: result.format
        });
      }

      // Truncate very long texts for AI processing (limit ~100k chars)
      const maxLength = 100000;
      const text = result.text.length > maxLength 
        ? result.text.substring(0, maxLength) + '\n\n[Content truncated due to length]'
        : result.text;

      res.json({
        success: true,
        filename: originalname,
        format: result.format,
        text,
        metadata: {
          ...result.metadata,
          originalLength: result.text.length,
          truncated: result.text.length > maxLength
        }
      });
    } catch (error: any) {
      console.error('Document parsing error:', error);
      res.status(500).json({ error: 'Document parsing failed', details: error.message });
    }
  });

  // Get supported document formats
  app.get('/api/knowledge/supported-formats', (req, res) => {
    res.json({
      formats: getSupportedFormats(),
      maxFileSize: '50MB'
    });
  });

  // ==================== Intelligent Product Research API ====================
  app.post('/api/knowledge/research', async (req, res) => {
    try {
      const { productName, productDescription, existingCertifications, targetMarkets } = req.body;
      if (!productName) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      console.log(`[Product Research] Starting research for: ${productName}`);
      
      // Try Gemini with web search first, fall back if quota exceeded or daily limit reached
      let useGemini = canUseGemini();
      let ai: any;
      
      if (useGemini) {
        try {
          ai = getGeminiAI();
        } catch (e) {
          console.log('[Research] Gemini init failed, using fallback...');
          useGemini = false;
        }
      } else {
        console.log(`[Research] Gemini skipped (daily limit ${geminiUsage.count}/${GEMINI_DAILY_LIMIT} or key missing)`);
      }

      // Wrap Gemini calls in try-catch to enable fallback
      try {
        if (!useGemini) throw new Error('Fallback mode');

        // Step 1: Translate and get international terminology
        console.log('[Research Phase 1] Translating product name and getting international terms...');
        const terminologyResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Translate this Chinese industrial product name to English and provide alternative international terminology:
产品名称: ${productName}
产品描述: ${productDescription || '无'}

Return a JSON object with:
- productNameEN: English product name
- alternativeTerms: array of alternative English terms used internationally (e.g., different industry terms, abbreviations)
- hsCode: likely HS code category if applicable
- industryCategory: the industry this product belongs to`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productNameEN: { type: Type.STRING },
                alternativeTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                hsCode: { type: Type.STRING },
                industryCategory: { type: Type.STRING }
              },
              required: ['productNameEN', 'alternativeTerms', 'industryCategory']
            }
          }
        });
        const terminology = JSON.parse(terminologyResponse.text || '{}');
        console.log(`[Research] English name: ${terminology.productNameEN}`);

      // Step 2: Search for competitive landscape (English world)
      console.log('[Research Phase 2] Searching competitive landscape in English...');
      const competitorResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Search for the top international manufacturers and competitors for: "${terminology.productNameEN}" (also known as: ${terminology.alternativeTerms?.join(', ')}).

Find 3-5 major global players in this industry. For each competitor, provide:
- Company name
- Country of origin
- Key strengths
- Approximate price positioning
- Website if available

Focus on established international brands that a Chinese manufacturer would compete against.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                country: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                priceRange: { type: Type.STRING },
                website: { type: Type.STRING }
              },
              required: ['name', 'country']
            }
          }
        }
      });
      const competitors = JSON.parse(competitorResponse.text || '[]');
      console.log(`[Research] Found ${competitors.length} competitors`);

      // Step 3: Search for certification requirements
      console.log('[Research Phase 3] Searching certification requirements...');
      const certResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `What certifications and standards are required or recommended for exporting "${terminology.productNameEN}" to international markets (especially EU, US, and other major markets)?

Consider:
- Mandatory certifications for market entry
- Quality standards (ISO, industry-specific)
- Safety certifications
- Environmental/sustainability certifications

The manufacturer is based in China and wants to export. Target markets: ${targetMarkets?.join(', ') || 'Europe, North America, Southeast Asia'}`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                region: { type: Type.STRING },
                importance: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedTime: { type: Type.STRING },
                estimatedCost: { type: Type.STRING }
              },
              required: ['name', 'region', 'importance']
            }
          }
        }
      });
      const certifications = JSON.parse(certResponse.text || '[]');
      console.log(`[Research] Found ${certifications.length} certification requirements`);

      // Step 4: Search for sales channels and platforms
      console.log('[Research Phase 4] Searching sales channels...');
      const channelResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `What are the best sales channels and platforms for a Chinese manufacturer to sell "${terminology.productNameEN}" internationally?

Consider:
- IMPORTANT: Do NOT recommend B2B marketplaces like Alibaba International, Made-in-China, Global Sources, DHgate, or similar Chinese export platforms. These are traffic middlemen with no weight in industrial categories.
- Industry directories (Kompass, Europages, ThomasNet)
- Trade shows and exhibitions
- Independent website / SEO
- LinkedIn social selling
- Government procurement / tenders
- Direct sales and distribution partnerships

Rank by effectiveness for this product category.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                region: { type: Type.STRING },
                priority: { type: Type.STRING },
                notes: { type: Type.STRING },
                website: { type: Type.STRING }
              },
              required: ['name', 'type', 'priority']
            }
          }
        }
      });
      const channels = JSON.parse(channelResponse.text || '[]');

      // Step 5: Search for relevant exhibitions
      console.log('[Research Phase 5] Searching exhibitions...');
      const exhibitionResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Find the most important international trade shows and exhibitions for "${terminology.productNameEN}" in the ${terminology.industryCategory} industry.

Look for exhibitions in 2025-2026. Include:
- Major global shows
- Regional shows in target markets (EU, US, Southeast Asia)
- Industry-specific events`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                location: { type: Type.STRING },
                timing: { type: Type.STRING },
                relevance: { type: Type.STRING },
                website: { type: Type.STRING }
              },
              required: ['name', 'location']
            }
          }
        }
      });
      const exhibitions = JSON.parse(exhibitionResponse.text || '[]');

      // Step 6: Search for industry trends (both CN and EN)
      console.log('[Research Phase 6] Searching industry trends...');
      const trendResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `What are the current trends and future outlook for the "${terminology.productNameEN}" market?

Search for:
- Technology trends
- Market growth projections
- Emerging requirements (sustainability, smart features, etc.)
- New application areas
- Supply chain shifts

Search in both English and Chinese sources for comprehensive coverage.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                trend: { type: Type.STRING },
                impact: { type: Type.STRING },
                opportunity: { type: Type.STRING },
                source: { type: Type.STRING }
              },
              required: ['trend', 'impact']
            }
          }
        }
      });
      const trends = JSON.parse(trendResponse.text || '[]');

      // Step 7: Generate final strategy and action items
      console.log('[Research Phase 7] Generating export strategy...');
      const strategyResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Based on the following research for a Chinese manufacturer of "${productName}" (${terminology.productNameEN}):

竞争对手: ${JSON.stringify(competitors.slice(0, 3))}
认证要求: ${JSON.stringify(certifications.slice(0, 5))}
销售渠道: ${JSON.stringify(channels.slice(0, 5))}
行业趋势: ${JSON.stringify(trends.slice(0, 3))}
企业现有认证: ${existingCertifications?.join(', ') || '未知'}

请生成：
1. 市场定位建议（高端/中端/性价比路线）
2. 差异化策略（中国制造的独特优势）
3. 优先行动项（P0/P1/P2级别，包括认证、渠道、展会、产品优化方向）

用中文回答，要具体、可执行。`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketPositioning: {
                type: Type.OBJECT,
                properties: {
                  suggestedPosition: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  targetRegions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['suggestedPosition', 'reasoning']
              },
              differentiationStrategy: {
                type: Type.OBJECT,
                properties: {
                  uniqueSellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  priceAdvantage: { type: Type.STRING },
                  customizationCapability: { type: Type.STRING },
                  suggestedApproach: { type: Type.STRING }
                },
                required: ['uniqueSellingPoints', 'suggestedApproach']
              },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    category: { type: Type.STRING },
                    deadline: { type: Type.STRING }
                  },
                  required: ['action', 'priority', 'category']
                }
              }
            },
            required: ['marketPositioning', 'differentiationStrategy', 'actionItems']
          }
        }
      });
      const strategy = JSON.parse(strategyResponse.text || '{}');

      // Compile final result
      const result = {
        productNameCN: productName,
        productNameEN: terminology.productNameEN,
        internationalTerms: terminology.alternativeTerms || [],
        industryCategory: terminology.industryCategory,
        hsCode: terminology.hsCode,
        marketPositioning: strategy.marketPositioning,
        competitorAnalysis: competitors,
        certifications: {
          required: certifications.map((c: any) => ({
            ...c,
            importance: c.importance === 'Mandatory' || c.importance === '必备' ? '必备' :
                       c.importance === 'Recommended' || c.importance === '强烈建议' ? '强烈建议' : '加分项'
          })),
          current: existingCertifications || [],
          gaps: certifications
            .filter((c: any) => c.importance === 'Mandatory' || c.importance === '必备')
            .filter((c: any) => !existingCertifications?.includes(c.name))
            .map((c: any) => c.name)
        },
        channels: channels.map((ch: any) => ({
          ...ch,
          type: ch.type === 'B2B Platform' ? '行业目录' : ch.type === 'Directory' ? '行业目录' :
                ch.type === 'Exhibition' ? '行业展会' :
                ch.type === 'Direct' ? '直销' : ch.type,
          priority: ch.priority === 'High' ? '高' :
                   ch.priority === 'Medium' ? '中' : ch.priority
        })),
        exhibitions: exhibitions,
        trends: trends,
        differentiationStrategy: strategy.differentiationStrategy,
        actionItems: strategy.actionItems,
        researchedAt: new Date().toISOString()
      };

      console.log(`[Product Research] Completed research for: ${productName}`);
      recordGeminiUsage();
      res.json(result);

      } catch (geminiError: any) {
        // Gemini failed (quota, rate limit, etc.) - try Brave+DashScope
        console.log(`[Product Research] Gemini failed: ${geminiError.message}, trying Brave+DashScope...`);
        
        try {
          // Tier 2: Brave Search + DashScope
          if (!process.env.BRAVE_SEARCH_API_KEY) throw new Error('BRAVE_SEARCH_API_KEY not configured');
          const braveResult = await braveProductResearch(productName, productDescription, targetMarkets);
          console.log(`[Product Research] Brave+DashScope completed for: ${productName}`);
          res.json(braveResult);
        } catch (braveError: any) {
          console.log(`[Product Research] Brave+DashScope failed: ${braveError.message}, using pure DashScope...`);
          
          try {
            // Tier 3: Pure DashScope (offline, no web search)
            const fallbackResult = await fallbackProductResearch(productName, productDescription, targetMarkets);
            console.log(`[Product Research] Pure DashScope fallback completed for: ${productName}`);
            res.json(fallbackResult);
          } catch (fallbackError: any) {
            console.error('[Product Research] All providers failed:', fallbackError);
            throw fallbackError;
          }
        }
      }

    } catch (error: any) {
      console.error('[Product Research] Error:', error);
      
      // Check for quota exceeded error
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({ 
          error: 'API调用配额已用尽', 
          details: 'Gemini API 免费配额已达上限。请稍后重试，或联系管理员升级API配额。',
          code: 'QUOTA_EXCEEDED'
        });
      }
      
      // Check for rate limit
      if (error.message?.includes('rate') || error.message?.includes('Too Many Requests')) {
        return res.status(429).json({ 
          error: '请求过于频繁', 
          details: '请稍等片刻后重试。',
          code: 'RATE_LIMITED'
        });
      }
      
      res.status(500).json({ 
        error: 'Product research failed', 
        details: error.message 
      });
    }
  });

  // ==================== Decomposed Research Stage Endpoints ====================
  // Each stage completes in <10s to fit Vercel Hobby timeout

  // Stage 1: Terminology Translation (~3s, no web search needed)
  app.post('/api/knowledge/research/terminology', async (req, res) => {
    try {
      const { productName, productDescription } = req.body;
      if (!productName) return res.status(400).json({ error: 'productName is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageTerminology(productName, productDescription, skipGemini);
      res.json({ stage: 'terminology', ...result });
    } catch (error: any) {
      console.error('[Stage1-Terminology] Error:', error.message);
      res.status(500).json({ error: 'Terminology stage failed', details: error.message });
    }
  });

  // Stage 2: Competitor Analysis (~5-8s with web search)
  app.post('/api/knowledge/research/competitors', async (req, res) => {
    try {
      const { productNameEN, alternativeTerms } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageCompetitors(productNameEN, alternativeTerms, skipGemini);
      res.json({ stage: 'competitors', ...result });
    } catch (error: any) {
      console.error('[Stage2-Competitors] Error:', error.message);
      res.status(500).json({ error: 'Competitors stage failed', details: error.message });
    }
  });

  // Stage 3: Certification Requirements (~5-8s with web search)
  app.post('/api/knowledge/research/certifications', async (req, res) => {
    try {
      const { productNameEN, targetMarkets } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageCertifications(productNameEN, targetMarkets, skipGemini);
      res.json({ stage: 'certifications', ...result });
    } catch (error: any) {
      console.error('[Stage3-Certifications] Error:', error.message);
      res.status(500).json({ error: 'Certifications stage failed', details: error.message });
    }
  });

  // Stage 4: Sales Channels (~5-8s with web search)
  app.post('/api/knowledge/research/channels', async (req, res) => {
    try {
      const { productNameEN, industryCategory } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageChannels(productNameEN, industryCategory, skipGemini);
      res.json({ stage: 'channels', ...result });
    } catch (error: any) {
      console.error('[Stage4-Channels] Error:', error.message);
      res.status(500).json({ error: 'Channels stage failed', details: error.message });
    }
  });

  // Stage 5: Industry Exhibitions (~5-8s with web search)
  app.post('/api/knowledge/research/exhibitions', async (req, res) => {
    try {
      const { productNameEN, industryCategory } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageExhibitions(productNameEN, industryCategory, skipGemini);
      res.json({ stage: 'exhibitions', ...result });
    } catch (error: any) {
      console.error('[Stage5-Exhibitions] Error:', error.message);
      res.status(500).json({ error: 'Exhibitions stage failed', details: error.message });
    }
  });

  // Stage 6: Industry Trends (~5-8s with web search)
  app.post('/api/knowledge/research/trends', async (req, res) => {
    try {
      const { productNameEN, industryCategory } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageTrends(productNameEN, industryCategory, skipGemini);
      res.json({ stage: 'trends', ...result });
    } catch (error: any) {
      console.error('[Stage6-Trends] Error:', error.message);
      res.status(500).json({ error: 'Trends stage failed', details: error.message });
    }
  });

  // Stage 7: Export Strategy Synthesis (~5s, no web search)
  app.post('/api/knowledge/research/strategy', async (req, res) => {
    try {
      const { productName, productNameEN, competitors, certifications, channels, trends, existingCertifications } = req.body;
      if (!productNameEN) return res.status(400).json({ error: 'productNameEN is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageStrategy(productName, productNameEN, competitors, certifications, channels, trends, existingCertifications, skipGemini);
      res.json({ stage: 'strategy', ...result });
    } catch (error: any) {
      console.error('[Stage7-Strategy] Error:', error.message);
      res.status(500).json({ error: 'Strategy stage failed', details: error.message });
    }
  });


  // Stage 8: Deep ICP Profile Generation (from Knowledge Engine ExportStrategy)
  app.post('/api/knowledge/research/icp', async (req, res) => {
    try {
      const { exportStrategy, productName } = req.body;
      if (!exportStrategy) return res.status(400).json({ error: 'exportStrategy is required' });
      const skipGemini = req.query.skipGemini === 'true';
      const result = await stageICP(exportStrategy, productName || exportStrategy.productNameCN || '未知产品', skipGemini);
      
      // Add metadata
      const icpWithMeta = {
        ...result.data,
        version: 1,
        updatedAt: new Date().toISOString(),
        sourceData: {
          fromKnowledgeEngine: true,
          generatedAt: new Date().toISOString()
        }
      };
      
      res.json({ stage: 'icp', data: icpWithMeta, source: result.source, geminiAvailable: result.geminiAvailable });
    } catch (error: any) {
      console.error('[Stage8-ICP] Error:', error.message);
      res.status(500).json({ error: 'ICP generation failed', details: error.message });
    }
  });

  // ==================== URL Fetch API ====================
  app.post('/api/knowledge/fetch-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      console.log(`[URL Fetch] Fetching: ${url}`);

      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VertaX-Bot/1.0; +https://vertax.top)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse HTML and extract text
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      
      // Remove non-content elements
      $('script, style, nav, footer, header, aside, iframe, noscript').remove();
      
      // Try to find main content
      let mainContent = $('main, article, .content, .main-content, #content, #main').first();
      if (mainContent.length === 0) {
        mainContent = $('body');
      }
      
      // Extract text
      const text = mainContent.text()
        .replace(/\s+/g, ' ')
        .trim();
      
      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   parsedUrl.hostname;

      if (text.length < 50) {
        return res.status(400).json({ 
          error: 'Insufficient content', 
          details: 'Page contains too little text to extract meaningful knowledge'
        });
      }

      res.json({
        success: true,
        url,
        title,
        text: text.substring(0, 100000), // Limit to 100k chars
        metadata: {
          originalLength: text.length,
          truncated: text.length > 100000
        }
      });
    } catch (error: any) {
      console.error('URL fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch URL', details: error.message });
    }
  });

  // ==================== Marketing Content Generation AI ====================
  app.post('/api/content/generate', async (req, res) => {
    try {
      const { contentType, knowledgeCards: cards, language = 'English' } = req.body;
      if (!cards || cards.length === 0) return res.status(400).json({ error: 'Knowledge cards are required' });

      const { parsed: result } = await generateAIContent(
        `You are a professional B2B industrial content marketing expert. Generate a ${contentType || 'Procurement Guide'} based on the following knowledge cards.
        
Target Language: ${language}
Knowledge Source:
${JSON.stringify(cards, null, 2)}

Requirements:
1. Write the content in ${language}. This is for overseas markets - NEVER use Chinese unless explicitly requested.
2. Never fabricate facts. If key parameters are missing (e.g., pressure, temperature, specific certifications), mark them in the text as [TO BE FILLED: field name].
3. Identify what additional fields are needed to complete this content.
4. Return structured JSON with title, body paragraphs, and field reference tracking.
5. Use professional industry terminology appropriate for the target market.`,
        { responseSchema: schemas.contentGenerationSchema }
      );

      if (!result) throw new Error('AI returned empty response');
      res.json(result);
    } catch (error: any) {
      console.error('Content generation error:', error);
      res.status(500).json({ error: 'Content generation failed', details: error.message });
    }
  });

  // ==================== AI Chat (Strategic Home) ====================
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, role, context } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      // Gather real system context
      const productCount = await ProductModel.countDocuments();
      const runCount = await LeadRunModel.countDocuments();
      const companyCount = await CompanyModel.countDocuments();
      const postCount = await SocialPostModel.countDocuments({ status: 'published' });
      const products = await ProductModel.find().limit(3);

      const { content: reply } = await generateAIContent(
        `用户提问: ${message}`,
        {
          systemPrompt: `你是 VertaX 出海获客智能体，为制造企业出海提供增长战略建议。
当前系统数据：
- 已建模产品: ${productCount} 个
- 已执行获客任务: ${runCount} 次
- 已发现潜在客户: ${companyCount} 家
- 已发布社交内容: ${postCount} 条
- 产品列表: ${products.map(p => p.name).join(', ')}
当前用户角色: ${role || 'CEO'}

请以专业的出海获客顾问身份回答，简洁精炼，提供可执行的建议。如涉及系统功能，可引导用户使用相关模块。回答使用中文。`
        }
      );

      res.json({ reply: reply || '抱歉，我暂时无法处理这个请求。' });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Chat failed', details: error.message });
    }
  });

  // ==================== AI Outreach Generation ====================
  app.post('/api/companies/:id/outreach/generate', async (req, res) => {
    try {
      const company = await CompanyModel.findById(req.params.id);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const { parsed: outreach } = await generateAIContent(
        `You are an expert B2B outreach copywriter for industrial automation. Generate personalized outreach messages for this prospect:

COMPANY: ${company.name}
INDUSTRY: ${company.industry}
COUNTRY: ${company.country}
NOTES: ${company.notes || 'N/A'}
RESEARCH: ${JSON.stringify(company.research || {}, null, 2)}
SCORE: ${JSON.stringify(company.score || {}, null, 2)}

Generate 2 email variants (A/B) and 1 WhatsApp message. 
- Email A: Focus on the strongest pain point/signal detected.
- Email B: Focus on quick ROI / easy implementation angle.
- WhatsApp: Short, casual, reference one specific insight.
All emails should cite specific evidence found about the company.`,
        { responseSchema: schemas.outreachSchema }
      );

      if (!outreach) throw new Error('AI returned empty response');

      company.outreach = { ...outreach, updatedAt: new Date() } as any;
      company.status = 'outreached';
      await company.save();

      res.json(outreach);
    } catch (error: any) {
      console.error('Outreach generation error:', error);
      res.status(500).json({ error: 'Outreach generation failed', details: error.message });
    }
  });

  // ==================== Dashboard Stats ====================
  app.get('/api/stats/dashboard', async (req, res) => {
    try {
      const productCount = await ProductModel.countDocuments();
      const runCount = await LeadRunModel.countDocuments();
      const runningRuns = await LeadRunModel.countDocuments({ status: 'running' });
      const doneRuns = await LeadRunModel.countDocuments({ status: 'done' });
      const companyCount = await CompanyModel.countDocuments();
      const scoredCompanies = await CompanyModel.countDocuments({ status: 'scored' });
      const outreachedCompanies = await CompanyModel.countDocuments({ status: 'outreached' });
      const publishedPosts = await SocialPostModel.countDocuments({ status: 'published' });
      const scheduledPosts = await SocialPostModel.countDocuments({ status: 'scheduled' });

      // Calculate total engagement from published posts
      const posts = await SocialPostModel.find({ status: 'published' });
      let totalImpressions = 0;
      let totalEngagement = 0;
      for (const post of posts) {
        if (post.metrics) {
          totalImpressions += post.metrics.impressions;
          totalEngagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
        }
      }

      res.json({
        products: productCount,
        runs: { total: runCount, running: runningRuns, done: doneRuns },
        companies: { total: companyCount, scored: scoredCompanies, outreached: outreachedCompanies },
        social: { published: publishedPosts, scheduled: scheduledPosts, impressions: totalImpressions, engagement: totalEngagement },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
    }
  });

  // ==================== OAuth Placeholder Routes ====================
  app.get('/api/auth/x/authorize', (req, res) => {
    // TODO: Implement X OAuth 2.0 PKCE flow
    res.json({ message: 'X OAuth not yet configured', authUrl: null });
  });

  app.get('/api/auth/x/callback', (req, res) => {
    res.json({ message: 'X OAuth callback not yet configured' });
  });

  app.get('/api/auth/facebook/authorize', (req, res) => {
    // TODO: Implement Facebook OAuth flow
    res.json({ message: 'Facebook OAuth not yet configured', authUrl: null });
  });

  app.get('/api/auth/facebook/callback', (req, res) => {
    res.json({ message: 'Facebook OAuth callback not yet configured' });
  });

  // ==================== Integration Status ====================
  app.get('/api/integrations', async (req, res) => {
    try {
      const { ApiIntegration } = await import('./models/ApiIntegration');
      const integrations = await ApiIntegration.find();
      res.json(integrations.map(i => ({
        ...i.toObject(),
        id: i._id.toString(),
        credentials: undefined // Strip credentials
      })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch integrations', details: err.message });
    }
  });

  // ==================== SEO Content Hub API ====================

  // --- Keyword Clusters ---

  // Extract keywords from ExportStrategy research data
  app.post('/api/seo/keywords/extract', async (req, res) => {
    try {
      const { exportStrategy, productName } = req.body;
      if (!exportStrategy) return res.status(400).json({ error: 'exportStrategy data is required' });

      const prompt = `You are an SEO keyword research expert for B2B industrial products. Analyze this export strategy research data and extract SEO keyword clusters.

Product: ${productName || exportStrategy.productNameEN || 'Unknown'}
English Name: ${exportStrategy.productNameEN || ''}
International Terms: ${(exportStrategy.internationalTerms || []).join(', ')}
Industry: ${exportStrategy.industryCategory || ''}
Competitors: ${(exportStrategy.competitorAnalysis || []).map((c: any) => c.name).join(', ')}
Trends: ${(exportStrategy.trends || []).map((t: any) => typeof t === 'string' ? t : t.trend).join(', ')}
Action Items: ${(exportStrategy.actionItems || []).map((a: any) => a.action).join(', ')}

Generate 3-5 keyword clusters, each with:
1. A descriptive cluster name
2. A primary keyword (highest search potential)
3. 5-8 related keywords with estimated search volume, competition level, and search intent

Focus on:
- Product-specific keywords (what buyers search for)
- Problem/solution keywords (pain points)
- Comparison keywords (vs competitors)
- Industry application keywords
- Long-tail buying-intent keywords

Return JSON array of clusters.`;

      const { parsed: clusters } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              primaryKeyword: { type: 'string' },
              relatedKeywords: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    keyword: { type: 'string' },
                    searchVolume: { type: 'string' },
                    competition: { type: 'string' },
                    searchIntent: { type: 'string' },
                    priority: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        temperature: 0.5
      });

      if (!clusters || clusters.length === 0) throw new Error('AI returned empty clusters');

      // Save to DB
      const saved = [];
      for (const c of clusters) {
        const cluster = await KeywordCluster.create({
          name: c.name,
          primaryKeyword: c.primaryKeyword,
          relatedKeywords: (c.relatedKeywords || []).map((rk: any) => ({
            keyword: rk.keyword,
            searchVolume: ['high', 'medium', 'low'].includes(rk.searchVolume) ? rk.searchVolume : 'medium',
            competition: ['high', 'medium', 'low'].includes(rk.competition) ? rk.competition : 'medium',
            searchIntent: ['informational', 'commercial', 'transactional', 'navigational'].includes(rk.searchIntent) ? rk.searchIntent : 'informational',
            priority: typeof rk.priority === 'number' ? Math.min(100, Math.max(0, rk.priority)) : 50
          })),
          source: 'export-strategy',
          status: 'active'
        });
        saved.push({ ...cluster.toObject(), id: cluster._id.toString() });
      }

      res.json({ clusters: saved, count: saved.length });
    } catch (err: any) {
      console.error('[SEO Keywords Extract] Error:', err);
      res.status(500).json({ error: 'Keyword extraction failed', details: err.message });
    }
  });

  // Get all keyword clusters
  app.get('/api/seo/keywords/clusters', async (req, res) => {
    try {
      const { status } = req.query;
      const query: any = {};
      if (status) query.status = status;

      const clusters = await KeywordCluster.find(query).sort({ createdAt: -1 });
      res.json(clusters.map(c => ({ ...c.toObject(), id: c._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch keyword clusters', details: err.message });
    }
  });

  // Create keyword cluster manually
  app.post('/api/seo/keywords/clusters', async (req, res) => {
    try {
      const { name, primaryKeyword, relatedKeywords } = req.body;
      if (!name || !primaryKeyword) return res.status(400).json({ error: 'name and primaryKeyword are required' });

      const cluster = await KeywordCluster.create({
        name,
        primaryKeyword,
        relatedKeywords: relatedKeywords || [],
        source: 'manual',
        status: 'active'
      });
      res.json({ ...cluster.toObject(), id: cluster._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create keyword cluster', details: err.message });
    }
  });

  // Update keyword cluster
  app.put('/api/seo/keywords/clusters/:id', async (req, res) => {
    try {
      const cluster = await KeywordCluster.findByIdAndUpdate(
        req.params.id, req.body, { new: true }
      );
      if (!cluster) return res.status(404).json({ error: 'Keyword cluster not found' });
      res.json({ ...cluster.toObject(), id: cluster._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update keyword cluster', details: err.message });
    }
  });

  // Delete keyword cluster
  app.delete('/api/seo/keywords/clusters/:id', async (req, res) => {
    try {
      const cluster = await KeywordCluster.findByIdAndDelete(req.params.id);
      if (!cluster) return res.status(404).json({ error: 'Keyword cluster not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete keyword cluster', details: err.message });
    }
  });

  // --- Content Plans ---

  // Create content plan
  app.post('/api/seo/content-plans', async (req, res) => {
    try {
      const { keywordClusterId, contentType, targetKeywords, title, scheduledDate, priority, assignedKnowledgeCards, outline, notes } = req.body;
      if (!title || !contentType) return res.status(400).json({ error: 'title and contentType are required' });

      const plan = await ContentPlan.create({
        keywordClusterId,
        contentType,
        targetKeywords: targetKeywords || [],
        title,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        priority: priority || 'P1',
        status: 'planned',
        assignedKnowledgeCards: assignedKnowledgeCards || [],
        outline: outline || [],
        notes
      });
      res.json({ ...plan.toObject(), id: plan._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create content plan', details: err.message });
    }
  });

  // Get content plans (calendar view)
  app.get('/api/seo/content-plans', async (req, res) => {
    try {
      const { status, priority } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const plans = await ContentPlan.find(query).sort({ scheduledDate: 1, priority: 1, createdAt: -1 });
      res.json(plans.map(p => ({ ...p.toObject(), id: p._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch content plans', details: err.message });
    }
  });

  // Update content plan
  app.patch('/api/seo/content-plans/:id', async (req, res) => {
    try {
      const plan = await ContentPlan.findByIdAndUpdate(
        req.params.id, req.body, { new: true }
      );
      if (!plan) return res.status(404).json({ error: 'Content plan not found' });
      res.json({ ...plan.toObject(), id: plan._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update content plan', details: err.message });
    }
  });

  // Delete content plan
  app.delete('/api/seo/content-plans/:id', async (req, res) => {
    try {
      const plan = await ContentPlan.findByIdAndDelete(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Content plan not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete content plan', details: err.message });
    }
  });

  // --- Content Assets (SEO Content) ---

  // SEO-enhanced content generation
  app.post('/api/seo/content/generate', async (req, res) => {
    try {
      const { contentPlanId, contentType, targetKeywords, focusKeyword, knowledgeCards, language = 'en', title } = req.body;
      if (!targetKeywords || targetKeywords.length === 0) return res.status(400).json({ error: 'targetKeywords are required' });

      const cardContext = knowledgeCards
        ? `\n\nKnowledge Source Data:\n${JSON.stringify(knowledgeCards, null, 2)}`
        : '';

      const contentTypeLabel = contentType === 'landing-page' ? 'SEO Landing Page'
        : contentType === 'blog-article' ? 'SEO Blog Article'
        : contentType === 'faq-page' ? 'FAQ Page'
        : contentType === 'case-study' ? 'Case Study'
        : contentType === 'technical-doc' ? 'Technical Document'
        : 'SEO Article';

      const prompt = `You are a world-class B2B SEO content writer. Generate a complete ${contentTypeLabel} optimized for the following keywords.

FOCUS KEYWORD: ${focusKeyword || targetKeywords[0]}
SECONDARY KEYWORDS: ${targetKeywords.slice(1).join(', ')}
CONTENT TYPE: ${contentTypeLabel}
LANGUAGE: ${language === 'en' ? 'English' : language === 'zh' ? 'Chinese' : language}
${title ? `SUGGESTED TITLE: ${title}` : ''}
${cardContext}

SEO REQUIREMENTS:
1. Title (H1): Include focus keyword naturally, 50-60 characters
2. Meta Title: Include focus keyword, max 60 characters
3. Meta Description: Include focus keyword, compelling CTA, 150-160 characters
4. Body Structure: Use H2/H3 hierarchy, include focus keyword in first 100 words
5. Keyword Density: Focus keyword 1-2%, secondary keywords 0.5-1% each
6. Internal linking opportunities: Suggest 3-5 anchor text + topic pairs
7. Word Count: 1500-2500 words for blog, 800-1200 for landing page
8. Include a compelling introduction and conclusion with CTA
9. If knowledge card data is insufficient, mark placeholders as [TO BE FILLED: description]

${contentType === 'faq-page' ? 'Generate 8-12 FAQ items with concise answers optimized for featured snippets and voice search.' : ''}

Return structured JSON.`;

      const { parsed: result } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            body: { type: 'string' },
            headings: { type: 'array', items: { type: 'object', properties: { level: { type: 'string' }, text: { type: 'string' } } } },
            internalLinkSuggestions: { type: 'array', items: { type: 'object', properties: { anchorText: { type: 'string' }, targetTopic: { type: 'string' } } } },
            missingInfoNeeded: { type: 'array', items: { type: 'string' } },
            wordCount: { type: 'number' }
          },
          required: ['title', 'body', 'metaTitle', 'metaDescription']
        },
        temperature: 0.7,
        maxTokens: 8192
      });

      if (!result) throw new Error('AI returned empty content');

      // Persist ContentAsset
      const asset = await ContentAsset.create({
        contentPlanId,
        title: result.title,
        slug: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100),
        body: result.body,
        contentType: contentType || 'blog-article',
        language: language || 'en',
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        focusKeyword: focusKeyword || targetKeywords[0],
        secondaryKeywords: targetKeywords.slice(1),
        missingInfoNeeded: result.missingInfoNeeded || [],
        version: 1,
        status: 'draft',
        category: contentType || 'blog-article',
        keywords: targetKeywords
      });

      // Update content plan status if linked
      if (contentPlanId) {
        await ContentPlan.findByIdAndUpdate(contentPlanId, { status: 'draft' });
      }

      res.json({
        ...asset.toObject(),
        id: asset._id.toString(),
        headings: result.headings,
        internalLinkSuggestions: result.internalLinkSuggestions,
        wordCount: result.wordCount,
        _generated: true
      });
    } catch (err: any) {
      console.error('[SEO Content Generate] Error:', err);
      res.status(500).json({ error: 'SEO content generation failed', details: err.message });
    }
  });

  // List content assets
  app.get('/api/seo/content', async (req, res) => {
    try {
      const { status, contentType } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (contentType) query.contentType = contentType;

      const assets = await ContentAsset.find(query).sort({ createdAt: -1 }).limit(100);
      res.json(assets.map(a => ({ ...a.toObject(), id: a._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch content assets', details: err.message });
    }
  });

  // Get single content asset
  app.get('/api/seo/content/:id', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });
      res.json({ ...asset.toObject(), id: asset._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch content asset', details: err.message });
    }
  });

  // Update (edit) content asset
  app.put('/api/seo/content/:id', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      Object.assign(asset, req.body);
      await asset.save();
      res.json({ ...asset.toObject(), id: asset._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update content asset', details: err.message });
    }
  });

  // Delete content asset
  app.delete('/api/seo/content/:id', async (req, res) => {
    try {
      const asset = await ContentAsset.findByIdAndDelete(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });
      // Also delete derived content
      await DerivedContent.deleteMany({ parentContentId: asset._id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete content asset', details: err.message });
    }
  });

  // --- SEO Analysis & Optimization ---

  // Analyze SEO score for a content asset
  app.post('/api/seo/analyze/:contentId', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.contentId);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      const prompt = `You are an SEO analysis engine. Analyze this content and provide a detailed SEO score.

CONTENT:
Title: ${asset.title}
Meta Title: ${asset.metaTitle || '(missing)'}
Meta Description: ${asset.metaDescription || '(missing)'}
Focus Keyword: ${asset.focusKeyword || '(not set)'}
Secondary Keywords: ${(asset.secondaryKeywords || []).join(', ') || '(none)'}
Body (first 3000 chars): ${(asset.body || '').substring(0, 3000)}
Content Type: ${asset.contentType}

Score each dimension 0-100:
1. Keyword Optimization (30% weight): keyword in title, H1, first paragraph, density 1-2%, LSI keywords
2. Readability (20% weight): sentence length, paragraph length, transition words, Flesch score
3. Structure (25% weight): heading hierarchy, image alt tags, lists/tables, content length
4. Internal Linking (15% weight): anchor text relevance, link count, link diversity
5. Meta Tags (10% weight): title length, description length, keyword in meta, OG tags

Also provide 5-10 specific, actionable improvement suggestions.

Return JSON with scores and suggestions.`;

      const { parsed: analysis } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'object',
          properties: {
            keywordOptimization: { type: 'number' },
            readability: { type: 'number' },
            structure: { type: 'number' },
            internalLinking: { type: 'number' },
            metaTags: { type: 'number' },
            overall: { type: 'number' },
            suggestions: { type: 'array', items: { type: 'string' } }
          },
          required: ['keywordOptimization', 'readability', 'structure', 'internalLinking', 'metaTags', 'overall', 'suggestions']
        },
        temperature: 0.3
      });

      if (!analysis) throw new Error('AI analysis returned empty');

      // Calculate weighted overall if AI didn't
      const weightedOverall = Math.round(
        analysis.keywordOptimization * 0.3 +
        analysis.readability * 0.2 +
        analysis.structure * 0.25 +
        analysis.internalLinking * 0.15 +
        analysis.metaTags * 0.1
      );

      const seoScore = {
        overall: weightedOverall,
        breakdown: {
          keywordOptimization: analysis.keywordOptimization,
          readability: analysis.readability,
          structure: analysis.structure,
          internalLinking: analysis.internalLinking,
          metaTags: analysis.metaTags
        },
        suggestions: analysis.suggestions || [],
        lastCalculated: new Date()
      };

      asset.seoScore = seoScore as any;
      await asset.save();

      res.json({ contentId: asset._id.toString(), seoScore });
    } catch (err: any) {
      console.error('[SEO Analyze] Error:', err);
      res.status(500).json({ error: 'SEO analysis failed', details: err.message });
    }
  });

  // Apply SEO optimizations to content
  app.post('/api/seo/optimize/:contentId', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.contentId);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      const suggestions = asset.seoScore?.suggestions || [];
      const prompt = `You are an SEO content optimizer. Rewrite and optimize the following content based on SEO improvement suggestions.

CURRENT CONTENT:
Title: ${asset.title}
Meta Title: ${asset.metaTitle || ''}
Meta Description: ${asset.metaDescription || ''}
Focus Keyword: ${asset.focusKeyword || ''}
Secondary Keywords: ${(asset.secondaryKeywords || []).join(', ')}
Body: ${(asset.body || '').substring(0, 6000)}

IMPROVEMENT SUGGESTIONS:
${suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

INSTRUCTIONS:
1. Rewrite the content incorporating all improvement suggestions
2. Maintain the original information and accuracy
3. Improve keyword placement and density naturally
4. Enhance heading structure and readability
5. Add/improve meta title and description
6. Keep the same content type and tone

Return the optimized version as JSON.`;

      const { parsed: optimized } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            body: { type: 'string' },
            changesApplied: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'body']
        },
        temperature: 0.5,
        maxTokens: 8192
      });

      if (!optimized) throw new Error('AI optimization returned empty');

      // Save as new version
      const previousVersion = asset.version;
      asset.title = optimized.title || asset.title;
      asset.metaTitle = optimized.metaTitle || asset.metaTitle;
      asset.metaDescription = optimized.metaDescription || asset.metaDescription;
      asset.body = optimized.body || asset.body;
      asset.version = previousVersion + 1;
      asset.previousVersionId = asset._id;
      asset.status = 'optimized';
      await asset.save();

      // Update content plan status if linked
      if (asset.contentPlanId) {
        await ContentPlan.findByIdAndUpdate(asset.contentPlanId, { status: 'optimizing' });
      }

      res.json({
        ...asset.toObject(),
        id: asset._id.toString(),
        changesApplied: optimized.changesApplied || [],
        _optimized: true
      });
    } catch (err: any) {
      console.error('[SEO Optimize] Error:', err);
      res.status(500).json({ error: 'SEO optimization failed', details: err.message });
    }
  });

  // Suggest internal links
  app.post('/api/seo/internal-links/suggest', async (req, res) => {
    try {
      const { contentId } = req.body;
      const asset = await ContentAsset.findById(contentId);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      // Get other content assets for linking
      const otherAssets = await ContentAsset.find({
        _id: { $ne: asset._id },
        status: { $in: ['draft', 'optimized', 'published'] }
      }).select('title slug focusKeyword contentType').limit(50);

      const prompt = `You are an internal linking strategist. Suggest internal links between this content and other available pages.

CURRENT PAGE:
Title: ${asset.title}
Focus Keyword: ${asset.focusKeyword || ''}
Body excerpt: ${(asset.body || '').substring(0, 2000)}

AVAILABLE PAGES TO LINK TO:
${otherAssets.map(a => `- "${a.title}" (slug: ${a.slug}, keyword: ${a.focusKeyword || 'N/A'})`).join('\n')}

Suggest 3-8 internal links with:
1. The anchor text to use in the current page
2. Which page to link to (by slug)
3. Where approximately in the content to place the link
4. Why this link adds value

Return JSON array.`;

      const { parsed: links } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              anchorText: { type: 'string' },
              targetSlug: { type: 'string' },
              placement: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        temperature: 0.4
      });

      res.json({ contentId: asset._id.toString(), suggestions: links || [] });
    } catch (err: any) {
      console.error('[Internal Links] Error:', err);
      res.status(500).json({ error: 'Internal link suggestion failed', details: err.message });
    }
  });

  // Generate structured data (Schema.org)
  app.post('/api/seo/structured-data/generate', async (req, res) => {
    try {
      const { contentId } = req.body;
      const asset = await ContentAsset.findById(contentId);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      const prompt = `Generate Schema.org structured data (JSON-LD) for this content.

Title: ${asset.title}
Type: ${asset.contentType}
Focus Keyword: ${asset.focusKeyword || ''}
Meta Description: ${asset.metaDescription || ''}
Body excerpt: ${(asset.body || '').substring(0, 2000)}

Generate appropriate schema types:
${asset.contentType === 'faq-page' ? '- FAQPage schema with all Q&A pairs' : ''}
${asset.contentType === 'blog-article' ? '- Article schema with author, datePublished, etc.' : ''}
${asset.contentType === 'technical-doc' ? '- HowTo schema if applicable, or TechArticle' : ''}
${asset.contentType === 'landing-page' ? '- Product or Service schema' : ''}
- BreadcrumbList schema
- Organization schema snippet

Return JSON array of structured data objects.`;

      const { parsed: schemas } = await generateAIContent(prompt, {
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              schema: { type: 'object' }
            }
          }
        },
        temperature: 0.3
      });

      if (!schemas) throw new Error('AI returned empty structured data');

      asset.structuredData = schemas;
      await asset.save();

      res.json({ contentId: asset._id.toString(), structuredData: schemas });
    } catch (err: any) {
      console.error('[Structured Data] Error:', err);
      res.status(500).json({ error: 'Structured data generation failed', details: err.message });
    }
  });

  // --- Multi-Format Derivation ---

  // Derive content into different formats
  app.post('/api/seo/content/:id/derive', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      const { format } = req.body;
      if (!format) return res.status(400).json({ error: 'format is required' });

      const validFormats = ['linkedin-post', 'twitter-thread', 'email-sequence', 'ppt-outline', 'internal-doc', 'social-summary'];
      if (!validFormats.includes(format)) return res.status(400).json({ error: `Invalid format. Use: ${validFormats.join(', ')}` });

      const formatPrompts: Record<string, string> = {
        'linkedin-post': `Convert this SEO article into a professional LinkedIn post (1200-1500 characters). Include:
- Attention-grabbing hook (first line)
- 3-5 key insights as short paragraphs
- Professional tone suitable for B2B decision makers
- Call-to-action
- 3-5 relevant hashtags at the end
Return as a single string.`,
        'twitter-thread': `Convert this SEO article into a Twitter/X thread of 5-8 tweets. Each tweet max 280 characters.
- Tweet 1: Hook/headline
- Tweets 2-6: Key points with data
- Last tweet: CTA with link placeholder
Return as an array of strings (one per tweet).`,
        'email-sequence': `Convert this SEO article into a 3-email drip sequence for B2B prospects.
- Email 1: Educational value, introduce the topic
- Email 2: Deep dive, share specific insights/data
- Email 3: CTA, offer consultation or demo
Each email: subject line + body (200-400 words).
Return as array of objects with subject and body.`,
        'ppt-outline': `Convert this SEO article into a 10-15 slide presentation outline.
Each slide: title + 3-5 bullet points + speaker notes.
Include title slide, agenda, content slides, and closing CTA slide.
Return as a single formatted string.`,
        'internal-doc': `Convert this SEO article into a concise internal briefing document.
- Executive summary (2-3 sentences)
- Key findings/points
- Action items
- Reference data
Return as a single formatted string.`,
        'social-summary': `Create a social media summary package from this SEO article:
- 1 LinkedIn post (1000 chars)
- 1 Tweet (280 chars)
- 1 Short description for email newsletter (200 chars)
Return as a single formatted string with sections.`
      };

      const prompt = `You are a multi-channel B2B content strategist.

SOURCE CONTENT:
Title: ${asset.title}
Keywords: ${[asset.focusKeyword, ...(asset.secondaryKeywords || [])].filter(Boolean).join(', ')}
Body: ${(asset.body || '').substring(0, 4000)}

TASK:
${formatPrompts[format]}`;

      const isArrayFormat = format === 'twitter-thread' || format === 'email-sequence';

      const { parsed: derived } = await generateAIContent(prompt, {
        responseSchema: isArrayFormat
          ? { type: 'array', items: format === 'email-sequence'
            ? { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' } } }
            : { type: 'string' }
          }
          : { type: 'object', properties: { content: { type: 'string' }, title: { type: 'string' } }, required: ['content'] },
        temperature: 0.7,
        maxTokens: 4096
      });

      if (!derived) throw new Error('AI returned empty derived content');

      // Compute content and metadata
      let contentToSave: string | string[];
      let metadata: any = {};

      if (format === 'twitter-thread') {
        contentToSave = Array.isArray(derived) ? derived : [derived];
        metadata.tweetCount = contentToSave.length;
      } else if (format === 'email-sequence') {
        contentToSave = Array.isArray(derived) ? derived.map((e: any) => `Subject: ${e.subject}\n\n${e.body}`) : [derived];
        metadata.emailCount = contentToSave.length;
      } else {
        contentToSave = typeof derived === 'string' ? derived : (derived as any).content || JSON.stringify(derived);
        metadata.characterCount = contentToSave.length;
        metadata.wordCount = contentToSave.toString().split(/\s+/).length;
      }

      const derivedDoc = await DerivedContent.create({
        parentContentId: asset._id,
        format,
        content: contentToSave,
        title: typeof derived === 'object' && !Array.isArray(derived) ? (derived as any).title : `${asset.title} - ${format}`,
        metadata,
        status: 'generated'
      });

      res.json({ ...derivedDoc.toObject(), id: derivedDoc._id.toString(), _derived: true });
    } catch (err: any) {
      console.error('[Content Derive] Error:', err);
      res.status(500).json({ error: 'Content derivation failed', details: err.message });
    }
  });

  // Get derived content for an asset
  app.get('/api/seo/content/:id/derived', async (req, res) => {
    try {
      const derived = await DerivedContent.find({ parentContentId: req.params.id }).sort({ createdAt: -1 });
      res.json(derived.map(d => ({ ...d.toObject(), id: d._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch derived content', details: err.message });
    }
  });

  // Update derived content
  app.put('/api/seo/derived/:id', async (req, res) => {
    try {
      const derived = await DerivedContent.findByIdAndUpdate(
        req.params.id, req.body, { new: true }
      );
      if (!derived) return res.status(404).json({ error: 'Derived content not found' });
      res.json({ ...derived.toObject(), id: derived._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update derived content', details: err.message });
    }
  });

  // --- Content Publishing ---

  // Publish content asset (mark as published, track channels, push to client site)
  app.post('/api/seo/content/:id/publish', async (req, res) => {
    try {
      const asset = await ContentAsset.findById(req.params.id);
      if (!asset) return res.status(404).json({ error: 'Content asset not found' });

      const { channel, url } = req.body;
      if (!channel) return res.status(400).json({ error: 'channel is required' });

      if (!asset.publishedChannels) asset.publishedChannels = [];
      asset.publishedChannels.push({
        channel,
        url: url || '',
        publishedAt: new Date()
      } as any);

      asset.status = 'published';
      asset.publishedAt = new Date();
      await asset.save();

      // Update content plan status if linked
      if (asset.contentPlanId) {
        await ContentPlan.findByIdAndUpdate(asset.contentPlanId, { status: 'published' });
      }

      // --- Push to client site when channel is 'website' ---
      let pushResult: any = null;
      if (channel === 'website') {
        // Find associated product to determine the client site
        const products = await ProductModel.find();
        const product = products[0]; // For now, use the first product; multi-product lookup by asset association will be added later

        if (product) {
          const adapter = await PublisherAdapterFactory.create(product.slug);
          if (adapter) {
            const assetData = { ...asset.toObject(), id: asset._id.toString() } as any;
            const result = await adapter.publishContent(assetData);

            // Find the site config for timeout calculation
            const siteConfig = await ClientSiteConfig.findOne({ productSlug: product.slug, isActive: true });
            const timeoutHours = siteConfig?.approvalTimeoutHours || 24;

            const pushRecord = await PushRecord.create({
              assetId: asset._id,
              productSlug: product.slug,
              status: result.status === 'success' ? 'pending' : 'failed',
              targetUrl: result.url || '',
              pushedAt: new Date(),
              timeoutAt: new Date(Date.now() + timeoutHours * 60 * 60 * 1000),
              retryCount: 0,
              lastError: result.status === 'error' ? result.message : undefined,
            });

            pushResult = {
              pushRecordId: pushRecord._id.toString(),
              pushStatus: pushRecord.status,
              targetUrl: result.url,
              message: result.message,
              timeoutAt: pushRecord.timeoutAt,
            };
            console.log(`[Publish] Push record created: ${pushRecord._id} (status: ${pushRecord.status})`);
          } else {
            pushResult = { message: 'No active site configuration found for this product' };
          }
        }
      }

      res.json({ ...asset.toObject(), id: asset._id.toString(), pushResult });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to publish content', details: err.message });
    }
  });

  // --- SEO Dashboard Stats ---

  app.get('/api/seo/stats', async (req, res) => {
    try {
      const totalKeywordClusters = await KeywordCluster.countDocuments({ status: 'active' });
      const totalContentPlans = await ContentPlan.countDocuments();
      const plansByStatus = {
        planned: await ContentPlan.countDocuments({ status: 'planned' }),
        draft: await ContentPlan.countDocuments({ status: 'draft' }),
        ready: await ContentPlan.countDocuments({ status: 'ready' }),
        published: await ContentPlan.countDocuments({ status: 'published' })
      };
      const totalContentAssets = await ContentAsset.countDocuments();
      const publishedAssets = await ContentAsset.countDocuments({ status: 'published' });
      const totalDerived = await DerivedContent.countDocuments();

      // Average SEO score
      const assetsWithScore = await ContentAsset.find({ 'seoScore.overall': { $gt: 0 } }).select('seoScore.overall');
      const avgSeoScore = assetsWithScore.length > 0
        ? Math.round(assetsWithScore.reduce((sum, a) => sum + (a.seoScore?.overall || 0), 0) / assetsWithScore.length)
        : 0;

      res.json({
        keywordClusters: totalKeywordClusters,
        contentPlans: { total: totalContentPlans, ...plansByStatus },
        contentAssets: { total: totalContentAssets, published: publishedAssets },
        derivedContent: totalDerived,
        avgSeoScore
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch SEO stats', details: err.message });
    }
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Express error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  // ==================== Push Pipeline Records ====================

  // List push records (with optional status filter)
  app.get('/api/push-records', async (req, res) => {
    try {
      const { status, productSlug } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (productSlug) query.productSlug = productSlug;

      const records = await PushRecord.find(query).sort({ createdAt: -1 }).limit(100);
      res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch push records', details: err.message });
    }
  });

  // Get timeout records (convenience endpoint)
  app.get('/api/push-records/timeout', async (req, res) => {
    try {
      const records = await PushRecord.find({
        status: { $in: ['timeout', 'escalated'] }
      }).sort({ timeoutAt: -1 }).limit(50);
      res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch timeout records', details: err.message });
    }
  });

  // Manually confirm a push record (client published the content)
  app.post('/api/push-records/:id/confirm', async (req, res) => {
    try {
      const record = await PushRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: 'Push record not found' });

      record.status = 'confirmed';
      record.confirmedAt = new Date();
      await record.save();

      res.json({ ...record.toObject(), id: record._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to confirm push record', details: err.message });
    }
  });

  // Retry a failed push
  app.post('/api/push-records/:id/retry', async (req, res) => {
    try {
      const record = await PushRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: 'Push record not found' });

      const asset = await ContentAsset.findById(record.assetId);
      if (!asset) return res.status(404).json({ error: 'Associated content asset not found' });

      const adapter = await PublisherAdapterFactory.create(record.productSlug);
      if (!adapter) return res.status(400).json({ error: 'No active site configuration found' });

      const assetData = { ...asset.toObject(), id: asset._id.toString() } as any;
      const result = await adapter.publishContent(assetData);

      const siteConfig = await ClientSiteConfig.findOne({ productSlug: record.productSlug, isActive: true });
      const timeoutHours = siteConfig?.approvalTimeoutHours || 24;

      record.status = result.status === 'success' ? 'pending' : 'failed';
      record.targetUrl = result.url || record.targetUrl;
      record.pushedAt = new Date();
      record.timeoutAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);
      record.retryCount = (record.retryCount || 0) + 1;
      record.lastError = result.status === 'error' ? result.message : undefined;
      await record.save();

      res.json({ ...record.toObject(), id: record._id.toString(), pushMessage: result.message });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retry push', details: err.message });
    }
  });

  // --- Client Site Config Management ---
  app.get('/api/client-sites', async (req, res) => {
    try {
      const sites = await ClientSiteConfig.find().sort({ createdAt: -1 });
      // Mask pushSecret in response
      res.json(sites.map(s => {
        const obj = s.toObject();
        if (obj.supabaseConfig?.pushSecret) {
          obj.supabaseConfig.pushSecret = '***';
        }
        return { ...obj, id: s._id.toString() };
      }));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch client sites', details: err.message });
    }
  });

  app.post('/api/client-sites', async (req, res) => {
    try {
      const site = await ClientSiteConfig.create(req.body);
      res.json({ ...site.toObject(), id: site._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create client site config', details: err.message });
    }
  });

  app.put('/api/client-sites/:id', async (req, res) => {
    try {
      const site = await ClientSiteConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!site) return res.status(404).json({ error: 'Client site config not found' });
      res.json({ ...site.toObject(), id: site._id.toString() });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update client site config', details: err.message });
    }
  });

  // --- Local Dev: Vite Middleware + Listen ---
  if (!process.env.VERCEL) {
    (async () => {
      const { createServer: createViteServer } = await import('vite');
      if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } else {
        app.use(express.static(path.join(__dirname_resolved, 'dist')));
        app.get('*', (req, res) => {
          res.sendFile(path.join(__dirname_resolved, 'dist', 'index.html'));
        });
      }

      const PORT = 3000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
        initPushTimeoutChecker();
      });
    })();
  }

export default app;
