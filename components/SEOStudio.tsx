
import React, { useState } from 'react';
import { SEOTask } from '../types';

const SEOStudio: React.FC = () => {
  const [tasks] = useState<SEOTask[]>([
    { id: '1', title: '工业阀门选型完全指南', category: '采购指南', status: '已发布', healthScore: 92 },
    { id: '2', title: '现代制造业效率研究分析', category: '行业白皮书', status: '审核中', healthScore: 84 },
    { id: '3', title: '不锈钢材料在矿山机械中的核心地位', category: '技术博客', status: '草案', healthScore: 78 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">营销驱动系统 (SEO & GEO)</h2>
          <p className="text-slate-500 text-sm">全自动生成符合生成式引擎引用规范的高质量内容资产。</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-ivory-surface border border-border text-navy-900 rounded-xl text-sm font-bold hover:bg-ivory transition-all shadow-sm">
            站点体检
          </button>
          <button className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-bold hover:bg-navy-800 transition-all shadow-sm">
            制定增长计划
          </button>
        </div>
      </div>

      <div className="flex border-b border-border gap-8">
        {['站点体检', '增长计划', '内容资产', '发布记录'].map((tab, i) => (
          <button key={tab} className={`pb-3 text-sm font-bold transition-all relative ${i === 2 ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'}`}>
            {tab}
            {i === 2 && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {tasks.map(task => (
           <div key={task.id} className="bg-ivory-surface p-6 border border-border rounded-2xl custom-shadow hover:border-gold/40 transition-all group flex flex-col h-full">
             <div className="flex justify-between items-start mb-4">
               <span className="text-[10px] font-bold bg-ivory text-slate-500 px-2.5 py-1 rounded border border-border uppercase tracking-wider">{task.category}</span>
               <div className="flex items-center gap-1.5">
                 <span className="text-xs font-bold text-navy-900">{task.healthScore}</span>
                 <div className={`w-2 h-2 rounded-full ${task.healthScore > 90 ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'}`} />
               </div>
             </div>
             <h4 className="text-sm font-bold text-navy-900 mb-8 line-clamp-2 leading-relaxed flex-1 group-hover:text-navy-800 transition-colors">{task.title}</h4>
             <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/50">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                  task.status === '已发布' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {task.status}
                </span>
                <button className="text-xs font-bold text-gold hover:text-gold/80 flex items-center gap-1 transition-colors">
                  编辑内容 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default SEOStudio;
