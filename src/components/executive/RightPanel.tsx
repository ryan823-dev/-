"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bell,
  CheckSquare,
  Activity,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';

// ============================================
// Type Definitions
// ============================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AlertSeverity = 'high' | 'medium' | 'low';
export type ActivityType = 'ai_generated' | 'user_action' | 'system' | 'collaboration';

export interface ApprovalItem {
  id: string;
  title: string;
  description?: string;
  requestedBy?: string;
  requestedAt: Date;
  status: ApprovalStatus;
  href?: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  href?: string;
  dismissed?: boolean;
  onDismiss?: () => void;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  actor?: string;
  timestamp: Date;
  href?: string;
  metadata?: Record<string, unknown>;
}

export interface RightPanelProps {
  /** 待审批项 */
  approvals?: ApprovalItem[];
  /** 告警提醒 */
  alerts?: AlertItem[];
  /** 活动动态 */
  activities?: ActivityItem[];
  /** 面板标题 */
  title?: string;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认折叠状态 */
  defaultCollapsed?: boolean;
}

// ============================================
// Main Component
// ============================================

/**
 * RightPanel - 右侧秘书面板
 * 
 * 堆叠三个区块：
 * 1. 待审批 Approvals
 * 2. 告警 Alerts  
 * 3. 动态 Activity
 * 
 * 秘书式设计：信息简洁、行动明确、不打扰
 */
