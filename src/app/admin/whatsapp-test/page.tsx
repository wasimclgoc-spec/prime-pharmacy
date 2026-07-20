'use client'

import { useState } from 'react'
import { MessageCircle, Send, CheckCircle2, AlertCircle, Phone } from 'lucide-react'

export default function WhatsAppTestPage() {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: '👋 Welcome to Prime Pharmacy! I can help you search medicines, upload prescriptions, and place orders. Try sending "hi" or "Panadol 500mg".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [configStatus, setConfigStatus] = useState<'unknown' | 'configured' | 'not_configured'>('unknown')

  const checkConfig = async () => {
    try {
    const res = await fetch('/api/whatsapp/test')
    const data = await res.json()
    setConfigStatus(data.configured ? 'configured' : 'not_configured')
    } catch {
      setConfigStatus('not_configured')
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { from: 'user' as const, text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, from: 'test-user' })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { from: 'bot', text: data.reply || 'Sorry, I could not process that.' }])
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Error connecting to AI. Check console.' }])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Integration Test</h1>
            <p className="text-sm text-gray-500">Test the AI handler that processes WhatsApp messages</p>
          </div>
        </div>

        {/* Config Check */}
        <div className="mb-4">
          <button
            onClick={checkConfig}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            Check WhatsApp API Configuration
          </button>
          {configStatus === 'configured' && (
            <span className="ml-3 inline-flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Configured
            </span>
          )}
          {configStatus === 'not_configured' && (
            <span className="ml-3 inline-flex items-center gap-1 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" /> Not configured (test mode only)
            </span>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Prime Pharmacy Bot</p>
              <p className="text-xs text-green-100">Online</p>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    msg.from === 'user'
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message... (e.g. 'hi', 'Panadol 500mg', '2 Panadol')"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">Test Commands:</p>
          <p>1. Type "hi" → Reset session, get welcome</p>
          <p>2. Type "Panadol 500mg" → Search inventory</p>
          <p>3. Type "Ahmed 0300 1234567 Gulberg Lahore" → Register customer</p>
          <p>4. Type "2 Panadol" → Add to cart</p>
          <p>5. Type "confirm order" → Place order</p>
        </div>
      </div>
    </div>
  )
}
