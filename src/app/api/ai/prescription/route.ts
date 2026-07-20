import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { requireAuth } from '@/lib/auth';
import { isRateLimited } from '@/lib/security';
import { parsePrescription, matchMedicines } from '@/lib/ai-prescription';
import { medicines as inventory } from '@/lib/seed-data';
import { logAction } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  // 1. Rate Limiting
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const limitCheck = isRateLimited(ip, 15, 60000); // 15 requests per minute (intensive OCR task)
  
  if (limitCheck.limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before uploading another prescription.' },
      { status: 429 }
    );
  }

  // 2. Authentication
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    let imageSource: Buffer | string | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body || !body.image) {
        return NextResponse.json({ error: 'Missing image field in request body.' }, { status: 400 });
      }

      const base64Str = body.image;
      if (base64Str.startsWith('data:image')) {
        // Extract raw base64 part
        const matches = base64Str.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          imageSource = Buffer.from(matches[2], 'base64');
        } else {
          return NextResponse.json({ error: 'Invalid data URI format.' }, { status: 400 });
        }
      } else {
        imageSource = Buffer.from(base64Str, 'base64');
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json({ error: 'Missing prescription file upload.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      imageSource = Buffer.from(bytes);
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type. Use JSON or multipart/form-data.' }, { status: 400 });
    }

    if (!imageSource) {
      return NextResponse.json({ error: 'Could not process prescription image.' }, { status: 400 });
    }

    // 3. Perform OCR using Tesseract.js
    console.log('[PRESCRIPTION OCR] Starting Tesseract OCR process...');
    const ocrResult = await Tesseract.recognize(imageSource, 'eng');
    const ocrText = ocrResult.data.text;
    console.log('[PRESCRIPTION OCR] Completed. Extracted length:', ocrText.length);

    if (!ocrText || ocrText.trim().length === 0) {
      return NextResponse.json({
        error: 'No text could be extracted from the image. Please upload a clearer prescription.'
      }, { status: 422 });
    }

    // 4. Use AI to parse raw text into structured JSON
    console.log('[PRESCRIPTION AI] Sending text to AI for analysis...');
    const structuredPrescription = await parsePrescription(ocrText, inventory);
    console.log('[PRESCRIPTION AI] AI parsed medicines count:', structuredPrescription.medicines.length);

    // 5. Match extracted medicines to actual store inventory
    const matchedMeds = matchMedicines(structuredPrescription.medicines, inventory);

    // 6. Audit Logging
    logAction(
      user.id,
      user.role,
      user.name,
      'APPROVE_PRESCRIPTION',
      'Order',
      'prescription-api',
      `Uploaded prescription for OCR analysis. Matched ${matchedMeds.filter(m => m.matchedMedicine).length} store items.`,
      req
    );

    // 7. Return structured results
    return NextResponse.json({
      success: true,
      rawOcrText: ocrText,
      doctorName: structuredPrescription.doctorName,
      hospitalName: structuredPrescription.hospitalName,
      prescriptionDate: structuredPrescription.prescriptionDate,
      confidenceScore: structuredPrescription.confidenceScore,
      medicines: matchedMeds.map(match => ({
        extractedName: match.extracted.medicineName,
        strength: match.extracted.strength,
        frequency: match.extracted.frequency,
        quantity: match.extracted.quantity,
        confidence: match.extracted.confidence,
        similarity: match.similarity,
        matchedMedicine: match.matchedMedicine ? {
          id: match.matchedMedicine.id,
          name: match.matchedMedicine.name,
          generic: match.matchedMedicine.generic,
          brand: match.matchedMedicine.brand,
          price: match.matchedMedicine.price,
          stock: match.matchedMedicine.stock,
          category: match.matchedMedicine.category,
          prescriptionRequired: match.matchedMedicine.prescriptionRequired,
          SKU: match.matchedMedicine.SKU
        } : null
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in prescription route:', error);
    return NextResponse.json(
      { error: 'An error occurred during prescription analysis.' },
      { status: 500 }
    );
  }
}
