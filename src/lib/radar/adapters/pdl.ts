/**
 * People Data Labs 适配器
 * 
 * 功能：
 * - 联系人搜索：根据公司、职位等条件查找联系人
 * - 公司搜索：查找公司信息
 * - 联系人丰富化：补充联系人详细信息
 * 
 * 文档：https://docs.peopledatalabs.com/
 */

import type {
  RadarAdapter,
  RadarSearchQuery,
  RadarSearchResult,
  NormalizedCandidate,
  HealthStatus,
  AdapterFeatures,
  AdapterConfig,
} from '@/lib/radar/adapters/types';

// 数据源类型标注
export const PDL_SOURCE_TYPE = 'OFFICIAL_API' as const;

// ==================== API 响应类型 ====================

interface PDLPerson {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  work_email?: string;
  personal_emails?: string[];
  work_phone?: string;
  mobile_phone?: string;
  linkedin_url?: string;
  job_title?: string;
  job_title_levels?: string[];
  job_company_name?: string;
  job_company_website?: string;
  job_company_size?: string;
  job_company_industry?: string;
  job_start_date?: string;
  location_country?: string;
  location_region?: string;
  location_city?: string;
  skills?: string[];
  education?: Array<{
    school_name: string;
    degrees: string[];
    majors: string[];
  }>;
}

interface PDLSearchResponse {
  status: number;
  data: PDLPerson[];
  total: number;
  scroll_token?: string;
}

interface PDLCompany {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  employee_count?: number;
  founded?: number;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  linkedin_url?: string;
}

// ==================== PDL 适配器 ====================

export class PeopleDataLabsAdapter implements RadarAdapter {
  readonly sourceCode = 'pdl';
  readonly channelType = 'DIRECTORY' as const;

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: true,
    supportsCategoryFilter: true,
    supportsDateFilter: false,
    supportsRegionFilter: true,
    supportsPagination: true,
    supportsDetails: true,
    maxResultsPerQuery: 100,
    rateLimit: { requests: 10, windowMs: 60000 },
  };

  private apiKey: string;
  private baseUrl = 'https://api.peopledatalabs.com/v5';
  private timeout: number;

  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey || process.env.PDL_API_KEY || '';
    this.timeout = config.timeout || 30000;
  }

  /**
   * 搜索联系人
   */
  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('PDL API key not configured');
    }

    // 构建搜索查询
    const searchQuery: Record<string, unknown> = {};

    // 关键词 -> 职位/技能
    if (query.keywords?.length) {
      searchQuery.query = query.keywords.join(' ');
    }

    // 公司过滤
    if (query.targetIndustries?.length) {
      searchQuery.job_company_industry = query.targetIndustries;
    }

    // 国家过滤
    if (query.countries?.length) {
      searchQuery.location_country = query.countries;
    }

    const requestBody = {
      query: searchQuery.query || '',
      size: Math.min(query.pageSize || 20, 100),
      scroll_token: query.cursor?.nextPageToken,
      dataset: 'person',
    };

    try {
      const response = await fetch(`${this.baseUrl}/person/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`PDL API error: ${response.status}`);
      }

      const data: PDLSearchResponse = await response.json();
      const duration = Date.now() - startTime;

      const items = data.data.map(person => this.normalizePerson(person));

      return {
        items,
        total: data.total,
        hasMore: !!data.scroll_token,
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration,
        },
        nextCursor: data.scroll_token
          ? { nextPageToken: data.scroll_token }
          : undefined,
        isExhausted: !data.scroll_token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据公司域名搜索员工
   */
  async searchByCompany(
    companyDomain: string,
    options: {
      title?: string;
      seniority?: string[];
      limit?: number;
    } = {}
  ): Promise<NormalizedCandidate[]> {
    if (!this.apiKey) {
      return [];
    }

    const requestBody = {
      query: {
        job_company_website: companyDomain,
        ...(options.title && { job_title: options.title }),
        ...(options.seniority && { job_title_levels: options.seniority }),
      },
      size: options.limit || 20,
    };

    try {
      const response = await fetch(`${this.baseUrl}/person/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data: PDLSearchResponse = await response.json();
      return data.data.map(person => this.normalizePerson(person));
    } catch {
      return [];
    }
  }

  /**
   * 根据邮箱丰富化联系人信息
   */
  async enrichByEmail(email: string): Promise<NormalizedCandidate | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/person/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          emails: [email],
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.data?.person) {
        return this.normalizePerson(data.data.person);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 搜索公司
   */
  async searchCompany(
    query: string,
    options: {
      industry?: string;
      country?: string;
      size?: string;
      limit?: number;
    } = {}
  ): Promise<PDLCompany[]> {
    if (!this.apiKey) {
      return [];
    }

    const requestBody = {
      query,
      size: options.limit || 20,
      ...(options.industry && { industry: options.industry }),
      ...(options.country && { location_country: options.country }),
      ...(options.size && { employee_count: options.size }),
    };

    try {
      const response = await fetch(`${this.baseUrl}/company/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  }

  private normalizePerson(person: PDLPerson): NormalizedCandidate {
    return {
      externalId: `pdl-${person.id}`,
      sourceUrl: person.linkedin_url || `https://www.peopledatalabs.com/person/${person.id}`,
      displayName: person.full_name || `${person.first_name} ${person.last_name}`,
      candidateType: 'CONTACT',

      email: person.work_email,
      phone: person.work_phone || person.mobile_phone,
      country: person.location_country,
      city: person.location_city,

      contactRole: person.job_title,
      industry: person.job_company_industry,

      matchExplain: {
        channel: 'pdl',
        reasons: [
          `公司: ${person.job_company_name || '未知'}`,
          `职位: ${person.job_title || '未知'}`,
          ...(person.skills?.slice(0, 3).map(s => `技能: ${s}`) || []),
        ],
      },
      matchScore: 0.8, // PDL 数据通常较准确

      rawData: person as unknown as Record<string, unknown>,
    };
  }

  /**
   * 标准化原始数据为 NormalizedCandidate
   */
  normalize(raw: unknown): NormalizedCandidate {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid raw data for PDL adapter');
    }

    const person = raw as PDLPerson;

    if (!person.id) {
      throw new Error('PDL data missing required field: id');
    }

    return {
      externalId: `pdl-${person.id}`,
      sourceUrl: person.linkedin_url || `https://www.peopledatalabs.com/person/${person.id}`,
      displayName: person.full_name || `${person.first_name} ${person.last_name}`,
      candidateType: 'CONTACT',

      email: person.work_email,
      phone: person.work_phone || person.mobile_phone,
      country: person.location_country,
      city: person.location_city,

      contactRole: person.job_title,
      industry: person.job_company_industry,

      matchExplain: {
        channel: 'pdl',
        reasons: [
          `公司: ${person.job_company_name || '未知'}`,
          `职位: ${person.job_title || '未知'}`,
        ],
      },
      matchScore: 0.8,

      rawData: person as unknown as Record<string, unknown>,
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        healthy: false,
        latency: 0,
        error: 'API key not configured',
      };
    }

    try {
      // 使用 autocomplete 端点检查（不消耗配额）
      const response = await fetch(`${this.baseUrl}/autocomplete?field=job_title&text=test`, {
        headers: {
          'X-Api-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(10000),
      });

      return {
        healthy: response.ok,
        latency: Date.now() - startTime,
        lastCheckedAt: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        lastCheckedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default PeopleDataLabsAdapter;