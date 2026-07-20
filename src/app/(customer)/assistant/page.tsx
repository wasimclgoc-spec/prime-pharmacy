'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerStore as useStore } from '@/lib/store';
import { getAIResponse } from '@/lib/ai-engine';
import { performOcr, parsePrescriptionText } from '@/lib/ocr-engine';
import { useTranslation, Language } from '@/lib/i18n';
import ChatMessage from '../../../components/customer/ChatMessage';
import TypingIndicator from '../../../components/customer/TypingIndicator';
import {
  Send,
  Mic,
  MicOff,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  Settings,
  Languages,
  CheckCircle,
  FileText,
  AlertTriangle,
  X,
  Plus,
  ShoppingBag,
  PhoneCall,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Medicine } from '../../../types';

export default function AssistantPage() {
  const {
    chatHistory,
    customer,
    cart,
    setCustomer,
    addChatMessage,
    setChatHistory,
    clearChatHistory,
    addToCart,
    clearCart,
    createOrder,
    medicines
  } = useStore();

  const [lang, setLang] = useState<Language>('en');
  const { t, isRtl } = useTranslation(lang);

  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Voice Talk (conversation mode) state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  // Modals / Overlays
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Speech recognition API
  const recognitionRef = useRef<any>(null);

  // Chat scroll anchor
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Lang from localStorage or default on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('prime_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
    }

    // Persist chat history restore
    const savedChat = localStorage.getItem('prime_chat_history');
    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    } else {
      // Seed initial welcoming message if empty
      clearChatHistory();
      addChatMessage({
        sender: 'assistant',
        text: t('assistantGreeting'),
      });
    }
  }, []);

  // Sync Lang
  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('prime_lang', newLang);
  };

  // Sync chat persistence on changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('prime_chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsListening(true);
        };
        
        rec.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setVoiceTranscript(speechToText);
          
          // In voice mode, auto-send the message
          if (useStore.getState().chatHistory !== undefined) {
            const store = useStore.getState();
            store.addChatMessage({ sender: 'user', text: speechToText, timestamp: new Date().toISOString() });
          }
          setInputText(prev => prev + ' ' + speechToText);
        };
        
        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          // Only alert for real errors, not 'no-speech' or 'aborted' which are normal
          if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'network') {
            console.warn('Mic error:', event.error);
          }
          // If in voice mode and not aborted by user, try restarting after short delay
          if (event.error === 'no-speech' && isVoiceMode) {
            setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  const speechLangs: Record<string, string> = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
                  recognitionRef.current.lang = speechLangs[lang] || 'en-US';
                  recognitionRef.current.start();
                }
              } catch (e) {}
            }, 1000);
          }
        };
        
        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    // Cleanup camera stream on unmount
    return () => {
      stopCamera();
    };
  }, [lang]);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Adjust speech recognition language code
      const speechLangs = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
      recognitionRef.current.lang = speechLangs[lang];
      recognitionRef.current.start();
    }
  };

  // ── Voice Talk (Conversation Mode) ──────────────────────────
  // Text-to-Speech: AI speaks its response
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/**/g, '').replace(/📋|🔍|💊|💰|📦|⚠️|🎉|✅|❓|👤|📱|📍|👉/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const ttsLangs = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
    utterance.lang = ttsLangs[lang];
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => {
      setIsAiSpeaking(false);
      // Auto-listen again in voice mode
      if (isVoiceMode && recognitionRef.current) {
        setTimeout(() => {
          try {
            const speechLangs = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
            recognitionRef.current.lang = speechLangs[lang];
            recognitionRef.current.start();
          } catch (e) {}
        }, 500);
      }
    };
    window.speechSynthesis.speak(utterance);
  };
  
  // Stop all voice
  const stopVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsAiSpeaking(false);
    setIsListening(false);
  };
  
  // Toggle Voice Talk Mode
  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      stopVoice();
      setIsVoiceMode(false);
    } else {
      // Check browser support first
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        addChatMessage({
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: '⚠️ Voice recognition is not supported in your browser. Please use Chrome or Safari.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Request mic permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        addChatMessage({
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: '🎙️ Microphone access denied. Please allow microphone permission in your browser settings and try again.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      setIsVoiceMode(true);
      // Greet and start listening
      const greeting = lang === 'ar' ? 'مرحباً، أنا مساعدك الصوتي. تحدث وسأرد عليك.' :
        lang === 'ur' ? 'سلام، میں آپ کا وائس اسسٹنٹ ہوں۔ بولیں، میں جواب دوں گا۔' :
        'Hello, I am your voice assistant. Speak and I will respond.';
      speakText(greeting);
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            const speechLangs: Record<string, string> = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
            recognitionRef.current.lang = speechLangs[lang] || 'en-US';
            recognitionRef.current.start();
          } catch (e) {
            console.warn('Could not start recognition:', e);
          }
        }
      }, 2800);
    }
  };
  

  // Send message to AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputText('');
    }

    // Add user message to history
    addChatMessage({
      sender: 'user',
      text,
    });

    setIsAiTyping(true);

    try {
      // Get updated chat history including the new message
      const currentHistory = useStore.getState().chatHistory;
      const aiResponse = await getAIResponse(currentHistory, lang);
      
      // Delay slightly for natural feel
      await new Promise(resolve => setTimeout(resolve, 800));

      addChatMessage(aiResponse);
      // Speak AI response in voice mode
      if (isVoiceMode) {
        speakText(aiResponse.text);
      }
    } catch (err) {
      console.error('Failed to get AI reply:', err);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Quick Replies Click
  const handleQuickReply = (replyKey: string) => {
    const fullText = t(`quickReplies.${replyKey}`);
    handleSendMessage(fullText);
  };

  // Place Order Confirm (triggered from ChatMessage or inline summary)
  const handlePlaceOrder = () => {
    const currentCart = useStore.getState().cart;
    const currentCustomer = useStore.getState().customer;

    if (!currentCustomer) return;

    const total = currentCart.reduce((acc, item) => acc + item.medicine.price * item.quantity, 0);
    const order = createOrder({
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      deliveryAddress: currentCustomer.address,
      items: currentCart,
      total,
      notes: 'Placed via AI Assistant'
    });

    // Add order success message to chat
    addChatMessage({
      sender: 'assistant',
      text: lang === 'ar' 
        ? `🎉 تم تسجيل طلبك بنجاح رقم **${order.orderNumber}**! سنرسل لك رسالة للتأكيد قريباً.`
        : lang === 'ur'
          ? `🎉 آرڈر کامیابی سے بک ہو گیا ہے، آرڈر نمبر **${order.orderNumber}** ہے! جلد ہی تصدیق کی جائے گی۔`
          : `🎉 Order placed successfully! Your order number is **${order.orderNumber}**. We will update you shortly!`,
      type: 'order_success',
      orderId: order.id,
      orderNumber: order.orderNumber
    });
  };

  const handleCancelOrder = () => {
    clearCart();
    addChatMessage({
      sender: 'assistant',
      text: lang === 'ar' 
        ? 'تم إلغاء الطلب بنجاح. هل يمكنني مساعدتك في أي شيء آخر؟' 
        : lang === 'ur'
          ? 'آرڈر منسوخ کر دیا گیا ہے۔ کیا میں آپ کی مزید مدد کر سکتا ہوں؟'
          : 'Order cancelled successfully. Let me know if you need anything else!'
    });
  };

  // Drag & Drop prescription
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
      processPrescriptionFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPrescriptionFile(e.target.files[0]);
    }
  };

  // Camera stream controls
  const startCamera = async () => {
    setIsCameraActive(true);
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
          const file = new File([blob], 'captured_prescription.jpg', { type: 'image/jpeg' });
          stopCamera();
          processPrescriptionFile(file);
        }
      }, 'image/jpeg');
    }
  };

  // Core OCR process and AI matching
  const processPrescriptionFile = async (file: File) => {
    setIsUploadOpen(false);
    setIsOcrProcessing(true);
    setOcrProgress(10);

    try {
      // 1. Perform OCR
      const ocrLang = lang === 'ar' ? 'ara' : 'eng';
      const ocrResult = await performOcr(file, ocrLang, (p) => {
        setOcrProgress(p);
      });

      // 2. Parse OCR extracted text to structured medicines
      const extractedMeds = parsePrescriptionText(ocrResult.text, lang);

      if (extractedMeds.length === 0) {
        setIsOcrProcessing(false);
        addChatMessage({
          sender: 'assistant',
          text: lang === 'ar' 
            ? 'عذراً، لم نتمكن من التعرف على أدوية واضحة في الوصفة المحملة. يمكنك تعديلها أو إضافتها يدوياً.' 
            : lang === 'ur'
              ? 'معذرت، اپ لوڈ کردہ نسخے میں ادویات کی شناخت نہیں ہوسکی۔ براہ کرم دستی طور پر شامل کریں۔'
              : 'I could not detect any clear medicines from the prescription. Please write them manually or try with a clearer photo.'
        });
        return;
      }

      // Clear previous cart
      clearCart();

      // 3. Populate cart and match inventory
      let aiSpeechReport = lang === 'ar'
        ? `لقد قرأت وصفتك الطبية واستخرجت الأدوية التالية:\n\n`
        : lang === 'ur'
          ? `میں نے آپ کا نسخہ پڑھ لیا ہے اور درج ذیل ادویات نکالی ہیں:\n\n`
          : `I have scanned your prescription and extracted the following medicines:\n\n`;

      extractedMeds.forEach((extracted) => {
        const matched = medicines.find(m => m.id === extracted.matchedMedicineId);
        
        if (matched && matched.stock > 0) {
          // Add to cart with default or extracted quantity
          addToCart(matched, extracted.quantity || 1);
          aiSpeechReport += `✅ **${matched.name} ${matched.strength}** (${extracted.quantity || 10} Units) - PKR ${(matched.price * (extracted.quantity || 10)).toFixed(2)} [In Stock]\n`;
        } else if (matched && matched.stock === 0) {
          // Out of stock, offer alternative in reports
          aiSpeechReport += `⚠️ **${matched.name} ${matched.strength}** - *Out of Stock!*\n`;
          
          const altId = matched.alternatives?.[0];
          const altMed = medicines.find(m => m.id === altId);
          if (altMed && altMed.stock > 0) {
            addToCart(altMed, extracted.quantity || 1);
            aiSpeechReport += `👉 *Substituted with beautiful in-stock alternative:* **${altMed.name} ${altMed.strength}** - PKR ${(altMed.price * (extracted.quantity || 10)).toFixed(2)}\n`;
          } else {
            aiSpeechReport += `👉 No alternative available in current live stock.\n`;
          }
        } else {
          // Unknown medicine
          aiSpeechReport += `❓ **${extracted.name} ${extracted.strength || ''}** - *Not in direct inventory.*\n`;
        }
      });

      aiSpeechReport += lang === 'ar'
        ? `\nلقد قمت بإضافة الأدوية المتوفرة وبدائلها إلى السلة والملخص جاهز للتأكيد أدناه.`
        : lang === 'ur'
          ? `\nمیں نے کارٹ میں دستیاب ادویات اور ان کے متبادل شامل کر دیئے ہیں، تصدیق کے لیے ملخص نیچے دیکھیں۔`
          : `\nI have automatically added the available items and closest alternatives to your cart. Please review the order summary below.`;

      setIsOcrProcessing(false);
      
      // Send summary update
      addChatMessage({
        sender: 'assistant',
        text: aiSpeechReport,
        type: 'order_summary',
        extractedMedicines: extractedMeds
      });

    } catch (err) {
      console.error('OCR processing error:', err);
      setIsOcrProcessing(false);
      alert('Failed to process prescription. Please try again.');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      clearChatHistory();
      localStorage.removeItem('prime_chat_history');
      addChatMessage({
        sender: 'assistant',
        text: t('assistantGreeting')
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20">
            P
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{t('appName')}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
                AI Pro
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>{t('assistantTitle')}</span>
            </p>
          </div>
        </div>

        {/* Voice Talk Button */}
        <button
          onClick={toggleVoiceMode}
          className={`p-2.5 rounded-xl transition-all duration-300 shrink-0 ${
            isVoiceMode
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
          }`}
          title="Voice Talk"
        >
          {isVoiceMode ? <PhoneCall size={16} className="animate-pulse" /> : <PhoneCall size={15} />}
        </button>
        {/* Configurations */}
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          {/* Language Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 border border-slate-200/20 p-0.5 rounded-xl text-xs font-semibold">
            {(['en', 'ar', 'ur'] as Language[]).map((langOption) => (
              <button
                key={langOption}
                onClick={() => handleLangChange(langOption)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  lang === langOption
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t(`languages.${langOption}`)}
              </button>
            ))}
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-xl"
            title="Clear Chat"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* Main Chat Feed */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 overflow-y-auto min-h-[calc(100vh-140px)]">
        <AnimatePresence initial={false}>
          {chatHistory.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              lang={lang}
              onUploadClick={() => setIsUploadOpen(true)}
              onConfirmOrder={handlePlaceOrder}
              onCancelOrder={handleCancelOrder}
            />
          ))}
          
          {isAiTyping && (
            <div className={`flex justify-start ${isRtl ? 'flex-row-reverse' : ''} gap-3.5`}>
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <TypingIndicator />
            </div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      {/* Quick replies & Footer Chat Bar */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/80 sticky bottom-0 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.03)] pb-safe">
        <div className="max-w-4xl w-full mx-auto p-3.5 space-y-3">
          
          {/* Quick Reply Shortcuts */}
          {chatHistory.length <= 2 && (
            <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
              {['orderRefill', 'askPharmacist', 'checkStock'].map((replyKey) => (
                <button
                  key={replyKey}
                  onClick={() => handleQuickReply(replyKey)}
                  className="flex-shrink-0 px-3.5 py-2 bg-emerald-50/70 text-emerald-800 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/45 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                >
                  {t(`quickReplies.${replyKey}`)}
                </button>
              ))}
            </div>
          )}

          {/* Text input, speech controls, attachments */}
          <div className="flex items-center gap-2.5">
            {/* Camera/File trigger */}
            {customer?.name && customer?.phone && customer?.address && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-2xl transition-colors shrink-0 shadow-sm"
                title={t('uploadPrescriptionBtn')}
              >
                <Camera size={18} />
              </button>
            )}

            {/* Input field */}
            <div className="flex-1 relative flex items-center border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-2xl focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-300">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('inputPlaceholder')}
                className={`w-full bg-transparent border-0 ring-0 focus:ring-0 outline-none px-4 py-3 text-sm text-slate-800 dark:text-slate-100 ${
                  isRtl ? 'text-right' : 'text-left'
                }`}
              />
              
              {/* Mic for Voice Input */}
              <button
                onClick={toggleListening}
                className={`p-2 mx-1.5 rounded-xl transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:hover:bg-emerald-600 shrink-0 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
            >
              <Send size={18} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODALS & OVERLAYS ================= */}

      {/* OCR processing screen with progress bar */}
      {isOcrProcessing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 max-w-sm w-full p-6 rounded-3xl text-center space-y-4 shadow-2xl"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-950" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText size={28} className="animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">{t('processOcrBtn')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('processingOcr')}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full"
                  animate={{ width: `${ocrProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>OCR AI Scan</span>
                <span>{ocrProgress}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Prescription Upload Drawer Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-950/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  <span>{t('uploadPrescriptionBtn')}</span>
                </h3>
                <button
                  onClick={() => { stopCamera(); setIsUploadOpen(false); }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* Camera Feed */}
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-100 dark:border-slate-850 aspect-[4/3] flex flex-col items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 rtl:space-x-reverse">
                      <button
                        onClick={stopCamera}
                        className="px-4 py-2 bg-slate-900/80 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                      >
                        {t('stopCameraBtn')}
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/35"
                      >
                        📸 Snap Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full py-4.5 flex flex-col items-center justify-center border border-dashed border-emerald-300 dark:border-emerald-900 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/30 transition-all"
                  >
                    <Camera size={26} className="mb-2" />
                    <span className="font-bold text-sm">{t('cameraCaptureBtn')}</span>
                  </button>
                )}

                {/* File Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Upload size={28} className="mx-auto text-slate-400 mb-2.5" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                    {t('dragDropText')}
                  </p>
                  <label className="mt-3 inline-block">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm">
                      Select Image File
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice Talk Overlay */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-gradient-to-b from-emerald-950/95 to-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            {/* Close button */}
            <button
              onClick={toggleVoiceMode}
              className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
            >
              <X size={20} />
            </button>

            {/* AI Avatar with pulse animation */}
            <div className="relative mb-8">
              {isAiSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                </>
              )}
              <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 ${isAiSpeaking ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                {isAiSpeaking ? (
                  <Volume2 size={42} className="animate-pulse" />
                ) : isListening ? (
                  <Mic size={42} className="animate-pulse" />
                ) : (
                  <Sparkles size={42} />
                )}
              </div>
            </div>

            {/* Status text */}
            <div className="text-center mb-6">
              <p className="text-white font-bold text-lg mb-1">
                {isAiSpeaking
                  ? (lang === 'ar' ? 'الذكاء الاصطناعي يتحدث...' : lang === 'ur' ? 'AI بول رہا ہے...' : 'AI is speaking...')
                  : isListening
                  ? (lang === 'ar' ? 'أستمع إليك...' : lang === 'ur' ? 'آپ کی بات سن رہا ہوں...' : 'Listening to you...')
                  : (lang === 'ar' ? 'اضغط للتحدث' : lang === 'ur' ? 'بولنے کے لیے دبائیں' : 'Tap to speak')}
              </p>
              {voiceTranscript && (
                <p className="text-emerald-300/80 text-sm mt-2 max-w-md italic">"{voiceTranscript}"</p>
              )}
            </div>

            {/* Mic button */}
            <button
              onClick={() => {
                if (isListening && recognitionRef.current) {
                  recognitionRef.current.stop();
                } else if (recognitionRef.current) {
                  try {
                    const speechLangs: Record<string, string> = { en: 'en-US', ar: 'ar-SA', ur: 'ur-PK' };
                    recognitionRef.current.lang = speechLangs[lang] || 'en-US';
                    recognitionRef.current.start();
                  } catch (e) {
                    console.warn('Recognition start error:', e);
                  }
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
            </button>

            {/* Stop voice button */}
            <button
              onClick={() => {
                stopVoice();
                setIsVoiceMode(false);
              }}
              className="mt-8 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {lang === 'ar' ? 'إنهاء المحادثة الصوتية' : lang === 'ur' ? 'وائس چیٹ ختم کریں' : 'End Voice Chat'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
