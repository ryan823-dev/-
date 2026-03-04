/**
 * Cron: 雷达 AI 合格化
 * 
 * 每 15 分钟执行一次，对 status=NEW 的候选批量执行 AI 合格化。
 * 按 profileId 分组（条款D），使用正确的 TargetingSpec。
 * 包含 Feedback Loop（条款F）。
 * 
 * 配置 vercel.json cron: every 15 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdapterRegistration, ensureAdaptersInitialized } from '@/lib/radar/adapters';

const MAX_RUN_SECONDS = 50;
const MAX_BATCH_SIZE = 50;

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
    qualified: 0,
    excluded: 0,
    enriching: 0,
    errors: [] as string[],
  };

  try {
    // 条款D: 查询 NEW 候选，按 profileId 分组
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const candidates = await prisma.radarCandidate.findMany({
      where: {
        status: 'NEW',
        profileId: { not: null },
        createdAt: { gt: twentyFourHoursAgo },
      },
      include: { source: true },
      take: MAX_BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, ...stats, message: 'No NEW candidates' });
    }

    // 按 profileId 分组
    const grouped = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const pid = c.profileId!;
      if (!grouped.has(pid)) grouped.set(pid, []);
      grouped.get(pid)!.push(c);
    }

    // 对每组执行合格化
    for (const [profileId, batch] of grouped) {
      if (Date.now() >= deadline) {
        stats.errors.push('Timeout reached');
        break;
      }

      try {
        const profile = await prisma.radarSearchProfile.findUnique({
          where: { id: profileId },
        });
        if (!profile) continue;

        // 简化合格化逻辑（不依赖 Skill Runner，直接基于规则）
        // 后续可升级为 executeSkill(RADAR_QUALIFY_ACCOUNTS)
        for (const candidate of batch) {
          if (Date.now() >= deadline) break;

          try {
            const tier = scoreCandidate(candidate, profile);
            
            if (tier === 'excluded') {
              await prisma.radarCandidate.update({
                where: { id: candidate.id },
                data: {
                  status: 'EXCLUDED',
                  qualifyTier: 'excluded',
                  qualifyReason: 'Auto-qualify: below threshold',
                  qualifiedAt: new Date(),
                  qualifiedBy: 'scheduler',
                },
              });
              stats.excluded++;

              // Feedback Loop: 记录排除原因
              await appendExclusionRule(profileId, candidate.displayName, candidate.industry);
            } else {
              // 条款E: 判断是否需要 enrich
              const needsEnrich = (tier === 'A' || tier === 'B') &&
                !candidate.phone && !candidate.website &&
                candidate.source.storagePolicy !== 'ID_ONLY';

              const adapterReg = getAdapterRegistration(candidate.source.code);
              const supportsDetails = adapterReg?.features?.supportsDetails ?? false;
              const shouldEnrich = needsEnrich && supportsDetails;

              await prisma.radarCandidate.update({
                where: { id: candidate.id },
                data: {
                  status: shouldEnrich ? 'ENRICHING' : 'QUALIFIED',
                  qualifyTier: tier,
                  qualifyReason: `Auto-qualify: tier ${tier}`,
                  qualifiedAt: new Date(),
                  qualifiedBy: 'scheduler',
                },
              });

              if (shouldEnrich) {
                stats.enriching++;
              } else {
                stats.qualified++;
              }
            }
            stats.processed++;
          } catch (candidateError) {
            stats.errors.push(
              `Candidate ${candidate.id}: ${candidateError instanceof Error ? candidateError.message : 'Unknown'}`
            );
          }
        }
      } catch (groupError) {
        stats.errors.push(
          `Profile ${profileId}: ${groupError instanceof Error ? groupError.message : 'Unknown'}`
        );
      }
    }

    console.log(
      `[radar-qualify] Processed ${stats.processed}, ` +
      `qualified: ${stats.qualified}, excluded: ${stats.excluded}, enriching: ${stats.enriching}`
    );

    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error('[radar-qualify] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// ==================== 评分逻辑 ====================

function scoreCandidate(
  candidate: { displayName: string; website?: string | null; phone?: string | null; country?: string | null; industry?: string | null; matchScore?: number | null; description?: string | null },
  profile: { targetCountries: string[]; industryCodes: string[]; exclusionRules: unknown }
): 'A' | 'B' | 'C' | 'excluded' {
  let score = 0;

  // 有网站 +2
  if (candidate.website) score += 2;
  // 有电话 +1
  if (candidate.phone) score += 1;
  // 目标国家匹配 +3
  if (candidate.country && profile.targetCountries.includes(candidate.country)) score += 3;
  // 行业匹配 +2
  if (candidate.industry && profile.industryCodes.some(ic => 
    candidate.industry?.toLowerCase().includes(ic.toLowerCase())
  )) score += 2;
  // 已有匹配分数 +N
  if (candidate.matchScore) score += Math.round(candidate.matchScore * 3);
  // 有描述 +1
  if (candidate.description && candidate.description.length > 50) score += 1;

  // 排除规则检查
  const rules = (profile.exclusionRules as { negativeKeywords?: string[] }) || {};
  if (rules.negativeKeywords?.length) {
    const text = `${candidate.displayName} ${candidate.description || ''}`.toLowerCase();
    if (rules.negativeKeywords.some(kw => text.includes(kw.toLowerCase()))) {
      return 'excluded';
    }
  }

  if (score >= 7) return 'A';
  if (score >= 4) return 'B';
  if (score >= 2) return 'C';
  return 'excluded';
}

// ==================== Feedback Loop ====================

async function appendExclusionRule(
  profileId: string,
  displayName: string,
  industry?: string | null
): Promise<void> {
  try {
    const profile = await prisma.radarSearchProfile.findUnique({
      where: { id: profileId },
      select: { exclusionRules: true },
    });

    const existingRules = (profile?.exclusionRules as { 
      negativeKeywords?: string[];
      excludedCompanies?: string[];
    }) || {};

    // 提取公司名作为排除关键词（取前3个词）
    const nameTokens = displayName.split(/\s+/).slice(0, 3).filter(t => t.length > 2);
    const existingNeg = existingRules.negativeKeywords || [];
    const existingComp = existingRules.excludedCompanies || [];

    // 限制排除规则总数（防止无限增长）
    const MAX_EXCLUSIONS = 100;
    if (existingComp.length >= MAX_EXCLUSIONS) return;

    await prisma.radarSearchProfile.update({
      where: { id: profileId },
      data: {
        exclusionRules: {
          negativeKeywords: [...new Set([...existingNeg, ...nameTokens])].slice(0, MAX_EXCLUSIONS),
          excludedCompanies: [...new Set([...existingComp, displayName])].slice(0, MAX_EXCLUSIONS),
        } as object,
      },
    });
  } catch {
    // 静默失败，不影响主流程
  }
}
