// Due Diligence Data Aggregator
// Combines data from multiple sources

import { searchOrganization, getOrganizationDetails, formatFundingAmount, parseEmployeeCount } from './crunchbase'
import { getCompanyByDomain, getEmployeeCount, formatCompanySize } from './linkedin'
import { searchCompanyNews, searchFundingNews } from './news'

export interface DueDiligenceData {
  // Basic Info
  companyLegalName?: string
  foundedYear?: number
  headquarters?: string
  legalEntityType?: string
  
  // Scale
  employeeCount?: number
  employeeCountSource?: string
  estimatedRevenue?: string
  
  // Funding
  totalFunding?: string
  latestFundingRound?: string
  latestFundingDate?: Date
  latestFundingAmount?: string
  investors?: Array<{ name: string; type: string; amount?: string }>
  valuation?: string
  
  // Business
  businessModel?: string
  targetMarket?: string
  keyProducts?: string[]
  competitiveAdvantage?: string
  
  // News
  recentNews?: Array<{
    title: string
    source: string
    date: string
    summary?: string
  }>
  
  // Competition
  keyCompetitors?: string[]
  
  // Digital Presence
  websiteTraffic?: string
  socialMediaPresence?: {
    linkedin?: string
    twitter?: string
  }
  
  // Summary
  executiveSummary?: string
}

export async function gatherDueDiligence(
  companyName: string,
  domain?: string
): Promise<DueDiligenceData> {
  const result: DueDiligenceData = {}
  
  // Parallel data fetching
  const [crunchbaseOrg, linkedinCompany, newsArticles, fundingNews] = await Promise.all([
    domain ? searchOrganization(domain) : Promise.resolve(null),
    domain ? getCompanyByDomain(domain) : Promise.resolve(null),
    searchCompanyNews(companyName),
    searchFundingNews(companyName),
  ])
  
  // Get additional Crunchbase details if found
  let crunchbaseDetails = null
  if (crunchbaseOrg?.permalink) {
    crunchbaseDetails = await getOrganizationDetails(crunchbaseOrg.permalink)
  }
  
  // Get LinkedIn employee count if found
  let linkedInEmployeeCount: number | null = null
  if (linkedinCompany?.id) {
    linkedInEmployeeCount = await getEmployeeCount(linkedinCompany.id)
  }
  
  // Combine data sources
  
  // Basic Info
  result.companyLegalName = crunchbaseOrg?.name || linkedinCompany?.name || companyName
  result.foundedYear = crunchbaseOrg?.founded_on?.year || linkedinCompany?.foundedOn?.year
  
  // Headquarters
  if (crunchbaseOrg?.headquarters) {
    const hq = crunchbaseOrg.headquarters
    result.headquarters = [hq.city, hq.region, hq.country].filter(Boolean).join(', ')
  } else if (linkedinCompany?.headquarters) {
    const hq = linkedinCompany.headquarters
    result.headquarters = [hq.city, hq.geographicArea, hq.country].filter(Boolean).join(', ')
  }
  
  // Employee Count
  if (linkedInEmployeeCount) {
    result.employeeCount = linkedInEmployeeCount
    result.employeeCountSource = 'LinkedIn'
  } else if (crunchbaseOrg?.num_employees_enum) {
    result.employeeCount = parseEmployeeCount(crunchbaseOrg.num_employees_enum) || undefined
    result.employeeCountSource = 'Crunchbase'
  } else if (linkedinCompany?.companySize) {
    result.employeeCount = linkedinCompany.companySize.start
    result.employeeCountSource = 'LinkedIn'
  }
  
  // Funding
  if (crunchbaseOrg?.funding_total?.value_usd) {
    result.totalFunding = formatFundingAmount(crunchbaseOrg.funding_total.value_usd)
  }
  
  if (crunchbaseDetails?.funding_rounds && crunchbaseDetails.funding_rounds.length > 0) {
    const latestRound = crunchbaseDetails.funding_rounds[0]
    result.latestFundingRound = latestRound.investment_type || 'Unknown'
    result.latestFundingAmount = latestRound.money_raised?.value_usd 
      ? formatFundingAmount(latestRound.money_raised.value_usd)
      : undefined
    if (latestRound.announced_on) {
      result.latestFundingDate = new Date(
        latestRound.announced_on.year,
        (latestRound.announced_on.month || 1) - 1,
        latestRound.announced_on.day || 1
      )
    }
  }
  
  if (crunchbaseDetails?.investors) {
    result.investors = crunchbaseDetails.investors.map(i => ({
      name: i.name,
      type: i.type,
    }))
  }
  
  // Business Description
  result.businessModel = linkedinCompany?.description || crunchbaseOrg?.short_description
  result.targetMarket = linkedinCompany?.industry
  result.keyProducts = linkedinCompany?.specialities
  
  // News
  const allNews = [...newsArticles, ...fundingNews]
  if (allNews.length > 0) {
    result.recentNews = allNews.slice(0, 5).map(article => ({
      title: article.title,
      source: article.source.name,
      date: article.publishedAt,
      summary: article.description?.substring(0, 150) + '...',
    }))
  }
  
  // Social Media
  result.socialMediaPresence = {}
  if (linkedinCompany?.followerCount) {
    result.socialMediaPresence.linkedin = `${linkedinCompany.followerCount.toLocaleString()} followers`
  }
  
  // Generate Executive Summary
  result.executiveSummary = generateExecutiveSummary(result, companyName)
  
  return result
}

function generateExecutiveSummary(data: DueDiligenceData, companyName: string): string {
  const parts: string[] = []
  
  // Company intro
  parts.push(`${companyName}`)
  
  if (data.foundedYear) {
    const age = new Date().getFullYear() - data.foundedYear
    parts.push(`is a ${age}-year-old`)
  }
  
  if (data.employeeCount) {
    parts.push(`company with ${data.employeeCount.toLocaleString()} employees`)
  }
  
  if (data.headquarters) {
    parts.push(`based in ${data.headquarters}`)
  }
  
  parts.push('.')
  
  // Business
  if (data.businessModel) {
    parts.push(`The company ${data.businessModel.substring(0, 100)}...`)
  }
  
  // Funding
  if (data.totalFunding) {
    parts.push(`It has raised ${data.totalFunding} in funding`)
    if (data.latestFundingRound) {
      parts.push(`with the latest ${data.latestFundingRound} round`)
    }
    parts.push('.')
  }
  
  // Recent activity
  if (data.recentNews && data.recentNews.length > 0) {
    parts.push(`Recent news includes: ${data.recentNews[0].title}`)
  }
  
  return parts.join(' ')
}

// Export individual modules for direct use
export * from './crunchbase'
export * from './linkedin'
export * from './news'
