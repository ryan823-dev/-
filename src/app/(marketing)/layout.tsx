import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '联系我们 - VertaX',
    template: '%s | VertaX',
  },
  description: '预约 VertaX 产品演示，获取您行业的 GTM 路径样板与 ICP 示例。商务洽谈、技术咨询、客户支持请联系 us。',
  keywords: ['联系 VertaX', '预约演示', '商务洽谈', '产品咨询', '客户支持'],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
