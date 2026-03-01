
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  MessageSquare,
  Briefcase,
  Globe,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { UserRole } from '../types';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

interface AISidebarProps {
  role: UserRole;
  currentPage?: string;
}

const AISidebar: React.FC<AISidebarProps> = ({ role, currentPage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBoss = role.type === 'BOSS';

  const config = isBoss ? {
    title: '专属出海顾问',
    subtitle: '为您的全球化战略保驾护航',
    services: [
      { icon: Briefcase, label: '战略决策', desc: '市场进入与资源配置建议' },
      { icon: Globe, label: '全球洞察', desc: '目标市场趋势与竞品动态' },
      { icon: BarChart3, label: '业务诊断', desc: '获客漏斗与转化分析' },
      { icon: Lightbulb, label: '增长策略', desc: '内容方向与渠道优化' }
    ],
    quickCommands: ['一分钟汇报', '本周战果'],
    placeholder: '请指示...'
  } : {
    title: '执行支持助手',
    subtitle: '协助您高效完成每项任务',
    services: [
      { icon: Briefcase, label: '任务指引', desc: '操作步骤与注意事项' },
      { icon: Globe, label: '资料上传', desc: '文件格式与命名规范' },
      { icon: BarChart3, label: '进度查询', desc: '任务状态与完成情况' },
      { icon: Lightbulb, label: '问题解答', desc: '常见问题与解决方案' }
    ],
    quickCommands: ['今日任务', '操作指引'],
    placeholder: '请输入问题...'
  };

  useEffect(() => {
    setMessages([]);
  }, [role.type]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const q = text || inputValue;
    if (!q.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, role: role.label, context: { currentPage } })
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      const fallback = isBoss
        ? `收到。我正在为您分析相关数据，稍后呈上完整报告。`
        : `收到。正在为您准备相关信息，请稍候。`;
      setMessages(prev => [...prev, { role: 'ai', content: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="w-96 bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 border-l border-navy-800 flex flex-col h-full">
      {/* Consultant Persona Header */}
      <div className="px-6 pt-8 pb-6 text-center border-b border-navy-800/50">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4 shadow-lg shadow-gold/10">
          {isBoss ? <Sparkles size={28} className="text-gold" /> : <MessageSquare size={28} className="text-gold" />}
        </div>
        <h3 className="text-base font-bold text-white mb-1">{config.title}</h3>
        <p className="text-xs text-slate-400">{config.subtitle}</p>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400/80">在线 · 随时为您效劳</span>
        </div>
      </div>

      {/* Service Capabilities */}
      {!hasMessages && (
        <div className="px-5 py-5 border-b border-navy-800/50">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-4 text-center">服务能力</p>
          <div className="space-y-2">
            {config.services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(service.label)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-navy-800/30 hover:bg-navy-800/60 border border-navy-700/30 hover:border-gold/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-navy-800 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                    <Icon size={16} className="text-slate-400 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">{service.label}</p>
                    <p className="text-[10px] text-slate-500">{service.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Commands */}
      {!hasMessages && (
        <div className="px-5 py-4 border-b border-navy-800/50">
          <div className="flex gap-2">
            {config.quickCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSend(cmd)}
                className="flex-1 py-2.5 px-3 bg-gold hover:bg-gold/90 rounded-lg text-xs text-navy-900 font-bold transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {!hasMessages && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-600 text-center leading-relaxed">
              点击上方服务，或直接输入问题
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-navy-800/80 text-slate-200 rounded-tl-sm'
                : 'bg-gold text-navy-900 font-medium rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-navy-800/80 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-sm text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-navy-800/50 shrink-0 bg-navy-950/50">
        <div className="relative">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={config.placeholder}
            className="w-full bg-navy-800/50 border border-navy-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/30 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gold hover:bg-gold/90 disabled:bg-gold/50 rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={16} className="text-navy-900" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISidebar;
