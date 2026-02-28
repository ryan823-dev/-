// Research Stage Helpers - used by decomposed research endpoints in server.ts
// This file exports helper functions for the 7-stage research pipeline

import { GoogleGenAI, Type } from '@google/genai';
import { generateAIContent } from './ai/chat';

// These will be passed in from server.ts context
type StageContext = {
  canUseGemini: () => boolean;
  getGeminiAI: () => any;
  recordGeminiUsage: () => void;
  braveSearch: (query: string, count?: number) => Promise<any[]>;
};

let ctx: StageContext;

export function initStageContext(context: StageContext) {
  ctx = context;
}

// --- Stage-level fallback executor ---
export async function executeStageWithFallback(
  stageName: string,
  geminiCall: (ai: any) => Promise<any>,
  braveCall: () => Promise<any>,
  dashscopeCall: () => Promise<any>,
  skipGemini: boolean = false
): Promise<{ data: any; source: string; geminiAvailable: boolean }> {
  if (!skipGemini && ctx.canUseGemini()) {
    try {
      const ai = ctx.getGeminiAI();
      const data = await geminiCall(ai);
      ctx.recordGeminiUsage();
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
export async function braveStageResearch(searchQuery: string, analysisPrompt: string, schema: any): Promise<any> {
  const results = await ctx.braveSearch(searchQuery, 8);
  const context = results.map((r: any) => `- ${r.title}: ${r.description}`).join('\n');
  const r = await generateAIContent(analysisPrompt + '\n\n参考以下网络搜索结果:\n' + context, { responseSchema: schema, temperature: 0.5 });
  return r.parsed;
}

// --- Stage 1: Terminology Translation ---
export async function stageTerminology(productName: string, productDescription: string | undefined, skipGemini: boolean) {
  const prompt = `将以下中国工业产品翻译为英文并提供国际术语。产品：${productName}，描述：${productDescription || '无'}。返回JSON含productNameEN, alternativeTerms[], hsCode, industryCategory`;
  const schema = { type: 'object', properties: { productNameEN: { type: 'string' }, alternativeTerms: { type: 'array', items: { type: 'string' } }, hsCode: { type: 'string' }, industryCategory: { type: 'string' } } };

  return executeStageWithFallback('Terminology',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `Translate this Chinese industrial product to English with international terminology:\n产品: ${productName}\n描述: ${productDescription || '无'}\nReturn JSON: productNameEN, alternativeTerms[], hsCode, industryCategory`,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { productNameEN: { type: Type.STRING }, alternativeTerms: { type: Type.ARRAY, items: { type: Type.STRING } }, hsCode: { type: Type.STRING }, industryCategory: { type: Type.STRING } }, required: ['productNameEN', 'alternativeTerms', 'industryCategory'] } }
      });
      return JSON.parse(r.text || '{}');
    },
    async () => { const r = await generateAIContent(prompt, { responseSchema: schema, temperature: 0.3 }); return r.parsed || {}; },
    async () => { const r = await generateAIContent(prompt, { responseSchema: schema, temperature: 0.3 }); return r.parsed || {}; },
    skipGemini
  );
}

