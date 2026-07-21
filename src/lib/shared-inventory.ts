/**
 * SHARED INVENTORY — Single source of truth
 * Used by both Admin dashboard and WhatsApp AI handler.
 */
import { Medicine } from '../types';
export type { Medicine };

const categories = [
  { name: "Antibiotics",    brands: ["Amoxil", "Zithromax", "Keflex", "Cipro", "Augmentin"],          generics: ["Amoxicillin", "Azithromycin", "Cephalexin", "Ciprofloxacin", "Amoxicillin Clavulanate"] },
  { name: "Analgesics",     brands: ["Panadol", "Advil", "Tylenol Extra", "Aspirin Bayer", "Celebrex"], generics: ["Paracetamol", "Ibuprofen", "Acetaminophen", "Acetylsalicylic Acid", "Celecoxib"] },
  { name: "Cardiovascular", brands: ["Lipitor", "Zocor", "Plavix", "Norvasc", "Toprol XL"],            generics: ["Atorvastatin", "Simvastatin", "Clopidogrel", "Amlodipine", "Metoprolol Succinate"] },
  { name: "Antidiabetics",  brands: ["Glucophage", "Januvia", "Victoza", "Amaryl", "Jardiance"],        generics: ["Metformin", "Sitagliptin", "Liraglutide", "Glimepiride", "Empagliflozin"] },
  { name: "Antihistamines", brands: ["Claritin", "Zyrtec", "Allegra", "Benadryl", "Xyzal"],            generics: ["Loratadine", "Cetirizine", "Fexofenadine", "Diphenhydramine", "Levocetirizine"] },
  { name: "Respiratory",    brands: ["Ventolin", "Singulair", "Symbicort", "Flovent", "Advair"],        generics: ["Salbutamol", "Montelukast", "Budesonide Formoterol", "Fluticasone Propionate", "Fluticasone Salmeterol"] },
  { name: "Dermatology",    brands: ["Cortizone", "Differin", "Kenalog", "Eucerin", "Bactroban"],       generics: ["Hydrocortisone", "Adapalene", "Triamcinolone Acetonide", "Emollient Cream", "Mupirocin Cream"] },
  { name: "Vitamins",       brands: ["Centrum", "Nature Made D3", "One A Day", "Emergen-C", "Solgar"], generics: ["Multivitamin", "Cholecalciferol", "Multivitamin Complex", "Ascorbic Acid", "Zinc Gluconate"] },
];

const storageShelves = [
  "Shelf A-1","Shelf A-2","Shelf A-3","Shelf B-1","Shelf B-2",
  "Shelf B-3","Shelf C-1","Shelf C-2","Fridge-1","Fridge-2"
];

function generateSharedInventory(): Medicine[] {
  const meds: Medicine[] = [];
  let barcodeCounter = 8901234567000;
  let skuCounter = 1000;

  for (let i = 0; i < 105; i++) {
    const catIndex  = i % categories.length;
    const cat       = categories[catIndex];
    const brandIdx  = Math.floor(i / categories.length) % cat.brands.length;
    const brand     = cat.brands[brandIdx];
    const generic   = cat.generics[brandIdx];

    const isLowStock  = i % 15 === 0;
    const isNearExpiry= i % 12 === 0;
    const isExpired   = i === 42 || i === 84;
    const isOut       = i === 15 || i === 75;

    let expiryDate = "2027-12-31";
    if (isExpired)   expiryDate = "2026-05-15";
    else if (isNearExpiry) expiryDate = "2026-08-25";
    else             expiryDate = `2027-0${(i % 9) + 1}-20`;

    // Deterministic cost/price so values are stable
    const cost  = parseFloat(((i % 20) + 0.5 + (i * 0.37) % 5).toFixed(2));
    const price = parseFloat((cost * (1.5 + (i % 3) * 0.25)).toFixed(2));

    let stock = (i * 37 + 50) % 200 + 50;
    if (isLowStock) stock = (i % 5) + 2;
    if (isOut)      stock = 0;
    const minStock = (i % 15) + 15;

    const strength = i % 2 === 0 ? "500mg" : "20mg";
    // Special overrides for well-known medicines
    const strengthOverride: Record<string, string> = {
      "Tylenol Extra": "20mg",
      "Glucophage": "850mg",
      "Ventolin": "100mcg",
      "Lipitor": "20mg",
      "Atenolol": "50mg",
    };
    const finalStrength = strengthOverride[brand] || strength;

    meds.push({
      id: `med-${i + 1}`,
      name: `${brand} ${finalStrength}`,
      barcode: `${barcodeCounter++}`,
      sku: `${cat.name.slice(0,3).toUpperCase()}-${skuCounter++}`,
      category: cat.name,
      brand,
      generic,
      batch: `B-BATCH${1000 + i}`,
      expiry: expiryDate,
      cost,
      price,
      stock,
      minStock,
      status: (isOut ? 'Out of Stock' : (i === 104 ? 'Discontinued' : 'Active')) as 'Active' | 'Discontinued' | 'Out of Stock',
      storageLocation: storageShelves[i % storageShelves.length],
      supplierId: `sup-${(i % 3) + 1}`,
      prescriptionRequired: ["Antibiotics","Cardiovascular","Antidiabetics","Respiratory"].includes(cat.name),
      tax: 5,
      discount: i % 10 === 0 ? 10 : 0,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      created_date: "2026-01-01T00:00:00Z",
      updated_date: "2026-07-15T12:00:00Z",
    });
  }
  return meds;
}

// Singleton — generated once, same values every time (deterministic)
export const sharedMedicines: Medicine[] = generateSharedInventory();
