"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  onChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export default function DateRangePicker({ onChange, initialRange }: DateRangePickerProps) {
  const defaultStart = initialRange?.startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
  const defaultEnd = initialRange?.endDate || new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Last 30 Days");

  const presetRanges = [
    { label: "Today", days: 0 },
    { label: "Yesterday", days: 1 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "This Month", days: "this_month" },
    { label: "Last Month", days: "last_month" },
    { label: "This Year", days: "this_year" },
  ];

  const handlePresetClick = (label: string, days: number | string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (typeof days === "number") {
      if (days === 0) {
        // Today
        start = today;
      } else if (days === 1) {
        // Yesterday
        start = new Date();
        start.setDate(today.getDate() - 1);
        end = new Date();
        end.setDate(today.getDate() - 1);
      } else {
        start.setDate(today.getDate() - days);
      }
    } else if (days === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (days === "last_month") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (days === "this_year") {
      start = new Date(today.getFullYear(), 0, 1);
    }

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedLabel(label);
    onChange({ startDate: startStr, endDate: endStr });
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedLabel("Custom Range");
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Calendar className="w-4 h-4 text-emerald-500" />
        <span>
          {selectedLabel}: {startDate} to {endDate}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 p-4">
          <div className="grid grid-cols-2 gap-1 mb-4">
            {presetRanges.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.label, preset.days)}
                className="text-left px-3 py-1.5 text-xs font-medium text-slate-600 rounded hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow transition"
              >
                Apply Custom Range
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
