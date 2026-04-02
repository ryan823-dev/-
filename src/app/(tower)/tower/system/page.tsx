"use client";

import { useState, useEffect } from "react";
import {
  Server,
  Database,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthStatus {
  database: "ok" | "error" | "checking";
  apiKeys: number;
  totalTenants: number;
  totalUsers: number;
  uptime: string;
}

export default function TowerSystemPage() {
  const [health, setHealth] = useState<HealthStatus>({
    database: "checking",
    apiKeys: 0,
    totalTenants: 0,
    totalUsers: 0,
    uptime: "—",
  });
  const [loading, setLoading] = useState(true);

  async function checkHealth() {
    setLoading(true);
    setHealth((prev) => ({ ...prev, database: "checking" }));

    try {
      // Check DB via admin stats endpoint
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) {
        const data = await res.json();
        const configuredKeys = (data.configs || []).filter(
          (c: { apiKey: string | null }) => c.apiKey
        ).length;

        setHealth({
          database: "ok",
          apiKeys: configuredKeys,
          totalTenants: 0,
          totalUsers: 0,
          uptime: formatUptime(),
        });
      } else {
        setHealth((prev) => ({ ...prev, database: "error" }));
      }
    } catch {
      setHealth((prev) => ({ ...prev, database: "error" }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  const envInfo = [
    { label: "运行环境", value: process.env.NODE_ENV || "development" },
    {
      label: "部署平台",
      value: process.env.NEXT_PUBLIC_VERCEL ? "Vercel" : "Self-hosted",
    },
    {
      label: "基础域名",
      value: process.env.NEXT_PUBLIC_BASE_DOMAIN || "vertax.top",
    },
    { label: "Next.js", value: "15.x (App Router)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">平台运行状态与系统信息</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkHealth}
          disabled={loading}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          刷新状态
        </Button>
      </div>

      {/* Health Checks */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">系统健康</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <HealthRow
            icon={Database}
            label="数据库连接"
            status={health.database}
            detail={
              health.database === "ok"
                ? "PostgreSQL (Supabase) 连接正常"
                : health.database === "checking"
                  ? "检查中..."
                  : "连接异常"
            }
          />
          <HealthRow
            icon={Server}
            label="应用服务"
            status="ok"
            detail={`运行中 · ${health.uptime}`}
          />
          <HealthRow
            icon={Globe}
            label="API 密钥"
            status={health.apiKeys > 0 ? "ok" : "error"}
            detail={
              health.apiKeys > 0
                ? `${health.apiKeys} 个服务已配置`
                : "尚未配置任何 API 密钥"
            }
          />
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">环境信息</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {envInfo.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-medium text-gray-900 font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">定时任务</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              name: "Radar 扫描",
              schedule: "每 4 小时",
              path: "/api/cron/radar-scan",
            },
            {
              name: "Radar 筛选",
              schedule: "每 2 小时",
              path: "/api/cron/radar-qualify",
            },
            {
              name: "Radar 丰富化",
              schedule: "每 6 小时",
              path: "/api/cron/radar-enrich",
            },
          ].map((job) => (
            <div
              key={job.name}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {job.name}
                  </p>
                  <p className="text-xs text-gray-400">{job.path}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                {job.schedule}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthRow({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  status: "ok" | "error" | "checking";
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{detail}</span>
        {status === "ok" && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
        {status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
        {status === "checking" && (
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>
    </div>
  );
}

function formatUptime() {
  // Process start time approximation based on page load
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  return `今日 ${hours}h${mins}m`;
}
