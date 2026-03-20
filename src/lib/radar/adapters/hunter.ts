/**
 * Hunter.io 适配器
 * 
 * 功能：
 * - 邮箱查找：根据域名查找公司邮箱格式
 * - 邮箱验证：验证邮箱是否有效
 * 
 * 免费额度：25次/月
 * 文档：https://hunter.io/api-documentation
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
export const HUNTER_SOURCE_TYPE = 'OFFICIAL_API' as const;

// ==================== API 响应类型 ====================

interface HunterDomainSearchResponse {
  data: {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    accept_all: boolean;
    pattern: string;
    organization: string;
    emails: Array<{
      value: string;
      type: string;
      confidence: number;
      sources: Array<{ domain: string; uri: string }>;
      first_name: string;
      last_name: string;
      phone_number?: string;
      position?: string;
      department?: string;
      linkedin?: string;
      twitter?: string;
    }>;
    meta: {
      results: number;
      limit: number;
      offset: number;
    };
  };
  meta: {
    status: number;
    params: {
      domain: string;
      company: string;
      limit: number;
      offset: number;
      type: string;
      seniority: string;
      department: string;
    };
  };
}

interface HunterEmailVerifierResponse {
  data: {
    status: string; // valid, invalid, accept_all, disposable, webmail, unknown
    result: string; // deliverable, undeliverable, risky
    score: number;
    email: string;
    regexp?: boolean;
    gibberish?: boolean;
    did_you_mean?: string;
    disposable?: boolean;
    webmail?: boolean;
    mx_records?: boolean;
    smtp_server?: boolean;
    smtp_check?: boolean;
    accept_all?: boolean;
    block?: boolean;
    sources?: Array<{ domain: string; uri: string }>;
  };
}

// ==================== Hunter.io 适配器 ====================

export class HunterAdapter implements RadarAdapter {
  readonly sourceCode = 'hunter';
  readonly channelType = 'DIRECTORY' as const;

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: false,
    supportsCategoryFilter: false,
    supportsDateFilter: false,
    supportsRegionFilter: false,
    supportsPagination: true,
    supportsDetails: true,
    maxResultsPerQuery: 100,
    rateLimit: { requests: 25, windowMs: 60000 }, // 25/月免费额度
  };

  private apiKey: string;
  private baseUrl = 'https://api.hunter.io/v2';
  private timeout: number;

  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey || process.env.HUNTER_API_KEY || '';
    this.timeout = config.timeout || 30000;
  }

  /**
   * 根据域名搜索邮箱
   */
  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('Hunter API key not configured');
    }

    // 从查询中提取域名
    const domain = query.keywords?.[0] || '';
    if (!domain || !this.isValidDomain(domain)) {
      return {
        items: [],
        total: 0,
        hasMore: false,
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration: Date.now() - startTime,
        },
        isExhausted: true,
      };
    }

    const params = new URLSearchParams({
      domain,
      api_key: this.apiKey,
      limit: String(Math.min(query.pageSize || 20, 100)),
    });

    if (query.cursor?.nextPage) {
      params.set('offset', String(query.cursor.nextPage));
    }

    try {
      const response = await fetch(`${this.baseUrl}/domain-search?${params}`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`);
      }

      const data: HunterDomainSearchResponse = await response.json();
      const duration = Date.now() - startTime;

      const items = data.data.emails.map(email => this.normalizeEmail(email, domain));

      return {
        items,
        total: data.data.meta.results,
        hasMore: items.length >= (query.pageSize || 20),
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration,
        },
        nextCursor: items.length >= (query.pageSize || 20)
          ? { nextPage: (query.cursor?.nextPage || 0) + 1 }
          : undefined,
        isExhausted: items.length < (query.pageSize || 20),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(email: string): Promise<{
    valid: boolean;
    status: string;
    score: number;
    didYouMean?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Hunter API key not configured');
    }

    const params = new URLSearchParams({
      email,
      api_key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/email-verifier?${params}`, {
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Hunter API error: ${response.status}`);
    }

    const data: HunterEmailVerifierResponse = await response.json();

    return {
      valid: data.data.status === 'valid',
      status: data.data.status,
      score: data.data.score,
      didYouMean: data.data.did_you_mean,
    };
  }

  /**
   * 根据域名和姓名猜测邮箱
   */
  async findEmail(domain: string, firstName: string, lastName: string): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: this.apiKey,
    });

    try {
      const response = await fetch(`${this.baseUrl}/email-finder?${params}`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data?.email || null;
    } catch {
      return null;
    }
  }

  private normalizeEmail(
    email: HunterDomainSearchResponse['data']['emails'][0],
    domain: string
  ): NormalizedCandidate {
    return {
      externalId: `hunter-${email.value}`,
      sourceUrl: `https://hunter.io/verify/${email.value}`,
      displayName: `${email.first_name} ${email.last_name}`.trim() || email.value,
      candidateType: 'CONTACT',

      email: email.value,
      phone: email.phone_number,

      contactRole: email.position,
      linkedCompanyExternalId: domain,

      matchExplain: {
        channel: 'hunter',
        reasons: [`置信度: ${email.confidence}%`, `来源: ${email.sources?.length || 0} 个`],
      },
      matchScore: email.confidence / 100,

      rawData: email,
    };
  }

  private isValidDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(domain);
  }

  /**
   * 标准化原始数据为 NormalizedCandidate
   */
  normalize(raw: unknown): NormalizedCandidate {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid raw data for Hunter adapter');
    }

    const data = raw as Record<string, unknown>;

    // 处理域名搜索返回的邮箱数据
    if (data.value && typeof data.value === 'string') {
      return {
        externalId: `hunter-${data.value}`,
        sourceUrl: `https://hunter.io/verify/${data.value}`,
        displayName: [data.first_name, data.last_name].filter(Boolean).join(' ') || data.value as string,
        candidateType: 'CONTACT',

        email: data.value as string,
        phone: data.phone_number as string | undefined,

        contactRole: data.position as string | undefined,
        linkedCompanyExternalId: data.domain as string | undefined,

        matchExplain: {
          channel: 'hunter',
          reasons: [`置信度: ${data.confidence || 0}%`],
        },
        matchScore: typeof data.confidence === 'number' ? data.confidence / 100 : 0,

        rawData: data,
      };
    }

    // 处理邮箱验证返回的数据
    if (data.email && typeof data.email === 'string') {
      return {
        externalId: `hunter-verify-${data.email}`,
        sourceUrl: `https://hunter.io/verify/${data.email}`,
        displayName: data.email,
        candidateType: 'CONTACT',

        email: data.email,
        matchScore: typeof data.score === 'number' ? data.score / 100 : 0,

        rawData: data,
      };
    }

    throw new Error('Unrecognized Hunter data format');
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
      // 使用账户信息检查
      const response = await fetch(`${this.baseUrl}/account?api_key=${this.apiKey}`, {
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

export default HunterAdapter;