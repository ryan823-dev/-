import OSS from 'ali-oss';

// OSS 配置
const OSS_REGION = process.env.OSS_REGION;
const OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID;
const OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET;
const OSS_BUCKET = process.env.OSS_BUCKET;

// OSS 客户端单例
let ossClient = null;

function getOSSClient() {
  if (!ossClient) {
    if (!OSS_REGION || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET) {
      throw new Error('Missing OSS configuration');
    }
    ossClient = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
      secure: true,
    });
  }
  return ossClient;
}

/**
 * 从 OSS 下载文件
 * @param {string} storageKey OSS 对象路径
 * @returns {Buffer} 文件内容
 */
export async function downloadFromOSS(storageKey) {
  const client = getOSSClient();
  const result = await client.get(storageKey);
  return result.content;
}

/**
 * 上传文件到 OSS
 * @param {string} storageKey OSS 对象路径
 * @param {Buffer} content 文件内容
 * @param {string} mimeType MIME 类型
 */
export async function uploadToOSS(storageKey, content, mimeType) {
  const client = getOSSClient();
  await client.put(storageKey, content, {
    headers: { 'Content-Type': mimeType }
  });
}

/**
 * 生成预签名访问 URL
 * @param {string} storageKey OSS 对象路径
 * @param {number} expiresSeconds 有效期（秒）
 * @returns {string} 预签名 URL
 */
export async function generatePresignedUrl(storageKey, expiresSeconds = 3600) {
  const client = getOSSClient();
  return client.signatureUrl(storageKey, {
    method: 'GET',
    expires: expiresSeconds,
  });
}

/**
 * 删除 OSS 对象
 * @param {string} storageKey OSS 对象路径
 */
export async function deleteFromOSS(storageKey) {
  const client = getOSSClient();
  await client.delete(storageKey);
}