import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrder } from '@/lib/whatsapp-orders';

// GET: List all WhatsApp orders for admin dashboard
export async function GET() {
  const orders = getOrders();
  return NextResponse.json({ orders });
}

// PATCH: Update order status from admin
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, status } = body;
    if (!orderNumber || !status) {
      return NextResponse.json({ error: 'orderNumber and status required' }, { status: 400 });
    }
    const updated = updateOrder(orderNumber, { status });
    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
