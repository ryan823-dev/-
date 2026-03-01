import { ContentAsset, PublisherResult } from '../types';
import { ClientSiteConfig, IClientSiteConfig } from '../models/ClientSiteConfig';
import { mapContentAssetToPayload } from './push-pipeline/field-mapper';

export interface PublisherAdapter {
  publishContent(asset: ContentAsset): Promise<PublisherResult>;
}

export class MockPublisherAdapter implements PublisherAdapter {
  async publishContent(asset: ContentAsset): Promise<PublisherResult> {
    console.log(`[MockPublish] Publishing asset: ${asset.title}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      status: 'success',
      url: `https://tdpaintcell.com/insights/${asset.id}`,
      message: '内容已成功同步至涂豆科技官网'
    };
  }
}

export class SupabasePublisherAdapter implements PublisherAdapter {
  private config: IClientSiteConfig;

  constructor(config: IClientSiteConfig) {
    this.config = config;
  }

  async publishContent(asset: ContentAsset): Promise<PublisherResult> {
    const { supabaseConfig } = this.config;

    if (!supabaseConfig?.projectUrl || !supabaseConfig?.pushSecret) {
      return { status: 'error', message: 'Supabase configuration missing in ClientSiteConfig' };
    }

    const functionUrl = `${supabaseConfig.projectUrl}/functions/v1/${supabaseConfig.functionName || 'receive-content-push'}`;
    const payload = mapContentAssetToPayload(asset);

    try {
      console.log(`[SupabasePublish] Pushing to ${functionUrl} (asset: ${asset.id})`);

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseConfig.pushSecret}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Supabase Edge Function returned ${res.status}: ${errBody.substring(0, 300)}`);
      }

      const result = await res.json();
      console.log(`[SupabasePublish] Success: id=${result.id}, slug=${result.slug}`);

      return {
        status: 'success',
        url: `${supabaseConfig.projectUrl.replace('.supabase.co', '')}/resources/${result.slug}`,
        message: `内容已推送至客户独立站，等待客户审核发布 (id: ${result.id})`
      };
    } catch (e) {
      console.error(`[SupabasePublish] Error:`, (e as Error).message);
      return { status: 'error', message: (e as Error).message };
    }
  }
}

export class PublisherAdapterFactory {
  static async create(productSlug: string): Promise<PublisherAdapter | null> {
    const config = await ClientSiteConfig.findOne({ productSlug, isActive: true });

    if (!config) {
      console.log(`[PublisherFactory] No active ClientSiteConfig found for slug: ${productSlug}`);
      return null;
    }

    switch (config.siteType) {
      case 'supabase':
        return new SupabasePublisherAdapter(config);
      default:
        console.log(`[PublisherFactory] Unsupported siteType: ${config.siteType}`);
        return null;
    }
  }
}
