/**
 * 国家 → 招投标平台映射
 * 根据目标国家返回对应的招投标平台列表，每个平台附带 site: 搜索前缀帮助 AI 聚焦搜索
 */

export interface TenderPlatform {
  name: string;
  searchPrefix: string;  // Google search site: prefix
  description: string;
}

// EU 成员国列表
const EU_COUNTRIES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
]);

// 主要招投标平台定义
const PLATFORMS: Record<string, TenderPlatform> = {
  TED: {
    name: 'TED (EU Tenders)',
    searchPrefix: 'site:ted.europa.eu',
    description: 'Tenders Electronic Daily - EU public procurement'
  },
  SAM_GOV: {
    name: 'SAM.gov',
    searchPrefix: 'site:sam.gov',
    description: 'US Federal procurement opportunities'
  },
  UNGM: {
    name: 'UNGM',
    searchPrefix: 'site:ungm.org',
    description: 'UN Global Marketplace - International tenders'
  },
  WORLD_BANK: {
    name: 'World Bank Procurement',
    searchPrefix: 'site:projects.worldbank.org OR site:devbusiness.un.org',
    description: 'World Bank funded projects'
  },
  CONTRACTS_FINDER: {
    name: 'Contracts Finder (UK)',
    searchPrefix: 'site:contractsfinder.service.gov.uk',
    description: 'UK public sector contracts'
  },
  CANADA_BUYS: {
    name: 'CanadaBuys',
    searchPrefix: 'site:canadabuys.canada.ca OR site:buyandsell.gc.ca',
    description: 'Canadian government procurement'
  },
  AUSTENDER: {
    name: 'AusTender',
    searchPrefix: 'site:tenders.gov.au',
    description: 'Australian government tenders'
  },
  GEM_INDIA: {
    name: 'GeM India',
    searchPrefix: 'site:gem.gov.in',
    description: 'Government e-Marketplace India'
  },
  GERMANY_PORTAL: {
    name: 'German eTendering',
    searchPrefix: 'site:evergabe-online.de OR site:bund.de',
    description: 'German public procurement portal'
  },
  FRANCE_BOAMP: {
    name: 'BOAMP France',
    searchPrefix: 'site:boamp.fr OR site:marches-publics.gouv.fr',
    description: 'French public procurement announcements'
  },
  JAPAN_JETRO: {
    name: 'JETRO Japan',
    searchPrefix: 'site:jetro.go.jp',
    description: 'Japan public procurement'
  },
  KOREA_PPS: {
    name: 'Korea PPS',
    searchPrefix: 'site:pps.go.kr',
    description: 'Korean Public Procurement Service'
  },
  SINGAPORE_GEBIZ: {
    name: 'GeBIZ Singapore',
    searchPrefix: 'site:gebiz.gov.sg',
    description: 'Singapore government procurement'
  },
  MEXICO_COMPRANET: {
    name: 'CompraNet Mexico',
    searchPrefix: 'site:compranet.hacienda.gob.mx',
    description: 'Mexican government procurement'
  },
  BRAZIL_COMPRASNET: {
    name: 'ComprasNet Brazil',
    searchPrefix: 'site:comprasgovernamentais.gov.br',
    description: 'Brazilian government procurement'
  }
};

// 国家到平台的映射
const COUNTRY_PLATFORM_MAP: Record<string, string[]> = {
  // North America
  'United States': ['SAM_GOV', 'UNGM'],
  'USA': ['SAM_GOV', 'UNGM'],
  'Canada': ['CANADA_BUYS', 'UNGM'],
  'Mexico': ['MEXICO_COMPRANET', 'UNGM'],
  
  // UK & Ireland
  'United Kingdom': ['CONTRACTS_FINDER', 'TED', 'UNGM'],
  'UK': ['CONTRACTS_FINDER', 'TED', 'UNGM'],
  'Ireland': ['TED', 'UNGM'],
  
  // Asia Pacific
  'Australia': ['AUSTENDER', 'UNGM'],
  'New Zealand': ['UNGM', 'WORLD_BANK'],
  'Japan': ['JAPAN_JETRO', 'UNGM'],
  'South Korea': ['KOREA_PPS', 'UNGM'],
  'Korea': ['KOREA_PPS', 'UNGM'],
  'Singapore': ['SINGAPORE_GEBIZ', 'UNGM'],
  'India': ['GEM_INDIA', 'UNGM', 'WORLD_BANK'],
  'China': ['UNGM', 'WORLD_BANK'],
  'Vietnam': ['UNGM', 'WORLD_BANK'],
  'Thailand': ['UNGM', 'WORLD_BANK'],
  'Indonesia': ['UNGM', 'WORLD_BANK'],
  'Malaysia': ['UNGM', 'WORLD_BANK'],
  'Philippines': ['UNGM', 'WORLD_BANK'],
  
  // South America
  'Brazil': ['BRAZIL_COMPRASNET', 'UNGM'],
  'Argentina': ['UNGM', 'WORLD_BANK'],
  'Chile': ['UNGM', 'WORLD_BANK'],
  'Colombia': ['UNGM', 'WORLD_BANK'],
  
  // Middle East
  'UAE': ['UNGM', 'WORLD_BANK'],
  'United Arab Emirates': ['UNGM', 'WORLD_BANK'],
  'Saudi Arabia': ['UNGM', 'WORLD_BANK'],
  'Israel': ['UNGM'],
  'Turkey': ['UNGM', 'WORLD_BANK'],
  
  // Africa
  'South Africa': ['UNGM', 'WORLD_BANK'],
  'Egypt': ['UNGM', 'WORLD_BANK'],
  'Nigeria': ['UNGM', 'WORLD_BANK'],
  'Kenya': ['UNGM', 'WORLD_BANK'],
  
  // EU specific national portals (in addition to TED)
  'Germany': ['TED', 'GERMANY_PORTAL', 'UNGM'],
  'France': ['TED', 'FRANCE_BOAMP', 'UNGM'],
};

/**
 * 获取指定国家对应的招投标平台列表
 * @param country 目标国家名称
 * @returns 平台列表，每个包含名称、搜索前缀和描述
 */
export function getTenderPlatforms(country: string): TenderPlatform[] {
  const normalizedCountry = country.trim();
  
  // 1. 检查是否有直接映射
  const directMapping = COUNTRY_PLATFORM_MAP[normalizedCountry];
  if (directMapping) {
    return directMapping.map(key => PLATFORMS[key]).filter(Boolean);
  }
  
  // 2. 检查是否是 EU 国家
  if (EU_COUNTRIES.has(normalizedCountry)) {
    return [PLATFORMS.TED, PLATFORMS.UNGM];
  }
  
  // 3. 默认返回国际平台
  return [PLATFORMS.UNGM, PLATFORMS.WORLD_BANK];
}

/**
 * 获取所有支持的平台列表（用于 UI 显示）
 */
export function getAllPlatforms(): TenderPlatform[] {
  return Object.values(PLATFORMS);
}

/**
 * 根据招标截止日期计算信号强度
 * @param deadline ISO 日期字符串或描述性文本
 * @returns 'trigger' | 'high' | 'medium'
 */
export function calculateTenderStrength(deadline?: string): 'trigger' | 'high' | 'medium' {
  if (!deadline) return 'high';
  
  try {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return 'high';
    
    const daysUntil = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    if (daysUntil < 0) return 'medium';    // 已过期
    if (daysUntil < 30) return 'trigger';  // 紧急 (< 30 天)
    if (daysUntil < 90) return 'high';     // 即将到来 (< 90 天)
    return 'medium';                        // 较远
  } catch {
    return 'high';
  }
}
