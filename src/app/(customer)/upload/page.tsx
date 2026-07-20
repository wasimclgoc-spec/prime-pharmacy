'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerStore as useStore } from '@/lib/store';
import { performOcr, parsePrescriptionText } from '@/lib/ocr-engine';
import { useTranslation, Language } from '@/lib/i18n';
import { ExtractedMedicine, Medicine } from '../../../types';
import {
  Camera,
  Upload,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { medicines, addToCart, clearCart, addChatMessage, customer } = useStore();

  const [lang, setLang] = useState<Language>('en');
  const { t, isRtl } = useTranslation(lang);

  // Core prescription states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedMedicines, setExtractedMedicines] = useState<ExtractedMedicine[]>([]);
  
  // Interaction states
  const [dragActive, setDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync lang from storage
  useEffect(() => {
    const savedLang = localStorage.getItem('prime_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  // Camera stream controls
  const startCamera = async () => {
    setIsCameraActive(true);
    setImagePreview(null);
    setSelectedFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is not permitted. Please upload a file instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_captured.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setImagePreview(URL.createObjectURL(file));
          stopCamera();
          // Auto-run OCR after camera capture
          runOcrOnPrescription(file);
        }
      }, 'image/jpeg');
    }
  };

  // Drag & drop file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      runOcrOnPrescription(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      runOcrOnPrescription(file);
    }
  };

  // Trigger Tesseract OCR
  const runOcrOnPrescription = async (file: File) => {
    setIsOcrProcessing(true);
    setOcrProgress(10);

    try {
      const ocrLang = lang === 'ar' ? 'ara' : 'eng';
      const ocrResult = await performOcr(file, ocrLang, (p) => {
        setOcrProgress(p);
      });

      const parsedMeds = parsePrescriptionText(ocrResult.text, lang);
      setExtractedMedicines(parsedMeds);
    } catch (err) {
      console.error('OCR Process error:', err);
      alert('Error scanning prescription. Please check file clarity.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // List Editing Actions
  const handleAddMedicineManually = () => {
    const newMed: ExtractedMedicine = {
      name: '',
      strength: '500mg',
      dosage: lang === 'ar' ? 'حبة واحدة' : lang === 'ur' ? '1 گولی' : '1 tablet',
      frequency: lang === 'ar' ? 'مرة واحدة يومياً' : lang === 'ur' ? 'دن میں ایک بار' : 'once daily',
      quantity: 10,
      confidence: 1.0,
    };
    setExtractedMedicines([...extractedMedicines, newMed]);
  };

  const handleRemoveMedicine = (index: number) => {
    setExtractedMedicines(extractedMedicines.filter((_, idx) => idx !== index));
  };

  const handleUpdateMedicine = (index: number, updatedFields: Partial<ExtractedMedicine>) => {
    setExtractedMedicines(
      extractedMedicines.map((med, idx) => {
        if (idx !== index) return med;
        
        const merged = { ...med, ...updatedFields };
        
        // Re-match inventory ID if name changes
        if (updatedFields.name !== undefined) {
          const match = medicines.find(
            (m) => m.name.toLowerCase() === updatedFields.name?.toLowerCase()
          );
          merged.matchedMedicineId = match?.id;
          merged.confidence = match ? 0.95 : 0.6;
        }

        return merged;
      })
    );
  };

  // Submit back to assistant
  const handleSendToAssistant = () => {
    if (extractedMedicines.length === 0) return;

    // Clear previous cart
    clearCart();

    // Compile medicines text report
    let reportStr = lang === 'ar'
      ? `لقد قمت بمراجعة وتعديل وصفتي الطبية وتأكيد الأدوية التالية:\n\n`
      : lang === 'ur'
        ? `میں نے اپنے نسخے پر نظر ثانی کی ہے اور درج ذیل ادویات کی تصدیق کی ہے:\n\n`
        : `I have reviewed and edited my prescription and confirmed the following medicines:\n\n`;

    extractedMedicines.forEach((extracted) => {
      // Find matching inventory
      let targetMed = medicines.find(
        (m) => m.id === extracted.matchedMedicineId || m.name.toLowerCase() === extracted.name.toLowerCase()
      );

      if (targetMed && targetMed.stock > 0) {
        addToCart(targetMed, extracted.quantity || 10);
        reportStr += `✅ **${targetMed.name} ${targetMed.strength}** (${extracted.quantity || 10} Units) - PKR ${(targetMed.price * (extracted.quantity || 10)).toFixed(2)} [In Stock]\n`;
      } else if (targetMed && targetMed.stock === 0) {
        reportStr += `⚠️ **${targetMed.name} ${targetMed.strength}** - *Out of Stock!*\n`;
        const altId = targetMed.alternatives?.[0];
        const altMed = medicines.find((m) => m.id === altId);
        if (altMed && altMed.stock > 0) {
          addToCart(altMed, extracted.quantity || 10);
          reportStr += `👉 *Substituted with in-stock alternative:* **${altMed.name} ${altMed.strength}** - PKR ${(altMed.price * (extracted.quantity || 10)).toFixed(2)}\n`;
        } else {
          reportStr += `👉 No alternative available in stock.\n`;
        }
      } else {
        // Unmatched medicine, register as customized card item
        reportStr += `❓ **${extracted.name} ${extracted.strength || ''}** - *Not in inventory (Will be manually verified)*\n`;
      }
    });

    reportStr += lang === 'ar'
      ? `\nيرجى تأكيد تفاصيل الطلب لإتمامه.`
      : lang === 'ur'
        ? `\nبراہ کرم آرڈر مکمل کرنے کے لیے تفصیلات کی تصدیق کریں۔`
        : `\nPlease confirm the final details below to complete your order.`;

    // Seed customer details if not set yet, so AI doesn't ask for it again
    if (!customer?.name) {
      setCustomer({
        id: 'c-temp',
        name: 'Guest Customer',
        phone: '0555555555',
        address: 'Olaya District, Riyadh, Saudi Arabia'
      });
    }

    // Append to conversation
    addChatMessage({
      sender: 'user',
      text: lang === 'ar' ? 'لقد قمت بتحميل وصفتي الطبية وتأكيدها.' : 'I have uploaded and confirmed my prescription.',
    });

    addChatMessage({
      sender: 'assistant',
      text: reportStr,
      type: 'order_summary',
      extractedMedicines: extractedMedicines,
    });

    // Navigate to Assistant chat page
    router.push('/customer/assistant');
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col pb-12 transition-colors duration-300"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
          <button
            onClick={() => router.push('/customer/assistant')}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'تحميل وقراءة الوصفة الطبية' : lang === 'ur' ? 'نسخہ اپ لوڈ اور اسکین کریں' : 'Prescription Scan Center'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500">AI Medical OCR System</p>
          </div>
        </div>

        {/* Display Lang Indicator */}
        <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl">
          {t(`languages.${lang}`)}
        </span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        
        {/* Top Section: Photo capture + file drop */}
        {!imagePreview && !isCameraActive && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm text-center space-y-5"
          >
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <FileText size={26} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {lang === 'ar' ? 'قم بمسح وصفتك الطبية الآن' : lang === 'ur' ? 'اپنا نسخہ اسکین کریں' : 'Scan Your Prescription'}
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Take a quick camera snapshot or upload an image of your printed or handwritten prescription. Our AI OCR will instantly match it to our stock.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={startCamera}
                className="py-4.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all"
              >
                <Camera size={20} />
                <span>{t('cameraCaptureBtn')}</span>
              </button>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4.5 flex flex-col items-center justify-center transition-all ${
                  dragActive ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <Upload size={20} className="text-slate-400 mb-1" />
                <label className="cursor-pointer text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Browse Image File</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Camera Active */}
        {isCameraActive && (
          <div className="bg-black rounded-3xl overflow-hidden aspect-[4/3] relative border border-slate-100 dark:border-slate-850 flex items-center justify-center shadow-xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <div className="absolute top-4 right-4">
              <button
                onClick={stopCamera}
                className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-900/80 text-white rounded-xl text-xs font-bold"
              >
                {t('stopCameraBtn')}
              </button>
              <button
                onClick={capturePhoto}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/35"
              >
                📷 Capture Prescription
              </button>
            </div>
          </div>
        )}

        {/* Image Preview & OCR Scanning Laser Overlay */}
        {imagePreview && !isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center"
          >
            <div className="relative w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 shrink-0">
              <img src={imagePreview} alt="prescription" className="w-full h-full object-cover" />
              
              {isOcrProcessing && (
                <div className="absolute inset-0 bg-emerald-950/30">
                  {/* Moving scanning laser */}
                  <motion.div
                    className="h-1 bg-emerald-400 w-full shadow-lg shadow-emerald-400"
                    animate={{ y: [0, 160, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>Prescription Uploaded</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[280px]">
                  {selectedFile?.name} ({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                </p>
              </div>

              {isOcrProcessing ? (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${ocrProgress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Scanning details... {ocrProgress}%</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setImagePreview(null); setSelectedFile(null); }}
                    className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={() => selectedFile && runOcrOnPrescription(selectedFile)}
                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Re-Scan</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Extracted Editable Medicines cards */}
        {extractedMedicines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600 animate-pulse" />
                <span>{t('extractedTitle')}</span>
              </h2>

              <button
                onClick={handleAddMedicineManually}
                className="px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl text-xs font-extrabold hover:bg-emerald-100 transition-all flex items-center gap-1.5 border border-emerald-100/50"
              >
                <Plus size={13} />
                <span>{t('addMedicineBtn')}</span>
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {extractedMedicines.map((med, index) => {
                  const isInStock = med.matchedMedicineId 
                    ? (medicines.find(m => m.id === med.matchedMedicineId)?.stock || 0) > 0
                    : false;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-4 rounded-2xl shadow-sm space-y-3 relative"
                    >
                      <button
                        onClick={() => handleRemoveMedicine(index)}
                        className="absolute top-3.5 right-3.5 rtl:left-3.5 rtl:right-auto p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title={t('removeBtn')}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Line 1: Name and Strength */}
                      <div className="grid grid-cols-2 gap-3.5 pr-8 rtl:pl-8 rtl:pr-0">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('medNameLabel')}</label>
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(index, { name: e.target.value })}
                            placeholder="e.g. Panadol Extra"
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold p-2.5 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('medStrengthLabel')}</label>
                          <input
                            type="text"
                            value={med.strength}
                            onChange={(e) => handleUpdateMedicine(index, { strength: e.target.value })}
                            placeholder="e.g. 500mg"
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold p-2.5 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Line 2: Dosage, Frequency and Quantity */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('medDosageLabel')}</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(index, { dosage: e.target.value })}
                            placeholder="e.g. 1 tab"
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold p-2.5 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('medFrequencyLabel')}</label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(index, { frequency: e.target.value })}
                            placeholder="e.g. bd"
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-semibold p-2.5 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{t('medQtyLabel')}</label>
                          <input
                            type="number"
                            value={med.quantity || ''}
                            onChange={(e) => handleUpdateMedicine(index, { quantity: parseInt(e.target.value, 10) || 0 })}
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs font-bold p-2.5 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Matching Stock status indicator */}
                      <div className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                        {med.matchedMedicineId ? (
                          isInStock ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              ● {t('matchSuccess')} (Confidence: {Math.round(med.confidence * 100)}%)
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              ⚠️ {t('outOfStock')} (Alternative recommended)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">
                            ❓ Unrecognized - our pharmacist will manually match this
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-end"
            >
              <button
                onClick={handleSendToAssistant}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <span>{t('sendToAiBtn')}</span>
                <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
