'use client'

import { useState } from 'react'
import { useCustomerStore } from '@/lib/store'
import { Users, Search, Eye, Star, Phone, Mail, MapPin } from 'lucide-react'
import { Customer } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  Blacklisted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function CustomersPage() {
  const { customers, orders } = useCustomerStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'Active').length,
    totalSpent: customers.reduce((s, c) => s + c.totalSpent, 0),
    totalOrders: customers.reduce((s, c) => s + c.totalOrders, 0),
  }

  const getCustomerOrders = (customerId: string) =>
    orders.filter(o => o.customerId === customerId)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your customer database</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Total Orders', value: stats.totalOrders },
          { label: 'Total Revenue', value: `Rs ${stats.totalSpent.toFixed(0)}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{s.value}</p>
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
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Inactive', 'Blacklisted'].map(s => (
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

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">No customers found</div>
        ) : (
          filtered.map(customer => (
            <div
              key={customer.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:border-green-300 dark:hover:border-green-700 transition-colors cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}>
                  {customer.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mt-4">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{customer.totalOrders}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">Rs {customer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Spent</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-500">{customer.loyaltyPoints}</p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 text-xl font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedCustomer.status]}`}>
                    {selectedCustomer.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" /> {selectedCustomer.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" /> {selectedCustomer.email}
                </div>
                {selectedCustomer.addresses.map((addr, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-400" /> {addr}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCustomer.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-600">Rs {selectedCustomer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-yellow-500">{selectedCustomer.loyaltyPoints}</p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Recent Orders</p>
                {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                  <p className="text-sm text-gray-400">No orders found</p>
                ) : (
                  getCustomerOrders(selectedCustomer.id).map(order => (
                    <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 text-sm">
                      <span className="font-mono text-green-600">{order.orderNumber}</span>
                      <span className="text-gray-600 dark:text-gray-300">Rs {order.total.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="text-xs text-gray-400">
                Customer since {new Date(selectedCustomer.created_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
