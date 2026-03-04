"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { mapRoleToAppRole, canPerformAction } from '@/lib/permissions';
import { APP_ROLES, DISPLAY_MODES, type AppRole, type DisplayMode } from '@/lib/constants';

interface RoleContextValue {
  /** 应用角色：DECIDER | OPERATOR */
  appRole: AppRole;
  /** 是否为决策者 */
  isDecider: boolean;
  /** 显示模式：secretary | analyst */
  displayMode: DisplayMode;
  /** 切换显示模式 */
  toggleDisplayMode: () => void;
  /** 设置显示模式 */
  setDisplayMode: (mode: DisplayMode) => void;
  /** 检查某操作是否允许 */
  canPerform: (action: string) => boolean;
  /** 用户名 */
  userName: string;
  /** 角色显示名 */
  roleLabel: string;
  /** 角色描述 */
  roleDescription: string;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY_PREFIX = 'vertax_display_mode';

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  
  const roleName = (session?.user as Record<string, unknown> | undefined)?.roleName as string | undefined;
  const appRole = mapRoleToAppRole(roleName);
  const isDeciderRole = appRole === APP_ROLES.DECIDER;

  const defaultMode = isDeciderRole ? DISPLAY_MODES.SECRETARY : DISPLAY_MODES.ANALYST;
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(defaultMode);
  const [hydrated, setHydrated] = useState(false);

  // 从 localStorage 恢复用户偏好
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${userId}`);
    if (stored === DISPLAY_MODES.SECRETARY || stored === DISPLAY_MODES.ANALYST) {
      setDisplayModeState(stored);
    } else {
      setDisplayModeState(defaultMode);
    }
    setHydrated(true);
  }, [session?.user?.id, defaultMode]);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    const userId = session?.user?.id;
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_${userId}`, mode);
    }
  }, [session?.user?.id]);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(
      displayMode === DISPLAY_MODES.SECRETARY ? DISPLAY_MODES.ANALYST : DISPLAY_MODES.SECRETARY
    );
  }, [displayMode, setDisplayMode]);

  const canPerform = useCallback((action: string) => {
    return canPerformAction(appRole, action);
  }, [appRole]);

  const userName = session?.user?.name || '用户';
  const roleLabel = isDeciderRole ? '决策者' : '执行者';
  const roleDescription = isDeciderRole ? '全权限 · 可审批发布' : '执行操作 · 限制审批';

  const value: RoleContextValue = {
    appRole,
    isDecider: isDeciderRole,
    displayMode: hydrated ? displayMode : defaultMode,
    toggleDisplayMode,
    setDisplayMode,
    canPerform,
    userName,
    roleLabel,
    roleDescription,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    // 在 RoleProvider 外部调用时返回安全默认值
    return {
      appRole: APP_ROLES.OPERATOR,
      isDecider: false,
      displayMode: DISPLAY_MODES.ANALYST,
      toggleDisplayMode: () => {},
      setDisplayMode: () => {},
      canPerform: () => false,
      userName: '用户',
      roleLabel: '执行者',
      roleDescription: '执行操作 · 限制审批',
    };
  }
  return ctx;
}
