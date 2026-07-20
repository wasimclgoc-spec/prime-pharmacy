// Comprehensive Seed Data for Prime Pharmacy

export interface Medicine {
  id: string;
  name: string;
  generic: string;
  brand: string;
  strength: string;
  price: number;
  stock: number;
  category: string;
  batch: string;
  expiry: string;
  supplier: string;
  barcode: string;
  SKU: string;
  prescriptionRequired: boolean;
  imagePlaceholder: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // SHA-256 for 'password123' etc
  role: 'customer';
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  profile: {
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    allergies: string[];
    chronicConditions: string[];
  };
  orderHistory: string[]; // List of orderIds
}

export interface OrderItem {
  medicineId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  vatAmount: number; // 15% VAT
  grandTotal: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  prescriptionUrl?: string;
  shippingAddress: string;
  paymentMethod: 'Cash on Delivery' | 'Credit Card' | 'Apple Pay' | 'Insurance';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryStaffId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  categoriesSupplied: string[];
}

export interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  vehicleNumber: string;
}

export interface SalesMonthly {
  month: string; // "Jan", "Feb", etc.
  revenue: number;
  ordersCount: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    medicineId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  createdAt: string;
}

// 12 Categories as requested
export const categories = [
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Diabetes',
  'Heart',
  'Cold & Flu',
  'Skin Care',
  'Baby Care',
  'First Aid',
  'Digestive',
  'Respiratory',
  'Mental Health'
];

// Helper to hash password matching security hashPassword (SHA-256)
function hashString(str: string): string {
  // Built-in standard Node crypto-like hash simulation if run client-side,
  // or a pre-calculated hash. 'password123' precalculated SHA-256:
  // "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
  return "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";
}

// Suppliers - 10+ suppliers
export const suppliers: Supplier[] = [
  { id: 'sup-1', name: 'Gulf Pharma Corp', contactName: 'Ahmad Al-Mansoor', email: 'ahmad@gulfpharma.com', phone: '+966551234561', address: 'Olaya District, Riyadh, KSA', categoriesSupplied: ['Antibiotics', 'Pain Relief', 'Heart'] },
  { id: 'sup-2', name: 'Medica Logistics Ltd', contactName: 'Sara Smith', email: 'sara@medicalog.com', phone: '+966551234562', address: 'Jeddah Industrial City, KSA', categoriesSupplied: ['Vitamins', 'Skin Care', 'Baby Care'] },
  { id: 'sup-3', name: 'Saudi Pharmaceutical Industries (SPI)', contactName: 'Fahad Al-Qahtani', email: 'fahad@spi.com.sa', phone: '+966551234563', address: 'Al-Khobar, KSA', categoriesSupplied: ['Diabetes', 'Digestive', 'Respiratory'] },
  { id: 'sup-4', name: 'Global BioLabs', contactName: 'Dr. Robert Carter', email: 'info@globalbiolabs.com', phone: '+442079460192', address: 'London, UK', categoriesSupplied: ['Mental Health', 'Vitamins'] },
  { id: 'sup-5', name: 'CareFirst Wholesalers', contactName: 'Yousef Hassan', email: 'yousef@carefirst.com', phone: '+966551234564', address: 'Dammam, KSA', categoriesSupplied: ['First Aid', 'Cold & Flu', 'Baby Care'] },
  { id: 'sup-6', name: 'Elite Derm Supplies', contactName: 'Layla Ghamdi', email: 'layla@elitederm.com', phone: '+966551234565', address: 'Riyadh, KSA', categoriesSupplied: ['Skin Care'] },
  { id: 'sup-7', name: 'Al-Haya Medical Company', contactName: 'Khalid Al-Saeed', email: 'khalid@alhaya.com.sa', phone: '+966551234566', address: 'Batha, Riyadh, KSA', categoriesSupplied: ['Pain Relief', 'Diabetes', 'Heart'] },
  { id: 'sup-8', name: 'PureLife Wellness', contactName: 'Chloe Dupont', email: 'chloe@purelifewellness.com', phone: '+33140506070', address: 'Paris, France', categoriesSupplied: ['Vitamins', 'Mental Health'] },
  { id: 'sup-9', name: 'BioPharma KSA', contactName: 'Muneer Al-Harbi', email: 'muneer@biopharmaksa.com', phone: '+966551234567', address: 'Medina, KSA', categoriesSupplied: ['Antibiotics', 'Respiratory'] },
  { id: 'sup-10', name: 'National Medical Care Co.', contactName: 'Tariq Al-Amri', email: 'tariq@care.com.sa', phone: '+966551234568', address: 'Malaz, Riyadh, KSA', categoriesSupplied: ['First Aid', 'Cold & Flu', 'Digestive'] },
  { id: 'sup-11', name: 'Universal Infant Health', contactName: 'Nadia Ibrahim', email: 'nadia@universalinfant.com', phone: '+966551234569', address: 'Jeddah, KSA', categoriesSupplied: ['Baby Care'] }
];

