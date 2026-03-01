import { ContentAsset } from '../../types';

interface ContentPushPayload {
  vertax_asset_id: string;
  title: string;
  title_zh?: string;
  slug: string;
  body: string;
  body_zh?: string;
  summary?: string;
  summary_zh?: string;
  meta_title?: string;
  meta_title_zh?: string;
  meta_description?: string;
  meta_description_zh?: string;
  category: 'learning-center' | 'tools-templates' | 'glossary';
  featured_image_url?: string;
  status?: string;
}

const CONTENT_TYPE_TO_CATEGORY: Record<string, ContentPushPayload['category']> = {
  'blog-article': 'learning-center',
  'faq-page': 'learning-center',
  'case-study': 'learning-center',
  'landing-page': 'learning-center',
  'technical-doc': 'tools-templates',
};

function truncate(text: string | undefined, maxLen: number): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

function isLikelyChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  return !!chineseChars && chineseChars.length > text.length * 0.3;
}

export function mapContentAssetToPayload(asset: ContentAsset): ContentPushPayload {
  const isChinese = isLikelyChinese(asset.title || '');
  const body = asset.body || asset.draftBody || '';

  const payload: ContentPushPayload = {
    vertax_asset_id: asset.id,
    title: isChinese ? '' : asset.title,
    slug: asset.slug || asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100),
    body: isChinese ? '' : body,
    summary: isChinese ? undefined : truncate(body, 200),
    meta_title: isChinese ? undefined : truncate(asset.metaTitle || asset.title, 60),
    meta_description: isChinese ? undefined : truncate(asset.metaDescription || body, 160),
    category: CONTENT_TYPE_TO_CATEGORY[asset.contentType || 'blog-article'] || 'learning-center',
    status: 'published',
  };

  // Set Chinese fields
  if (isChinese) {
    payload.title = 'Untitled';
    payload.title_zh = asset.title;
    payload.body = '';
    payload.body_zh = body;
    payload.summary_zh = truncate(body, 200);
    payload.meta_title_zh = truncate(asset.metaTitle || asset.title, 60);
    payload.meta_description_zh = truncate(asset.metaDescription || body, 160);
  } else {
    payload.title = asset.title;
  }

  // If both language versions are available via naming convention
  // (future: asset.titleZh, asset.bodyZh), set both

  return payload;
}
