export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string; // 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE_PRESCRIPTION', 'REORDER'
  entity: string; // 'Auth', 'Order', 'Medicine', 'Supplier', 'Customer'
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

// In-memory array store for audit logs. Pre-populate for demo realism
export let auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'staff-admin',
    userName: 'Dr. Tariq Al-Amri',
    userRole: 'admin',
    action: 'LOGIN',
    entity: 'Auth',
    entityId: 'staff-admin',
    details: 'Admin logged in successfully.',
    ipAddress: '192.168.1.50',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 'log-2',
    userId: 'staff-pharmacist',
    userName: 'Samer El-Masri (RPh)',
    userRole: 'pharmacist',
    action: 'APPROVE_PRESCRIPTION',
    entity: 'Order',
    entityId: 'ord-12',
    details: 'Approved prescription image for Augmentin order.',
    ipAddress: '192.168.1.55',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString() // 18 hours ago
  },
  {
    id: 'log-3',
    userId: 'staff-admin',
    userName: 'Dr. Tariq Al-Amri',
    userRole: 'admin',
    action: 'UPDATE',
    entity: 'Medicine',
    entityId: 'med-1',
    details: 'Updated Panadol Advance stock from 100 to 150 units.',
    ipAddress: '192.168.1.50',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    id: 'log-4',
    userId: 'staff-pharmacist',
    userName: 'Samer El-Masri (RPh)',
    userRole: 'pharmacist',
    action: 'CREATE',
    entity: 'Supplier',
    entityId: 'sup-11',
    details: 'Registered Universal Infant Health as a supplier.',
    ipAddress: '192.168.1.55',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString() // 6 hours ago
  }
];

// Key for local storage in browser
const STORAGE_KEY = 'prime_pharmacy_audit_logs';

// Synchronize logs from localStorage if in browser environment
function initLogs() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        auditLogs = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored audit logs:', e);
      }
    }
  }
}

// Call init once
initLogs();

/**
 * Logs an action in the system audit trail.
 */
export function logAction(
  userId: string,
  userRole: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  details: string,
  req?: Request
): AuditLog {
  // Capture IP address from NextRequest if available, else local
  let ipAddress = '127.0.0.1';
  if (req) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    ipAddress = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
  }

  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole,
    action,
    entity,
    entityId,
    details,
    ipAddress,
    createdAt: new Date().toISOString()
  };

  auditLogs.unshift(log); // Prepend to show newest first

  // Sync to localStorage if in browser
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to sync audit logs to localStorage:', e);
    }
  }

  console.log(`[AUDIT LOG] [${log.action}] [${log.entity}] User: ${log.userName} (${log.userRole}) | Details: ${log.details}`);
  return log;
}

/**
 * Fetch and filter audit logs
 */
export function getLogs(filters?: {
  userId?: string;
  userRole?: string;
  action?: string;
  entity?: string;
  search?: string;
}): AuditLog[] {
  let logs = [...auditLogs];

  if (!filters) return logs;

  if (filters.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  if (filters.userRole) {
    logs = logs.filter(l => l.userRole === filters.userRole);
  }
  if (filters.action) {
    logs = logs.filter(l => l.action.toUpperCase() === filters.action?.toUpperCase());
  }
  if (filters.entity) {
    logs = logs.filter(l => l.entity.toUpperCase() === filters.entity?.toUpperCase());
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    logs = logs.filter(l => 
      l.details.toLowerCase().includes(query) ||
      l.userName.toLowerCase().includes(query) ||
      l.entityId.toLowerCase().includes(query)
    );
  }

  return logs;
}
