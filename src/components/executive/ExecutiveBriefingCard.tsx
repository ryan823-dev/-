"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export interface MetricItem {
  label: string;
  value: string;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  href?: string;
}

export interface RiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  actionHref?: string;
}

export interface SuggestionItem {
  id: string;
  message: string;
  action?: string;
  actionHref?: string;
}

export interface ExecutiveBriefingCardProps {
  greeting: string;
  subtitle?: string;
  metrics: MetricItem[];
  risks?: RiskItem[];
  suggestions?: SuggestionItem[];
  lastUpdated?: Date;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * ExecutiveBriefingCard - 老板专属简报卡片
 * 
 * 秘书式中文文案风格：
 * - 敬语开头："X总，早上好"
 * - 结论先行："本周新增3家高意向客户"
 * - 风险提示："有1项需要您关注"
 * - 建议收尾："建议优先处理..."
 */
export function ExecutiveBriefingCard({
  greeting,
  subtitle,
  metrics,
  risks = [],
  suggestions = [],
  lastUpdated,
  onRefresh,
  isLoading = false,
}: ExecutiveBriefingCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const highRisks = risks.filter(r => r.level === 'high');
  const hasUrgentRisks = highRisks.length > 0;

  return (
    <div className="exec-card p-8 animate-exec-fade-in">
      {/* Header - 问候语 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-exec-gold rounded-2xl flex items-center justify-center shadow-exec-gold-glow shrink-0">
            <Sparkles className="text-exec-base" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-exec-primary tracking-tight">
              {greeting}
            </h2>
            {subtitle && (
              <p className="text-exec-secondary text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-exec-ghost p-2"
              title="刷新数据"
            >
              {isRefreshing ? (
                <Loader2 size={18} className="text-exec-gold animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
            </button>
          )}
          {lastUpdated && (
            <div className="text-right">
              <p className="text-exec-muted text-xs">数据更新于</p>
              <p className="text-exec-secondary text-sm font-tabular">
                {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-exec-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* Metrics Grid - 3指标卡 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {metrics.slice(0, 3).map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>

          {/* Risk Alerts - 风险提示 */}
          {risks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle 
                  size={16} 
                  className={hasUrgentRisks ? 'text-exec-danger' : 'text-exec-warning'} 
                />
                <span className={`text-sm font-medium ${hasUrgentRisks ? 'text-exec-danger' : 'text-exec-warning'}`}>
                  {hasUrgentRisks ? `有 ${highRisks.length} 项需要您立即关注` : '风险提示'}
                </span>
              </div>
              <div className="space-y-2">
                {risks.slice(0, 3).map((risk) => (
                  <RiskAlert key={risk.id} risk={risk} />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions - 建议行动 */}
          {suggestions.length > 0 && (
            <div className="pt-4 border-t border-exec-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-exec-gold" />
                <span className="text-exec-gold text-sm font-medium">建议优先处理</span>
              </div>
              <div className="space-y-2">
                {suggestions.slice(0, 2).map((suggestion) => (
                  <SuggestionRow key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricItem }) {
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;
  const trendColor = metric.trend === 'up' ? 'text-exec-success' : metric.trend === 'down' ? 'text-exec-danger' : 'text-exec-muted';
  
  const content = (
    <div className="bg-exec-elevated rounded-xl p-4 border border-exec-subtle hover:border-exec-gold transition-all group">
      <p className="text-exec-muted text-xs mb-1">{metric.label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-exec-primary font-tabular">{metric.value}</span>
        {metric.unit && <span className="text-exec-secondary text-sm">{metric.unit}</span>}
      </div>
      {(metric.change !== undefined || TrendIcon) && (
        <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
          {TrendIcon && <TrendIcon size={12} />}
          {metric.change !== undefined && (
            <span className="text-xs">
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
          )}
        </div>
      )}
      {metric.href && (
        <ChevronRight 
          size={14} 
          className="absolute top-3 right-3 text-exec-muted opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      )}
    </div>
  );

  return metric.href ? (
    <Link href={metric.href} className="block relative">
      {content}
    </Link>
  ) : (
    <div className="relative">{content}</div>
  );
}

function RiskAlert({ risk }: { risk: RiskItem }) {
  const levelStyles = {
    high: 'border-l-exec-danger bg-danger-soft/30',
    medium: 'border-l-exec-warning bg-warning-soft/30',
    low: 'border-l-exec-muted bg-exec-elevated',
  };
  const levelColors = {
    high: 'text-exec-danger',
    medium: 'text-exec-warning',
    low: 'text-exec-muted',
  };

  return (
    <div className={`flex items-center justify-between pl-3 pr-4 py-2.5 rounded-lg border-l-2 ${levelStyles[risk.level]}`}>
      <span className={`text-sm ${levelColors[risk.level]}`}>{risk.message}</span>
      {risk.action && risk.actionHref && (
        <Link
          href={risk.actionHref}
          className="text-exec-gold text-xs font-medium hover:underline flex items-center gap-1"
        >
          {risk.action}
          <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: SuggestionItem }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-exec-secondary text-sm">{suggestion.message}</span>
      {suggestion.action && suggestion.actionHref && (
        <Link
          href={suggestion.actionHref}
          className="btn-exec-secondary text-xs py-1.5 px-3"
        >
          {suggestion.action}
        </Link>
      )}
    </div>
  );
}
