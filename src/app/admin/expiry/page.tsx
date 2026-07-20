"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  CornerUpLeft,
  Settings,
  Search,
  CheckCircle2,
  Trash2,
  BellRing,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

import ReportExporter from "@/components/admin/ReportExporter";

interface ExpiryBatch {
  id: string;
  medicineName: string;
  batchCode: string;
  supplierName: string;
  expiryDate: string;
  quantity: number;
  valuation: number;
  category: "expired" | "near_30" | "near_60" | "near_90";
  status: "active" | "quarantined" | "disposed" | "returned";
}

const initialBatches: ExpiryBatch[] = [
  {
    id: "B-9102",
    medicineName: "Amoxicillin 500mg",
    batchCode: "AMX-X221",
    supplierName: "GlaxoSmithKline Logistics",
    expiryDate: "2026-06-30", // Expired
    quantity: 45,
    valuation: 54.0,
    category: "expired",
    status: "active",
  },
  {
    id: "B-9103",
    medicineName: "Nexium 40mg",
    batchCode: "NEX-N992",
    supplierName: "AstraZeneca Distribution Ltd",
    expiryDate: "2026-08-15", // ~30 days
    quantity: 120,
    valuation: 540.0,
    category: "near_30",
    status: "active",
  },
  {
    id: "B-8871",
    medicineName: "Crestor 10mg",
    batchCode: "CRE-C414",
    supplierName: "AstraZeneca Distribution Ltd",
    expiryDate: "2026-09-10", // ~60 days
    quantity: 80,
    valuation: 256.0,
    category: "near_60",
    status: "active",
  },
  {
    id: "B-7751",
    medicineName: "Zoloft 50mg",
    batchCode: "ZOL-Z122",
    supplierName: "Pfizer Wholesale Global",
    expiryDate: "2026-10-18", // ~90 days
    quantity: 200,
    valuation: 500.0,
    category: "near_90",
    status: "active",
  },
  {
    id: "B-6623",
    medicineName: "Diovan 80mg",
    batchCode: "DIO-D812",
    supplierName: "Novartis Pharma Supply",
    expiryDate: "2026-05-12", // Expired
    quantity: 15,
    valuation: 58.5,
    category: "expired",
    status: "quarantined",
  },
];

