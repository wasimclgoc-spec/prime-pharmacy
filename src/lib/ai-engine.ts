import { AIMessage, Medicine, Customer } from '../types'
import { CartItem } from './store';
import { useCustomerStore as useStore } from './store';
import { TempCustomer } from './store';

// OpenRouter API setup
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.0-flash-exp:free';

// ─────────────────────────────────────────────────────────────────────────────
// SMART EXTRACTOR — parses name, phone, address from ANY free-form text
// ─────────────────────────────────────────────────────────────────────────────
export function parseCustomerInfoFromText(text: string): { name: string; phone: string; address: string } {
  const remaining = text.trim();

  // 1. PHONE — extract first phone-like sequence (Pakistan 03xx / KSA 05x formats)
  const phoneRegex = /(?:\+92|\+966|0)[0-9\s\-]{8,13}|\b0[0-9]{9,11}\b/;
  const phoneMatch = remaining.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : '';

  let beforePhone = remaining;
  let afterPhone = '';

  if (phoneMatch && phoneMatch.index !== undefined) {
    beforePhone = remaining.slice(0, phoneMatch.index).trim();
    afterPhone = remaining.slice(phoneMatch.index + phoneMatch[0].length).trim();
  }

  // 2. NAME — first 1-3 alpha words that appear BEFORE the phone number
  const nameWords = beforePhone
    .split(/\s+/)
    .filter(w => /^[a-zA-Z\u0600-\u06FF\u0750-\u077F]{2,}$/.test(w))
    .slice(0, 3);
  const name = nameWords.join(' ').trim();

  // 3. ADDRESS — everything that comes AFTER the phone number
  const address = afterPhone.replace(/^[,.\s]+|[,.\s]+$/, '').trim();

  return { name, phone, address };
}

