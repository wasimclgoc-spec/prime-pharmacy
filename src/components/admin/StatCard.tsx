"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number; // e.g. 12 for 12%
    type: "increase" | "decrease" | "neutral";
  };
  description?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  description,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={clsx(
        "p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      {/* Decorative background pulse for healthcare feel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex justify-between items-start">
        <div className="space-y-1 z-10">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-50 tracking-tight">
            {value}
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl z-10 shadow-inner">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between z-10">
        {trend && (
          <div className="flex items-center space-x-1">
            <span
              className={clsx(
                "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.type === "increase"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  : trend.type === "decrease"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400"
              )}
            >
              {trend.type === "increase" ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : trend.type === "decrease" ? (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ) : null}
              {trend.type === "increase" ? "+" : trend.type === "decrease" ? "-" : ""}
              {Math.abs(trend.value)}%
            </span>
            {description && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {description}
              </span>
            )}
          </div>
        )}
        {!trend && description && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {description}
          </span>
        )}
      </div>
    </motion.div>
  );
}
