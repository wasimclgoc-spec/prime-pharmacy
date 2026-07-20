'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package, Clock, CheckCircle2, XCircle, MapPin, Phone, FileText, ArrowRight, Receipt } from 'lucide-react'
import { useCustomerStore } from '@/lib/store'

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  Pending: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  Confirmed: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle2 },
  Preparing: { color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Package },
  'Out for Delivery': { color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: Package },
  Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  Cancelled: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
}

export default function OrdersPage() {
  const { orders } = useCustomerStore()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status)
    if (filter === 'completed') return o.status === 'Delivered'
    if (filter === 'cancelled') return o.status === 'Cancelled'
    return true
  })

  if (!mounted) return null

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Upload a prescription to get started</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-colors"
        >
          Upload Prescription <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order, i) => {
          const config = statusConfig[order.status] || statusConfig.Pending
          const expanded = selectedOrder === order.id
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedOrder(expanded ? null : order.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.time).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600 dark:text-teal-400">Rs {order.total}</p>
                    <span className={`text-xs font-medium ${config.color}`}>{order.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {order.medicines.length} items
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {order.phone}
                  </span>
                </div>
              </div>

              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3"
                >
                  {/* Medicines */}
                  <div className="space-y-2">
                    {order.medicines.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{med.name} × {med.quantity}</span>
                        <span className="font-medium text-gray-900 dark:text-white">Rs {med.price * med.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{order.address}</span>
                  </div>

                  {/* Prescription */}
                  {order.prescriptionImage && (
                    <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
                      <FileText className="w-4 h-4" />
                      <span>Prescription uploaded</span>
                    </div>
                  )}

                  {/* Invoice */}
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Receipt className="w-4 h-4" />
                    Download Invoice
                  </button>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
