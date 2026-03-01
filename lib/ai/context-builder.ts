import { Product } from '../../models/Product';
import { LeadRun } from '../../models/LeadRun';
import { Company } from '../../models/Company';
import { ContentAsset } from '../../models/ContentAsset';
import { SocialPost } from '../../models/SocialPost';
import { SocialAccount } from '../../models/SocialAccount';

interface ContextOptions {
  role: 'BOSS' | 'STAFF';
  currentPage?: string;
}

/**
 * 聚合业务数据，生成 Markdown 格式的 AI 上下文摘要（~2500 tokens）
 */
export async function buildAIContext(options: ContextOptions): Promise<string> {
  const { currentPage } = options;

  // 并行查询所有数据源
  const [
    products,
    leadRuns,
    topCompanies,
    contentStats,
    postStats,
    activeAccounts,
  ] = await Promise.all([
    Product.find().lean(),
    LeadRun.find().sort({ createdAt: -1 }).lean(),
    Company.find({ 'score.tier': { $in: ['Tier A (Critical Pain)', 'Tier B (Active Change)'] } })
      .sort({ 'score.total': -1 })
      .limit(20)
      .lean(),
    ContentAsset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SocialPost.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SocialAccount.find({ status: 'active' }).lean(),
  ]);

  const sections: string[] = [];

  // === 产品与 ICP ===
  sections.push(buildProductSection(products, currentPage === 'knowledge-engine'));

  // === 获客任务 ===
  sections.push(buildLeadRunSection(leadRuns, currentPage === 'ai-prospecting'));

  // === 高价值公司 ===
  sections.push(buildCompanySection(topCompanies, currentPage === 'ai-prospecting'));

  // === 内容管线 ===
  sections.push(buildContentSection(contentStats, currentPage === 'marketing-drive'));

  // === 社媒渠道 ===
  sections.push(buildSocialSection(postStats, activeAccounts, currentPage === 'social-presence'));

  return sections.filter(Boolean).join('\n\n');
}

