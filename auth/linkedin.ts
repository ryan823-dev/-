/**
 * LinkedIn OAuth 2.0 Authentication Module
 * 
 * Implements the OAuth 2.0 Authorization Code Flow
 * for LinkedIn API integration.
 * 
 * Note: LinkedIn requires Marketing Developer Platform approval
 * for posting APIs. This module is structured for future integration.
 */
import crypto from 'crypto';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

interface LinkedInOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Build LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthorizationUrl(config: LinkedInOAuthConfig): {
  authUrl: string;
  state: string;
} {
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
  });

  const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  return { authUrl, state };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeLinkedInCode(
  code: string,
  config: LinkedInOAuthConfig
): Promise<LinkedInTokenResponse> {
  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn OAuth token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshLinkedInToken(
  refreshToken: string,
  config: LinkedInOAuthConfig
): Promise<LinkedInTokenResponse> {
  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn token refresh failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get LinkedIn OAuth configuration from environment
 */
export function getLinkedInOAuthConfig(): LinkedInOAuthConfig {
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback',
    scopes: [
      'openid',
      'profile',
      'email',
      'w_member_social',
    ],
  };
}
