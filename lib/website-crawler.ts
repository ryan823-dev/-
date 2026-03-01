import * as cheerio from 'cheerio';

// --- Types ---

export type PageType = 'home' | 'about' | 'products' | 'contact' | 'other';

export interface CrawledPage {
  url: string;
  pageType: PageType;
  content: string;
  success: boolean;
}

export interface CrawlResult {
  pages: CrawledPage[];
  language: string;
  error?: string;
}

// --- Constants ---

const MAX_PAGES = 5;
const MAX_CONTENT_PER_PAGE = 4000;
const PAGE_TIMEOUT_MS = 5000;
const TOTAL_TIMEOUT_MS = 20000;
const REQUEST_DELAY_MS = 1000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// URL path patterns for page type detection (multi-language)
const PAGE_TYPE_PATTERNS: Record<PageType, RegExp> = {
  about: /\/(about|company|who-we-are|ueber-uns|uber-uns|a-propos|chi-siamo|sobre-nosotros|sobre|gioi-thieu|corporate|firm|profile)/i,
  products: /\/(products?|services?|solutions?|produkte|produits?|prodotti|productos?|san-pham|offerings?|capabilities|portfolio|what-we-do)/i,
  contact: /\/(contact|kontakt|contacto|contatti|lien-he|inquiry|enquiry|get-in-touch|reach-us)/i,
  home: /^\/$/,
  other: /./,
};

// Language detection patterns
const LANGUAGE_INDICATORS: Record<string, RegExp> = {
  de: /\b(der|die|das|und|ist|ein|eine|für|mit|auf|dem|den|des|von|werden|sich|nicht|auch|nach|wird|bei|noch|aus|wie|über)\b/gi,
  es: /\b(el|la|los|las|del|que|en|por|con|una|para|como|más|pero|sus|este|son|también|fue|está|desde|sobre|todo|cuando)\b/gi,
  fr: /\b(le|la|les|des|est|une|que|dans|pour|avec|sur|par|pas|sont|nous|vous|ils|mais|qui|cette|son|ses|tout|plus|aux)\b/gi,
  it: /\b(il|la|di|che|è|per|in|una|con|non|sono|gli|del|della|dei|alla|le|come|dal|più|anche|questo|quella|stato)\b/gi,
  vi: /\b(của|và|là|trong|có|được|cho|các|này|một|những|với|từ|không|đã|về|theo|để|tại|khi|cũng|sẽ)\b/gi,
  pt: /\b(de|que|em|para|com|uma|os|dos|das|por|mais|como|mas|foi|são|seu|sua|quando|muito|nos|já|também|ela)\b/gi,
};

// --- Core Functions ---

/**
 * Crawl a website starting from the given URL.
 * Discovers key pages (about, products, contact) and extracts cleaned text content.
 */
export async function crawlWebsite(url: string, maxPages: number = MAX_PAGES): Promise<CrawlResult> {
  const startTime = Date.now();
  const pages: CrawledPage[] = [];
  let detectedLanguage = 'en';

  try {
    // Normalize URL
    const baseUrl = normalizeUrl(url);
    if (!baseUrl) {
      return { pages: [], language: 'unknown', error: 'invalid_url' };
    }

    const hostname = new URL(baseUrl).hostname;

    // Step 1: Fetch and parse homepage
    const homePage = await fetchPage(baseUrl, PAGE_TIMEOUT_MS);
    if (!homePage.success) {
      return { pages: [{ url: baseUrl, pageType: 'home', content: '', success: false }], language: 'unknown', error: homePage.error || 'unreachable' };
    }

    const $ = cheerio.load(homePage.html);
    detectedLanguage = detectLanguage($, homePage.html);
    const homeContent = extractContent($);

    pages.push({
      url: baseUrl,
      pageType: 'home',
      content: truncateContent(homeContent),
      success: true
    });

    // Step 2: Discover sub-pages from homepage links
    const subPages = discoverSubPages($, baseUrl, hostname);

    // Step 3: Crawl discovered sub-pages (priority order: products > about > contact)
    for (const subPage of subPages) {
      if (pages.length >= maxPages) break;
      if (Date.now() - startTime > TOTAL_TIMEOUT_MS) break;

      // Already crawled this URL?
      if (pages.some(p => p.url === subPage.url)) continue;

      await delay(REQUEST_DELAY_MS);

      const result = await fetchPage(subPage.url, PAGE_TIMEOUT_MS);
      if (result.success) {
        const sub$ = cheerio.load(result.html);
        const content = extractContent(sub$);
        pages.push({
          url: subPage.url,
          pageType: subPage.pageType,
          content: truncateContent(content),
          success: true
        });
      } else {
        pages.push({
          url: subPage.url,
          pageType: subPage.pageType,
          content: '',
          success: false
        });
      }
    }

    return { pages, language: detectedLanguage };
  } catch (err: any) {
    return {
      pages,
      language: detectedLanguage,
      error: err.message || 'crawl_error'
    };
  }
}