// Try to merge new extracted info with existing customer data
function mergeCustomerInfo(
  existing: TempCustomer | null,
  extracted: { name: string; phone: string; address: string }
): TempCustomer {
  return {
    id: existing?.id || 'c-' + Math.random().toString(36).substr(2, 9),
    name: extracted.name || existing?.name || '',
    phone: extracted.phone || existing?.phone || '',
    address: extracted.address || existing?.address || '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const getSystemPrompt = (medicines: Medicine[], lang: 'en' | 'ar' | 'ur') => {
  const medicineListStr = medicines
    .map(m => `- ${m.name}: Price PKR ${m.price.toFixed(2)}, Stock: ${m.stock}`)
    .join('\n');

  return `You are "Amana", an intelligent and empathetic AI Pharmacy Assistant for Prime Pharmacy.
You communicate naturally in English, Arabic (العربية), and Urdu (اردو) based on the customer's language.

IMPORTANT — INFORMATION EXTRACTION:
When a customer sends a message with their name, phone number and address all together (e.g. "Hasan 0300 123456 Raza abad Faisalabad"), extract ALL three fields at once.
Do NOT ask for information the customer has already provided.
Acknowledge what you received and only ask for what is genuinely missing.

Your workflow:
1. Collect Full Name, Mobile Number, Delivery Address (accept in any order, any format)
2. Once all 3 are collected, confirm them and ask for prescription upload
3. Process prescription and match to inventory
4. Confirm order before placing

Live Inventory:
${medicineListStr}

Rules:
- Never hallucinate medicines. Only sell what is in stock.
- Respond in the same language the customer writes in.
- Be warm, professional, and brief.
- If customer provides all info in one message, acknowledge all of it at once.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AI RESPONSE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export async function getAIResponse(
  chatHistory: AIMessage[],
  lang: 'en' | 'ar' | 'ur' = 'en'
): Promise<AIMessage> {
  const store = useStore.getState();
  const medicines = store.medicines;

  const userMessages = chatHistory.filter(m => m.sender === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];
  const lastText = lastUserMessage?.text || '';

  // ── SMART INFO EXTRACTION from ALL user messages combined ─────────────────
  const allUserText = userMessages.map(m => m.text).join(' ');
  const extracted = parseCustomerInfoFromText(allUserText);
  const merged = mergeCustomerInfo(store.customer, extracted);

  // Save merged customer to store always (partial OK)
  store.setCustomer(merged);

  // ── Check if we have all info ─────────────────────────────────────────────
  const hasName = merged.name.trim().length > 0;
  const hasPhone = merged.phone.trim().length > 0;
  const hasAddress = merged.address.trim().length > 0;
  const infoComplete = hasName && hasPhone && hasAddress;

  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';

  if (!apiKey) {
    return handleLocalFallback(chatHistory, lang, store, merged, infoComplete);
  }

  try {
    const apiMessages = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    apiMessages.unshift({ role: 'system', content: getSystemPrompt(medicines, lang) });

    // Inject extracted info into context so AI knows what was already captured
    if (infoComplete) {
      apiMessages.push({
        role: 'system',
        content: `[SYSTEM NOTE] Customer info already collected: Name="${merged.name}", Phone="${merged.phone}", Address="${merged.address}". Do NOT ask for these again. Proceed to prescription upload.`
      });
    } else {
      const missing = [];
      if (!hasName) missing.push('Full Name');
      if (!hasPhone) missing.push('Mobile Number');
      if (!hasAddress) missing.push('Delivery Address');
      apiMessages.push({
        role: 'system',
        content: `[SYSTEM NOTE] Collected so far: Name="${merged.name || 'missing'}", Phone="${merged.phone || 'missing'}", Address="${merged.address || 'missing'}". Only ask for: ${missing.join(', ')}.`
      });
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://prime-pharmacy.com',
        'X-Title': 'Prime Pharmacy AI'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: apiMessages,
        temperature: 0.3,
        max_tokens: 600
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    const replyText = data.choices[0].message.content;

    const aiMsg: AIMessage = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toISOString()
    };

    const lowerReply = replyText.toLowerCase();
    const customer = useStore.getState().customer;
    if (customer?.name && customer?.phone && customer?.address &&
        (lowerReply.includes('upload') || lowerReply.includes('prescription') ||
         lowerReply.includes('وصفة') || lowerReply.includes('نسخہ'))) {
      aiMsg.type = 'prescription_upload';
    }

    return aiMsg;

  } catch (error) {
    console.error('OpenRouter failed, using fallback:', error);
    return handleLocalFallback(chatHistory, lang, store, merged, infoComplete);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART LOCAL FALLBACK — no API key needed
// ─────────────────────────────────────────────────────────────────────────────
function handleLocalFallback(
  chatHistory: AIMessage[],
  lang: 'en' | 'ar' | 'ur',
  store: any,
  customer: TempCustomer,
  infoComplete: boolean
): AIMessage {
  const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);
  const timestamp = new Date().toISOString();
  const userMessages = chatHistory.filter(m => m.sender === 'user');
  const lastText = userMessages[userMessages.length - 1]?.text || '';
  const cleanText = lastText.toLowerCase().trim();

  // ── Localized strings ──────────────────────────────────────────────────────
  const t = {
    en: {
      askName: "Could you please share your **Full Name**?",
      askPhone: `Thanks, ${customer.name || 'there'}! What is your **Mobile Number**?`,
      askAddress: `Got it! And your **Delivery Address**?`,
      gotInfo: `✅ Got it, **${customer.name}**! Here's what I have:\n\n👤 Name: ${customer.name}\n📱 Phone: ${customer.phone}\n📍 Address: ${customer.address}\n\nPlease click **Upload Prescription** below so I can prepare your medicines! 💊`,
      askMissing: (missing: string[]) => `Almost there! I just need your **${missing.join('** and **')}** to complete your profile.`,
      confirmOrder: (num: string) => `🎉 Order **${num}** placed! Our pharmacist will review and deliver soon.`,
      cancel: "Order cancelled. Let me know if you need help!",
      empty: "Your cart is empty. Please upload a prescription first.",
      ready: "Ready to help! Please upload your prescription below 👇"
    },
    ar: {
      askName: "هل يمكنك مشاركة **اسمك الكامل**؟",
      askPhone: `شكراً ${customer.name || ''}! ما هو **رقم هاتفك**؟`,
      askAddress: `ممتاز! وما هو **عنوان التوصيل**؟`,
      gotInfo: `✅ شكراً، **${customer.name}**! معلوماتك:\n\n👤 الاسم: ${customer.name}\n📱 الهاتف: ${customer.phone}\n📍 العنوان: ${customer.address}\n\nيرجى النقر على **تحميل الوصفة** لتجهيز أدويتك! 💊`,
      askMissing: (missing: string[]) => `تقريباً جاهز! أحتاج فقط إلى **${missing.join('** و **')}** لإكمال ملفك.`,
      confirmOrder: (num: string) => `🎉 تم تسجيل الطلب **${num}**! سيقوم الصيدلي بمراجعته وتسليمه قريباً.`,
      cancel: "تم إلغاء الطلب. أخبرني إذا احتجت مساعدة!",
      empty: "سلتك فارغة. يرجى تحميل وصفة طبية أولاً.",
      ready: "أنا مستعد! يرجى تحميل وصفتك الطبية أدناه 👇"
    },
    ur: {
      askName: "براہ کرم اپنا **مکمل نام** بتائیں۔",
      askPhone: `شکریہ ${customer.name || ''}! آپ کا **موبائل نمبر** کیا ہے؟`,
      askAddress: `بہت اچھا! آپ کا **ڈیلیوری ایڈریس** کیا ہے؟`,
      gotInfo: `✅ شکریہ، **${customer.name}**! آپ کی تفصیلات:\n\n👤 نام: ${customer.name}\n📱 فون: ${customer.phone}\n📍 پتہ: ${customer.address}\n\nنسخہ اپ لوڈ کرنے کے لیے **Upload Prescription** پر کلک کریں! 💊`,
      askMissing: (missing: string[]) => `تقریباً ہو گیا! بس **${missing.join('** اور **')}** چاہیے۔`,
      confirmOrder: (num: string) => `🎉 آرڈر **${num}** بک ہو گیا! فارماسسٹ جلد ڈیلیور کریں گے۔`,
      cancel: "آرڈر منسوخ کر دیا گیا۔ مدد کے لیے بتائیں!",
      empty: "کارٹ خالی ہے۔ پہلے نسخہ اپ لوڈ کریں۔",
      ready: "تیار ہوں! نیچے نسخہ اپ لوڈ کریں 👇"
    }
  }[lang];

  // ── INFO COMPLETE → show prescription upload prompt ────────────────────────
  if (infoComplete) {
    // Check if we already sent the "got info" message
    const alreadySentConfirm = chatHistory
      .filter(m => m.sender === 'assistant')
      .some(m => m.type === 'prescription_upload');

    if (!alreadySentConfirm) {
      return {
        id: msgId, sender: 'assistant',
        text: t.gotInfo,
        timestamp,
        type: 'prescription_upload'
      };
    }

    // Check for order confirmation
    const isConfirm = ['confirm', 'yes', 'y', 'ok', 'تأكيد', 'نعم', 'ہاں', 'تصدیق'].some(kw => cleanText.includes(kw));
    const isCancel = ['cancel', 'no', 'إلغاء', 'لا', 'منسوخ', 'نہیں'].some(kw => cleanText.includes(kw));
    const lastSummary = [...chatHistory].reverse().find(m => m.type === 'order_summary');

    if (lastSummary && isConfirm) {
      const cartItems: CartItem[] = store.cart;
      if (!cartItems.length) {
        return { id: msgId, sender: 'assistant', text: t.empty, timestamp };
      }
      const total = cartItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
      const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      const newOrder = {
        id: 'ord-' + Math.random().toString(36).substr(2, 9),
        orderNumber: orderNum,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        medicines: cartItems.map(c => ({ medicineId: c.medicineId, name: c.name, quantity: c.quantity, price: c.price })),
        total,
        status: 'Pending' as const,
        paymentStatus: 'Unpaid' as const,
        deliveryStatus: 'Pending' as const,
        paymentMethod: 'Cash on Delivery',
        time: new Date().toISOString(),
        created_date: new Date().toISOString()
      };
      store.addOrder(newOrder);
      store.clearCart();
      return { id: msgId, sender: 'assistant', text: t.confirmOrder(orderNum), timestamp, type: 'order_success' as any };
    }

    if (lastSummary && isCancel) {
      store.clearCart();
      return { id: msgId, sender: 'assistant', text: t.cancel, timestamp };
    }

    return { id: msgId, sender: 'assistant', text: t.ready, timestamp, type: 'prescription_upload' };
  }

  // ── INFO INCOMPLETE → ask only for what's missing ─────────────────────────
  const hasName = customer.name.trim().length > 0;
  const hasPhone = customer.phone.trim().length > 0;
  const hasAddress = customer.address.trim().length > 0;

  const missingLabels: string[] = [];
  if (!hasName) missingLabels.push(lang === 'ar' ? 'الاسم الكامل' : lang === 'ur' ? 'مکمل نام' : 'Full Name');
  if (!hasPhone) missingLabels.push(lang === 'ar' ? 'رقم الهاتف' : lang === 'ur' ? 'موبائل نمبر' : 'Mobile Number');
  if (!hasAddress) missingLabels.push(lang === 'ar' ? 'عنوان التوصيل' : lang === 'ur' ? 'ڈیلیوری ایڈریس' : 'Delivery Address');

  // Only ask for what's genuinely missing — not things already provided
  if (missingLabels.length === 3) {
    // Nothing collected yet — first ask
    return { id: msgId, sender: 'assistant', text: t.askName, timestamp };
  }

  return {
    id: msgId, sender: 'assistant',
    text: t.askMissing(missingLabels),
    timestamp
  };
}
