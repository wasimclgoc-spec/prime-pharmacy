import crypto from 'crypto';

// Rate limiter store: maps IP to request count and reset timestamp
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simple API Key store
const VALID_API_KEYS = new Set([
  process.env.PRIME_API_KEY || 'prime_secret_key_2026_xyz',
  'internal_partner_key_abcd'
]);

/**
 * Recursive input sanitization to prevent XSS.
 * Removes HTML tags and escapes special characters in strings.
 */
export function sanitizeInput<T = any>(input: T): T {
  if (typeof input === 'string') {
    // 1. Strip HTML tags
    let clean = input.replace(/<[^>]*>/g, '');
    // 2. Escape HTML special characters
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    return clean as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item)) as unknown as T;
  }

  if (input !== null && typeof input === 'object') {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitizeInput((input as any)[key]);
      }
    }
    return sanitizedObj as unknown as T;
  }

  return input;
}

/**
 * SQL Injection Prevention Helper.
 * Escapes characters that are dangerous in SQL queries.
 */
export function preventSqlInjection(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Replace single quotes, double quotes, backslashes, NUL, and control chars
  return input
    .replace(/[\0\x08\x09\x1a\n\r"'\\]/g, (char) => {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"": return "\\\"";
        case "'": return "\\'";
        case "\\": return "\\\\";
        default: return char;
      }
    })
    .replace(/--/g, '\\--') // Comment characters
    .replace(/;/g, '\\;');  // Multi-statement separators
}

/**
 * Simple in-memory Rate Limiting.
 * Checks if the given IP address exceeded the limit in the current time window.
 */
export function isRateLimited(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const clientData = rateLimitStore.get(ip);

  if (!clientData || now > clientData.resetTime) {
    const newResetTime = now + windowMs;
    rateLimitStore.set(ip, { count: 1, resetTime: newResetTime });
    return { limited: false, remaining: limit - 1, resetTime: newResetTime };
  }

  clientData.count += 1;
  const remaining = Math.max(0, limit - clientData.count);

  if (clientData.count > limit) {
    return { limited: true, remaining: 0, resetTime: clientData.resetTime };
  }

  return { limited: false, remaining, resetTime: clientData.resetTime };
}

/**
 * CSRF Token generation
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Token verification (compares token hashes in constant time to avoid timing attacks)
 */
export function verifyCsrfToken(submittedToken: string, expectedToken: string): boolean {
  if (!submittedToken || !expectedToken) return false;
  try {
    const submittedBuffer = Buffer.from(submittedToken, 'hex');
    const expectedBuffer = Buffer.from(expectedToken, 'hex');
    
    if (submittedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(submittedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Password validation rules.
 * Enforces strong passwords (8+ chars, upper, lower, digit, special char)
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g., @, $, !, %, *, ?, &).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * API Key Validation.
 * Validates request-level API Keys.
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  return VALID_API_KEYS.has(apiKey);
}
