import { medicines } from './whatsapp-inventory';

export interface WhatsAppOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryType: string;
  items: { medicineId: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  paymentMethod: string;
  notes: string;
  createdAt: string;
  source: string;
}

// In-memory store (persists during server lifetime)
const orderStore: WhatsAppOrder[] = [];

export function createOrder(order: WhatsAppOrder): void {
  orderStore.unshift(order);
}

export function getOrders(): WhatsAppOrder[] {
  return orderStore;
}

export function findOrderByNumber(orderNumber: string): WhatsAppOrder | undefined {
  return orderStore.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
}

export function updateOrder(orderNumber: string, updates: Partial<WhatsAppOrder>): WhatsAppOrder | undefined {
  const order = orderStore.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
  if (order) {
    Object.assign(order, updates);
    return order;
  }
  return undefined;
}

export function cancelOrder(orderNumber: string): WhatsAppOrder | undefined {
  return updateOrder(orderNumber, { status: 'Cancelled', paymentStatus: 'Refunded' });
}

export function rescheduleOrder(orderNumber: string, newTime: string): WhatsAppOrder | undefined {
  const order = findOrderByNumber(orderNumber);
  if (order) {
    order.notes = `Rescheduled to: ${newTime}. ${order.notes}`;
    return order;
  }
  return undefined;
}

export function editOrder(orderNumber: string, updates: { items?: any[]; addItems?: any[]; address?: string; deliveryType?: string }): WhatsAppOrder | undefined {
  const order = findOrderByNumber(orderNumber);
  if (order) {
    if (updates.items) {
      // Replace all items
      order.items = updates.items;
      order.subtotal = updates.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      order.deliveryFee = (updates.deliveryType || order.deliveryType) === 'delivery' ? 20 : 0;
      order.total = order.subtotal + order.deliveryFee;
    }
    if (updates.addItems && updates.addItems.length > 0) {
      // ADD to existing items — don't replace, merge
      for (const newItem of updates.addItems) {
        const existing = order.items.find((i: any) => i.medicineId === newItem.medicineId);
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          order.items.push(newItem);
        }
      }
      order.subtotal = order.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      order.deliveryFee = (updates.deliveryType || order.deliveryType) === 'delivery' ? 20 : 0;
      order.total = order.subtotal + order.deliveryFee;
    }
    if (updates.address) order.address = updates.address;
    if (updates.deliveryType) {
      order.deliveryType = updates.deliveryType;
      order.deliveryFee = updates.deliveryType === 'delivery' ? 20 : 0;
      order.total = order.subtotal + order.deliveryFee;
    }
    return order;
  }
  return undefined;
}
