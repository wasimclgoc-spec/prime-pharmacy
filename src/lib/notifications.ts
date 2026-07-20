import { Order } from './seed-data';

export interface InAppNotification {
  id: string;
  userId: string; // 'admin', 'pharmacist', or a specific customerId
  title: string;
  message: string;
  type: 'order_status' | 'low_stock' | 'expiry_alert' | 'general';
  read: boolean;
  createdAt: string;
}

// In-memory store for notifications (resets on server restart, standard for demo apps)
export const notificationStore: InAppNotification[] = [];

/**
 * Simulated SMS sender
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  console.log(`[SIMULATED SMS] To: ${phone} | Content: "${message}"`);
  return true;
}

/**
 * Simulated Email sender
 */
export async function sendEmail(email: string, subject: string, body: string): Promise<boolean> {
  console.log(`[SIMULATED EMAIL] To: ${email} | Subject: "${subject}" | Body preview: "${body.substring(0, 100)}..."`);
  return true;
}

/**
 * Simulated Push Notification sender
 */
export async function sendPushNotification(userId: string, message: string): Promise<boolean> {
  console.log(`[SIMULATED PUSH] To User: ${userId} | Message: "${message}"`);
  return true;
}

/**
 * Adds a notification to the in-app store
 */
export function addInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: 'order_status' | 'low_stock' | 'expiry_alert' | 'general'
): InAppNotification {
  const newNotif: InAppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };

  notificationStore.unshift(newNotif); // Add to beginning of array
  return newNotif;
}

/**
 * Triggers all relevant channels when order status changes
 */
export async function notifyOrderStatusChange(order: Order): Promise<void> {
  const customerPhone = '+966551122334'; // Simulated fallback, or can fetch from seed-data
  const customerEmail = `${order.customerName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`;

  let statusMsg = '';
  let emailSubject = '';

  switch (order.status) {
    case 'pending':
      statusMsg = `Your order ${order.id} has been received and is waiting for pharmacist approval.`;
      emailSubject = `Prime Pharmacy: Order ${order.id} Received`;
      break;
    case 'processing':
      statusMsg = `Good news! Your order ${order.id} is being safely prepared by our pharmacists.`;
      emailSubject = `Prime Pharmacy: Order ${order.id} is being Prepared`;
      break;
    case 'shipped':
      statusMsg = `Your Prime Pharmacy order ${order.id} has been dispatched! Our driver is on the way.`;
      emailSubject = `Prime Pharmacy: Order ${order.id} Dispatched!`;
      break;
    case 'delivered':
      statusMsg = `Your order ${order.id} has been successfully delivered. Thank you for choosing Prime Pharmacy!`;
      emailSubject = `Prime Pharmacy: Order ${order.id} Delivered`;
      break;
    case 'cancelled':
      statusMsg = `Your order ${order.id} has been cancelled. If this is a mistake, please contact us.`;
      emailSubject = `Prime Pharmacy: Order ${order.id} Cancellation Notice`;
      break;
  }

  // Trigger all 4 notifications
  // 1. In-App Notification for customer
  addInAppNotification(order.customerId, `Order ${order.status.toUpperCase()}`, statusMsg, 'order_status');

  // 2. Simulated SMS
  await sendSMS(customerPhone, `Prime Pharmacy: ${statusMsg}`);

  // 3. Simulated Email
  await sendEmail(
    customerEmail,
    emailSubject,
    `Dear ${order.customerName},\n\n${statusMsg}\n\nOrder Details:\nTotal Amount: ${order.grandTotal} PKR\nPayment Method: ${order.paymentMethod}\n\nWarm regards,\nPrime Pharmacy Team`
  );

  // 4. Simulated Push Notification
  await sendPushNotification(order.customerId, statusMsg);

  // Notify admins/pharmacists if order needs approval (pending with prescription required)
  if (order.status === 'pending' && order.prescriptionUrl) {
    addInAppNotification(
      'pharmacist',
      'Prescription Approval Required',
      `New order ${order.id} has been placed and requires pharmacist verification of prescription document.`,
      'order_status'
    );
  }
}

/**
 * Triggers low stock alert for store managers and pharmacists
 */
export async function notifyLowStock(medicineId: string, medicineName: string, currentStock: number): Promise<void> {
  const alertTitle = '⚠️ Low Stock Alert';
  const alertMsg = `Medicine "${medicineName}" (ID: ${medicineId}) is running low on stock. Current count: ${currentStock} units left. Please reorder from supplier soon!`;

  // 1. Alert Pharmacist and Admin in-app
  addInAppNotification('pharmacist', alertTitle, alertMsg, 'low_stock');
  addInAppNotification('admin', alertTitle, alertMsg, 'low_stock');

  // 2. Alert managers via email
  await sendEmail(
    'inventory@primepharmacy.com',
    `CRITICAL: Low Stock for ${medicineName}`,
    `This is an automated inventory alert.\n\n${alertMsg}\n\nPlease issue a purchase order.`
  );
}

/**
 * Triggers expiry alert for store managers and pharmacists
 */
export async function notifyExpiryAlert(medicineId: string, medicineName: string, expiryDate: string): Promise<void> {
  const alertTitle = '🚨 Expiry Warning';
  const alertMsg = `Medicine "${medicineName}" (ID: ${medicineId}) is set to expire on ${expiryDate}. Please inspect and dispose or mark down if necessary.`;

  // 1. Alert Pharmacist and Admin in-app
  addInAppNotification('pharmacist', alertTitle, alertMsg, 'expiry_alert');
  addInAppNotification('admin', alertTitle, alertMsg, 'expiry_alert');

  // 2. Email alert
  await sendEmail(
    'quality@primepharmacy.com',
    `EXPIRY ALERT: ${medicineName}`,
    `Automated quality control alert.\n\n${alertMsg}\n\nVerify stock and batch immediately.`
  );
}

/**
 * Fetch notifications filtered by userId
 */
export function getInAppNotifications(userId?: string): InAppNotification[] {
  if (!userId) return notificationStore;
  
  // Staff see general + low stock + expiry, customers see only their own
  if (userId === 'admin' || userId === 'pharmacist') {
    return notificationStore.filter(n => n.userId === userId || n.userId === 'admin' || n.userId === 'pharmacist');
  }
  
  return notificationStore.filter(n => n.userId === userId);
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): boolean {
  const notif = notificationStore.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}
