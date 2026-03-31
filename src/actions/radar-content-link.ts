'use server';

// ==================== Radar Content Link Actions ====================
// P3: radar candidate <-> marketing content bidirectional linkage

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ContentLinkType, Prisma, RadarContentLink } from '@prisma/client';

// ==================== Types ====================

export type RadarContentLinkData = RadarContentLink & {
  candidate?: {
    id: string;
    displayName: string;
    industry: string | null;
    country: string | null;
    qualifyTier: string | null;
    status: string;
    candidateType: string;
    matchScore: number | null;
  };
  content?: {
    id: string;
    title: string;
    slug: string;
    keywords: string[];
    status: string;
    geoVersion: string | null;
  };
};

export interface ContentMatchResult {
  contentId: string;
  title: string;
  slug: string;
  keywords: string[];
  status: string;
  matchedKeywords: string[];
  matchScore: number;
}

export interface CandidateMatchResult {
  candidateId: string;
  displayName: string;
  industry: string | null;
  country: string | null;
  qualifyTier: string | null;
  matchedKeywords: string[];
  matchScore: number;
}

// ==================== Query ====================

/**
 * Get all content links for a candidate
 */
export async function getLinksForCandidate(
  candidateId: string
): Promise<RadarContentLinkData[]> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  return prisma.radarContentLink.findMany({
    where: { candidateId, tenantId: session.user.tenantId },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          slug: true,
          keywords: true,
          status: true,
          geoVersion: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all candidate links for a content piece
 */
export async function getLinksForContent(
  contentId: string
): Promise<RadarContentLinkData[]> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  return prisma.radarContentLink.findMany({
    where: { contentId, tenantId: session.user.tenantId },
    include: {
      candidate: {
        select: {
          id: true,
          displayName: true,
          industry: true,
          country: true,
          qualifyTier: true,
          status: true,
          candidateType: true,
          matchScore: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get linkage stats overview for dashboard
 */
export async function getContentLinkStats() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');
  const tenantId = session.user.tenantId;

  const [totalLinks, keywordMatches, industryMatches, manualLinks, leadsGenerated] =
    await Promise.all([
      prisma.radarContentLink.count({ where: { tenantId } }),
      prisma.radarContentLink.count({
        where: { tenantId, linkType: 'KEYWORD_MATCH' },
      }),
      prisma.radarContentLink.count({
        where: { tenantId, linkType: 'INDUSTRY_MATCH' },
      }),
      prisma.radarContentLink.count({
        where: { tenantId, linkType: 'MANUAL' },
      }),
      prisma.radarContentLink.count({
        where: { tenantId, leadGenerated: true },
      }),
    ]);

  return {
    totalLinks,
    keywordMatches,
    industryMatches,
    manualLinks,
    leadsGenerated,
  };
}

// ==================== Auto-Matching ====================

/**
 * Find matching content for a candidate based on keywords and industry.
 * Uses SeoContent.keywords (hasSome) and industry matching.
 */
export async function findMatchingContent(
  candidateId: string
): Promise<ContentMatchResult[]> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');
  const tenantId = session.user.tenantId;

  const candidate = await prisma.radarCandidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw new Error('Candidate not found');

  // Extract keywords from candidate's matchExplain and industry
  const extractedKeywords = extractCandidateKeywords(candidate);
  if (extractedKeywords.length === 0) return [];

  // Find content with matching keywords
  const matchingContent = await prisma.seoContent.findMany({
    where: {
      tenantId,
      deletedAt: null,
      keywords: { hasSome: extractedKeywords },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      keywords: true,
      status: true,
    },
  });

  // Score and sort matches
  return matchingContent
    .map((content) => {
      const matchedKeywords = content.keywords.filter((kw) =>
        extractedKeywords.some(
          (ek) =>
            kw.toLowerCase().includes(ek.toLowerCase()) ||
            ek.toLowerCase().includes(kw.toLowerCase())
        )
      );
      const matchScore = Math.min(
        100,
        (matchedKeywords.length / Math.max(extractedKeywords.length, 1)) * 100
      );
      return {
        contentId: content.id,
        title: content.title,
        slug: content.slug,
        keywords: content.keywords,
        status: content.status,
        matchedKeywords,
        matchScore: Math.round(matchScore),
      };
    })
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Find matching candidates for a content piece based on its keywords.
 */
export async function findMatchingCandidates(
  contentId: string
): Promise<CandidateMatchResult[]> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');
  const tenantId = session.user.tenantId;

  const content = await prisma.seoContent.findUnique({
    where: { id: contentId },
    select: { keywords: true },
  });
  if (!content || content.keywords.length === 0) return [];

  // Find candidates matching any of the content keywords
  // Use industry and categoryName fields for matching
  const candidates = await prisma.radarCandidate.findMany({
    where: {
      tenantId,
      status: { in: ['NEW', 'REVIEWING', 'QUALIFIED'] },
      OR: [
        { industry: { in: content.keywords, mode: 'insensitive' } },
        { categoryName: { in: content.keywords, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      displayName: true,
      industry: true,
      country: true,
      qualifyTier: true,
      matchExplain: true,
      categoryName: true,
    },
  });

  return candidates.map((c) => {
    const candidateKeywords = [
      c.industry,
      c.categoryName,
    ].filter(Boolean) as string[];

    const matchedKeywords = content.keywords.filter((kw) =>
      candidateKeywords.some(
        (ck) =>
          ck.toLowerCase().includes(kw.toLowerCase()) ||
          kw.toLowerCase().includes(ck.toLowerCase())
      )
    );

    const matchScore = Math.min(
      100,
      (matchedKeywords.length / Math.max(content.keywords.length, 1)) * 100
    );

    return {
      candidateId: c.id,
      displayName: c.displayName,
      industry: c.industry,
      country: c.country,
      qualifyTier: c.qualifyTier,
      matchedKeywords,
      matchScore: Math.round(matchScore),
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// ==================== Mutations ====================

/**
 * Create a link between a candidate and content
 */
export async function createContentLink(input: {
  candidateId: string;
  contentId: string;
  linkType: ContentLinkType;
  matchScore?: number;
  matchDetails?: Record<string, unknown>;
}): Promise<RadarContentLink> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  const link = await prisma.radarContentLink.create({
    data: {
      tenantId: session.user.tenantId,
      candidateId: input.candidateId,
      contentId: input.contentId,
      linkType: input.linkType,
      matchScore: input.matchScore ?? null,
      matchDetails: input.matchDetails as Prisma.InputJsonValue ?? undefined,
    },
  });

  revalidatePath('/customer/radar/candidates');
  revalidatePath('/customer/marketing');
  return link;
}

/**
 * Batch-create links from auto-matching results
 */
export async function batchCreateContentLinks(input: {
  candidateId: string;
  matches: Array<{
    contentId: string;
    matchScore: number;
    matchedKeywords: string[];
  }>;
}): Promise<{ created: number }> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');
  const tenantId = session.user.tenantId;

  // Filter out already-linked pairs
  const existing = await prisma.radarContentLink.findMany({
    where: {
      candidateId: input.candidateId,
      contentId: { in: input.matches.map((m) => m.contentId) },
    },
    select: { contentId: true },
  });
  const existingIds = new Set(existing.map((e) => e.contentId));

  const newLinks = input.matches
    .filter((m) => !existingIds.has(m.contentId))
    .map((m) => ({
      tenantId,
      candidateId: input.candidateId,
      contentId: m.contentId,
      linkType: 'KEYWORD_MATCH' as ContentLinkType,
      matchScore: m.matchScore,
      matchDetails: {
        matchedKeywords: m.matchedKeywords,
        matchMethod: 'auto_keyword',
      } as Prisma.InputJsonValue,
    }));

  if (newLinks.length === 0) return { created: 0 };

  await prisma.radarContentLink.createMany({ data: newLinks });

  revalidatePath('/customer/radar/candidates');
  revalidatePath('/customer/marketing');
  return { created: newLinks.length };
}

/**
 * Remove a content link
 */
export async function deleteContentLink(linkId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  await prisma.radarContentLink.delete({
    where: { id: linkId, tenantId: session.user.tenantId },
  });

  revalidatePath('/customer/radar/candidates');
  revalidatePath('/customer/marketing');
}

/**
 * Update link outreach status
 */
export async function updateLinkOutreachStatus(
  linkId: string,
  outreachStatus: string,
  outreachRecordId?: string
): Promise<RadarContentLink> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  const link = await prisma.radarContentLink.update({
    where: { id: linkId, tenantId: session.user.tenantId },
    data: {
      outreachStatus,
      ...(outreachRecordId ? { outreachRecordId } : {}),
    },
  });

  revalidatePath('/customer/radar/candidates');
  return link;
}

/**
 * Mark a link as having generated a lead
 */
export async function markLinkLeadGenerated(
  linkId: string,
  note?: string
): Promise<RadarContentLink> {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  const link = await prisma.radarContentLink.update({
    where: { id: linkId, tenantId: session.user.tenantId },
    data: {
      leadGenerated: true,
      conversionNote: note ?? null,
    },
  });

  revalidatePath('/customer/radar/candidates');
  revalidatePath('/customer/marketing');
  return link;
}

// ==================== Helpers ====================

/**
 * Extract searchable keywords from a RadarCandidate's fields
 */
function extractCandidateKeywords(candidate: {
  industry: string | null;
  categoryName: string | null;
  categoryCode: string | null;
  displayName: string;
  matchExplain: unknown;
  aiRelevance: unknown;
}): string[] {
  const keywords: string[] = [];

  if (candidate.industry) keywords.push(candidate.industry);
  if (candidate.categoryName) keywords.push(candidate.categoryName);

  // Extract from matchExplain.query or matchExplain.reasons
  if (candidate.matchExplain && typeof candidate.matchExplain === 'object') {
    const explain = candidate.matchExplain as Record<string, unknown>;
    if (typeof explain.query === 'string') {
      keywords.push(
        ...explain.query
          .split(/[\s,;]+/)
          .filter((w: string) => w.length > 2)
      );
    }
  }

  // Extract from aiRelevance.matchedKeywords
  if (candidate.aiRelevance && typeof candidate.aiRelevance === 'object') {
    const relevance = candidate.aiRelevance as Record<string, unknown>;
    if (Array.isArray(relevance.matchedKeywords)) {
      keywords.push(
        ...(relevance.matchedKeywords as string[]).filter(
          (kw) => typeof kw === 'string'
        )
      );
    }
  }

  // Deduplicate and filter
  return [...new Set(keywords.map((k) => k.toLowerCase().trim()))].filter(
    (k) => k.length > 1
  );
}
