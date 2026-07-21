import { Medicine } from '../types';


// ── Global Medicine Brand Alias Map ──────────────────────────────────────
// Maps well-known brand names to their generic/salt so AI can match them
// even if that exact brand isn't in inventory
const MEDICINE_ALIASES: Record<string, string[]> = {
  // Pain / Fever
  tylenol:      ['paracetamol', 'acetaminophen'],
  'tylenol extra': ['acetaminophen', 'paracetamol'],
  panadol:      ['paracetamol'],
  calpol:       ['paracetamol'],
  disprin:      ['aspirin', 'paracetamol'],
  acetaminophen: ['paracetamol', 'acetaminophen', 'tylenol extra'],
  brufen:       ['ibuprofen'],
  advil:        ['ibuprofen'],
  nurofen:      ['ibuprofen'],
  voltaren:     ['diclofenac'],
  ponstan:      ['mefenamic acid'],
  // Antibiotics
  augmentin:    ['amoxicillin', 'amoxicillin clavulanate'],
  amoxil:       ['amoxicillin'],
  zithromax:    ['azithromycin'],
  azee:         ['azithromycin'],
  cipro:        ['ciprofloxacin'],
  flagyl:       ['metronidazole'],
  // Antidiabetics
  glucophage:   ['metformin'],
  metformin:    ['metformin'],
  januvia:      ['sitagliptin'],
  lantus:       ['insulin glargine'],
  // Cardiovascular
  lipitor:      ['atorvastatin'],
  crestor:      ['rosuvastatin'],
  tenormin:     ['atenolol'],
  // Antihistamines
  claritin:     ['loratadine'],
  zyrtec:       ['cetirizine'],
  allegra:      ['fexofenadine'],
  benadryl:     ['diphenhydramine'],
  // Gastrointestinal
  prilosec:     ['omeprazole'],
  nexium:       ['esomeprazole'],
  protonix:     ['pantoprazole'],
  // Respiratory
  ventolin:     ['salbutamol'],
  flixotide:    ['fluticasone'],
  // Vitamins
  redoxon:      ['vitamin c', 'ascorbic acid'],
  centrum:      ['multivitamin'],
  dcure:        ['vitamin d', 'cholecalciferol'],
  // Thyroid
  synthroid:    ['levothyroxine'],
  eltroxin:     ['levothyroxine'],
};

// Resolve aliases: returns list of possible generic names for a query
function resolveAliases(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const generics: string[] = [query]; // always include original
  for (const word of words) {
    if (MEDICINE_ALIASES[word]) {
      generics.push(...MEDICINE_ALIASES[word]);
    }
    // also try combined multi-word aliases (e.g. "tylenol extra" → try "tylenol")
  }
  // Try full query as alias key too
  const fullKey = query.toLowerCase().replace(/\s+/g, '');
  if (MEDICINE_ALIASES[fullKey]) generics.push(...MEDICINE_ALIASES[fullKey]);
  return [...new Set(generics)];
}

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

  // Resolve aliases — e.g. "Tylenol" → ["tylenol", "paracetamol", "acetaminophen"]
  const searchTerms = resolveAliases(nameOnly);

  const results: { med: Medicine; score: number }[] = [];

  for (const med of inventory) {
    // Include out-of-stock too — caller decides what to show
    const medName    = med.name.toLowerCase();
    const medGeneric = med.generic.toLowerCase();
    const medBrand   = med.brand.toLowerCase();
    const medFull    = `${medBrand} ${medGeneric} ${medName}`;

    let score = 0;

    // Check against ALL search terms (original + aliases)
    for (const term of searchTerms) {
      let termScore = 0;

      // ── Tier 1: Exact match ── 200
      if (medBrand === term || medGeneric === term || medName === term ||
          medName === `${term} ${queryStrength}`) {
        termScore = 200;
      }
      // ── Tier 2: Starts with ── 160
      else if (medBrand.startsWith(term) || medGeneric.startsWith(term) || medName.startsWith(term)) {
        termScore = 160;
      }
      // ── Tier 3: Contains term ── 120
      else if (medBrand.includes(term) || medGeneric.includes(term) || medName.includes(term)) {
        termScore = 120;
      }
      // ── Tier 4: Term contains brand/generic ── 100
      else if (term.includes(medBrand) || term.includes(medGeneric)) {
        termScore = 100;
      }
      // ── Tier 5: Word-level match ── 60-90
      else {
        const qWords = term.split(/\s+/).filter(w => w.length >= 3);
        const mWords = medFull.split(/\s+/);
        let hits = 0;
        for (const qw of qWords) {
          for (const mw of mWords) {
            if (mw === qw || mw.startsWith(qw) || qw.startsWith(mw)) { hits++; break; }
          }
        }
        if (qWords.length > 0 && hits / qWords.length >= 0.4) {
          termScore = 50 + Math.round((hits / qWords.length) * 40);
        }
      }

      // Alias matches get a slight penalty vs direct brand/name matches
      const isAlias = term !== nameOnly;
      if (isAlias && termScore > 0) termScore = Math.max(termScore - 10, 50);

      if (termScore > score) score = termScore;
    }

    // Bonus: strength match
    if (score > 0 && queryStrength && medName.includes(queryStrength)) score += 20;

    // Skip truly zero score
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
  // Use the same search logic (which includes aliases) — searchMedicineByName searches all
  const results = searchMedicineByName(medName, inventory);
  // Also search including out-of-stock by temporarily including all
  const cleanQuery = medName.toLowerCase().trim();
  const nameOnly = cleanQuery
    .replace(/^\d+\s+/, '')
    .replace(/\b\d+\s*(?:mg|g|ml|mcg|iu|%|mcg)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  if (!nameOnly) return null;

  const terms = resolveAliases(nameOnly);
  let best: { med: Medicine; score: number } | null = null;

  for (const med of inventory) {
    const mN = med.name.toLowerCase();
    const mG = med.generic.toLowerCase();
    const mB = med.brand.toLowerCase();
    for (const term of terms) {
      let score = 0;
      if (mB === term || mG === term || mN === term) score = 200;
      else if (mB.startsWith(term) || mG.startsWith(term) || mN.startsWith(term)) score = 160;
      else if (mB.includes(term) || mG.includes(term) || mN.includes(term)) score = 120;
      else if (term.includes(mB) || term.includes(mG)) score = 100;
      if (score > 0 && (!best || score > best.score)) best = { med, score };
    }
  }
  return best ? best.med : null;
}
