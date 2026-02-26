
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const data = [
  { name: '周一', leads: 4, visits: 120 },
  { name: '周二', leads: 7, visits: 150 },
  { name: '周三', leads: 5, visits: 200 },
  { name: '周四', leads: 12, visits: 240 },
  { name: '周五', leads: 8, visits: 190 },
  { name: '周六', leads: 3, visits: 80 },
  { name: '周日', leads: 2, visits: 60 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">运营控制中心</h2>
          <p className="text-slate-500 text-sm">VertaX 工业智理引擎实时跨境运营概览。</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            系统在线
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">最后同步: 2 分钟前</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '活跃商机', value: '42', change: '+12%', sub: '过去7天' },
          { label: 'SEO/GEO 评分', value: '88/100', change: '+5%', sub: '全球数字化足迹' },
          { label: 'RAG 智库容量', value: '1.2GB', change: '已同步', sub: '知识节点: 154' },
          { label: '社媒影响力', value: '12.4k', change: '+1.2k', sub: '总互动量' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-xs text-green-600 font-medium">{stat.change}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            商机获取与流量趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line name="活跃商机" type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line name="访问流量" type="monotone" dataKey="visits" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">最新系统动态</h3>
          <div className="space-y-4">
            {[
              { type: 'AI', msg: '完成 "液压泵 X 系列" 资料结构化', time: '10分钟前' },
              { type: 'SEO', msg: '发布白皮书: 工业物联网最新趋势', time: '1小时前' },
              { type: '拓客', msg: '启动欧洲市场 AI 扫街任务', time: '3小时前' },
              { type: '社媒', msg: '完成 Facebook/X 平台 5 条自动发帖', time: '5小时前' },
              { type: '系统', msg: '建立 SalesFront 营销节点连接', time: '昨天' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                  {activity.type}
                </span>
                <div className="flex-1">
                  <p className="text-xs text-slate-700 leading-tight">{activity.msg}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            查看详细审计日志 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
