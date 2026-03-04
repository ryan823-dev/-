/**
 * Cron: 雷达清理
 * 
 * 每日凌晨 2 点执行：
 * 1. 清理过期候选（TTL）
 * 2. 释放死锁的 RadarSearchProfile
 * 
 * 配置 vercel.json cron: 0 2 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupExpiredCandidates } from '@/lib/radar/sync-service';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = {
    expiredCandidates: 0,
    releasedLocks: 0,
    errors: [] as string[],
  };

  try {
    // 1. 清理过期候选
    stats.expiredCandidates = await cleanupExpiredCandidates();

    // 2. 释放死锁（超过1小时的锁）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const lockResult = await prisma.radarSearchProfile.updateMany({
      where: {
        lockToken: { not: null },
        lockedAt: { lt: oneHourAgo },
      },
      data: {
        lockToken: null,
        lockedAt: null,
        lockedBy: null,
      },
    });
    stats.releasedLocks = lockResult.count;

    console.log(
      `[radar-cleanup] Expired candidates: ${stats.expiredCandidates}, ` +
      `released locks: ${stats.releasedLocks}`
    );

    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error('[radar-cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