// Delivery Staff - 6+ delivery staff
export const deliveryStaff: DeliveryStaff[] = [
  { id: 'staff-1', name: 'Yasir Khan', phone: '+966559876541', email: 'yasir@primepharmacy.com', status: 'available', vehicleNumber: 'M-1029-KSA' },
  { id: 'staff-2', name: 'Abdulrahman Al-Enazi', phone: '+966559876542', email: 'abdulrahman@primepharmacy.com', status: 'busy', vehicleNumber: 'V-9932-KSA' },
  { id: 'staff-3', name: 'Sajid Mehmood', phone: '+966559876543', email: 'sajid@primepharmacy.com', status: 'available', vehicleNumber: 'M-5531-KSA' },
  { id: 'staff-4', name: 'Hussain Al-Marzouq', phone: '+966559876544', email: 'hussain@primepharmacy.com', status: 'offline', vehicleNumber: 'V-1024-KSA' },
  { id: 'staff-5', name: 'Imran Ali', phone: '+966559876545', email: 'imran@primepharmacy.com', status: 'available', vehicleNumber: 'M-4819-KSA' },
  { id: 'staff-6', name: 'Tareq Al-Balawi', phone: '+966559876546', email: 'tareq@primepharmacy.com', status: 'busy', vehicleNumber: 'V-2051-KSA' }
];

