import { NextRequest, NextResponse } from 'next/server';
import { searchMedicineByName, parseCustomerInfoFromText } from '@/lib/whatsapp-utils';
import { medicines } from '@/lib/whatsapp-inventory';

interface TestSession {
  name: string;
  address: string;
  phone: string;
  cart: { medicineId: string; name: string; price: number; quantity: number }[];
  stage: string;
  lastActivity: number;
}

const testSessions = new Map<string, TestSession>();

function getSession(userId: string): TestSession {
  let session = testSessions.get(userId);
  if (!session) {
    session = { name: '', address: '', phone: '', cart: [], stage: 'greeting', lastActivity: Date.now() };
    testSessions.set(userId, session);
  }
  session.lastActivity = Date.now();
  return session;
}

export async function GET() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return NextResponse.json({
    configured: !!(token && phoneId),
    message: token && phoneId ? 'WhatsApp API configured' : 'Test mode — no Meta API key',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, from = 'test-user' } = body;
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const session = getSession(from);
    const msg = message.trim();

    // ── 1. GREETING → reset session ──────────────────────────────────────
    const isGreeting = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon)[\s!.]*$/i.test(msg);
    if (isGreeting) {
      Object.assign(session, { name: '', address: '', phone: '', cart: [], stage: 'greeting' });
      return NextResponse.json({
        reply: `👋 Welcome to Prime Pharmacy!\n\nI can help you with:\n💊 Search medicines by name\n🛒 Place orders (type quantity + name, e.g. "2 Panadol 500mg")\n📦 Track your orders\n\nHow can I help you today?`
      });
    }

    // ── 2. IMAGE → mark prescription received ───────────────────────────
    if (msg.includes('[IMAGE_RECEIVED]')) {
      return NextResponse.json({ reply: `✅ Prescription received! Our pharmacist will review it.\n\nNow search for your medicines or place an order.` });
    }

    // ── 3. ORDER FIRST: "10 Amoxicillin 500mg" ──────────────────────────
    const orderMatch = msg.match(/^(\d+)\s+(.+)$/i);
    if (orderMatch) {
      const quantity = parseInt(orderMatch[1]);
      const medName = orderMatch[2].trim();
      const results = searchMedicineByName(medName, medicines);

      if (results.length > 0) {
        const med = results[0];
        session.cart.push({ medicineId: med.id, name: med.name, price: med.price, quantity });
        const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
        session.stage = 'ordering';
        const needsInfo = !session.name || !session.address;
        return NextResponse.json({
          reply: `✅ Added to cart:\n*${med.name}* × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 *Cart Total: Rs ${cartTotal.toFixed(2)}*\n\n${
            needsInfo
              ? 'To confirm order, send your name and address:\nExample: "Ahmed 03001234567 Gulberg Lahore"'
              : 'Type "confirm order" to checkout, or add more medicines.'
          }`
        });
      }
    }

    // ── 4. CONFIRM ORDER ─────────────────────────────────────────────────
    if (/confirm|place order/i.test(msg) && session.cart.length > 0) {
      if (!session.name || !session.address) {
        return NextResponse.json({ reply: `Please send your name and delivery address first.\nExample: "Ahmed 03001234567 Gulberg Lahore"` });
      }
      const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      const total = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      let summary = `✅ *Order Confirmed!*\n\nOrder #: *${orderNum}*\n\nItems:\n`;
      session.cart.forEach((item, i) => {
        summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      summary += `\n*Total: Rs ${total.toFixed(2)}*\nCustomer: ${session.name}\nPhone: ${session.phone || from}\nAddress: ${session.address}\nPayment: Cash on Delivery\n\nTrack with order number: ${orderNum}`;
      session.cart = [];
      session.stage = 'ready_to_order';
      return NextResponse.json({ reply: summary });
    }

    // ── 5. CUSTOMER INFO: name + phone + address ─────────────────────────
    const extracted = parseCustomerInfoFromText(msg);
    if (extracted.name || extracted.address) {
      if (extracted.name) session.name = extracted.name;
      if (extracted.address) session.address = extracted.address;
      if (extracted.phone) session.phone = extracted.phone;

      if (session.name && session.address) {
        session.stage = 'ready_to_order';
        const hasCart = session.cart.length > 0;
        return NextResponse.json({
          reply: `✅ Got it, *${session.name}*!\n\n👤 Name: ${session.name}\n📍 Address: ${session.address}\n\n${
            hasCart
              ? `🛒 You have items in cart. Type "confirm order" to checkout.`
              : `Now search for medicines or type "2 Panadol 500mg" to add to cart.`
          }`
        });
      } else {
        const missing = [];
        if (!session.name) missing.push('Full Name');
        if (!session.address) missing.push('Delivery Address');
        return NextResponse.json({ reply: `Still need your ${missing.join(' and ')}. Please send in one message.` });
      }
    }

    // ── 6. MEDICINE SEARCH ───────────────────────────────────────────────
    const medResults = searchMedicineByName(msg, medicines);
    if (medResults.length > 0) {
      let response = `💊 Found *${medResults.length}* medicine(s):\n\n`;
      medResults.forEach((med, i) => {
        response += `${i + 1}. *${med.name}*\n`;
        response += `   💰 Rs ${med.price.toFixed(2)} | 📦 Stock: ${med.stock}\n`;
        response += `   🏷️ ${med.brand} | ${med.generic}\n`;
        response += `   ${med.prescriptionRequired ? '⚠️ Rx Medicine' : '✅ OTC'}\n\n`;
      });
      response += `To order, type quantity + name\nExample: "*2 ${medResults[0].name}*"`;
      return NextResponse.json({ reply: response });
    }

    // ── 7. AI FALLBACK ───────────────────────────────────────────────────
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (apiKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://prime-pharmacy.vercel.app',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: `You are Prime Pharmacy WhatsApp bot. Keep replies under 3 lines. Help with medicines and orders. Customer: ${session.name || 'unknown'}.` },
            { role: 'user', content: msg }
          ],
          max_tokens: 150,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return NextResponse.json({ reply });
    }

    return NextResponse.json({
      reply: `I can help you with:\n💊 Search medicines by name\n🛒 Order: type "2 Panadol 500mg"\n📦 Track orders\n\nWhat would you like?`
    });

  } catch (error) {
    console.error('WhatsApp test error:', error);
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' });
  }
}
