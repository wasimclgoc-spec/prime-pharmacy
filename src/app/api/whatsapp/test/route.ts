import { NextRequest, NextResponse } from 'next/server';
import { searchMedicineByName, findMedicineForOrder, findSubstitutes, findMedicineIncludingOutOfStock } from '@/lib/whatsapp-utils';
import { medicines } from '@/lib/whatsapp-inventory';
import { createOrder, findOrderByNumber, cancelOrder, rescheduleOrder, editOrder, getOrders } from '@/lib/whatsapp-orders';
import { PHARMACY_KB } from '@/lib/ai-knowledge-base';

interface CartItem { medicineId: string; name: string; price: number; quantity: number }
interface TestSession {
  name: string;
  phone: string;
  address: string;
  deliveryType: string;
  cart: CartItem[];
  stage: string;
  lastActivity: number;
  editOrderNumber: string;
  paymentMethod: string;
  pendingItems: { name: string; quantity: number }[];
  pendingMultiMed: boolean;
  pendingPrescription: boolean;
}

const DELIVERY_CHARGE = 20;
const FREE_DELIVERY_THRESHOLD = 1000;
declare global { var __testSessions: Map<string, TestSession> | undefined; }
if (!globalThis.__testSessions) globalThis.__testSessions = new Map<string, TestSession>();
const testSessions = globalThis.__testSessions;

function getSession(userId: string): TestSession {
  let session = testSessions.get(userId);
  if (!session) {
    session = {
      name: '', phone: '', address: '', deliveryType: '', cart: [],
      stage: 'greeting', lastActivity: Date.now(), editOrderNumber: '',
      paymentMethod: '', pendingItems: [], pendingMultiMed: false, pendingPrescription: false
    };
    testSessions.set(userId, session);
  }
  session.lastActivity = Date.now();
  return session;
}

function cartTotal(session: TestSession): number {
  return session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
}

function calcDeliveryFee(subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_CHARGE;
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
    const lower = msg.toLowerCase();

    // ── EDIT ORDER FLOW (stages) ──────────────────────────────────────
    // ── ADD ITEMS to existing order (merge, don't replace) ──────────
    if (session.stage === 'edit_add_items') {
      const order = findOrderByNumber(session.editOrderNumber);
      if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; return NextResponse.json({ reply: `❌ Order not found.` }); }

      const previousTotal = order.total;
      const previousSubtotal = order.subtotal;

      const itemTexts = msg.split(',').map(s => s.trim()).filter(Boolean);
      const addItems: CartItem[] = [];
      let parseError = '';
      for (const itemText of itemTexts) {
        const m = itemText.match(/^(\d+)\s+(.+)$/i);
        if (!m) { parseError = 'Format: "2 Panadol 500mg, 1 Amoxicillin"'; break; }
        const qty = parseInt(m[1]);
        const med = findMedicineForOrder(m[2].trim(), medicines);
        if (!med) { parseError = `Not found: ${m[2]}`; break; }
        if (med.stock < qty) { parseError = `Only ${med.stock} units of ${med.name} available`; break; }
        addItems.push({ medicineId: med.id, name: med.name, price: med.price, quantity: qty });
      }
      if (parseError) return NextResponse.json({ reply: `❌ ${parseError}\n\nTry: "2 Panadol 500mg, 1 Amoxicillin 500mg"` });

      // ADD items to existing order (merge, don't replace)
      editOrder(session.editOrderNumber, { addItems });
      const updated = findOrderByNumber(session.editOrderNumber);
      session.stage = 'edit_reconfirm'; // Go to reconfirm stage

      // Show reconfirmation with old vs new amounts
      let summary = `📋 *Order Updated — Reconfirmation Required*

Order #: *${updated.orderNumber}*

`;
      summary += `*Previous items:*
${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}
`;
      summary += `*Previous Total: Rs ${previousTotal.toFixed(2)}*

`;
      summary += `*Added items:*
${addItems.map((i, idx) => `+ ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}
`;
      summary += `Added Amount: Rs ${addItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}

`;
      summary += `*Updated items:*
