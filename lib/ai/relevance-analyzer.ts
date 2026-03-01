import { generateAIContent } from './chat';
import { websiteAnalysisSchema } from './schemas';
import type { CrawledPage } from '../website-crawler';

// --- Types ---

export interface RelevanceResult {
  qualification: 'QUALIFIED' | 'MAYBE' | 'DISQUALIFIED';
  qualificationReason: string;
  relevanceScore: number;
  products: Array<{ name: string; description?: string }>;
  equipment: Array<{ type: string; brand?: string; context?: string }>;
  technologies: string[];
  companySize?: {
    employees?: string;
    facilities?: string;
    indicators?: string[];
  };
  breakdown: {
    industryMatch: { score: number; reasoning: string };
    businessRelevance: { score: number; reasoning: string };
    sizeMatch: { score: number; reasoning: string };
    technologyGap: { score: number; reasoning: string };
  };
}

interface ProductInfo {
  name: string;
  productType: string;
  icpProfile?: {
    industryTags?: string[];
    targetCustomerTypes?: string[];
    disqualifiers?: string[];
    scenarioPack?: string[];
    painPoints?: string[];
  };
}

const MAX_TOTAL_CONTENT = 15000;

// --- Core Function ---

/**
 * Analyze crawled website pages to determine business relevance against an ICP.
 * Returns structured qualification result with multi-dimensional scoring.
 */
