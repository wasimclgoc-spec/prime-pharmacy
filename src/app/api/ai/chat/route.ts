import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isRateLimited, sanitizeInput } from '@/lib/security';
import { generateResponse } from '@/lib/ai-prescription';
import { logAction } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  // 1. Rate Limiting
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const limitCheck = isRateLimited(ip, 30, 60000); // 30 requests per minute
  
  if (limitCheck.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limitCheck.resetTime / 1000)) } }
    );
  }

  // 2. Authentication
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 3. Input validation & Sanitization
    if (!body || typeof body.message !== 'string' || body.message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeInput(body.message.trim());
    const context = body.context || {};
    
    // Inject user context securely to prevent client-side context spoofing of identity
    context.user = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email
    };

    // 4. Generate AI response
    const aiResponse = await generateResponse(sanitizedMessage, context);

    // 5. Audit Logging (optional for chat, but great for admin/pharmacist track, let's log if staff chats)
    if (user.role !== 'customer') {
      logAction(
        user.id,
        user.role,
        user.name,
        'CHAT_CONSULT',
        'AI',
        'chat-api',
        `Staff consulted AI assistant with query: "${sanitizedMessage.substring(0, 40)}..."`,
        req
      );
    }

    return NextResponse.json({
      message: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in AI chat route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
