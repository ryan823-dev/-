"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Key,
  Settings,
  Shield,
  LogOut,
  Zap,
  MessageSquareText,
} from "lucide-react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  {
    label: "概览",
    href: "/tower",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "租户管理",
    href: "/tower/tenants",
    icon: Building2,
  },
  {
    label: "咨询留言",
    href: "/tower/inquiries",
    icon: MessageSquareText,
  },
  {
    label: "API 密钥",
    href: "/tower/api-keys",
    icon: Key,
  },
  {
    label: "系统设置",
    href: "/tower/system",
    icon: Settings,
  },
];

export function TowerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="flex flex-col w-60 h-screen sticky top-0 bg-[#0c0f1a] border-r border-[rgba(255,255,255,0.06)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C5A030 100%)",
            boxShadow: "0 4px 16px -4px rgba(212,175,55,0.3)",
          }}
        >
          <Zap className="w-4.5 h-4.5 text-[#0c0f1a]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">VertaX Tower</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.4)]">平台运营管理</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-medium"
                  : "text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — user info */}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[rgba(255,255,255,0.8)] truncate">
              {user?.name || "运营管理员"}
            </p>
            <p className="text-[10px] text-[rgba(255,255,255,0.35)] truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
