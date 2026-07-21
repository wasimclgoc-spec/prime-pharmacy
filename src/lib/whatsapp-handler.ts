import { searchMedicineByName, parseCustomerInfoFromText, isPersonalInfo } from './whatsapp-utils';
import { medicines } from './whatsapp-inventory';
import { sendWhatsAppMessage, sendWhatsAppText } from './whatsapp-client';

// ── In-memory session store (per phone number) ──────────────────────────
// In production, replace with Redis or database
interface WhatsAppSession {
  phone: string;
  name: string;
  address: string;
  cart: { medicineId: string; name: string; price: number; quantity: number }[];
  prescriptionUploaded: boolean;
  stage: 'greeting' | 'collecting_info' | 'ready_to_order' | 'ordering';
  lastActivity: number;
}

const sessions = new Map<string, WhatsAppSession>();

// Session expires after 30 minutes of inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getSession(phone: string): WhatsAppSession {
  const now = Date.now();
  let session = sessions.get(phone);

  if (!session || (now - session.lastActivity) > SESSION_TIMEOUT) {
    session = {
      phone,
      name: '',
      address: '',
      cart: [],
      prescriptionUploaded: false,
      stage: 'greeting',
      lastActivity: now,
    };
    sessions.set(phone, session);
  }

  session.lastActivity = now;
  return session;
}