// Generate Medicines - 100+ medicines with all fields
const rawMedTemplates = [
  // Pain Relief
  { name: 'Panadol Advance', generic: 'Paracetamol', brand: 'GSK', strength: '500mg', price: 12.50, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Panadol Extra', generic: 'Paracetamol + Caffeine', brand: 'GSK', strength: '500mg/65mg', price: 15.00, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Solpaflex', generic: 'Ibuprofen + Paracetamol', brand: 'GSK', strength: '200mg/500mg', price: 18.00, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Voltaren Emulgel', generic: 'Diclofenac Diethylamine', brand: 'Novartis', strength: '1.16% (50g)', price: 24.50, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Cataflam', generic: 'Diclofenac Potassium', brand: 'Novartis', strength: '50mg', price: 21.00, category: 'Pain Relief', prescriptionRequired: true },
  { name: 'Brufen', generic: 'Ibuprofen', brand: 'Abbott', strength: '400mg', price: 14.50, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Advil', generic: 'Ibuprofen', brand: 'Pfizer', strength: '200mg', price: 13.00, category: 'Pain Relief', prescriptionRequired: false },
  { name: 'Tramal', generic: 'Tramadol Hydrochloride', brand: 'Grunenthal', strength: '50mg', price: 45.00, category: 'Pain Relief', prescriptionRequired: true },
  { name: 'Celebrex', generic: 'Celecoxib', brand: 'Pfizer', strength: '200mg', price: 68.00, category: 'Pain Relief', prescriptionRequired: true },
  { name: 'Panadol Joint', generic: 'Paracetamol', brand: 'GSK', strength: '665mg', price: 19.50, category: 'Pain Relief', prescriptionRequired: false },

  // Antibiotics
  { name: 'Augmentin', generic: 'Amoxicillin + Clavulanic Acid', brand: 'GSK', strength: '1g', price: 58.50, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Zithromax', generic: 'Azithromycin', brand: 'Pfizer', strength: '250mg', price: 42.00, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Ciprobay', generic: 'Ciprofloxacin', brand: 'Bayer', strength: '500mg', price: 34.00, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Keflex', generic: 'Cephalexin', brand: 'Eli Lilly', strength: '500mg', price: 28.50, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Amoxil', generic: 'Amoxicillin', brand: 'GSK', strength: '500mg', price: 19.00, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Klacid', generic: 'Clarithromycin', brand: 'Abbott', strength: '500mg', price: 74.00, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Suprax', generic: 'Cefixime', brand: 'Hikma', strength: '400mg', price: 62.00, category: 'Antibiotics', prescriptionRequired: true },
  { name: 'Flagyl', generic: 'Metronidazole', brand: 'Sanofi', strength: '500mg', price: 15.50, category: 'Antibiotics', prescriptionRequired: true },

  // Vitamins & Supplements
  { name: 'Centrum Lutein', generic: 'Multivitamins + Minerals', brand: 'Pfizer', strength: '100 Tabs', price: 85.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'Ostocare', generic: 'Calcium + Vitamin D3 + Magnesium', brand: 'Vitabiotics', strength: '30 Tabs', price: 35.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'Neurobion', generic: 'Vitamin B1 + B6 + B12', brand: 'Merck', strength: '20 Tabs', price: 18.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'Seven Seas Cod Liver Oil', generic: 'Omega-3 + Vitamin D', brand: 'Seven Seas', strength: '100 Capsules', price: 45.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'Solgar Vitamin D3', generic: 'Cholecalciferol', brand: 'Solgar', strength: '5000 IU', price: 95.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'C-Retard', generic: 'Vitamin C (Ascorbic Acid)', brand: 'Saja Pharma', strength: '500mg', price: 22.00, category: 'Vitamins', prescriptionRequired: false },
  { name: 'Perfectil Hair', generic: 'Micronutrient + Vitamin Supplement', brand: 'Vitabiotics', strength: '30 Capsules', price: 110.00, category: 'Vitamins', prescriptionRequired: false },

  // Diabetes
  { name: 'Glucophage', generic: 'Metformin Hydrochloride', brand: 'Merck', strength: '500mg', price: 18.50, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Glucophage XR', generic: 'Metformin Hydrochloride (Extended Release)', brand: 'Merck', strength: '1000mg', price: 34.00, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Diamicron MR', generic: 'Gliclazide', brand: 'Servier', strength: '60mg', price: 42.50, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Jardiance', generic: 'Empagliflozin', brand: 'Boehringer Ingelheim', strength: '10mg', price: 185.00, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Januvia', generic: 'Sitagliptin', brand: 'MSD', strength: '100mg', price: 162.00, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Victoza Pen', generic: 'Liraglutide', brand: 'Novo Nordisk', strength: '6mg/ml', price: 380.00, category: 'Diabetes', prescriptionRequired: true },
  { name: 'Daonil', generic: 'Glibenclamide', brand: 'Sanofi', strength: '5mg', price: 12.00, category: 'Diabetes', prescriptionRequired: true },

  // Heart & Blood Pressure
  { name: 'Concor', generic: 'Bisoprolol Fumarate', brand: 'Merck', strength: '5mg', price: 24.00, category: 'Heart', prescriptionRequired: true },
  { name: 'Lipitor', generic: 'Atorvastatin Calcium', brand: 'Pfizer', strength: '20mg', price: 98.00, category: 'Heart', prescriptionRequired: true },
  { name: 'Exforge', generic: 'Amlodipine + Valsartan', brand: 'Novartis', strength: '5mg/160mg', price: 122.00, category: 'Heart', prescriptionRequired: true },
  { name: 'Plavix', generic: 'Clopidogrel Bisulfate', brand: 'Sanofi', strength: '75mg', price: 145.00, category: 'Heart', prescriptionRequired: true },
  { name: 'Crestor', generic: 'Rosuvastatin Calcium', brand: 'AstraZeneca', strength: '10mg', price: 115.00, category: 'Heart', prescriptionRequired: true },
  { name: 'Aspirin Protect', generic: 'Acetylsalicylic Acid', brand: 'Bayer', strength: '100mg', price: 11.50, category: 'Heart', prescriptionRequired: false },
  { name: 'Zestril', generic: 'Lisinopril', brand: 'AstraZeneca', strength: '10mg', price: 38.00, category: 'Heart', prescriptionRequired: true },

  // Cold & Flu
  { name: 'Clarinase', generic: 'Loratadine + Pseudoephedrine', brand: 'Bayer', strength: '5mg/120mg', price: 24.50, category: 'Cold & Flu', prescriptionRequired: false },
  { name: 'Flutab', generic: 'Paracetamol + Pseudoephedrine + Diphenhydramine', brand: 'Saja', strength: '325/30/15mg', price: 14.00, category: 'Cold & Flu', prescriptionRequired: false },
  { name: 'Panadol Cold & Flu All in One', generic: 'Paracetamol + Phenylephrine + Guaifenesin', brand: 'GSK', strength: '250/5/100mg', price: 16.50, category: 'Cold & Flu', prescriptionRequired: false },
  { name: 'Solpadeine Soluble', generic: 'Paracetamol + Codeine + Caffeine', brand: 'GSK', strength: '500/8/30mg', price: 18.00, category: 'Cold & Flu', prescriptionRequired: true },
  { name: 'Otrivin Nasal Spray', generic: 'Xylometazoline Hydrochloride', brand: 'Novartis', strength: '0.1%', price: 15.00, category: 'Cold & Flu', prescriptionRequired: false },
  { name: 'Strepsils Honey & Lemon', generic: 'Amylmetacresol + Dichlorobenzyl Alcohol', brand: 'Reckitt', strength: '24 Lozenges', price: 19.00, category: 'Cold & Flu', prescriptionRequired: false },
  { name: 'Zyrtec', generic: 'Cetirizine Dihydrochloride', brand: 'UCB', strength: '10mg', price: 16.00, category: 'Cold & Flu', prescriptionRequired: false },

  // Skin Care
  { name: 'Bepanthen Moisturizing Cream', generic: 'Dexpanthenol', brand: 'Bayer', strength: '100g', price: 42.00, category: 'Skin Care', prescriptionRequired: false },
  { name: 'Fucidin Cream', generic: 'Fusidic Acid', brand: 'Leo Pharma', strength: '2% (20g)', price: 18.50, category: 'Skin Care', prescriptionRequired: true },
  { name: 'Elica Cream', generic: 'Mometasone Furoate', brand: 'Jamjoom Pharma', strength: '0.1% (30g)', price: 28.00, category: 'Skin Care', prescriptionRequired: true },
  { name: 'Differin Gel', generic: 'Adapalene', brand: 'Galderma', strength: '0.1% (30g)', price: 34.00, category: 'Skin Care', prescriptionRequired: false },
  { name: 'Bioderma Sensibio H2O', generic: 'Micellar Water Cleanser', brand: 'Bioderma', strength: '500ml', price: 95.00, category: 'Skin Care', prescriptionRequired: false },
  { name: 'Cetaphil Gentle Skin Cleanser', generic: 'Gentle Cetyl/Stearyl Alcohol Cleanser', brand: 'Galderma', strength: '500ml', price: 88.00, category: 'Skin Care', prescriptionRequired: false },

  // Baby Care
  { name: 'Sudocrem', generic: 'Zinc Oxide Cream', brand: 'Teva', strength: '125g', price: 38.00, category: 'Baby Care', prescriptionRequired: false },
  { name: 'Mustela Gentle Cleansing Gel', generic: 'Baby Soap-Free Cleanser', brand: 'Mustela', strength: '500ml', price: 78.00, category: 'Baby Care', prescriptionRequired: false },
  { name: 'Pampers Premium Protection Size 3', generic: 'Baby Diapers', brand: 'P&G', strength: '56 Diapers', price: 82.00, category: 'Baby Care', prescriptionRequired: false },
  { name: 'Similac Gold 1', generic: 'Infant Milk Formula', brand: 'Abbott', strength: '400g', price: 48.50, category: 'Baby Care', prescriptionRequired: false },
  { name: 'Dentinox Infant Colic Drops', generic: 'Activated Dimeticone', brand: 'Dentinox', strength: '100ml', price: 29.00, category: 'Baby Care', prescriptionRequired: false },

  // First Aid
  { name: 'Dettol Antiseptic Liquid', generic: 'Chloroxylenol', brand: 'Reckitt', strength: '500ml', price: 28.00, category: 'First Aid', prescriptionRequired: false },
  { name: 'Elastoplast Fabric Plasters', generic: 'Wound Dressing Bandages', brand: 'Beiersdorf', strength: '40 Pack', price: 12.00, category: 'First Aid', prescriptionRequired: false },
  { name: 'Betadine Antiseptic Solution', generic: 'Povidone-Iodine', brand: 'Mundipharma', strength: '10% (120ml)', price: 19.50, category: 'First Aid', prescriptionRequired: false },
  { name: 'Micropore Surgical Tape', generic: 'Paper Surgical Tape', brand: '3M', strength: '1 Inch', price: 8.50, category: 'First Aid', prescriptionRequired: false },
  { name: 'Sterile Gauze Swabs', generic: 'Cotton Gauze Pads', brand: 'Pharmaplast', strength: '10x10cm (100 Pack)', price: 22.00, category: 'First Aid', prescriptionRequired: false },

  // Digestive Health
  { name: 'Nexium', generic: 'Esomeprazole Magnesium', brand: 'AstraZeneca', strength: '40mg', price: 110.00, category: 'Digestive', prescriptionRequired: true },
  { name: 'Gaviscon Double Action', generic: 'Sodium Alginate + Calcium Carbonate', brand: 'Reckitt', strength: '150ml Liquid', price: 28.00, category: 'Digestive', prescriptionRequired: false },
  { name: 'Duspatalin Retard', generic: 'Mebeverine Hydrochloride', brand: 'Abbott', strength: '200mg', price: 48.00, category: 'Digestive', prescriptionRequired: true },
  { name: 'Motilium', generic: 'Domperidone', brand: 'Janssen', strength: '10mg', price: 19.00, category: 'Digestive', prescriptionRequired: true },
  { name: 'Imodium', generic: 'Loperamide Hydrochloride', brand: 'Janssen', strength: '2mg', price: 16.50, category: 'Digestive', prescriptionRequired: false },
  { name: 'Sennalax', generic: 'Senna Glycosides', brand: 'Saja', strength: '7.5mg', price: 14.00, category: 'Digestive', prescriptionRequired: false },

  // Respiratory Health
  { name: 'Ventolin Evohaler', generic: 'Salbutamol Sulfate', brand: 'GSK', strength: '100mcg', price: 18.00, category: 'Respiratory', prescriptionRequired: true },
  { name: 'Symbicort Turbuhaler', generic: 'Budesonide + Formoterol', brand: 'AstraZeneca', strength: '160mcg/4.5mcg', price: 178.00, category: 'Respiratory', prescriptionRequired: true },
  { name: 'Flixonase Nasal Spray', generic: 'Fluticasone Propionate', brand: 'GSK', strength: '50mcg', price: 38.50, category: 'Respiratory', prescriptionRequired: true },
  { name: 'Prospan Cough Syrup', generic: 'Ivy Leaf Extract', brand: 'Engelhard Arzneimittel', strength: '100ml', price: 32.00, category: 'Respiratory', prescriptionRequired: false },
  { name: 'Singulair', generic: 'Montelukast Sodium', brand: 'MSD', strength: '10mg', price: 124.00, category: 'Respiratory', prescriptionRequired: true },

  // Mental Health
  { name: 'Cipralex', generic: 'Escitalopram Oxalate', brand: 'Lundbeck', strength: '10mg', price: 92.00, category: 'Mental Health', prescriptionRequired: true },
  { name: 'Prozac', generic: 'Fluoxetine Hydrochloride', brand: 'Eli Lilly', strength: '20mg', price: 114.00, category: 'Mental Health', prescriptionRequired: true },
  { name: 'Xanax', generic: 'Alprazolam', brand: 'Pfizer', strength: '0.5mg', price: 48.00, category: 'Mental Health', prescriptionRequired: true },
  { name: 'Lexotanil', generic: 'Bromazepam', brand: 'Roche', strength: '3mg', price: 29.00, category: 'Mental Health', prescriptionRequired: true },
  { name: 'Seroquel', generic: 'Quetiapine Fumarate', brand: 'AstraZeneca', strength: '100mg', price: 148.00, category: 'Mental Health', prescriptionRequired: true }
];

export const medicines: Medicine[] = [];

// Expand list programmatically to 100+ unique, detailed medicines
let medCounter = 1;
rawMedTemplates.forEach((med, idx) => {
  // Push the original
  const mainMedId = `med-${medCounter++}`;
  const supplierObj = suppliers[idx % suppliers.length];
  medicines.push({
    id: mainMedId,
    name: med.name,
    generic: med.generic,
    brand: med.brand,
    strength: med.strength,
    price: med.price,
    stock: 20 + (idx * 7) % 150,
    category: med.category,
    batch: `B-${1000 + idx}A`,
    expiry: `2027-${String((idx % 12) + 1).padStart(2, '0')}-28`,
    supplier: supplierObj.name,
    barcode: `628110${String(100000 + idx)}`,
    SKU: `SKU-${med.category.slice(0, 3).toUpperCase()}-${String(100 + idx)}`,
    prescriptionRequired: med.prescriptionRequired,
    imagePlaceholder: `/images/placeholder/meds/${mainMedId}.jpg`
  });

  // Push an alternative strength/pack-size to make up 100+ medicines
  let altStrength = 'Double Strength';
  let altPriceMultiplier = 1.6;
  if (med.strength.includes('mg')) {
    const mgVal = parseInt(med.strength, 10);
    if (!isNaN(mgVal)) {
      altStrength = `${mgVal * 2}mg`;
    }
  } else if (med.strength.includes('g')) {
    altStrength = '500mg';
    altPriceMultiplier = 0.5;
  } else if (med.strength.includes('Pack') || med.strength.includes('Tabs') || med.strength.includes('Capsules')) {
    altStrength = '60 Pack';
    altPriceMultiplier = 1.8;
  }

  const altMedId = `med-${medCounter++}`;
  medicines.push({
    id: altMedId,
    name: `${med.name} Forte`,
    generic: med.generic,
    brand: med.brand,
    strength: altStrength,
    price: Math.round(med.price * altPriceMultiplier * 100) / 100,
    stock: 10 + (idx * 5) % 80,
    category: med.category,
    batch: `B-${1000 + idx}B`,
    expiry: `2027-${String(((idx + 3) % 12) + 1).padStart(2, '0')}-28`,
    supplier: supplierObj.name,
    barcode: `628110${String(200000 + idx)}`,
    SKU: `SKU-${med.category.slice(0, 3).toUpperCase()}-${String(200 + idx)}`,
    prescriptionRequired: med.prescriptionRequired,
    imagePlaceholder: `/images/placeholder/meds/${altMedId}.jpg`
  });
});

// Pad more to reach strictly > 100 unique medicines
while (medicines.length < 110) {
  const base = rawMedTemplates[medicines.length % rawMedTemplates.length];
  const uniqueId = `med-${medCounter++}`;
  const supp = suppliers[medicines.length % suppliers.length];
  medicines.push({
    id: uniqueId,
    name: `${base.name} Ultra Extra`,
    generic: base.generic,
    brand: base.brand,
    strength: '750mg',
    price: Math.round(base.price * 2.2 * 100) / 100,
    stock: 5 + (medCounter * 11) % 60,
    category: base.category,
    batch: `B-${2000 + medCounter}`,
    expiry: `2028-05-12`,
    supplier: supp.name,
    barcode: `628110${String(300000 + medCounter)}`,
    SKU: `SKU-${base.category.slice(0, 3).toUpperCase()}-${String(300 + medCounter)}`,
    prescriptionRequired: base.prescriptionRequired,
    imagePlaceholder: `/images/placeholder/meds/${uniqueId}.jpg`
  });
}

// 20+ Customers
export const customers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Fahad Al-Harbi',
    email: 'fahad@gmail.com',
    phone: '+966551122334',
    passwordHash: hashString('password123'),
    role: 'customer',
    address: { street: 'King Fahd Rd, Al-Huda District', city: 'Jeddah', state: 'Makkah Region', zip: '23321', country: 'KSA' },
    profile: { age: 34, gender: 'Male', bloodGroup: 'O+', allergies: ['Penicillin'], chronicConditions: [] },
    orderHistory: ['ord-1', 'ord-12']
  },
  {
    id: 'cust-2',
    name: 'Sahar Al-Saeed',
    email: 'sahar@hotmail.com',
    phone: '+966552233445',
    passwordHash: hashString('password123'),
    role: 'customer',
    address: { street: 'Tahlia St, Al-Rawdah', city: 'Jeddah', state: 'Makkah Region', zip: '23431', country: 'KSA' },
    profile: { age: 29, gender: 'Female', bloodGroup: 'A-', allergies: [], chronicConditions: [] },
    orderHistory: ['ord-2', 'ord-13', 'ord-21']
  },
  {
    id: 'cust-3',
    name: 'Mohammad Al-Otaibi',
    email: 'mohammad@yahoo.com',
    phone: '+966553344556',
    passwordHash: hashString('password123'),
    role: 'customer',
    address: { street: 'Uthman Ibn Affan Rd, Al-Waha', city: 'Riyadh', state: 'Riyadh Region', zip: '12444', country: 'KSA' },
    profile: { age: 52, gender: 'Male', bloodGroup: 'AB+', allergies: ['Sulfa Drugs'], chronicConditions: ['Diabetes', 'Hypertension'] },
    orderHistory: ['ord-3', 'ord-14']
  },
  {
    id: 'cust-4',
    name: 'Amal Al-Ghamdi',
    email: 'amal.ghamdi@gmail.com',
    phone: '+966554455667',
    passwordHash: hashString('password123'),
    role: 'customer',
    address: { street: 'Prince Majid Rd, Al-Safa', city: 'Jeddah', state: 'Makkah Region', zip: '23447', country: 'KSA' },
    profile: { age: 41, gender: 'Female', bloodGroup: 'B+', allergies: [], chronicConditions: ['Asthma'] },
    orderHistory: ['ord-4', 'ord-15']
  },
  {
    id: 'cust-5',
    name: 'Khalid Al-Dossari',
    email: 'khalid.d@outlook.com',
    phone: '+966555566778',
    passwordHash: hashString('password123'),
    role: 'customer',
    address: { street: 'Dammam Highway, Al-Khobar Al-Janubiyah', city: 'Al-Khobar', state: 'Eastern Province', zip: '34621', country: 'KSA' },
    profile: { age: 60, gender: 'Male', bloodGroup: 'O-', allergies: ['Aspirin'], chronicConditions: ['Heart Disease', 'Diabetes'] },
    orderHistory: ['ord-5', 'ord-16', 'ord-25']
  }
];

