"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Package,
  FileText,
  Share2,
  UserSearch,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  List,
  FolderOpen,
  CalendarDays,
  Users,
  Globe,
  Bot,
  ChevronDown,
  Megaphone,
  Search,
  Zap,
  Image,
} from "lucide-react";
import { isPlatformAdmin } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserMenu } from "./user-menu";

export function AppSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoUser = {
    name: "演示用户",
    email: "demo@example.com",
    tenantName: "演示公司",
    tenantSlug: "demo",
    roleName: "admin",
    permissions: ["*"] as string[],
  };
  const user = session?.user || (isDemoMode ? demoUser : null);

  const isAdmin = isPlatformAdmin(
    user ? { permissions: user.permissions ?? [], roleName: user.roleName ?? "" } : null
  );

  const navGroups = [
    {
      key: "main",
      items: [
        {
          title: t("dashboard"),
          url: "/zh-CN/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      key: "assets",
      label: t("assets"),
      icon: Image,
      items: [
        { title: t("assetAll"), url: "/zh-CN/assets", icon: FolderOpen },
      ],
    },
    {
      key: "products",
      label: t("products"),
      icon: Package,
      items: [
        { title: t("productList"), url: "/zh-CN/products", icon: List },
        {
          title: t("productCategories"),
          url: "/zh-CN/products/categories",
          icon: FolderOpen,
        },
      ],
    },
    {
      key: "seo",
      label: t("seo"),
      icon: FileText,
      items: [
        { title: t("seoContent"), url: "/zh-CN/seo", icon: List },
        {
          title: t("seoCategories"),
          url: "/zh-CN/seo/categories",
          icon: FolderOpen,
        },
        { title: t("seoPlanner"), url: "/zh-CN/seo/planner", icon: Search },
      ],
    },
    {
      key: "social",
      label: t("social"),
      icon: Share2,
      items: [
        { title: t("socialPosts"), url: "/zh-CN/social", icon: Megaphone },
        {
          title: t("socialCalendar"),
          url: "/zh-CN/social/calendar",
          icon: CalendarDays,
        },
        {
          title: t("socialAccounts"),
          url: "/zh-CN/social/accounts",
          icon: Users,
        },
        {
          title: t("socialAutomation"),
          url: "/zh-CN/social/automation",
          icon: Zap,
        },
      ],
    },
    {
      key: "leads",
      label: t("leads"),
      icon: UserSearch,
      items: [
        { title: t("leadList"), url: "/zh-CN/leads", icon: List },
        {
          title: t("leadCampaigns"),
          url: "/zh-CN/leads/campaigns",
          icon: Megaphone,
        },
        { title: t("leadResearch"), url: "/zh-CN/leads/research", icon: Search },
      ],
    },
    {
      key: "settings",
      label: t("settings"),
      icon: Settings,
      items: [
        {
          title: t("settingsProfile"),
          url: "/zh-CN/settings/profile",
          icon: Users,
        },
        {
          title: t("settingsCompany"),
          url: "/zh-CN/settings/company",
          icon: Package,
        },
        {
          title: t("settingsTeam"),
          url: "/zh-CN/settings/team",
          icon: Users,
        },
        {
          title: t("settingsWebsite"),
          url: "/zh-CN/settings/website",
          icon: Globe,
        },
      ],
    },
  ];

  if (isAdmin) {
    navGroups.push({
      key: "admin",
      label: t("admin"),
      icon: ShieldCheck,
      items: [
        {
          title: t("adminTenants"),
          url: "/zh-CN/admin/tenants",
          icon: Users,
        },
        {
          title: t("adminSystem"),
          url: "/zh-CN/admin/system",
          icon: Settings,
        },
      ],
    });
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/zh-CN/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">出海管理平台</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.tenantName || "Loading..."}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          if (group.key === "main") {
            return (
              <SidebarGroup key={group.key}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          const GroupIcon = group.icon!;
          const isGroupActive = group.items.some(
            (item) =>
              pathname === item.url || pathname.startsWith(item.url + "/")
          );

          return (
            <SidebarGroup key={group.key}>
              <Collapsible defaultOpen={isGroupActive} className="group/collapsible">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    <GroupIcon className="mr-2 size-4" />
                    {group.label}
                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={
                              pathname === item.url ||
                              (item.url !== "/zh-CN/products" &&
                                item.url !== "/zh-CN/seo" &&
                                item.url !== "/zh-CN/social" &&
                                item.url !== "/zh-CN/leads" &&
                                item.url !== "/zh-CN/settings" &&
                                pathname.startsWith(item.url))
                            }
                          >
                            <Link href={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