${updated.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}
`;
      summary += `
Subtotal: Rs ${updated.subtotal.toFixed(2)}`;
      summary += `\nDelivery: Rs ${updated.deliveryFee}${updated.deliveryFee === 0 ? ' (Free!)' : ''}`;
      summary += `\n*New Total: Rs ${updated.total.toFixed(2)}*`;
      summary += `\n\n👤 ${updated.customerName} | 📱 ${updated.phone}`;
      summary += `\n🚚 ${updated.deliveryType === 'delivery' ? 'Delivery: ' + updated.address : 'Pickup'}`;
      summary += `\n💳 ${updated.paymentMethod}`;
      summary += `\n\nReply *"confirm"* to confirm updated order, or *"cancel"* to revert.`;

      // Store previous state for revert
      (session as any)._revertItems = order.items;
      (session as any)._revertSubtotal = previousSubtotal;
      (session as any)._revertTotal = previousTotal;

      return NextResponse.json({ reply: summary });
    }

    // ── REMOVE ITEMS from existing order ───────────────────────────
    if (session.stage === 'edit_remove_items') {
      const order = findOrderByNumber(session.editOrderNumber);
      if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; return NextResponse.json({ reply: `❌ Order not found.` }); }

      const previousTotal = order.total;
      const indicesToRemove = msg.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < order.items.length);
      if (indicesToRemove.length === 0) return NextResponse.json({ reply: `Invalid selection. Type item number(s) to remove.
Example: "1" or "1, 3"` });

      const removedNames = indicesToRemove.map(i => order.items[i].name);
      const remainingItems = order.items.filter((_, idx) => !indicesToRemove.includes(idx));

      if (remainingItems.length === 0) return NextResponse.json({ reply: `❌ Cannot remove all items. Use "cancel ${order.orderNumber}" to cancel the order.` });

      editOrder(session.editOrderNumber, { items: remainingItems });
      const updated = findOrderByNumber(session.editOrderNumber);
      session.stage = 'edit_reconfirm';
      (session as any)._revertItems = order.items;
      (session as any)._revertTotal = previousTotal;

      let summary = `📋 *Order Updated — Reconfirmation Required*

Order #: *${updated.orderNumber}*

`;
      summary += `*Removed:* ${removedNames.join(', ')}

`;
      summary += `*Previous Total: Rs ${previousTotal.toFixed(2)}*

`;
      summary += `*Updated items:*
${updated.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}
`;
      summary += `
*New Total: Rs ${updated.total.toFixed(2)}*
`;
      summary += `\n\nReply *"confirm"* to confirm, or *"cancel"* to revert.`;
      return NextResponse.json({ reply: summary });
    }

    // ── RECONFIRM after edit ────────────────────────────────────────
    if (session.stage === 'edit_reconfirm') {
      const order = findOrderByNumber(session.editOrderNumber);
      if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; return NextResponse.json({ reply: `❌ Order not found.` }); }

      if (/^confirm$/i.test(msg) || /^yes$/i.test(msg) || /^ok$/i.test(msg)) {
        session.stage = 'greeting'; session.editOrderNumber = '';
        let summary = `✅ *Order Reconfirmed!*

Order #: *${order.orderNumber}*

`;
        order.items.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
        summary += `\n*Total: Rs ${order.total.toFixed(2)}*`;
        summary += `\n\n👤 ${order.customerName} | 📱 ${order.phone}`;
        summary += `\n🚚 ${order.deliveryType === 'delivery' ? order.address : 'Pickup'}`;
        summary += `\n💳 ${order.paymentMethod}`;
        summary += `\n\nTrack: "track ${order.orderNumber}"`;
        return NextResponse.json({ reply: summary });
      }
      if (/^cancel$/i.test(msg) || /^revert$/i.test(msg) || /^no$/i.test(msg)) {
        // Revert to previous state
        const revertItems = (session as any)._revertItems;
        const revertTotal = (session as any)._revertTotal;
        if (revertItems) {
          editOrder(session.editOrderNumber, { items: revertItems });
        }
        session.stage = 'greeting'; session.editOrderNumber = '';
        return NextResponse.json({ reply: `↩️ *Reverted!* Order is back to previous state.

