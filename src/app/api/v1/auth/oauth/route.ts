import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/neon-client';
import { createHash, randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

// OAuth 2.0 Grant Types
enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token',
}

// OAuth 2.0 Response Types
enum ResponseType {
  CODE = 'code',
  TOKEN = 'token',
}

// Validation schemas
const authorizationSchema = z.object({
  response_type: z.nativeEnum(ResponseType),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional(),
});

const tokenSchema = z.object({
  grant_type: z.nativeEnum(GrantType),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  code: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

// JWT secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'oauth-secret-key'
);

// Generate authorization code
function generateAuthCode(): string {
  return randomBytes(32).toString('hex');
}

// Generate access token
async function generateAccessToken(
  clientId: string,
  userId: string,
  scope: string[]
): Promise<string> {
  const payload = {
    sub: userId,
    client_id: clientId,
    scope: scope.join(' '),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

// Generate refresh token
function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

// Verify access token
async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET /api/v1/auth/oauth - Authorization endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const validatedParams = authorizationSchema.parse(params);
    const { response_type, client_id, redirect_uri, scope, state } = validatedParams;

    // Validate client
    const clientResult = await db.query(`
      SELECT id, name, redirect_uris, allowed_scopes
      FROM oauth_clients
      WHERE client_id = $1 AND is_active = true
    `, [client_id]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({
        error: 'invalid_client',
        error_description: 'Invalid client ID',
      }, { status: 400 });
    }

    const client = clientResult.rows[0];

    // Validate redirect URI
    const allowedUris = client.redirect_uris || [];
    if (!allowedUris.includes(redirect_uri)) {
      return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Invalid redirect URI',
      }, { status: 400 });
    }

    // Validate scope
    const requestedScopes = scope ? scope.split(' ') : ['read'];
    const allowedScopes = client.allowed_scopes || ['read'];
    const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
    
    if (invalidScopes.length > 0) {
      return NextResponse.json({
        error: 'invalid_scope',
        error_description: `Invalid scopes: ${invalidScopes.join(', ')}`,
      }, { status: 400 });
    }

    if (response_type === ResponseType.CODE) {
      // Authorization Code Flow
      // In a real implementation, this would redirect to a login/consent page
      // For this example, we'll assume the user is already authenticated
      
      // Generate authorization code
      const authCode = generateAuthCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store authorization code
      await db.query(`
        INSERT INTO oauth_authorization_codes (
          code, client_id, user_id, redirect_uri, scope, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        authCode,
        client_id,
        'user-id-placeholder', // In real implementation, get from session
        redirect_uri,
        requestedScopes.join(' '),
        expiresAt,
      ]);

      // Redirect with authorization code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', authCode);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return NextResponse.redirect(redirectUrl.toString());
    }

    return NextResponse.json({
      error: 'unsupported_response_type',
      error_description: 'Only authorization code flow is supported',
    }, { status: 400 });

  } catch (error) {
    console.error('OAuth authorization error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Invalid request parameters',
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'server_error',
      error_description: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/v1/auth/oauth - Token endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = tokenSchema.parse(body);
    const { grant_type, client_id, client_secret, code, redirect_uri, refresh_token, scope } = validatedData;

    // Validate client credentials
    const clientHash = createHash('sha256').update(client_secret).digest('hex');
    const clientResult = await db.query(`
      SELECT id, name, allowed_scopes
      FROM oauth_clients
      WHERE client_id = $1 AND client_secret_hash = $2 AND is_active = true
    `, [client_id, clientHash]);

    if (clientResult.rows.length === 0) {
      return NextResponse.json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      }, { status: 401 });
    }

    const client = clientResult.rows[0];

    if (grant_type === GrantType.AUTHORIZATION_CODE) {
      // Authorization Code Grant
      if (!code || !redirect_uri) {
        return NextResponse.json({
          error: 'invalid_request',
          error_description: 'Missing required parameters',
        }, { status: 400 });
      }

      // Validate authorization code
      const codeResult = await db.query(`
        SELECT user_id, scope, expires_at
        FROM oauth_authorization_codes
        WHERE code = $1 AND client_id = $2 AND redirect_uri = $3 AND used = false
      `, [code, client_id, redirect_uri]);

      if (codeResult.rows.length === 0) {
        return NextResponse.json({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }, { status: 400 });
      }

      const authData = codeResult.rows[0];

      // Check if code is expired
      if (new Date(authData.expires_at) < new Date()) {
        return NextResponse.json({
          error: 'invalid_grant',
          error_description: 'Authorization code expired',
        }, { status: 400 });
      }

      // Mark code as used
      await db.query(`
        UPDATE oauth_authorization_codes
        SET used = true, used_at = NOW()
        WHERE code = $1
      `, [code]);

      // Generate tokens
      const scopes = authData.scope.split(' ');
      const accessToken = await generateAccessToken(client_id, authData.user_id, scopes);
      const refreshTokenValue = generateRefreshToken();

      // Store refresh token
      await db.query(`
        INSERT INTO oauth_refresh_tokens (
          token, client_id, user_id, scope, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        refreshTokenValue,
        client_id,
        authData.user_id,
        authData.scope,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ]);

      return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshTokenValue,
        scope: authData.scope,
      });

    } else if (grant_type === GrantType.CLIENT_CREDENTIALS) {
      // Client Credentials Grant
      const requestedScopes = scope ? scope.split(' ') : ['read'];
      const allowedScopes = client.allowed_scopes || ['read'];
      const validScopes = requestedScopes.filter(s => allowedScopes.includes(s));

      const accessToken = await generateAccessToken(client_id, client_id, validScopes);

      return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: validScopes.join(' '),
      });

    } else if (grant_type === GrantType.REFRESH_TOKEN) {
      // Refresh Token Grant
      if (!refresh_token) {
        return NextResponse.json({
          error: 'invalid_request',
          error_description: 'Missing refresh token',
        }, { status: 400 });
      }

      // Validate refresh token
      const tokenResult = await db.query(`
        SELECT user_id, scope, expires_at
        FROM oauth_refresh_tokens
        WHERE token = $1 AND client_id = $2 AND revoked = false
      `, [refresh_token, client_id]);

      if (tokenResult.rows.length === 0) {
        return NextResponse.json({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token',
        }, { status: 400 });
      }

      const tokenData = tokenResult.rows[0];

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json({
          error: 'invalid_grant',
          error_description: 'Refresh token expired',
        }, { status: 400 });
      }

      // Generate new access token
      const scopes = tokenData.scope.split(' ');
      const accessToken = await generateAccessToken(client_id, tokenData.user_id, scopes);

      return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: tokenData.scope,
      });
    }

    return NextResponse.json({
      error: 'unsupported_grant_type',
      error_description: 'Unsupported grant type',
    }, { status: 400 });

  } catch (error) {
    console.error('OAuth token error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Invalid request parameters',
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'server_error',
      error_description: 'Internal server error',
    }, { status: 500 });
  }
}
