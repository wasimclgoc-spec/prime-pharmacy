'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Package, MessageCircle, User, Moon, Sun, Globe } from 'lucide-react'

const navItems = [
  { href: '/assistant', label: 'AI', icon: MessageCircle },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [lang, setLang] = useState<'en' | 'ar' | 'ur'>('en')
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr')

  useEffect(() => {
    const theme = localStorage.getItem('prime-pharmacy-theme')
    if (theme === 'dark') setDark(true)
    const savedLang = localStorage.getItem('prime-pharmacy-lang') as 'en' | 'ar' | 'ur' | null
    if (savedLang) {
      setLang(savedLang)
      setDir(savedLang === 'ar' ? 'rtl' : 'ltr')
    }
  }, [])

  const toggleDark = () => {
    const newDark = !dark
    setDark(newDark)
    if (newDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('prime-pharmacy-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('prime-pharmacy-theme', 'light')
    }
  }

  const cycleLang = () => {
    const langs: ('en' | 'ar' | 'ur')[] = ['en', 'ar', 'ur']
    const next = langs[(langs.indexOf(lang) + 1) % langs.length]
    setLang(next)
    setDir(next === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('prime-pharmacy-lang', next)
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/assistant" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/30">
              P
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
              Prime Pharmacy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleLang}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Language"
            >
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-xs ml-1">{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 max-w-7xl mx-auto px-4">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                  active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute top-0 w-8 h-0.5 bg-teal-500 rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-20 flex-col items-center py-6 gap-4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1 transition-all ${
                active
                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
