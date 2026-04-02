"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  CheckCircle2,
  ArrowLeft,
  Mail,
  MessageSquare,
} from "lucide-react";

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const result = await res.json();
        setError(result.error || "提交失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #0B1220 0%, #1a1a2e 50%, #0B1220 100%)",
      }}
    >
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 30% 50%, rgba(212,175,55,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-[rgba(212,175,55,0.1)]" />
        <div className="absolute top-40 left-40 w-48 h-48 rounded-full border border-[rgba(212,175,55,0.08)]" />
        <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full border border-[rgba(212,175,55,0.05)]" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #C5A030 100%)",
                  boxShadow: "0 8px 32px -8px rgba(212,175,55,0.4)",
                }}
              >
                <Zap className="w-8 h-8" style={{ color: "#0B1220" }} />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{ color: "#D4AF37" }}
                >
                  VertaX
                </h1>
                <p
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  GTM Intelligence OS
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2
              className="text-4xl font-bold leading-tight"
              style={{ color: "#ffffff" }}
            >
              为出海企业
              <br />
              <span style={{ color: "#D4AF37" }}>定制增长方案</span>
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              VertaX 为每一家合作企业量身配置专属工作台。
              <br />
              留下信息，我们的解决方案顾问会在 1 个工作日内与您联系。
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              "专属行业解决方案咨询",
              "ICP 建模与目标市场分析",
              "免费 POC 试用计划",
              "专人对接全程支持",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "#D4AF37" }}
                />
                <span
                  className="text-base"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 relative">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #D4AF37 0%, #C5A030 100%)",
                }}
              >
                <Zap className="w-6 h-6" style={{ color: "#0B1220" }} />
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "#D4AF37" }}
              >
                VertaX
              </h1>
            </div>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            {submitted ? (
              /* Success state */
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(34,197,94,0.15)" }}
                >
                  <CheckCircle2
                    className="w-8 h-8"
                    style={{ color: "#22c55e" }}
                  />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#ffffff" }}
                >
                  提交成功
                </h3>
                <p
                  className="text-sm mb-8"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  我们的解决方案顾问会在 1 个工作日内与您联系。
                  <br />
                  您也可以通过以下方式直接联系我们：
                </p>

                <div className="space-y-4">
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Mail
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: "#D4AF37" }}
                    />
                    <div className="text-left">
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        邮件咨询
                      </p>
                      <a
                        href="mailto:contact@vertax.top"
                        className="text-sm font-medium hover:underline"
                        style={{ color: "#D4AF37" }}
                      >
                        contact@vertax.top
                      </a>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <MessageSquare
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: "#D4AF37" }}
                    />
                    <div className="text-left">
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        微信咨询
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        扫码添加解决方案顾问
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-8 text-sm font-medium hover:underline"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回登录
                </Link>
              </div>
            ) : (
              /* Form */
              <>
                <div className="text-center mb-6">
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "#ffffff" }}
                  >
                    获取使用资格
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    留下信息，开启您的出海增长之旅
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "#ef4444" }}>
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        className="text-xs font-medium"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        姓名 <span style={{ color: "#D4AF37" }}>*</span>
                      </label>
                      <Input
                        name="name"
                        placeholder="您的姓名"
                        required
                        className="h-11"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#ffffff",
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="text-xs font-medium"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        手机 <span style={{ color: "rgba(255,255,255,0.3)" }}>(选填)</span>
                      </label>
                      <Input
                        name="phone"
                        type="tel"
                        placeholder="手机号码"
                        className="h-11"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#ffffff",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      公司名称 <span style={{ color: "#D4AF37" }}>*</span>
                    </label>
                    <Input
                      name="company"
                      placeholder="您所在的公司"
                      required
                      className="h-11"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#ffffff",
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      工作邮箱 <span style={{ color: "#D4AF37" }}>*</span>
                    </label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      className="h-11"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#ffffff",
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      留言{" "}
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>
                        (选填)
                      </span>
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      placeholder="请简要描述您的出海需求或感兴趣的场景..."
                      className="w-full rounded-md px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#ffffff",
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium mt-2"
                    disabled={loading}
                    style={{
                      background:
                        "linear-gradient(135deg, #D4AF37 0%, #C5A030 100%)",
                      color: "#0B1220",
                      boxShadow: "0 8px 24px -8px rgba(212,175,55,0.4)",
                      border: "none",
                    }}
                  >
                    {loading ? "提交中..." : "提交咨询"}
                  </Button>
                </form>

                <p
                  className="text-center mt-5 text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  提交即表示您同意我们的服务条款和隐私政策
                </p>
              </>
            )}
          </div>

          <p
            className="text-center mt-6 text-sm"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            已有账户？{" "}
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: "#D4AF37" }}
            >
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
