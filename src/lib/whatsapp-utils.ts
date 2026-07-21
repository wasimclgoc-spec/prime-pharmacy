import { Medicine } from '../types';

// ── Smart Medicine Search ─────────────────────────────────────────────────
// Returns best match first. Ignores strength mismatch when brand/name is exact.
export function searchMedicineByName(query: string, inventory: Medicine[]): Medicine[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // Extract strength e.g. "500mg", "850mg", "10mg"
  const strengthMatch = cleanQuery.match(/\b(\d+\s*(?:mg|g|ml|mcg|iu|%|mcg))\b/);
  const queryStrength = strengthMatch ? strengthMatch[1].replace(/\s/g, '').toLowerCase() : '';
  // Name without strength and without leading quantity
  const nameOnly = cleanQuery
    .replace(/^\d+\s+/, '')                              // remove leading qty "5 "
    .replace(/\b\d+\s*(?:mg|g|ml|mcg|iu|%|mcg)\b/gi, '') // remove strength
    .replace(/\s+/g, ' ').trim();

  if (!nameOnly) return [];

  const results: { med: Medicine; score: number }[] = [];

  for (const med of inventory) {
    if (med.stock <= 0 || med.status === 'Out of Stock') continue;

    const medName    = med.name.toLowerCase();     // "metformin 850mg"
    const medGeneric = med.generic.toLowerCase();  // "metformin"
    const medBrand   = med.brand.toLowerCase();    // "glucophage"

    let score = 0;

    // ── Tier 1: Exact brand, generic or full name match ── 200
    if (medBrand === nameOnly || medGeneric === nameOnly || medName === nameOnly ||
        medName === `${nameOnly} ${queryStrength}`) {
      score = 200;
    }
    // ── Tier 2: Brand or generic STARTS WITH query ── 160
    else if (medBrand.startsWith(nameOnly) || medGeneric.startsWith(nameOnly) || medName.startsWith(nameOnly)) {
      score = 160;
    }
    // ── Tier 3: Brand or generic CONTAINS query ── 120
    else if (medBrand.includes(nameOnly) || medGeneric.includes(nameOnly) || medName.includes(nameOnly)) {
      score = 120;
    }
    // ── Tier 4: Query contains brand or generic ── 100
    else if (nameOnly.includes(medBrand) || nameOnly.includes(medGeneric)) {
      score = 100;
    }
    // ── Tier 5: Word-level partial match (min 60% word overlap) ── 60-90
    else {
      const qWords = nameOnly.split(/\s+/).filter(w => w.length >= 3);
      const mWords = `${medBrand} ${medGeneric} ${medName}`.split(/\s+/);
      let hits = 0;
      for (const qw of qWords) {
        for (const mw of mWords) {
          if (mw === qw || mw.startsWith(qw) || qw.startsWith(mw)) { hits++; break; }
        }
      }
      if (qWords.length > 0 && hits / qWords.length >= 0.5) {
        score = 60 + Math.round((hits / qWords.length) * 30);
      }
    }

    // Bonus: strength match (but never penalise for wrong strength — customer may not know)
    if (score > 0 && queryStrength && medName.includes(queryStrength)) score += 20;

    if (score > 0) results.push({ med, score });
  }

  results.sort((a, b) => b.score - a.score);
  if (results.length === 0) return [];

  const top = results[0].score;

  // High confidence → return only top 1-3 within 40pts
  if (top >= 160) return results.filter(r => r.score >= top - 40).slice(0, 3).map(r => r.med);
  // Medium → top 3
  if (top >= 100) return results.slice(0, 3).map(r => r.med);
  // Weak → top 5
  return results.slice(0, 5).map(r => r.med);
}

// ── Find EXACT best medicine for direct order (quantity + name) ───────────
// Returns single best match or null
export function findMedicineForOrder(medName: string, inventory: Medicine[]): Medicine | null {
  const results = searchMedicineByName(medName, inventory);
  return results.length > 0 ? results[0] : null;
}

// ── Customer Info Extractor ─────────────────────────────────────────────
export function parseCustomerInfoFromText(text: string): { name: string; phone: string; address: string } {
  const remaining = text.trim();
  const phoneRegex = /(?:\+92|\+966|0)[0-9\s\-]{8,13}|\b0[0-9]{9,11}\b/;
  const phoneMatch = remaining.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : '';
  let beforePhone = remaining;
  let afterPhone = '';
  if (phoneMatch && phoneMatch.index !== undefined) {
    beforePhone = remaining.slice(0, phoneMatch.index).trim();
    afterPhone  = remaining.slice(phoneMatch.index + phoneMatch[0].length).trim();
  }
  const nameWords = beforePhone.split(/\s+/)
    .filter(w => w.length >= 2 && /^[a-zA-Z\u0600-\u06FF]+$/.test(w)).slice(0, 4);
  const name    = nameWords.join(' ').trim();
  const address = afterPhone.replace(/^[,.\s]+|[,.\s]+$/, '').trim();
  return { name, phone, address };
}

export function isPersonalInfo(text: string): boolean {
  const hasPhone = /(?:\+92|\+966|0)[0-9\s\-]{8,13}/.test(text);
  const hasAddressWords = /street|block|sector|road|avenue|district|area|colony|town|gulberg|johar|allama|house|building|flat/i.test(text);
  return hasPhone || hasAddressWords;
}

// ── Find substitutes by same generic/salt or same category ────────────────
export function findSubstitutes(medName: string, inventory: Medicine[], excludeId?: string): Medicine[] {
  const cleanQuery = medName.toLowerCase().trim();
  // First find the medicine to get its generic name
  const source = findMedicineForOrder(medName, inventory);
  if (!source) return [];

  const generic = source.generic.toLowerCase();
  const category = (source as any).category?.toLowerCase() || '';

  const subs: Medicine[] = [];
  for (const med of inventory) {
    if (med.id === source.id || med.id === excludeId) continue;
    if (med.stock <= 0 || med.status === 'Out of Stock') continue;
    // Same generic/salt or same category
    if (med.generic.toLowerCase() === generic) {
      subs.push(med);
    }
  }
  return subs.slice(0, 3);
}

// ── Find out-of-stock medicine to check if it exists but is unavailable ────
export function findMedicineIncludingOutOfStock(medName: string, inventory: Medicine[]): Medicine | null {
  const cleanQuery = medName.toLowerCase().trim();
  const nameOnly = cleanQuery
    .replace(/^\d+\s+/, '')
    .replace(/\b\d+\s*(?:mg|g|ml|mcg|iu|%|mcg)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  if (!nameOnly) return null;

  let best: { med: Medicine; score: number } | null = null;

  for (const med of inventory) {
    const mN = med.name.toLowerCase();
    const mG = med.generic.toLowerCase();
    const mB = med.brand.toLowerCase();
    let score = 0;
    if (mB === nameOnly || mG === nameOnly || mN === nameOnly) score = 200;
    else if (mB.startsWith(nameOnly) || mG.startsWith(nameOnly) || mN.startsWith(nameOnly)) score = 160;
    else if (mB.includes(nameOnly) || mG.includes(nameOnly) || mN.includes(nameOnly)) score = 120;
    if (score > 0 && (!best || score > best.score)) best = { med, score };
  }
  return best ? best.med : null;
}
