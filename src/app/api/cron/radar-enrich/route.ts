/**
 * Cron: 雷达详情补全
 * 
 * 每小时执行一次，对 status=ENRICHING 的候选调用 adapter.getDetails() 补全。
 * 条款E: 仅 Tier A/B + 缺关键字段 + supportsDetails 才会进入此队列。
 * 条款F: 硬超时 50 秒。
 * 
 * 配置 vercel.json cron: 0 * * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdapter, ensureAdaptersInitialized } from '@/lib/radar/adapters';

const MAX_RUN_SECONDS = 50;
const MAX_BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deadline = Date.now() + MAX_RUN_SECONDS * 1000;
  ensureAdaptersInitialized();

  const stats = {
    processed: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // 查询 ENRICHING 候选（带 source 信息）
    const candidates = await prisma.radarCandidate.findMany({
      where: { status: 'ENRICHING' },
      include: { source: true },
      take: MAX_BATCH_SIZE,
      orderBy: { updatedAt: 'asc' },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, ...stats, message: 'No ENRICHING candidates' });
    }

    // 按 sourceId 分组
    const grouped = new Map<string, typeof candidates>();
    for (const c of candidates) {
      if (!grouped.has(c.sourceId)) grouped.set(c.sourceId, []);
      grouped.get(c.sourceId)!.push(c);
    }

    for (const [sourceId, batch] of grouped) {
      if (Date.now() >= deadline) {
        stats.skipped += batch.length;
        stats.errors.push('Timeout reached');
        break;
      }

      const source = batch[0].source;

      try {
        const adapter = getAdapter(source.code, source.adapterConfig as Record<string, unknown>);

        if (!adapter.getDetails) {
          // 适配器不支持 getDetails，直接跳过并标记为 QUALIFIED
          await prisma.radarCandidate.updateMany({
            where: { id: { in: batch.map(c => c.id) } },
            data: { status: 'QUALIFIED', enrichedAt: new Date() },
          });
          stats.skipped += batch.length;
          continue;
        }

        for (const candidate of batch) {
          if (Date.now() >= deadline) {
            stats.skipped++;
            break;
          }

          try {
            const details = await adapter.getDetails(candidate.externalId);

            if (details) {
              await prisma.radarCandidate.update({
                where: { id: candidate.id },
                data: {
                  phone: details.phone || candidate.phone,
                  email: details.email || candidate.email,
                  website: details.website || candidate.website,
                  address: details.address || candidate.address,
                  description: details.description || candidate.description,
                  status: 'QUALIFIED',
                  enrichedAt: new Date(),
                },
              });
              stats.enriched++;
            } else {
              // 无详情返回，直接标记为 QUALIFIED
              await prisma.radarCandidate.update({
                where: { id: candidate.id },
                data: { status: 'QUALIFIED', enrichedAt: new Date() },
              });
              stats.skipped++;
            }

            stats.processed++;

            // 速率限制
            await new Promise(r => setTimeout(r, 500));
          } catch (candidateError) {
            stats.failed++;
            stats.errors.push(
              `Candidate ${candidate.id}: ${candidateError instanceof Error ? candidateError.message : 'Unknown'}`
            );

            // 失败后恢复为 QUALIFIED（不卡死在 ENRICHING）
            await prisma.radarCandidate.update({
              where: { id: candidate.id },
              data: { status: 'QUALIFIED' },
            }).catch(() => {});
          }
        }
      } catch (sourceError) {
        stats.errors.push(
          `Source ${sourceId}: ${sourceError instanceof Error ? sourceError.message : 'Unknown'}`
        );
      }
    }

    console.log(
      `[radar-enrich] Processed ${stats.processed}, ` +
      `enriched: ${stats.enriched}, failed: ${stats.failed}, skipped: ${stats.skipped}`
    );

    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error('[radar-enrich] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
