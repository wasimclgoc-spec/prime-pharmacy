'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCustomerStore as useStore } from '../../lib/store';
import { useTranslation, Language } from '../../lib/i18n';
import { Trash2, Plus, Minus, ShieldCheck, MapPin, Phone, User, ShoppingBag } from 'lucide-react';

interface OrderSummaryProps {
  lang: Language;
  onConfirm: () => void;
  onCancel: () => void;
  isInline?: boolean;
}

export default function OrderSummary({ lang, onConfirm, onCancel, isInline = false }: OrderSummaryProps) {
  const { t, isRtl } = useTranslation(lang);
  const { cart, customer, updateCartQuantity, removeFromCart } = useStore();

  const subtotal = cart.reduce((acc, item) => acc + item.medicine.price * item.quantity, 0);
  const deliveryFee = 0.00; // Free delivery for Prime customers!
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className={`p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center ${isRtl ? 'rtl' : 'ltr'}`}>
        <ShoppingBag size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-xs text-slate-500">{lang === 'ar' ? 'سلة المشتريات فارغة' : lang === 'ur' ? 'کارٹ خالی ہے' : 'Your cart is empty'}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl overflow-hidden ${
        isInline ? 'max-w-full text-slate-900' : 'w-full'
      } ${isRtl ? 'text-right' : 'text-left'}`}
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <ShieldCheck size={16} />
          <h3 className="text-xs sm:text-sm font-bold">{t('orderSummaryTitle')}</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 px-2 py-0.5 rounded-full">
          PREMIUM
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Details */}
        {customer && (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900/50 p-3 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <User size={13} className="text-emerald-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-emerald-600" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-emerald-600" />
              <span className="line-clamp-1">{customer.address}</span>
            </div>
          </div>
        )}

        {/* Medicines List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('orderItems')}</h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[160px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.medicine.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {item.medicine.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {item.medicine.strength} • PKR {item.medicine.price.toFixed(2)}
                  </div>
                </div>

                {/* Inline Editing Controls */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateCartQuantity(item.medicine.id, item.quantity - 1);
                        } else {
                          removeFromCart(item.medicine.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-500"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="px-1.5 font-bold text-slate-800 dark:text-slate-200 min-w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        updateCartQuantity(item.medicine.id, Math.min(item.medicine.stock, item.quantity + 1));
                      }}
                      className="p-1 text-slate-500 hover:text-emerald-600"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Totals */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>{t('subtotal')}</span>
            <span>PKR {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{t('deliveryFee')}</span>
            <span className="text-emerald-600 font-bold">{t('free')}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800">
            <span>{t('total')}</span>
            <span className="text-emerald-600 dark:text-emerald-400">PKR {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 rtl:space-x-reverse pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
          >
            {t('cancelOrder')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-xs hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md shadow-emerald-600/10"
          >
            {t('confirmAndPlaceOrder')}
          </button>
        </div>
      </div>
    </div>
  );
}
