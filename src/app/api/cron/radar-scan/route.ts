/**
 * Cron: 雷达持续扫描
 * 
 * 每 5 分钟执行一次，查询到期的 RadarSearchProfile，
 * 通过乐观锁争抢后执行增量扫描。
 * 
 * 配置 vercel.json cron: every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScheduledScans } from '@/lib/radar/scan-scheduler';

export async function GET(req: NextRequest) {
  // 验证 cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runScheduledScans();

    console.log(
      `[radar-scan] Processed ${result.profilesProcessed} profiles, ` +
      `new: ${result.totalNew}, dup: ${result.totalDuplicates}, ` +
      `duration: ${result.totalDuration}ms`
    );

    return NextResponse.json({
      ok: true,
      profilesProcessed: result.profilesProcessed,
      totalNew: result.totalNew,
      totalDuplicates: result.totalDuplicates,
      totalDuration: result.totalDuration,
      profiles: result.profiles.map(p => ({
        name: p.name,
        sources: p.sources.map(s => ({
          code: s.sourceCode,
          created: s.result.created,
          duplicates: s.result.duplicates,
          exhausted: s.result.exhausted,
        })),
        error: p.error,
      })),
      errors: result.errors,
    });
  } catch (error) {
    console.error('[radar-scan] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