export function RightPanel({
  approvals = [],
  alerts = [],
  activities = [],
  title = '秘书台',
  collapsible = false,
  defaultCollapsed = false,
}: RightPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const activeAlerts = alerts.filter(a => !a.dismissed);
  const highAlerts = activeAlerts.filter(a => a.severity === 'high');

  // Badge count for header
  const badgeCount = pendingApprovals.length + highAlerts.length;

  if (collapsible && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-exec-panel border border-exec-subtle rounded-xl flex items-center justify-center shadow-exec-card hover:border-exec-gold transition-colors"
      >
        <Bell size={18} className="text-exec-secondary" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-exec-danger text-exec-primary text-xs font-bold rounded-full flex items-center justify-center">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="w-80 bg-exec-panel border-l border-exec-subtle flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-exec-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-exec-primary font-bold">{title}</h2>
          {badgeCount > 0 && (
            <span className="px-1.5 py-0.5 bg-exec-danger text-exec-primary text-xs font-bold rounded">
              {badgeCount}
            </span>
          )}
        </div>
        {collapsible && (
          <button
            onClick={() => setCollapsed(true)}
            className="btn-exec-ghost p-1.5"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-exec">
        {/* Approvals Section */}
        <PanelSection
          title="待审批"
          icon={CheckSquare}
          count={pendingApprovals.length}
          emptyMessage="暂无待审批事项"
          accentColor="gold"
        >
          {pendingApprovals.slice(0, 5).map((item) => (
            <ApprovalCard key={item.id} item={item} />
          ))}
          {pendingApprovals.length > 5 && (
            <Link href="/c/approvals" className="text-exec-gold text-xs hover:underline block text-center py-2">
              查看全部 {pendingApprovals.length} 项
            </Link>
          )}
        </PanelSection>

        {/* Alerts Section */}
        <PanelSection
          title="告警"
          icon={AlertTriangle}
          count={activeAlerts.length}
          emptyMessage="系统运行正常"
          accentColor={highAlerts.length > 0 ? 'danger' : 'warning'}
        >
          {activeAlerts.slice(0, 5).map((item) => (
            <AlertCard key={item.id} item={item} />
          ))}
        </PanelSection>

        {/* Activity Section */}
        <PanelSection
          title="动态"
          icon={Activity}
          count={activities.length}
          emptyMessage="暂无新动态"
          accentColor="muted"
          defaultExpanded={pendingApprovals.length === 0 && activeAlerts.length === 0}
        >
          {activities.slice(0, 10).map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </PanelSection>
      </div>
    </aside>
  );
}

// ============================================
// Sub Components
// ============================================

interface PanelSectionProps {
  title: string;
  icon: React.ElementType;
  count: number;
  emptyMessage: string;
  accentColor: 'gold' | 'danger' | 'warning' | 'muted';
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function PanelSection({
  title,
  icon: Icon,
  count,
  emptyMessage,
  accentColor,
  defaultExpanded = true,
  children,
}: PanelSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const accentStyles = {
    gold: 'text-exec-gold',
    danger: 'text-exec-danger',
    warning: 'text-exec-warning',
    muted: 'text-exec-muted',
  };

  return (
    <div className="border-b border-exec-subtle">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-exec-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className={accentStyles[accentColor]} />
          <span className="text-exec-secondary text-sm font-medium">{title}</span>
          {count > 0 && (
            <span className={`text-xs font-bold ${accentStyles[accentColor]}`}>
              ({count})
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-exec-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {count === 0 ? (
            <p className="text-exec-muted text-xs text-center py-4">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ item }: { item: ApprovalItem }) {
  const content = (
    <div className="bg-exec-elevated rounded-lg p-3 border border-exec-subtle hover:border-exec-gold/30 transition-colors group">
      <p className="text-exec-primary text-sm font-medium mb-1 line-clamp-2">{item.title}</p>
      {item.description && (
        <p className="text-exec-muted text-xs mb-2 line-clamp-1">{item.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-exec-muted text-xs">
          <Clock size={10} />
          {formatRelativeTime(item.requestedAt)}
        </div>
        {(item.onApprove || item.onReject) && (
          <div className="flex gap-1.5">
            {item.onReject && (
              <button
                onClick={(e) => { e.preventDefault(); item.onReject?.(); }}
                className="p-1.5 text-exec-muted hover:text-exec-danger transition-colors"
              >
                <XCircle size={14} />
              </button>
            )}
            {item.onApprove && (
              <button
                onClick={(e) => { e.preventDefault(); item.onApprove?.(); }}
                className="p-1.5 text-exec-muted hover:text-exec-success transition-colors"
              >
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

function AlertCard({ item }: { item: AlertItem }) {
  const severityStyles = {
    high: 'border-l-exec-danger bg-danger-soft/30',
    medium: 'border-l-exec-warning bg-warning-soft/30',
    low: 'border-l-exec-muted bg-exec-elevated',
  };

  const content = (
    <div className={`rounded-lg pl-3 pr-3 py-2.5 border-l-2 ${severityStyles[item.severity]} flex items-start justify-between gap-2`}>
      <div className="flex-1 min-w-0">
        <p className="text-exec-secondary text-xs line-clamp-2">{item.message}</p>
        <p className="text-exec-muted text-[10px] mt-1">{formatRelativeTime(item.timestamp)}</p>
      </div>
      {item.onDismiss && (
        <button
          onClick={(e) => { e.preventDefault(); item.onDismiss?.(); }}
          className="text-exec-muted hover:text-exec-secondary transition-colors shrink-0"
        >
          <XCircle size={12} />
        </button>
      )}
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const typeIcons = {
    ai_generated: FileText,
    user_action: User,
    system: Activity,
    collaboration: User,
  };
  const Icon = typeIcons[item.type];

  const content = (
    <div className="flex items-start gap-2.5 py-2 group">
      <div className="w-6 h-6 rounded-full bg-exec-surface flex items-center justify-center shrink-0">
        <Icon size={12} className="text-exec-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-exec-secondary text-xs line-clamp-2">
          {item.actor && <span className="text-exec-primary font-medium">{item.actor} </span>}
          {item.message}
        </p>
        <p className="text-exec-muted text-[10px] mt-0.5">{formatRelativeTime(item.timestamp)}</p>
      </div>
      {item.href && (
        <ExternalLink size={10} className="text-exec-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
      )}
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

// ============================================
// Utilities
// ============================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