export async function analyzeRelevance(
  pages: CrawledPage[],
  product: ProductInfo,
  language: string
): Promise<RelevanceResult> {
  const mergedContent = mergePageContent(pages);

  if (mergedContent.length < 50) {
    return createDefaultResult('MAYBE', 'Insufficient website content for analysis', 30);
  }

  const icp = product.icpProfile || {};
  const prompt = buildAnalysisPrompt(mergedContent, product, icp, language);

  try {
    const { parsed } = await generateAIContent(prompt, {
      responseSchema: websiteAnalysisSchema,
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (!parsed || !parsed.qualification) {
      return createDefaultResult('MAYBE', 'AI analysis returned incomplete result', 40);
    }

    // Normalize qualification value
    const qualification = normalizeQualification(parsed.qualification);

    // Calculate relevance score from breakdown if not provided or seems off
    const breakdown = parsed.breakdown || {};
    const calculatedScore = calculateRelevanceScore(breakdown);
    const relevanceScore = Math.max(0, Math.min(100, parsed.relevanceScore || calculatedScore));

    return {
      qualification,
      qualificationReason: parsed.qualificationReason || '',
      relevanceScore,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      companySize: parsed.companySize || undefined,
      breakdown: {
        industryMatch: {
          score: breakdown.industryMatch?.score ?? 50,
          reasoning: breakdown.industryMatch?.reasoning || 'No data'
        },
        businessRelevance: {
          score: breakdown.businessRelevance?.score ?? 50,
          reasoning: breakdown.businessRelevance?.reasoning || 'No data'
        },
        sizeMatch: {
          score: breakdown.sizeMatch?.score ?? 50,
          reasoning: breakdown.sizeMatch?.reasoning || 'No data'
        },
        technologyGap: {
          score: breakdown.technologyGap?.score ?? 30,
          reasoning: breakdown.technologyGap?.reasoning || 'No data'
        }
      }
    };
  } catch (err: any) {
    console.error('[RelevanceAnalyzer] AI analysis failed:', err.message);
    return createDefaultResult('MAYBE', `Analysis error: ${err.message?.substring(0, 80)}`, 30);
  }
}

/**
 * Fallback analysis when no website is available.
 * Uses company name + industry + Brave search results context.
 */
export async function analyzeFromSearchContext(
  companyName: string,
  country: string,
  industry: string,
  searchContext: string,
  product: ProductInfo
): Promise<RelevanceResult> {
  if (!searchContext || searchContext.length < 30) {
    return createDefaultResult('MAYBE', 'No website and insufficient search data', 25);
  }

  const icp = product.icpProfile || {};
  const prompt = `You are a B2B lead qualification expert. Based on limited search results, assess if "${companyName}" (${industry}, ${country}) could be a customer for "${product.name}".

## Our Product
- Name: ${product.name}
- Type: ${product.productType}
- Target Industries: ${(icp.industryTags || []).join(', ') || 'Not specified'}
- Target Customer Types: ${(icp.targetCustomerTypes || []).join(', ') || 'Not specified'}
- Disqualifiers: ${(icp.disqualifiers || []).join(', ') || 'None'}

## Search Results About This Company
${searchContext.substring(0, 5000)}

## Instructions
Since we only have search results (no website), be conservative:
- QUALIFIED only if search clearly confirms industry match + relevant business
- DISQUALIFIED only if clearly wrong industry or hits disqualifiers
- MAYBE for everything else (this is the expected default)

Estimate scores conservatively (30-60 range for most dimensions).
Return JSON only.`;

  try {
    const { parsed } = await generateAIContent(prompt, {
      responseSchema: websiteAnalysisSchema,
      temperature: 0.3,
      maxTokens: 1500,
    });

    if (!parsed) return createDefaultResult('MAYBE', 'Search-based analysis inconclusive', 35);

    return {
      qualification: normalizeQualification(parsed.qualification),
      qualificationReason: parsed.qualificationReason || 'Based on limited search data',
      relevanceScore: Math.max(0, Math.min(100, parsed.relevanceScore || 35)),
      products: Array.isArray(parsed.products) ? parsed.products : [],
      equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      companySize: parsed.companySize || undefined,
      breakdown: {
        industryMatch: { score: parsed.breakdown?.industryMatch?.score ?? 40, reasoning: parsed.breakdown?.industryMatch?.reasoning || 'Limited data' },
        businessRelevance: { score: parsed.breakdown?.businessRelevance?.score ?? 35, reasoning: parsed.breakdown?.businessRelevance?.reasoning || 'Limited data' },
        sizeMatch: { score: parsed.breakdown?.sizeMatch?.score ?? 40, reasoning: parsed.breakdown?.sizeMatch?.reasoning || 'Unknown' },
        technologyGap: { score: parsed.breakdown?.technologyGap?.score ?? 30, reasoning: parsed.breakdown?.technologyGap?.reasoning || 'Unknown' }
      }
    };
  } catch (err: any) {
    console.error('[RelevanceAnalyzer] Search-based analysis failed:', err.message);
    return createDefaultResult('MAYBE', 'Search-based analysis failed', 25);
  }
}

// --- Helpers ---

function mergePageContent(pages: CrawledPage[]): string {
  const sections: string[] = [];
  let totalLength = 0;

  // Priority order for sections
  const typeOrder: Array<CrawledPage['pageType']> = ['home', 'products', 'about', 'contact', 'other'];

  const sorted = [...pages]
    .filter(p => p.success && p.content.length > 20)
    .sort((a, b) => typeOrder.indexOf(a.pageType) - typeOrder.indexOf(b.pageType));

  for (const page of sorted) {
    const label = page.pageType.toUpperCase();
    const section = `=== ${label} PAGE (${page.url}) ===\n${page.content}`;

    if (totalLength + section.length > MAX_TOTAL_CONTENT) {
      const remaining = MAX_TOTAL_CONTENT - totalLength;
      if (remaining > 200) {
        sections.push(section.substring(0, remaining) + '...');
      }
      break;
    }

    sections.push(section);
    totalLength += section.length;
  }

  return sections.join('\n\n');
}

function buildAnalysisPrompt(
  mergedContent: string,
  product: ProductInfo,
  icp: ProductInfo['icpProfile'],
  language: string
): string {
  const langNote = language !== 'en'
    ? `\nNote: The website content is in ${getLanguageName(language)}. Extract information accordingly and respond in English.`
    : '';

  return `You are a B2B lead qualification expert for industrial equipment. Analyze this company's website content and determine if they are a potential customer for our product.

## Our Product
- Name: ${product.name}
- Type: ${product.productType}
- Target Industries: ${(icp?.industryTags || []).join(', ') || 'Not specified'}
- Target Customer Types: ${(icp?.targetCustomerTypes || []).join(', ') || 'Not specified'}
- Disqualifiers: ${(icp?.disqualifiers || []).join(', ') || 'None'}
- Purchase Scenarios: ${(icp?.scenarioPack || []).join(', ') || 'Not specified'}
- Customer Pain Points: ${(icp?.painPoints || []).join(', ') || 'Not specified'}
${langNote}

## Company Website Content
${mergedContent}

## Analysis Tasks
1. **Extract Products/Services**: What does this company produce or offer? List their main products.
2. **Extract Equipment**: What manufacturing equipment, production lines, or machinery do they mention? Look for paint lines, coating systems, automation equipment, CNC machines, etc.
3. **Extract Technologies**: What processes, standards (ISO, IATF), or technologies do they mention?
4. **Estimate Company Size**: Any mentions of employee count, number of facilities, production capacity, revenue?
5. **Score on 4 Dimensions** (0-100 each):
   - **industryMatch**: Is this company in one of our target industries? (e.g., automotive, furniture, metal fabrication, industrial manufacturing)
   - **businessRelevance**: Does their business suggest they need/use equipment like ours? Do they have manufacturing processes where our product would apply?
   - **sizeMatch**: Is the company the right size? (too small = can't afford, too large = has own solutions, sweet spot = mid-market manufacturers)
   - **technologyGap**: Are there signs they use manual processes, old equipment, or mention plans for automation/upgrades?
6. **Final Qualification**:
   - QUALIFIED: Clear industry match AND business relevance score >= 60. They genuinely appear to need our type of product.
   - DISQUALIFIED: Wrong industry entirely, OR pure trading company (no manufacturing), OR clearly hits a disqualifier.
   - MAYBE: Partial match, insufficient info, or ambiguous. When in doubt, use MAYBE.

Return JSON only, no markdown.`;
}

function normalizeQualification(value: string): 'QUALIFIED' | 'MAYBE' | 'DISQUALIFIED' {
  const upper = (value || '').toUpperCase().trim();
  if (upper === 'QUALIFIED') return 'QUALIFIED';
  if (upper === 'DISQUALIFIED') return 'DISQUALIFIED';
  return 'MAYBE';
}

function calculateRelevanceScore(breakdown: any): number {
  const weights = {
    industryMatch: 0.30,
    businessRelevance: 0.35,
    sizeMatch: 0.15,
    technologyGap: 0.20,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (breakdown?.[key]?.score ?? 50) * weight;
  }
  return Math.round(score);
}

function createDefaultResult(
  qualification: 'QUALIFIED' | 'MAYBE' | 'DISQUALIFIED',
  reason: string,
  score: number
): RelevanceResult {
  return {
    qualification,
    qualificationReason: reason,
    relevanceScore: score,
    products: [],
    equipment: [],
    technologies: [],
    breakdown: {
      industryMatch: { score, reasoning: reason },
      businessRelevance: { score, reasoning: reason },
      sizeMatch: { score: 50, reasoning: 'Unknown' },
      technologyGap: { score: 30, reasoning: 'Unknown' }
    }
  };
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    de: 'German', es: 'Spanish', fr: 'French', it: 'Italian',
    pt: 'Portuguese', vi: 'Vietnamese', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', tr: 'Turkish', pl: 'Polish', nl: 'Dutch',
    ru: 'Russian', ar: 'Arabic', th: 'Thai',
  };
  return names[code] || 'non-English';
}