// --- Stage 2: Competitor Analysis ---
export async function stageCompetitors(productNameEN: string, alternativeTerms: string[] | undefined, skipGemini: boolean) {
  const terms = alternativeTerms?.join(', ') || '';
  const basePrompt = `列出"${productNameEN}"(${terms})的3-5个主要国际竞争对手。每个包含：公司名(name)、国家(country)、核心优势(strengths[])、价格定位(priceRange)、官网(website)。以JSON数组返回。`;
  const arrSchema = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, country: { type: 'string' }, strengths: { type: 'array', items: { type: 'string' } }, priceRange: { type: 'string' }, website: { type: 'string' } } } };

  return executeStageWithFallback('Competitors',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `Search for top international manufacturers and competitors for "${productNameEN}" (also known as: ${terms}). Find 3-5 major global players. For each: company name, country, key strengths, price range, website.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, country: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, priceRange: { type: Type.STRING }, website: { type: Type.STRING } }, required: ['name', 'country'] } } }
      });
      return JSON.parse(r.text || '[]');
    },
    () => braveStageResearch(`top manufacturers "${productNameEN}" international competitors`, basePrompt, arrSchema),
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: arrSchema, temperature: 0.7 }); return r.parsed || []; },
    skipGemini
  );
}

// --- Stage 3: Certification Requirements ---
export async function stageCertifications(productNameEN: string, targetMarkets: string[] | undefined, skipGemini: boolean) {
  const markets = targetMarkets?.join(', ') || 'Europe, North America, Southeast Asia';
  const basePrompt = `列出将"${productNameEN}"出口到国际市场(${markets})需要的认证和标准。包含：认证名(name)、适用地区(region)、重要程度(importance:必备/强烈建议/加分项)、描述(description)、预计时间(estimatedTime)、预计费用(estimatedCost)。以JSON数组返回。`;
  const arrSchema = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, region: { type: 'string' }, importance: { type: 'string' }, description: { type: 'string' }, estimatedTime: { type: 'string' }, estimatedCost: { type: 'string' } } } };

  return executeStageWithFallback('Certifications',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `What certifications are required for exporting "${productNameEN}" to ${markets}? Include mandatory certs, quality standards (ISO), safety certs, environmental certs. Manufacturer is China-based.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, region: { type: Type.STRING }, importance: { type: Type.STRING }, description: { type: Type.STRING }, estimatedTime: { type: Type.STRING }, estimatedCost: { type: Type.STRING } }, required: ['name', 'region', 'importance'] } } }
      });
      return JSON.parse(r.text || '[]');
    },
    () => braveStageResearch(`export certification requirements "${productNameEN}" CE UL ISO`, basePrompt, arrSchema),
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: arrSchema, temperature: 0.7 }); return r.parsed || []; },
    skipGemini
  );
}

// --- Stage 4: Sales Channels ---
export async function stageChannels(productNameEN: string, industryCategory: string | undefined, skipGemini: boolean) {
  const basePrompt = `推荐中国制造商出口"${productNameEN}"(${industryCategory || ''})的最佳自主获客渠道。严禁推荐阿里巴巴国际站、Made-in-China、Global Sources、中国制造网等B2B交易平台（这些平台是流量二道贩子，工业类目无权重，开户代价高且无意义）。推荐方向：独立站SEO、行业目录（Kompass/Europages/ThomasNet）、行业展会、LinkedIn社交销售、政府采购招投标、行业协会、直销/分销。包含：渠道名(name)、类型(type:行业目录/展会/独立站/直销/分销/社交销售/招投标)、地区(region)、优先级(priority:高/中/低)、备注(notes)、网站(website)。以JSON数组返回。`;
  const arrSchema = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, region: { type: 'string' }, priority: { type: 'string' }, notes: { type: 'string' }, website: { type: 'string' } } } };

  return executeStageWithFallback('Channels',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `Best independent sales channels for Chinese manufacturer to sell "${productNameEN}" internationally? IMPORTANT: Do NOT recommend B2B marketplaces like Alibaba International, Made-in-China, Global Sources, DHgate, or similar Chinese export platforms. These are traffic middlemen with no weight in industrial categories. Focus on: industry directories (Kompass, Europages, ThomasNet), trade shows, independent website SEO, LinkedIn social selling, government procurement, direct sales, distribution partnerships. Rank by effectiveness.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, region: { type: Type.STRING }, priority: { type: Type.STRING }, notes: { type: Type.STRING }, website: { type: Type.STRING } }, required: ['name', 'type', 'priority'] } } }
      });
      return JSON.parse(r.text || '[]');
    },
    () => braveStageResearch(`best independent sales channels industry directory "${productNameEN}" export`, basePrompt, arrSchema),
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: arrSchema, temperature: 0.7 }); return r.parsed || []; },
    skipGemini
  );
}

// --- Stage 5: Industry Exhibitions ---
export async function stageExhibitions(productNameEN: string, industryCategory: string | undefined, skipGemini: boolean) {
  const basePrompt = `列出"${productNameEN}"(${industryCategory || ''})行业最重要的国际展会(2025-2026)。包含：展会名(name)、地点(location)、时间(timing)、相关度(relevance)、官网(website)。以JSON数组返回。`;
  const arrSchema = { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, location: { type: 'string' }, timing: { type: 'string' }, relevance: { type: 'string' }, website: { type: 'string' } } } };

  return executeStageWithFallback('Exhibitions',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `Find most important international trade shows for "${productNameEN}" in ${industryCategory || 'this'} industry, 2025-2026. Include global shows, regional shows (EU, US, SE Asia).`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, location: { type: Type.STRING }, timing: { type: Type.STRING }, relevance: { type: Type.STRING }, website: { type: Type.STRING } }, required: ['name', 'location'] } } }
      });
      return JSON.parse(r.text || '[]');
    },
    () => braveStageResearch(`industry trade shows exhibitions "${productNameEN}" 2025 2026`, basePrompt, arrSchema),
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: arrSchema, temperature: 0.7 }); return r.parsed || []; },
    skipGemini
  );
}

// --- Stage 6: Industry Trends ---
export async function stageTrends(productNameEN: string, industryCategory: string | undefined, skipGemini: boolean) {
  const basePrompt = `分析"${productNameEN}"(${industryCategory || ''})的市场趋势和前景。每条包含：趋势(trend)、影响(impact)、机遇(opportunity)、来源(source)。以JSON数组返回。`;
  const arrSchema = { type: 'array', items: { type: 'object', properties: { trend: { type: 'string' }, impact: { type: 'string' }, opportunity: { type: 'string' }, source: { type: 'string' } } } };

  return executeStageWithFallback('Trends',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: `Current trends and outlook for "${productNameEN}" market? Technology trends, market growth, sustainability, new applications, supply chain shifts.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, impact: { type: Type.STRING }, opportunity: { type: Type.STRING }, source: { type: Type.STRING } }, required: ['trend', 'impact'] } } }
      });
      return JSON.parse(r.text || '[]');
    },
    () => braveStageResearch(`"${productNameEN}" market trends industry outlook global demand`, basePrompt, arrSchema),
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: arrSchema, temperature: 0.7 }); return r.parsed || []; },
    skipGemini
  );
}

