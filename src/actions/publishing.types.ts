/**
 * 内容推送管道类型定义
 */

export type PushRecordData = {
  id: string;
  contentId: string;
  contentTitle: string;
  status: string;
  remoteId: string | null;
  remoteSlug: string | null;
  targetUrl: string | null;
  pushedAt: Date;
  timeoutAt: Date;
  confirmedAt: Date | null;
  retryCount: number;
  lastError: string | null;
};

export type WebsiteConfigData = {
  id: string;
  url: string | null;
  siteType: string;
  isActive: boolean;
  supabaseUrl: string | null;
  functionName: string | null;
};
