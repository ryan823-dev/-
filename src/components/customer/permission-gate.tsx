"use client";

import type { ReactNode } from 'react';
import { useRoleContext } from '@/contexts/role-context';

interface PermissionGateProps {
  /** 需要检查的操作标识 */
  action: string;
  /** 有权限时展示 */
  children: ReactNode;
  /** 无权限时展示（默认不渲染） */
  fallback?: ReactNode;
  /** 无权限时是否禁用而非隐藏 */
  disableInstead?: boolean;
}

/**
 * 前端权限门控组件
 * 根据当前用户角色决定是否渲染子组件
 */
export function PermissionGate({ action, children, fallback = null, disableInstead = false }: PermissionGateProps) {
  const { canPerform } = useRoleContext();
  
  if (canPerform(action)) {
    return <>{children}</>;
  }
  
  if (disableInstead) {
    return (
      <div className="opacity-50 pointer-events-none cursor-not-allowed" title="该操作需要决策者权限">
        {children}
      </div>
    );
  }
  
  return <>{fallback}</>;
}
