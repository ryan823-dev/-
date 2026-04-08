import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VertaX 资源中心 - 白皮书、案例与工具',
  description: '下载《2026 中国企业出海获客趋势白皮书》、查看客户案例、使用获客工具，助力企业全球化增长。',
  robots: 'index, follow',
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
