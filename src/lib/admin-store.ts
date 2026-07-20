import { create } from 'zustand';
import { 
  Medicine, Order, Customer, Supplier, DeliveryStaff, Pharmacist, 
  Notification, AuditLog, AdminUser, AdminRole,
  SalesDataPoint, MedicineSalesDataPoint, RevenueDataPoint, CustomerGrowthDataPoint
} from '../types';

interface AdminStore {
  // Auth State
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: AdminRole) => boolean;
  logout: () => void;

  // CRM Data Collections
  medicines: Medicine[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  deliveryStaff: DeliveryStaff[];
  pharmacists: Pharmacist[];
  notifications: Notification[];
  auditLogs: AuditLog[];

  // Chart Data
  dailySalesTrend: SalesDataPoint[];
  medicineSalesDistribution: MedicineSalesDataPoint[];
  revenueProfitTrend: RevenueDataPoint[];
  customerGrowthTrend: CustomerGrowthDataPoint[];

  // Inventory CRUD
  addMedicine: (med: Omit<Medicine, 'id' | 'created_date' | 'updated_date'>) => void;
  updateMedicine: (id: string, med: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  bulkImportMedicines: (csvPaste: string) => { success: boolean; count: number; error?: string };

  // Orders Actions
  updateOrder: (id: string, updated: Partial<Order>) => void;
  assignPharmacist: (orderId: string, pharmacistId: string) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  cancelOrder: (orderId: string) => void;
  refundOrder: (orderId: string) => void;

  // Customers CRUD
  addCustomer: (cust: Omit<Customer, 'id' | 'created_date'>) => void;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  toggleBlacklistCustomer: (id: string) => void;

  // Notifications Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;

  // Audit Logs
  addAuditLog: (action: string, details: string) => void;
}

// Helper generators for seeding
const generateSuppliers = (): Supplier[] => {
  const names = [
    "PharmaCorp Industries", "Global Health Distributors", "Apex Med Supply", 
    "Vance Medical Solutions", "Nova Bio-Pharma", "MediCare Wholesale Inc", 
    "Alliance RX Logistics", "Ascent Healthcare Labs", "Integrated Clinical Solutions",
    "Pinnacle Pharmaceutical Distributors", "Blue Ridge Diagnostics", "Zephyr LifeSciences"
  ];
  return names.map((name, idx) => ({
    id: `sup-${idx + 1}`,
    name,
    contactPerson: ["Robert Vance", "Jan Levinson", "Dwight Schrute", "Michael Scott", "Jim Halpert", "Pam Beesly", "Angela Martin", "Oscar Martinez", "Kevin Malone", "Toby Flenderson", "Stanley Hudson", "Phyllis Vance"][idx],
    phone: `+1 (555) 100-${2000 + idx}`,
    email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    address: `${idx * 100 + 10} Medical Commerce Drive, Suite ${idx + 1}, Logistics City`,
    status: idx === 11 ? "Inactive" : "Active",
    medicinesCount: Math.floor(Math.random() * 30) + 10
  }));
};

const generateMedicines = (suppliers: Supplier[]): Medicine[] => {
  const categories = [
    { name: "Antibiotics", brands: ["Amoxil", "Zithromax", "Keflex", "Cipro", "Augmentin"], generics: ["Amoxicillin", "Azithromycin", "Cephalexin", "Ciprofloxacin", "Amoxicillin/Clavulanate"] },
    { name: "Analgesics", brands: ["Panadol", "Advil", "Tylenol Extra", "Aspirin Bayer", "Celebrex"], generics: ["Paracetamol", "Ibuprofen", "Acetaminophen", "Acetylsalicylic Acid", "Celecoxib"] },
    { name: "Cardiovascular", brands: ["Lipitor", "Zocor", "Plavix", "Norvasc", "Toprol XL"], generics: ["Atorvastatin", "Simvastatin", "Clopidogrel", "Amlodipine", "Metoprolol Succinate"] },
    { name: "Antidiabetics", brands: ["Glucophage", "Januvia", "Victoza", "Amaryl", "Jardiance"], generics: ["Metformin", "Sitagliptin", "Liraglutide", "Glimepiride", "Empagliflozin"] },
    { name: "Antihistamines", brands: ["Claritin", "Zyrtec", "Allegra", "Benadryl", "Xyzal"], generics: ["Loratadine", "Cetirizine", "Fexofenadine", "Diphenhydramine", "Levocetirizine"] },
    { name: "Respiratory", brands: ["Ventolin", "Singulair", "Symbicort", "Flovent", "Advair Diskus"], generics: ["Albuterol", "Montelukast", "Budesonide/Formoterol", "Fluticasone Propionate", "Fluticasone/Salmeterol"] },
    { name: "Dermatology", brands: ["Cortizone-10", "Differin", "Kenalog", "Eucerin Healing", "Bactroban"], generics: ["Hydrocortisone", "Adapalene", "Triamcinolone Acetonide", "Emollient Cream", "Mupirocin Cream"] },
    { name: "Vitamins", brands: ["Centrum Adult", "Nature Made D3", "One A Day", "Emergen-C", "Solgar Zinc"], generics: ["Multivitamin", "Cholecalciferol", "Multivitamin Complex", "Ascorbylic Acid Complex", "Zinc Gluconate"] }
  ];

  const storageShelves = ["Shelf A-1", "Shelf A-2", "Shelf A-3", "Shelf B-1", "Shelf B-2", "Shelf B-3", "Shelf C-1", "Shelf C-2", "Cold Storage Room (Fridge-1)", "Cold Storage Room (Fridge-2)"];

  const meds: Medicine[] = [];
  let barcodeCounter = 8901234567000;
  let skuCounter = 1000;

  // Let's create exactly 105 medicines programmatically
  for (let i = 0; i < 105; i++) {
    const catIndex = i % categories.length;
    const cat = categories[catIndex];
    const brandIndex = Math.floor(i / categories.length) % cat.brands.length;
    const brand = cat.brands[brandIndex];
    const generic = cat.generics[brandIndex];
    
    const isLowStock = i % 15 === 0; // Low stock every 15 items
    const isNearExpiry = i % 12 === 0; // Near expiry every 12 items
    const isExpired = i === 42 || i === 84; // Exactly 2 expired medicines
    const isOut = i === 15 || i === 75; // Out of stock

    const supplier = suppliers[i % suppliers.length];

    // Expiry date math
    let expiryDate = "2027-12-31";
    if (isExpired) {
      expiryDate = "2026-05-15"; // Past date (local time is July 20, 2026)
    } else if (isNearExpiry) {
      expiryDate = "2026-08-25"; // Very near (within 1-2 months)
    } else {
      expiryDate = `2027-0${(i % 9) + 1}-20`;
    }

    const cost = parseFloat((Math.random() * 20 + 0.5).toFixed(2));
    const price = parseFloat((cost * (Math.random() * 1.5 + 1.5)).toFixed(2));
    
    let stock = Math.floor(Math.random() * 200) + 50;
    if (isLowStock) {
      stock = Math.floor(Math.random() * 5) + 2; // Stock between 2 and 6
    }
    if (isOut) {
      stock = 0;
    }

    const minStock = Math.floor(Math.random() * 15) + 15; // 15 to 30

    meds.push({
      id: `med-${i + 1}`,
      name: `${brand} ${i % 2 === 0 ? "500mg" : "20mg"}`,
      barcode: `${barcodeCounter++}`,
      sku: `${cat.name.slice(0,3).toUpperCase()}-${skuCounter++}`,
      category: cat.name,
      brand: brand,
      generic: generic,
      batch: `B-BATCH${1000 + i}`,
      expiry: expiryDate,
      cost,
      price,
      stock,
      minStock,
      status: stock === 0 ? "Out of Stock" : (i === 104 ? "Discontinued" : "Active"),
      storageLocation: storageShelves[i % storageShelves.length],
      supplierId: supplier.id,
      prescriptionRequired: ["Antibiotics", "Cardiovascular", "Antidiabetics", "Respiratory"].includes(cat.name),
      tax: 5,
      discount: i % 10 === 0 ? 10 : 0,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      created_date: "2026-01-01T00:00:00Z",
      updated_date: "2026-07-15T12:00:00Z"
    });
  }

  return meds;
};

const generateCustomers = (): Customer[] => {
  const names = [
    "Sarah Connor", "John Doe", "Michael Scott", "Dwight Schrute", "Jim Halpert", 
    "Pam Beesly", "Angela Martin", "Oscar Martinez", "Kevin Malone", "Toby Flenderson", 
    "Stanley Hudson", "Phyllis Vance", "Ryan Howard", "Kelly Kapoor", "Creed Bratton", 
    "Andy Bernard", "Erin Hannon", "Meredith Palmer", "Darryl Philbin", "Gabe Lewis", 
    "Robert California", "David Wallace", "Jan Levinson", "Holly Flax", "Roy Anderson"
  ];
  return names.map((name, idx) => ({
    id: `cust-${idx + 1}`,
    name,
    phone: `+1 (555) 500-${3000 + idx}`,
    email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
    totalOrders: Math.floor(Math.random() * 15) + 1,
    totalSpent: parseFloat((Math.random() * 600 + 20).toFixed(2)),
    loyaltyPoints: Math.floor(Math.random() * 500),
    status: idx === 14 ? "Blacklisted" : (idx % 8 === 0 ? "Inactive" : "Active"),
    addresses: [`${idx * 15 + 100} Maple Lane, Scranton, PA`, `${idx * 5 + 400} Oak Avenue, Scranton, PA`],
    orderHistory: [`ord-${idx + 1}`, `ord-${idx + 26}`].filter((_, orderIdx) => orderIdx === 0 || idx % 2 === 0),
    prescriptionHistory: idx % 3 === 0 ? ["https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=60"] : [],
    remarks: idx === 14 ? "Repeated fake prescription uploads." : undefined,
    created_date: `2026-01-${(idx % 28) + 1}T10:00:00Z`
  }));
};

const generateOrders = (customers: Customer[], medicines: Medicine[]): Order[] => {
  const orders: Order[] = [];
  const statusOptions: Order['status'][] = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
  const paymentStatusOptions: Order['paymentStatus'][] = ["Paid", "Paid", "Paid", "Paid", "Unpaid", "Refunded"];
  
  // Create exactly 32 orders to have a rich list
  for (let i = 0; i < 32; i++) {
    const customer = customers[i % customers.length];
    
    // Pick 1 to 3 random medicines
    const orderItemsCount = (i % 3) + 1;
    const items = [];
    let total = 0;
    
    for (let k = 0; k < orderItemsCount; k++) {
      const medIdx = (i * 7 + k * 13) % medicines.length;
      const med = medicines[medIdx];
      const qty = (k % 2) + 1;
      const price = med.price;
      items.push({
        medicineId: med.id,
        name: med.name,
        quantity: qty,
        price
      });
      total += price * qty;
    }

    total = parseFloat(total.toFixed(2));
    const status = i < 4 ? "Pending" : statusOptions[(i) % statusOptions.length];
    const payment = status === "Cancelled" ? "Refunded" : (status === "Pending" ? "Unpaid" : "Paid");
    const delivery = status === "Delivered" ? "Delivered" : (status === "Out for Delivery" ? "In Transit" : (status === "Pending" ? "Pending" : "Assigned"));

    const hour = 9 + (i % 10);
    const day = 10 + (i % 10);
    const orderTime = `2026-07-${day}T0${hour}:30:00Z`;

    orders.push({
      id: `ord-${i + 1}`,
      orderNumber: `ORD-98${400 + i}`,
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.addresses[0],
      medicines: items,
      total,
      status,
      paymentStatus: payment,
      deliveryStatus: delivery as Order['deliveryStatus'],
      paymentMethod: i % 2 === 0 ? "Credit Card" : "Cash on Delivery",
      time: orderTime,
      prescriptionImage: i % 4 === 0 ? "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=60" : undefined,
      notes: i % 5 === 0 ? "Leave at front door." : undefined,
      assignedPharmacist: status !== "Pending" ? ["Dr. Jane Foster", "Dr. Gregory House", "Dr. John Watson"][i % 3] : undefined,
      assignedDriver: status === "Out for Delivery" || status === "Delivered" ? ["Michael Driver", "Toby Transporter", "Dwight Delivery"][i % 3] : undefined,
      created_date: orderTime
    });
  }

  return orders.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

// Seed charts data
const generateDailySales = (): SalesDataPoint[] => [
  { date: "Jul 10", sales: 2450, orders: 15 },
  { date: "Jul 11", sales: 3100, orders: 18 },
  { date: "Jul 12", sales: 2900, orders: 14 },
  { date: "Jul 13", sales: 4200, orders: 25 },
  { date: "Jul 14", sales: 3800, orders: 21 },
  { date: "Jul 15", sales: 5100, orders: 28 },
  { date: "Jul 16", sales: 4900, orders: 26 },
  { date: "Jul 17", sales: 5800, orders: 32 },
  { date: "Jul 18", sales: 6200, orders: 35 },
  { date: "Jul 19", sales: 3900, orders: 20 },
  { date: "Jul 20", sales: 4120, orders: 22 }
];

const generateMedicineSales = (): MedicineSalesDataPoint[] => [
  { name: "Amoxil 500mg", sales: 1200, stock: 95 },
  { name: "Panadol 500mg", sales: 2800, stock: 450 },
  { name: "Lipitor 20mg", sales: 3400, stock: 15 },
  { name: "Glucophage 850", sales: 1800, stock: 250 },
  { name: "Claritin 10mg", sales: 1100, stock: 8 },
  { name: "Ventolin Inhaler", sales: 2200, stock: 110 },
  { name: "Zithromax 250mg", sales: 1500, stock: 85 }
];

const generateRevenueProfitTrend = (): RevenueDataPoint[] => [
  { date: "Jan 2026", revenue: 42000, cost: 26000, profit: 16000 },
  { date: "Feb 2026", revenue: 48000, cost: 29000, profit: 19000 },
  { date: "Mar 2026", revenue: 51000, cost: 31000, profit: 20000 },
  { date: "Apr 2026", revenue: 59000, cost: 35000, profit: 24000 },
  { date: "May 2026", revenue: 65000, cost: 39000, profit: 26000 },
  { date: "Jun 2026", revenue: 72000, cost: 43000, profit: 29000 },
  { date: "Jul 2026", revenue: 81000, cost: 48000, profit: 33000 }
];

const generateCustomerGrowth = (): CustomerGrowthDataPoint[] => [
  { date: "Jan", customers: 120 },
  { date: "Feb", customers: 150 },
  { date: "Mar", customers: 190 },
  { date: "Apr", customers: 240 },
  { date: "May", customers: 310 },
  { date: "Jun", customers: 390 },
  { date: "Jul", customers: 480 }
];

// Initial collections setup
const suppliersSeed = generateSuppliers();
const medicinesSeed = generateMedicines(suppliersSeed);
const customersSeed = generateCustomers();
const ordersSeed = generateOrders(customersSeed, medicinesSeed);

export const useAdminStore = create<AdminStore>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,

  // Seed Data
  medicines: medicinesSeed,
  orders: ordersSeed,
  customers: customersSeed,
  suppliers: suppliersSeed,
  
  deliveryStaff: [
    { id: "drv-1", name: "Michael Driver", phone: "+1 (555) 700-1111", status: "Available", vehicle: "E-Bike 1" },
    { id: "drv-2", name: "Toby Transporter", phone: "+1 (555) 700-2222", status: "On Delivery", vehicle: "E-Bike 2" },
    { id: "drv-3", name: "Dwight Delivery", phone: "+1 (555) 700-3333", status: "Available", vehicle: "Toyota Prius (Car-1)" },
    { id: "drv-4", name: "Jim Courier", phone: "+1 (555) 700-4444", status: "Offline", vehicle: "E-Bike 3" }
  ],

  pharmacists: [
    { id: "phr-1", name: "Dr. Jane Foster", role: "Senior Pharmacist", status: "Available" },
    { id: "phr-2", name: "Dr. Gregory House", role: "Specialist Pharmacist", status: "Busy" },
    { id: "phr-3", name: "Dr. John Watson", role: "Pharmacist", status: "Available" },
    { id: "phr-4", name: "Dr. Beverly Crusher", role: "Senior Pharmacist", status: "Offline" }
  ],

  notifications: [
    { id: "not-1", title: "New Prescription Order", message: "Customer John Doe submitted ORD-98441 requiring approval.", type: "Order", time: "2026-07-20T11:30:00Z", read: false },
    { id: "not-2", title: "Low Stock Warning", message: "Lipitor 20mg has reached 15 units (threshold: 25).", type: "Stock", time: "2026-07-20T08:00:00Z", read: false },
    { id: "not-3", title: "Expired Medicine Found", message: "Amoxil 500mg Batch B-AMX098 has 2 expired packages in Shelf A-3.", type: "Expiry", time: "2026-07-19T10:00:00Z", read: true },
    { id: "not-4", title: "System Scheduled Backup", message: "Database backup completed successfully.", type: "System", time: "2026-07-19T01:00:00Z", read: true }
  ],

  auditLogs: [
    { id: "log-1", user: "admin@primepharmacy.com", role: "Admin", action: "User Login", details: "Successful login to the Admin Panel.", timestamp: "2026-07-20T14:00:00Z" },
    { id: "log-2", user: "admin@primepharmacy.com", role: "Admin", action: "Update Stock", details: "Adjusted stock for Paracetamol 500mg by +50 units.", timestamp: "2026-07-20T11:45:00Z" }
  ],

  // Charts
  dailySalesTrend: generateDailySales(),
  medicineSalesDistribution: generateMedicineSales(),
  revenueProfitTrend: generateRevenueProfitTrend(),
  customerGrowthTrend: generateCustomerGrowth(),

  // Auth Operations
  login: (email, password, role) => {
    // Check credentials
    if (email === "admin@primepharmacy.com" && password === "admin123") {
      const user: AdminUser = {
        id: "admin-user",
        name: "Admin Administrator",
        email,
        role,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=facearea&facepad=2&q=80"
      };

      // Set state
      set({ currentUser: user, isAuthenticated: true });
      
      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("prime_crm_user", JSON.stringify(user));
        localStorage.setItem("prime_crm_token", "jwt-mock-token-prime-pharmacy-crm-2026");
      }

      get().addAuditLog("Login", `Logged in successfully as ${role}`);
      return true;
    }
    return false;
  },

  logout: () => {
    const user = get().currentUser;
    if (user) {
      get().addAuditLog("Logout", `Logged out as ${user.role}`);
    }
    set({ currentUser: null, isAuthenticated: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem("prime_crm_user");
      localStorage.removeItem("prime_crm_token");
    }
  },

  // Inventory Operations
  addMedicine: (med) => {
    const newMed: Medicine = {
      ...med,
      id: `med-${get().medicines.length + 1}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    set((state) => ({ medicines: [newMed, ...state.medicines] }));
    get().addAuditLog("Add Medicine", `Added new medicine: ${med.name}`);
  },

  updateMedicine: (id, med) => {
    set((state) => ({
      medicines: state.medicines.map((m) => m.id === id ? { 
        ...m, 
        ...med, 
        updated_date: new Date().toISOString(),
        status: (med.stock !== undefined && med.stock <= 0) ? 'Out of Stock' : (med.status || m.status)
      } : m)
    }));
    get().addAuditLog("Update Medicine", `Updated medicine ID: ${id}`);
  },

  deleteMedicine: (id) => {
    const medName = get().medicines.find(m => m.id === id)?.name || id;
    set((state) => ({ medicines: state.medicines.filter((m) => m.id !== id) }));
    get().addAuditLog("Delete Medicine", `Deleted medicine: ${medName}`);
  },

  bulkImportMedicines: (csvPaste) => {
    try {
      const lines = csvPaste.trim().split("\n");
      if (lines.length < 2) return { success: false, count: 0, error: "Empty or invalid CSV. Must have a header row and at least one data row." };
      
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const newMeds: Medicine[] = [];
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
        
        // Match columns
        const medData: any = {};
        headers.forEach((h, idx) => {
          if (cols[idx] !== undefined) {
            medData[h] = cols[idx];
          }
        });

        const name = medData.name || "Unnamed Medicine";
        const barcode = medData.barcode || `BAR-${Math.floor(Math.random() * 10000000)}`;
        const sku = medData.sku || `SKU-${Math.floor(Math.random() * 100000)}`;
        const category = medData.category || "General";
        const brand = medData.brand || name.split(" ")[0];
        const generic = medData.generic || name;
        const batch = medData.batch || "B-IMPORT";
        const expiry = medData.expiry || "2028-12-31";
        const cost = parseFloat(medData.cost) || 1.0;
        const price = parseFloat(medData.price) || 2.0;
        const stock = parseInt(medData.stock, 10) || 50;
        const minStock = parseInt(medData.minstock, 10) || 10;
        const storageLocation = medData.storagelocation || "Shelf-Import";
        const supplierId = medData.supplierid || "sup-1";
        const rx = medData.prescriptionrequired === "true" || medData.rx === "true" || false;

        newMeds.push({
          id: `med-imported-${Date.now()}-${i}`,
          name,
          barcode,
          sku,
          category,
          brand,
          generic,
          batch,
          expiry,
          cost,
          price,
          stock,
          minStock,
          status: stock === 0 ? "Out of Stock" : "Active",
          storageLocation,
          supplierId,
          prescriptionRequired: rx,
          tax: 5,
          discount: 0,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        });
        importedCount++;
      }

      set((state) => ({ medicines: [...newMeds, ...state.medicines] }));
      get().addAuditLog("Bulk Import", `Imported ${importedCount} medicines via CSV.`);
      return { success: true, count: importedCount };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || "Failed to parse CSV data." };
    }
  },

  // Orders Operations
  updateOrder: (id, updated) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === id ? { ...o, ...updated } : o)
    }));
    get().addAuditLog("Update Order", `Updated order ID: ${id}`);
  },

  assignPharmacist: (orderId, pharmacistId) => {
    const pharma = get().pharmacists.find(p => p.id === pharmacistId);
    if (!pharma) return;

    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, assignedPharmacist: pharma.name } : o)
    }));
    get().addAuditLog("Assign Pharmacist", `Assigned pharmacist ${pharma.name} to order: ${orderId}`);
  },

  assignDriver: (orderId, driverId) => {
    const driver = get().deliveryStaff.find(d => d.id === driverId);
    if (!driver) return;

    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, assignedDriver: driver.name, deliveryStatus: 'Assigned' } : o)
    }));
    get().addAuditLog("Assign Driver", `Assigned driver ${driver.name} to order: ${orderId}`);
  },

  approveOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'Confirmed', paymentStatus: 'Paid' } : o)
    }));
    get().addAuditLog("Approve Order", `Approved prescription order: ${orderId}`);
    get().addNotification("Order Approved", `Prescription order ${orderId} has been approved and moved to Confirmed.`, "Order");
  },

  rejectOrder: (orderId, reason) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'Cancelled', notes: `Rejected: ${reason}` } : o)
    }));
    get().addAuditLog("Reject Order", `Rejected order: ${orderId}. Reason: ${reason}`);
    get().addNotification("Order Rejected", `Order ${orderId} rejected. Reason: ${reason}`, "Order");
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'Cancelled' } : o)
    }));
    get().addAuditLog("Cancel Order", `Cancelled order: ${orderId}`);
  },

  refundOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => o.id === orderId ? { ...o, paymentStatus: 'Refunded', status: 'Cancelled' } : o)
    }));
    get().addAuditLog("Refund Order", `Refunded payments for order: ${orderId}`);
  },

  // Customers Operations
  addCustomer: (cust) => {
    const newCust: Customer = {
      ...cust,
      id: `cust-${get().customers.length + 1}`,
      created_date: new Date().toISOString()
    };
    set((state) => ({ customers: [newCust, ...state.customers] }));
    get().addAuditLog("Add Customer", `Added new customer: ${cust.name}`);
  },

  updateCustomer: (id, cust) => {
    set((state) => ({
      customers: state.customers.map((c) => c.id === id ? { ...c, ...cust } : c)
    }));
    get().addAuditLog("Update Customer", `Updated customer ID: ${id}`);
  },

  deleteCustomer: (id) => {
    const name = get().customers.find(c => c.id === id)?.name || id;
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
    get().addAuditLog("Delete Customer", `Deleted customer: ${name}`);
  },

  toggleBlacklistCustomer: (id) => {
    set((state) => ({
      customers: state.customers.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'Blacklisted' ? 'Active' : 'Blacklisted';
          get().addAuditLog("Customer Status Change", `Changed customer ${c.name} status to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    }));
  },

  // Notifications Operations
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },

  addNotification: (title, message, type) => {
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      title,
      message,
      type,
      time: new Date().toISOString(),
      read: false
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  // Audit Logs Operations
  addAuditLog: (action, details) => {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      user: get().currentUser?.email || "System",
      role: get().currentUser?.role || "System",
      action,
      details,
      timestamp: new Date().toISOString()
    };
    set((state) => ({ auditLogs: [log, ...state.auditLogs] }));
  }
}));
