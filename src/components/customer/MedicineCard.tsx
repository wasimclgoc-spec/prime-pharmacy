'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerStore as useStore } from '../../lib/store';
import { Medicine } from '../../types';
import { useTranslation, Language } from '../../lib/i18n';
import { Check, AlertCircle, Plus, Minus, ShoppingCart, Sparkles } from 'lucide-react';

interface MedicineCardProps {
  medicine: Medicine;
  lang: Language;
  onAddAlternative?: (alt: Medicine) => void;
}

export default function MedicineCard({ medicine, lang, onAddAlternative }: MedicineCardProps) {
  const { t, isRtl } = useTranslation(lang);
  const { addToCart, medicines, cart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const cartItem = cart.find(item => item.medicine.id === medicine.id);
  const isInCart = !!cartItem;
  const isOutOfStock = medicine.stock === 0;

  // Find alternative medicines
  const alternativeMedicines = (medicine.alternatives || [])
    .map(altId => medicines.find(m => m.id === altId))
    .filter((m): m is Medicine => !!m && m.stock > 0);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(medicine, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`relative flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border ${
        isOutOfStock 
          ? 'border-amber-200/60 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5' 
          : 'border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'
      } rounded-2xl p-4.5 transition-all duration-300`}
    >
      <div>
        {/* Category & Badge */}
        <div className="flex justify-between items-start mb-2.5">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
            {medicine.category}
          </span>
          {isOutOfStock ? (
            <span className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-full">
              <AlertCircle size={12} className="mr-1 rtl:ml-1" />
              {t('outOfStock')}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {medicine.stock} {t('inStock')}
            </span>
          )}
        </div>

        {/* Name and Strength */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-baseline gap-1.5">
          <span>{medicine.name}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({medicine.strength})</span>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          {medicine.description}
        </p>

        {/* Price */}
        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-3 flex items-baseline gap-0.5">
          <span className="text-xs font-semibold">PKR</span>
          <span>{medicine.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4">
        {/* If out of stock, show alternatives section */}
        {isOutOfStock ? (
          <div className="mt-2 pt-3 border-t border-dashed border-amber-100 dark:border-amber-950/20">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center mb-2">
              <Sparkles size={12} className="mr-1.5 rtl:ml-1.5 text-amber-500 animate-pulse" />
              {t('alternativesAvailable')}
            </h4>
            <div className="space-y-2">
              {alternativeMedicines.length > 0 ? (
                alternativeMedicines.map(alt => (
                  <div
                    key={alt.id}
                    className="flex justify-between items-center bg-white dark:bg-slate-950 border border-emerald-100/50 dark:border-emerald-950/20 p-2 rounded-xl text-xs hover:border-emerald-500 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{alt.name}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">({alt.strength})</span>
                      <div className="font-bold text-emerald-600 mt-0.5">PKR {alt.price.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => onAddAlternative?.(alt)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                    >
                      {t('addToCart')}
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-slate-500 italic">No in-stock alternatives available</span>
              )}
            </div>
          </div>
        ) : (
          /* Quantity selector + Add button */
          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
            {!isInCart ? (
              <>
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 p-1">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(medicine.stock, q + 1))}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/10"
                >
                  <ShoppingCart size={14} />
                  <span>{isAdded ? t('addedToCart') : t('addToCart')}</span>
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 px-3.5 py-2 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  {t('addedToCart')} ({cartItem.quantity})
                </span>
                <button
                  onClick={() => addToCart(medicine, 1)}
                  className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-[10px]"
                >
                  +1
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
