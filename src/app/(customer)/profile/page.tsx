'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { User, Phone, Mail, MapPin, Star, Package, DollarSign, Clock, LogOut, Edit2, Save, X, Heart, Bell } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [addresses, setAddresses] = useState<string[]>([])
  const [newAddress, setNewAddress] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('prime-pharmacy-user')
    if (saved) {
      const u = JSON.parse(saved)
      setUser(u)
      setForm({ name: u.name || '', phone: u.phone || '', email: u.email || '' })
    }
    const addr = localStorage.getItem('prime-pharmacy-addresses')
    if (addr) setAddresses(JSON.parse(addr))
    setMounted(true)
  }, [])

  const saveProfile = () => {
    const updated = { ...user, ...form }
    localStorage.setItem('prime-pharmacy-user', JSON.stringify(updated))
    setUser(updated)
    setEditing(false)
  }

  const addAddress = () => {
    if (!newAddress.trim()) return
    const updated = [...addresses, newAddress]
    setAddresses(updated)
    localStorage.setItem('prime-pharmacy-addresses', JSON.stringify(updated))
    setNewAddress('')
  }

  const removeAddress = (idx: number) => {
    const updated = addresses.filter((_, i) => i !== idx)
    setAddresses(updated)
    localStorage.setItem('prime-pharmacy-addresses', JSON.stringify(updated))
  }

  const logout = () => {
    localStorage.removeItem('prime-pharmacy-user')
    window.location.href = '/login'
  }

  if (!mounted) return null

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Not signed in</h2>
        <p className="text-gray-500 mb-6">Sign in to view your profile</p>
        <Link
          href="/login"
          className="bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 shadow-xl shadow-teal-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="bg-white/20 text-white placeholder-white/60 rounded-lg px-3 py-1.5 text-lg font-bold focus:outline-none focus:bg-white/30"
                placeholder="Name"
              />
            ) : (
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
            )}
            <p className="text-teal-50 text-sm mt-1">{user.email}</p>
            {user.phone && <p className="text-teal-50 text-sm">{user.phone}</p>}
          </div>
          <button
            onClick={() => editing ? saveProfile() : setEditing(true)}
            className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            {editing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Edit Fields */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <Mail className="w-4 h-4 text-white" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-transparent text-white placeholder-white/60 flex-1 focus:outline-none text-sm"
                placeholder="Email"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <Phone className="w-4 h-4 text-white" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="bg-transparent text-white placeholder-white/60 flex-1 focus:outline-none text-sm"
                placeholder="Phone"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: 'Orders', value: user.totalOrders || 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: DollarSign, label: 'Spent', value: `Rs ${user.totalSpent || 0}`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: Star, label: 'Points', value: user.loyaltyPoints || 0, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Saved Addresses */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-500" />
          Saved Addresses
        </h3>
        <div className="space-y-2">
          {addresses.map((addr, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-sm text-gray-600 dark:text-gray-400">{addr}</span>
              <button onClick={() => removeAddress(idx)} className="text-red-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              placeholder="Add new address..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={addAddress}
              className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-1">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
        {[
          { icon: Bell, label: 'Notifications', toggle: true },
          { icon: Heart, label: 'Saved Medicines', toggle: false },
          { icon: Clock, label: 'Order Reminders', toggle: true },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
            </div>
            {item.toggle && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-teal-500 transition-colors">
                  <div className="w-4 h-4 bg-white rounded-full mt-0.5 ml-0.5 peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  )
}
