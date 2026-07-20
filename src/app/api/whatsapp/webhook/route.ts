import { NextRequest, NextResponse } from 'next/server';
import { handleWhatsAppMessage } from '@/lib/whatsapp-handler';

// ── Webhook Verification (Meta sends GET request with hub.challenge) ──────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'prime_pharmacy_verify_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('❌ Webhook verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ── Receive WhatsApp Messages (Meta sends POST with message data) ────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('📥 WhatsApp webhook received:', JSON.stringify(body, null, 2));

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Skip status updates (delivered, read, sent)
      if (value?.statuses) {
        return NextResponse.json({ status: 'ok', message: 'Status update ignored' });
      }

      const messages = value?.messages;
      if (messages && messages.length > 0) {
        const message = messages[0];
        const from = message.from;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const messageId = message.id;

        let messageText = '';
        let messageType = message.type;

        if (messageType === 'text' && message.text?.body) {
          messageText = message.text.body;
        } else if (messageType === 'image') {
          messageText = '[IMAGE_RECEIVED] Customer sent an image (prescription upload)';
        } else if (messageType === 'button' && message.button?.text) {
          messageText = message.button.text;
        } else if (messageType === 'interactive' && message.interactive?.button_reply?.id) {
          messageText = message.interactive.button_reply.id;
        } else {
          messageText = `[${messageType?.toUpperCase()}] Unsupported message type`;
        }

        console.log(`💬 Message from ${from}: ${messageText}`);

        handleWhatsAppMessage(from, messageText, phoneNumberId, messageId, messageType)
          .catch(err => console.error('Error handling WhatsApp message:', err));

        return NextResponse.json({ status: 'ok' });
      }
    }

    return NextResponse.json({ status: 'ok', message: 'No message to process' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ status: 'ok' });
  }
}
