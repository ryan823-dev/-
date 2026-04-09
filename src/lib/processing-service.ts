/**
 * 统一文档处理服务
 * 
 * 根据文件类型和大小选择合适的处理方式：
 * - 小文件 (<8MB): 浏览器端处理
 * - 大文件音视频: AssemblyAI (需要对话内容)
 * - 大文件文档: 独立微服务 (Railway 部署)
 * - 图片文件: 微服务 OCR
 * - 其他: 服务端本地处理
 */

export type ProcessorType = 'browser' | 'assemblyai' | 'microservice' | 'server';

export interface ProcessingDecision {
  processor: ProcessorType;
  reason: string;
  apiEndpoint?: string;
}

// 文件大小阈值
const BROWSER_THRESHOLD_BYTES = 8 * 1024 * 1024; // 8MB

// 支持浏览器端处理的 MIME 类型
const BROWSER_SUPPORTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

// 音视频 MIME 类型（AssemblyAI）
const AUDIO_VIDEO_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
  'audio/aac', 'audio/flac', 'audio/x-m4a',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-ms-wmv',
]);

// 图片 MIME 类型（微服务 OCR）
const IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'image/webp',
]);

// 文档 MIME 类型（微服务处理）
/**
 * 决定使用哪个处理器
 */
export function decideProcessor(
  fileSize: number,
  mimeType: string
): ProcessingDecision {
  const isSmall = fileSize < BROWSER_THRESHOLD_BYTES;
  const isAudioVideo = AUDIO_VIDEO_TYPES.has(mimeType);
  const isImage = IMAGE_TYPES.has(mimeType);
  const isBrowserSupported = BROWSER_SUPPORTED_TYPES.has(mimeType);
  const hasMicroservice = !!process.env.PROCESSOR_SERVICE_URL;
  const hasAssemblyAI = !!process.env.ASSEMBLYAI_API_KEY;

  // 微服务已配置 → 所有文档优先微服务处理（包括小文件）
  if (hasMicroservice && isBrowserSupported) {
    return {
      processor: 'microservice',
      reason: '微服务已配置，使用微服务处理（支持所有格式）',
      apiEndpoint: '/api/processing/microservice',
    };
  }

  // 图片文件 → 微服务 OCR
  if (isImage && hasMicroservice) {
    return {
      processor: 'microservice',
      reason: '图片文件，使用微服务 OCR',
      apiEndpoint: '/api/processing/microservice',
    };
  }

  // 音视频文件 → AssemblyAI
  if (isAudioVideo) {
    if (hasAssemblyAI) {
      return {
        processor: 'assemblyai',
        reason: '音视频文件，使用 AssemblyAI 转录',
        apiEndpoint: '/api/processing/assemblyai',
      };
    }
    // 没有 API Key，回退到服务端处理
    return {
      processor: 'server',
      reason: 'AssemblyAI 未配置，使用服务端处理',
    };
  }

  // 微服务未配置 → 小文件浏览器端处理
  if (isSmall && isBrowserSupported) {
    return {
      processor: 'browser',
      reason: '小文件，浏览器端处理（更快）',
    };
  }

  // 默认：服务端处理
  return {
    processor: 'server',
    reason: '使用服务端本地处理',
  };
}

/**
 * 获取处理状态说明
 */
export function getProcessingDescription(decision: ProcessingDecision): string {
  switch (decision.processor) {
    case 'browser':
      return '本地处理中...';
    case 'assemblyai':
      return 'AI 转录中（AssemblyAI）...';
    case 'microservice':
      return '微服务处理中...';
    case 'server':
      return '服务器处理中...';
    default:
      return '处理中...';
  }
}

/**
 * 检查第三方 API 和微服务配置状态
 */
export function checkAPIConfiguration(): {
  assemblyai: { configured: boolean; reason?: string };
  microservice: { configured: boolean; url?: string; reason?: string };
} {
  const microserviceUrl = process.env.PROCESSOR_SERVICE_URL;
  return {
    assemblyai: {
      configured: !!process.env.ASSEMBLYAI_API_KEY,
      reason: process.env.ASSEMBLYAI_API_KEY 
        ? undefined 
        : '未设置 ASSEMBLYAI_API_KEY',
    },
    microservice: {
      configured: !!microserviceUrl,
      url: microserviceUrl,
      reason: microserviceUrl 
        ? undefined 
        : '未设置 PROCESSOR_SERVICE_URL',
    },
  };
}

/**
 * 获取微服务处理 URL
 */
export function getMicroserviceUrl(): string | null {
  return process.env.PROCESSOR_SERVICE_URL || null;
}

/**
 * 获取微服务 API Key
 */
export function getMicroserviceApiKey(): string | null {
  return process.env.PROCESSOR_API_KEY || null;
}
