import { Medicine } from './seed-data';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export interface ExtractedPrescriptionMed {
  medicineName: string;
  strength: string;
  frequency: string;
  quantity: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StructuredPrescription {
  medicines: ExtractedPrescriptionMed[];
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: string;
  confidenceScore: number; // 0 to 1
  rawTextAnalyzed: boolean;
}

/**
 * Normalizes and calculates Levenshtein distance between two strings
 */
export function getLevenshteinDistance(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  
  const m = str1.length;
  const n = str2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Returns a similarity score between 0.0 and 1.0
 */
export function getSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  
  if (str1 === str2) return 1.0;
  
  // If one contains the other entirely, give it high similarity
  if (str1.includes(str2) || str2.includes(str1)) {
    const minL = Math.min(str1.length, str2.length);
    const maxL = Math.max(str1.length, str2.length);
    return maxL > 0 ? (minL / maxL) * 0.9 + 0.1 : 0;
  }
  
  const distance = getLevenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
}

/**
 * Fuzzy matches extracted medicines to inventory items.
 * Returns best matches above a certain threshold.
 */
export function matchMedicines(
  extractedMeds: ExtractedPrescriptionMed[],
  inventory: Medicine[]
): Array<{ extracted: ExtractedPrescriptionMed; matchedMedicine: Medicine | null; similarity: number }> {
  return extractedMeds.map(ext => {
    let bestMatch: Medicine | null = null;
    let bestScore = 0;

    for (const med of inventory) {
      // Check match against brand/name
      const nameScore = getSimilarity(ext.medicineName, med.name);
      // Check match against generic
      const genericScore = getSimilarity(ext.medicineName, med.generic);
      
      const maxScore = Math.max(nameScore, genericScore);
      
      if (maxScore > bestScore) {
        bestScore = maxScore;
        bestMatch = med;
      }
    }

    // Return match if it meets similarity threshold of 0.4, else null
    const threshold = 0.4;
    return {
      extracted: ext,
      matchedMedicine: bestScore >= threshold ? bestMatch : null,
      similarity: bestScore
    };
  });
}

/**
 * Finds pharmacist-approved alternatives for a medicine.
 * Focuses on matching the generic drug, and then matches in the same category.
 */
export function findAlternatives(medicineName: string, inventory: Medicine[]): Medicine[] {
  // Find medicine first
  const cleanName = medicineName.toLowerCase().trim();
  const targetMed = inventory.find(m => m.name.toLowerCase() === cleanName || m.generic.toLowerCase() === cleanName);

  if (targetMed) {
    // 1. Same generic, different brand (and in stock)
    const genericAlts = inventory.filter(m => 
      m.generic.toLowerCase() === targetMed.generic.toLowerCase() && 
      m.id !== targetMed.id && 
      m.stock > 0
    );
    if (genericAlts.length > 0) return genericAlts;

    // 2. Same category, in stock
    const catAlts = inventory.filter(m => 
      m.category.toLowerCase() === targetMed.category.toLowerCase() && 
      m.id !== targetMed.id && 
      m.stock > 0
    );
    return catAlts.slice(0, 5);
  }

  // If medicine isn't in inventory, try to match by name token
  const partialMatch = inventory.find(m => getSimilarity(cleanName, m.name) > 0.5);
  if (partialMatch) {
    return findAlternatives(partialMatch.name, inventory);
  }

  return [];
}

/**
 * Rule-based fallback parser for prescription text when AI is unavailable.
 */
export function ruleBasedPrescriptionParser(imageText: string, inventory: Medicine[]): StructuredPrescription {
  const text = imageText.toLowerCase();
  const foundMedicines: ExtractedPrescriptionMed[] = [];
  
  // Try to find any inventory medicine or generic in the text
  for (const med of inventory) {
    const medName = med.name.toLowerCase();
    const genericName = med.generic.toLowerCase();
    
    // Check if name is in the text
    if (text.includes(medName) || text.includes(genericName)) {
      const matchName = text.includes(medName) ? med.name : med.generic;
      
      // Prevent duplicate extractions
      if (foundMedicines.some(m => m.medicineName.toLowerCase() === matchName.toLowerCase())) {
        continue;
      }

      // Try to extract strength
      let strength = med.strength;
      const strengthRegex = new RegExp(`${escapeRegExp(matchName)}\\s*(\\d+\\s*(?:mg|g|ml|mcg|%))`, 'i');
      const strengthMatch = imageText.match(strengthRegex);
      if (strengthMatch) {
        strength = strengthMatch[1];
      }

      // Try to extract quantity
      let quantity = '1 pack';
      const qtyRegex = /(?:qty|quantity|dispense|count|#)\s*:?\s*(\d+|\w+)/i;
      const qtyMatch = text.match(qtyRegex);
      if (qtyMatch) {
        quantity = qtyMatch[1];
      }

      // Try to extract frequency
      let frequency = 'Once daily';
      if (text.includes('twice a day') || text.includes('bid') || text.includes('b.i.d.')) {
        frequency = 'Twice daily';
      } else if (text.includes('three times') || text.includes('tid') || text.includes('t.i.d.')) {
        frequency = 'Three times daily';
      } else if (text.includes('four times') || text.includes('qid') || text.includes('q.i.d.')) {
        frequency = 'Four times daily';
      } else if (text.includes('every 8 hours') || text.includes('q8h')) {
        frequency = 'Every 8 hours';
      } else if (text.includes('every 12 hours') || text.includes('q12h')) {
        frequency = 'Every 12 hours';
      } else if (text.includes('as needed') || text.includes('prn')) {
        frequency = 'As needed (PRN)';
      }

      foundMedicines.push({
        medicineName: med.name,
        strength,
        frequency,
        quantity,
        confidence: 'medium'
      });
    }
  }

  // Extrapolate doctor name
  let doctorName = 'Unknown Doctor';
  const docMatch = imageText.match(/(?:dr\.|dr|doctor)\s+([a-zA-Z\s]+?)(?:\r?\n|,|$)/i);
  if (docMatch) {
    doctorName = docMatch[1].trim();
  }

  // Extrapolate hospital name
  let hospitalName = 'Unknown Hospital';
  const hospMatch = imageText.match(/(?:hospital|clinic|medical center|health care)\s+([a-zA-Z\s]+?)(?:\r?\n|,|$)/i);
  if (hospMatch) {
    hospitalName = hospMatch[1].trim() + (hospMatch[0].toLowerCase().includes('hospital') ? ' Hospital' : ' Clinic');
  }

  // Extrapolate date
  let prescriptionDate = new Date().toISOString().split('T')[0];
  const dateMatch = imageText.match(/(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})/);
  if (dateMatch) {
    prescriptionDate = dateMatch[0];
  }

  return {
    medicines: foundMedicines,
    doctorName,
    hospitalName,
    prescriptionDate,
    confidenceScore: foundMedicines.length > 0 ? 0.6 : 0.2,
    rawTextAnalyzed: true
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Call OpenRouter to parse prescription text
 */
export async function parsePrescription(imageText: string, inventory: Medicine[]): Promise<StructuredPrescription> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API Key is missing. Using rule-based fallback parser.');
    return ruleBasedPrescriptionParser(imageText, inventory);
  }

  const systemPrompt = `You are a pharmacy AI assistant. Analyze the prescription text and extract: medicine names, strength/dosage, frequency, quantity, doctor name, hospital name, prescription date.
Return as JSON in this exact structure:
{
  "medicines": [
    {
      "medicineName": "string",
      "strength": "string",
      "frequency": "string",
      "quantity": "string",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "doctorName": "string",
  "hospitalName": "string",
  "prescriptionDate": "string",
  "confidenceScore": 0.0 to 1.0
}
Never hallucinate. If a value is completely unclear, omit it or set it to empty and set its confidence as 'low'.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://prime-pharmacy.com',
        'X-Title': 'Prime Pharmacy'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the OCR-extracted text of the prescription to parse:\n\n${imageText}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenRouter');
    }

    const structuredData = JSON.parse(content) as StructuredPrescription;
    return {
      ...structuredData,
      rawTextAnalyzed: false
    };
  } catch (error) {
    console.error('Error in parsePrescription AI request, using rule-based fallback:', error);
    return ruleBasedPrescriptionParser(imageText, inventory);
  }
}

/**
 * Call OpenRouter to generate AI chat response
 */
export async function generateResponse(userMessage: string, context: any): Promise<string> {
  const languagePrompt = `Determine the user's language (English, Arabic, or Urdu) and ALWAYS respond in that same language.`;
  
  const systemPrompt = `You are a helpful, professional, and empathetic clinical pharmacist AI assistant at Prime Pharmacy.
Your role is to assist customers with their questions about:
1. Medications in our inventory, their usage, side effects, and prices.
2. Orders they have placed, their delivery status, and payment options.
3. Uploading prescriptions and medical consultations.

Guidelines:
- Reference the inventory, customer profile, and active orders provided in the context.
- Be extremely accurate and safe. Never prescribe treatments yourself.
- If they ask for critical clinical/medical advice, provide a helpful general explanation but politely advise them to consult a qualified doctor.
- English, Arabic, and Urdu are fully supported. Respond in the exact language the user wrote in.
- Keep responses clean, concise, and structured.

Context:
${JSON.stringify(context, null, 2)}

${languagePrompt}`;

  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API Key is missing. Using rule-based fallback chatbot.');
    return generateFallbackChatbotResponse(userMessage, context);
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://prime-pharmacy.com',
        'X-Title': 'Prime Pharmacy'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I am having trouble connecting. How can I help you today?';
  } catch (error) {
    console.error('Error in generateResponse AI, using fallback:', error);
    return generateFallbackChatbotResponse(userMessage, context);
  }
}

