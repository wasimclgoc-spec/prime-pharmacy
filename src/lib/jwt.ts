import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'prime-pharmacy-super-secret-key-2026';

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Signs a payload to generate a JWT token.
 * @param payload The session payload to sign
 * @param expiresIn Time duration (e.g. '1h', '2d', '15m' or in seconds)
 */
export function signToken(payload: JWTPayload, expiresIn: string | number = '1h'): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  let expSeconds = 3600; // default 1 hour
  if (typeof expiresIn === 'number') {
    expSeconds = expiresIn;
  } else if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === 's') expSeconds = val;
      else if (unit === 'm') expSeconds = val * 60;
      else if (unit === 'h') expSeconds = val * 3600;
      else if (unit === 'd') expSeconds = val * 86400;
    }
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expSeconds;

  const fullPayload: JWTPayload = {
    ...payload,
    iat,
    exp
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(signatureInput);
  const signature = base64UrlEncode(hmac.digest());

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a JWT token and returns the decoded payload. Returns null if invalid or expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(signatureInput);
    const expectedSignature = base64UrlEncode(hmac.digest());

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh token logic - verifies a valid/expired token and issues a new one
 */
export function refreshToken(token: string): string | null {
  try {
    // We want to decode even if expired, but let's see if we can decode the payload directly
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // First verify signature (independent of expiration check)
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(signatureInput);
    const expectedSignature = base64UrlEncode(hmac.digest());
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    
    // Check if it's within refresh limits (e.g., maximum 7 days old)
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat || 0;
    const maxRefreshWindow = 7 * 24 * 3600; // 7 days
    
    if (now - iat > maxRefreshWindow) {
      return null; // Too old to refresh
    }
    
    // Issue new token
    const { iat: oldIat, exp: oldExp, ...restPayload } = payload;
    return signToken(restPayload, '1h');
  } catch (error) {
    return null;
  }
}