// Fill the rest to reach 20+ customers
const namesPool = [
  'Aisha Al-Subaie', 'Tariq Jalal', 'Fatima Bukhari', 'Yousef Yamani', 'Sara Al-Malki',
  'Ali Al-Shehri', 'Noura Al-Dosari', 'Bandar Al-Otaibi', 'Reem Al-Qahtani', 'Sultan Al-Shammari',
  'Maha Al-Anazi', 'Waleed Al-Ghamdi', 'Hana Al-Mutairi', 'Faisal Al-Zahrani', 'Lulua Al-Sudairi',
  'Naif Al-Juhani', 'Rania Al-Bishri'
];

namesPool.forEach((name, idx) => {
  const cid = `cust-${idx + 6}`;
  customers.push({
    id: cid,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
    phone: `+9665566${String(10000 + idx)}`,
    passwordHash: hashString('password123'),
    role: 'customer',
    address: {
      street: `Street No. ${20 + idx}, Al-Malaz`,
      city: idx % 2 === 0 ? 'Riyadh' : 'Jeddah',
      state: idx % 2 === 0 ? 'Riyadh Region' : 'Makkah Region',
      zip: String(11500 + idx * 7),
      country: 'KSA'
    },
    profile: {
      age: 22 + (idx * 3) % 45,
      gender: idx % 3 === 0 ? 'Female' : 'Male',
      allergies: idx % 4 === 0 ? ['Dust', 'Shellfish'] : [],
      chronicConditions: idx % 5 === 0 ? ['Hypertension'] : []
    },
    orderHistory: [`ord-${idx + 6}`]
  });
});

