"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/seo/score-badge";
import { FindingItem } from "@/components/seo/finding-item";
import { AuditProgress } from "@/components/seo/audit-progress";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
} from "lucide-react";
import { getAudit, getAuditProgress, createAudit } from "@/actions/audit";
import { AUDIT_CATEGORY_LABELS } from "@/lib/constants";

interface AuditData {
  id: string;
  targetUrl: string;
  status: string;
  progress: number;
  currentStep: string | null;
  scores: Record<string, number>;
  findings: Array<{
    category: string;
    factor: string;
    status: "pass" | "warn" | "fail";
    score: number;
    message: string;
    recommendation: string;
  }>;
  aiSummary: string | null;
  crawlErrors: Array<{ step: string; error: string }>;
  pagesCrawled: number;
  crawlDuration: number | null;
  createdAt: string;
  completedAt: string | null;
}

const categoryOrder = [
  "technical",
  "onPage",
  "structuredData",
  "social",
  "geo",
];

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const auditStatus = audit?.status;

  const loadFull = useCallback(async () => {
    try {
      const data = await getAudit(auditId);
      if (!data) {
        router.push("/zh-CN/seo/planner");
        return;
      }
      setAudit({
        ...data,
        scores: (data.scores as Record<string, number>) ?? {},
        findings: (data.findings as AuditData["findings"]) ?? [],
        crawlErrors:
          (data.crawlErrors as AuditData["crawlErrors"]) ?? [],
        createdAt: data.createdAt.toISOString(),
        completedAt: data.completedAt?.toISOString() ?? null,
      });
    } catch {
      router.push("/zh-CN/seo/planner");
    } finally {
      setLoading(false);
    }
  }, [auditId, router]);

  // Initial load
  useEffect(() => {
    loadFull();
  }, [loadFull]);

  // Polling for in-progress audits
  useEffect(() => {
    if (
      !auditStatus ||
      auditStatus === "completed" ||
      auditStatus === "failed"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const progress = await getAuditProgress(auditId);
        setAudit((prev) =>
          prev
            ? {
                ...prev,
                status: progress.status,
                progress: progress.progress,
                currentStep: progress.currentStep,
              }
            : prev
        );

        // If completed or failed, load full data
        if (
          progress.status === "completed" ||
          progress.status === "failed"
        ) {
          loadFull();
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [auditStatus, auditId, loadFull]);

  async function handleRetry() {
    if (!audit) return;
    setRetrying(true);
    try {
      const newAudit = await createAudit(audit.targetUrl);
      fetch(`/api/audit/${newAudit.id}/execute`, { method: "POST" }).catch(
        () => {}
      );
      router.push(`/zh-CN/seo/planner/${newAudit.id}`);
    } catch {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO/GEO Audit" />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!audit) return null;

  const isInProgress =
    audit.status === "pending" ||
    audit.status === "crawling" ||
    audit.status === "analyzing";

  const groupedFindings = categoryOrder
    .map((cat) => ({
      category: cat,
      label:
        AUDIT_CATEGORY_LABELS[cat]?.en ?? cat,
      findings: audit.findings.filter((f) => f.category === cat),
    }))
    .filter((g) => g.findings.length > 0);

  const passCount = audit.findings.filter((f) => f.status === "pass").length;
  const warnCount = audit.findings.filter((f) => f.status === "warn").length;
  const failCount = audit.findings.filter((f) => f.status === "fail").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Report">
        <Link href="/zh-CN/seo/planner">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* URL header */}
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <a
            href={audit.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:underline flex items-center gap-1"
          >
            {audit.targetUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
          {audit.completedAt && (
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(audit.completedAt).toLocaleString()}
              {audit.crawlDuration &&
                ` (${(audit.crawlDuration / 1000).toFixed(1)}s)`}
            </span>
          )}
        </CardContent>
      </Card>

      {/* In Progress */}
      {isInProgress && (
        <Card>
          <CardContent>
            <AuditProgress
              progress={audit.progress}
              currentStep={audit.currentStep ?? ""}
              status={audit.status}
            />
          </CardContent>
        </Card>
      )}

      {/* Failed */}
      {audit.status === "failed" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground">
              {audit.currentStep || "Audit failed."}
            </p>
            <Button onClick={handleRetry} disabled={retrying}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed: Scores + Report */}
      {audit.status === "completed" && (
        <>
          {/* Overall Score + Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <ScoreBadge
                  score={audit.scores.overall ?? 0}
                  size="lg"
                  label="Overall Score"
                />
                <div className="flex items-center gap-4 mt-4 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {passCount} pass
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    {warnCount} warn
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {failCount} fail
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Category Scores */}
            {categoryOrder.map((cat) => (
              <Card key={cat}>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <ScoreBadge
                    score={audit.scores[cat] ?? 0}
                    size="md"
                    label={AUDIT_CATEGORY_LABELS[cat]?.en ?? cat}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Summary */}
          {audit.aiSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-sm text-muted-foreground whitespace-pre-wrap">
                  {audit.aiSummary}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Findings by Category */}
          {groupedFindings.map((group) => (
            <Card key={group.category}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {group.label}
                  <Badge variant="outline">
                    {audit.scores[group.category] ?? 0}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.findings.map((finding, idx) => (
                  <FindingItem
                    key={idx}
                    factor={finding.factor}
                    status={finding.status}
                    score={finding.score}
                    message={finding.message}
                    recommendation={finding.recommendation}
                  />
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Retry button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleRetry} disabled={retrying}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-audit this site
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
