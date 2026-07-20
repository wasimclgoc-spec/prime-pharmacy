// ── WhatsApp Cloud API Client ────────────────────────────────────────────
// Sends messages back to customers on WhatsApp

const WHATSAPP_API_VERSION = 'v21.0';
const WHATSAPP_BASE_URL = 'https://graph.facebook.com';

export function getAccessToken(): string {
  return process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
}

export function getPhoneNumberId(): string {
  return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
}

// ── Send a simple text message ───────────────────────────────────────────
export async function sendWhatsAppText(
  to: string,
  phoneNumberId: string,
  text: string
): Promise<any> {
  const token = getAccessToken();
  const phId = phoneNumberId || getPhoneNumberId();

  if (!token || !phId) {
    console.error('❌ WhatsApp API not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
    console.log(`📝 Would send to ${to}: ${text}`);
    return null;
  }

  try {
    const response = await fetch(`${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${phId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: text,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Message sent to ${to}`);
    } else {
      console.error('❌ WhatsApp send error:', JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return null;
  }
}

// ── Send a message with buttons (interactive) ────────────────────────────
export async function sendWhatsAppMessage(
  to: string,
  phoneNumberId: string,
  text: string,
  buttons?: { id: string; title: string }[]
): Promise<any> {
  if (!buttons || buttons.length === 0) {
    return sendWhatsAppText(to, phoneNumberId, text);
  }

  const token = getAccessToken();
  const phId = phoneNumberId || getPhoneNumberId();

  if (!token || !phId) {
    console.log(`📝 Would send to ${to}: ${text} (with buttons: ${buttons.map(b => b.title).join(', ')})`);
    return null;
  }

  try {
    const body: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: text },
        action: {
          buttons: buttons.map(btn => ({
            type: 'button',
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };

    const response = await fetch(`${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${phId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Interactive message sent to ${to}`);
    } else {
      console.error('❌ WhatsApp interactive send error:', JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error('❌ WhatsApp interactive send error:', error);
    return null;
  }
}

// ── Send template message (for order confirmations etc.) ────────────────
export async function sendWhatsAppTemplate(
  to: string,
  phoneNumberId: string,
  templateName: string,
  languageCode: string = 'en',
  components?: any[]
): Promise<any> {
  const token = getAccessToken();
  const phId = phoneNumberId || getPhoneNumberId();

  if (!token || !phId) {
    console.log(`📝 Would send template "${templateName}" to ${to}`);
    return null;
  }

  try {
    const response = await fetch(`${WHATSAPP_BASE_URL}/${WHATSAPP_API_VERSION}/${phId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components || [],
        },
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ WhatsApp template send error:', error);
    return null;
  }
}
