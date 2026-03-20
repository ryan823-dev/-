/**
 * 数据验证服务
 * 
 * 用于验证从各数据源获取的数据，特别是：
 * 1. AI 推断数据的交叉验证
 * 2. 数据完整性检查
 * 3. 数据质量评分
 */

import type { NormalizedCandidate, SourceReliability } from '@/lib/radar/adapters/types';
import { fetchWebContent } from '@/lib/services/web-scraper';

// ==================== 类型定义 ====================

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  issues: ValidationIssue[];
  suggestions?: string[];
  crossValidation?: CrossValidationResult;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface CrossValidationResult {
  matched: boolean;
  matchScore: number; // 0-1
  discrepancies: string[];
  verifiedFields: string[];
}

// ==================== 主验证函数 ====================

/**
 * 验证候选数据
 */
export async function validateCandidate(
  candidate: NormalizedCandidate,
  reliability?: SourceReliability
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let confidence = 1.0;

  // 1. 基本完整性检查
  const completenessResult = checkCompleteness(candidate);
  issues.push(...completenessResult.issues);
  confidence *= completenessResult.factor;

  // 2. 数据格式验证
  const formatResult = validateFormats(candidate);
  issues.push(...formatResult.issues);
  confidence *= formatResult.factor;

  // 3. 根据数据源类型调整置信度
  if (reliability) {
    confidence *= getReliabilityFactor(reliability);
  }

  // 4. 逻辑一致性检查
  const logicResult = checkLogicalConsistency(candidate);
  issues.push(...logicResult.issues);
  confidence *= logicResult.factor;

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    confidence: Math.max(0, Math.min(1, confidence)),
    issues,
    suggestions: generateSuggestions(issues),
  };
}

/**
 * 交叉验证：将候选数据与原始网页对比
 */
export async function crossValidateWithSource(
  candidate: NormalizedCandidate,
  sourceUrl: string
): Promise<CrossValidationResult> {
  const discrepancies: string[] = [];
  const verifiedFields: string[] = [];
  let matchScore = 0;

  try {
    const content = await fetchWebContent(sourceUrl);

    if (!content.success) {
      return {
        matched: false,
        matchScore: 0,
        discrepancies: ['无法获取源网页内容'],
        verifiedFields: [],
      };
    }

    const pageContent = content.content.toLowerCase();
    const pageTitle = content.title.toLowerCase();

    // 验证标题
    if (candidate.displayName) {
      const titleWords = candidate.displayName.toLowerCase().split(/\s+/);
      const matchedWords = titleWords.filter(w => w.length > 3 && pageTitle.includes(w));
      if (matchedWords.length >= titleWords.filter(w => w.length > 3).length * 0.5) {
        verifiedFields.push('displayName');
        matchScore += 0.2;
      } else {
        discrepancies.push(`标题不匹配: "${candidate.displayName}"`);
      }
    }

    // 验证描述
    if (candidate.description) {
      const descWords = candidate.description.toLowerCase().slice(0, 100).split(/\s+/);
      const matchedWords = descWords.filter(w => w.length > 3 && pageContent.includes(w));
      if (matchedWords.length >= 3) {
        verifiedFields.push('description');
        matchScore += 0.2;
      } else {
        discrepancies.push('描述内容未在页面中找到');
      }
    }

    // 验证公司/买方名称
    if (candidate.buyerName) {
      if (pageContent.includes(candidate.buyerName.toLowerCase())) {
        verifiedFields.push('buyerName');
        matchScore += 0.2;
      } else {
        discrepancies.push(`买方名称未找到: "${candidate.buyerName}"`);
      }
    }

    // 验证联系方式
    if (candidate.contactEmail || candidate.email) {
      const email = candidate.contactEmail || candidate.email;
      if (pageContent.includes(email!.toLowerCase())) {
        verifiedFields.push('email');
        matchScore += 0.2;
      }
    }

    if (candidate.phone) {
      // 提取数字进行比较
      const phoneDigits = candidate.phone.replace(/\D/g, '');
      const pageDigits = pageContent.replace(/\D/g, '');
      if (phoneDigits.length >= 7 && pageDigits.includes(phoneDigits)) {
        verifiedFields.push('phone');
        matchScore += 0.1;
      }
    }

    // 验证国家
    if (candidate.country || candidate.buyerCountry) {
      const country = candidate.country || candidate.buyerCountry;
      if (pageContent.includes(country!.toLowerCase())) {
        verifiedFields.push('country');
        matchScore += 0.1;
      }
    }

    return {
      matched: matchScore >= 0.3,
      matchScore: Math.min(1, matchScore),
      discrepancies,
      verifiedFields,
    };
  } catch (error) {
    return {
      matched: false,
      matchScore: 0,
      discrepancies: [`验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`],
      verifiedFields: [],
    };
  }
}

/**
 * 批量验证候选
 */
