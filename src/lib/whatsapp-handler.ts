import { searchMedicineByName } from './whatsapp-utils';
import { medicines } from './whatsapp-inventory';
import { sendWhatsAppText } from './whatsapp-client';

interface CartItem { medicineId: string; name: string; price: number; quantity: number }
interface WhatsAppSession {
  name: string;
  phone: string;
  address: string;
  deliveryType: string;
  cart: CartItem[];
  stage: string;
  lastActivity: number;
}

const DELIVERY_CHARGE = 20;
const sessions = new Map<string, WhatsAppSession>();

function getSession(from: string): WhatsAppSession {
  let session = sessions.get(from);
  if (!session) {
    session = { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting', lastActivity: Date.now() };
    sessions.set(from, session);
  }
  session.lastActivity = Date.now();
  return session;
}

// Clean old sessions (older than 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActivity > 30 * 60 * 1000) sessions.delete(key);
  }
}, 5 * 60 * 1000);

export async function handleWhatsAppMessage(from: string, message: string, phoneNumberId: string) {
  const session = getSession(from);
  const msg = message.trim();
  const lower = msg.toLowerCase();

  // ── 1. GREETING → full reset ────────────────────────────────────────
  const isGreeting = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon)[\s!.]*$/i.test(msg);
  if (isGreeting) {
    Object.assign(session, { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting' });
    await sendWhatsAppText(from, phoneNumberId,
      `👋 Welcome to Prime Pharmacy!\n\nI can help you with:\n💊 Search medicines by name\n🛒 Place orders\n📦 Track your orders\n\nType a medicine name to search, e.g. "Paracetamol"`
    );
    return;
  }

  // ── 2. IMAGE → prescription received ───────────────────────────────
  if (msg.includes('[IMAGE]') || msg.includes('[IMAGE_RECEIVED]')) {
    await sendWhatsAppText(from, phoneNumberId,
      `✅ Prescription received! Our pharmacist will review it.\n\nNow type a medicine name to search or add to cart.`
    );
    return;
  }

  // ── 3. STAGE: asking_name ──────────────────────────────────────────
  if (session.stage === 'asking_name') {
    session.name = msg;
    session.stage = 'asking_phone';
    await sendWhatsAppText(from, phoneNumberId,
      `Nice to meet you, *${session.name}*! 🙌\n\nPlease share your mobile number:\nExample: "03001234567"`
    );
    return;
  }

  // ── 4. STAGE: asking_phone ─────────────────────────────────────────
  if (session.stage === 'asking_phone') {
    const phoneMatch = msg.match(/[\d\s+\-]{8,}/);
    if (phoneMatch) {
      session.phone = phoneMatch[0].replace(/\s/g, '');
      session.stage = 'asking_delivery';
      await sendWhatsAppText(from, phoneNumberId,
        `Got it! 📱 ${session.phone}\n\nHow would you like to receive your order?\n\nType:\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ${DELIVERY_CHARGE} charges)`
      );
      return;
    }
    await sendWhatsAppText(from, phoneNumberId, `Please send a valid mobile number.\nExample: "03001234567"`);
    return;
  }

  // ── 5. STAGE: asking_delivery ──────────────────────────────────────
  if (session.stage === 'asking_delivery') {
    if (lower.includes('pickup') || lower.includes('collect') || lower.includes('pick')) {
      session.deliveryType = 'pickup';
      session.stage = 'ready_to_checkout';
      const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      await sendWhatsAppText(from, phoneNumberId,
        `🚗 Pickup selected — no delivery charges.\n\n🛒 *Order Summary:*\n${session.cart.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: Rs ${cartTotal.toFixed(2)}\nDelivery: Rs 0\n*Total: Rs ${cartTotal.toFixed(2)}*\n\nType "confirm order" to place your order.`
      );
      return;
    }
    if (lower.includes('delivery') || lower.includes('home') || lower.includes('deliver')) {
      session.deliveryType = 'delivery';
      session.stage = 'asking_address';
      await sendWhatsAppText(from, phoneNumberId,
        `🛵 Delivery selected — Rs ${DELIVERY_CHARGE} charges.\n\nPlease share your delivery address:\nExample: "House 12, Street 5, Gulberg, Lahore"`
      );
      return;
    }
    await sendWhatsAppText(from, phoneNumberId,
      `Please type:\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ${DELIVERY_CHARGE} charges)`
    );
    return;
  }

  // ── 6. STAGE: asking_address ──────────────────────────────────────
  if (session.stage === 'asking_address') {
    session.address = msg;
    session.stage = 'ready_to_checkout';
    const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const grandTotal = cartTotal + DELIVERY_CHARGE;
    await sendWhatsAppText(from, phoneNumberId,
      `📍 Address saved!\n\n🛒 *Order Summary:*\n${session.cart.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: Rs ${cartTotal.toFixed(2)}\nDelivery: Rs ${DELIVERY_CHARGE}\n*Total: Rs ${grandTotal.toFixed(2)}*\n\nType "confirm order" to place your order.`
    );
    return;
  }

  // ── 7. ORDER FIRST: "10 Amoxicillin 500mg" ─────────────────────────
  const orderMatch = msg.match(/^(\d+)\s+(.+)$/i);
  if (orderMatch) {
    const quantity = parseInt(orderMatch[1]);
    const medName = orderMatch[2].trim();
    const results = searchMedicineByName(medName, medicines);

    if (results.length > 0) {
      const med = results[0];
      session.cart.push({ medicineId: med.id, name: med.name, price: med.price, quantity });
      const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);

      const rxPrompt = med.prescriptionRequired
        ? `⚠️ *${med.name}* is a prescription medicine. Please upload your prescription photo (optional but recommended).`
        : `📎 You can upload a prescription if you have one (optional).`;

      if (!session.name) {
        session.stage = 'asking_name';
        await sendWhatsAppText(from, phoneNumberId,
          `✅ Added to cart:\n*${med.name}* × ${quantity}\n   Rs ${med.price.toFixed(2)}/tablet × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 *Cart Total: Rs ${cartTotal.toFixed(2)}*\n\n${rxPrompt}\n\nTo continue, please tell me your *full name*:\nExample: "Ahmed Khan"`
        );
        return;
      }

      await sendWhatsAppText(from, phoneNumberId,
        `✅ Added to cart:\n*${med.name}* × ${quantity}\n   Rs ${med.price.toFixed(2)}/tablet × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 *Cart Total: Rs ${cartTotal.toFixed(2)}*\n\n${rxPrompt}\n\nType "confirm order" to checkout, or add more medicines.`
      );
      return;
    }
  }

  // ── 8. CONFIRM ORDER ───────────────────────────────────────────────
  if (/confirm|place order|checkout/i.test(msg) && session.cart.length > 0) {
    if (!session.name) {
      session.stage = 'asking_name';
      await sendWhatsAppText(from, phoneNumberId,
        `Let's complete your order! 📝\n\nPlease tell me your *full name*:\nExample: "Ahmed Khan"`
      );
      return;
    }
    if (!session.phone) {
      session.stage = 'asking_phone';
      await sendWhatsAppText(from, phoneNumberId,
        `Please share your *mobile number*:\nExample: "03001234567"`
      );
      return;
    }
    if (!session.deliveryType) {
      session.stage = 'asking_delivery';
      await sendWhatsAppText(from, phoneNumberId,
        `How would you like to receive your order?\n\nType:\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ${DELIVERY_CHARGE} charges)`
      );
      return;
    }
    if (session.deliveryType === 'delivery' && !session.address) {
      session.stage = 'asking_address';
      await sendWhatsAppText(from, phoneNumberId,
        `Please share your *delivery address*:\nExample: "House 12, Street 5, Gulberg, Lahore"`
      );
      return;
    }

    // All info collected — confirm order
    const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = session.deliveryType === 'delivery' ? DELIVERY_CHARGE : 0;
    const grandTotal = cartTotal + deliveryFee;
    const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

    let summary = `✅ *Order Confirmed!*\n\nOrder #: *${orderNum}*\n\n`;
    session.cart.forEach((item, i) => {
      summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    summary += `\nSubtotal: Rs ${cartTotal.toFixed(2)}`;
    if (deliveryFee > 0) {
      summary += `\nDelivery: Rs ${deliveryFee}`;
    }
    summary += `\n*Grand Total: Rs ${grandTotal.toFixed(2)}*`;
    summary += `\n\n👤 Name: ${session.name}`;
    summary += `\n📱 Phone: ${session.phone}`;
    if (session.deliveryType === 'delivery') {
      summary += `\n🛵 Delivery: ${session.address}`;
      summary += `\nDelivery Charges: Rs ${DELIVERY_CHARGE}`;
    } else {
      summary += `\n🚗 Pickup from pharmacy`;
    }
    summary += `\n💳 Payment: Cash on ${session.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}`;
    summary += `\n\nTrack with order #: *${orderNum}*`;

    session.cart = [];
    session.stage = 'ready_to_order';

    await sendWhatsAppText(from, phoneNumberId, summary);
    return;
  }

  // ── 9. MEDICINE SEARCH ─────────────────────────────────────────────
  const medResults = searchMedicineByName(msg, medicines);
  if (medResults.length > 0) {
    let response = `💊 *Found ${medResults.length} medicine(s):*\n\n`;
    medResults.forEach((med, i) => {
      response += `${i + 1}. *${med.name}*\n`;
      response += `   💰 Rs ${med.price.toFixed(2)} / tablet\n`;
      response += `   📦 Stock: ${med.stock} units\n`;
      response += `   ${med.prescriptionRequired ? '⚠️ Rx Medicine' : '✅ OTC (No prescription)'}\n\n`;
    });
    response += `To order, type quantity + name\nExample: "2 ${medResults[0].name}" → Rs ${(medResults[0].price * 2).toFixed(2)} total`;
    await sendWhatsAppText(from, phoneNumberId, response);
    return;
  }

  // ── 10. AI FALLBACK ────────────────────────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  if (apiKey) {
    try {
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
      if (reply) {
        await sendWhatsAppText(from, phoneNumberId, reply);
        return;
      }
    } catch (e) {
      console.error('AI fallback error:', e);
    }
  }

  await sendWhatsAppText(from, phoneNumberId,
    `I can help you with:\n💊 Search medicines by name\n🛒 Order: type "2 Panadol 500mg"\n📦 Track orders\n\nWhat would you like?`
  );
}
