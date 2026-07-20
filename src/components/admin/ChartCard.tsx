"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart2, LineChart, PieChart, AreaChart } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  chartType?: "line" | "bar" | "pie" | "area";
  onChartTypeChange?: (type: "line" | "bar" | "pie" | "area") => void;
  supportedTypes?: ("line" | "bar" | "pie" | "area")[];
}

export default function ChartCard({
  title,
  description,
  children,
  chartType,
  onChartTypeChange,
  supportedTypes = ["line", "bar", "pie", "area"],
}: ChartCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChart2 className="w-4 h-4" />;
      case "pie":
        return <PieChart className="w-4 h-4" />;
      case "area":
        return <AreaChart className="w-4 h-4" />;
      default:
        return <LineChart className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {description}
            </p>
          )}
        </div>

        {chartType && onChartTypeChange && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 self-start sm:self-center">
            {supportedTypes.map((type) => (
              <button
                key={type}
                onClick={() => onChartTypeChange(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${
                  chartType === type
                    ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title={`${type} view`}
              >
                {getIcon(type)}
                <span className="hidden md:inline">{type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-80 flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}
