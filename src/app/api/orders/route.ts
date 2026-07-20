import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { isRateLimited, sanitizeInput } from '@/lib/security';
import { orders, medicines as inventory, Order, OrderItem, Customer, customers } from '@/lib/seed-data';
import { logAction } from '@/lib/audit-log';
import { notifyOrderStatusChange, notifyLowStock } from '@/lib/notifications';

/**
 * GET: List orders with filters, search, and pagination.
 * Enforcement of customer data separation (customers see only their own orders).
 */
export async function GET(req: NextRequest) {
  // 1. Rate limiting
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const limitCheck = isRateLimited(ip, 60, 60000);
  if (limitCheck.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Authentication
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const customerIdFilter = searchParams.get('customerId');
    const statusFilter = searchParams.get('status');
    const searchFilter = searchParams.get('search');
    
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    let filteredOrders = [...orders];

    // 3. Security checks: Customers can only access their own orders
    if (user.role === 'customer') {
      filteredOrders = filteredOrders.filter(o => o.customerId === user.id);
    } else {
      // Admins/Pharmacists/Drivers can filter by customerId
      if (customerIdFilter) {
        filteredOrders = filteredOrders.filter(o => o.customerId === customerIdFilter);
      }
    }

    // 4. Apply status filter
    if (statusFilter) {
      filteredOrders = filteredOrders.filter(o => o.status === statusFilter.toLowerCase());
    }

    // 5. Apply search filter (order ID or customer name)
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customerName.toLowerCase().includes(q) ||
        o.shippingAddress.toLowerCase().includes(q)
      );
    }

    // 6. Sort by date descending (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 7. Paginate
    const totalCount = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + limit < totalCount
      }
    });

  } catch (error: any) {
    console.error('Error in GET orders route:', error);
    return NextResponse.json({ error: 'An error occurred while fetching orders.' }, { status: 500 });
  }
}

/**
 * POST: Create a new order.
 * Validates inventory stock, updates stock levels, calculates totals + VAT.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Input Validation
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }
    if (!body.shippingAddress || typeof body.shippingAddress !== 'string') {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }
    if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    const targetCustomerId = user.role === 'customer' ? user.id : body.customerId;
    const targetCustomerName = user.role === 'customer' ? user.name : (body.customerName || 'Walk-in Customer');

    if (!targetCustomerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    // 1. Process items and validate stock
    for (const item of body.items) {
      const medId = item.medicineId;
      const qty = parseInt(item.quantity, 10);

      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Invalid quantity for item ${medId}` }, { status: 400 });
      }

      const med = inventory.find(m => m.id === medId);
      if (!med) {
        return NextResponse.json({ error: `Medicine not found in inventory: ${medId}` }, { status: 404 });
      }

      // Check stock
      if (med.stock < qty) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${med.name}. Available: ${med.stock}, Requested: ${qty}` 
        }, { status: 400 });
      }

      // Deduct Stock
      med.stock -= qty;

      // Check for low stock alert (e.g. less than 10 items)
      if (med.stock < 10) {
        notifyLowStock(med.id, med.name, med.stock);
      }

      const itemTotal = med.price * qty;
      subtotal += itemTotal;

      orderItems.push({
        medicineId: med.id,
        name: med.name,
        quantity: qty,
        priceAtOrder: med.price
      });
    }

    // 2. Calculations
    const vat = Math.round(subtotal * 0.15 * 100) / 100; // 15% VAT
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    const newOrderId = `ord-${orders.length + 1}`;
    
    // 3. Construct Order object
    const newOrder: Order = {
      id: newOrderId,
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      items: orderItems,
      totalAmount: subtotal,
      vatAmount: vat,
      grandTotal,
      status: 'pending',
      prescriptionUrl: body.prescriptionUrl || undefined, // url if prescription is uploaded
      shippingAddress: sanitizeInput(body.shippingAddress),
      paymentMethod: sanitizeInput(body.paymentMethod) as any,
      paymentStatus: body.paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 4. Save order to in-memory store
    orders.push(newOrder);

    // Link back to customer profile in seed-data if exists
    const customer = customers.find(c => c.id === targetCustomerId);
    if (customer && !customer.orderHistory.includes(newOrderId)) {
      customer.orderHistory.push(newOrderId);
    }

    // 5. Notify customer (Simulated SMS/Email/In-app/Push)
    await notifyOrderStatusChange(newOrder);

    // 6. Audit Logging
    logAction(
      user.id,
      user.role,
      user.name,
      'CREATE',
      'Order',
      newOrderId,
      `Created order of total ${grandTotal} PKR for customer ${targetCustomerName}`,
      req
    );

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST orders route:', error);
    return NextResponse.json({ error: 'An error occurred while creating the order.' }, { status: 500 });
  }
}

/**
 * PATCH: Update order status.
 * Handles cancel operations (restoring stock) and delivery driver assignments.
 */
export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Only Admin, Pharmacist, or Delivery Staff can update statuses
  if (!requireRole(user, ['admin', 'pharmacist', 'delivery'])) {
    return NextResponse.json({ error: 'Access denied: Unauthorized role.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || !body.orderId || !body.status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    const orderId = body.orderId;
    const newStatus = body.status.toLowerCase();
    
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid order status value' }, { status: 400 });
    }

    // Find the order
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: `Order with ID ${orderId} not found` }, { status: 404 });
    }

    const oldStatus = order.status;

    if (oldStatus === newStatus) {
      return NextResponse.json({ success: true, message: 'Status already up to date', order });
    }

    // 1. If order is cancelled, restore inventory stock levels
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        const med = inventory.find(m => m.id === item.medicineId);
        if (med) {
          med.stock += item.quantity; // Restore stock
        }
      }
      order.paymentStatus = 'refunded';
    }

    // 2. If status was cancelled, but is now re-opened (not typical, but handle stock check just in case)
    if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      // Re-verify stock
      for (const item of order.items) {
        const med = inventory.find(m => m.id === item.medicineId);
        if (!med || med.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Cannot restore order. Insufficient inventory stock for ${item.name}.` 
          }, { status: 400 });
        }
        med.stock -= item.quantity;
      }
    }

    // 3. Assign delivery staff if transition to shipped/delivered
    if ((newStatus === 'shipped' || newStatus === 'delivered') && !order.deliveryStaffId) {
      order.deliveryStaffId = body.deliveryStaffId || 'staff-1'; // default driver
    }

    // Update fields
    order.status = newStatus as any;
    order.updatedAt = new Date().toISOString();
    
    if (newStatus === 'delivered') {
      order.paymentStatus = 'paid';
    }

    // 4. Send Notifications
    await notifyOrderStatusChange(order);

    // 5. Audit Logging
    logAction(
      user.id,
      user.role,
      user.name,
      newStatus === 'cancelled' ? 'DELETE' : 'UPDATE',
      'Order',
      orderId,
      `Updated order status from "${oldStatus}" to "${newStatus}"`,
      req
    );

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order
    });

  } catch (error: any) {
    console.error('Error in PATCH orders route:', error);
    return NextResponse.json({ error: 'An error occurred while updating the order.' }, { status: 500 });
  }
}
