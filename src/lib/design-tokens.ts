/* ── Design Tokens ── */
// 与租户端统一的设计语言：金色 + 奶油白 + 深色
// 纯常量文件，可在服务端和客户端组件中使用

export const colors = {
  // 背景色
  bg: {
    primary: '#F7F3EA',      // 奶油白主背景
    secondary: '#FFFFFF',     // 卡片背景
    dark: '#0B1220',          // 深色区块
    gradient: 'linear-gradient(180deg, #F7F3EA 0%, #EDE8DC 100%)',
    darkGradient: 'linear-gradient(180deg, #0B1220 0%, #0D1526 100%)',
  },
  // 品牌色
  brand: {
    gold: '#D4AF37',          // 金色主色
    goldLight: '#E8C547',     // 金色浅
    goldDark: '#B8972E',      // 金色深
    goldRgb: '212,175,55',    // 金色 RGB 值用于透明度
  },
  // 文字色
  text: {
    primary: '#111827',       // 主文字
    secondary: '#4B5563',     // 次文字
    muted: '#9CA3AF',         // 弱化文字
    inverse: '#FFFFFF',       // 反色文字
  },
  // 边框色
  border: {
    light: 'rgba(212,175,55,0.15)',
    medium: 'rgba(212,175,55,0.3)',
    white: 'rgba(255,255,255,0.06)',
  },
};