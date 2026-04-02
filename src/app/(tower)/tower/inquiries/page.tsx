"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Clock,
  MessageSquare,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  new: { label: "新留言", color: "text-blue-600", bg: "bg-blue-50" },
  read: { label: "已读", color: "text-gray-600", bg: "bg-gray-100" },
  handled: { label: "已处理", color: "text-green-600", bg: "bg-green-50" },
};

export default function TowerInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadInquiries() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInquiries();
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status } : inq))
        );
        toast.success("状态已更新");
      }
    } catch {
      toast.error("更新失败");
    }
  }

  const newCount = inquiries.filter((i) => i.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            咨询留言
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {newCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            来自"获取使用资格"页面的商务咨询 · 共 {inquiries.length} 条
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadInquiries}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          刷新
        </Button>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">暂无咨询留言</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const statusInfo = STATUS_MAP[inq.status] || STATUS_MAP.new;
            const isExpanded = expandedId === inq.id;

            return (
              <div
                key={inq.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  inq.status === "new"
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-gray-200"
                }`}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : inq.id);
                    if (inq.status === "new") {
                      updateStatus(inq.id, "read");
                    }
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      inq.status === "new"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {inq.name}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm text-gray-600 truncate">
                        {inq.company}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{inq.email}</span>
                      {inq.phone && (
                        <span className="text-xs text-gray-400">
                          {inq.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusInfo.color} ${statusInfo.bg} border-0`}
                    >
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(inq.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">公司</p>
                          <p className="text-sm font-medium text-gray-900">
                            {inq.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">邮箱</p>
                          <a
                            href={`mailto:${inq.email}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {inq.email}
                          </a>
                        </div>
                      </div>
                      {inq.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">手机</p>
                            <p className="text-sm font-medium text-gray-900">
                              {inq.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">提交时间</p>
                          <p className="text-sm text-gray-900">
                            {new Date(inq.createdAt).toLocaleString("zh-CN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {inq.message && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-xs text-gray-400 mb-1">留言内容</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {inq.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 justify-end">
                      {inq.status !== "read" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(inq.id, "read");
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          标为已读
                        </Button>
                      )}
                      {inq.status !== "handled" && (
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(inq.id, "handled");
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          标为已处理
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}天前`;

  return new Date(dateStr).toLocaleDateString("zh-CN");
}