export async function validateCandidates(
  candidates: NormalizedCandidate[],
  options: {
    reliabilityMap?: Record<string, SourceReliability>;
    crossValidate?: boolean;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<Map<string, ValidationResult & { crossValidation?: CrossValidationResult }>> {
  const results = new Map<string, ValidationResult & { crossValidation?: CrossValidationResult }>();

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const reliability = options.reliabilityMap?.[candidate.externalId];

    const validation = await validateCandidate(candidate, reliability);

    // 可选：交叉验证
    if (options.crossValidate && candidate.sourceUrl) {
      validation.crossValidation = await crossValidateWithSource(candidate, candidate.sourceUrl);
    }

    results.set(candidate.externalId, validation);

    if (options.onProgress) {
      options.onProgress(i + 1, candidates.length);
    }

    // 限速
    if (options.crossValidate && i < candidates.length - 1) {
      await sleep(500);
    }
  }

  return results;
}

// ==================== 辅助函数 ====================

function checkCompleteness(candidate: NormalizedCandidate): { issues: ValidationIssue[]; factor: number } {
  const issues: ValidationIssue[] = [];
  let factor = 1.0;

  // 必须字段检查
  if (!candidate.externalId) {
    issues.push({ field: 'externalId', severity: 'error', message: '缺少外部ID' });
    factor *= 0.5;
  }

  if (!candidate.displayName) {
    issues.push({ field: 'displayName', severity: 'error', message: '缺少显示名称' });
    factor *= 0.7;
  }

  if (!candidate.sourceUrl) {
    issues.push({ field: 'sourceUrl', severity: 'warning', message: '缺少来源URL' });
    factor *= 0.9;
  }

  // 类型特定检查
  if (candidate.candidateType === 'OPPORTUNITY') {
    if (!candidate.deadline) {
      issues.push({ field: 'deadline', severity: 'warning', message: '招标缺少截止日期' });
      factor *= 0.9;
    }
    if (!candidate.buyerName) {
      issues.push({ field: 'buyerName', severity: 'warning', message: '招标缺少买方名称' });
      factor *= 0.9;
    }
  }

  if (candidate.candidateType === 'COMPANY') {
    if (!candidate.website && !candidate.email) {
      issues.push({ field: 'contact', severity: 'warning', message: '公司缺少联系方式' });
      factor *= 0.9;
    }
  }

  return { issues, factor };
}

function validateFormats(candidate: NormalizedCandidate): { issues: ValidationIssue[]; factor: number } {
  const issues: ValidationIssue[] = [];
  let factor = 1.0;

  // URL 格式验证
  if (candidate.sourceUrl) {
    try {
      new URL(candidate.sourceUrl);
    } catch {
      issues.push({ field: 'sourceUrl', severity: 'error', message: '无效的URL格式' });
      factor *= 0.8;
    }
  }

  if (candidate.website) {
    try {
      new URL(candidate.website);
    } catch {
      issues.push({ field: 'website', severity: 'warning', message: '无效的网站URL格式' });
      factor *= 0.95;
    }
  }

  // 邮箱格式验证
  const email = candidate.email || candidate.contactEmail;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push({ field: 'email', severity: 'warning', message: '无效的邮箱格式' });
      factor *= 0.95;
    }
  }

  // 日期验证
  if (candidate.deadline) {
    const deadline = new Date(candidate.deadline);
    if (isNaN(deadline.getTime())) {
      issues.push({ field: 'deadline', severity: 'error', message: '无效的截止日期' });
      factor *= 0.9;
    } else if (deadline < new Date()) {
      issues.push({ field: 'deadline', severity: 'info', message: '截止日期已过' });
    }
  }

  if (candidate.publishedAt) {
    const published = new Date(candidate.publishedAt);
    if (isNaN(published.getTime())) {
      issues.push({ field: 'publishedAt', severity: 'warning', message: '无效的发布日期' });
      factor *= 0.95;
    }
  }

  // 金额验证
  if (candidate.estimatedValue !== undefined) {
    if (candidate.estimatedValue < 0) {
      issues.push({ field: 'estimatedValue', severity: 'error', message: '金额不能为负数' });
      factor *= 0.9;
    }
    if (candidate.estimatedValue > 1e12) {
      issues.push({ field: 'estimatedValue', severity: 'warning', message: '金额异常大，请核实' });
      factor *= 0.95;
    }
  }

  return { issues, factor };
}

function checkLogicalConsistency(candidate: NormalizedCandidate): { issues: ValidationIssue[]; factor: number } {
  const issues: ValidationIssue[] = [];
  let factor = 1.0;

  // 发布日期不能晚于截止日期
  if (candidate.publishedAt && candidate.deadline) {
    const published = new Date(candidate.publishedAt);
    const deadline = new Date(candidate.deadline);
    if (published > deadline) {
      issues.push({ field: 'dates', severity: 'error', message: '发布日期晚于截止日期' });
      factor *= 0.8;
    }
  }

  // 公司类型检查
  if (candidate.buyerType === 'international_org' && !candidate.buyerName?.toLowerCase().includes('un')) {
    // 国际组织通常名称中包含 UN、World Bank 等
    const knownIntlOrgs = ['un', 'world bank', 'imf', 'who', 'unesco', 'unicef', 'undp'];
    const isKnown = knownIntlOrgs.some(org => candidate.buyerName?.toLowerCase().includes(org));
    if (!isKnown) {
      issues.push({ field: 'buyerType', severity: 'info', message: '国际组织类型可能不准确' });
      factor *= 0.95;
    }
  }

  return { issues, factor };
}

function getReliabilityFactor(reliability: SourceReliability): number {
  switch (reliability.qualityLevel) {
    case 'HIGH':
      return 1.0;
    case 'MEDIUM':
      return 0.8;
    case 'LOW':
      return 0.6;
    case 'UNSTABLE':
      return 0.4;
    default:
      return 0.7;
  }
}

function generateSuggestions(issues: ValidationIssue[]): string[] {
  const suggestions: string[] = [];

  const errorFields = issues.filter(i => i.severity === 'error').map(i => i.field);
  const warningFields = issues.filter(i => i.severity === 'warning').map(i => i.field);

  if (errorFields.length > 0) {
    suggestions.push(`建议人工核实以下字段: ${errorFields.join(', ')}`);
  }

  if (warningFields.length > 2) {
    suggestions.push('数据完整性较低，建议补充更多信息');
  }

  if (issues.some(i => i.message.includes('AI'))) {
    suggestions.push('此数据由AI推断，建议通过官方渠道验证');
  }

  return suggestions;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 导出 ====================

export default {
  validateCandidate,
  crossValidateWithSource,
  validateCandidates,
};