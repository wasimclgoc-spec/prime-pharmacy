import { searchMedicineByName, findMedicineForOrder, findSubstitutes, findMedicineIncludingOutOfStock } from './whatsapp-utils';
import { medicines } from './whatsapp-inventory';
import { sendWhatsAppText } from './whatsapp-client';
import { createOrder, findOrderByNumber, cancelOrder, rescheduleOrder, editOrder } from './whatsapp-orders';
import { PHARMACY_KB } from './ai-knowledge-base';

interface CartItem { medicineId: string; name: string; price: number; quantity: number }
interface WhatsAppSession {
  name: string; phone: string; address: string; deliveryType: string;
  cart: CartItem[]; stage: string; lastActivity: number;
  editOrderNumber: string; paymentMethod: string;
}

const DELIVERY_CHARGE = 20;
const FREE_DELIVERY_THRESHOLD = 1000;
const sessions = new Map<string, WhatsAppSession>();

function getSession(from: string): WhatsAppSession {
  let session = sessions.get(from);
  if (!session) {
    session = { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting', lastActivity: Date.now(), editOrderNumber: '', paymentMethod: '' };
    sessions.set(from, session);
  }
  session.lastActivity = Date.now();
  return session;
}

function cartTotal(session: WhatsAppSession): number {
  return session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
}
function calcDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

// Auto-cleanup inactive sessions
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

  // ── EDIT FLOW ─────────────────────────────────────────────────────
  // ── ADD ITEMS to existing order (merge, don't replace) ──────────
  if (session.stage === 'edit_add_items') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    const previousTotal = order.total;
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
    if (parseError) { await sendWhatsAppText(from, phoneNumberId, `❌ ${parseError}`); return; }

    editOrder(session.editOrderNumber, { addItems });
    const updated = findOrderByNumber(session.editOrderNumber);
    session.stage = 'edit_reconfirm';
    (session as any)._revertItems = order.items;
    (session as any)._revertTotal = previousTotal;

    let summary = `📋 *Order Updated — Reconfirm?*\n\nOrder #: *${updated.orderNumber}*\n\n`;
    summary += `*Previous items:*\n${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n`;
    summary += `*Previous Total: Rs ${previousTotal.toFixed(2)}*\n\n`;
    summary += `*Added:*\n${addItems.map((i) => `+ ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\n`;
    summary += `*Updated items:*\n${updated.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n`;
    summary += `\n*New Total: Rs ${updated.total.toFixed(2)}*`;
    summary += `\n\nReply *"confirm"* to confirm, or *"cancel"* to revert.`;
    await sendWhatsAppText(from, phoneNumberId, summary); return;
  }

  // ── REMOVE ITEMS from existing order ───────────────────────────
  if (session.stage === 'edit_remove_items') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    const previousTotal = order.total;
    const indicesToRemove = msg.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < order.items.length);
    if (indicesToRemove.length === 0) { await sendWhatsAppText(from, phoneNumberId, `Invalid. Type item number(s) to remove.`); return; }
    const removedNames = indicesToRemove.map(i => order.items[i].name);
    const remainingItems = order.items.filter((_, idx) => !indicesToRemove.includes(idx));
    if (remainingItems.length === 0) { await sendWhatsAppText(from, phoneNumberId, `Cannot remove all items. Use "cancel ${order.orderNumber}".`); return; }
    editOrder(session.editOrderNumber, { items: remainingItems });
    const updated = findOrderByNumber(session.editOrderNumber);
    session.stage = 'edit_reconfirm';
    (session as any)._revertItems = order.items;
    (session as any)._revertTotal = previousTotal;
    let summary = `📋 *Order Updated — Reconfirm?*\n\nRemoved: ${removedNames.join(', ')}\n\n*Previous Total: Rs ${previousTotal.toFixed(2)}*\n\n${updated.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\n*New Total: Rs ${updated.total.toFixed(2)}*\n\nReply *"confirm"* or *"cancel"* to revert.`;
    await sendWhatsAppText(from, phoneNumberId, summary); return;
  }

  // ── RECONFIRM after edit ────────────────────────────────────────
  if (session.stage === 'edit_reconfirm') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    if (/^confirm$/i.test(msg) || /^yes$/i.test(msg) || /^ok$/i.test(msg)) {
      session.stage = 'greeting'; session.editOrderNumber = '';
      let summary = `✅ *Order Reconfirmed!*\n\nOrder #: *${order.orderNumber}*\n\n`;
      order.items.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
      summary += `\n*Total: Rs ${order.total.toFixed(2)}*`;
      summary += `\n\n👤 ${order.customerName} | 📱 ${order.phone}`;
      summary += `\n🚚 ${order.deliveryType === 'delivery' ? order.address : 'Pickup'}`;
      summary += `\n\nTrack: "track ${order.orderNumber}"`;
      await sendWhatsAppText(from, phoneNumberId, summary); return;
    }
    if (/^cancel$/i.test(msg) || /^revert$/i.test(msg) || /^no$/i.test(msg)) {
      const revertItems = (session as any)._revertItems;
      if (revertItems) editOrder(session.editOrderNumber, { items: revertItems });
      session.stage = 'greeting'; session.editOrderNumber = '';
      await sendWhatsAppText(from, phoneNumberId, `↩️ *Reverted!* Order is back to previous state.\n\nTrack: "track ${order.orderNumber}"`); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `Reply *"confirm"* to keep changes, or *"cancel"* to revert.`); return;
  }

  if (session.stage === 'reschedule_awaiting_time') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    rescheduleOrder(session.editOrderNumber, msg);
    session.stage = 'greeting'; session.editOrderNumber = '';
    await sendWhatsAppText(from, phoneNumberId, `✅ *Order Rescheduled!*\n\nOrder #: ${order.orderNumber}\nNew time: *${msg}*`);
    return;
  }

  if (session.stage === 'edit_awaiting_choice') {
    const order = findOrderByNumber(session.editOrderNumber);
    if (!order) { session.stage = 'greeting'; session.editOrderNumber = ''; await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.`); return; }
    if (lower.includes('add') || lower.includes('1')) {
      session.stage = 'edit_add_items';
      await sendWhatsAppText(from, phoneNumberId,
        `📝 *Add medicines to ${order.orderNumber}*\n\nCurrent:\n${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity} = Rs ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\n*Current Total: Rs ${order.total.toFixed(2)}*\n\nType medicines to ADD:\nExample: "2 Panadol 500mg, 1 Amoxicillin"`);
      return;
    }
    if (lower.includes('remove') || lower.includes('2')) {
      session.stage = 'edit_remove_items';
      await sendWhatsAppText(from, phoneNumberId,
        `🗑️ *Remove items*\n\n${order.items.map((i, idx) => `${idx + 1}. ${i.name} × ${i.quantity}`).join('\n')}\n\nType number(s) to remove:\nExample: "1" or "1, 3"`);
      return;
    }
    if (lower.includes('address') || lower.includes('3')) {
      session.stage = 'edit_awaiting_address';
      await sendWhatsAppText(from, phoneNumberId, `📍 Current: ${order.address}\n\nType new address:`); return;
    }
    if (lower.includes('pickup') || lower.includes('4')) {
      const previousTotal = order.total;
      editOrder(session.editOrderNumber, { deliveryType: 'pickup' });
      const updated = findOrderByNumber(session.editOrderNumber);
      session.stage = 'greeting'; session.editOrderNumber = '';
      await sendWhatsAppText(from, phoneNumberId, `✅ Changed to pickup.\n\nPrevious: Rs ${previousTotal.toFixed(2)}\nNew: Rs ${updated.total.toFixed(2)}\n\nOrder #: ${updated.orderNumber}`); return;
    }
    await sendWhatsAppText(from, phoneNumberId,
      `✏️ *Edit ${order.orderNumber}*\n\n1️⃣ Add medicines\n2️⃣ Remove items\n3️⃣ Change address\n4️⃣ Switch to pickup\n\nType 1, 2, 3, or 4.`); return;
  }

  if (session.stage === 'edit_awaiting_address') {
    editOrder(session.editOrderNumber, { address: msg });
    const updated = findOrderByNumber(session.editOrderNumber);
    session.stage = 'greeting'; session.editOrderNumber = '';
    await sendWhatsAppText(from, phoneNumberId, `✅ Address updated!\n*Total: Rs ${updated.total.toFixed(2)}*`); return;
  }

  // ── 1. GREETING ───────────────────────────────────────────────────
  const isGreeting = /^(hi|hello|hey|salam|salaam|start|assalam|good morning|good evening|good afternoon|marhaba)[\s!.]*$/i.test(msg);
  if (isGreeting) {
    Object.assign(session, { name: '', phone: '', address: '', deliveryType: '', cart: [], stage: 'greeting', editOrderNumber: '', paymentMethod: '' });
    await sendWhatsAppText(from, phoneNumberId,
      `👋 Welcome to Prime Pharmacy!\n\nType medicine name + quantity to order.\nExample: "5 Glucophage" or "I need 10 Panadol 500mg"\n\nOr type a medicine name to search.`);
    return;
  }

  // ── 2. PRESCRIPTION IMAGE ─────────────────────────────────────────
  if (msg.includes('[IMAGE]') || msg.includes('[IMAGE_RECEIVED]')) {
    await sendWhatsAppText(from, phoneNumberId, `✅ Prescription received! Our pharmacist will verify it before dispatch.\n\nContinue ordering — type medicine name + quantity.`);
    return;
  }

  // ── 3. TRACK ORDER ────────────────────────────────────────────────
  if (lower.startsWith('track') || /^ord-/i.test(msg)) {
    const orderNum = msg.replace(/^track\s*/i, '').trim().toUpperCase();
    const order = findOrderByNumber(orderNum);
    if (order) {
      let summary = `📦 *Order Status*\n\nOrder #: *${order.orderNumber}*\nStatus: *${order.status}*\nPayment: ${order.paymentStatus}\n\n`;
      order.items.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
      summary += `\n*Total: Rs ${order.total.toFixed(2)}*`;
      summary += `\n\n👤 ${order.customerName}\n📱 ${order.phone}`;
      if (order.deliveryType === 'delivery') summary += `\n🛵 ${order.address}`; else summary += `\n🚗 Pickup`;
      if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
        summary += `\n\n❌ "cancel ${order.orderNumber}"\n🔄 "reschedule ${order.orderNumber}"\n✏️ "edit ${order.orderNumber}"`;
      }
      await sendWhatsAppText(from, phoneNumberId, summary); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `❌ Order not found.\nExample: "track ORD-12345"`); return;
  }

  // ── 4. CANCEL ─────────────────────────────────────────────────────
  if (lower.startsWith('cancel')) {
    const orderNum = msg.replace(/^cancel\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "cancel ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered') { await sendWhatsAppText(from, phoneNumberId, `❌ Cannot cancel a delivered order.`); return; }
    if (order.status === 'Cancelled') { await sendWhatsAppText(from, phoneNumberId, `Already cancelled.`); return; }
    cancelOrder(orderNum);
    await sendWhatsAppText(from, phoneNumberId, `✅ *Order Cancelled!*\n\nOrder #: ${orderNum}\nRefund: ${order.paymentStatus}\n\nType "hi" to start a new order.`);
    return;
  }

  // ── 5. RESCHEDULE ─────────────────────────────────────────────────
  if (lower.startsWith('reschedule')) {
    const orderNum = msg.replace(/^reschedule\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "reschedule ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered' || order.status === 'Cancelled') { await sendWhatsAppText(from, phoneNumberId, `❌ Cannot reschedule.`); return; }
    session.editOrderNumber = orderNum; session.stage = 'reschedule_awaiting_time';
    await sendWhatsAppText(from, phoneNumberId, `🔄 *Reschedule ${orderNum}*\n\nWhen?\nExample: "Tomorrow 3pm"`);
    return;
  }

  // ── 6. EDIT ───────────────────────────────────────────────────────
  if (lower.startsWith('edit')) {
    const orderNum = msg.replace(/^edit\s+/i, '').trim().toUpperCase();
    if (!orderNum) { await sendWhatsAppText(from, phoneNumberId, `Type: "edit ORD-XXXXX"`); return; }
    const order = findOrderByNumber(orderNum);
    if (!order) { await sendWhatsAppText(from, phoneNumberId, `❌ Order ${orderNum} not found.`); return; }
    if (order.status === 'Delivered' || order.status === 'Cancelled') { await sendWhatsAppText(from, phoneNumberId, `❌ Cannot edit.`); return; }
    session.editOrderNumber = orderNum; session.stage = 'edit_awaiting_choice';
    await sendWhatsAppText(from, phoneNumberId, `✏️ *Edit ${orderNum}*\n\n1️⃣ Items\n2️⃣ Address\n3️⃣ Pickup\n\nType 1, 2, or 3.`);
    return;
  }

  // ── 7. ORDER: quantity + medicine name ────────────────────────────
  const orderMatch = msg.match(/^(?:(?:i\s+)?(?:need|want|order|would\s+like|give\s+me)\s+)?(\d+)\s+(?:tablets?|capsules?|caps?|pcs?|pieces?|strips?|boxes?|of\s+)*\s*([a-zA-Z].+)$/i);
  if (orderMatch) {
    const quantity = parseInt(orderMatch[1]);
    const medName = orderMatch[2].replace(/^of\s+/i, '').trim();
    const med = findMedicineForOrder(medName, medicines);

    if (med) {
      if (med.stock < quantity) {
        const subs = findSubstitutes(medName, medicines, med.id);
        let reply = `⚠️ Only *${med.stock} units* of *${med.name}* available.\n\nWould you like ${med.stock} instead? Type "${med.stock} ${med.name}"`;
        if (subs.length > 0) {
          reply += `\n\nAlternatives:`;
          subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)} (${s.stock} in stock)`; });
        }
        await sendWhatsAppText(from, phoneNumberId, reply); return;
      }

      session.cart.push({ medicineId: med.id, name: med.name, price: med.price, quantity });
      const total = cartTotal(session);
      session.stage = 'ordering';

      const rxNote = med.prescriptionRequired
        ? `⚠️ *${med.name}* requires prescription. Upload a photo or the order will be held for pharmacist review.`
        : '';

      if (!session.name) {
        session.stage = 'asking_name';
        await sendWhatsAppText(from, phoneNumberId,
          `✅ *${med.name}* × ${quantity}\n💰 Rs ${med.price.toFixed(2)}/tablet × ${quantity} = *Rs ${(med.price * quantity).toFixed(2)}*\n\n🛒 Cart: Rs ${total.toFixed(2)}\n${rxNote ? rxNote + '\n\n' : ''}Please tell me your *full name*:`);
        return;
      }

      await sendWhatsAppText(from, phoneNumberId,
        `✅ *${med.name}* × ${quantity} = Rs ${(med.price * quantity).toFixed(2)}\n🛒 Cart: Rs ${total.toFixed(2)}\n${rxNote ? '\n' + rxNote : ''}\n\nAdd more or type "confirm order" to checkout.`);
      return;
    } else {
      const outOfStockMed = findMedicineIncludingOutOfStock(medName, medicines);
      if (outOfStockMed) {
        const subs = findSubstitutes(medName, medicines, outOfStockMed.id);
        let reply = `❌ *${outOfStockMed.name}* is out of stock.`;
        if (subs.length > 0) {
          reply += `\n\nAlternatives:`;
          subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)}/tablet ✅`; });
          reply += `\n\nType quantity + name to order.`;
        } else { reply += `\n\nNo alternatives available.`; }
        await sendWhatsAppText(from, phoneNumberId, reply); return;
      }

      await sendWhatsAppText(from, phoneNumberId,
        `❌ Sorry, *${medName}* is not available right now.\n\nTry a different name or generic name.`);
      return;
    }
  }

  // ── 8. ASKING NAME ────────────────────────────────────────────────
  if (session.stage === 'asking_name') {
    session.name = msg.replace(/\d+/g, '').trim().slice(0, 50);
    if (session.name.length < 2) { await sendWhatsAppText(from, phoneNumberId, `Please tell me your full name.`); return; }
    session.stage = 'asking_phone';
    await sendWhatsAppText(from, phoneNumberId, `Nice to meet you, *${session.name}*! 🙌\n\nPlease share your mobile number:`); return;
  }

  // ── 9. ASKING PHONE ───────────────────────────────────────────────
  if (session.stage === 'asking_phone') {
    const phoneMatch = msg.match(/[\d\s+\-]{8,}/);
    if (phoneMatch) {
      session.phone = phoneMatch[0].replace(/\s/g, '');
      session.stage = 'asking_delivery';
      await sendWhatsAppText(from, phoneNumberId,
        `📱 ${session.phone}\n\n🚗 *pickup* (no charge)\n🛵 *delivery* (Rs ${DELIVERY_CHARGE}, free above Rs ${FREE_DELIVERY_THRESHOLD})`); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `Please send a valid mobile number.`); return;
  }

  // ── 10. ASKING DELIVERY ───────────────────────────────────────────
  if (session.stage === 'asking_delivery') {
    if (lower.includes('pickup') || lower.includes('collect') || lower.includes('pick')) {
      session.deliveryType = 'pickup'; session.stage = 'asking_payment';
      const total = cartTotal(session);
      await sendWhatsAppText(from, phoneNumberId,
        `🚗 Pickup selected.\n\nSubtotal: Rs ${total.toFixed(2)}\nDelivery: Rs 0\n*Total: Rs ${total.toFixed(2)}*\n\n💳 Payment?\n• Cash on Pickup\n• Easypaisa\n• JazzCash\n• Bank Transfer`); return;
    }
    if (lower.includes('delivery') || lower.includes('home') || lower.includes('deliver')) {
      session.deliveryType = 'delivery'; session.stage = 'asking_address';
      await sendWhatsAppText(from, phoneNumberId, `🛵 Delivery selected.\n\nPlease share your full address:`); return;
    }
    await sendWhatsAppText(from, phoneNumberId, `🚗 *pickup* or 🛵 *delivery*?`); return;
  }

  // ── 11. ASKING ADDRESS ────────────────────────────────────────────
  if (session.stage === 'asking_address') {
    session.address = msg; session.stage = 'asking_payment';
    const total = cartTotal(session);
    const deliveryFee = calcDeliveryFee(total);
    const grandTotal = total + deliveryFee;
    await sendWhatsAppText(from, phoneNumberId,
      `📍 Saved!\n\nSubtotal: Rs ${total.toFixed(2)}\nDelivery: Rs ${deliveryFee}${deliveryFee === 0 ? ' (Free!)' : ''}\n*Total: Rs ${grandTotal.toFixed(2)}*\n\n💳 Payment?\n• Cash on Delivery\n• Easypaisa\n• JazzCash\n• Bank Transfer`); return;
  }

  // ── 12. ASKING PAYMENT ────────────────────────────────────────────
  if (session.stage === 'asking_payment') {
    if (lower.includes('cash')) session.paymentMethod = session.deliveryType === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup';
    else if (lower.includes('easypaisa')) session.paymentMethod = 'Easypaisa';
    else if (lower.includes('jazzcash')) session.paymentMethod = 'JazzCash';
    else if (lower.includes('bank')) session.paymentMethod = 'Bank Transfer';
    else if (lower.includes('card')) session.paymentMethod = 'Card';
    else { await sendWhatsAppText(from, phoneNumberId, `Please choose:\n• Cash\n• Easypaisa\n• JazzCash\n• Bank Transfer`); return; }

    session.stage = 'ready_to_checkout';
    const total = cartTotal(session);
    const deliveryFee = session.deliveryType === 'delivery' ? calcDeliveryFee(total) : 0;
    const grandTotal = total + deliveryFee;

    let summary = `📋 *Order Summary*\n\n`;
    session.cart.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
    summary += `\nSubtotal: Rs ${total.toFixed(2)}`;
    summary += `\nDelivery: Rs ${deliveryFee}${deliveryFee === 0 ? ' (Free!)' : ''}`;
    summary += `\n*Total: Rs ${grandTotal.toFixed(2)}*`;
    summary += `\n\n👤 ${session.name}\n📱 ${session.phone}`;
    summary += `\n🚚 ${session.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}`;
    if (session.deliveryType === 'delivery') summary += `\n📍 ${session.address}`;
    summary += `\n💳 ${session.paymentMethod}`;
    summary += `\n\nReply *"confirm"* to place order.`;
    await sendWhatsAppText(from, phoneNumberId, summary); return;
  }

  // ── 13. CONFIRM ORDER ─────────────────────────────────────────────
  if (/^confirm$/i.test(msg) || /^place order$/i.test(msg) || /^checkout$/i.test(msg) || (session.stage === 'ready_to_checkout' && /^yes$/i.test(msg))) {
    if (session.cart.length === 0) { await sendWhatsAppText(from, phoneNumberId, `Cart is empty. Type medicine + quantity.`); return; }
    if (!session.name) { session.stage = 'asking_name'; await sendWhatsAppText(from, phoneNumberId, `Please tell me your *full name*:`); return; }
    if (!session.phone) { session.stage = 'asking_phone'; await sendWhatsAppText(from, phoneNumberId, `Please share your *mobile number*:`); return; }
    if (!session.deliveryType) { session.stage = 'asking_delivery'; await sendWhatsAppText(from, phoneNumberId, `🚗 pickup or 🛵 delivery?`); return; }
    if (session.deliveryType === 'delivery' && !session.address) { session.stage = 'asking_address'; await sendWhatsAppText(from, phoneNumberId, `Please share your *address*:`); return; }
    if (!session.paymentMethod) { session.stage = 'asking_payment'; await sendWhatsAppText(from, phoneNumberId, `💳 Payment?\n• Cash\n• Easypaisa\n• JazzCash\n• Bank Transfer`); return; }

    const total = cartTotal(session);
    const deliveryFee = session.deliveryType === 'delivery' ? calcDeliveryFee(total) : 0;
    const grandTotal = total + deliveryFee;
    const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

    createOrder({
      id: orderNum, orderNumber: orderNum, customerName: session.name, phone: session.phone,
      address: session.address || 'Pickup from pharmacy', deliveryType: session.deliveryType,
      items: [...session.cart], subtotal: total, deliveryFee, total: grandTotal,
      status: 'Pending', paymentStatus: 'Unpaid', paymentMethod: session.paymentMethod,
      notes: '', createdAt: new Date().toISOString(), source: 'WhatsApp',
    });

    const hasRx = session.cart.some(item => medicines.find(m => m.id === item.medicineId)?.prescriptionRequired);

    let summary = `✅ *Order Confirmed!*\n\nOrder #: *${orderNum}*\n\n`;
    session.cart.forEach((item, i) => { summary += `${i + 1}. ${item.name} × ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}\n`; });
    summary += `\n*Total: Rs ${grandTotal.toFixed(2)}*`;
    summary += `\n\n👤 ${session.name}\n📱 ${session.phone}`;
    if (session.deliveryType === 'delivery') {
      summary += `\n🛵 ${session.address}\n⏱️ 45-90 minutes`;
    } else {
      summary += `\n🚗 Pickup\n⏱️ Ready in 30 min`;
    }
    summary += `\n💳 ${session.paymentMethod}`;
    if (hasRx) summary += `\n\n⚠️ Includes Rx medicines — pharmacist will verify before dispatch.`;
    summary += `\n\nTrack: "track ${orderNum}"`;

    session.cart = []; session.stage = 'ready_to_order';
    await sendWhatsAppText(from, phoneNumberId, summary); return;
  }

  // ── 14. MEDICINE SEARCH (no quantity) ────────────────────────────
  const medResults = searchMedicineByName(msg, medicines);
  if (medResults.length > 0) {
    if (medResults.length === 1) {
      const med = medResults[0];
      await sendWhatsAppText(from, phoneNumberId,
        `💊 *${med.name}*\n💰 Rs ${med.price.toFixed(2)}/tablet\n📦 ${med.stock} in stock\n${med.prescriptionRequired ? '⚠️ Rx required\n' : ''}\nTo order, type:\n"2 ${med.name}"`);
      return;
    }
    let reply = `💊 Found ${medResults.length} medicines:\n\n`;
    medResults.forEach((med, i) => {
      reply += `${i + 1}. *${med.name}* — Rs ${med.price.toFixed(2)}/tablet${med.prescriptionRequired ? ' ⚠️Rx' : ''}\n`;
    });
    reply += `\nType quantity + name to order.\nExample: "2 ${medResults[0].name}"`;
    await sendWhatsAppText(from, phoneNumberId, reply); return;
  }

  // ── 15. OUT OF STOCK CHECK ────────────────────────────────────────
  const outOfStockMed = findMedicineIncludingOutOfStock(msg, medicines);
  if (outOfStockMed) {
    const subs = findSubstitutes(msg, medicines, outOfStockMed.id);
    let reply = `❌ *${outOfStockMed.name}* is out of stock.`;
    if (subs.length > 0) {
      reply += `\n\nAlternatives:`;
      subs.forEach((s, i) => { reply += `\n${i + 1}. ${s.name} — Rs ${s.price.toFixed(2)}/tablet ✅`; });
    }
    await sendWhatsAppText(from, phoneNumberId, reply); return;
  }

  // ── 16. MEDICAL QUESTION → ESCALATE ───────────────────────────────
  const medicalKeywords = /symptom|diagnos|dosage|dose|side effect|interact|pregnan|breastfeed|allerg|headache|fever|pain|infection|disease|condition|treat|cure|medicine for|tablet for/i;
  if (medicalKeywords.test(msg)) {
    await sendWhatsAppText(from, phoneNumberId,
      `I'm Prime Pharmacy's ordering assistant — I can't give medical advice.\n\nFor symptoms or dosage questions, our pharmacist will contact you.\n\nWould you like to search for a medicine?`);
    return;
  }

  // ── 17. AI FALLBACK ──────────────────────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  if (apiKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://prime-pharmacy.vercel.app' },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: `${PHARMACY_KB}\n\nReply on WhatsApp for Prime Pharmacy. Under 3 lines. Customer: ${session.name || 'unknown'}.` },
            { role: 'user', content: msg }
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) { await sendWhatsAppText(from, phoneNumberId, reply); return; }
    } catch (e) { console.error('AI fallback error:', e); }
  }

  // ── 18. FINAL FALLBACK ───────────────────────────────────────────
  await sendWhatsAppText(from, phoneNumberId,
    `Type medicine name + quantity to order.\nExample: "5 Glucophage" or "10 Panadol 500mg"\n\nOr type a medicine name to search.`);
}
