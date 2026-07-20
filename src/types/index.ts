export interface Medicine {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  brand: string;
  generic: string;
  batch: string;
  expiry: string; // ISO String or YYYY-MM-DD
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  status: 'Active' | 'Discontinued' | 'Out of Stock';
  storageLocation: string;
  supplierId: string;
  prescriptionRequired: boolean;
  tax: number; // percentage, e.g. 5 for 5%
  discount: number; // percentage, e.g. 10 for 10%
  image?: string;
  created_date: string;
  updated_date: string;
}

export interface OrderItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  medicines: OrderItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  deliveryStatus: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered' | 'Failed';
  paymentMethod: string;
  time: string; // ISO format or display format
  prescriptionImage?: string;
  notes?: string;
  assignedPharmacist?: string;
  assignedDriver?: string;
  invoiceUrl?: string;
  created_date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  status: 'Active' | 'Inactive' | 'Blacklisted';
  addresses: string[];
  orderHistory: string[]; // Order IDs
  prescriptionHistory: string[]; // Prescription URLs or descriptions
  remarks?: string;
  created_date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
  medicinesCount: number;
}

export interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  vehicle: string;
}

export interface Pharmacist {
  id: string;
  name: string;
  role: string;
  status: 'Available' | 'Busy' | 'Offline';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'Order' | 'Stock' | 'Expiry' | 'System';
  time: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  role: string;
}

export type AdminRole = 'Admin' | 'Pharmacist' | 'Manager' | 'Inventory Staff' | 'Delivery Staff' | 'Cashier';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
}

export interface SalesDataPoint {
  date: string; // YYYY-MM-DD or Month, e.g. "Mon", "Tue" or "2026-07-01"
  sales: number;
  orders: number;
}

export interface MedicineSalesDataPoint {
  name: string;
  sales: number;
  stock: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface CustomerGrowthDataPoint {
  date: string;
  customers: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  type?: 'prescription_upload' | 'order_summary' | 'order_success' | 'medicine_list';
  orderId?: string;
  orderNumber?: string;
}

export interface ExtractedMedicine {
  name: string;
  quantity?: number;
  dosage?: string;
}
