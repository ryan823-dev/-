/**
 * X (Twitter) OAuth 2.0 PKCE Authentication Module
 * 
 * Implements the OAuth 2.0 Authorization Code Flow with PKCE
 * for X API v2 integration.
 */
import crypto from 'crypto';

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

interface XOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface XTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Generate PKCE code verifier and challenge
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// Generate state parameter for CSRF protection
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Build X OAuth authorization URL
 */
export function getXAuthorizationUrl(config: XOAuthConfig): {
  authUrl: string;
  state: string;
  codeVerifier: string;
} {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${X_AUTH_URL}?${params.toString()}`;
  return { authUrl, state, codeVerifier };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeXCode(
  code: string,
  codeVerifier: string,
  config: XOAuthConfig
): Promise<XTokenResponse> {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString('base64');

  const response = await fetch(X_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X OAuth token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshXToken(
  refreshToken: string,
  config: XOAuthConfig
): Promise<XTokenResponse> {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString('base64');

  const response = await fetch(X_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X token refresh failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Get X OAuth configuration from environment
 */
export function getXOAuthConfig(): XOAuthConfig {
  return {
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri: process.env.X_REDIRECT_URI || 'http://localhost:3000/api/auth/x/callback',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'offline.access',
    ],
  };
}
