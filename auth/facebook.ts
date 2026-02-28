/**
 * Facebook OAuth 2.0 Authentication Module
 * 
 * Implements Facebook Login and Page management
 * via the Facebook Graph API.
 */
import crypto from 'crypto';

const FB_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const FB_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

// Generate state parameter for CSRF protection
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Build Facebook OAuth authorization URL
 */
export function getFacebookAuthorizationUrl(config: FacebookOAuthConfig): {
  authUrl: string;
  state: string;
} {
  const state = generateState();

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(','),
    state,
    response_type: 'code',
  });

  const authUrl = `${FB_AUTH_URL}?${params.toString()}`;
  return { authUrl, state };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeFacebookCode(
  code: string,
  config: FacebookOAuthConfig
): Promise<FacebookTokenResponse> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get long-lived access token (60 day token)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  config: FacebookOAuthConfig
): Promise<FacebookTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook long-lived token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get user's managed Facebook pages
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPageInfo[]> {
  const response = await fetch(
    `${FB_GRAPH_URL}/me/accounts?fields=id,name,access_token,category&access_token=${userAccessToken}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Facebook pages: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get Facebook OAuth configuration from environment
 */
export function getFacebookOAuthConfig(): FacebookOAuthConfig {
  return {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/auth/facebook/callback',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'pages_read_user_content',
    ],
  };
}
