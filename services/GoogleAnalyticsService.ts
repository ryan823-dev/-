/**
 * Google Analytics 4 Service
 * 
 * Provides integration with GA4 Data API for
 * website visitor analytics and intent signal detection.
 */

const GA4_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

interface GA4Config {
  accessToken: string;
  propertyId: string;
}

export interface GA4Report {
  rows: {
    dimensions: string[];
    metrics: string[];
  }[];
  rowCount: number;
}

export interface VisitorInsight {
  pagePath: string;
  sessions: number;
  users: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageviews: number;
}

/**
 * Run a GA4 Data API report
 */
export async function runGA4Report(
  config: GA4Config,
  dateRange: { startDate: string; endDate: string },
  dimensions: string[],
  metrics: string[]
): Promise<GA4Report> {
  const response = await fetch(
    `${GA4_DATA_API}/properties/${config.propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({
        dateRanges: [dateRange],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        limit: 100,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA4 API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    rows: (data.rows || []).map((row: any) => ({
      dimensions: (row.dimensionValues || []).map((d: any) => d.value),
      metrics: (row.metricValues || []).map((m: any) => m.value),
    })),
    rowCount: data.rowCount || 0,
  };
}

/**
 * Get top pages by traffic
 */
export async function getTopPages(
  config: GA4Config,
  days: number = 30
): Promise<VisitorInsight[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const report = await runGA4Report(
    config,
    { startDate, endDate },
    ['pagePath'],
    ['sessions', 'totalUsers', 'averageSessionDuration', 'bounceRate', 'screenPageViews']
  );

  return report.rows.map(row => ({
    pagePath: row.dimensions[0],
    sessions: parseInt(row.metrics[0]) || 0,
    users: parseInt(row.metrics[1]) || 0,
    avgSessionDuration: parseFloat(row.metrics[2]) || 0,
    bounceRate: parseFloat(row.metrics[3]) || 0,
    pageviews: parseInt(row.metrics[4]) || 0,
  }));
}

/**
 * Get traffic by country
 */
export async function getTrafficByCountry(
  config: GA4Config,
  days: number = 30
): Promise<{ country: string; sessions: number; users: number }[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const report = await runGA4Report(
    config,
    { startDate, endDate },
    ['country'],
    ['sessions', 'totalUsers']
  );

  return report.rows
    .map(row => ({
      country: row.dimensions[0],
      sessions: parseInt(row.metrics[0]) || 0,
      users: parseInt(row.metrics[1]) || 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

/**
 * Get traffic sources
 */
export async function getTrafficSources(
  config: GA4Config,
  days: number = 30
): Promise<{ source: string; medium: string; sessions: number }[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const report = await runGA4Report(
    config,
    { startDate, endDate },
    ['sessionSource', 'sessionMedium'],
    ['sessions']
  );

  return report.rows
    .map(row => ({
      source: row.dimensions[0],
      medium: row.dimensions[1],
      sessions: parseInt(row.metrics[0]) || 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}
