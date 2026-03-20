// ==================== UNGM Adapter ====================
// 联合国全球市场平台适配器
// 官方 API 文档: https://developer.ungm.org/
// 数据源类型: 官方API (部分端点需要认证)

import type {
  RadarAdapter,
  RadarSearchQuery,
  RadarSearchResult,
  NormalizedCandidate,
  CandidateDetails,
  HealthStatus,
  AdapterFeatures,
  AdapterConfig,
} from './types';

// 数据源类型标注
export const UNGM_SOURCE_TYPE = 'OFFICIAL_API' as const;
export const UNGM_REQUIRES_AUTH = true; // 需要注册获取 access token

/**
 * UNGM 适配器
 * 
 * 使用方式：
 * 1. 在 UNGM 开发者中心注册: https://developer.ungm.org/
 * 2. 获取 Client ID 和 Client Secret
 * 3. 配置环境变量: UNGM_CLIENT_ID, UNGM_CLIENT_SECRET
 * 
 * 如果没有认证信息，将使用公开网页抓取作为备选
 */
export class UNGMAdapter implements RadarAdapter {
  readonly sourceCode = 'ungm';
  readonly channelType = 'TENDER' as const;

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: true,
    supportsCategoryFilter: true,
    supportsDateFilter: true,
    supportsRegionFilter: false,
    supportsPagination: true,
    supportsDetails: true,
    maxResultsPerQuery: 100,
    rateLimit: { requests: 10, windowMs: 60000 },
  };

  private apiEndpoint: string;
  private timeout: number;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: AdapterConfig) {
    this.apiEndpoint = config.apiEndpoint || 'https://www.ungm.org';
    this.timeout = config.timeout || 30000;
    this.clientId = config.clientId || process.env.UNGM_CLIENT_ID || '';
    this.clientSecret = config.clientSecret || process.env.UNGM_CLIENT_SECRET || '';
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string | null> {
    // 如果已有有效令牌，直接返回
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error('[UNGM] Token request failed:', response.status);
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // 令牌有效期，提前5分钟过期以确保安全
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('[UNGM] Token request error:', error);
      return null;
    }
  }

  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();

    // 尝试使用官方API
    const token = await this.getAccessToken();

    if (token) {
      return this.searchWithAPI(query, token, startTime);
    }

    // 回退到网页抓取
    return this.searchViaWebScrape(query, startTime);
  }

  /**
   * 使用官方API搜索
   */
  private async searchWithAPI(
    query: RadarSearchQuery,
    token: string,
    startTime: number
  ): Promise<RadarSearchResult> {
    const page = query.cursor?.nextPage ?? query.page ?? 0;
    const publishedAfter = query.cursor?.since
      ? new Date(query.cursor.since)
      : query.publishedAfter;

    // 构建 API 请求体
    const requestBody: Record<string, unknown> = {
      pageIndex: page,
      pageSize: Math.min(query.pageSize || 20, 100),
    };

    if (query.keywords?.length) {
      requestBody.title = query.keywords.join(' ');
    }
    if (query.deadlineAfter) {
      requestBody.deadlineFrom = query.deadlineAfter.toISOString().split('T')[0];
    }
    if (query.deadlineBefore) {
      requestBody.deadlineTo = query.deadlineBefore.toISOString().split('T')[0];
    }
    if (publishedAfter) {
      requestBody.publishedFrom = publishedAfter.toISOString().split('T')[0];
    }
    if (query.categories?.length) {
      requestBody.unspscCode = query.categories[0];
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/API/Notices/Search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        // API 失败，回退到网页抓取
        return this.searchViaWebScrape(query, startTime);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      const results = data.results || data.notices || [];
      const total = data.totalCount || data.total || results.length;
      const totalPages = data.totalPages || Math.ceil(total / (query.pageSize || 20));
      const hasMore = (data.pageIndex || page) < totalPages - 1;

      return {
        items: results.map((item: unknown) => this.normalize(item)),
        total,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration,
        },
        nextCursor: hasMore
          ? { nextPage: page + 1, since: query.cursor?.since }
          : undefined,
        isExhausted: !hasMore,
      };
    } catch (error) {
      console.error('[UNGM] API search error, falling back to web scrape:', error);
      return this.searchViaWebScrape(query, startTime);
    }
  }

  /**
   * 网页抓取备选方案
   */
  private async searchViaWebScrape(
    query: RadarSearchQuery,
    startTime: number
  ): Promise<RadarSearchResult> {
    // 导入网页抓取工具
    const { fetchWebContent } = await import('@/lib/services/web-scraper');

    // 构建搜索 URL
    const searchParams = new URLSearchParams();
    if (query.keywords?.length) {
      searchParams.set('q', query.keywords.join(' '));
    }

    const searchUrl = `${this.apiEndpoint}/Public/Notice/Search?${searchParams}`;

    try {
      const content = await fetchWebContent(searchUrl);

      if (!content.success) {
        throw new Error('Failed to fetch UNGM search page');
      }

      // 使用正则表达式解析搜索结果
      const noticeIds = this.extractNoticeIds(content.content);
      const items: NormalizedCandidate[] = [];

      for (const id of noticeIds.slice(0, query.pageSize || 20)) {
        items.push({
          externalId: id,
          sourceUrl: `https://www.ungm.org/Public/Notice/${id}`,
          displayName: `UNGM Notice ${id}`,
          candidateType: 'OPPORTUNITY',
          buyerType: 'international_org',
          matchExplain: {
            channel: 'ungm',
            reasons: ['联合国采购公告（网页抓取）'],
          },
        });
      }

      const duration = Date.now() - startTime;

      return {
        items,
        total: items.length,
        hasMore: false,
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration,
        },
        isExhausted: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[UNGM] Web scrape error:', error);

      return {
        items: [],
        total: 0,
        hasMore: false,
        metadata: {
          source: this.sourceCode,
          query,
          fetchedAt: new Date(),
          duration,
        },
        isExhausted: true,
      };
    }
  }

  /**
   * 从网页内容中提取公告ID
   */
  private extractNoticeIds(content: string): string[] {
    const ids: string[] = [];
    // 匹配 UNGM 公告链接中的 ID
    const pattern = /\/Public\/Notice\/([a-zA-Z0-9]+)/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }

    return ids;
  }

  async getDetails(externalId: string): Promise<CandidateDetails | null> {
    const token = await this.getAccessToken();

    if (token) {
      try {
        const response = await fetch(`${this.apiEndpoint}/API/Notices/${externalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(this.timeout),
        });

        if (response.ok) {
          const data = await response.json();

          return {
            externalId,
            email: data.contactEmail || data.ContactEmail,
            phone: data.contactPhone || data.ContactPhone,
            description: data.description || data.Description,
            additionalInfo: {
              documents: data.documents || data.Documents,
              amendments: data.amendments || data.Amendments,
              buyerName: data.agencyName || data.AgencyName,
              deadline: data.deadline || data.Deadline,
            },
          };
        }
      } catch (error) {
        console.error('[UNGM] API details error:', error);
      }
    }

    // 回退到网页抓取
    const { fetchWebContent } = await import('@/lib/services/web-scraper');
    const content = await fetchWebContent(`${this.apiEndpoint}/Public/Notice/${externalId}`);

    if (!content.success) {
      return null;
    }

    // 简单解析
    return {
      externalId,
      description: content.content.slice(0, 500),
      additionalInfo: {
        sourceMethod: 'WEB_SCRAPE',
      },
    };
  }

  normalize(raw: unknown): NormalizedCandidate {
    const data = raw as Record<string, unknown>;

    const id = String(data.id || data.Id || data.reference || data.Reference || '');
    const title = String(data.title || data.Title || '');

    return {
      externalId: id,
      sourceUrl: `https://www.ungm.org/Public/Notice/${id}`,
      displayName: title || `UNGM Notice ${id}`,
      candidateType: 'OPPORTUNITY',

      description: (data.description || data.Description) as string | undefined,

      deadline: data.deadline || data.Deadline
        ? new Date(String(data.deadline || data.Deadline))
        : undefined,
      publishedAt: data.publishedDate || data.PublishedDate
        ? new Date(String(data.publishedDate || data.PublishedDate))
        : undefined,

      buyerName: String(data.agencyName || data.AgencyName || data.organization || data.Organization || ''),
      buyerCountry: String(data.country || data.Country || ''),
      buyerType: 'international_org',

      categoryCode: String(data.unspscCode || data.UNSPSCCode || ''),
      categoryName: String(data.unspscName || data.UNSPSCName || ''),

      contactEmail: (data.contactEmail || data.ContactEmail) as string | undefined,

      matchExplain: {
        channel: 'ungm',
        reasons: ['联合国采购公告'],
      },

      rawData: data,
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      // 检查是否有认证信息
      const hasAuth = !!(this.clientId && this.clientSecret);

      if (hasAuth) {
        const token = await this.getAccessToken();
        return {
          healthy: !!token,
          latency: Date.now() - startTime,
          lastCheckedAt: new Date(),
          message: token ? 'API authenticated' : 'Authentication failed',
        };
      }

      // 检查公开页面是否可访问
      const response = await fetch(`${this.apiEndpoint}/Public/Notice`, {
        signal: AbortSignal.timeout(10000),
      });

      return {
        healthy: response.ok,
        latency: Date.now() - startTime,
        lastCheckedAt: new Date(),
        message: 'Web access only (no API credentials)',
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