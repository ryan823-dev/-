import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vertax.top";

// 首页 SEO metadata
export const metadata: Metadata = {
  title: "VertaX · 面向中国企业出海的智能获客平台",
  description: "VertaX 是面向中国企业出海的智能获客平台，围绕知识引擎、内容增长、商机挖掘、品牌声量、协同推进与经营决策六大能力，帮助制造业、工业品、技术服务型企业建立可持续、可进化的全球增长体系。",
  keywords: "出海获客,企业出海,智能获客平台,制造业出海,工业品出海,B2B获客,知识引擎,获客雷达,增长系统,GTM系统",
  // 百度站点验证 - 必须使用 otherVerification 格式
  other: {
    "baidu-site-verification": "codeva-Y0nSSpkmX1",
  },
};

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Check if it's the root domain
  const isRootDomain = host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`;
  
  // Check if it's a customer subdomain
  const isCustomerSubdomain = host.endsWith(`.${BASE_DOMAIN}`) && 
    !host.startsWith("tower.") && 
    !host.startsWith("www.");
  
  // Check if it's tower (operations) subdomain
  const isTowerSubdomain = host === `tower.${BASE_DOMAIN}`;
  
  // If customer subdomain, redirect to login
  if (isCustomerSubdomain) {
    redirect("/login");
  }
  
  // If tower subdomain, redirect to login
  if (isTowerSubdomain) {
    redirect("/login");
  }
  
  // Only show landing page for root domain
  if (isRootDomain) {
    return <LandingPage />;
  }
  
  // Default: show landing page
  return <LandingPage />;
}
