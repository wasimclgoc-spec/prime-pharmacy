import { NextRequest, NextResponse } from 'next/server';
import { searchMedicineByName, parseCustomerInfoFromText } from '@/lib/whatsapp-utils';
import { medicines } from '@/lib/whatsapp-inventory';

// In-memory session for test mode
interface TestSession {
  name: string;
  address: string;
  phone: string;
  cart: { medicineId: string; name: string; price: number; quantity: number }[];
  prescriptionUploaded: boolean;
  stage: string;
  lastActivity: number;
}

const testSessions = new Map<string, TestSession>();

function getSession(userId: string): TestSession {
  let session = testSessions.get(userId);
  if (!session) {
    session = {
      name: '', address: '', phone: '', cart: [],
      prescriptionUploaded: false, stage: 'greeting',
      lastActivity: Date.now()
    };
    testSessions.set(userId, session);
  }
  session.lastActivity = Date.now();
  return session;
}

// ── GET: Check configuration status ───────────────────────────────────────
export async function GET() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  return NextResponse.json({
    configured: !!(token && phoneId),
    message: token && phoneId
      ? 'WhatsApp API is configured — messages will be sent via Meta Cloud API'
      : 'Test mode — API not configured. Messages are processed locally but not sent to WhatsApp.',
    testNumber: '+1 555-656-3537',
    webhookUrl: '/api/whatsapp/webhook',
  });
}

