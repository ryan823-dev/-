-- Add emailConfig column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailConfig" JSONB;

-- Update tdpaint tenant with email configuration
UPDATE "Tenant" 
SET "emailConfig" = '{"customApiKey":"re_4G7rXh8c_yhUAfyQUthfZXDt296c6WDo5","fromEmail":"涂豆科技 <noreply@tdpaint.com>","replyToEmail":"sales@tdpaint.com","customFromDomain":"tdpaint.com","usePlatformKey":false}'
WHERE slug = 'tdpaint';

-- Also update slug from tdpaintcell to tdpaint if it exists
UPDATE "Tenant" SET slug = 'tdpaint' WHERE slug = 'tdpaintcell';
