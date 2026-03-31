"use client";

/**
 * ContentCandidatePanel - Show linked radar candidates for a content piece
 *
 * Used in the marketing content detail page to show which candidates
 * are linked to this content and allow auto-matching.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Loader2,
  Sparkles,
  LinkIcon,
  Unlink,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  getLinksForContent,
  findMatchingCandidates,
  createContentLink,
  deleteContentLink,
  type RadarContentLinkData,
  type CandidateMatchResult,
} from '@/actions/radar-content-link';

// ==================== Types ====================

interface ContentCandidatePanelProps {
  contentId: string;
}

// ==================== Component ====================

export function ContentCandidatePanel({ contentId }: ContentCandidatePanelProps) {
  const [links, setLinks] = useState<RadarContentLinkData[]>([]);
  const [suggestions, setSuggestions] = useState<CandidateMatchResult[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    setIsLoadingLinks(true);
    try {
      const data = await getLinksForContent(contentId);
      setLinks(data);
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadLinks();
    setSuggestions([]);
    setError(null);
  }, [contentId, loadLinks]);

  const handleAutoMatch = async () => {
    setIsMatching(true);
    setError(null);
    try {
      const results = await findMatchingCandidates(contentId);
      const linkedIds = new Set(links.map((l) => l.candidate?.id));
      setSuggestions(results.filter((r) => !linkedIds.has(r.candidateId)));
    } catch (err) {
      setError('匹配失败');
      console.error('Auto-match failed:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleLink = async (match: CandidateMatchResult) => {
    try {
      await createContentLink({
        candidateId: match.candidateId,
        contentId,
        linkType: 'INDUSTRY_MATCH',
        matchScore: match.matchScore,
        matchDetails: {
          matchedKeywords: match.matchedKeywords,
          matchMethod: 'auto_reverse',
        },
      });
      setSuggestions((prev) => prev.filter((s) => s.candidateId !== match.candidateId));
      await loadLinks();
    } catch (err) {
      console.error('Link failed:', err);
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      await deleteContentLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error('Unlink failed:', err);
    }
  };

  const tierColor = (tier: string | null) => {
    switch (tier) {
      case 'A': return 'bg-emerald-100 text-emerald-700';
      case 'B': return 'bg-amber-100 text-amber-700';
      case 'C': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="bg-[#F7F3E8] rounded-2xl border border-[#E8E0D0] p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-[#0B1B2B]">
          <Building2 size={14} className="text-[#D4AF37]" />
          关联候选
        </h4>
        <span className="text-xs text-slate-400">
          {links.length > 0 ? `${links.length} 个候选` : ''}
        </span>
      </div>

      {/* Existing links */}
      {isLoadingLinks ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="text-[#D4AF37] animate-spin" />
        </div>
      ) : links.length > 0 ? (
        <div className="space-y-2 mb-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-[#FFFCF7] rounded-xl border border-[#E8E0D0] p-3 flex items-start gap-2"
            >
              <Building2 size={14} className="text-[#D4AF37] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href="/customer/radar/candidates"
                  className="text-xs font-medium text-[#0B1B2B] hover:text-[#D4AF37] truncate block"
                >
                  {link.candidate?.displayName || '未知候选'}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {link.candidate?.qualifyTier && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${tierColor(link.candidate.qualifyTier)}`}>
                      {link.candidate.qualifyTier}级
                    </span>
                  )}
                  {link.candidate?.industry && (
                    <span className="text-[10px] text-slate-400">
                      {link.candidate.industry}
                    </span>
                  )}
                  {link.candidate?.country && (
                    <span className="text-[10px] text-slate-400">
                      {link.candidate.country}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleUnlink(link.id)}
                className="text-slate-300 hover:text-red-400 transition-colors p-1"
                title="取消关联"
              >
                <Unlink size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-slate-500 block mb-2">
            发现 {suggestions.length} 个匹配候选
          </span>
          <div className="space-y-1.5">
            {suggestions.slice(0, 5).map((s) => (
              <div
                key={s.candidateId}
                className="bg-[#FFFCF7] rounded-lg border border-dashed border-[#D4AF37]/30 p-2 flex items-center gap-2"
              >
                <Sparkles size={12} className="text-[#D4AF37] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#0B1B2B] truncate block">
                    {s.displayName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {s.industry} {s.country ? `| ${s.country}` : ''}
                  </span>
                </div>
                <button
                  onClick={() => handleLink(s)}
                  className="text-[#D4AF37] hover:text-[#C5A030] p-1"
                  title="关联"
                >
                  <LinkIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <button
        onClick={handleAutoMatch}
        disabled={isMatching}
        className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl text-xs font-medium hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50"
      >
        {isMatching ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            正在匹配...
          </>
        ) : (
          <>
            <Search size={14} />
            {links.length > 0 ? '重新匹配候选' : '智能匹配候选'}
          </>
        )}
      </button>
    </div>
  );
}
