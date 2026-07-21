import { Medicine } from '../types';

// ── Medicine Search (intelligent, strict matching) ────────────────────────
export function searchMedicineByName(query: string, inventory: Medicine[]): Medicine[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // Extract strength like "500mg", "10mg", "100ml"
  const strengthMatch = cleanQuery.match(/\b(\d+\s*(?:mg|g|ml|mcg|iu|%|mcg))\b/);
  const strength = strengthMatch ? strengthMatch[1].replace(/\s/g, '').toLowerCase() : '';
  // Name without strength
  const nameOnly = cleanQuery.replace(/\b\d+\s*(?:mg|g|ml|mcg|iu|%|mcg)\b/gi, '').replace(/\s+/g, ' ').trim();

  const results: { med: Medicine; score: number }[] = [];

  for (const med of inventory) {
    if (med.status === 'Out of Stock' || med.stock <= 0) continue;

    const medName = med.name.toLowerCase();      // "loratadine 10mg"
    const medGeneric = med.generic.toLowerCase(); // "loratadine"
    const medBrand = med.brand.toLowerCase();     // "claritin"
    const medFull = `${medBrand} ${medName} ${medGeneric}`;

    let score = 0;

    // ── Tier 1: Exact full match (name OR brand) — score 200 ────────────
    if (medName === cleanQuery || medBrand === cleanQuery || medGeneric === cleanQuery) {
      score = 200;
    }
    // ── Tier 2: Exact name match with strength — score 150 ──────────────
    else if (
      medName === `${nameOnly} ${strength}` ||
      medBrand === nameOnly ||
      medGeneric === nameOnly
    ) {
      score = 150;
    }
    // ── Tier 3: Brand or name starts with query (e.g. "claritin" → "claritin") — score 120 ──
    else if (
      medBrand.startsWith(nameOnly) ||
      medGeneric.startsWith(nameOnly) ||
      medName.startsWith(nameOnly)
    ) {
      score = 120;
      // Boost if strength also matches
      if (strength && medName.includes(strength)) score += 30;
    }
    // ── Tier 4: Brand/generic CONTAINS the name — score 90 ─────────────
    else if (
      medBrand.includes(nameOnly) ||
      medGeneric.includes(nameOnly) ||
      medName.includes(nameOnly)
    ) {
      score = 90;
      if (strength && medName.includes(strength)) score += 20;
    }
    // ── Tier 5: Query contains brand/generic (reverse match) — score 70 ─
    else if (
      nameOnly.includes(medBrand) ||
      nameOnly.includes(medGeneric) ||
      nameOnly.length >= 4 && medName.includes(nameOnly.substring(0, Math.min(nameOnly.length, 6)))
    ) {
      score = 70;
      if (strength && medName.includes(strength)) score += 20;
    }
    // ── Tier 6: Word-level match (multi-word queries) — score 40-60 ─────
    else {
      const queryWords = nameOnly.split(/\s+/).filter(w => w.length >= 3);
      const medWords = `${medBrand} ${medGeneric} ${medName}`.split(/\s+/);
      let matched = 0;
      let totalWeight = 0;
      for (const qw of queryWords) {
        for (const mw of medWords) {
          if (mw === qw) { matched += 2; break; }
          else if (mw.startsWith(qw) || qw.startsWith(mw)) { matched += 1; break; }
        }
        totalWeight += 2;
      }
      if (totalWeight > 0 && matched / totalWeight >= 0.6) {
        score = 40 + Math.round((matched / totalWeight) * 20);
      }
    }

    if (score > 0) {
      results.push({ med, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  // ── Smart result cap: if top result has very high score, return only top matches ──
  if (results.length === 0) return [];

  const topScore = results[0].score;

  // If we have an excellent match (score ≥ 150), return ONLY results within 30pts of top
  if (topScore >= 150) {
    return results.filter(r => r.score >= topScore - 30).slice(0, 3).map(r => r.med);
  }

  // If good match (score ≥ 90), return top 3 results
  if (topScore >= 90) {
    return results.slice(0, 3).map(r => r.med);
  }

  // For weak matches, return top 5 max
  return results.slice(0, 5).map(r => r.med);
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
    afterPhone = remaining.slice(phoneMatch.index + phoneMatch[0].length).trim();
  }

  const nameWords = beforePhone
    .split(/\s+/)
    .filter(w => w.length >= 2 && /^[a-zA-Z\u0600-\u06FF]+$/.test(w))
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