// ── Main message handler ─────────────────────────────────────────────────
export async function handleWhatsAppMessage(
  from: string,
  text: string,
  phoneNumberId: string,
  messageId: string,
  messageType: string
) {
  const session = getSession(from);
  const message = text.trim();

  console.log(`Processing message from ${from}: "${message}" | Stage: ${session.stage}`);

  // ── Handle image (prescription upload) ──
  if (message.includes('[IMAGE_RECEIVED]')) {
    session.prescriptionUploaded = true;
    await sendWhatsAppText(from, phoneNumberId,
      `✅ Prescription received!\n\nOur pharmacist will review it shortly.\n\nNow, please tell me:\n1. Your *full name*\n2. Your *mobile number*\n3. Your *delivery address*\n\nYou can send all in one message, e.g.:\n"Ahmed 0300 1234567 Gulberg Lahore"`
    );
    session.stage = 'collecting_info';
    return;
  }

  // ── Detect greeting ──
  const greetingPattern = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon)[\s!.]*$/i;
  if (greetingPattern.test(message)) {
    // Reset session on greeting
    session.name = '';
    session.address = '';
    session.cart = [];
    session.prescriptionUploaded = false;
    session.stage = 'greeting';

    await sendWhatsAppText(from, phoneNumberId,
      `👋 Welcome to *Prime Pharmacy*!\n\nI can help you with:\n💊 Search medicines (e.g. "Panadol 500mg")\n📷 Upload prescription\n📦 Place orders\n\nHow can I help you today?`
    );
    return;
  }

  // ── Order check FIRST: "10 Amoxicillin 500mg" pattern ──
  const orderMatch = message.match(/^(\d+)\s+(.+)$/i);
  if (orderMatch) {
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

      const needsInfo = !session.name || !session.address;
      await sendWhatsAppText(from, phoneNumberId,
        `✅ Added to cart:\n*${med.name}* × ${quantity}\n   Rs ${med.price.toFixed(2)}/tablet × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 Cart Total: Rs ${cartTotal.toFixed(2)}\n\n${needsInfo ? 'To confirm order, please send your name and delivery address.\nExample: "Ahmed 03001234567 Gulberg Lahore"' : 'Type "confirm order" to checkout, or add more medicines.'}`
      );
      return;
    }
  }

  // ── Check if customer is searching for a medicine ──
  const medResults = searchMedicineByName(message, medicines);
  if (medResults.length > 0 && !isPersonalInfo(message)) {
    let response = `💊 *Found ${medResults.length} medicine(s):*\n\n`;
    medResults.forEach((med, i) => {
      response += `${i + 1}. *${med.name}*\n`;
      response += `   💰 Rs ${med.price.toFixed(2)} / tablet\n`;
      response += `   📦 Stock: ${med.stock} units\n`;
      response += `   ${med.prescriptionRequired ? '⚠️ Rx Medicine' : '✅ OTC (No prescription)'}\n\n`;
    });
    response += `To order, type quantity + medicine name.\nExample: "2 ${medResults[0].name}" → Rs ${(medResults[0].price * 2).toFixed(2)} total`;

    await sendWhatsAppText(from, phoneNumberId, response);
    return;
  }

  // ── Collect customer info (name, phone, address) ──
  const extracted = parseCustomerInfoFromText(message);

  if (extracted.name || extracted.phone || extracted.address) {
    if (extracted.name) session.name = extracted.name;
    if (extracted.address) session.address = extracted.address;

    const hasName = session.name.length > 0;
    const hasAddress = session.address.length > 0;

    if (hasName && hasAddress) {
      session.stage = 'ready_to_order';
      await sendWhatsAppText(from, phoneNumberId,
        `✅ Got it, *${session.name}*!\n\nHere's what I have:\n👤 Name: ${session.name}\n📱 Phone: ${from}\n📍 Address: ${session.address}\n\nNow you can:\n💊 Search medicines by name\n📷 Upload your prescription\n\nWhat would you like to do?`
      );
      return;
    } else {
      const missing = [];
      if (!hasName) missing.push('Full Name');
      if (!hasAddress) missing.push('Delivery Address');
      await sendWhatsAppText(from, phoneNumberId,
        `Almost there! I still need your *${missing.join(' and ')}*.\n\nPlease send them in one message.`
      );
      session.stage = 'collecting_info';
      return;
    }
  }

  // ── Confirm order ──
  if (/confirm|place order|order karo|order karein/i.test(message) && session.cart.length > 0) {
    // Prescription is optional — place order directly
    // Place the order
    const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const total = session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let orderSummary = `✅ *Order Confirmed!*\n\n`;
    orderSummary += `Order #: *${orderNumber}*\n\n`;
    orderSummary += `Items:\n`;
    session.cart.forEach((item, i) => {
      orderSummary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    orderSummary += `\nTotal: *Rs ${total.toFixed(2)}*\n`;
    orderSummary += `\nCustomer: ${session.name}\n`;
    orderSummary += `Phone: ${from}\n`;
    orderSummary += `Address: ${session.address}\n`;
    orderSummary += `\nPayment: Cash on Delivery\n`;
    orderSummary += `Status: Pending\n\n`;
    orderSummary += `You can track your order in the app using order number ${orderNumber}`;

    await sendWhatsAppText(from, phoneNumberId, orderSummary);

    // Reset cart
    session.cart = [];
    session.stage = 'ready_to_order';
    return;
  }

  // ── Default: Use AI (OpenRouter) for general queries ──
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

  if (!apiKey) {
    await sendWhatsAppText(from, phoneNumberId,
      `I can help you with:\n\n💊 Search medicines (e.g. "Panadol 500mg")\n📷 Upload prescription\n📦 Place orders\n\nWhat would you like to do?`
    );
    return;
  }

  try {
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
            content: `You are Prime Pharmacy AI Assistant. Help customers with medicine search, orders, and prescriptions. Keep responses short (max 3-4 lines). Available medicines: ${medicines.map(m => m.name + ' (Rs ' + m.price.toFixed(2) + ')').join(', ')}. Customer phone: ${from}. Customer name: ${session.name || 'unknown'}.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'Sorry, I did not understand. Try searching a medicine by name.';

    await sendWhatsAppText(from, phoneNumberId, aiReply);
  } catch (error) {
    console.error('AI error:', error);
    await sendWhatsAppText(from, phoneNumberId,
      `I can help you with:\n💊 Search medicines (e.g. "Panadol 500mg")\n📷 Upload prescription\n📦 Place orders`
    );
  }
}