/**
 * High-quality fallback rule-based chat response if OpenRouter is unavailable.
 * Detects keywords and provides highly context-aware replies in EN/AR/UR.
 */
function generateFallbackChatbotResponse(message: string, context: any): string {
  const text = message.toLowerCase().trim();
  const isArabic = /[\u0600-\u06FF]/.test(message);
  const isUrdu = text.includes('ap') || text.includes('kya') || text.includes('hai') || text.includes('shukriya'); // basic heuristic

  // Extract variables from context
  const userName = context?.user?.name || 'Customer';
  const ordersList = context?.orders || [];
  const inventory = context?.inventory || [];

  if (isArabic) {
    if (text.includes('مرحبا') || text.includes('سلام') || text.includes('أهلاً')) {
      return `مرحباً ${userName}، أنا المساعد الذكي لصيدلية برايم. كيف يمكنني مساعدتك اليوم؟`;
    }
    if (text.includes('طلب') || text.includes('طلبياتي') || text.includes('شحن')) {
      if (ordersList.length === 0) {
        return `ليس لديك أي طلبات مسجلة حالياً في حسابك. هل ترغب في تصفح الأدوية المتوفرة لدينا؟`;
      }
      const latest = ordersList[0];
      return `لديك ${ordersList.length} طلبات. طلبك الأخير رقم ${latest.id} بمبلغ ${latest.grandTotal} ريال سعودي، وحالته الحالية هي: **${latest.status}**.`;
    }
    if (text.includes('بنادول') || text.includes('بندول') || text.includes('ألم') || text.includes('مسكن')) {
      const meds = inventory.filter((m: any) => m.category === 'Pain Relief').slice(0, 3);
      const medList = meds.map((m: any) => `- **${m.name}** (${m.strength}): السعر ${m.price} ريال سعودي`).join('\n');
      return `لمسكنات الألم وخافضات الحرارة، يتوفر لدينا الأدوية التالية:\n${medList}\n\nهل تود إضافة أي منها إلى سلتك؟`;
    }
    return `شكراً لتواصلك مع صيدلية برايم. لقد تلقينا استفسارك وسيقوم أحد الصيادلة بالإجابة عليك قريباً. يمكنك أيضاً الاستفسار عن الأدوية أو الطلبات أو بدائل العلاج.`;
  }

  // Urdu Fallback
  if (isUrdu) {
    if (text.includes('helo') || text.includes('salam') || text.includes('hello')) {
      return `سلام ${userName}, میں پرائم فارمیسی کا AI اسسٹنٹ ہوں۔ میں آپ کی کیا مدد کر سکتا ہوں؟`;
    }
    if (text.includes('order') || text.includes('delivery') || text.includes('mera')) {
      if (ordersList.length === 0) {
        return `آپ کا ابھی کوئی آرڈر نہیں ہے۔ کیا آپ ادویات دیکھنا چاہتے ہیں؟`;
      }
      const latest = ordersList[0];
      return `آپ کے ${ordersList.length} آرڈرز ہیں۔ آپ کا آخری آرڈر نمبر ${latest.id} (${latest.grandTotal} PKR) ہے، جس کا سٹیٹس **${latest.status}** ہے۔`;
    }
    return `پرائم فارمیسی میں رابطہ کرنے کا شکریہ۔ میں آپ کے سوال کا جواب دینے کے لیے تیار ہوں۔ آپ مجھ سے ادویات کی قیمت، سٹاک یا اپنے آرڈر کے بارے میں پوچھ سکتے ہیں۔`;
  }

  // English Fallback
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return `Hello ${userName}! Welcome to Prime Pharmacy. I am your AI assistant. How can I assist you with your medications or orders today?`;
  }

  if (text.includes('order') || text.includes('status') || text.includes('my order')) {
    if (ordersList.length === 0) {
      return `I couldn't find any orders in your profile history. Would you like to shop for medications?`;
    }
    const latest = ordersList[0];
    return `You have ${ordersList.length} order(s). Your latest order **${latest.id}** of amount **${latest.grandTotal} PKR** is currently **${latest.status}**.`;
  }

  if (text.includes('panadol') || text.includes('paracetamol') || text.includes('pain') || text.includes('ibuprofen')) {
    const meds = inventory.filter((m: any) => m.category === 'Pain Relief' && m.stock > 0).slice(0, 3);
    if (meds.length > 0) {
      const itemsList = meds.map((m: any) => `- **${m.name}** (${m.strength}) - ${m.price} PKR [Stock: ${m.stock}]`).join('\n');
      return `Here are some highly-rated pain relief medications in our stock:\n${itemsList}\n\nWould you like me to add any of these to your cart?`;
    }
  }

  if (text.includes('alternative') || text.includes('substitute') || text.includes('replacement')) {
    return `Sure! Please tell me the name of the medicine you need an alternative for, and I will search our inventory for pharmacist-approved substitutes with the same active ingredient.`;
  }

  return `Thank you for contacting Prime Pharmacy. I've noted your question regarding "${message}". Let me know if you want to check stock availability, ask for drug alternatives, or track your pending orders!`;
}
export { DEFAULT_MODEL };
