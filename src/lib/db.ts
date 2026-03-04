import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon serverless 冷启动优化
    connectionTimeoutMillis: 10000, // 10s 连接超时（冷启动需要更长时间）
    idleTimeoutMillis: 30000,       // 30s 空闲回收
    max: 5,                          // 最大连接数（Vercel serverless 保持低值）
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