// 30+ Orders
export const orders: Order[] = [];

// Populate orders
const statuses: Array<'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = [
  'delivered', 'shipped', 'processing', 'pending', 'cancelled'
];

for (let i = 1; i <= 32; i++) {
  const custIndex = (i - 1) % customers.length;
  const customer = customers[custIndex];
  
  // Choose random 1 to 3 medicines
  const m1 = medicines[(i * 3) % medicines.length];
  const m2 = medicines[(i * 7) % medicines.length];
  
  const items: OrderItem[] = [
    { medicineId: m1.id, name: m1.name, quantity: 1 + (i % 3), priceAtOrder: m1.price }
  ];
  if (i % 2 === 0 && m1.id !== m2.id) {
    items.push({ medicineId: m2.id, name: m2.name, quantity: 1, priceAtOrder: m2.price });
  }

  const total = items.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
  const vat = Math.round(total * 0.15 * 100) / 100;
  const grand = Math.round((total + vat) * 100) / 100;

  const currentStatus = i <= 20 ? 'delivered' : statuses[i % statuses.length];
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() - (35 - i)); // spread over 35 days

  const ord: Order = {
    id: `ord-${i}`,
    customerId: customer.id,
    customerName: customer.name,
    items,
    totalAmount: total,
    vatAmount: vat,
    grandTotal: grand,
    status: currentStatus,
    prescriptionUrl: m1.prescriptionRequired || (m2 && m2.prescriptionRequired) 
      ? `/uploads/prescriptions/prescription-ord-${i}.jpg` 
      : undefined,
    shippingAddress: `${customer.address.street}, ${customer.address.city}, KSA`,
    paymentMethod: i % 4 === 0 ? 'Credit Card' : i % 4 === 1 ? 'Apple Pay' : i % 4 === 2 ? 'Insurance' : 'Cash on Delivery',
    paymentStatus: currentStatus === 'delivered' ? 'paid' : (i % 3 === 0 ? 'paid' : 'pending'),
    deliveryStaffId: currentStatus === 'delivered' || currentStatus === 'shipped' 
      ? deliveryStaff[i % deliveryStaff.length].id 
      : undefined,
    createdAt: orderDate.toISOString(),
    updatedAt: orderDate.toISOString()
  };

  orders.push(ord);
  
  // Link back order to customer
  if (!customer.orderHistory.includes(ord.id)) {
    customer.orderHistory.push(ord.id);
  }
}

