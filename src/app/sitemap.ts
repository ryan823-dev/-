import { MetadataRoute } from 'next';
import { MARKETING_PAGES } from '@/lib/seo/sitemap-urls';

/**
 * Sitemap for VertaX main domain
 * 仅包含营销页面，不包含租户后台
 * URL 列表与百度推送共用，统一管理
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vertax.top';
  
  return MARKETING_PAGES.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