// --- Stage 7: Export Strategy Synthesis ---
export async function stageStrategy(
  productName: string, productNameEN: string,
  competitors: any[], certifications: any[], channels: any[], trends: any[],
  existingCertifications: string[] | undefined, skipGemini: boolean
) {
  const context = `产品：${productName}(${productNameEN})\n竞争对手：${JSON.stringify((competitors || []).slice(0, 3))}\n认证：${JSON.stringify((certifications || []).slice(0, 5))}\n渠道：${JSON.stringify((channels || []).slice(0, 5))}\n趋势：${JSON.stringify((trends || []).slice(0, 3))}\n现有认证：${existingCertifications?.join(', ') || '未知'}`;
  const basePrompt = `基于以下调研数据，为中国制造商生成出口策略：\n${context}\n\n请生成：1.市场定位(marketPositioning含suggestedPosition,reasoning,targetRegions[]) 2.差异化策略(differentiationStrategy含uniqueSellingPoints[],priceAdvantage,suggestedApproach) 3.优先行动项(actionItems[]含action,priority:P0/P1/P2,category,deadline)。用中文，要具体可执行。`;
  const objSchema = { type: 'object', properties: {
    marketPositioning: { type: 'object', properties: { suggestedPosition: { type: 'string' }, reasoning: { type: 'string' }, targetRegions: { type: 'array', items: { type: 'string' } } } },
    differentiationStrategy: { type: 'object', properties: { uniqueSellingPoints: { type: 'array', items: { type: 'string' } }, priceAdvantage: { type: 'string' }, suggestedApproach: { type: 'string' } } },
    actionItems: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, priority: { type: 'string' }, category: { type: 'string' }, deadline: { type: 'string' } } } }
  } };

  return executeStageWithFallback('Strategy',
    async (ai) => {
      const r = await ai.models.generateContent({ model: 'gemini-2.0-flash',
        contents: basePrompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: {
          marketPositioning: { type: Type.OBJECT, properties: { suggestedPosition: { type: Type.STRING }, reasoning: { type: Type.STRING }, targetRegions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['suggestedPosition', 'reasoning'] },
          differentiationStrategy: { type: Type.OBJECT, properties: { uniqueSellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } }, priceAdvantage: { type: Type.STRING }, suggestedApproach: { type: Type.STRING } }, required: ['uniqueSellingPoints', 'suggestedApproach'] },
          actionItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { action: { type: Type.STRING }, priority: { type: Type.STRING }, category: { type: Type.STRING }, deadline: { type: Type.STRING } }, required: ['action', 'priority', 'category'] } }
        }, required: ['marketPositioning', 'differentiationStrategy', 'actionItems'] } }
      });
      return JSON.parse(r.text || '{}');
    },
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: objSchema, temperature: 0.5 }); return r.parsed || {}; },
    async () => { const r = await generateAIContent(basePrompt, { responseSchema: objSchema, temperature: 0.5 }); return r.parsed || {}; },
    skipGemini
  );
}


