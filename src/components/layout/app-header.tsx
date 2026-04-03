"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./notification-bell";

export function AppHeader() {
  const pathname = usePathname();

  const segments = pathname
    .replace(/^\/(zh-CN|en)\//, "")
    .split("/")
    .filter(Boolean);

  const breadcrumbMap: Record<string, string> = {
    dashboard: "工作台",
    products: "产品",
    seo: "SEO",
    social: "社交媒体",
    leads: "获客",
    settings: "设置",
    admin: "管理",
    categories: "产品分类",
    planner: "SEO 规划",
    calendar: "社交日历",
    accounts: "社交账号",
    automation: "社交自动化",
    campaigns: "获客活动",
    research: "获客研究",
    profile: "个人资料",
    company: "公司信息",
    team: "团队管理",
    website: "网站设置",
    tenants: "租户管理",
    system: "系统设置",
    new: "新建",
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const label = breadcrumbMap[segment] || segment;
            const href =
              "/zh-CN/" + segments.slice(0, index + 1).join("/");

            return (
              <span key={segment + index} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-4">
        <NotificationBell />
      </div>
    </header>
  );
}
