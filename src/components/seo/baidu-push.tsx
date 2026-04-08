'use client';

import { useEffect } from 'react';

/**
 * 百度自动推送组件
 * 当用户访问页面时，自动向百度发送当前页面URL，加速收录
 * 文档：https://ziyuan.baidu.com/linksubmit/index
 */
export function BaiduPush() {
  useEffect(() => {
    // 仅在生产环境执行
    if (process.env.NODE_ENV !== 'production') return;
    
    // 百度自动推送代码
    const script = document.createElement('script');
    script.innerHTML = `
      (function(){
        var bp = document.createElement('script');
        var curProtocol = window.location.protocol.split(':')[0];
        if (curProtocol === 'https') {
          bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
        } else {
          bp.src = 'http://push.zhanzhang.baidu.com/push.js';
        }
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(bp, s);
      })();
    `;
    document.body.appendChild(script);
    
    return () => {
      // 清理脚本
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  return null;
}