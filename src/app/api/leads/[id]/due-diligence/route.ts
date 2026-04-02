import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { gatherDueDiligence } from '@/lib/due-diligence'

// 获取背调报告
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params

    // 检查用户是否有权限访问该 lead
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 获取背调报告
    const dueDiligence = await prisma.leadDueDiligence.findUnique({
      where: { leadId }
    })

    if (!dueDiligence) {
      return NextResponse.json({ error: 'Due diligence not found' }, { status: 404 })
    }

    return NextResponse.json(dueDiligence)
  } catch (error) {
    console.error('Error fetching due diligence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due diligence' },
      { status: 500 }
    )
  }
}

// 创建背调任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params

    // 检查用户是否有权限访问该 lead
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspace: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        workspace: true
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 检查是否已有进行中的背调
    const existingDueDiligence = await prisma.leadDueDiligence.findUnique({
      where: { leadId }
    })

    if (existingDueDiligence) {
      if (existingDueDiligence.status === 'PROCESSING') {
        return NextResponse.json(
          { error: 'Due diligence already in progress' },
          { status: 400 }
        )
      }
      if (existingDueDiligence.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Due diligence already completed', data: existingDueDiligence },
          { status: 400 }
        )
      }
    }

    // 检查用户 credits
    const userQuota = await prisma.userQuota.findUnique({
      where: { userId: user.id }
    })

    const CREDIT_COST = 40

    if (!userQuota || userQuota.usedCompanies + CREDIT_COST > getQuotaLimit(userQuota.plan)) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: CREDIT_COST },
        { status: 403 }
      )
    }

    // 创建背调记录
    const dueDiligence = await prisma.leadDueDiligence.create({
      data: {
        leadId,
        workspaceId: lead.workspaceId,
        status: 'PENDING',
        creditsUsed: CREDIT_COST
      }
    })

    // 扣除 credits
    await prisma.userQuota.update({
      where: { userId: user.id },
      data: {
        usedCompanies: { increment: CREDIT_COST }
      }
    })

    // 触发异步背调任务
    setTimeout(() => {
      processDueDiligence(leadId).catch(console.error)
    }, 100)

    return NextResponse.json({
      success: true,
      data: dueDiligence,
      message: 'Due diligence started. This may take 2-5 minutes.'
    })
  } catch (error) {
    console.error('Error starting due diligence:', error)
    return NextResponse.json(
      { error: 'Failed to start due diligence' },
      { status: 500 }
    )
  }
}

// 辅助函数：获取配额限制
function getQuotaLimit(plan: string): number {
  const limits: Record<string, number> = {
    'STARTER': 100,
    'PRO': 500,
    'BUSINESS': 2000,
    'ENTERPRISE': 10000
  }
  return limits[plan] || 100
}

// 异步处理背调
async function processDueDiligence(leadId: string) {
  try {
    // 更新状态为处理中
    await prisma.leadDueDiligence.update({
      where: { leadId },
      data: { status: 'PROCESSING' }
    })

    // 获取 lead 信息
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      throw new Error('Lead not found')
    }

    // 调用外部 API 收集数据
    const dueDiligenceData = await gatherDueDiligence(
      lead.companyName,
      lead.domain || undefined
    )

    // 更新背调结果
    await prisma.leadDueDiligence.update({
      where: { leadId },
      data: {
        companyLegalName: dueDiligenceData.companyLegalName,
        foundedYear: dueDiligenceData.foundedYear,
        headquarters: dueDiligenceData.headquarters,
        employeeCount: dueDiligenceData.employeeCount,
        employeeCountSource: dueDiligenceData.employeeCountSource,
        estimatedRevenue: dueDiligenceData.estimatedRevenue,
        totalFunding: dueDiligenceData.totalFunding,
        latestFundingRound: dueDiligenceData.latestFundingRound,
        latestFundingDate: dueDiligenceData.latestFundingDate,
        latestFundingAmount: dueDiligenceData.latestFundingAmount,
        investors: dueDiligenceData.investors ? JSON.stringify(dueDiligenceData.investors) : null,
        valuation: dueDiligenceData.valuation,
        businessModel: dueDiligenceData.businessModel,
        targetMarket: dueDiligenceData.targetMarket,
        keyProducts: dueDiligenceData.keyProducts ? JSON.stringify(dueDiligenceData.keyProducts) : null,
        recentNews: dueDiligenceData.recentNews ? JSON.stringify(dueDiligenceData.recentNews) : null,
        socialMediaPresence: dueDiligenceData.socialMediaPresence ? JSON.stringify(dueDiligenceData.socialMediaPresence) : null,
        executiveSummary: dueDiligenceData.executiveSummary,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error processing due diligence:', error)
    await prisma.leadDueDiligence.update({
      where: { leadId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
