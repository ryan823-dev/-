// ==================== Generic Feed Adapter ====================
// RSS/JSON 通用 Feed 适配器，覆盖无专属 API 的招标平台

import type { 
  RadarAdapter, 
  RadarSearchQuery, 
  RadarSearchResult, 
  NormalizedCandidate,
  HealthStatus,
  AdapterFeatures,
  AdapterConfig,
} from './types';

// ==================== Feed 配置类型 ====================

interface FeedConfig extends AdapterConfig {
  feedUrl: string;
  feedType: 'rss' | 'json';
  channelType?: string;
  fieldMapping?: {
    externalId?: string;
    title?: string;
    link?: string;
    description?: string;
    pubDate?: string;
    deadline?: string;
    buyerName?: string;
    buyerCountry?: string;
    categoryCode?: string;
    estimatedValue?: string;
    currency?: string;
  };
}

interface FeedItem {
  [key: string]: unknown;
}

// ==================== Generic Feed 适配器 ====================

export class GenericFeedAdapter implements RadarAdapter {
  readonly sourceCode = 'generic_feed';
  readonly channelType = 'TENDER' as const;
  
  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: false,
    supportsCategoryFilter: false,
    supportsDateFilter: false,
    supportsRegionFilter: false,
    supportsPagination: false,
    supportsDetails: false,
    maxResultsPerQuery: 100,
    rateLimit: { requests: 10, windowMs: 60000 },
  };

  private feedUrl: string;
  private feedType: 'rss' | 'json';
  private fieldMapping: NonNullable<FeedConfig['fieldMapping']>;
  private timeout: number;

  constructor(config: AdapterConfig) {
    const feedConfig = config as FeedConfig;
    this.feedUrl = feedConfig.feedUrl || '';
    this.feedType = feedConfig.feedType || 'rss';
    this.fieldMapping = feedConfig.fieldMapping || {};
    this.timeout = feedConfig.timeout || 30000;
  }

  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();
    
    if (!this.feedUrl) {
      throw new Error('Feed URL not configured');
    }

    const response = await fetch(this.feedUrl, {
      headers: { 'Accept': 'application/xml, application/json, text/xml' },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Feed fetch error: ${response.status} ${response.statusText}`);
    }

    const rawText = await response.text();
    let items: FeedItem[];

    if (this.feedType === 'json') {
      items = this.parseJsonFeed(rawText);
    } else {
      items = this.parseRssFeed(rawText);
    }

    // 游标：用 since 做时间过滤
    const sinceDate = query.cursor?.since ? new Date(query.cursor.since) : null;
    if (sinceDate) {
      items = items.filter(item => {
        const pubDateField = this.fieldMapping.pubDate || 'pubDate';
        const pubDate = item[pubDateField] as string | undefined;
        if (!pubDate) return true; // 无日期的保留
        return new Date(pubDate) > sinceDate;
      });
    }

    // 关键词过滤（如果有）
    if (query.keywords?.length) {
      const kws = query.keywords.map(k => k.toLowerCase());
      items = items.filter(item => {
        const titleField = this.fieldMapping.title || 'title';
        const descField = this.fieldMapping.description || 'description';
        const text = `${item[titleField] || ''} ${item[descField] || ''}`.toLowerCase();
        return kws.some(kw => text.includes(kw));
      });
    }

    const duration = Date.now() - startTime;
    const normalized = items.map(item => this.normalize(item));

    return {
      items: normalized,
      total: normalized.length,
      hasMore: false,
      metadata: {
        source: this.sourceCode,
        query,
        fetchedAt: new Date(),
        duration,
      },
      // Feed 总是返回最新 N 条，视为 exhausted
      isExhausted: true,
    };
  }

  /**
   * 解析 RSS/Atom Feed
   */
  private parseRssFeed(xml: string): FeedItem[] {
    const items: FeedItem[] = [];
    
    // 简单 XML 解析（提取 <item> 或 <entry> 标签）
    const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const item: FeedItem = {};
      
      // 提取常见字段
      const fields = ['title', 'link', 'description', 'pubDate', 'published', 'updated', 'guid', 'id', 'category', 'author'];
      for (const field of fields) {
        const fieldRegex = new RegExp(`<${field}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${field}>`, 'is');
        const fieldMatch = fieldRegex.exec(itemXml);
        if (fieldMatch) {
          item[field] = fieldMatch[1].trim();
        }
      }
      
      // 处理 <link href="..." /> 格式（Atom）
      if (!item.link) {
        const linkMatch = /<link[^>]+href="([^"]+)"[^>]*\/?>/i.exec(itemXml);
        if (linkMatch) item.link = linkMatch[1];
      }
      
      items.push(item);
    }
    
    return items;
  }

  /**
   * 解析 JSON Feed
   */
  private parseJsonFeed(json: string): FeedItem[] {
    try {
      const data = JSON.parse(json);
      // 支持 { items: [...] } 或直接 [...]
      if (Array.isArray(data)) return data;
      if (data.items && Array.isArray(data.items)) return data.items;
      if (data.results && Array.isArray(data.results)) return data.results;
      if (data.data && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  }

  normalize(raw: unknown): NormalizedCandidate {
    const item = raw as FeedItem;
    const mapping = this.fieldMapping;
    
    const externalId = String(item[mapping.externalId || 'guid'] || item[mapping.externalId || 'id'] || `feed_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const title = String(item[mapping.title || 'title'] || '');
    const link = String(item[mapping.link || 'link'] || '');
    const description = String(item[mapping.description || 'description'] || '');
    const pubDate = item[mapping.pubDate || 'pubDate'] || item['published'];
    const deadlineStr = item[mapping.deadline || 'deadline'];
    const buyerName = item[mapping.buyerName || 'buyerName'];
    const buyerCountry = item[mapping.buyerCountry || 'buyerCountry'];
    const categoryCode = item[mapping.categoryCode || 'categoryCode'];
    const estimatedValue = item[mapping.estimatedValue || 'estimatedValue'];
    const currency = item[mapping.currency || 'currency'];

    return {
      externalId,
      sourceUrl: link,
      displayName: title,
      candidateType: 'OPPORTUNITY',
      description,
      
      publishedAt: pubDate ? new Date(String(pubDate)) : undefined,
      deadline: deadlineStr ? new Date(String(deadlineStr)) : undefined,
      
      buyerName: buyerName ? String(buyerName) : undefined,
      buyerCountry: buyerCountry ? String(buyerCountry) : undefined,
      buyerType: 'government',
      categoryCode: categoryCode ? String(categoryCode) : undefined,
      
      estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      currency: currency ? String(currency) : undefined,

      matchExplain: {
        channel: 'generic_feed',
        reasons: ['Feed 自动采集'],
      },
      
      rawData: item as Record<string, unknown>,
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    if (!this.feedUrl) {
      return { healthy: false, latency: 0, error: 'Feed URL not configured' };
    }

    const startTime = Date.now();
    try {
      const response = await fetch(this.feedUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - startTime;
      return {
        healthy: response.ok,
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
