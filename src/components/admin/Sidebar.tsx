"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { 
  LayoutDashboard, ShoppingCart, Pill, Users, Truck, 
  BarChart3, Settings, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Menu, MessageCircle, 
  FileText, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAdminStore();
  const role = currentUser?.role || "Admin";

  const menuItems = [
    {
      title: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ["Admin", "Pharmacist", "Manager", "Inventory Staff", "Delivery Staff", "Cashier"],
    },
    {
      title: "Orders",
      path: "/admin/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      roles: ["Admin", "Pharmacist", "Manager", "Cashier"],
    },
    {
      title: "Inventory",
      path: "/admin/inventory",
      icon: <Pill className="w-5 h-5" />,
      roles: ["Admin", "Pharmacist", "Manager", "Inventory Staff"],
    },
    {
      title: "Customers",
      path: "/admin/customers",
      icon: <Users className="w-5 h-5" />,
      roles: ["Admin", "Manager"],
    },
    {
      title: "Suppliers",
      path: "/admin/suppliers",
      icon: <Briefcase className="w-5 h-5" />,
      roles: ["Admin", "Manager", "Inventory Staff"],
    },
    {
      title: "Delivery",
      path: "/admin/delivery",
      icon: <Truck className="w-5 h-5" />,
      roles: ["Admin", "Manager", "Delivery Staff"],
    },
    {
      title: "Reports",
      path: "/admin/reports",
      icon: <FileText className="w-5 h-5" />,
      roles: ["Admin", "Pharmacist", "Manager"],
    },
    {
      title: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ["Admin", "Manager"],
    },
    {
      title: "WhatsApp",
      path: "/admin/whatsapp-test",
      icon: <MessageCircle className="w-5 h-5" />,
      roles: ["Admin"],
    },
    {
      title: "Settings",
      path: "/admin/settings",
      icon: <Settings className="w-5 h-5" />,
      roles: ["Admin", "Manager"],
    },
  ];

  // Filter items by user role
  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all select-none">
      {/* Brand Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/admin" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/10">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-base bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent"
            >
              Prime Admin
            </motion.span>
          )}
        </Link>
        
        {/* Toggle Collapse Button for Desktop */}
        {!isMobileOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {filteredItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={clsx(
                  "flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group relative cursor-pointer",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                )}
                onClick={() => isMobileOpen && setIsMobileOpen(false)}
              >
                {/* Active side indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-md"
                  />
                )}
                
                <div className="flex-shrink-0">{item.icon}</div>

                {(!isCollapsed || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.title}
                  </motion.span>
                )}

                {/* Tooltip on Hover when collapsed */}
                {isCollapsed && !isMobileOpen && (
                  <div className="absolute left-16 scale-0 group-hover:scale-100 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-md origin-left transition-all z-30 pointer-events-none font-normal">
                    {item.title}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        {(!isCollapsed || isMobileOpen) ? (
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=facearea&facepad=2&q=80"}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {currentUser?.name || "Dr. Admin"}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 truncate">
                  {role}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-950 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=facearea&facepad=2&q=80"}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <button
              onClick={() => logout()}
              className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shadow-sm"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 z-50 md:hidden shadow-2xl h-screen"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Persistent) */}
      <div
        className={clsx(
          "hidden md:block h-screen fixed left-0 top-0 bottom-0 z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
