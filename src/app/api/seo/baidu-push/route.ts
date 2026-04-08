import { NextRequest, NextResponse } from 'next/server';
import { getMarketingPaths } from '@/lib/seo/sitemap-urls';

/**
 * 百度搜索引擎主动推送 API
 * 调用百度站长平台接口，主动推送 URL 以加快收录
 * 
 * 重要：只推送营销页面，与 sitemap.ts 保持一致
 * 
 * 文档：https://ziyuan.baidu.com/linksubmit/urlpush
 */

const BAIDU_PUSH_URL = 'http://data.zz.baidu.com/urls';
const SITE = 'https://vertax.top';
const TOKEN = process.env.BAIDU_PUSH_TOKEN || 'KWb2UWWQzhhABPyY';

interface BaiduPushResponse {
  success: number;
  remain: number;
  not_same_site?: string[];
  not_valid?: string[];
}

/**
 * 推送 URL 到百度
 * @param urls 要推送的 URL 列表
 */
async function pushToBaidu(urls: string[]): Promise<BaiduPushResponse> {
  const pushUrl = `${BAIDU_PUSH_URL}?site=${SITE}&token=${TOKEN}`;
  
  const response = await fetch(pushUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: urls.join('\n'),
  });
  
  return response.json();
}

/**
 * GET /api/seo/baidu-push
 * 推送所有营销页面 URL 到百度
 * 
 * 可选参数：
 * - urls: 自定义 URL 列表（逗号分隔）
 * 
 * 示例：
 * - 推送全部: /api/seo/baidu-push
 * - 推送指定: /api/seo/baidu-push?urls=/features,/pricing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customUrls = searchParams.get('urls');
    
    // 使用自定义 URL 或默认营销页面（与 sitemap 同步）
    const paths = customUrls 
      ? customUrls.split(',').map(u => u.trim()).filter(Boolean)
      : getMarketingPaths();
    
    // 转换为完整 URL
    const fullUrls = paths.map(path => `${SITE}${path.startsWith('/') ? path : `/${path}`}`);
    
    // 调用百度推送 API
    const result = await pushToBaidu(fullUrls);
    
    return NextResponse.json({
      success: true,
      message: `已推送 ${result.success} 条 URL 到百度`,
      data: {
        pushed: result.success,
        remaining: result.remain,
        urls: fullUrls,
        errors: {
          notSameSite: result.not_same_site || [],
          notValid: result.not_valid || [],
        },
      },
    });
  } catch (error) {
    console.error('百度推送失败:', error);
    return NextResponse.json({
      success: false,
      message: '百度推送失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/seo/baidu-push
 * 推送请求体中的 URL 列表
 * 
 * 请求体：
 * {
 *   "urls": ["/new-page", "/updated-page"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = body.urls || [];
    
    if (!urls.length) {
      return NextResponse.json({
        success: false,
        message: '请提供要推送的 URL 列表',
      }, { status: 400 });
    }
    
    // 转换为完整 URL
    const fullUrls = urls.map(path => `${SITE}${path.startsWith('/') ? path : `/${path}`}`);
    
    // 调用百度推送 API
    const result = await pushToBaidu(fullUrls);
    
    return NextResponse.json({
      success: true,
      message: `已推送 ${result.success} 条 URL 到百度`,
      data: {
        pushed: result.success,
        remaining: result.remain,
        urls: fullUrls,
        errors: {
          notSameSite: result.not_same_site || [],
          notValid: result.not_valid || [],
        },
      },
    });
  } catch (error) {
    console.error('百度推送失败:', error);
    return NextResponse.json({
      success: false,
      message: '百度推送失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}