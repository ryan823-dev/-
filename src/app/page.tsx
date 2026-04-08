import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vertax.top";
const SITE_URL = "https://vertax.top";

// 首页 SEO metadata
export const metadata: Metadata = {
  title: "VertaX · 面向中国企业出海的智能获客平台",
  description: "VertaX 是面向中国企业出海的智能获客平台，围绕知识引擎、内容增长、商机挖掘、品牌声量、协同推进与经营决策六大能力，帮助制造业、工业品、技术服务型企业建立可持续、可进化的全球增长体系。",
  keywords: "出海获客,企业出海,智能获客平台,制造业出海,工业品出海,B2B获客,知识引擎,获客雷达,增长系统,GTM系统",
  // 多语言 alternates
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/',
      'en': '/en',
    },
  },
  // 百度站点验证 - 必须使用 other 字段
  other: {
    "baidu-site-verification": "codeva-Y0nSSpkmX1",
  },
};

// Organization + WebSite 结构化数据，便于搜索引擎和AI理解品牌实体
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VertaX",
  "alternateName": "VertaX 出海获客智能体",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "description": "VertaX 是面向中国企业出海的智能获客平台，围绕知识引擎、内容增长、商机挖掘、品牌声量、协同推进与经营决策六大能力，帮助制造业、工业品、技术服务型企业建立可持续、可进化的全球增长体系。",
  "foundingDate": "2024",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "HK"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "contact@vertax.top"
  },
  "sameAs": [
    "https://mp.weixin.qq.com/s/3WO5IPyNDHvMGEKd5uBuCg"
  ]
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "VertaX",
  "url": SITE_URL,
  "description": "面向中国企业出海的智能获客平台",
  "publisher": {
    "@type": "Organization",
    "name": "VertaX"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
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
    return (
      <>
        {/* Organization + WebSite Schema for SEO/GEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <LandingPage />
      </>
    );
  }

  // Default: show landing page
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <LandingPage />
    </>
  );
}
