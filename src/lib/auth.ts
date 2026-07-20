import crypto from 'crypto';
import { signToken, verifyToken, JWTPayload } from './jwt';
import { customers, Customer } from './seed-data';

// Hardcoded Staff/Admin users for authentication
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'pharmacist' | 'delivery';
}

export const staffUsers: StaffUser[] = [
  {
    id: 'staff-admin',
    name: 'Dr. Tariq Al-Amri',
    email: 'admin@primepharmacy.com',
    passwordHash: hashPassword('admin123'),
    role: 'admin'
  },
  {
    id: 'staff-pharmacist',
    name: 'Samer El-Masri (RPh)',
    email: 'pharmacist@primepharmacy.com',
    passwordHash: hashPassword('pharmacy123'),
    role: 'pharmacist'
  },
  {
    id: 'staff-driver-1',
    name: 'Yasir Khan',
    email: 'driver1@primepharmacy.com',
    passwordHash: hashPassword('driver123'),
    role: 'delivery'
  }
];

/**
 * Basic SHA-256 password hashing for demo
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Authenticates a user (either customer or staff) against the database
 */
export function authenticateUser(email: string, password: string): { user: JWTPayload; token: string } | null {
  const cleanEmail = email.trim().toLowerCase();
  const passHash = hashPassword(password);

  // 1. Check Staff / Admin first
  const staff = staffUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (staff && staff.passwordHash === passHash) {
    const payload: JWTPayload = {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role
    };
    const token = signToken(payload, '2h');
    return { user: payload, token };
  }

  // 2. Check Customers
  const customer = customers.find(c => c.email.toLowerCase() === cleanEmail);
  if (customer && customer.passwordHash === passHash) {
    const payload: JWTPayload = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer'
    };
    const token = signToken(payload, '24h');
    return { user: payload, token };
  }

  return null;
}

/**
 * Creates session (essentially signing a JWT token)
 */
export function createSession(user: JWTPayload, expiresIn: string | number = '2h'): string {
  return signToken(user, expiresIn);
}

/**
 * Extract token from Authorization header or Cookies
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to cookie (e.g. token=xyz)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.substring(6);
    }
  }

  return null;
}

/**
 * requireAuth - Extracts and verifies token, returns user payload or null
 */
export async function requireAuth(req: Request): Promise<JWTPayload | null> {
  const token = extractToken(req);
  if (!token) return null;

  return verifyToken(token);
}

/**
 * requireRole - checks if user role matches allowed roles list
 */
export function requireRole(user: JWTPayload | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
