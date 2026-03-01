
import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Copy, 
  Check, 
  Download,
  Sparkles,
  Clock,
  ChevronDown,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../types';

type ReportType = 'weekly' | 'monthly' | 'executive';

interface ReportTemplate {
  type: ReportType;
  label: string;
  labelEN: string;
  description: string;
  icon: React.ReactNode;
  targetAudience: string;
  sections: string[];
}

interface ReportGeneratorProps {
  role: UserRole;
  companyName?: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: 'weekly',
    label: '周报',
    labelEN: 'Weekly Report',
    description: '本周执行进度与下周计划',
    icon: <Calendar size={18} />,
    targetAudience: '执行团队',
    sections: ['执行进度', '数据汇总', '问题阻塞', '下周计划']
  },
  {
    type: 'monthly',
    label: '月报',
    labelEN: 'Monthly Report',
    description: '月度增长指标与趋势分析',
    icon: <BarChart3 size={18} />,
    targetAudience: '管理层',
    sections: ['目标达成', '增长趋势', '投入产出', '优化建议']
  },
  {
    type: 'executive',
    label: '老板简报',
    labelEN: 'Executive Brief',
    description: '一分钟决策要点摘要',
    icon: <Sparkles size={18} />,
    targetAudience: '决策者',
    sections: ['核心结论', '需要拍板', '阻塞穿透', '行动建议']
  }
];

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  role, 
  companyName = '涂豆科技' 
}) => {
  const [selectedType, setSelectedType] = useState<ReportType>('executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    setGeneratedReport(null);

    // Simulate API call to generate report
    await new Promise(resolve => setTimeout(resolve, 1500));

    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let report = '';

    switch (selectedType) {
      case 'weekly':
        report = `# ${companyName} 出海获客周报
> 生成时间：${dateStr} | 数据周期：本周

## 一、本周执行进度

### 知识引擎
- 完成知识卡片结构化：2 个
- 知识完整度提升：+8%（当前 78%）
- 识别待补齐参数：2 项（典型节拍、工件尺寸）

### 获客雷达
- 本周新增线索：待执行
- 已评分线索：0 家
- 转化进度：初始化阶段

### 内容资产
- 生成内容草稿：3 篇
- 待审批确认：2 篇
- SEO 优化完成：0 篇

### 社媒运营
- LinkedIn 授权状态：待接入
- 已发布内容：0 篇
- 排程内容：0 篇

## 二、本周数据汇总

| 指标 | 本周 | 上周 | 变化 |
|------|------|------|------|
| 知识完整度 | 78% | 70% | +8% |
| 内容资产数 | 3 | 0 | +3 |
| 潜在客户数 | 0 | 0 | - |
| 社媒曝光 | 0 | 0 | - |

## 三、问题与阻塞

1. **P0 - 关键参数缺失**
   - 影响：选型指南生成缺乏专业对比维度
   - 建议：补齐典型节拍范围、最大工件尺寸

2. **P1 - LinkedIn 授权未完成**
   - 影响：社媒自动发布暂停
   - 建议：尽快完成企业账号授权接入

## 四、下周计划

- [ ] 完成关键参数补齐（P0）
- [ ] LinkedIn 账号授权接入
- [ ] 启动首批获客任务（目标：德国市场）
- [ ] 完成 2 篇内容审批发布

---
*此报告由 VertaX 出海获客智能体自动生成*`;
        break;

      case 'monthly':
        report = `# ${companyName} 出海增长月报
> 生成时间：${dateStr} | 数据周期：本月

## 一、目标达成情况

### 核心 KPI 完成度

| 目标项 | 月度目标 | 实际完成 | 完成率 |
|--------|----------|----------|--------|
| 知识结构化 | 5 张卡片 | 2 张 | 40% |
| 内容生成 | 10 篇 | 3 篇 | 30% |
| 潜客发现 | 50 家 | 0 家 | 0% |
| 社媒发布 | 20 篇 | 0 篇 | 0% |

### 阶段判定
当前处于 **冷启动阶段**，核心任务是完成知识体系搭建与渠道授权接入。

## 二、增长趋势分析

### 知识引擎
- 完整度曲线呈上升趋势（+8%/周）
- 预计 4 周内可达 95% 完整度
- 瓶颈：需客户配合补齐专业参数

### 内容资产
- 生成效率：3 篇/周（AI 生成）
- 审批周期：待确认（依赖客户响应）
- SEO 优化：待内容确认后启动

### 获客漏斗
- 漏斗状态：待启动
- 首批目标市场：德国、墨西哥
- ICP 画像：已完成建模

## 三、投入产出分析

### 资源投入
- AI 算力消耗：标准配额内
- 人工介入：低（主要为审批确认）
- 外部服务：待接入（LinkedIn API）

### 预期产出
- 短期（1-2周）：完成冷启动，输出首批获客线索
- 中期（1个月）：建立稳定的内容+获客闭环
- 长期（3个月）：预计触达 100+ 精准客户

## 四、优化建议

1. **加速审批流程**：建议设定固定审批时间窗口
2. **优先完成授权**：LinkedIn 接入将显著提升曝光
3. **聚焦高价值市场**：建议首发德国（法规驱动）

---
*此报告由 VertaX 出海获客智能体自动生成*`;
        break;

      case 'executive':
        report = `# ${companyName} 决策简报
> ${dateStr} | 阅读时间：1 分钟

## 核心结论

出海获客系统已完成初步部署，当前处于 **冷启动阶段**。知识体系完整度达 78%，已生成 3 篇内容草稿待您确认。

## 需要您拍板

1. **补齐关键参数** (P0)
   - 典型节拍范围、最大工件尺寸
   - 影响：选型指南专业度提升 40%
   
2. **确认首发市场** (P1)
   - 推荐：德国（法规驱动，高匹配度）
   - 备选：墨西哥（成本敏感，增长快）

## 当前阻塞

| 阻塞项 | 影响 | 解决方案 |
|--------|------|----------|
| LinkedIn 未授权 | 社媒发布暂停 | 一键授权接入 |
| 参数缺失 | 内容专业度不足 | 补齐 2 项数据 |

## 行动建议

**本周优先**：补齐参数 + 完成 LinkedIn 授权
**预期效果**：下周即可启动首批德国获客任务

---
*VertaX 出海获客智能体 | ${role.label}专属视图*`;
        break;
    }

    setGeneratedReport(report);
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    if (!generatedReport) return;
    await navigator.clipboard.writeText(generatedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTemplate = REPORT_TEMPLATES.find(t => t.type === selectedType)!;

  // For 执行者 role, default to weekly report
  const availableTemplates = role.type === 'STAFF' 
    ? REPORT_TEMPLATES.filter(t => t.type === 'weekly')
    : REPORT_TEMPLATES;

  return (
    <div className="bg-white/60 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <FileText size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900">智能汇报生成</h4>
            <p className="text-[10px] text-slate-400">一键生成周报/月报/老板简报</p>
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-border/30 pt-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              选择报告类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableTemplates.map(template => (
                <button
                  key={template.type}
                  onClick={() => setSelectedType(template.type)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    selectedType === template.type
                      ? 'bg-gold/10 border-gold/30 shadow-sm'
                      : 'bg-white/40 border-border/30 hover:border-gold/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`${selectedType === template.type ? 'text-gold' : 'text-slate-400'}`}>
                      {template.icon}
                    </div>
                    <span className="text-xs font-bold text-navy-900">{template.label}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-slate-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">目标受众</span>
              <span className="text-[10px] font-bold text-navy-900">{selectedTemplate.targetAudience}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedTemplate.sections.map((section, i) => (
                <span 
                  key={i}
                  className="text-[9px] bg-white px-2 py-1 rounded-md border border-border/30 text-slate-600"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full bg-navy-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Clock size={16} className="animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                生成{selectedTemplate.label}
              </>
            )}
          </button>

          {/* Generated Report */}
          {generatedReport && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  生成结果
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-gold transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制全文'}
                  </button>
                  <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-gold transition-colors">
                    <Download size={12} />
                    导出
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-border/30 p-4 max-h-80 overflow-y-auto">
                <pre className="text-xs text-navy-900 whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedReport}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
