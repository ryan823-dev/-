import { BaiduPush } from '@/components/seo/baidu-push';

// Marketing layout - 不设置固定 title，让各页面自己定义
// 这样可以避免子页面继承错误的默认标题

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 百度自动推送 - 加速收录 */}
      <BaiduPush />
      {children}
    </>
  );
}