// ── POST: Simulate WhatsApp message processing ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, from = 'test-user' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const session = getSession(from);
    const msg = message.trim();

    // ── Handle greeting ──
    const greetingPattern = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon)[\s!.]*$/i;
    if (greetingPattern.test(msg)) {
      session.name = '';
      session.address = '';
      session.cart = [];
      session.prescriptionUploaded = false;
      session.stage = 'greeting';

      return NextResponse.json({
        reply: `👋 Welcome to Prime Pharmacy!\n\nI can help you with:\n💊 Search medicines (e.g. "Panadol 500mg")\n📷 Upload prescription\n📦 Place orders\n\nHow can I help you today?`
      });
    }

    // ── Handle image/prescription upload ──
    if (msg.includes('[IMAGE_RECEIVED]') || msg.toLowerCase().includes('upload') || msg.toLowerCase().includes('prescription')) {
      if (msg.includes('[IMAGE_RECEIVED]') || msg.toLowerCase().includes('image')) {
        session.prescriptionUploaded = true;
        return NextResponse.json({
          reply: `✅ Prescription received!\n\nOur pharmacist will review it shortly.\n\nNow, please tell me:\n1. Your full name\n2. Your mobile number\n3. Your delivery address\n\nYou can send all in one message.\nExample: "Ahmed 0300 1234567 Gulberg Lahore"`
        });
      }
    }

    // ── Search medicine ──
    const isPersonalInfo = /(?:\+92|\+966|0)[0-9\s\-]{8,13}/.test(msg) ||
      /street|block|sector|road|avenue|district|area|colony|town|gulberg|johar|allama/i.test(msg);

    const medResults = searchMedicineByName(msg, medicines);

    if (medResults.length > 0 && !isPersonalInfo) {
      let response = `💊 Medicine Search Results:\n\n`;
      medResults.forEach((med, i) => {
        response += `${i + 1}. ${med.name}\n`;
        response += `   Price: Rs ${med.price.toFixed(2)}\n`;
        response += `   Stock: ${med.stock} units\n`;
        response += `   ${med.prescriptionRequired ? '⚠️ Prescription required' : '✅ No prescription needed'}\n\n`;
      });
      response += `To order, type the medicine name and quantity.\nExample: "2 Panadol 500mg"`;

      return NextResponse.json({ reply: response });
    }

    // ── Collect customer info ──
    const extracted = parseCustomerInfoFromText(msg);

    if (extracted.name || extracted.address) {
      if (extracted.name) session.name = extracted.name;
      if (extracted.address) session.address = extracted.address;
      session.phone = extracted.phone || from;

      const hasName = session.name.length > 0;
      const hasAddress = session.address.length > 0;

      if (hasName && hasAddress) {
        session.stage = 'ready_to_order';
        return NextResponse.json({
          reply: `✅ Got it, ${session.name}!\n\nHere's what I have:\n👤 Name: ${session.name}\n📱 Phone: ${session.phone}\n📍 Address: ${session.address}\n\nNow you can:\n💊 Search medicines by name\n📷 Upload your prescription\n\nWhat would you like to do?`
        });
      } else {
        const missing = [];
        if (!hasName) missing.push('Full Name');
        if (!hasAddress) missing.push('Delivery Address');
        return NextResponse.json({
          reply: `Almost there! I still need your ${missing.join(' and ')}.\n\nPlease send them in one message.`
        });
      }
    }

    // ── Add to cart (e.g. "2 Panadol 500mg") ──
    const orderMatch = msg.match(/^(\d+)\s+(.+)$/i);
    if (orderMatch && (session.stage === 'ready_to_order' || session.stage === 'ordering')) {
      const quantity = parseInt(orderMatch[1]);
      const medName = orderMatch[2];
      const results = searchMedicineByName(medName, medicines);

      if (results.length > 0) {
        const med = results[0];
        session.cart.push({
          medicineId: med.id,
          name: med.name,
          price: med.price,
          quantity,
        });

        const cartTotal = session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        session.stage = 'ordering';

        return NextResponse.json({
          reply: `✅ Added to cart:\n${med.name} × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 Cart Total: Rs ${cartTotal.toFixed(2)}\n\nType "confirm order" to place your order, or search for more medicines.`
        });
      }
    }

    // ── Confirm order ──
    if (/confirm|place order|order karo|order karein/i.test(msg) && session.cart.length > 0) {
      if (!session.prescriptionUploaded) {
        const hasRxMeds = session.cart.some(item => {
          const med = medicines.find(m => m.id === item.medicineId);
          return med?.prescriptionRequired;
        });

        if (hasRxMeds) {
          return NextResponse.json({
            reply: `⚠️ Your cart contains prescription medicines.\n\nPlease upload your prescription photo first, then I can confirm the order.\n\nJust send the image here on WhatsApp.`
          });
        }
      }

      const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      const total = session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      let orderSummary = `✅ Order Confirmed!\n\n`;
      orderSummary += `Order #: ${orderNumber}\n\n`;
      orderSummary += `Items:\n`;
      session.cart.forEach((item, i) => {
        orderSummary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      orderSummary += `\nTotal: Rs ${total.toFixed(2)}\n`;
      orderSummary += `\nCustomer: ${session.name}\n`;
      orderSummary += `Phone: ${session.phone}\n`;
      orderSummary += `Address: ${session.address}\n`;
      orderSummary += `Payment: Cash on Delivery\n`;
      orderSummary += `Status: Pending\n\n`;
      orderSummary += `You can track your order using order number ${orderNumber}`;

      session.cart = [];
      session.stage = 'ready_to_order';

      return NextResponse.json({ reply: orderSummary });
    }

    // ── Default: Use OpenRouter AI ──
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({
        reply: `I can help you with:\n\n💊 Search medicines (e.g. "Panadol 500mg")\n📷 Upload prescription\n📦 Place orders\n\nWhat would you like to do?`
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prime-pharmacy.vercel.app',
        'X-Title': 'Prime Pharmacy WhatsApp',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: `You are Prime Pharmacy AI Assistant on WhatsApp. Keep responses short (max 3 lines). Available medicines: ${medicines.map(m => m.name + ' (Rs ' + m.price.toFixed(2) + ')').join(', ')}. Customer: ${session.name || 'unknown'}. Help with medicine search, orders, prescriptions.`
          },
          { role: 'user', content: msg }
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I did not understand. Try searching a medicine by name.';

    return NextResponse.json({ reply: aiReply });

  } catch (error) {
    console.error('Test WhatsApp handler error:', error);
    return NextResponse.json({
      reply: 'Sorry, something went wrong. Try again.'
    });
  }
}
