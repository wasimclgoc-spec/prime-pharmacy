'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AIMessage } from '../../types';
import { useTranslation, Language } from '../../lib/i18n';
import { Bot, User, Prescription, Calendar, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import OrderSummary from './OrderSummary';

interface ChatMessageProps {
  message: AIMessage;
  lang: Language;
  onUploadClick?: () => void;
  onConfirmOrder?: () => void;
  onCancelOrder?: () => void;
}

export default function ChatMessage({
  message,
  lang,
  onUploadClick,
  onConfirmOrder,
  onCancelOrder,
}: ChatMessageProps) {
  const { t, isRtl } = useTranslation(lang);
  const isAssistant = message.sender === 'assistant';

  // Format date helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Render text helper to support basic markdown bold or line breaks
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Process bold formatting (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block min-h-[1.2em]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="font-extrabold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            // Process bullet points
            if (part.trim().startsWith('- ') || part.trim().startsWith('* ')) {
              return (
                <span key={j} className="pl-4 rtl:pr-4 rtl:pl-0 block relative">
                  <span className="absolute left-0 rtl:right-0 rtl:left-auto">•</span>
                  {part.trim().substring(2)}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-start gap-3.5 max-w-full ${
        isAssistant 
          ? 'justify-start' 
          : 'justify-end'
      } ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {isAssistant ? (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/10">
          <Bot size={18} />
        </div>
      ) : (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <User size={18} />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Main Text Bubble */}
        <div
          className={`px-4.5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm transition-all duration-300 ${
            isAssistant
              ? 'bg-slate-100/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-100 rounded-tl-none border border-slate-200/20 dark:border-slate-850/10'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-none shadow-md shadow-emerald-600/10'
          } ${isRtl ? 'text-right' : 'text-left'}`}
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          {renderMessageText(message.text)}
        </div>

        {/* Action Widgets based on Message Type */}
        {message.type === 'prescription_upload' && isAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3.5 w-full"
          >
            <button
              onClick={onUploadClick}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md shadow-emerald-600/20 hover:shadow-lg"
            >
              <span>📷 {t('uploadPrescriptionBtn')}</span>
            </button>
          </motion.div>
        )}

        {message.type === 'order_summary' && isAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3.5 w-full"
          >
            <OrderSummary
              lang={lang}
              onConfirm={onConfirmOrder || (() => {})}
              onCancel={onCancelOrder || (() => {})}
              isInline={true}
            />
          </motion.div>
        )}

        {message.type === 'order_success' && isAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3.5 w-full border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/20 dark:bg-emerald-950/5 rounded-2xl p-4 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 size={24} className="animate-bounce" />
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">{t('orderSuccessTitle')}</h4>
            <div className="mt-2 bg-emerald-600 text-white font-mono px-4 py-1.5 rounded-full text-xs font-black select-all">
              {message.orderNumber}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 max-w-[280px] leading-relaxed">
              {t('orderSuccessBody')}
            </p>
          </motion.div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1.5">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