// --- Internal Helpers ---

function normalizeUrl(url: string): string | null {
  try {
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    const parsed = new URL(normalized);
    return parsed.origin + parsed.pathname.replace(/\/+$/, '') || parsed.origin;
  } catch {
    return null;
  }
}

interface FetchResult {
  success: boolean;
  html: string;
  error?: string;
}

async function fetchPage(url: string, timeout: number): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,es;q=0.7',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { success: false, html: '', error: `http_${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { success: false, html: '', error: 'not_html' };
    }

    const html = await res.text();
    return { success: true, html };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { success: false, html: '', error: 'timeout' };
    }
    return { success: false, html: '', error: err.code || err.message || 'fetch_error' };
  }
}

function extractContent($: cheerio.CheerioAPI): string {
  // Remove non-content elements
  $('script, style, noscript, iframe, svg, nav, footer, header, .nav, .footer, .header, .menu, .sidebar, .cookie-banner, .popup').remove();

  // Try to find main content area first
  const mainSelectors = ['main', 'article', '[role="main"]', '.main-content', '.content', '#content', '.page-content'];
  for (const selector of mainSelectors) {
    const main = $(selector);
    if (main.length && main.text().trim().length > 100) {
      return cleanText(main.text());
    }
  }

  // Fallback: use body
  return cleanText($('body').text());
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_PER_PAGE) return content;
  return content.substring(0, MAX_CONTENT_PER_PAGE) + '...';
}

interface DiscoveredPage {
  url: string;
  pageType: PageType;
  priority: number;
}

function discoverSubPages($: cheerio.CheerioAPI, baseUrl: string, hostname: string): DiscoveredPage[] {
  const found = new Map<string, DiscoveredPage>();
  const baseOrigin = new URL(baseUrl).origin;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, baseUrl).href;
    } catch {
      return;
    }

    // Only same-domain links
    try {
      if (new URL(absoluteUrl).hostname !== hostname) return;
    } catch {
      return;
    }

    // Skip anchors, files, etc.
    if (absoluteUrl.includes('#') && absoluteUrl.split('#')[0] === baseUrl) return;
    if (/\.(pdf|jpg|jpeg|png|gif|svg|zip|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3)$/i.test(absoluteUrl)) return;

    // Clean URL (remove trailing slash, query params for dedup)
    const cleanUrl = absoluteUrl.split('?')[0].replace(/\/+$/, '') || baseOrigin;
    if (cleanUrl === baseUrl.replace(/\/+$/, '')) return;
    if (found.has(cleanUrl)) return;

    // Classify page type
    const path = new URL(cleanUrl).pathname;
    let pageType: PageType = 'other';
    let priority = 10;

    if (PAGE_TYPE_PATTERNS.products.test(path)) {
      pageType = 'products';
      priority = 1;  // highest priority
    } else if (PAGE_TYPE_PATTERNS.about.test(path)) {
      pageType = 'about';
      priority = 2;
    } else if (PAGE_TYPE_PATTERNS.contact.test(path)) {
      pageType = 'contact';
      priority = 3;
    }

    // Only keep classified pages (skip generic 'other' to stay focused)
    if (pageType !== 'other') {
      found.set(cleanUrl, { url: cleanUrl, pageType, priority });
    }
  });

  // Sort by priority, take best candidates
  return Array.from(found.values())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_PAGES - 1);
}

function detectLanguage($: cheerio.CheerioAPI, html: string): string {
  // Method 1: Check <html lang="...">
  const htmlLang = $('html').attr('lang') || $('html').attr('xml:lang') || '';
  if (htmlLang) {
    const lang = htmlLang.split('-')[0].toLowerCase();
    if (lang.length === 2) return lang;
  }

  // Method 2: Check <meta> tags
  const metaLang = $('meta[http-equiv="content-language"]').attr('content') || '';
  if (metaLang) {
    const lang = metaLang.split('-')[0].toLowerCase();
    if (lang.length === 2) return lang;
  }

  // Method 3: Content-based detection
  const bodyText = $('body').text().substring(0, 2000);
  let bestLang = 'en';
  let bestScore = 0;

  for (const [lang, pattern] of Object.entries(LANGUAGE_INDICATORS)) {
    const matches = bodyText.match(pattern);
    const score = matches ? matches.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Only override to non-English if there's strong evidence
  return bestScore > 10 ? bestLang : 'en';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