// --- Stage 8: Deep ICP Profile Generation (from Knowledge Engine data) ---
export async function stageICP(
  exportStrategy: any,  // ExportStrategy from Knowledge Engine
  productName: string,
  skipGemini: boolean
) {
  const context = `
产品：${productName} (${exportStrategy.productNameEN || ''})
行业：${exportStrategy.industryCategory || ''}
目标市场：${(exportStrategy.marketPositioning?.targetRegions || []).join(', ')}
市场定位：${exportStrategy.marketPositioning?.suggestedPosition || ''}
竞争对手：${JSON.stringify((exportStrategy.competitorAnalysis || []).slice(0, 3))}
销售渠道：${JSON.stringify((exportStrategy.channels || []).slice(0, 5))}
差异化优势：${(exportStrategy.differentiationStrategy?.uniqueSellingPoints || []).join(', ')}
`;

  const basePrompt = `基于以下出口调研数据，生成深度目标客户画像(ICP)：
${context}

请生成以下内容（用中文，要具体可执行）：
1. industryTags: 目标行业标签数组（3-5个细分行业）
2. targetCustomerTypes: 目标客户类型数组（如"OEM制造商"、"区域分销商"等）
3. targetTitles: 决策者职位数组（按决策权重排序）
4. companyProfile: 目标公司画像
   - employeeRange: 员工规模范围（如"50-200人"）
   - revenueRange: 营收范围（如"$5M-20M"）
   - targetRegions: 目标地区数组，每个含region/priority(high/medium/low)/reasoning
5. buyerPersonas: 买家角色数组，每个含title/role(decision_maker/influencer/user/gatekeeper)/concerns[]/reachChannels[]
6. purchasingBehavior: 采购行为
   - decisionCycle: 决策周期（如"3-6个月"）
   - budgetRange: 预算范围
   - purchaseFrequency: 采购频率
   - keyFactors: 关键决策因素数组
7. painPoints: 客户痛点数组（3-5个具体痛点）
8. buyingTriggers: 购买触发条件数组（什么情况下会启动采购）
9. queryPack: 搜索关键词包
   - google: Google搜索词数组
   - linkedin: LinkedIn搜索词数组
   - directories: 行业目录搜索词数组
   - tender: 招投标搜索词数组
10. disqualifiers: 排除条件数组（不符合的客户特征）
`;

  const objSchema = { type: 'object', properties: {
    industryTags: { type: 'array', items: { type: 'string' } },
    targetCustomerTypes: { type: 'array', items: { type: 'string' } },
    targetTitles: { type: 'array', items: { type: 'string' } },
    companyProfile: { type: 'object', properties: {
      employeeRange: { type: 'string' },
      revenueRange: { type: 'string' },
      targetRegions: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, priority: { type: 'string' }, reasoning: { type: 'string' } } } }
    } },
    buyerPersonas: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' }, role: { type: 'string' }, concerns: { type: 'array', items: { type: 'string' } }, reachChannels: { type: 'array', items: { type: 'string' } }
    } } },
    purchasingBehavior: { type: 'object', properties: {
      decisionCycle: { type: 'string' }, budgetRange: { type: 'string' }, purchaseFrequency: { type: 'string' }, keyFactors: { type: 'array', items: { type: 'string' } }
    } },
    painPoints: { type: 'array', items: { type: 'string' } },
    buyingTriggers: { type: 'array', items: { type: 'string' } },
    queryPack: { type: 'object', properties: {
      google: { type: 'array', items: { type: 'string' } },
      linkedin: { type: 'array', items: { type: 'string' } },
      directories: { type: 'array', items: { type: 'string' } },
      tender: { type: 'array', items: { type: 'string' } }
    } },
    disqualifiers: { type: 'array', items: { type: 'string' } }
  } };

  // ICP 生成只用 DashScope（用户要求），不用 Gemini
  const r = await generateAIContent(basePrompt, { responseSchema: objSchema, temperature: 0.7 });
  return { data: r.parsed || {}, source: 'dashscope', geminiAvailable: false };
}
