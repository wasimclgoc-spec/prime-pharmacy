export type Language = 'en' | 'ar' | 'ur';

export const translations = {
  en: {
    appName: 'Prime Pharmacy',
    assistantTitle: 'AI Health Assistant',
    assistantGreeting: 'Hello! Welcome to Prime Pharmacy. Please enter your Full Name, Mobile Number, and Delivery Address to get started.',
    inputPlaceholder: 'Type your message...',
    voiceInputListening: 'Listening...',
    voiceInputError: 'Speech recognition error. Please try again.',
    uploadPrescriptionBtn: 'Upload Prescription',
    dragDropText: 'Drag and drop your prescription here, or click to browse',
    cameraCaptureBtn: 'Capture using Camera',
    stopCameraBtn: 'Stop Camera',
    processOcrBtn: 'Process with OCR',
    processingOcr: 'Processing prescription using AI OCR...',
    extractedTitle: 'Extracted Medicines',
    confidenceScore: 'Confidence',
    matchSuccess: 'Matched in stock',
    noMatch: 'Medicine not found in inventory',
    outOfStock: 'Out of stock',
    inStock: 'In stock',
    alternativesAvailable: 'Alternatives available:',
    addToCart: 'Add to Cart',
    addedToCart: 'Added',
    orderSummaryTitle: 'Order Summary',
    deliveryDetails: 'Delivery Details',
    customerName: 'Customer Name',
    phone: 'Phone',
    address: 'Address',
    orderItems: 'Prescribed Items',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    free: 'Free',
    total: 'Total',
    confirmAndPlaceOrder: 'Confirm and Place Order',
    cancelOrder: 'Cancel',
    editMedicines: 'Edit Medicines',
    orderSuccessTitle: 'Order Placed Successfully!',
    orderNumberLabel: 'Order Number',
    orderSuccessBody: 'Thank you for choosing Prime Pharmacy. Our pharmacist will verify your prescription, and we will update you shortly via SMS.',
    sendToAiBtn: 'Send to AI Assistant',
    addMedicineBtn: 'Add Medicine manually',
    medNameLabel: 'Medicine Name',
    medStrengthLabel: 'Strength (e.g. 500mg)',
    medDosageLabel: 'Dosage (e.g. 1 tablet)',
    medFrequencyLabel: 'Frequency (e.g. twice daily)',
    medQtyLabel: 'Quantity',
    saveBtn: 'Save',
    removeBtn: 'Remove',
    languages: {
      en: 'English',
      ar: 'العربية',
      ur: 'اردو'
    },
    quickReplies: {
      orderRefill: 'I want to refill an order',
      askPharmacist: 'Ask a pharmacist about side effects',
      checkStock: 'Check medicine stock'
    }
  },
  ar: {
    appName: 'صيدلية برايم',
    assistantTitle: 'مساعد الصحة الذكي',
    assistantGreeting: 'مرحباً بك في صيدلية برايم! يرجى كتابة الاسم الكامل، ورقم الهاتف، وعنوان التوصيل للبدء.',
    inputPlaceholder: 'اكتب رسالتك هنا...',
    voiceInputListening: 'جاري الاستماع...',
    voiceInputError: 'فشل التعرف على الصوت. حاول مرة أخرى.',
    uploadPrescriptionBtn: 'تحميل الوصفة الطبية',
    dragDropText: 'اسحب وأسقط الوصفة الطبية هنا، أو انقر للتصفح',
    cameraCaptureBtn: 'التقاط بالكاميرا',
    stopCameraBtn: 'إيقاف الكاميرا',
    processOcrBtn: 'معالجة الوصفة',
    processingOcr: 'جاري قراءة وتحليل الوصفة بالذكاء الاصطناعي...',
    extractedTitle: 'الأدوية المستخرجة',
    confidenceScore: 'دقة المطابقة',
    matchSuccess: 'متاح في المخزون',
    noMatch: 'الدواء غير موجود في المخزن',
    outOfStock: 'غير متوفر',
    inStock: 'متوفر',
    alternativesAvailable: 'البدائل المتاحة:',
    addToCart: 'إضافة للسلة',
    addedToCart: 'تمت الإضافة',
    orderSummaryTitle: 'ملخص الطلب',
    deliveryDetails: 'تفاصيل التوصيل',
    customerName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    orderItems: 'الأدوية المطلوبة',
    subtotal: 'المجموع الفرعي',
    deliveryFee: 'رسوم التوصيل',
    free: 'مجاني',
    total: 'الإجمالي',
    confirmAndPlaceOrder: 'تأكيد وإرسال الطلب',
    cancelOrder: 'إلغاء',
    editMedicines: 'تعديل الأدوية',
    orderSuccessTitle: 'تم إرسال طلبك بنجاح!',
    orderNumberLabel: 'رقم الطلب',
    orderSuccessBody: 'شكراً لاختيارك صيدلية برايم. سيقوم الصيدلي بالتحقق من وصفتك الطبية وسنتواصل معك قريباً عبر الرسائل النصية.',
    sendToAiBtn: 'إرسال للمساعد الذكي',
    addMedicineBtn: 'إضافة دواء يدوياً',
    medNameLabel: 'اسم الدواء',
    medStrengthLabel: 'التركيز (مثال: 500mg)',
    medDosageLabel: 'الجرعة (مثال: حبة واحدة)',
    medFrequencyLabel: 'التكرار (مثال: مرتين يومياً)',
    medQtyLabel: 'الكمية',
    saveBtn: 'حفظ',
    removeBtn: 'حذف',
    languages: {
      en: 'English',
      ar: 'العربية',
      ur: 'اردو'
    },
    quickReplies: {
      orderRefill: 'أريد إعادة تعبئة دواء سابق',
      askPharmacist: 'اسأل الصيدلي عن الأعراض الجانبية',
      checkStock: 'التحقق من توفر دواء'
    }
  },
  ur: {
    appName: 'پرائم فارمیسی',
    assistantTitle: 'اے آئی ہیلتھ اسسٹنٹ',
    assistantGreeting: 'پرائم فارمیسی میں خوش آمدید! شروع کرنے کے لیے براہ کرم اپنا مکمل نام، موبائل نمبر، اور ترسیل کا پتہ لکھیں۔',
    inputPlaceholder: 'اپنا پیغام لکھیں...',
    voiceInputListening: 'سن رہا ہے...',
    voiceInputError: 'آواز کی شناخت میں خرابی۔ دوبارہ کوشش کریں۔',
    uploadPrescriptionBtn: 'نسخہ اپ لوڈ کریں',
    dragDropText: 'اپنا نسخہ یہاں گھسیٹ کر چھوڑیں، یا براؤز کرنے کے لیے کلک کریں',
    cameraCaptureBtn: 'کیمرے سے تصویر لیں',
    stopCameraBtn: 'کیمرہ بند کریں',
    processOcrBtn: 'نسخہ پڑھیں (OCR)',
    processingOcr: 'اے آئی کے ذریعے نسخہ پڑھا جا رہا ہے...',
    extractedTitle: 'نکالی گئی ادویات',
    confidenceScore: 'اعتماد کا سکور',
    matchSuccess: 'اسٹاک میں دستیاب ہے',
    noMatch: 'دوا اسٹاک میں نہیں ملی',
    outOfStock: 'دستیاب نہیں ہے',
    inStock: 'دستیاب ہے',
    alternativesAvailable: 'متبادل ادویات:',
    addToCart: 'کارٹ میں شامل کریں',
    addedToCart: 'شامل ہو گیا',
    orderSummaryTitle: 'آرڈر کی تفصیلات',
    deliveryDetails: 'ڈلیوری کی تفصیلات',
    customerName: 'صارف کا نام',
    phone: 'فون نمبر',
    address: 'پتہ',
    orderItems: 'تجویز کردہ اشیاء',
    subtotal: 'ذیلی کل',
    deliveryFee: 'ڈلیوری فیس',
    free: 'مفت',
    total: 'کل رقم',
    confirmAndPlaceOrder: 'آرڈر کی تصدیق کریں',
    cancelOrder: 'منسوخ کریں',
    editMedicines: 'ادویات میں ترمیم کریں',
    orderSuccessTitle: 'آرڈر کامیابی کے ساتھ بک ہو گیا!',
    orderNumberLabel: 'آرڈر نمبر',
    orderSuccessBody: 'پرائم فارمیسی کا انتخاب کرنے کے لیے شکریہ۔ ہمارے فارماسسٹ آپ کے نسخے کی تصدیق کریں گے، اور ہم جلد ہی آپ کو ایس ایم ایس کے ذریعے مطلع کریں گے۔',
    sendToAiBtn: 'اے آئی اسسٹنٹ کو بھیجیں',
    addMedicineBtn: 'دوا دستی طور پر شامل کریں',
    medNameLabel: 'دوا کا نام',
    medStrengthLabel: 'طاقت (مثال: 500mg)',
    medDosageLabel: 'خوراک (مثال: 1 گولی)',
    medFrequencyLabel: 'تکرار (مثال: دن میں دو بار)',
    medQtyLabel: 'مقدار',
    saveBtn: 'محفوظ کریں',
    removeBtn: 'حذف کریں',
    languages: {
      en: 'English',
      ar: 'العربية',
      ur: 'اردو'
    },
    quickReplies: {
      orderRefill: 'میں آرڈر دوبارہ لینا چاہتا ہوں',
      askPharmacist: 'سائیڈ ایفیکٹس کے بارے میں پوچھیں',
      checkStock: 'دوا کا اسٹاک چیک کریں'
    }
  }
};

export const useTranslation = (lang: Language) => {
  const t = (key: keyof typeof translations['en'] | string) => {
    const dict = translations[lang] || translations['en'];
    // Handle nested objects like quickReplies or languages
    if (key.includes('.')) {
      const parts = key.split('.');
      let current: any = dict;
      for (const part of parts) {
        if (current && current[part]) {
          current = current[part];
        } else {
          // fallback to en
          let enCurrent: any = translations['en'];
          for (const enPart of parts) {
            enCurrent = enCurrent ? enCurrent[enPart] : null;
          }
          return enCurrent || key;
        }
      }
      return current;
    }
    
    return (dict as any)[key] || (translations['en'] as any)[key] || key;
  };

  const isRtl = lang === 'ar' || lang === 'ur';

  return { t, isRtl };
};
