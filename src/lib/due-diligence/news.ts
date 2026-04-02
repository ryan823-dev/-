// News API Integration
// Using Google News API or NewsAPI

const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_BASE_URL = 'https://newsapi.org/v2'

interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    name: string
  }
}

export async function searchCompanyNews(
  companyName: string,
  days: number = 180
): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn('News API key not configured')
    return []
  }

  try {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    
    const response = await fetch(
      `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(companyName)}&from=${fromDate.toISOString().split('T')[0]}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${NEWS_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('News API error:', response.status)
      return []
    }

    const data = await response.json()
    
    return data.articles?.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: {
        name: article.source?.name || 'Unknown',
      },
    })) || []
  } catch (error) {
    console.error('News search error:', error)
    return []
  }
}

export async function searchFundingNews(
  companyName: string
): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) return []

  try {
    const query = `${companyName} funding OR ${companyName} investment OR ${companyName} raised`
    const response = await fetch(
      `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    
    return data.articles?.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: {
        name: article.source?.name || 'Unknown',
      },
    })) || []
  } catch (error) {
    console.error('Funding news error:', error)
    return []
  }
}

export function summarizeNews(articles: NewsArticle[]): string {
  if (articles.length === 0) return ''
  
  const latest = articles[0]
  return `${latest.title}. ${latest.description || ''}`.substring(0, 200) + '...'
}
