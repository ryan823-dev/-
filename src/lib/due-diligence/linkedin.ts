// LinkedIn API Integration
// API Docs: https://docs.microsoft.com/en-us/linkedin/

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN

interface LinkedInCompany {
  id: string
  name: string
  description?: string
  industry?: string
  companySize?: {
    start: number
    end: number
  }
  headquarters?: {
    city?: string
    geographicArea?: string
    country?: string
  }
  websiteUrl?: string
  foundedOn?: {
    year?: number
  }
  followerCount?: number
  specialities?: string[]
}

interface LinkedInEmployeeCount {
  employeeCount: number
  linkedInEmployeeCount: number
}

export async function getCompanyByDomain(domain: string): Promise<LinkedInCompany | null> {
  if (!LINKEDIN_ACCESS_TOKEN) {
    console.warn('LinkedIn access token not configured')
    return null
  }

  try {
    // Search company by domain
    const response = await fetch(
      `https://api.linkedin.com/v2/companies?q=domainName&domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!response.ok) {
      console.error('LinkedIn API error:', response.status)
      return null
    }
   
    const data = await response.json()
    const company = data.elements?.[0]
    
    if (!company) return null

    return {
      id: company.id,
      name: company.localizedName,
      description: company.localizedDescription,
      industry: company.industry,
      companySize: company.companySize,
      headquarters: company.headquarters,
      websiteUrl: company.websiteUrl,
      foundedOn: company.foundedOn,
      followerCount: company.followerCount,
      specialities: company.specialities,
    }
  } catch (error) {
    console.error('LinkedIn company error:', error)
    return null
  }
}

export async function getEmployeeCount(companyId: string): Promise<number | null> {
  if (!LINKEDIN_ACCESS_TOKEN) return null

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/companies/${companyId}?projection=(employeeCount)`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.employeeCount?.employeeCount || null
  } catch (error) {
    console.error('LinkedIn employee count error:', error)
    return null
  }
}

export async function getCompanyPosts(companyId: string, count: number = 5): Promise<any[]> {
  if (!LINKEDIN_ACCESS_TOKEN) return []

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/posts?author=urn:li:organization:${companyId}&count=${count}`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.elements || []
  } catch (error) {
    console.error('LinkedIn posts error:', error)
    return []
  }
}

export function formatCompanySize(size?: { start: number; end: number }): string {
  if (!size) return 'Unknown'
  if (size.end) {
    return `${size.start}-${size.end} employees`
  }
  return `${size.start}+ employees`
}
