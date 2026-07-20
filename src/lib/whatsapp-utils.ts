import { Medicine } from '../types';

// ── Medicine Search (server-safe, no zustand dependency) ─────────────────
export function searchMedicineByName(query: string, inventory: Medicine[]): Medicine[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  const strengthMatch = cleanQuery.match(/(\d+)\s*(mg|g|ml|mcg|%)?/);
  const strength = strengthMatch ? strengthMatch[0] : '';
  const nameOnly = cleanQuery.replace(strength, '').trim();

  const results: { med: Medicine; score: number }[] = [];

  for (const med of inventory) {
    const medName = med.name.toLowerCase();
    const medGeneric = med.generic.toLowerCase();
    const medBrand = med.brand.toLowerCase();

    let score = 0;

    if (medName === nameOnly || medGeneric === nameOnly || medBrand === nameOnly) {
      score = 100;
    } else if (medName.includes(nameOnly) || medGeneric.includes(nameOnly) || medBrand.includes(nameOnly)) {
      score = 80;
    } else if (nameOnly.includes(medName) || nameOnly.includes(medGeneric) || nameOnly.includes(medBrand)) {
      score = 70;
    } else {
      const queryWords = nameOnly.split(/\s+/);
      const medWords = [medName, medGeneric, medBrand].join(' ').split(/\s+/);
      let matchedWords = 0;
      for (const qw of queryWords) {
        if (qw.length < 3) continue;
        for (const mw of medWords) {
          if (mw.includes(qw) || qw.includes(mw)) {
            matchedWords++;
            break;
          }
        }
      }
      if (matchedWords > 0) {
        score = 40 + matchedWords * 10;
      }
    }

    if (score > 0) {
      results.push({ med, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5).map(r => r.med);
}

// ── Customer Info Extractor (server-safe) ──────────────────────────────
export function parseCustomerInfoFromText(text: string): { name: string; phone: string; address: string } {
  const remaining = text.trim();

  const phoneRegex = /(?:\+92|\+966|0)[0-9\s\-]{8,13}|\b0[0-9]{9,11}\b/;
  const phoneMatch = remaining.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : '';

  let beforePhone = remaining;
  let afterPhone = '';

  if (phoneMatch && phoneMatch.index !== undefined) {
    beforePhone = remaining.slice(0, phoneMatch.index).trim();
    afterPhone = remaining.slice(phoneMatch.index + phoneMatch[0].length).trim();
  }

  const nameWords = beforePhone
    .split(/\s+/)
    .filter(w => w.length >= 2 && /^[a-zA-Z\u0600-\u06FF\u0600-\u06FF]+$/.test(w))
    .slice(0, 4);

  const name = nameWords.join(' ').trim();

  const address = afterPhone.replace(/^[,.\s]+|[,.\s]+$/, '').trim();

  return { name, phone, address };
}

// ── Check if message contains personal info ─────────────────────────────
export function isPersonalInfo(text: string): boolean {
  const hasPhone = /(?:\+92|\+966|0)[0-9\s\-]{8,13}/.test(text);
  const hasAddressWords = /street|block|sector|road|avenue|district|area|colony|town|gulberg|johar|allama|house|building|flat/i.test(text);
  return hasPhone || hasAddressWords;
}
