
import { ContentAsset, PublisherResult } from '../types';

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

/**
 * SupabasePublisherAdapter
 * Ready for future integration with Tudou Technology's production database.
 */
export class SupabasePublisherAdapter implements PublisherAdapter {
  async publishContent(asset: ContentAsset): Promise<PublisherResult> {
    // Note: In production, these should be handled via a secure API endpoint 
    // to protect the Service Role Key.
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { status: 'error', message: 'Supabase configuration missing' };
    }

    try {
      // Logic for writing to 'vertax_content_assets' table would go here
      // For now, this acts as a skeleton.
      console.log('Sending to Supabase...', asset.id);
      return { status: 'success', url: `https://tdpaintcell.com/blog/${asset.id}` };
    } catch (e) {
      return { status: 'error', message: (e as Error).message };
    }
  }
}
