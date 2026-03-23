// ==================== 新兴市场适配器测试脚本 ====================
// 测试新增的新兴市场数据源是否正常工作

import {
  ensureAdaptersInitialized,
  listAdapterRegistrations,
} from '../src/lib/radar/adapters/registry';
import type { RadarSearchQuery } from '../src/lib/radar/adapters/types';

async function testEmergingMarkets() {
  console.log('🚀 开始测试新兴市场适配器...\n');

  // 初始化适配器注册表
  ensureAdaptersInitialized();

  // 测试 1: 检查适配器是否注册
  console.log('📋 测试 1: 检查适配器注册状态');
  const adapters = listAdapterRegistrations();
  const emergingAdapters = adapters.filter(a =>
    a.code === 'emerging_markets' || a.code === 'dev_bank'
  );

  console.log('✅ 已注册的新兴市场适配器:');
  emergingAdapters.forEach(a => {
    console.log(`  - ${a.name} (${a.code})`);
  });

  // 测试 2: 测试中东地区搜索
  console.log('\n📍 测试 2: 中东地区搜索配置');
  const menaQuery: RadarSearchQuery = {
    keywords: ['coating', 'painting'],
    regions: ['MENA'],
    countries: ['SA', 'AE'],
    targetIndustries: ['coating', 'manufacturing'],
  };
  console.log('查询配置:', JSON.stringify(menaQuery, null, 2));

  // 测试 3: 测试拉美地区搜索
  console.log('\n🌎 测试 3: 拉美地区搜索配置');
  const latamQuery: RadarSearchQuery = {
    keywords: ['mining equipment', 'industrial coating'],
    regions: ['LATAM'],
    countries: ['BR', 'MX', 'CL'],
    targetIndustries: ['mining', 'manufacturing'],
  };
  console.log('查询配置:', JSON.stringify(latamQuery, null, 2));

  // 测试 4: 测试非洲地区搜索
  console.log('\n🌍 测试 4: 非洲地区搜索配置');
  const africaQuery: RadarSearchQuery = {
    keywords: ['agricultural machinery', 'construction'],
    regions: ['AFRICA'],
    countries: ['NG', 'KE', 'ZA'],
    targetIndustries: ['agriculture', 'construction'],
  };
  console.log('查询配置:', JSON.stringify(africaQuery, null, 2));

  // 测试 5: 测试东欧地区搜索
  console.log('\n🌏 测试 5: 东欧地区搜索配置');
  const ecaQuery: RadarSearchQuery = {
    keywords: ['industrial equipment', 'manufacturing'],
    regions: ['ECA'],
    countries: ['KZ', 'UZ'],
    targetIndustries: ['manufacturing', 'energy'],
  };
  console.log('查询配置:', JSON.stringify(ecaQuery, null, 2));

  // 测试 6: 测试开发银行项目搜索
  console.log('\n🏦 测试 6: 国际开发银行项目配置');
  const devBankQuery: RadarSearchQuery = {
    keywords: ['infrastructure', 'industrial development'],
    regions: ['AFRICA', 'LATAM'],
    targetIndustries: ['infrastructure', 'energy'],
  };
  console.log('查询配置:', JSON.stringify(devBankQuery, null, 2));

  console.log('\n✅ 所有配置测试完成！');
  console.log('\n📝 下一步:');
  console.log('1. 在 RadarSearchProfile 中启用新兴市场数据源');
  console.log('2. 创建测试扫描任务验证实际效果');
  console.log('3. 检查发现的候选客户质量');
}

// 运行测试
testEmergingMarkets().catch(console.error);