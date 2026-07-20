'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, TrendingUp, Tag, ArrowRight, Star, Pill, Stethoscope, Baby, Heart, Activity, Shield, Sparkles, ChevronRight } from 'lucide-react'
import { useCustomerStore } from '@/lib/store'

const categories = [
  { name: 'Pain Relief', icon: Pill, color: 'from-rose-400 to-red-500' },
  { name: 'Antibiotics', icon: Shield, color: 'from-blue-400 to-indigo-500' },
  { name: 'Vitamins', icon: Activity, color: 'from-amber-400 to-orange-500' },
  { name: 'Diabetes', icon: Heart, color: 'from-purple-400 to-pink-500' },
  { name: 'Cold & Flu', icon: Stethoscope, color: 'from-cyan-400 to-teal-500' },
  { name: 'Baby Care', icon: Baby, color: 'from-pink-400 to-rose-500' },
]

export default function HomePage() {
  const { medicines, orders } = useCustomerStore()
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    return medicines
      .filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase()) ||
        m.brand.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 6)
  }, [search, medicines])

  const featuredMeds = useMemo(() =>
    medicines.filter(m => m.discount > 0).slice(0, 4), [medicines]
  , [medicines])

  const topMeds = useMemo(() =>
    [...medicines].sort((a, b) => b.stock - a.stock).slice(0, 6), [medicines]
  , [medicines])

  if (!mounted) return null

  return (
    <div className="space-y-8 py-6">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 p-8 md:p-12 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full translate-y-1/2 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">AI-Powered Pharmacy</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Your Health,<br />Delivered with AI
          </h1>
          <p className="text-teal-50 text-base md:text-lg mb-6 max-w-md">
            Upload your prescription, let AI read it, and get your medicines delivered to your door.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
            >
              Upload Prescription
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 bg-teal-700/50 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:bg-teal-700/70 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              AI Assistant
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Search Bar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines, brands, categories..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden"
          >
            {searchResults.map(med => (
              <Link
                key={med.id}
                href={`/assistant?med=${med.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                  <p className="text-sm text-gray-500">{med.brand} · {med.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-teal-600 dark:text-teal-400">Rs {med.price}</p>
                  <p className={`text-xs ${med.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {med.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* Categories */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                <cat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Promotions */}
      {featuredMeds.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-500" />
              Special Offers
            </h2>
            <Link href="/assistant" className="text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredMeds.map((med, i) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-32 bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{med.discount}%
                  </div>
                  <Pill className="w-12 h-12 text-teal-400" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{med.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{med.brand}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400">Rs {med.price}</span>
                    <span className="text-xs text-gray-400 line-through">
                      Rs {(med.price * (1 + med.discount / 100)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Popular Medicines */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            Popular Medicines
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {topMeds.map((med, i) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-teal-500" />
                </div>
                {med.prescriptionRequired && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    Rx Required
                  </span>
                )}
              </div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{med.name}</p>
              <p className="text-xs text-gray-500 mb-2">{med.generic} · {med.brand}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-600 dark:text-teal-400">Rs {med.price}</span>
                <span className={`text-xs flex items-center gap-1 ${med.stock > med.minStock ? 'text-emerald-500' : 'text-orange-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${med.stock > med.minStock ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                  {med.stock > 0 ? `${med.stock} left` : 'Out'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* AI Assistant Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          href="/assistant"
          className="block bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-teal-100 dark:border-gray-800 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Need Help? Ask AI Assistant</h3>
              <p className="text-sm text-gray-500">Upload prescription, order medicines, get instant help</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </motion.section>
    </div>
  )
}

import { MessageCircle } from 'lucide-react'
