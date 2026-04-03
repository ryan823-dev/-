'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateCSVString, CSVColumn } from '@/lib/utils/csv-export';

/**
 * 导出线索库为 CSV
 * 
 * 包含：基本信息、联系人、AI 背调简报、外联建议
 */
export async function exportProspectsToCSV() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized');
  }

  // 1. 获取所有线索及关联联系人
  const prospects = await db.prospectCompany.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    include: {
      contacts: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (prospects.length === 0) {
    return { success: false, error: '没有可导出的线索' };
  }

  // 2. 定义 CSV 列
  const columns: CSVColumn<any>[] = [
    { header: '公司名称', key: 'name' },
    { header: '官网', key: 'website' },
    { header: '国家', key: 'country' },
    { header: '城市', key: 'city' },
    { header: '行业', key: 'industry' },
    { header: '规模', key: 'companySize' },
    { header: '层级', key: 'tier' },
    { header: '状态', key: 'status' },
    { 
      header: '联系人信息', 
      key: 'contacts',
      transform: (contacts: any[]) => {
        if (!contacts || contacts.length === 0) return '无';
        return contacts.map(c => `${c.name} (${c.role || '未知'}): ${c.email || '无邮箱'} | ${c.phone || '无电话'}`).join(' ; ');
      }
    },
    {
      header: 'AI 背调摘要',
      key: 'aiDossier',
      transform: (dossier: any) => {
        if (!dossier || !dossier.dossier) return '待生成';
        return dossier.dossier.companyOverview?.summary || '无摘要';
      }
    },
    {
      header: '外联建议 (首封邮件)',
      key: 'outreachArtifacts',
      transform: (artifacts: any) => {
        if (!artifacts || !artifacts.outreachPack) return '待生成';
        const pack = artifacts.outreachPack;
        if (pack.emails && pack.emails.length > 0) {
          return `主题: ${pack.emails[0].subject}\n\n${pack.emails[0].body}`;
        }
        return '无邮件模板';
      }
    },
    {
      header: '创建时间',
      key: 'createdAt',
      transform: (val: Date) => val.toISOString().split('T')[0]
    }
  ];

  // 3. 生成 CSV 字符串
  const csvContent = generateCSVString(prospects, columns);
  
  return { 
    success: true, 
    csvContent,
    filename: `Vertax_Prospects_${new Date().toISOString().split('T')[0]}.csv`
  };
}