export default function ExpiryPage() {
  const [batches, setBatches] = useState<ExpiryBatch[]>(initialBatches);
  const [activeFilter, setActiveFilter] = useState<"all" | "expired" | "near_30" | "near_60" | "near_90">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Alert settings config state
  const [alertDays, setAlertDays] = useState("30");
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [alertEmail, setAlertEmail] = useState("safety@prime-pharmacy.com");

  // Status updates
  const handleAction = (batchId: string, action: ExpiryBatch["status"]) => {
    setBatches(
      batches.map((b) => {
        if (b.id === batchId) {
          let logMsg = "";
          if (action === "quarantined") logMsg = `${b.medicineName} shifted to locked quarantine.`;
          if (action === "disposed") logMsg = `${b.medicineName} incinerated according to medical biohazard standards.`;
          if (action === "returned") logMsg = `${b.medicineName} returned to supplier. Credit invoice generated.`;
          alert(logMsg);
          return { ...b, status: action };
        }
        return b;
      })
    );
  };

  const filteredBatches = batches.filter((b) => {
    const matchesFilter = activeFilter === "all" || b.category === activeFilter;
    const matchesSearch =
      b.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCategoryStyles = (cat: ExpiryBatch["category"]) => {
    switch (cat) {
      case "expired":
        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200/50";
      case "near_30":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50";
      case "near_60":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-250";
      case "near_90":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50";
    }
  };

  const getStatusStyles = (stat: ExpiryBatch["status"]) => {
    switch (stat) {
      case "quarantined":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "disposed":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300";
      case "returned":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
      default:
        return "bg-transparent text-slate-500";
    }
  };

  const exportColumns = [
    { header: "Batch ID", key: "id" },
    { header: "Medicine", key: "medicineName" },
    { header: "Batch Code", key: "batchCode" },
    { header: "Expiry Date", key: "expiryDate" },
    { header: "Quantity (packs)", key: "quantity" },
    { header: "Valuation ($)", key: "valuation" },
    { header: "Status", key: "status" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
            </span>
            Clinical Expiry Guard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervise medication batch shelf expirations, quarantine dead-stocks, and log supplier returns.
          </p>
        </div>
      </div>

      {/* Threshold Filters Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { id: "all", label: "All Batches", count: batches.length, color: "border-slate-200 dark:border-slate-800" },
          { id: "expired", label: "Expired", count: batches.filter((b) => b.category === "expired").length, color: "border-red-400/50 hover:bg-red-50/20" },
          { id: "near_30", label: "Near 30 Days", count: batches.filter((b) => b.category === "near_30").length, color: "border-amber-400/50 hover:bg-amber-50/20" },
          { id: "near_60", label: "Near 60 Days", count: batches.filter((b) => b.category === "near_60").length, color: "border-yellow-400/50 hover:bg-yellow-50/20" },
          { id: "near_90", label: "Near 90 Days", count: batches.filter((b) => b.category === "near_90").length, color: "border-blue-400/50 hover:bg-blue-50/20" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id as any)}
            className={`p-4 border rounded-xl text-left transition-all ${item.color} ${
              activeFilter === item.id
                ? "bg-slate-50 dark:bg-slate-900 shadow-xs ring-1 ring-emerald-500"
                : "bg-white dark:bg-slate-900"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
              {item.count} <span className="text-xs text-slate-400 font-medium">batches</span>
            </span>
          </button>
        ))}
      </div>

      {/* Action Table & Config Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table list */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col h-[550px]">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drug or batch code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Custom Excel/PDF export */}
            <ReportExporter
              data={filteredBatches}
              columns={exportColumns}
              filename="expiry_wastage_report"
              reportTitle="Medicine Expiration Wastage Audit Sheet"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5">Batch Code</th>
                  <th className="py-2.5">Medicine</th>
                  <th className="py-2.5">Expiry Date</th>
                  <th className="py-2.5">Stock</th>
                  <th className="py-2.5">Risk Valuation</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-black border text-[9px] uppercase ${getCategoryStyles(batch.category)}`}>
                          {batch.batchCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold text-slate-850 dark:text-slate-100 block">{batch.medicineName}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{batch.supplierName}</span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-500">{batch.expiryDate}</td>
                    <td className="py-3.5 font-black text-slate-700 dark:text-slate-300">{batch.quantity} packs</td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">Rs ${batch.valuation.toFixed(2)}</td>
                    <td className="py-3.5 text-right">
                      {batch.status === "active" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(batch.id, "quarantined")}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded"
                            title="Quarantine Stock"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button
                            onClick={() => handleAction(batch.id, "returned")}
                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded"
                            title="Return to Supplier"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAction(batch.id, "disposed")}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded"
                            title="Dispose / Incinerate"
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${getStatusStyles(batch.status)}`}>
                          {batch.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration alert panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs h-[550px] flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              Expiry Guard Configuration
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              Define safety tolerances and thresholds. Near-expiry batches matching parameters will emit email alerts automatically.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Yellow Warning Threshold
                </label>
                <select
                  value={alertDays}
                  onChange={(e) => setAlertDays(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:outline-none"
                >
                  <option value="30">30 Days Before Expiry</option>
                  <option value="45">45 Days Before Expiry</option>
                  <option value="60">60 Days Before Expiry</option>
                  <option value="90">90 Days Before Expiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Notification Dispatch Email
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                <div>
                  <strong className="text-xs text-slate-700 dark:text-slate-300 block font-bold">Auto-Quarantine</strong>
                  <span className="text-[10px] text-slate-400 font-medium">Lock batches instantly on expiry</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoQuarantine}
                  onChange={() => setAutoQuarantine(!autoQuarantine)}
                  className="w-4 h-4 text-emerald-500 accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => alert("Expiry Guard alert configurations saved successfully.")}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Save Alarm Configurations
          </button>
        </div>
      </div>
    </div>
  );
}
