"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { AdminRole } from "@/types";
import { ShieldCheck, Lock, Mail, Users, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminStore();

  const [email, setEmail] = useState("admin@primepharmacy.com");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<AdminRole>("Admin");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roles: AdminRole[] = ["Admin", "Pharmacist", "Manager", "Inventory Staff", "Delivery Staff", "Cashier"];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay for realistic experience
    setTimeout(() => {
      const success = login(email, password, role);
      setIsLoading(false);

      if (success) {
        router.push("/admin");
      } else {
        setError("Invalid credentials. Please use admin@primepharmacy.com / admin123");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Abstract decorative layout designs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />

      {/* Floating heartbeat line decorative element */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none flex items-center justify-center">
        <Activity className="w-[800px] h-[800px] text-emerald-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight">
            Prime Pharmacy CRM
          </h2>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1.5">
            AI-Powered Clinical & Pharmacy Administration Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Callout */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-sm font-semibold text-red-700 dark:text-red-400 rounded-r-xl"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Administrative Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@primepharmacy.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  Assign Session Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Assist */}
          <div className="bg-slate-50 dark:bg-slate-950 px-8 py-5 border-t border-slate-150 dark:border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <div>
              <p className="text-slate-400">Demo Administrative Credentials:</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-bold">
                admin@primepharmacy.com / admin123
              </p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-md">
              Encrypted JWT
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
