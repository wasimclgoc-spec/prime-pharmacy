'use client'

import { useState } from 'react'
import { useCustomerStore } from '@/lib/store'
import { ShoppingCart, Search, Eye, CheckCircle, XCircle, Clock, Truck, Package, Filter } from 'lucide-react'
import { Order } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Preparing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Out for Delivery': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const PAYMENT_COLORS: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function OrdersPage() {
  const { orders, updateOrder } = useCustomerStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const statuses = ['All', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']

  const filtered = orders.filter(o => {
    const matchesSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search)
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No orders found</td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-green-600">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{order.medicines.length} item(s)</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Rs {order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => updateOrder(order.id, { status: 'Confirmed' })}
                            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'Confirmed' && (
                          <button
                            onClick={() => updateOrder(order.id, { status: 'Out for Delivery', deliveryStatus: 'In Transit' })}
                            className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <button
                            onClick={() => updateOrder(order.id, { status: 'Cancelled' })}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{new Date(selectedOrder.created_date).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Customer</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
                <p className="text-sm text-gray-500">{selectedOrder.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Items</p>
                {selectedOrder.medicines.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-700 dark:text-gray-300">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900 dark:text-white">Rs {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-green-600">Rs {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={e => {
                      updateOrder(selectedOrder.id, { status: e.target.value as any })
                      setSelectedOrder({ ...selectedOrder, status: e.target.value as any })
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  >
                    {['Pending','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment</p>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={e => {
                      updateOrder(selectedOrder.id, { paymentStatus: e.target.value as any })
                      setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as any })
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  >
                    {['Paid','Unpaid','Refunded'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
