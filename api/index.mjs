import { createRequire as __createRequire } from 'module';
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_fn(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// models/ApiIntegration.ts
var ApiIntegration_exports = {};
__export(ApiIntegration_exports, {
  ApiIntegration: () => ApiIntegration
});
import mongoose8, { Schema as Schema7 } from "mongoose";
var ApiIntegrationSchema, ApiIntegration;
var init_ApiIntegration = __esm({
  "models/ApiIntegration.ts"() {
    ApiIntegrationSchema = new Schema7({
      provider: {
        type: String,
        enum: ["google_analytics", "search_console"],
        required: true,
        unique: true
      },
      credentials: {
        accessToken: { type: String },
        refreshToken: { type: String },
        tokenExpiresAt: { type: Date }
      },
      config: { type: Schema7.Types.Mixed, default: {} },
      status: {
        type: String,
        enum: ["active", "expired", "error", "pending"],
        default: "pending"
      },
      lastSyncAt: { type: Date },
      errorMessage: { type: String }
    }, {
      timestamps: true
    });
    ApiIntegration = mongoose8.model("ApiIntegration", ApiIntegrationSchema);
  }
});

// server.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";
import helmet from "helmet";

// lib/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vertax";
var isConnected = false;
var connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
var disconnectDB = async () => {
  if (!isConnected) {
    return;
  }
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
};
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

// lib/ai/config.ts
function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || "dashscope").trim();
  const modelOverride = process.env.AI_MODEL?.trim();
  switch (provider) {
    case "dashscope":
      return {
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: process.env.DASHSCOPE_API_KEY || "",
        model: modelOverride || "qwen-plus"
      };
    case "openrouter":
      return {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        model: modelOverride || "anthropic/claude-3-haiku-20240307",
        headers: {
          "HTTP-Referer": "https://vertax.top",
          "X-Title": "VertaX"
        }
      };
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use 'dashscope' or 'openrouter'.`);
  }
}

// lib/ai/chat.ts
async function generateAIContent(prompt, options = {}) {
  const config = getProviderConfig();
  if (!config.apiKey) {
    throw new Error(`API key not configured for provider '${process.env.AI_PROVIDER || "dashscope"}'. Check your .env file.`);
  }
  const messages = [];
  if (options.systemPrompt || options.responseSchema) {
    let systemContent = options.systemPrompt || "";
    if (options.responseSchema) {
      const schemaInstruction = `

You MUST return a valid JSON object matching exactly this JSON Schema:
${JSON.stringify(options.responseSchema, null, 2)}

Return ONLY the JSON object, no markdown fences, no explanation.`;
      systemContent = systemContent ? systemContent + schemaInstruction : schemaInstruction;
    }
    messages.push({ role: "system", content: systemContent });
  }
  messages.push({ role: "user", content: prompt });
  const body = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096
  };
  if (options.responseSchema) {
    body.response_format = { type: "json_object" };
  }
  const response = await fetchWithRetry(config, body);
  const content = response.choices?.[0]?.message?.content || "";
  if (options.responseSchema) {
    try {
      const parsed = JSON.parse(cleanJsonResponse(content));
      return { content, parsed };
    } catch {
      const retryMessages = [
        ...messages,
        { role: "assistant", content },
        { role: "user", content: "The previous response was not valid JSON. Please return ONLY a valid JSON object matching the schema. No markdown, no explanation." }
      ];
      const retryBody = { ...body, messages: retryMessages };
      const retryResponse = await fetchWithRetry(config, retryBody);
      const retryContent = retryResponse.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(cleanJsonResponse(retryContent));
        return { content: retryContent, parsed };
      } catch (e) {
        throw new Error(`AI returned invalid JSON after retry. Raw response: ${retryContent.substring(0, 200)}`);
      }
    }
  }
  return { content };
}
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}
async function fetchWithRetry(config, body, retries = 1) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
          ...config.headers || {}
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI provider returned ${res.status}: ${errBody.substring(0, 300)}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1e3 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("AI request failed");
}

// lib/ai/schemas.ts
var icpSchema = {
  type: "object",
  properties: {
    industryTags: { type: "array", items: { type: "string" } },
    targetCustomerTypes: { type: "array", items: { type: "string" } },
    targetTitles: { type: "array", items: { type: "string" } },
    queryPack: {
      type: "object",
      properties: {
        google: { type: "array", items: { type: "string" } },
        linkedin: { type: "array", items: { type: "string" } },
        directories: { type: "array", items: { type: "string" } },
        tender: { type: "array", items: { type: "string" }, description: "Procurement/tender search queries for government bidding platforms" }
      },
      required: ["google", "linkedin", "directories", "tender"]
    },
    signalPack: {
      type: "object",
      properties: {
        regulation: { type: "array", items: { type: "string" }, description: "Regulation/Violation keywords" },
        hiring: { type: "array", items: { type: "string" }, description: "Job titles indicating pain" },
        expansion: { type: "array", items: { type: "string" }, description: "Expansion/Construction keywords" },
        automation: { type: "array", items: { type: "string" }, description: "Automation upgrade keywords" }
      },
      required: ["regulation", "hiring", "expansion", "automation"]
    },
    disqualifiers: { type: "array", items: { type: "string" } },
    scenarioPack: { type: "array", items: { type: "string" } }
  },
  required: ["industryTags", "targetCustomerTypes", "targetTitles", "queryPack", "signalPack", "disqualifiers", "scenarioPack"]
};
var knowledgeExtractionSchema = {
  type: "object",
  properties: {
    type: { type: "string", description: "Offering, Company, or Proof" },
    title: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          fieldKey: { type: "string" }
        },
        required: ["label", "value", "fieldKey"]
      }
    },
    completion: { type: "number" },
    confidence: { type: "number" },
    missingFields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fieldKey: { type: "string" },
          label: { type: "string" },
          reason: { type: "string" },
          impact: { type: "string" }
        },
        required: ["fieldKey", "label"]
      }
    }
  },
  required: ["type", "title", "fields", "completion", "confidence"]
};
var contentGenerationSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    draftBody: { type: "string" },
    generationTrace: {
      type: "array",
      items: {
        type: "object",
        properties: {
          paragraph: { type: "string" },
          refs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fieldLabel: { type: "string" },
                fieldKey: { type: "string" },
                cardTitle: { type: "string" },
                sourceName: { type: "string" }
              },
              required: ["fieldLabel", "fieldKey", "cardTitle"]
            }
          }
        },
        required: ["paragraph", "refs"]
      }
    },
    missingInfoNeeded: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fieldKey: { type: "string" },
          label: { type: "string" },
          cardId: { type: "string" }
        },
        required: ["fieldKey", "label", "cardId"]
      }
    }
  },
  required: ["title", "draftBody", "generationTrace"]
};
var outreachSchema = {
  type: "object",
  properties: {
    emailA: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        citedEvidenceIds: { type: "array", items: { type: "string" } }
      },
      required: ["subject", "body"]
    },
    emailB: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        citedEvidenceIds: { type: "array", items: { type: "string" } }
      },
      required: ["subject", "body"]
    },
    whatsapp: {
      type: "object",
      properties: {
        message: { type: "string" },
        citedEvidenceIds: { type: "array", items: { type: "string" } }
      },
      required: ["message"]
    }
  },
  required: ["emailA", "emailB", "whatsapp"]
};

// models/Product.ts
import mongoose2, { Schema } from "mongoose";
var ICPProfileSchema = new Schema({
  industryTags: [{ type: String }],
  targetCustomerTypes: [{ type: String }],
  targetTitles: [{ type: String }],
  queryPack: {
    google: [{ type: String }],
    linkedin: [{ type: String }],
    directories: [{ type: String }],
    tender: [{ type: String }]
    // 招投标查询
  },
  signalPack: {
    regulation: [{ type: String }],
    hiring: [{ type: String }],
    expansion: [{ type: String }],
    automation: [{ type: String }]
  },
  disqualifiers: [{ type: String }],
  scenarioPack: [{ type: String }],
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });
var ProductSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  customDomain: { type: String },
  name: { type: String, required: true },
  productType: { type: String, required: true },
  coatingType: { type: String },
  workpieceSize: { type: String },
  automationLevel: { type: String },
  advantages: [{
    label: { type: String },
    value: { type: String }
  }],
  targetCountries: [{ type: String }],
  applicationIndustries: [{ type: String }],
  icpProfile: ICPProfileSchema
}, {
  timestamps: true
});
var Product = mongoose2.model("Product", ProductSchema);

// models/LeadRun.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var LeadRunSchema = new Schema2({
  productId: { type: Schema2.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  country: { type: String, required: true },
  language: { type: String, default: "en" },
  status: {
    type: String,
    enum: ["queued", "running", "done", "failed", "canceled"],
    default: "queued"
  },
  progress: {
    discovery: { type: Number, default: 0 },
    contact: { type: Number, default: 0 },
    research: { type: Number, default: 0 },
    outreach: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  errorMessage: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date }
}, {
  timestamps: true
});
LeadRunSchema.index({ productId: 1, status: 1 });
LeadRunSchema.index({ createdAt: -1 });
var LeadRun = mongoose3.model("LeadRun", LeadRunSchema);

// models/Company.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var TenderMetadataSchema = new Schema3({
  tenderTitle: { type: String, required: true },
  platform: { type: String, required: true },
  // "TED", "SAM.gov" 等
  deadline: { type: String },
  // ISO 日期
  estimatedValue: { type: String },
  // "€500K - €2M"
  requirements: [{ type: String }],
  // ["ISO 9001", "EU supplier"]
  issuingAuthority: { type: String, required: true },
  // 发标机构
  tenderUrl: { type: String }
}, { _id: false });
var ContactSchema = new Schema3({
  name: { type: String },
  title: { type: String, required: true },
  linkedinUrl: { type: String },
  emailBest: { type: String },
  emailCandidates: [{ type: String }],
  emailStatus: {
    type: String,
    enum: ["unverified", "likely", "verified", "invalid"],
    default: "unverified"
  },
  phoneRaw: { type: String },
  phoneNormalized: { type: String },
  whatsapp: { type: String },
  whatsappPossible: { type: Boolean, default: false },
  source: { type: String },
  sourceUrl: { type: String },
  confidence: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
var ShadowSignalSchema = new Schema3({
  type: {
    type: String,
    enum: ["regulation", "hiring", "expansion", "automation", "supply_chain", "facility", "tender"]
  },
  subType: { type: String },
  strength: {
    type: String,
    enum: ["trigger", "high", "medium", "low"]
  },
  score: { type: Number, default: 0 },
  evidence: {
    url: { type: String },
    snippet: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  source: { type: String },
  confidence: { type: Number, default: 0 }
});
var ResearchSchema = new Schema3({
  summary: { type: String },
  signals: [ShadowSignalSchema],
  purchaseIntent: {
    type: String,
    enum: ["high", "medium", "low"]
  },
  keyHooks: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});
var ScoringSchema = new Schema3({
  total: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ["Tier A (Critical Pain)", "Tier B (Active Change)", "Tier C (High Potential)", "Tier D (Cold Lead)"]
  },
  breakdown: {
    triggerScore: { type: Number, default: 0 },
    behaviorScore: { type: Number, default: 0 },
    structuralScore: { type: Number, default: 0 }
  },
  reasons: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});
var OutreachSchema = new Schema3({
  contactId: { type: Schema3.Types.ObjectId },
  emailA: {
    subject: { type: String },
    body: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  emailB: {
    subject: { type: String },
    body: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  whatsapp: {
    message: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  updatedAt: { type: Date, default: Date.now }
});
var EvidenceSchema = new Schema3({
  contactId: { type: Schema3.Types.ObjectId },
  url: { type: String },
  pageType: {
    type: String,
    enum: ["home", "about", "contact", "careers", "news", "linkedin", "dir", "pdf", "other"]
  },
  snippet: { type: String },
  extractedFact: { type: String },
  factType: {
    type: String,
    enum: ["paint_line", "expansion", "hiring", "automation", "contact_info", "tender_opportunity", "other"]
  },
  relevance: { type: Number, default: 0 },
  capturedAt: { type: Date, default: Date.now }
});
var CompanySchema = new Schema3({
  leadRunId: { type: Schema3.Types.ObjectId, ref: "LeadRun" },
  name: { type: String, required: true },
  website: { type: String },
  domain: { type: String },
  country: { type: String, required: true },
  industry: { type: String },
  source: { type: String },
  status: {
    type: String,
    enum: ["discovered", "researching", "researched", "scored", "outreached", "failed"],
    default: "discovered"
  },
  notes: { type: String },
  tenderMetadata: TenderMetadataSchema,
  contacts: [ContactSchema],
  evidence: [EvidenceSchema],
  research: ResearchSchema,
  score: ScoringSchema,
  outreach: OutreachSchema
}, {
  timestamps: true
});
CompanySchema.index({ leadRunId: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ "score.total": -1 });
CompanySchema.index({ name: "text", industry: "text" });
var Company = mongoose4.model("Company", CompanySchema);

// models/SocialAccount.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var SocialAccountSchema = new Schema4({
  platform: {
    type: String,
    enum: ["x", "facebook"],
    required: true
  },
  accountHandle: { type: String, required: true },
  accountName: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  profileImageUrl: { type: String },
  followersCount: { type: Number, default: 0 },
  connectedAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date },
  status: {
    type: String,
    enum: ["active", "expired", "error", "pending"],
    default: "pending"
  },
  errorMessage: { type: String }
}, {
  timestamps: true
});
SocialAccountSchema.index({ platform: 1, accountHandle: 1 }, { unique: true });
var SocialAccount = mongoose5.model("SocialAccount", SocialAccountSchema);

// models/SocialPost.ts
import mongoose6, { Schema as Schema5 } from "mongoose";
var SocialPostSchema = new Schema5({
  accountIds: [{ type: Schema5.Types.ObjectId, ref: "SocialAccount" }],
  platforms: [{ type: String, enum: ["x", "facebook"] }],
  content: { type: String, required: true },
  mediaUrls: [{ type: String }],
  status: {
    type: String,
    enum: ["draft", "scheduled", "published", "failed"],
    default: "draft"
  },
  scheduledFor: { type: Date },
  publishedAt: { type: Date },
  platformPostIds: [{
    platform: { type: String },
    postId: { type: String }
  }],
  targetAudience: { type: String },
  tags: [{ type: String }],
  errorMessage: { type: String },
  metrics: {
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});
SocialPostSchema.index({ status: 1, scheduledFor: 1 });
SocialPostSchema.index({ platforms: 1 });
SocialPostSchema.index({ createdAt: -1 });
var SocialPost = mongoose6.model("SocialPost", SocialPostSchema);

// models/SocialMetric.ts
import mongoose7, { Schema as Schema6 } from "mongoose";
var SocialMetricSchema = new Schema6({
  postId: { type: Schema6.Types.ObjectId, ref: "SocialPost", required: true },
  accountId: { type: Schema6.Types.ObjectId, ref: "SocialAccount", required: true },
  platform: { type: String, enum: ["x", "facebook"], required: true },
  metricDate: { type: Date, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  clickThroughRate: { type: Number, default: 0 },
  syncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
SocialMetricSchema.index({ postId: 1, metricDate: 1 });
SocialMetricSchema.index({ accountId: 1, platform: 1, metricDate: -1 });
var SocialMetric = mongoose7.model("SocialMetric", SocialMetricSchema);

// lib/tender/platforms.ts
var EU_COUNTRIES = /* @__PURE__ */ new Set([
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden"
]);
var PLATFORMS = {
  TED: {
    name: "TED (EU Tenders)",
    searchPrefix: "site:ted.europa.eu",
    description: "Tenders Electronic Daily - EU public procurement"
  },
  SAM_GOV: {
    name: "SAM.gov",
    searchPrefix: "site:sam.gov",
    description: "US Federal procurement opportunities"
  },
  UNGM: {
    name: "UNGM",
    searchPrefix: "site:ungm.org",
    description: "UN Global Marketplace - International tenders"
  },
  WORLD_BANK: {
    name: "World Bank Procurement",
    searchPrefix: "site:projects.worldbank.org OR site:devbusiness.un.org",
    description: "World Bank funded projects"
  },
  CONTRACTS_FINDER: {
    name: "Contracts Finder (UK)",
    searchPrefix: "site:contractsfinder.service.gov.uk",
    description: "UK public sector contracts"
  },
  CANADA_BUYS: {
    name: "CanadaBuys",
    searchPrefix: "site:canadabuys.canada.ca OR site:buyandsell.gc.ca",
    description: "Canadian government procurement"
  },
  AUSTENDER: {
    name: "AusTender",
    searchPrefix: "site:tenders.gov.au",
    description: "Australian government tenders"
  },
  GEM_INDIA: {
    name: "GeM India",
    searchPrefix: "site:gem.gov.in",
    description: "Government e-Marketplace India"
  },
  GERMANY_PORTAL: {
    name: "German eTendering",
    searchPrefix: "site:evergabe-online.de OR site:bund.de",
    description: "German public procurement portal"
  },
  FRANCE_BOAMP: {
    name: "BOAMP France",
    searchPrefix: "site:boamp.fr OR site:marches-publics.gouv.fr",
    description: "French public procurement announcements"
  },
  JAPAN_JETRO: {
    name: "JETRO Japan",
    searchPrefix: "site:jetro.go.jp",
    description: "Japan public procurement"
  },
  KOREA_PPS: {
    name: "Korea PPS",
    searchPrefix: "site:pps.go.kr",
    description: "Korean Public Procurement Service"
  },
  SINGAPORE_GEBIZ: {
    name: "GeBIZ Singapore",
    searchPrefix: "site:gebiz.gov.sg",
    description: "Singapore government procurement"
  },
  MEXICO_COMPRANET: {
    name: "CompraNet Mexico",
    searchPrefix: "site:compranet.hacienda.gob.mx",
    description: "Mexican government procurement"
  },
  BRAZIL_COMPRASNET: {
    name: "ComprasNet Brazil",
    searchPrefix: "site:comprasgovernamentais.gov.br",
    description: "Brazilian government procurement"
  }
};
var COUNTRY_PLATFORM_MAP = {
  // North America
  "United States": ["SAM_GOV", "UNGM"],
  "USA": ["SAM_GOV", "UNGM"],
  "Canada": ["CANADA_BUYS", "UNGM"],
  "Mexico": ["MEXICO_COMPRANET", "UNGM"],
  // UK & Ireland
  "United Kingdom": ["CONTRACTS_FINDER", "TED", "UNGM"],
  "UK": ["CONTRACTS_FINDER", "TED", "UNGM"],
  "Ireland": ["TED", "UNGM"],
  // Asia Pacific
  "Australia": ["AUSTENDER", "UNGM"],
  "New Zealand": ["UNGM", "WORLD_BANK"],
  "Japan": ["JAPAN_JETRO", "UNGM"],
  "South Korea": ["KOREA_PPS", "UNGM"],
  "Korea": ["KOREA_PPS", "UNGM"],
  "Singapore": ["SINGAPORE_GEBIZ", "UNGM"],
  "India": ["GEM_INDIA", "UNGM", "WORLD_BANK"],
  "China": ["UNGM", "WORLD_BANK"],
  "Vietnam": ["UNGM", "WORLD_BANK"],
  "Thailand": ["UNGM", "WORLD_BANK"],
  "Indonesia": ["UNGM", "WORLD_BANK"],
  "Malaysia": ["UNGM", "WORLD_BANK"],
  "Philippines": ["UNGM", "WORLD_BANK"],
  // South America
  "Brazil": ["BRAZIL_COMPRASNET", "UNGM"],
  "Argentina": ["UNGM", "WORLD_BANK"],
  "Chile": ["UNGM", "WORLD_BANK"],
  "Colombia": ["UNGM", "WORLD_BANK"],
  // Middle East
  "UAE": ["UNGM", "WORLD_BANK"],
  "United Arab Emirates": ["UNGM", "WORLD_BANK"],
  "Saudi Arabia": ["UNGM", "WORLD_BANK"],
  "Israel": ["UNGM"],
  "Turkey": ["UNGM", "WORLD_BANK"],
  // Africa
  "South Africa": ["UNGM", "WORLD_BANK"],
  "Egypt": ["UNGM", "WORLD_BANK"],
  "Nigeria": ["UNGM", "WORLD_BANK"],
  "Kenya": ["UNGM", "WORLD_BANK"],
  // EU specific national portals (in addition to TED)
  "Germany": ["TED", "GERMANY_PORTAL", "UNGM"],
  "France": ["TED", "FRANCE_BOAMP", "UNGM"]
};
function getTenderPlatforms(country) {
  const normalizedCountry = country.trim();
  const directMapping = COUNTRY_PLATFORM_MAP[normalizedCountry];
  if (directMapping) {
    return directMapping.map((key) => PLATFORMS[key]).filter(Boolean);
  }
  if (EU_COUNTRIES.has(normalizedCountry)) {
    return [PLATFORMS.TED, PLATFORMS.UNGM];
  }
  return [PLATFORMS.UNGM, PLATFORMS.WORLD_BANK];
}
function calculateTenderStrength(deadline) {
  if (!deadline) return "high";
  try {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return "high";
    const daysUntil = (deadlineDate.getTime() - Date.now()) / (1e3 * 60 * 60 * 24);
    if (daysUntil < 0) return "medium";
    if (daysUntil < 30) return "trigger";
    if (daysUntil < 90) return "high";
    return "medium";
  } catch {
    return "high";
  }
}

// server.ts
dotenv2.config();
var __dirname_resolved;
try {
  __dirname_resolved = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname_resolved = process.cwd();
}
var getGeminiAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
async function seedInitialData() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.create({
      slug: "tdpaintcell",
      customDomain: "tdpaintcell.vertax.top",
      name: "\u6D82\u8C46\u79D1\u6280 - \u55B7\u6F06\u81EA\u52A8\u5316\u673A\u5668\u4EBA",
      productType: "Paint Cell",
      coatingType: "Liquid",
      workpieceSize: "Medium",
      automationLevel: "High",
      advantages: [
        { label: "ROI", value: "18 months" },
        { label: "Precision", value: "\xB10.1mm" }
      ],
      targetCountries: ["Germany", "Vietnam", "Mexico"],
      applicationIndustries: ["Automotive", "Furniture", "Metal Fabrication"]
    });
    console.log("Seeded initial product data");
  }
}
var dbReady = false;
async function ensureDB() {
  if (dbReady) return;
  await connectDB();
  await seedInitialData();
  dbReady = true;
}
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: {
      VERCEL: !!process.env.VERCEL,
      AI_PROVIDER: process.env.AI_PROVIDER || "not set",
      MONGODB_URI: process.env.MONGODB_URI ? "configured" : "missing",
      DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY ? "configured" : "missing"
    }
  });
});
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});
app.post("/api/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ ...product.toObject(), id: product._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product", details: err.message });
  }
});
app.put("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product.toObject(), id: product._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
});
app.post("/api/products/:id/icp/generate", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    console.log(`Generating ICP for product: ${product.name}`);
    const { parsed: icpData } = await generateAIContent(
      `Act as a senior B2B Industrial Export Consultant. Generate a high-precision Ideal Customer Profile (ICP) for this product:
        
        PRODUCT DATA:
        - Name: ${product.name}
        - Category: ${product.productType}
        - Technical Specs: ${product.coatingType} coating, ${product.workpieceSize} workpiece size, ${product.automationLevel} automation.
        - Core Advantages: ${product.advantages.map((a) => `${a.label}: ${a.value}`).join(", ")}
        - Initial Target Industries: ${product.applicationIndustries.join(", ")}
        
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
      { responseSchema: icpSchema }
    );
    if (!icpData) {
      throw new Error("AI returned empty response");
    }
    const icp = {
      ...icpData,
      version: (product.icpProfile?.version || 0) + 1,
      updatedAt: /* @__PURE__ */ new Date()
    };
    product.icpProfile = icp;
    await product.save();
    res.json(icp);
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate ICP via AI",
      details: error.message || "Unknown error"
    });
  }
});
app.get("/api/runs", async (req, res) => {
  try {
    const runs = await LeadRun.find().sort({ createdAt: -1 });
    res.json(runs.map((r) => ({ ...r.toObject(), id: r._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch runs", details: err.message });
  }
});
app.post("/api/runs", async (req, res) => {
  try {
    const run = await LeadRun.create({
      ...req.body,
      status: "queued",
      progress: { discovery: 0, contact: 0, research: 0, outreach: 0, total: 0 }
    });
    const startDiscovery = async () => {
      run.status = "running";
      run.startedAt = /* @__PURE__ */ new Date();
      await run.save();
      const product = await Product.findById(run.productId);
      if (!product || !product.icpProfile) {
        run.status = "failed";
        run.errorMessage = "Product or ICP Profile missing";
        await run.save();
        return;
      }
      try {
        const ai = getGeminiAI();
        const queries = product.icpProfile.queryPack.google.slice(0, 3);
        console.log(`[Discovery] Starting real-time search for: ${run.country}`);
        for (const query of queries) {
          const fullQuery = `${query} in ${run.country}`;
          const searchResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Find 5 real companies in ${run.country} that match this search intent: "${fullQuery}". 
              For each company, provide: Name, Website URL, Industry, and why they match.
              Focus on real, existing industrial companies.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
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
                  required: ["name", "website", "industry", "matchReason"]
                }
              }
            }
          });
          const foundCompanies = JSON.parse(searchResponse.text || "[]");
          for (const fc of foundCompanies) {
            const existing = await Company.findOne({ name: fc.name, leadRunId: run._id });
            if (existing) continue;
            await Company.create({
              leadRunId: run._id,
              name: fc.name,
              website: fc.website,
              country: run.country,
              industry: fc.industry,
              source: `AI Search: ${query}`,
              status: "discovered",
              notes: fc.matchReason
            });
            run.progress.discovery++;
          }
        }
        const tenderQueries = product.icpProfile.queryPack.tender || [];
        if (tenderQueries.length > 0) {
          console.log(`[Tender Discovery] Searching procurement opportunities in ${run.country}`);
          const platforms = getTenderPlatforms(run.country);
          for (const platform of platforms.slice(0, 3)) {
            for (const query of tenderQueries.slice(0, 2)) {
              try {
                console.log(`[Tender] Searching ${platform.name} for: ${query}`);
                const tenderResponse = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: `Search for active procurement tenders on ${platform.name} (${platform.searchPrefix}) 
                      matching: "${query}" in ${run.country}.
                      Find 2-3 real tender opportunities. For each, extract:
                      - Tender title
                      - Issuing organization (the entity POSTING the tender, NOT bidders)
                      - Deadline
                      - Estimated value
                      - Key requirements
                      
                      Focus on industrial/manufacturing equipment procurement.`,
                  config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          tenderTitle: { type: Type.STRING },
                          issuingOrganization: { type: Type.STRING },
                          deadline: { type: Type.STRING },
                          estimatedValue: { type: Type.STRING },
                          requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                          url: { type: Type.STRING },
                          matchReason: { type: Type.STRING }
                        },
                        required: ["tenderTitle", "issuingOrganization"]
                      }
                    }
                  }
                });
                const tenders = JSON.parse(tenderResponse.text || "[]");
                for (const t of tenders) {
                  const existing = await Company.findOne({
                    name: t.issuingOrganization,
                    leadRunId: run._id
                  });
                  if (existing) continue;
                  await Company.create({
                    leadRunId: run._id,
                    name: t.issuingOrganization,
                    country: run.country,
                    industry: t.issuingOrganization.toLowerCase().includes("ministry") || t.issuingOrganization.toLowerCase().includes("government") ? "Government" : "Public Sector",
                    source: `Tender: ${platform.name}`,
                    status: "discovered",
                    notes: t.matchReason || t.tenderTitle,
                    tenderMetadata: {
                      tenderTitle: t.tenderTitle,
                      platform: platform.name,
                      deadline: t.deadline,
                      estimatedValue: t.estimatedValue,
                      requirements: t.requirements || [],
                      issuingAuthority: t.issuingOrganization,
                      tenderUrl: t.url
                    }
                  });
                  run.progress.discovery++;
                  console.log(`[Tender] Found: ${t.tenderTitle} from ${t.issuingOrganization}`);
                }
              } catch (tenderErr) {
                console.error(`[Tender] Error searching ${platform.name}: ${tenderErr.message}`);
              }
            }
          }
          await run.save();
        }
        const discovered = await Company.find({ leadRunId: run._id });
        for (const company of discovered) {
          console.log(`[Research] Detecting Shadow Signals for: ${company.name}`);
          const signalResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Search for recent news, job openings, or environmental reports for the company "${company.name}" in ${run.country}. 
              Specifically look for:
              1. Hiring of "manual painters", "spray technicians", or "automation engineers".
              2. Environmental violations or VOC emission reports.
              3. New factory construction or production line expansion.
              
              Return a list of specific signals found. If none found, return empty array.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "hiring, regulation, expansion, or automation" },
                    subType: { type: Type.STRING },
                    strength: { type: Type.STRING, description: "trigger, high, medium" },
                    snippet: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["type", "subType", "strength", "snippet"]
                }
              }
            }
          });
          const rawSignals = JSON.parse(signalResponse.text || "[]");
          const signals = rawSignals.map((rs) => ({
            type: rs.type,
            subType: rs.subType,
            strength: rs.strength,
            score: rs.strength === "trigger" ? 100 : rs.strength === "high" ? 70 : 40,
            evidence: {
              url: rs.url,
              snippet: rs.snippet,
              timestamp: /* @__PURE__ */ new Date()
            },
            source: "AI Web Search",
            confidence: 0.9
          }));
          if (company.tenderMetadata) {
            const tenderStrength = calculateTenderStrength(company.tenderMetadata.deadline);
            signals.push({
              type: "tender",
              subType: "active_procurement",
              strength: tenderStrength,
              score: 100,
              // Maximum score for active tender
              evidence: {
                url: company.tenderMetadata.tenderUrl,
                snippet: `Active tender: ${company.tenderMetadata.tenderTitle}` + (company.tenderMetadata.estimatedValue ? ` (${company.tenderMetadata.estimatedValue})` : ""),
                timestamp: /* @__PURE__ */ new Date()
              },
              source: company.tenderMetadata.platform,
              confidence: 1
            });
          }
          let tier = "Tier C (High Potential)";
          if (signals.some((s) => s.strength === "trigger")) tier = "Tier A (Critical Pain)";
          else if (signals.some((s) => s.strength === "high")) tier = "Tier B (Active Change)";
          const totalScore = tier.includes("A") ? 95 : tier.includes("B") ? 75 : 50;
          company.research = {
            summary: `AI analyzed ${company.name} and found ${signals.length} relevant signals.`,
            signals,
            purchaseIntent: tier.includes("A") ? "high" : "medium",
            keyHooks: signals.map((s) => s.evidence.snippet),
            updatedAt: /* @__PURE__ */ new Date()
          };
          company.score = {
            total: totalScore,
            tier,
            breakdown: {
              triggerScore: tier.includes("A") ? 100 : 0,
              behaviorScore: tier.includes("B") ? 80 : 40,
              structuralScore: 70
            },
            reasons: signals.map((s) => s.subType),
            updatedAt: /* @__PURE__ */ new Date()
          };
          company.status = "scored";
          await company.save();
          run.progress.research++;
        }
        run.status = "done";
        run.finishedAt = /* @__PURE__ */ new Date();
        await run.save();
      } catch (error) {
        console.error("Lead Run Error:", error);
        run.status = "failed";
        run.errorMessage = error.message;
        await run.save();
      }
    };
    startDiscovery();
    res.json({ ...run.toObject(), id: run._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to create run", details: err.message });
  }
});
app.get("/api/companies", async (req, res) => {
  try {
    let query = {};
    if (req.query.runId) {
      query.leadRunId = req.query.runId;
    }
    const companies = await Company.find(query).sort({ createdAt: -1 });
    res.json(companies.map((c) => ({ ...c.toObject(), id: c._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies", details: err.message });
  }
});
app.get("/api/companies/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    if (company.status === "discovered") {
      company.status = "outreached";
      company.contacts = [{
        name: "Michael Schmidt",
        title: "Director of Manufacturing",
        emailBest: "m.schmidt@industrial-corp.com",
        emailCandidates: ["m.schmidt@industrial-corp.com", "michael.schmidt@industrial-corp.com"],
        emailStatus: "verified",
        whatsapp: "+49 123 456789",
        whatsappPossible: true,
        source: "LinkedIn",
        confidence: 0.95,
        createdAt: /* @__PURE__ */ new Date()
      }];
      company.research = {
        summary: `${company.name} is a leading Tier 1 automotive supplier. They recently announced a 50M EUR expansion.`,
        signals: [
          {
            type: "expansion",
            subType: "new_facility_construction",
            strength: "trigger",
            score: 95,
            evidence: {
              snippet: "New 5000sqm production hall under construction in Stuttgart.",
              timestamp: /* @__PURE__ */ new Date()
            },
            source: "Gov_Portal",
            confidence: 0.98
          },
          {
            type: "hiring",
            subType: "manual_painter_urgent",
            strength: "trigger",
            score: 90,
            evidence: {
              snippet: "Hiring 3 new Paint Shop Technicians for manual spray line.",
              timestamp: /* @__PURE__ */ new Date()
            },
            source: "LinkedIn",
            confidence: 0.95
          }
        ],
        purchaseIntent: "high",
        keyHooks: ["New Stuttgart facility expansion", "Recent hiring of paint shop staff", "Focus on liquid coating efficiency"],
        updatedAt: /* @__PURE__ */ new Date()
      };
      company.score = {
        total: 95,
        tier: "Tier A (Critical Pain)",
        breakdown: {
          triggerScore: 95,
          behaviorScore: 80,
          structuralScore: 85
        },
        reasons: ["Strong expansion trigger detected", "Urgent manual painter hiring found", "High industry relevance"],
        updatedAt: /* @__PURE__ */ new Date()
      };
      company.outreach = {
        emailA: {
          subject: `Optimizing Paint Efficiency for ${company.name}'s New Stuttgart Hall`,
          body: `Dear Michael,

I noticed your recent 50M EUR expansion in Stuttgart. Given your focus on chassis components, our automated liquid coating cells could reduce your VOC emissions by 30% while maintaining the \xB10.1mm precision your Tier 1 clients demand.

Would you be open to a brief ROI calculation for the new hall?

Best regards,
AI SDR @ VertaX`,
          citedEvidenceIds: ["ev_1"]
        },
        emailB: {
          subject: "Question regarding your new Paint Shop Technicians hiring",
          body: `Hi Michael,

I saw you are hiring for the paint shop. Many of our clients find that our "Easy-Start" robotic cells allow junior technicians to achieve senior-level finish quality within 2 days of training.

Worth a 5-minute chat?

Best,
VertaX Team`,
          citedEvidenceIds: ["ev_2"]
        },
        whatsapp: {
          message: `Hi Michael, saw the news about the new Stuttgart hall! Our automated paint cells might be a perfect fit for the expansion. Sent you an email with some ROI data. Cheers!`,
          citedEvidenceIds: ["ev_1"]
        },
        updatedAt: /* @__PURE__ */ new Date()
      };
      await company.save();
    }
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch company", details: err.message });
  }
});
app.get("/api/social/accounts", async (req, res) => {
  try {
    const accounts = await SocialAccount.find().sort({ createdAt: -1 });
    res.json(accounts.map((a) => ({
      ...a.toObject(),
      id: a._id.toString(),
      // Strip tokens from response
      accessToken: void 0,
      refreshToken: void 0
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch social accounts", details: err.message });
  }
});
app.get("/api/social/posts", async (req, res) => {
  try {
    const { status, platform } = req.query;
    const query = {};
    if (status) query.status = status;
    if (platform) query.platforms = platform;
    const posts = await SocialPost.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(posts.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts", details: err.message });
  }
});
app.post("/api/social/posts", async (req, res) => {
  try {
    const { content, platforms, scheduledFor, mediaUrls, tags } = req.body;
    if (!content || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: "Content and platforms are required" });
    }
    const status = scheduledFor ? "scheduled" : "published";
    const post = await SocialPost.create({
      content,
      platforms,
      mediaUrls: mediaUrls || [],
      tags: tags || [],
      status,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : void 0,
      publishedAt: !scheduledFor ? /* @__PURE__ */ new Date() : void 0,
      metrics: !scheduledFor ? {
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
        engagementRate: 0
      } : void 0
    });
    res.json({ ...post.toObject(), id: post._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to create post", details: err.message });
  }
});
app.get("/api/social/posts/:id", async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ ...post.toObject(), id: post._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post", details: err.message });
  }
});
app.put("/api/social/posts/:id", async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ ...post.toObject(), id: post._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update post", details: err.message });
  }
});
app.delete("/api/social/posts/:id", async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post", details: err.message });
  }
});
app.get("/api/social/analytics/overview", async (req, res) => {
  try {
    const totalPosts = await SocialPost.countDocuments({ status: "published" });
    const scheduledPosts = await SocialPost.countDocuments({ status: "scheduled" });
    const publishedPosts = await SocialPost.find({ status: "published" });
    let totalImpressions = 0;
    let totalEngagement = 0;
    for (const post of publishedPosts) {
      if (post.metrics) {
        totalImpressions += post.metrics.impressions;
        totalEngagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
      }
    }
    const accounts = await SocialAccount.find();
    const connectedAccounts = accounts.filter((a) => a.status === "active").length;
    res.json({
      totalPosts,
      scheduledPosts,
      totalImpressions,
      totalEngagement,
      connectedAccounts,
      totalAccounts: accounts.length
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics", details: err.message });
  }
});
app.get("/api/social/analytics/engagement", async (req, res) => {
  try {
    const metrics = await SocialMetric.find().sort({ metricDate: -1 }).limit(30);
    res.json(metrics.map((m) => ({ ...m.toObject(), id: m._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch engagement data", details: err.message });
  }
});
app.post("/api/knowledge/extract", async (req, res) => {
  try {
    const { text, sourceName } = req.body;
    if (!text) return res.status(400).json({ error: "Text content is required" });
    const { parsed: result } = await generateAIContent(
      `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u5DE5\u4E1A\u6570\u636E\u5206\u6790\u5E08\u3002\u8BF7\u4ECE\u4EE5\u4E0B\u6280\u672F\u6587\u672C\u4E2D\u63D0\u53D6\u5173\u952E\u4FE1\u606F\uFF0C\u5E76\u5C06\u5176\u8F6C\u5316\u4E3A\u7ED3\u6784\u5316\u7684\u77E5\u8BC6\u5361\u7247\u3002
        
\u6587\u672C\u5185\u5BB9\uFF1A
${text}

\u8981\u6C42\uFF1A
1. \u8BC6\u522B\u8FD9\u5C5E\u4E8E"\u4EA7\u54C1\u670D\u52A1 (Offering)"\u8FD8\u662F"\u4F01\u4E1A\u753B\u50CF (Company)"\u8FD8\u662F"\u6848\u4F8B\u8BC1\u660E (Proof)"\u3002
2. \u63D0\u53D6\u81F3\u5C113\u4E2A\u6838\u5FC3\u5B57\u6BB5\u3002
3. \u8BC6\u522B\u53EF\u80FD\u7684\u7F3A\u5931\u5B57\u6BB5\u53CA\u5176\u5BF9\u4E1A\u52A1\u7684\u5F71\u54CD\u3002
4. \u8FD4\u56DE\u7B26\u5408\u5B9A\u4E49\u7684JSON\u7ED3\u6784\u3002`,
      { responseSchema: knowledgeExtractionSchema }
    );
    if (!result) throw new Error("AI returned empty response");
    res.json({
      id: `k-${Date.now()}`,
      ...result,
      missingFields: result.missingFields || [],
      evidence: [{ sourceId: `src-${Date.now()}`, sourceName: sourceName || "\u624B\u52A8\u7C98\u8D34\u6587\u672C" }]
    });
  } catch (error) {
    console.error("Knowledge extraction error:", error);
    res.status(500).json({ error: "AI extraction failed", details: error.message });
  }
});
app.post("/api/content/generate", async (req, res) => {
  try {
    const { contentType, knowledgeCards: cards, language = "English" } = req.body;
    if (!cards || cards.length === 0) return res.status(400).json({ error: "Knowledge cards are required" });
    const { parsed: result } = await generateAIContent(
      `You are a professional B2B industrial content marketing expert. Generate a ${contentType || "Procurement Guide"} based on the following knowledge cards.
        
Target Language: ${language}
Knowledge Source:
${JSON.stringify(cards, null, 2)}

Requirements:
1. Write the content in ${language}. This is for overseas markets - NEVER use Chinese unless explicitly requested.
2. Never fabricate facts. If key parameters are missing (e.g., pressure, temperature, specific certifications), mark them in the text as [TO BE FILLED: field name].
3. Identify what additional fields are needed to complete this content.
4. Return structured JSON with title, body paragraphs, and field reference tracking.
5. Use professional industry terminology appropriate for the target market.`,
      { responseSchema: contentGenerationSchema }
    );
    if (!result) throw new Error("AI returned empty response");
    res.json(result);
  } catch (error) {
    console.error("Content generation error:", error);
    res.status(500).json({ error: "Content generation failed", details: error.message });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { message, role, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    const productCount = await Product.countDocuments();
    const runCount = await LeadRun.countDocuments();
    const companyCount = await Company.countDocuments();
    const postCount = await SocialPost.countDocuments({ status: "published" });
    const products = await Product.find().limit(3);
    const { content: reply } = await generateAIContent(
      `\u7528\u6237\u63D0\u95EE: ${message}`,
      {
        systemPrompt: `\u4F60\u662F VertaX \u51FA\u6D77\u83B7\u5BA2\u667A\u80FD\u4F53\uFF0C\u4E3A\u5236\u9020\u4F01\u4E1A\u51FA\u6D77\u63D0\u4F9B\u589E\u957F\u6218\u7565\u5EFA\u8BAE\u3002
\u5F53\u524D\u7CFB\u7EDF\u6570\u636E\uFF1A
- \u5DF2\u5EFA\u6A21\u4EA7\u54C1: ${productCount} \u4E2A
- \u5DF2\u6267\u884C\u83B7\u5BA2\u4EFB\u52A1: ${runCount} \u6B21
- \u5DF2\u53D1\u73B0\u6F5C\u5728\u5BA2\u6237: ${companyCount} \u5BB6
- \u5DF2\u53D1\u5E03\u793E\u4EA4\u5185\u5BB9: ${postCount} \u6761
- \u4EA7\u54C1\u5217\u8868: ${products.map((p) => p.name).join(", ")}
\u5F53\u524D\u7528\u6237\u89D2\u8272: ${role || "CEO"}

\u8BF7\u4EE5\u4E13\u4E1A\u7684\u51FA\u6D77\u83B7\u5BA2\u987E\u95EE\u8EAB\u4EFD\u56DE\u7B54\uFF0C\u7B80\u6D01\u7CBE\u70BC\uFF0C\u63D0\u4F9B\u53EF\u6267\u884C\u7684\u5EFA\u8BAE\u3002\u5982\u6D89\u53CA\u7CFB\u7EDF\u529F\u80FD\uFF0C\u53EF\u5F15\u5BFC\u7528\u6237\u4F7F\u7528\u76F8\u5173\u6A21\u5757\u3002\u56DE\u7B54\u4F7F\u7528\u4E2D\u6587\u3002`
      }
    );
    res.json({ reply: reply || "\u62B1\u6B49\uFF0C\u6211\u6682\u65F6\u65E0\u6CD5\u5904\u7406\u8FD9\u4E2A\u8BF7\u6C42\u3002" });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed", details: error.message });
  }
});
app.post("/api/companies/:id/outreach/generate", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { parsed: outreach } = await generateAIContent(
      `You are an expert B2B outreach copywriter for industrial automation. Generate personalized outreach messages for this prospect:

COMPANY: ${company.name}
INDUSTRY: ${company.industry}
COUNTRY: ${company.country}
NOTES: ${company.notes || "N/A"}
RESEARCH: ${JSON.stringify(company.research || {}, null, 2)}
SCORE: ${JSON.stringify(company.score || {}, null, 2)}

Generate 2 email variants (A/B) and 1 WhatsApp message. 
- Email A: Focus on the strongest pain point/signal detected.
- Email B: Focus on quick ROI / easy implementation angle.
- WhatsApp: Short, casual, reference one specific insight.
All emails should cite specific evidence found about the company.`,
      { responseSchema: outreachSchema }
    );
    if (!outreach) throw new Error("AI returned empty response");
    company.outreach = { ...outreach, updatedAt: /* @__PURE__ */ new Date() };
    company.status = "outreached";
    await company.save();
    res.json(outreach);
  } catch (error) {
    console.error("Outreach generation error:", error);
    res.status(500).json({ error: "Outreach generation failed", details: error.message });
  }
});
app.get("/api/stats/dashboard", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const runCount = await LeadRun.countDocuments();
    const runningRuns = await LeadRun.countDocuments({ status: "running" });
    const doneRuns = await LeadRun.countDocuments({ status: "done" });
    const companyCount = await Company.countDocuments();
    const scoredCompanies = await Company.countDocuments({ status: "scored" });
    const outreachedCompanies = await Company.countDocuments({ status: "outreached" });
    const publishedPosts = await SocialPost.countDocuments({ status: "published" });
    const scheduledPosts = await SocialPost.countDocuments({ status: "scheduled" });
    const posts = await SocialPost.find({ status: "published" });
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
      social: { published: publishedPosts, scheduled: scheduledPosts, impressions: totalImpressions, engagement: totalEngagement }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard stats", details: err.message });
  }
});
app.get("/api/auth/x/authorize", (req, res) => {
  res.json({ message: "X OAuth not yet configured", authUrl: null });
});
app.get("/api/auth/x/callback", (req, res) => {
  res.json({ message: "X OAuth callback not yet configured" });
});
app.get("/api/auth/facebook/authorize", (req, res) => {
  res.json({ message: "Facebook OAuth not yet configured", authUrl: null });
});
app.get("/api/auth/facebook/callback", (req, res) => {
  res.json({ message: "Facebook OAuth callback not yet configured" });
});
app.get("/api/integrations", async (req, res) => {
  try {
    const { ApiIntegration: ApiIntegration2 } = await Promise.resolve().then(() => (init_ApiIntegration(), ApiIntegration_exports));
    const integrations = await ApiIntegration2.find();
    res.json(integrations.map((i) => ({
      ...i.toObject(),
      id: i._id.toString(),
      credentials: void 0
      // Strip credentials
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch integrations", details: err.message });
  }
});
app.use((err, req, res, next) => {
  console.error("Unhandled Express error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});
if (!process.env.VERCEL) {
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname_resolved, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname_resolved, "dist", "index.html"));
      });
    }
    const PORT = 3e3;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
}
var server_default = app;
export {
  server_default as default
};