Track: "track ${order.orderNumber}"` });
      }
      return NextResponse.json({ reply: `Reply *"confirm"* to keep changes, or *"cancel"* to revert.` });
    }

    if (session.stage === 'reschedule_awaiting_time') {
      const order = findOrderByNumber(session.editOrderNumber);
      if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; return NextResponse.json({ reply: `❌ Order not found.` }); }
      rescheduleOrder(session.editOrderNumber, msg);
      session.stage = 'greeting'; session.editOrderNumber = '';
      return NextResponse.json({ reply: `✅ *Order Rescheduled!*\n\nOrder #: ${order.orderNumber}\nNew time: *${msg}*\n\nWe'll prepare your order for the new time.` });
    }

    if (session.stage === 'edit_awaiting_choice') {
      const order = findOrderByNumber(session.editOrderNumber);
      if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; return NextResponse.json({ reply: `❌ Order not found.` }); }
      if (lower.includes('item') || lower.includes('1')) {
        session.stage = 'edit_order_awaiting_items';
        return NextResponse.json({
          reply: `📝 *Edit items for ${order.orderNumber}*\n\nCurrent:\n${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity}`).join('\n')}\n\nType new items (comma separated):\nExample: "2 ${order.items[0]?.name || 'Panadol 500mg'}, 1 Amoxicillin 500mg"`
        });
      }
      if (lower.includes('delivery') || lower.includes('address') || lower.includes('2')) {
        session.stage = 'edit_awaiting_address';
        return NextResponse.json({ reply: `📍 Current: ${order.address}\n\nType new delivery address:` });
      }
      if (lower.includes('pickup') || lower.includes('3')) {
        editOrder(session.editOrderNumber, { deliveryType: 'pickup' });
        const updated = findOrderByNumber(session.editOrderNumber);
        session.stage = 'greeting'; session.editOrderNumber = '';
        return NextResponse.json({ reply: `✅ Changed to pickup.\n*Total: Rs ${updated.total.toFixed(2)}*` });
      }
      return NextResponse.json({ reply: `What would you like to edit?\n1️⃣ Items\n2️⃣ Delivery address\n3️⃣ Switch to pickup\n\nType 1, 2, or 3.` });
    }

    if (session.stage === 'edit_awaiting_address') {
      editOrder(session.editOrderNumber, { address: msg });
      const updated = findOrderByNumber(session.editOrderNumber);
      session.stage = 'greeting'; session.editOrderNumber = '';
      return NextResponse.json({ reply: `✅ Address updated!\n\nOrder #: ${updated.orderNumber}\nNew address: ${updated.address}\n*Total: Rs ${updated.total.toFixed(2)}*` });
    }

    // ── 1. GREETING (full reset) ─────────────────────────────────────
    const isGreeting = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon|marhaba)[\s!.]*$/i.test(msg);
    if (isGreeting) {
      Object.assign(session, {
        name: '', phone: '', address: '', deliveryType: '', cart: [],
        stage: 'greeting', editOrderNumber: '', paymentMethod: '',
        pendingItems: [], pendingMultiMed: false, pendingPrescription: false
      });
      const namePart = session.name ? `Welcome back, ${session.name}! ` : '';
      return NextResponse.json({
        reply: `👋 ${namePart}Welcome to Prime Pharmacy!\n\nI can help you:\n💊 Search & order medicines\n📦 Track / cancel / edit orders\n\nType medicine name + quantity to order.\nExample: "5 Glucophage" or "I need 10 Panadol 500mg"`
      });
    }

    // ── 2. IMAGE / PRESCRIPTION ──────────────────────────────────────
    if (msg.includes('[IMAGE_RECEIVED]') || msg.includes('[IMAGE]')) {
      return NextResponse.json({
        reply: `✅ Prescription received! Our pharmacist will verify it before dispatch.\n\nYou can continue ordering — type medicine name + quantity.`
      });
    }

    // ── 3. TRACK ORDER ───────────────────────────────────────────────
    if (lower.startsWith('track') || /^ord-/i.test(msg)) {
      const orderNum = msg.replace(/^track\s*/i, '').trim().toUpperCase();
      const order = findOrderByNumber(orderNum);
      if (order) {
        let summary = `📦 *Order Status*\n\nOrder #: *${order.orderNumber}*\nStatus: *${order.status}*\nPayment: ${order.paymentStatus}\n\n`;
        order.items.forEach((item, i) => {
          summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        summary += `\nSubtotal: Rs ${order.subtotal.toFixed(2)}`;
        if (order.deliveryFee > 0) summary += `\nDelivery: Rs ${order.deliveryFee}`;
        summary += `\n*Total: Rs ${order.total.toFixed(2)}*`;
        summary += `\n\n👤 ${order.customerName}\n📱 ${order.phone}`;
        if (order.deliveryType === 'delivery') summary += `\n🛵 ${order.address}`;
        else summary += `\n🚗 Pickup`;
        if (order.notes) summary += `\n📝 ${order.notes}`;
        if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
          summary += `\n\n❌ "cancel ${order.orderNumber}"\n🔄 "reschedule ${order.orderNumber}"\n✏️ "edit ${order.orderNumber}"`;
        }
        return NextResponse.json({ reply: summary });
      }
      return NextResponse.json({ reply: `❌ Order not found.\nExample: "track ORD-12345"` });
    }

    // ── 4. CANCEL ORDER ──────────────────────────────────────────────
    if (lower.startsWith('cancel')) {
      const orderNum = msg.replace(/^cancel\s+/i, '').trim().toUpperCase();
      if (!orderNum) return NextResponse.json({ reply: `Type: "cancel ORD-XXXXX"` });
      const order = findOrderByNumber(orderNum);
      if (!order) return NextResponse.json({ reply: `❌ Order ${orderNum} not found.` });
      if (order.status === 'Delivered') return NextResponse.json({ reply: `❌ Cannot cancel a delivered order.` });
      if (order.status === 'Cancelled') return NextResponse.json({ reply: `Already cancelled.` });
      cancelOrder(orderNum);
      return NextResponse.json({ reply: `✅ *Order Cancelled!*\n\nOrder #: ${orderNum}\nRefund: ${order.paymentStatus}\n\nType "hi" to start a new order.` });
    }

    // ── 5. RESCHEDULE ────────────────────────────────────────────────
    if (lower.startsWith('reschedule')) {
      const orderNum = msg.replace(/^reschedule\s+/i, '').trim().toUpperCase();
      if (!orderNum) return NextResponse.json({ reply: `Type: "reschedule ORD-XXXXX"` });
      const order = findOrderByNumber(orderNum);
      if (!order) return NextResponse.json({ reply: `❌ Order ${orderNum} not found.` });
      if (order.status === 'Delivered' || order.status === 'Cancelled') return NextResponse.json({ reply: `❌ Cannot reschedule a ${order.status.toLowerCase()} order.` });
      session.editOrderNumber = orderNum;
      session.stage = 'reschedule_awaiting_time';
      return NextResponse.json({ reply: `🔄 *Reschedule ${orderNum}*\n\nWhen would you like it?\nExample: "Tomorrow 3pm" or "26 July 10am"` });
    }

    // ── 6. EDIT ORDER ────────────────────────────────────────────────
    if (lower.startsWith('edit')) {
      const orderNum = msg.replace(/^edit\s+/i, '').trim().toUpperCase();
      if (!orderNum) return NextResponse.json({ reply: `Type: "edit ORD-XXXXX"` });
      const order = findOrderByNumber(orderNum);
      if (!order) return NextResponse.json({ reply: `❌ Order ${orderNum} not found.` });
      if (order.status === 'Delivered' || order.status === 'Cancelled') return NextResponse.json({ reply: `❌ Cannot edit a ${order.status.toLowerCase()} order.` });
      session.editOrderNumber = orderNum;
      session.stage = 'edit_awaiting_choice';
      return NextResponse.json({ reply: `✏️ *Edit ${orderNum}*\n\n1️⃣ Items\n2️⃣ Delivery address\n3️⃣ Switch to pickup\n\nType 1, 2, or 3.` });
    }

    // ── 7. STAGE: asking_name (must be BEFORE orderMatch) ──────────
    if (session.stage === 'asking_name') {
      // If the input looks like a medicine order, process it as order (user may have ignored the prompt)
      const looksLikeOrder = /^(?:(?:i\s+)?(?:need|want|order|would\s+like|give\s+me)\s+)?\d+\s+[a-zA-Z]/i.test(msg);
      if (!looksLikeOrder) {
        const name = msg.replace(/[^a-zA-Z\s.'-]/g, '').trim();
        if (name.length >= 2) {
          session.name = name.slice(0, 50);
          session.stage = 'asking_phone';
          return NextResponse.json({ reply: `Nice to meet you, *${session.name}*! 🙌\n\nPlease share your mobile number:\nExample: "03001234567"` });
        }
        return NextResponse.json({ reply: `Please tell me your full name.\nExample: "Ahmed Khan"` });
      }
      // Falls through to orderMatch below
    }

    // ── 8. STAGE: asking_phone (must be BEFORE orderMatch) ──────────
    if (session.stage === 'asking_phone') {
      const phoneMatch = msg.match(/[\d\s+\-]{8,}/);
      if (phoneMatch) {
        session.phone = phoneMatch[0].replace(/\s/g, '');
        session.stage = 'asking_delivery';
        return NextResponse.json({
          reply: 'Got it! 📱 ' + session.phone + '\n\nHow would you like to receive your order?\n\n🚗 *pickup* — Collect from pharmacy (no charge)\n🛵 *delivery* — Home delivery (Rs ' + DELIVERY_CHARGE + ', free above Rs ' + FREE_DELIVERY_THRESHOLD + ')'
        });
      }
      return NextResponse.json({ reply: `Please send a valid mobile number.\nExample: "03001234567"` });
    }

    // ── 9. STAGE: asking_delivery ────────────────────────────────────
    if (session.stage === 'asking_delivery') {
      if (/delivery|deliver|home|send/i.test(msg)) {
        session.deliveryType = 'delivery';
        session.stage = 'asking_address';
        return NextResponse.json({ reply: `📍 Please share your *delivery address*:` });
      }
      if (/pickup|pick up|collect|store/i.test(msg)) {
        session.deliveryType = 'pickup';
        session.stage = 'asking_payment';
        return NextResponse.json({ reply: `💳 *Payment method?*\n\n• *Cash*\n• *Easypaisa*\n• *JazzCash*\n• *Bank Transfer*` });
      }
      return NextResponse.json({ reply: `Please type *pickup* or *delivery*.` });
    }

    // ── 10. STAGE: asking_address ────────────────────────────────────
    if (session.stage === 'asking_address') {
      session.address = msg.trim();
      session.stage = 'asking_payment';
      return NextResponse.json({ reply: `💳 *Payment method?*\n\n• *Cash*\n• *Easypaisa*\n• *JazzCash*\n• *Bank Transfer*` });
    }

    // ── 11. STAGE: asking_payment ────────────────────────────────────
    if (session.stage === 'asking_payment') {
      const pm = msg.toLowerCase();
      if (/cash/.test(pm)) { session.paymentMethod = 'Cash'; }
      else if (/easy|easypaisa/.test(pm)) { session.paymentMethod = 'Easypaisa'; }
      else if (/jazz/.test(pm)) { session.paymentMethod = 'JazzCash'; }
      else if (/bank|transfer/.test(pm)) { session.paymentMethod = 'Bank Transfer'; }
      if (session.paymentMethod) {
        session.stage = 'ready_to_checkout';
        const total = cartTotal(session);
        const deliveryFee = session.deliveryType === 'delivery' && total < FREE_DELIVERY_THRESHOLD ? DELIVERY_CHARGE : 0;
        const grandTotal = total + deliveryFee;
        let summary = '✅ *Order Summary*\n\n';
        session.cart.forEach(item => { summary += '• ' + item.name + ' × ' + item.quantity + ' = Rs ' + (item.price * item.quantity).toFixed(2) + '\n'; });
        summary += '\n💰 Subtotal: Rs ' + total.toFixed(2);
        if (deliveryFee > 0) summary += '\n🛵 Delivery: Rs ' + deliveryFee.toFixed(2);
        summary += '\n💵 *Total: Rs ' + grandTotal.toFixed(2) + '*';
        summary += '\n💳 Payment: ' + session.paymentMethod;
        summary += '\n📦 ' + (session.deliveryType === 'delivery' ? '🛵 Delivery to: ' + session.address : '🚗 Pickup from pharmacy');
        summary += '\n\nType *confirm* to place your order, or add more medicines.';
        return NextResponse.json({ reply: summary });
      }
      return NextResponse.json({ reply: `Please choose: *Cash*, *Easypaisa*, *JazzCash*, or *Bank Transfer*` });
    }

    // ── ORDER: quantity + medicine name ─────────────────────────────
    const orderMatch = msg.match(/^(?:(?:i\s+)?(?:need|want|order|would\s+like|give\s+me)\s+)?(\d+)\s+(?:tablets?|capsules?|caps?|pcs?|pieces?|strips?|boxes?|of\s+)*\s*([a-zA-Z].+)$/i);
    if (orderMatch) {
      const quantity = parseInt(orderMatch[1]);
      const medName = orderMatch[2].replace(/^of\s+/i, '').trim();

      // Find in active inventory
      const med = findMedicineForOrder(medName, medicines);

      if (med) {
        // Check stock
        if (med.stock < quantity) {
          const subs = findSubstitutes(medName, medicines, med.id);
          let reply = `⚠️ Only *${med.stock} units* of *${med.name}* available.\n\nWould you like to order ${med.stock} instead? Type "${med.stock} ${med.name}"`;
          if (subs.length > 0) {
            reply += `\n\nOr try these alternatives:`;
            subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)}/tablet (${s.stock} in stock)`; });
          }
          return NextResponse.json({ reply });
        }

        // Add to cart
        session.cart.push({ medicineId: med.id, name: med.name, price: med.price, quantity });
        const total = cartTotal(session);
        session.stage = 'ordering';

        // Check if Rx required
        const rxNote = med.prescriptionRequired
          ? `⚠️ *${med.name}* requires a prescription. Please upload a photo or the order will be held for pharmacist verification.`
          : '';

        // First time: ask for name
        if (!session.name) {
          session.stage = 'asking_name';
          return NextResponse.json({
            reply: `✅ *${med.name}* × ${quantity}\n💰 Rs ${med.price.toFixed(2)}/tablet × ${quantity} = *Rs ${(med.price * quantity).toFixed(2)}*\n\n🛒 Cart Total: Rs ${total.toFixed(2)}\n${rxNote ? rxNote + '\n\n' : ''}Please tell me your *full name*:\nExample: "Ahmed Khan"`
          });
        }

        return NextResponse.json({
          reply: `✅ *${med.name}* × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n💰 Rs ${med.price.toFixed(2)}/tablet\n🛒 Cart Total: Rs ${total.toFixed(2)}\n${rxNote ? '\n' + rxNote : ''}\n\nAdd more medicines or type "confirm order" to checkout.`
        });
      } else {
        // Check if it exists but out of stock
        const outOfStockMed = findMedicineIncludingOutOfStock(medName, medicines);
        if (outOfStockMed) {
          const subs = findSubstitutes(medName, medicines, outOfStockMed.id);
          let reply = `❌ *${outOfStockMed.name}* is currently out of stock.`;
          if (subs.length > 0) {
            reply += `\n\nAvailable alternatives:`;
            subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)}/tablet ✅`; });
            reply += `\n\nType quantity + name to order an alternative.`;
          } else {
            reply += `\n\nNo alternatives available right now. Type another medicine name to search.`;
          }
          return NextResponse.json({ reply });
        }

        // Not found at all
        return NextResponse.json({
          reply: `❌ Sorry, *${medName}* is not available in our pharmacy right now.\n\nYou can:\n• Try a different name or generic name\n• Type a medicine name to search our inventory`
        });
      }
    }

    // ── 13. CONFIRM ORDER ───────────────────────────────────────────
    if (/^confirm$/i.test(msg) || /^place order$/i.test(msg) || /^checkout$/i.test(msg) || (session.stage === 'ready_to_checkout' && /^yes$/i.test(msg))) {
      if (session.cart.length === 0) return NextResponse.json({ reply: `Your cart is empty. Type a medicine name + quantity to order.\nExample: "5 Panadol 500mg"` });
      if (!session.name) { session.stage = 'asking_name'; return NextResponse.json({ reply: `Please tell me your *full name*:` }); }
      if (!session.phone) { session.stage = 'asking_phone'; return NextResponse.json({ reply: `Please share your *mobile number*:` }); }
      if (!session.deliveryType) { session.stage = 'asking_delivery'; return NextResponse.json({ reply: `🚗 pickup or 🛵 delivery?` }); }
      if (session.deliveryType === 'delivery' && !session.address) { session.stage = 'asking_address'; return NextResponse.json({ reply: `Please share your *delivery address*:` }); }
      if (!session.paymentMethod) { session.stage = 'asking_payment'; return NextResponse.json({ reply: `💳 Payment method?\n• Cash\n• Easypaisa\n• JazzCash\n• Bank Transfer` }); }

      const total = cartTotal(session);
      const deliveryFee = session.deliveryType === 'delivery' ? calcDeliveryFee(total) : 0;
      const grandTotal = total + deliveryFee;
      const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

      // Save to server-side store
      createOrder({
        id: orderNum, orderNumber: orderNum,
        customerName: session.name, phone: session.phone,
        address: session.address || 'Pickup from pharmacy',
        deliveryType: session.deliveryType,
        items: [...session.cart], subtotal: total, deliveryFee, total: grandTotal,
        status: 'Pending', paymentStatus: 'Unpaid',
        paymentMethod: session.paymentMethod,
        notes: '', createdAt: new Date().toISOString(), source: 'WhatsApp',
      });

      // Check for Rx items
      const hasRx = session.cart.some(item => {
        const med = medicines.find(m => m.id === item.medicineId);
        return med?.prescriptionRequired;
      });

      let summary = `✅ *Order Confirmed!*\n\nOrder #: *${orderNum}*\n\n`;
      session.cart.forEach((item, i) => {
        summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      summary += `\nSubtotal: Rs ${total.toFixed(2)}`;
      if (deliveryFee > 0) summary += `\nDelivery: Rs ${deliveryFee}`;
      else if (session.deliveryType === 'delivery') summary += `\nDelivery: Free!`;
      summary += `\n*Total: Rs ${grandTotal.toFixed(2)}*`;
      summary += `\n\n👤 ${session.name}\n📱 ${session.phone}`;
      if (session.deliveryType === 'delivery') {
        summary += `\n🛵 ${session.address}`;
        summary += `\n⏱️ Estimated delivery: 45-90 minutes`;
      } else {
        summary += `\n🚗 Pickup from pharmacy`;
        summary += `\n⏱️ Ready in 30 minutes`;
      }
      summary += `\n💳 ${session.paymentMethod}`;
      if (hasRx) {
        summary += `\n\n⚠️ Your order includes prescription medicines. Our pharmacist will verify before dispatch.`;
      }
      summary += `\n\nTrack: "track ${orderNum}"\nCancel: "cancel ${orderNum}"\nEdit: "edit ${orderNum}"`;

      session.cart = [];
      session.stage = 'ready_to_order';

      return NextResponse.json({ reply: summary });
    }

    // ── 14. ADD MORE TO CART (during ordering) ───────────────────────
    if (session.stage === 'ordering' || session.stage === 'ready_to_checkout' || session.stage === 'asking_payment') {
      // If they type just a medicine name (no quantity)
      const medResults = searchMedicineByName(msg, medicines);
      if (medResults.length > 0) {
        if (medResults.length === 1) {
          return NextResponse.json({
            reply: `Found: *${medResults[0].name}*\n💰 Rs ${medResults[0].price.toFixed(2)}/tablet\n📦 ${medResults[0].stock} in stock\n${medResults[0].prescriptionRequired ? '⚠️ Rx required\n' : ''}\nHow many would you like? Type quantity + name:\nExample: "2 ${medResults[0].name}"`
          });
        }
        let reply = `Found ${medResults.length} medicines:\n\n`;
        medResults.forEach((med, i) => {
          reply += `${i + 1}. *${med.name}*\n   Rs ${med.price.toFixed(2)}/tablet | ${med.stock} in stock${med.prescriptionRequired ? ' | ⚠️ Rx' : ''}\n`;
        });
        reply += `\nType quantity + medicine name to order.\nExample: "2 ${medResults[0].name}"`;
        return NextResponse.json({ reply });
      }
    }

    // ── 15. MEDICINE SEARCH (no quantity provided) ───────────────────
    const medResults = searchMedicineByName(msg, medicines);
    if (medResults.length > 0) {
      if (medResults.length === 1) {
        const med = medResults[0];
        return NextResponse.json({
          reply: `💊 *${med.name}*\n💰 Rs ${med.price.toFixed(2)}/tablet\n📦 ${med.stock} units in stock\n${med.prescriptionRequired ? '⚠️ Prescription required\n' : ''}\nTo order, type quantity + name:\nExample: "2 ${med.name}"`
        });
      }
      let reply = `💊 Found ${medResults.length} medicines:\n\n`;
      medResults.forEach((med, i) => {
        reply += `${i + 1}. *${med.name}*\n   Rs ${med.price.toFixed(2)}/tablet | ${med.stock} in stock${med.prescriptionRequired ? ' | ⚠️ Rx' : ''}\n`;
      });
      reply += `\nTo order, type quantity + name.\nExample: "2 ${medResults[0].name}"`;
      return NextResponse.json({ reply });
    }

    // ── 16. CHECK if medicine exists but out of stock ────────────────
    const outOfStockMed = findMedicineIncludingOutOfStock(msg, medicines);
    if (outOfStockMed) {
      const subs = findSubstitutes(msg, medicines, outOfStockMed.id);
      let reply = `❌ *${outOfStockMed.name}* is currently out of stock.`;
      if (subs.length > 0) {
        reply += `\n\nAvailable alternatives:`;
        subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)}/tablet ✅`; });
        reply += `\n\nType quantity + name to order an alternative.`;
      } else {
        reply += `\n\nNo alternatives available. Try another medicine name.`;
      }
      return NextResponse.json({ reply });
    }

    // ── 17. MEDICAL QUESTION → ESCALATE ──────────────────────────────
    const medicalKeywords = /symptom|diagnos|dosage|dose|side effect|interact|pregnan|breastfeed|allerg|headache|fever|pain|infection|disease|condition|treat|cure|medicine for|tablet for|prescription for/i;
    if (medicalKeywords.test(msg)) {
      return NextResponse.json({
        reply: `I'm Prime Pharmacy's ordering assistant — I can help you search and order medicines, but I can't provide medical advice.\n\nFor symptoms, dosage, or medical questions, please contact our pharmacist directly and they'll get back to you.\n\nWould you like to search for a medicine?`
      });
    }

    // ── 18. AI FALLBACK (OpenRouter) ────────────────────────────────
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (apiKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://prime-pharmacy.vercel.app' },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: `${PHARMACY_KB}\n\nYou are replying on WhatsApp for Prime Pharmacy. Keep replies under 3 lines. Customer name: ${session.name || 'unknown'}. Cart: ${session.cart.length} items.` },
            { role: 'user', content: msg }
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return NextResponse.json({ reply });
    }

    // ── 19. FINAL FALLBACK ──────────────────────────────────────────
    return NextResponse.json({
      reply: `Type a medicine name + quantity to order.\nExample: "5 Glucophage" or "I need 10 Panadol 500mg"\n\nOr just type a medicine name to search.`
    });

  } catch (error) {
    console.error('WhatsApp test error:', error);
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' });
  }
}