// Monthly sales data for 12 months for charts
export const salesData: SalesMonthly[] = [
  { month: 'Aug 2025', revenue: 45200, ordersCount: 310 },
  { month: 'Sep 2025', revenue: 48900, ordersCount: 345 },
  { month: 'Oct 2025', revenue: 51200, ordersCount: 380 },
  { month: 'Nov 2025', revenue: 53100, ordersCount: 410 },
  { month: 'Dec 2025', revenue: 62400, ordersCount: 490 },
  { month: 'Jan 2026', revenue: 58900, ordersCount: 450 },
  { month: 'Feb 2026', revenue: 54200, ordersCount: 420 },
  { month: 'Mar 2026', revenue: 68100, ordersCount: 520 },
  { month: 'Apr 2026', revenue: 74500, ordersCount: 580 },
  { month: 'May 2026', revenue: 71200, ordersCount: 560 },
  { month: 'Jun 2026', revenue: 79800, ordersCount: 610 },
  { month: 'Jul 2026', revenue: 43250, ordersCount: 334 } // current month partial/full
];

// Purchase Orders - 10+ POs
export const purchaseOrders: PurchaseOrder[] = [];
for (let i = 1; i <= 12; i++) {
  const supp = suppliers[i % suppliers.length];
  const items = [
    { medicineId: 'med-1', name: 'Panadol Advance', quantity: 100, unitPrice: 8.50 },
    { medicineId: 'med-11', name: 'Augmentin 1g', quantity: 50, unitPrice: 42.00 }
  ];
  const total = items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const poDate = new Date();
  poDate.setDate(poDate.getDate() - (i * 5));

  purchaseOrders.push({
    id: `po-${i}`,
    supplierId: supp.id,
    supplierName: supp.name,
    items,
    totalAmount: total,
    status: i <= 8 ? 'received' : 'ordered',
    createdAt: poDate.toISOString()
  });
}
