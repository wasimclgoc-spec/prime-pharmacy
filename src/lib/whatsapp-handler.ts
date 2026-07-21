import { searchMedicineByName, findMedicineForOrder } from './whatsapp-utils';
import { medicines } from './whatsapp-inventory';
import { sendWhatsAppText } from './whatsapp-client';
import { createOrder, findOrderByNumber, cancelOrder, rescheduleOrder, editOrder } from './whatsapp-orders';

interface CartItem { medicineId: string; name: string; price: number; quantity: number }
interface WhatsAppSession {
  name: string;
  phone: string;
  address: string;
  deliveryType: string;
  cart: CartItem[];
  stage: string;
  lastActivity: number;
  editOrderNumber: string;
}

const DELIVERY_CHARGE = 20;
const sessions = new Map<string, WhatsAppSession>();

function getSession(from: string): WhatsAppSession {
  let session = sessions.get(from);
  if (!session) {
    session = { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting', lastActivity: Date.now(), editOrderNumber: '' };
    sessions.set(from, session);
  }
  session.lastActivity = Date.now();
  return session;
}

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

  // ── STAGE: edit_order_awaiting_items ─────────────────────────────
  if (session.stage === 'edit_order_awaiting_items') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    const itemTexts = msg.split(',').map(s => s.trim()).filter(Boolean);
    const newItems: CartItem[] = [];
    let parseError = '';
    for (const itemText of itemTexts) {
      const m = itemText.match(/^(\d+)\s+(.+)$/i);
      if (!m) { parseError = 'Format: "2 Panadol 500mg, 1 Amoxicillin"'; break; }
      const qty = parseInt(m[1]);
      const results = searchMedicineByName(m[2].trim(), medicines);
      if (results.length === 0) { parseError = `Medicine not found: ${m[2]}`; break; }
      newItems.push({ medicineId: results[0].id, name: results[0].name, price: results[0].price, quantity: qty });
    }
    if (parseError) { await sendWhatsAppText(from, phoneNumberId, `❌ ${parseError}\n\nTry again. Format: "2 Panadol 500mg, 1 Amoxicillin 500mg"`); return; }
    editOrder(session.editOrderNumber, { items: newItems });
    const updated = findOrderByNumber(session.editOrderNumber);
    session.stage = 'greeting'; session.editOrderNumber = '';
    await sendWhatsAppText(from, phoneNumberId,
      `✅ *Order Updated!*\n\nOrder #: ${updated.orderNumber}\nItems:\n${updated.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: Rs ${updated.subtotal.toFixed(2)}\nDelivery: Rs ${updated.deliveryFee}\n*Total: Rs ${updated.total.toFixed(2)}*`);
    return;
  }

  // ── STAGE: reschedule_awaiting_time ───────────────────────────────
  if (session.stage === 'reschedule_awaiting_time') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    rescheduleOrder(session.editOrderNumber, msg);
    session.stage = 'greeting'; session.editOrderNumber = '';
    await sendWhatsAppText(from, phoneNumberId,
      `✅ *Order Rescheduled!*\n\nOrder #: ${order.orderNumber}\nNew time: *${msg}*\n\nWe'll prepare your order for the new time.`);
    return;
  }

  // ── STAGE: edit_awaiting_choice ──────────────────────────────────
  if (session.stage === 'edit_awaiting_choice') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    if (lower.includes('item') || lower.includes('medicine') || lower.includes('1')) {
      session.stage = 'edit_order_awaiting_items';
      await sendWhatsAppText(from, phoneNumberId,
        `📝 *Edit items for ${order.orderNumber}*\n\nCurrent items:\n${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity}`).join('\n')}\n\nType new items (comma separated):\nExample: "2 ${order.items[0]?.name || 'Panadol 500mg'}, 1 Amoxicillin 500mg"`);
      return;
    }
    if (lower.includes('delivery') || lower.includes('address') || lower.includes('2')) {
      if (order.deliveryType === 'delivery') {
        session.stage = 'edit_awaiting_address';
        await sendWhatsAppText(from, phoneNumberId, `📍 Current address: ${order.address}\n\nType new delivery address:`); return;
      } else {
        editOrder(session.editOrderNumber, { deliveryType: 'delivery' });
        session.stage = 'edit_awaiting_address';
        await sendWhatsAppText(from, phoneNumberId, `🛵 Switched to delivery (Rs ${DELIVERY_CHARGE} charges).\n\nType delivery address:`); return;
      }
    }
    if (lower.includes('pickup') || lower.includes('3')) {
      editOrder(session.editOrderNumber, { deliveryType: 'pickup' });
      const updated = findOrderByNumber(session.editOrderNumber);
      session.stage = 'greeting'; session.editOrderNumber = '';
      await sendWhatsAppText(from, phoneNumberId,
        `✅ *Order Updated!*\n\nOrder #: ${updated.orderNumber}\nChanged to pickup (no delivery charges)\n*Total: Rs ${updated.total.toFixed(2)}*`);
      return;
    }
    await sendWhatsAppText(from, phoneNumberId, `What would you like to edit?\n1️⃣ Items\n2️⃣ Delivery address\n3️⃣ Switch to pickup\n\nType 1, 2, or 3.`);
    return;
  }

  // ── STAGE: edit_awaiting_address ──────────────────────────────────
  if (session.stage === 'edit_awaiting_address') {
    editOrder(session.editOrderNumber, { address: msg });
    const updated = findOrderByNumber(session.editOrderNumber);
    session.stage = 'greeting'; session.editOrderNumber = '';
    await sendWhatsAppText(from, phoneNumberId,
      `✅ *Order Updated!*\n\nOrder #: ${updated.orderNumber}\nNew address: ${updated.address}\n*Total: Rs ${updated.total.toFixed(2)}*`);
    return;
  }

  // ── 1. GREETING ────────────────────────────────────────────────────
  const isGreeting = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon)[\s!.]*$/i.test(msg);
  if (isGreeting) {
    Object.assign(session, { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting', editOrderNumber: '' });
    await sendWhatsAppText(from, phoneNumberId,
      `👋 Welcome to Prime Pharmacy!\n\nI can help you with:\n💊 Search medicines by name\n🛒 Place orders\n📦 Track orders (type "track ORD-XXXXX")\n❌ Cancel order\n🔄 Reschedule order\n✏️ Edit order\n\nType a medicine name to search!`);
    return;
  }

  // ── 2. IMAGE → prescription ───────────────────────────────────────
  if (msg.includes('[IMAGE]') || msg.includes('[IMAGE_RECEIVED]')) {
    await sendWhatsAppText(from, phoneNumberId, `✅ Prescription received! Our pharmacist will review it.\n\nNow type a medicine name to search or add to cart.`);
    return;
  }

  // ── 3. TRACK ORDER ─────────────────────────────────────────────────
  if (lower.startsWith('track') || lower.startsWith('order ') || /^ord-/i.test(msg)) {
    const orderNum = msg.replace(/^(track|order|order\s+no|order\s+#)\s*/i, '').trim().toUpperCase() || msg.toUpperCase();
    const order = findOrderByNumber(orderNum);
    if (order) {
      let summary = `📦 *Order Status*\n\nOrder #: *${order.orderNumber}*\nStatus: *${order.status}*\nPayment: ${order.paymentStatus}\n\nItems:\n`;
      order.items.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
      summary += `\nSubtotal: Rs ${order.subtotal.toFixed(2)}`;
      if (order.deliveryFee > 0) summary += `\nDelivery: Rs ${order.deliveryFee}`;
      summary += `\n*Total: Rs ${order.total.toFixed(2)}*`;
      summary += `\n\n👤 ${order.customerName}\n📱 ${order.phone}`;
      if (order.deliveryType === 'delivery') summary += `\n🛵 ${order.address}`; else summary += `\n🚗 Pickup`;
      if (order.notes) summary += `\n📝 ${order.notes}`;
      if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
        summary += `\n\nAvailable actions:\n❌ "cancel ${order.orderNumber}"\n🔄 "reschedule ${order.orderNumber}"\n✏️ "edit ${order.orderNumber}"`;
      }
      await sendWhatsAppText(from, phoneNumberId, summary); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `❌ Order not found. Please check your order number.\nExample: "track ORD-12345"`);
    return;
  }

  // ── 4. CANCEL ORDER ───────────────────────────────────────────────
  if (lower.startsWith('cancel')) {
    const orderNum = msg.replace(/^cancel\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "cancel ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered') { await sendWhatsAppText(from, phoneNumberId, `❌ Cannot cancel a delivered order.`); return; }
    if (order.status === 'Cancelled') { await sendWhatsAppText(from, phoneNumberId, `This order is already cancelled.`); return; }
    cancelOrder(orderNum);
    const updated = findOrderByNumber(orderNum);
    await sendWhatsAppText(from, phoneNumberId,
      `✅ *Order Cancelled!*\n\nOrder #: ${updated.orderNumber}\nStatus: ${updated.status}\nRefund: ${updated.paymentStatus}\n\nType "hi" to start a new order.`);
    return;
  }

  // ── 5. RESCHEDULE ORDER ───────────────────────────────────────────
  if (lower.startsWith('reschedule')) {
    const orderNum = msg.replace(/^reschedule\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "reschedule ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      await sendWhatsAppText(from, phoneNumberId, `❌ Cannot reschedule a ${order.status.toLowerCase()} order.`); return;
    }
    session.editOrderNumber = orderNum;
    session.stage = 'reschedule_awaiting_time';
    await sendWhatsAppText(from, phoneNumberId,
      `🔄 *Reschedule ${orderNum}*\n\nWhen would you like it?\nExample: "Tomorrow 3pm" or "26 July 10am"`);
    return;
  }

  // ── 6. EDIT ORDER ─────────────────────────────────────────────────
  if (lower.startsWith('edit')) {
    const orderNum = msg.replace(/^edit\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "edit ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      await sendWhatsAppText(from, phoneNumberId, `❌ Cannot edit a ${order.status.toLowerCase()} order.`); return;
    }
    session.editOrderNumber = orderNum;
    session.stage = 'edit_awaiting_choice';
    await sendWhatsAppText(from, phoneNumberId,
      `✏️ *Edit ${orderNum}*\n\nWhat would you like to change?\n1️⃣ Items (add/remove medicines)\n2️⃣ Delivery address\n3️⃣ Switch to pickup (no charges)\n\nType 1, 2, or 3.`);
    return;
  }

  // ── 7. ORDER FIRST: "10 Amoxicillin 500mg" ─────────────────────────
  // Match patterns: "5 Panadol", "I need 5 Panadol", "give me 5 Panadol", "order 10 Claritin 500mg"
    const orderMatch = msg.match(/(?:^|(?:i\s+(?:need|want|order|would\s+like)\s+|give\s+me\s+|order\s+))(\d+)\s+([a-zA-Z].+)$/i);
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
          `✅ Added to cart:\n*${med.name}* × ${quantity}\n   Rs ${med.price.toFixed(2)}/tablet × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 *Cart Total: Rs ${cartTotal.toFixed(2)}*\n\n${rxPrompt}\n\nTo continue, please tell me your *full name*:\nExample: "Ahmed Khan"`);
        return;
      }
      await sendWhatsAppText(from, phoneNumberId,
        `✅ Added to cart:\n*${med.name}* × ${quantity}\n   Rs ${med.price.toFixed(2)}/tablet × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n\n🛒 *Cart Total: Rs ${cartTotal.toFixed(2)}*\n\n${rxPrompt}\n\nType "confirm order" to checkout, or add more medicines.`);
      return;
    }
  }

  // ── 8. STAGE: asking_name ─────────────────────────────────────────
  if (session.stage === 'asking_name') {
    session.name = msg; session.stage = 'asking_phone';
    await sendWhatsAppText(from, phoneNumberId, `Nice to meet you, *${session.name}*! 🙌\n\nPlease share your mobile number:\nExample: "03001234567"`); return;
  }

  // ── 9. STAGE: asking_phone ────────────────────────────────────────
  if (session.stage === 'asking_phone') {
    const phoneMatch = msg.match(/[\d\s+\-]{8,}/);
    if (phoneMatch) {
      session.phone = phoneMatch[0].replace(/\s/g, ''); session.stage = 'asking_delivery';
      await sendWhatsAppText(from, phoneNumberId,
        `Got it! 📱 ${session.phone}\n\nHow would you like to receive your order?\n\nType:\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ${DELIVERY_CHARGE} charges)`); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `Please send a valid mobile number.\nExample: "03001234567"`); return;
  }

  // ── 10. STAGE: asking_delivery ────────────────────────────────────
  if (session.stage === 'asking_delivery') {
    if (lower.includes('pickup') || lower.includes('collect') || lower.includes('pick')) {
      session.deliveryType = 'pickup'; session.stage = 'ready_to_checkout';
      const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      await sendWhatsAppText(from, phoneNumberId,
        `🚗 Pickup selected — no delivery charges.\n\n🛒 *Order Summary:*\n${session.cart.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: Rs ${cartTotal.toFixed(2)}\nDelivery: Rs 0\n*Total: Rs ${cartTotal.toFixed(2)}*\n\nType "confirm order" to place your order.`); return;
    }
    if (lower.includes('delivery') || lower.includes('home') || lower.includes('deliver')) {
      session.deliveryType = 'delivery'; session.stage = 'asking_address';
      await sendWhatsAppText(from, phoneNumberId,
        `🛵 Delivery selected — Rs ${DELIVERY_CHARGE} charges.\n\nPlease share your delivery address:\nExample: "House 12, Street 5, Gulberg, Lahore"`); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `Please type:\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ${DELIVERY_CHARGE} charges)`); return;
  }

  // ── 11. STAGE: asking_address ─────────────────────────────────────
  if (session.stage === 'asking_address') {
    session.address = msg; session.stage = 'ready_to_checkout';
    const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const grandTotal = cartTotal + DELIVERY_CHARGE;
    await sendWhatsAppText(from, phoneNumberId,
      `📍 Address saved!\n\n🛒 *Order Summary:*\n${session.cart.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\nSubtotal: Rs ${cartTotal.toFixed(2)}\nDelivery: Rs ${DELIVERY_CHARGE}\n*Total: Rs ${grandTotal.toFixed(2)}*\n\nType "confirm order" to place your order.`); return;
  }

  // ── 12. CONFIRM ORDER ─────────────────────────────────────────────
  if (/confirm|place order|checkout/i.test(msg) && session.cart.length > 0) {
    if (!session.name) { session.stage = 'asking_name'; await sendWhatsAppText(from, phoneNumberId, `Let's complete your order! 📝\n\nPlease tell me your *full name*:`); return; }
    if (!session.phone) { session.stage = 'asking_phone'; await sendWhatsAppText(from, phoneNumberId, `Please share your *mobile number*:`); return; }
    if (!session.deliveryType) { session.stage = 'asking_delivery'; await sendWhatsAppText(from, phoneNumberId, `How would you like to receive your order?\n\n🚗 *pickup*\n🛵 *delivery* (Rs ${DELIVERY_CHARGE})`); return; }
    if (session.deliveryType === 'delivery' && !session.address) { session.stage = 'asking_address'; await sendWhatsAppText(from, phoneNumberId, `Please share your *delivery address*:`); return; }

    const cartTotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = session.deliveryType === 'delivery' ? DELIVERY_CHARGE : 0;
    const grandTotal = cartTotal + deliveryFee;
    const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

    createOrder({
      id: orderNum, orderNumber: orderNum,
      customerName: session.name, phone: session.phone,
      address: session.address || 'Pickup from pharmacy',
      deliveryType: session.deliveryType,
      items: [...session.cart], subtotal: cartTotal, deliveryFee, total: grandTotal,
      status: 'Pending', paymentStatus: 'Unpaid',
      paymentMethod: session.deliveryType === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup',
      notes: '', createdAt: new Date().toISOString(), source: 'WhatsApp',
    });

    let summary = `✅ *Order Confirmed!*\n\nOrder #: *${orderNum}*\n\nItems:\n`;
    session.cart.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
    summary += `\nSubtotal: Rs ${cartTotal.toFixed(2)}`;
    if (deliveryFee > 0) summary += `\nDelivery: Rs ${deliveryFee}`;
    summary += `\n*Grand Total: Rs ${grandTotal.toFixed(2)}*`;
    summary += `\n\n👤 Name: ${session.name}\n📱 Phone: ${session.phone}`;
    if (session.deliveryType === 'delivery') { summary += `\n🛵 Delivery: ${session.address}\nDelivery Charges: Rs ${DELIVERY_CHARGE}`; }
    else { summary += `\n🚗 Pickup from pharmacy`; }
    summary += `\n💳 Payment: ${session.deliveryType === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup'}`;
    summary += `\n\nTrack: "track ${orderNum}"\nCancel: "cancel ${orderNum}"\nEdit: "edit ${orderNum}"`;

    session.cart = []; session.stage = 'ready_to_order';
    await sendWhatsAppText(from, phoneNumberId, summary); return;
  }

  // ── 13. MEDICINE SEARCH ───────────────────────────────────────────
  const medResults = searchMedicineByName(msg, medicines);
  if (medResults.length > 0) {
    let response = `💊 *Found ${medResults.length} medicine(s):*\n\n`;
    medResults.forEach((med, i) => {
      response += `${i + 1}. *${med.name}*\n   💰 Rs ${med.price.toFixed(2)} / tablet\n   📦 Stock: ${med.stock} units\n   ${med.prescriptionRequired ? '⚠️ Rx Medicine' : '✅ OTC (No prescription)'}\n\n`;
    });
    response += `To order, type quantity + name\nExample: "2 ${medResults[0].name}" → Rs ${(medResults[0].price * 2).toFixed(2)} total`;
    await sendWhatsAppText(from, phoneNumberId, response); return;
  }

  // ── 14. AI FALLBACK ───────────────────────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  if (apiKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://prime-pharmacy.vercel.app' },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: `You are Prime Pharmacy WhatsApp bot. Keep replies under 3 lines. Customer: ${session.name || 'unknown'}.` },
            { role: 'user', content: msg }
          ],
          max_tokens: 150,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) { await sendWhatsAppText(from, phoneNumberId, reply); return; }
    } catch (e) { console.error('AI fallback error:', e); }
  }

  await sendWhatsAppText(from, phoneNumberId,
    `I can help you with:\n💊 Search medicines by name\n🛒 Order: "2 Panadol 500mg"\n📦 Track: "track ORD-12345"\n❌ Cancel: "cancel ORD-12345"\n🔄 Reschedule: "reschedule ORD-12345"\n✏️ Edit: "edit ORD-12345"\n\nWhat would you like?`);
}
