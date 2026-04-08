/**
 * 营销页面 URL 配置
 * 用于 sitemap、百度推送等 SEO 功能
 * 
 * 重要：此列表只包含营销页面，不包含租户后台、tower 等敏感页面
 */

export interface SitemapPage {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

// 营销页面列表 - sitemap 和百度推送共用
export const MARKETING_PAGES: SitemapPage[] = [
  {
    path: '/',
    priority: 1.0,
    changeFrequency: 'weekly',
  },
  {
    path: '/features',
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  {
    path: '/features/modules',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/solutions',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/pricing',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/about',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  // AEO/GEO 核心品牌页面
  {
    path: '/about/what-is-vertax',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/about/why-not-seo-tool',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/about/aeo-geo-b2b',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/about/who-is-vertax-for',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/faq',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  // 客户案例
  {
    path: '/cases',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  // 博客
  {
    path: '/blog',
    priority: 0.8,
    changeFrequency: 'daily',
  },
  {
    path: '/blog/vertax-claw-launch',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  // 英文版
  {
    path: '/en',
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  // 联系页面
  {
    path: '/contact',
    priority: 0.6,
    changeFrequency: 'monthly',
  },
];

// 获取所有营销页面路径（用于百度推送等）
export function getMarketingPaths(): string[] {
  return MARKETING_PAGES.map(page => page.path);
}