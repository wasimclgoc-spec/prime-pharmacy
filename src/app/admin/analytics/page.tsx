"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  RotateCcw,
  RefreshCw,
  ShoppingBag,
  Cpu,
  Bookmark,
  CheckCircle2,
} from "lucide-react";

import ChartCard from "@/components/admin/ChartCard";

export default function AnalyticsPage() {
  const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);
  const [activeSegment, setActiveSubSegment] = useState<"fast-moving" | "recs" | "seasonal">("fast-moving");

  // Mock revenue prediction data (real + forecasted)
  const revenueForecastData = [
    { date: "Jul 10", Revenue: 4500, Type: "Actual" },
    { date: "Jul 12", Revenue: 4800, Type: "Actual" },
    { date: "Jul 14", Revenue: 5100, Type: "Actual" },
    { date: "Jul 16", Revenue: 4700, Type: "Actual" },
    { date: "Jul 18", Revenue: 5200, Type: "Actual" },
    { date: "Jul 20", Revenue: 5400, Type: "Actual" },
    // Forecasted values (Dashed/Separate)
    { date: "Jul 22 (F)", Revenue: 5600, Forecast: 5600, Type: "Forecast" },
    { date: "Jul 24 (F)", Revenue: 5800, Forecast: 5800, Type: "Forecast" },
    { date: "Jul 26 (F)", Revenue: 6200, Forecast: 6200, Type: "Forecast" },
    { date: "Jul 28 (F)", Revenue: 6500, Forecast: 6500, Type: "Forecast" },
    { date: "Jul 30 (F)", Revenue: 6900, Forecast: 6900, Type: "Forecast" },
  ];

  // Fast moving trend data
  const medicineTrendData = [
    { name: "Week 1", Ventolin: 120, Nexium: 80, Crestor: 50 },
    { name: "Week 2", Ventolin: 150, Nexium: 90, Crestor: 65 },
    { name: "Week 3", Ventolin: 190, Nexium: 110, Crestor: 75 },
    { name: "Week 4", Ventolin: 240, Nexium: 130, Crestor: 80 },
  ];

  // Seasonal demand surges predictions
  const seasonalAnalysis = [
    { category: "Respiratory / Allergy", season: "Spring / Autumn", predictedSurge: "+45%", status: "High Risk", recStock: "Increase safety cushion +25%" },
    { category: "Cardiology Drugs", season: "Winter Cold", predictedSurge: "+18%", status: "Moderate", recStock: "Maintain standard stock levels" },
    { category: "Anti-infectives", season: "Monsoon / Flu", predictedSurge: "+60%", status: "Critical", recStock: "Pre-order 45 days in advance" },
  ];

  // Stock level predictions
  const stockPredictions = [
    { drug: "Ventolin HFA Inhaler", currentStock: 45, daysLeft: 6, prediction: "Stockout in 6 days", recommendation: "Reorder 300 units from GSK Logistics" },
    { drug: "Nexium 40mg", currentStock: 120, daysLeft: 14, prediction: "Stockout in 14 days", recommendation: "Reorder 150 units from AstraZeneca" },
    { drug: "Zoloft 50mg", currentStock: 80, daysLeft: 18, prediction: "Stockout in 18 days", recommendation: "Auto-reorder trigger in 3 days" },
  ];

  // Medicine Recommendations bundle engine
  const dynamicRecommendations = [
    { coreDrug: "Alendronate 70mg", associatedDrug: "Calcium + Vit D3", confidence: "94%", rational: "Prevent osteoporosis hypocalcemia risks" },
    { coreDrug: "Lisinopril 10mg", associatedDrug: "Potassium Supplement", confidence: "88%", rational: "Prescriber hyperkalemia balance" },
    { coreDrug: "Metformin 500mg", associatedDrug: "B12 Complex Multi", confidence: "81%", rational: "Counter long-term metformin deficiency absorption" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </span>
            AI Copilot & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime revenue forecasting, low-stock predictive models, and automatic medical recommendation pairings.
          </p>
        </div>

        <div className="flex gap-2">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setForecastDays(days as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                forecastDays === days
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              }`}
            >
              {days} Days Prediction
            </button>
          ))}
        </div>
      </div>

      {/* Prediction Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Forecast Card */}
        <div className="md:col-span-2">
          <ChartCard
            title={`Revenue Forecast (Next ${forecastDays} Days Projection)`}
            description="Historical sales data blended with AI Prophet predictive algorithms."
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueForecastData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  name="Historical Sales (Rs)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="Forecast"
                  name="AI Projected Sales (Rs)"
                  stroke="#0284c7"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* AI Agent Recommendation Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              Auto-Pilot Copilot Insights
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on machine learning models, Prime Pharmacy is projected to hit a gross revenue surge of <strong className="text-slate-800 dark:text-white">+18.5%</strong> over the next quarter, primarily driven by winter antihistamine demand curves.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 rounded-lg text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-800 dark:text-amber-400">Order Ventolin Now</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">High probability of asthmatic peak in 5 days due to localized pollen spikes.</p>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 rounded-lg text-xs flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-800 dark:text-emerald-400 font-bold">Lisinopril Stock Optimized</strong>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Safety cushion levels fully match predicted weekly dosage patterns.</p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition mt-4">
            Authorize All Reorder Recommendations
          </button>
        </div>
      </div>

      {/* Secondary segment section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Trends and Seasonal tab */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col h-[520px]">
          <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 gap-4 mb-4">
            {(["fast-moving", "seasonal"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubSegment(tab)}
                className={`pb-2 text-xs font-black uppercase tracking-wider relative ${
                  activeSegment === tab
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "fast-moving" ? "Fast-Moving Medicine Trends" : "Seasonal Demand Curves"}
                {activeSegment === tab && (
                  <motion.div
                    layoutId="segmentUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1">
            {activeSegment === "fast-moving" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={medicineTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Ventolin" stroke="#ef4444" strokeWidth={3} />
                  <Line type="monotone" dataKey="Nexium" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="Crestor" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Predicted seasonal category variance compiled from five years of regional pharmacy databases.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="py-2.5">Medication Class</th>
                        <th className="py-2.5">Peak Weather Season</th>
                        <th className="py-2.5">Predicted Surge</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Lead Time Strategy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonalAnalysis.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100/50 dark:border-slate-800/50">
                          <td className="py-4 font-semibold text-slate-800 dark:text-slate-100">{item.category}</td>
                          <td className="py-4 text-slate-500">{item.season}</td>
                          <td className="py-4 font-black text-emerald-600">{item.predictedSurge}</td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                item.status === "Critical"
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 text-slate-500 font-medium">{item.recStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Low Inventory Predictions list */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col h-[520px]">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              Low Stock Predictions (Safety Buffer Alerts)
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {stockPredictions.map((pred, idx) => (
                <div key={idx} className="p-3.5 border border-slate-150 dark:border-slate-850 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{pred.drug}</span>
                    <span className="font-black text-red-500 text-[10px] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                      {pred.daysLeft} days left
                    </span>
                  </div>
                  <p className="text-slate-400">Current levels: {pred.currentStock} packs • {pred.prediction}</p>
                  <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-100/50">
                    Recommended: {pred.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medicine pairing engine */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Clinical Pairing Recommendations (Prescriber Bundler)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AI correlations showing companion supplements that should be cross-referred to patients by the counter pharmacists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dynamicRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-slate-400">INDEXED CORRELATION</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {rec.confidence} Match
                  </span>
                </div>

                <div className="text-xs space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    Primary: <span className="text-slate-500 font-medium">{rec.coreDrug}</span>
                  </p>
                  <p className="font-bold text-emerald-600">
                    Companion: <span className="text-slate-500 font-medium">{rec.associatedDrug}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Rational: {rec.rational}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
