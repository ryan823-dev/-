import { PrismaClient } from '@prisma/client';

// Prisma 客户端单例
const prisma = new PrismaClient();

/**
 * 更新 Asset 状态和元数据
 * @param {string} assetId Asset ID
 * @param {object} metadata 要更新的元数据
 */
export async function updateAssetStatus(assetId, metadata) {
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      metadata: metadata,
    },
  });
}

/**
 * 保存处理结果到数据库
 * @param {string} assetId Asset ID
 * @param {object} metadata 元数据
 * @param {Array} chunks 文本分块
 * @param {string} tenantId 租户 ID
 */
export async function saveToDatabase(assetId, metadata, chunks = [], tenantId = null) {
  // 更新 Asset 元数据
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      metadata: metadata,
    },
  });

  // 如果有分块，保存到 AssetChunk
  if (chunks.length > 0 && tenantId) {
    // 先删除旧的分块
    await prisma.assetChunk.deleteMany({
      where: { assetId: assetId },
    });

    // 创建新的分块
    await prisma.assetChunk.createMany({
      data: chunks.map((chunk, index) => ({
        tenantId: tenantId,
        assetId: assetId,
        content: chunk.content,
        chunkIndex: index,
        pageNumber: chunk.pageNumber || null,
        charStart: chunk.charStart || null,
        charEnd: chunk.charEnd || null,
        tokenCount: chunk.tokenCount || null,
      })),
    });
  }
}

/**
 * 获取 Asset 信息
 * @param {string} assetId Asset ID
 * @returns {object} Asset 信息
 */
export async function getAsset(assetId) {
  return prisma.asset.findUnique({
    where: { id: assetId },
  });
}

/**
 * 关闭数据库连接
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// 导出 prisma 客户端供其他模块使用
export { prisma };