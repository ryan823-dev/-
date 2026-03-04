/**
 * 网站配置类型定义
 */

export type WebsiteConfigFormData = {
  id?: string;
  url: string;
  siteType: string;
  supabaseUrl: string;
  functionName: string;
  pushSecret: string;
  approvalTimeoutHours: number;
  isActive: boolean;
};

export type WebsiteConfigDetail = {
  id: string;
  url: string | null;
  siteType: string;
  supabaseUrl: string | null;
  functionName: string | null;
  pushSecret: string | null;
  approvalTimeoutHours: number;
  isActive: boolean;
  apiKey: string | null;
  publishEndpoint: string | null;
};
