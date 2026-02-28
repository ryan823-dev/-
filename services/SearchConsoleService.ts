/**
 * Google Search Console Service
 * 
 * Provides integration with Search Console API for
 * search query analysis, content gap detection, and SEO insights.
 */

const GSC_API = 'https://searchconsole.googleapis.com/v1';

interface GSCConfig {
  accessToken: string;
  siteUrl: string; // e.g. 'https://example.com' or 'sc-domain:example.com'
}

export interface SearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ContentGap {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  opportunity: 'high_impression_low_ctr' | 'low_position_high_clicks' | 'high_impression_no_content';
  recommendation: string;
}

/**
 * Run a Search Console query
 */
async function runSearchAnalytics(
  config: GSCConfig,
  params: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    rowLimit?: number;
  }
): Promise<any> {
  const response = await fetch(
    `${GSC_API}/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions,
        rowLimit: params.rowLimit || 100,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GSC API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get top search queries
 */
export async function getTopQueries(
  config: GSCConfig,
  days: number = 28
): Promise<SearchQuery[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const data = await runSearchAnalytics(config, {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit: 100,
  });

  return (data.rows || []).map((row: any) => ({
    query: row.keys[0],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Get top pages by search performance
 */
export async function getTopPages(
  config: GSCConfig,
  days: number = 28
): Promise<SearchPage[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const data = await runSearchAnalytics(config, {
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit: 50,
  });

  return (data.rows || []).map((row: any) => ({
    page: row.keys[0],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Identify content gaps and opportunities
 */
export async function identifyContentGaps(
  config: GSCConfig,
  days: number = 28
): Promise<ContentGap[]> {
  const queries = await getTopQueries(config, days);
  const gaps: ContentGap[] = [];

  for (const q of queries) {
    // High impressions but low CTR - content optimization opportunity
    if (q.impressions > 100 && q.ctr < 0.02) {
      gaps.push({
        ...q,
        opportunity: 'high_impression_low_ctr',
        recommendation: `查询 "${q.query}" 有 ${q.impressions} 次曝光但点击率仅 ${(q.ctr * 100).toFixed(1)}%。优化标题和描述可以提升点击率。`,
      });
    }

    // Low position but still getting clicks - ranking opportunity
    if (q.position > 10 && q.clicks > 5) {
      gaps.push({
        ...q,
        opportunity: 'low_position_high_clicks',
        recommendation: `查询 "${q.query}" 排名在第 ${Math.round(q.position)} 位但仍有 ${q.clicks} 次点击。优化内容可以提升排名。`,
      });
    }

    // High impressions but zero clicks - missing or poor content
    if (q.impressions > 200 && q.clicks === 0) {
      gaps.push({
        ...q,
        opportunity: 'high_impression_no_content',
        recommendation: `查询 "${q.query}" 有 ${q.impressions} 次曝光但零点击。需要创建针对性内容或优化现有页面。`,
      });
    }
  }

  return gaps.sort((a, b) => b.impressions - a.impressions);
}

/**
 * Get search performance by country
 */
export async function getSearchByCountry(
  config: GSCConfig,
  days: number = 28
): Promise<{ country: string; clicks: number; impressions: number; ctr: number; position: number }[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const data = await runSearchAnalytics(config, {
    startDate,
    endDate,
    dimensions: ['country'],
    rowLimit: 50,
  });

  return (data.rows || [])
    .map((row: any) => ({
      country: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
    .sort((a: any, b: any) => b.clicks - a.clicks);
}
