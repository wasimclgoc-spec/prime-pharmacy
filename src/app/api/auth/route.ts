import { NextRequest, NextResponse } from 'next/server';
import { 
  authenticateUser, 
  requireAuth, 
  hashPassword, 
  createSession 
} from '@/lib/auth';
import { 
  validatePassword, 
  sanitizeInput, 
  isRateLimited 
} from '@/lib/security';
import { 
  refreshToken as performTokenRefresh 
} from '@/lib/jwt';
import { 
  customers, 
  Customer, 
  orders 
} from '@/lib/seed-data';
import { logAction } from '@/lib/audit-log';
import { addInAppNotification } from '@/lib/notifications';

/**
 * GET: Retrieves the currently authenticated user's details and active sessions (/me).
 */
export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const limitCheck = isRateLimited(ip, 60, 60000);
  if (limitCheck.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Find recent order count or profile specific to user
  const userOrders = orders.filter(o => o.customerId === user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      recentOrdersCount: userOrders.length
    }
  });
}

/**
 * POST: Multiplexes authentication actions: login, register, and refresh.
 */
export async function POST(req: NextRequest) {
  // Rate limiting for auth actions (stricter limit for login/registration to prevent brute force)
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const limitCheck = isRateLimited(ip, 20, 60000); // 20 requests/minute
  
  if (limitCheck.limited) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    
    // Action can be provided either in query param (e.g. ?action=login) or in the JSON body
    const action = (searchParams.get('action') || body.action || '').toLowerCase();

    // ==========================================
    // 1. LOGIN ACTION
    // ==========================================
    if (action === 'login') {
      const email = body.email;
      const password = body.password;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const authResult = authenticateUser(email, password);
      if (!authResult) {
        // Brute force delay simulation & log failure
        logAction(
          'guest',
          'guest',
          email,
          'LOGIN_FAIL',
          'Auth',
          'none',
          `Failed login attempt for email: ${email}`,
          req
        );
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Successful login
      logAction(
        authResult.user.id,
        authResult.user.role,
        authResult.user.name,
        'LOGIN',
        'Auth',
        authResult.user.id,
        `User logged in successfully from IP: ${ip}`,
        req
      );

      // Construct cookie headers for HTTP-only JWT storage
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: authResult.user,
        token: authResult.token
      });

      // Set cookie header
      response.headers.append(
        'Set-Cookie',
        `token=${authResult.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${2 * 3600}` // 2 hours
      );

      return response;
    }

    // ==========================================
    // 2. REGISTER ACTION
    // ==========================================
    if (action === 'register') {
      const { name, email, phone, password, address, profile } = body;

      // Sanitization
      const cleanName = sanitizeInput(name?.trim() || '');
      const cleanEmail = sanitizeInput(email?.trim().toLowerCase() || '');
      const cleanPhone = sanitizeInput(phone?.trim() || '');

      if (!cleanName || !cleanEmail || !cleanPhone || !password) {
        return NextResponse.json({ error: 'Name, email, phone, and password are required' }, { status: 400 });
      }

      // Password Strength Check
      const passValidation = validatePassword(password);
      if (!passValidation.isValid) {
        return NextResponse.json({ error: passValidation.errors[0] }, { status: 400 });
      }

      // Check if email already in use
      const emailExists = customers.some(c => c.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }

      // Hash password
      const passwordHash = hashPassword(password);

      const newCustomerId = `cust-${customers.length + 1}`;
      
      const newCustomer: Customer = {
        id: newCustomerId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'customer',
        address: {
          street: sanitizeInput(address?.street || 'Walk-in Street'),
          city: sanitizeInput(address?.city || 'Riyadh'),
          state: sanitizeInput(address?.state || 'Riyadh Region'),
          zip: sanitizeInput(address?.zip || '11543'),
          country: sanitizeInput(address?.country || 'KSA')
        },
        profile: {
          age: parseInt(profile?.age || '30', 10),
          gender: profile?.gender === 'Female' ? 'Female' : 'Male',
          bloodGroup: sanitizeInput(profile?.bloodGroup || 'O+'),
          allergies: sanitizeInput(profile?.allergies || []),
          chronicConditions: sanitizeInput(profile?.chronicConditions || [])
        },
        orderHistory: []
      };

      // Push to seed list
      customers.push(newCustomer);

      // Send welcome notifications
      addInAppNotification(
        newCustomerId,
        'Welcome to Prime Pharmacy! 🏥',
        `Dear ${cleanName}, thank you for registering with Prime Pharmacy. You can now upload prescriptions and order medications safely online.`,
        'general'
      );

      // Generate session
      const userPayload = {
        id: newCustomer.id,
        email: newCustomer.email,
        name: newCustomer.name,
        role: newCustomer.role
      };
      const token = createSession(userPayload, '24h');

      logAction(
        newCustomerId,
        'customer',
        cleanName,
        'CREATE',
        'Customer',
        newCustomerId,
        `Registered new customer account: ${cleanEmail}`,
        req
      );

      const response = NextResponse.json({
        success: true,
        message: 'Account registered successfully',
        user: userPayload,
        token
      }, { status: 201 });

      response.headers.append(
        'Set-Cookie',
        `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 3600}` // 24 hours
      );

      return response;
    }

    // ==========================================
    // 3. REFRESH TOKEN ACTION
    // ==========================================
    if (action === 'refresh') {
      // Pull token from authorization header, body, or cookies
      let tokenToRefresh = body.token;
      
      if (!tokenToRefresh) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          tokenToRefresh = authHeader.substring(7);
        }
      }

      if (!tokenToRefresh) {
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const tokenCookie = cookieHeader
            .split(';')
            .map(c => c.trim())
            .find(c => c.startsWith('token='));
          if (tokenCookie) {
            tokenToRefresh = tokenCookie.substring(6);
          }
        }
      }

      if (!tokenToRefresh) {
        return NextResponse.json({ error: 'Token is required for refresh operations' }, { status: 400 });
      }

      const newToken = performTokenRefresh(tokenToRefresh);
      if (!newToken) {
        return NextResponse.json({ error: 'Invalid or expired session. Please login again.' }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        token: newToken
      });

      response.headers.append(
        'Set-Cookie',
        `token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${2 * 3600}`
      );

      return response;
    }

    // If action doesn't match login, register, or refresh
    return NextResponse.json({ error: 'Invalid auth action. Supported: "login", "register", "refresh"' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in POST auth route:', error);
    return NextResponse.json({ error: 'An error occurred during authentication processing.' }, { status: 500 });
  }
}
