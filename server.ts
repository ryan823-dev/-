import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Product, LeadRun, Company, Contact, Evidence, Research, Scoring, Outreach, ICPProfile, LeadTier, SignalType, SignalStrength, ShadowSignal } from './types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AI Configuration ---
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- In-Memory Store (Mock DB) ---
const db = {
  products: [] as Product[],
  leadRuns: [] as LeadRun[],
  companies: [] as Company[],
  contacts: [] as Contact[],
  evidence: [] as Evidence[],
  research: [] as Research[],
  scoring: [] as Scoring[],
  outreach: [] as Outreach[],
};

// Initial Mock Data
const initialProduct: Product = {
  id: 'prod_1',
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
  createdAt: new Date().toISOString(),
};
db.products.push(initialProduct);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // --- API Routes ---

  // Products
  app.get('/api/products', (req, res) => res.json(db.products));
  app.post('/api/products', (req, res) => {
    const product = { ...req.body, id: `prod_${Date.now()}`, createdAt: new Date().toISOString() };
    db.products.push(product);
    res.json(product);
  });
  app.put('/api/products/:id', (req, res) => {
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    db.products[index] = { ...db.products[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(db.products[index]);
  });

  // ICP Generation (AI Driven)
  app.post('/api/products/:id/icp/generate', async (req, res) => {
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    console.log(`Generating ICP for product: ${product.name}`);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in the environment.');
      }
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a senior B2B Industrial Export Consultant. Generate a high-precision Ideal Customer Profile (ICP) for this product:
        
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
        4. Query Pack: Generate search strings.
        5. Signal Pack: Identify "Shadow Signals" that indicate pain (Regulation, Hiring, Expansion, Automation).
        6. Disqualifiers: Technical or financial "red flags".
        7. Scenarios: Business triggers.
        
        The output must be a structured JSON matching the ICPProfile schema.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              industryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetCustomerTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
              queryPack: {
                type: Type.OBJECT,
                properties: {
                  google: { type: Type.ARRAY, items: { type: Type.STRING } },
                  linkedin: { type: Type.ARRAY, items: { type: Type.STRING } },
                  directories: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              signalPack: {
                type: Type.OBJECT,
                properties: {
                  regulation: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Regulation/Violation keywords' },
                  hiring: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Job titles indicating pain' },
                  expansion: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Expansion/Construction keywords' },
                  automation: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Automation upgrade keywords' }
                }
              },
              disqualifiers: { type: Type.ARRAY, items: { type: Type.STRING } },
              scenarioPack: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['industryTags', 'targetCustomerTypes', 'targetTitles', 'queryPack', 'signalPack', 'disqualifiers', 'scenarioPack']
          }
        }
      });

      if (!response.text) {
        throw new Error('AI returned empty response');
      }

      const icpData = JSON.parse(response.text);
      const icp: ICPProfile = {
        ...icpData,
        version: (product.icpProfile?.version || 0) + 1,
        updatedAt: new Date().toISOString()
      };
      
      product.icpProfile = icp;
      res.json(icp);
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate ICP via AI',
        details: error.message || 'Unknown error'
      });
    }
  });

  // Lead Runs
  app.get('/api/runs', (req, res) => res.json(db.leadRuns));
  app.post('/api/runs', async (req, res) => {
    const run: LeadRun = {
      ...req.body,
      id: `run_${Date.now()}`,
      status: 'queued',
      progress: { discovery: 0, contact: 0, research: 0, outreach: 0, total: 0 },
      createdAt: new Date().toISOString()
    };
    db.leadRuns.push(run);
    
    // Start Real Background Process
    const startDiscovery = async () => {
      run.status = 'running';
      const product = db.products.find(p => p.id === run.productId);
      if (!product || !product.icpProfile) {
        run.status = 'failed';
        run.errorMessage = 'Product or ICP Profile missing';
        return;
      }

      try {
        const ai = getAI();
        const queries = product.icpProfile.queryPack.google.slice(0, 3); // Use first 3 queries
        
        console.log(`[Discovery] Starting real-time search for: ${run.country}`);
        
        for (const query of queries) {
          const fullQuery = `${query} in ${run.country}`;
          const searchResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find 5 real companies in ${run.country} that match this search intent: "${fullQuery}". 
            For each company, provide: Name, Website URL, Industry, and why they match.
            Focus on real, existing industrial companies.`,
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
                  required: ['name', 'website', 'industry', 'matchReason']
                }
              }
            }
          });

          const foundCompanies = JSON.parse(searchResponse.text || '[]');
          
          for (const fc of foundCompanies) {
            // Avoid duplicates
            if (db.companies.some(c => c.name === fc.name)) continue;

            const company: Company = {
              id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              leadRunId: run.id,
              name: fc.name,
              website: fc.website,
              country: run.country,
              industry: fc.industry,
              source: `AI Search: ${query}`,
              status: 'discovered',
              notes: fc.matchReason,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            db.companies.push(company);
            run.progress.discovery++;
          }
        }

        // --- Phase 2: Shadow Signal Detection (Real Research) ---
        run.status = 'running';
        const discovered = db.companies.filter(c => c.leadRunId === run.id);
        
        for (const company of discovered) {
          console.log(`[Research] Detecting Shadow Signals for: ${company.name}`);
          
          const signalResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Search for recent news, job openings, or environmental reports for the company "${company.name}" in ${run.country}. 
            Specifically look for:
            1. Hiring of "manual painters", "spray technicians", or "automation engineers".
            2. Environmental violations or VOC emission reports.
            3. New factory construction or production line expansion.
            
            Return a list of specific signals found. If none found, return empty array.`,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: 'hiring, regulation, expansion, or automation' },
                    subType: { type: Type.STRING },
                    strength: { type: Type.STRING, description: 'trigger, high, medium' },
                    snippet: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ['type', 'subType', 'strength', 'snippet']
                }
              }
            }
          });

          const rawSignals = JSON.parse(signalResponse.text || '[]');
          const signals: ShadowSignal[] = rawSignals.map((rs: any) => ({
            id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            companyId: company.id,
            type: rs.type as SignalType,
            subType: rs.subType,
            strength: rs.strength as SignalStrength,
            score: rs.strength === 'trigger' ? 100 : rs.strength === 'high' ? 70 : 40,
            evidence: {
              url: rs.url,
              snippet: rs.snippet,
              timestamp: new Date().toISOString()
            },
            source: 'AI Web Search',
            confidence: 0.9
          }));

          // Determine Tier
          let tier = LeadTier.TIER_C;
          if (signals.some(s => s.strength === SignalStrength.TRIGGER)) tier = LeadTier.TIER_A;
          else if (signals.some(s => s.strength === SignalStrength.HIGH)) tier = LeadTier.TIER_B;

          db.research.push({
            id: `res_${Date.now()}`,
            companyId: company.id,
            summary: `AI analyzed ${company.name} and found ${signals.length} relevant signals.`,
            signals: signals,
            purchaseIntent: tier === LeadTier.TIER_A ? 'high' : 'medium',
            keyHooks: signals.map(s => s.evidence.snippet),
            updatedAt: new Date().toISOString()
          });

          db.scoring.push({
            id: `score_${Date.now()}`,
            companyId: company.id,
            total: tier === LeadTier.TIER_A ? 95 : tier === LeadTier.TIER_B ? 75 : 50,
            tier: tier,
            breakdown: {
              triggerScore: tier === LeadTier.TIER_A ? 100 : 0,
              behaviorScore: tier === LeadTier.TIER_B ? 80 : 40,
              structuralScore: 70
            },
            reasons: signals.map(s => s.subType),
            updatedAt: new Date().toISOString()
          });

          company.status = 'scored';
          run.progress.research++;
        }

        run.status = 'done';
        run.finishedAt = new Date().toISOString();

      } catch (error: any) {
        console.error('Lead Run Error:', error);
        run.status = 'failed';
        run.errorMessage = error.message;
      }
    };

    startDiscovery();
    res.json(run);
  });

  // Companies
  app.get('/api/companies', (req, res) => {
    let results = db.companies;
    if (req.query.runId) {
      results = results.filter(c => c.leadRunId === req.query.runId);
    }
    res.json(results);
  });

  app.get('/api/companies/:id', (req, res) => {
    const company = db.companies.find(c => c.id === req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    // Auto-populate if empty (Deep Research simulation)
    if (company.status === 'discovered') {
      company.status = 'outreached';
      
      // Add Contacts
      const contact: Contact = {
        id: `cont_${Date.now()}`,
        companyId: company.id,
        name: 'Michael Schmidt',
        title: 'Director of Manufacturing',
        emailBest: 'm.schmidt@industrial-corp.com',
        emailCandidates: ['m.schmidt@industrial-corp.com', 'michael.schmidt@industrial-corp.com'],
        emailStatus: 'verified',
        whatsapp: '+49 123 456789',
        whatsappPossible: true,
        source: 'LinkedIn',
        confidence: 0.95,
        createdAt: new Date().toISOString()
      };
      db.contacts.push(contact);

      // Add Research
      const research: Research = {
        id: `res_${Date.now()}`,
        companyId: company.id,
        summary: `${company.name} is a leading Tier 1 automotive supplier in Germany, specializing in chassis components. They recently announced a 50M EUR expansion of their Stuttgart facility.`,
        signals: [
          { 
            id: 'sig_1',
            companyId: company.id,
            type: SignalType.EXPANSION, 
            subType: 'new_facility_construction',
            strength: SignalStrength.TRIGGER,
            score: 95,
            evidence: {
              snippet: 'New 5000sqm production hall under construction in Stuttgart.',
              timestamp: new Date().toISOString()
            },
            source: 'Gov_Portal',
            confidence: 0.98
          },
          { 
            id: 'sig_2',
            companyId: company.id,
            type: SignalType.HIRING, 
            subType: 'manual_painter_urgent',
            strength: SignalStrength.TRIGGER,
            score: 90,
            evidence: {
              snippet: 'Hiring 3 new Paint Shop Technicians for manual spray line.',
              timestamp: new Date().toISOString()
            },
            source: 'LinkedIn',
            confidence: 0.95
          }
        ],
        purchaseIntent: 'high',
        keyHooks: ['New Stuttgart facility expansion', 'Recent hiring of paint shop staff', 'Focus on liquid coating efficiency'],
        updatedAt: new Date().toISOString()
      };
      db.research.push(research);

      // Add Scoring
      const score: Scoring = {
        id: `score_${Date.now()}`,
        companyId: company.id,
        total: 95,
        tier: LeadTier.TIER_A,
        breakdown: { 
          triggerScore: 95,
          behaviorScore: 80,
          structuralScore: 85
        },
        reasons: ['Strong expansion trigger detected', 'Urgent manual painter hiring found', 'High industry relevance'],
        updatedAt: new Date().toISOString()
      };
      db.scoring.push(score);

      // Add Outreach
      const outreach: Outreach = {
        id: `out_${Date.now()}`,
        companyId: company.id,
        emailA: {
          subject: `Optimizing Paint Efficiency for ${company.name}'s New Stuttgart Hall`,
          body: `Dear Michael,\n\nI noticed Industrial Corp's recent 50M EUR expansion in Stuttgart. Given your focus on chassis components, our automated liquid coating cells could reduce your VOC emissions by 30% while maintaining the ±0.1mm precision your Tier 1 clients demand.\n\nWould you be open to a brief ROI calculation for the new hall?\n\nBest regards,\nAI SDR @ VertaX`,
          citedEvidenceIds: ['ev_1']
        },
        emailB: {
          subject: 'Question regarding your new Paint Shop Technicians hiring',
          body: `Hi Michael,\n\nI saw you are hiring for the paint shop. Many of our clients find that our "Easy-Start" robotic cells allow junior technicians to achieve senior-level finish quality within 2 days of training.\n\nWorth a 5-minute chat?\n\nBest,\nVertaX Team`,
          citedEvidenceIds: ['ev_2']
        },
        whatsapp: {
          message: `Hi Michael, saw the news about the new Stuttgart hall! Our automated paint cells might be a perfect fit for the expansion. Sent you an email with some ROI data. Cheers!`,
          citedEvidenceIds: ['ev_1']
        },
        updatedAt: new Date().toISOString()
      };
      db.outreach.push(outreach);
    }

    // Attach related data
    const contacts = db.contacts.filter(c => c.companyId === company.id);
    const research = db.research.find(r => r.companyId === company.id);
    const score = db.scoring.find(s => s.companyId === company.id);
    const outreach = db.outreach.find(o => o.companyId === company.id);
    const evidence = db.evidence.filter(e => e.companyId === company.id);

    res.json({ ...company, contacts, research, score, outreach, evidence });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
