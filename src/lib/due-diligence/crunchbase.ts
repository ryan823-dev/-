// Crunchbase API Integration
// API Docs: https://data.crunchbase.com/docs

const CRUNCHBASE_API_KEY = process.env.CRUNCHBASE_API_KEY
const CRUNCHBASE_BASE_URL = 'https://api.crunchbase.com/api/v4'

interface CrunchbaseOrganization {
  uuid: string
  name: string
  permalink: string
  website_url?: string
  founded_on?: { year: number; month?: number; day?: number }
  num_employees_enum?: string
  headquarters?: {
    city: string
    region: string
    country: string
  }
  short_description?: string
  funding_total?: { value_usd: number }
  funding_rounds?: Array<{
    uuid: string
    name: string
    announced_on?: { year: number; month: number; day: number }
    money_raised?: { value_usd: number }
    investment_type?: string
  }>
  investors?: Array<{
    uuid: string
    name: string
    type: string
  }>
}

export async function searchOrganization(domain: string): Promise<CrunchbaseOrganization | null> {
  if (!CRUNCHBASE_API_KEY) {
    console.warn('Crunchbase API key not configured')
    return null
  }

  try {
    // Search by domain
    const response = await fetch(
      `${CRUNCHBASE_BASE_URL}/entities/organizations?field_ids=funding_total,headquarters,founded_on,num_employees_enum,short_description&limit=1`,
      {
        headers: {
          'X-cb-user-key': CRUNCHBASE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Crunchbase API error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    
    // Find organization by domain match
    const org = data.entities?.find((e: any) => 
      e.properties?.website_url?.includes(domain) || 
      e.properties?.permalink === domain.replace(/\./g, '-')
    )

    if (!org) return null

    return {
      uuid: org.uuid,
      name: org.properties.name,
      permalink: org.properties.permalink,
      website_url: org.properties.website_url,
      founded_on: org.properties.founded_on,
      num_employees_enum: org.properties.num_employees_enum,
      headquarters: org.properties.headquarters,
      short_description: org.properties.short_description,
      funding_total: org.properties.funding_total,
    }
  } catch (error) {
    console.error('Crunchbase search error:', error)
    return null
  }
}

export async function getOrganizationDetails(permalink: string): Promise<Partial<CrunchbaseOrganization> | null> {
  if (!CRUNCHBASE_API_KEY) return null

  try {
    const response = await fetch(
      `${CRUNCHBASE_BASE_URL}/entities/organizations/${permalink}?field_ids=funding_rounds,investors`,
      {
        headers: {
          'X-cb-user-key': CRUNCHBASE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Crunchbase details error:', response.status)
      return null
    }

    const data = await response.json()
    
    return {
      funding_rounds: data.properties?.funding_rounds?.map((r: any) => ({
        uuid: r.uuid,
        name: r.name,
        announced_on: r.properties?.announced_on,
        money_raised: r.properties?.money_raised,
        investment_type: r.properties?.investment_type,
      })),
      investors: data.properties?.investors?.map((i: any) => ({
        uuid: i.uuid,
        name: i.properties?.name,
        type: i.properties?.type,
      })),
    }
  } catch (error) {
    console.error('Crunchbase details error:', error)
    return null
  }
}

export function formatFundingAmount(valueUsd: number): string {
  if (valueUsd >= 1000000000) {
    return `$${(valueUsd / 1000000000).toFixed(1)}B`
  } else if (valueUsd >= 1000000) {
    return `$${(valueUsd / 1000000).toFixed(1)}M`
  } else if (valueUsd >= 1000) {
    return `$${(valueUsd / 1000).toFixed(1)}K`
  }
  return `$${valueUsd}`
}

export function parseEmployeeCount(enumValue: string): number | null {
  const ranges: Record<string, number> = {
    'c_00001_00010': 5,
    'c_00011_00050': 30,
    'c_00051_00100': 75,
    'c_00101_00250': 175,
    'c_00251_00500': 375,
    'c_00501_001000': 750,
    'c_001001_005000': 3000,
    'c_005001_010000': 7500,
    'c_010001_': 10000,
  }
  return ranges[enumValue] || null
}