function buildProductSection(products: any[], expanded: boolean): string {
  if (products.length === 0) return '## 产品\n暂无产品数据。';

  let lines = [`## 产品 (${products.length}个)`];

  for (const p of products) {
    const countries = p.targetCountries?.length ? p.targetCountries.join('/') : '未设置';
    const industries = p.applicationIndustries?.length ? p.applicationIndustries.join(', ') : '';
    const icpStatus = p.icpProfile?.industryTags?.length ? 'ICP已配置' : 'ICP待完善';
    lines.push(`- **${p.name}** (${p.productType || '未分类'}) 目标市场:${countries} [${icpStatus}]`);
    if (industries) lines.push(`  应用行业: ${industries}`);

    // 在知识引擎页面展开 ICP 细节
    if (expanded && p.icpProfile) {
      const icp = p.icpProfile;
      if (icp.targetCustomerTypes?.length) {
        lines.push(`  目标客户类型: ${icp.targetCustomerTypes.join(', ')}`);
      }
      if (icp.targetTitles?.length) {
        lines.push(`  决策人职位: ${icp.targetTitles.join(', ')}`);
      }
      if (icp.signalPack) {
        const signals = [];
        if (icp.signalPack.regulation?.length) signals.push(`法规(${icp.signalPack.regulation.length})`);
        if (icp.signalPack.hiring?.length) signals.push(`招聘(${icp.signalPack.hiring.length})`);
        if (icp.signalPack.expansion?.length) signals.push(`扩张(${icp.signalPack.expansion.length})`);
        if (icp.signalPack.automation?.length) signals.push(`自动化(${icp.signalPack.automation.length})`);
        if (signals.length) lines.push(`  信号包: ${signals.join(', ')}`);
      }
      if (icp.disqualifiers?.length) {
        lines.push(`  排除条件: ${icp.disqualifiers.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}

function buildLeadRunSection(runs: any[], expanded: boolean): string {
  if (runs.length === 0) return '## 获客任务\n暂无获客任务。';

  const running = runs.filter(r => r.status === 'running');
  const done = runs.filter(r => r.status === 'done');
  const failed = runs.filter(r => r.status === 'failed');

  let lines = [`## 获客任务 (共${runs.length}次)`];
  lines.push(`运行中: ${running.length} | 已完成: ${done.length} | 失败: ${failed.length}`);

  // 运行中的任务详情
  for (const r of running) {
    const progress = r.progress?.total ?? 0;
    const stage = r.progress?.currentStage || '未知';
    const country = r.progress?.currentCountry || r.country || '';
    lines.push(`- [运行中] ${r.productName} → 进度${progress}% 阶段:${stage}${country ? ' 当前:' + country : ''}`);

    if (expanded && r.countries?.length) {
      const countryDetails = r.countries
        .filter((c: any) => c.status !== 'pending')
        .map((c: any) => `${c.countryNameCN}(${c.status}, ${c.companiesFound}家)`)
        .join(', ');
      if (countryDetails) lines.push(`  各国进度: ${countryDetails}`);
    }
  }

  // 最近完成的任务（最多3个）
  for (const r of done.slice(0, 3)) {
    const totalFound = r.countries?.reduce((sum: number, c: any) => sum + (c.companiesFound || 0), 0) || 0;
    lines.push(`- [已完成] ${r.productName} → 发现${totalFound}家公司`);
  }

  return lines.join('\n');
}

function buildCompanySection(companies: any[], expanded: boolean): string {
  if (companies.length === 0) return '## 高价值线索\n暂无评分线索。';

  const tierA = companies.filter(c => c.score?.tier === 'Tier A (Critical Pain)');
  const tierB = companies.filter(c => c.score?.tier === 'Tier B (Active Change)');

  let lines = [`## 高价值线索 (Tier A: ${tierA.length}家, Tier B: ${tierB.length}家)`];

  const formatCompany = (c: any, detailed: boolean) => {
    const score = c.score?.total ?? 0;
    const tierShort = c.score?.tier?.includes('Tier A') ? 'A' : 'B';
    let line = `- ${c.name} (${c.country}, ${c.industry || '未知行业'}) [${score}分, Tier ${tierShort}]`;

    // 附加顶级信号
    const topSignal = c.research?.signals?.[0];
    if (topSignal) {
      const signalLabel = topSignal.type === 'tender' ? '招标' :
        topSignal.type === 'expansion' ? '扩张' :
        topSignal.type === 'hiring' ? '招聘' :
        topSignal.type === 'automation' ? '自动化' :
        topSignal.type === 'regulation' ? '法规' : topSignal.type;
      line += ` 信号:${signalLabel}`;
      if (topSignal.evidence?.snippet) {
        line += ` "${topSignal.evidence.snippet.substring(0, 40)}"`;
      }
    }
    lines.push(line);

    if (detailed && expanded) {
      if (c.research?.keyHooks?.length) {
        lines.push(`  切入点: ${c.research.keyHooks.slice(0, 3).join('; ')}`);
      }
      if (c.status) {
        lines.push(`  状态: ${c.status}`);
      }
      if (c.contacts?.length) {
        const topContact = c.contacts[0];
        lines.push(`  联系人: ${topContact.name || '未知'} (${topContact.title})`);
      }
    }
  };

  if (tierA.length > 0) {
    lines.push('### Tier A (关键痛点)');
    tierA.forEach(c => formatCompany(c, true));
  }
  if (tierB.length > 0) {
    lines.push('### Tier B (积极变化)');
    tierB.slice(0, 10).forEach(c => formatCompany(c, false));
  }

  return lines.join('\n');
}

function buildContentSection(stats: any[], expanded: boolean): string {
  const statusMap: Record<string, number> = {};
  for (const s of stats) {
    if (s._id) statusMap[s._id] = s.count;
  }
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
  if (total === 0) return '## 内容管线\n暂无内容资产。';

  let lines = [`## 内容管线 (共${total}篇)`];
  lines.push(`草稿: ${statusMap['draft'] || 0} | 已优化: ${statusMap['optimized'] || 0} | 已发布: ${statusMap['published'] || 0} | 已归档: ${statusMap['archived'] || 0}`);

  if (expanded) {
    // 在营销引擎页面查询最近的内容标题
    try {
      // 注意：这里是同步构建，expanded 为 true 时我们已有足够信息
      lines.push('(切换到营销引擎页面可查看详细内容列表)');
    } catch {
      // 忽略
    }
  }

  return lines.join('\n');
}

function buildSocialSection(postStats: any[], accounts: any[], expanded: boolean): string {
  const postMap: Record<string, number> = {};
  for (const s of postStats) {
    if (s._id) postMap[s._id] = s.count;
  }
  const totalPosts = Object.values(postMap).reduce((a, b) => a + b, 0);

  let lines = ['## 社媒渠道'];

  // 账号
  if (accounts.length === 0) {
    lines.push('已连接账号: 无');
  } else {
    const platforms = accounts.map(a => `${a.platform}(@${a.accountHandle})`).join(', ');
    lines.push(`已连接账号: ${platforms}`);
  }

  // 帖子统计
  if (totalPosts > 0) {
    lines.push(`帖子统计 — 草稿: ${postMap['draft'] || 0} | 已排期: ${postMap['scheduled'] || 0} | 已发布: ${postMap['published'] || 0}`);
  } else {
    lines.push('帖子: 暂无');
  }

  if (expanded && accounts.length > 0) {
    for (const a of accounts) {
      lines.push(`- ${a.platform}: ${a.accountName} (粉丝: ${a.followersCount ?? '未知'})`);
    }
  }

  return lines.join('\n');
}
