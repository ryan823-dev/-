"use client";

import { usePathname } from 'next/navigation';
import { getPageTitleByPath } from '@/config/nav';

export interface PageHeaderProps {
  /** 自定义标题（覆盖导航配置） */
  title?: string;
  /** 自定义副标题 */
  subtitle?: string;
  /** 右侧操作区 */
  actions?: React.ReactNode;
  /** 是否显示时间 */
  showTime?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * PageHeader - 页面头部组件
 * 
 * 自动从 nav.ts 配置读取"老板语标题"
 * 格式：大标题（董事长驾驶舱）+ 小字副标题（决策中心）
 */
export function PageHeader({
  title: customTitle,
  subtitle: customSubtitle,
  actions,
  showTime = false,
  className = '',
}: PageHeaderProps) {
  const pathname = usePathname();
  
  // 从配置获取标题
  const configTitle = getPageTitleByPath(pathname || '');
  
  const title = customTitle || configTitle?.title || '页面';
  const subtitle = customSubtitle || configTitle?.subtitle;

  return (
    <header className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {showTime && <TimeDisplay />}
        {actions}
      </div>
    </header>
  );
}

function TimeDisplay() {
  // 简单的时间显示，可以后续增强为实时更新
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  
  return (
    <div className="text-right">
      <p className="text-lg font-bold text-[var(--text-primary)] font-tabular">{timeStr}</p>
      <p className="text-xs text-[var(--text-muted)]">{dateStr}</p>
    </div>
  );
}

/**
 * usePageTitle - 获取当前页面标题的 Hook
 */
export function usePageTitle() {
  const pathname = usePathname();
  return getPageTitleByPath(pathname || '');
}
