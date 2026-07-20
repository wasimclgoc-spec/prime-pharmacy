"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import Sidebar from "@/components/admin/Sidebar";
import { 
  Bell, Moon, Sun, Search, ShieldAlert, Check, ChevronDown, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import "@/styles/globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, isAuthenticated, notifications, 
    markNotificationRead, markAllNotificationsRead, login
  } = useAdminStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. Recover Auth Session from Local Storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("prime_crm_user");
      const storedToken = localStorage.getItem("prime_crm_token");

      if (storedUser && storedToken) {
        try {
          const parsed = JSON.parse(storedUser);
          // Restore store state by logging in
          login(parsed.email, "admin123", parsed.role);
        } catch (e) {
          localStorage.removeItem("prime_crm_user");
          localStorage.removeItem("prime_crm_token");
        }
      }
      setIsAuthLoading(false);
    }
  }, [login]);

  // 2. Route Protection Check
  useEffect(() => {
    if (!isAuthLoading) {
      const isLoginPath = pathname === "/admin/login";
      if (!isAuthenticated && !isLoginPath) {
        router.push("/admin/login");
      } else if (isAuthenticated && isLoginPath) {
        router.push("/admin");
      }
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  // 3. System Dark Mode Setup
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      root.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  // If path is login, show clean login view without wrapper
  const isLoginPage = pathname === "/admin/login";

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20 animate-pulse">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
            Initializing Prime Admin Portal...
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  // Double check auth status before rendering protected components
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Panel */}
      <div
        className={clsx(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Quick Global Search Bar */}
            <div className="relative hidden sm:block max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Global command search..."
                className="w-48 xl:w-64 pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Action Items */}
          <div className="flex items-center space-x-3.5">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-colors relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900 animate-bounce">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl z-20 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-150">
                          Live Alerts ({unreadNotifications.length})
                        </h4>
                        {unreadNotifications.length > 0 && (
                          <button
                            onClick={() => markAllNotificationsRead()}
                            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationRead(notif.id);
                              }}
                              className={clsx(
                                "p-4 flex items-start space-x-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors",
                                !notif.read && "bg-emerald-50/20 dark:bg-emerald-950/10"
                              )}
                            >
                              <div
                                className={clsx(
                                  "p-1.5 rounded-lg mt-0.5",
                                  notif.type === "Order" && "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
                                  notif.type === "Stock" && "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                                  notif.type === "Expiry" && "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
                                  notif.type === "System" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div className="flex-1 truncate">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {notif.title}
                                  </h5>
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                            All quiet here. No notifications!
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=facearea&facepad=2&q=80"}
                  alt="Avatar"
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
                />
                <div className="text-left hidden lg:block leading-none truncate max-w-[100px]">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    {currentUser?.name.split(" ")[0]}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {currentUser?.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-20 p-1.5"
                    >
                      <div className="px-3.5 py-2.5 border-b border-slate-50 dark:border-slate-800 mb-1 leading-tight">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {currentUser?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          useAdminStore.getState().logout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
