"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Users,
  Percent,
  Calendar,
  Layers,
  Award,
  BookOpen,
} from "lucide-react";

import DateRangePicker from "@/components/admin/DateRangePicker";
import ChartCard from "@/components/admin/ChartCard";
import ReportExporter from "@/components/admin/ReportExporter";

type ReportTab = "sales" | "inventory" | "expiry" | "customer" | "order" | "profit";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
  };

  // Mock Report Data
  const salesReportData = [
    { name: "Jul 01", Sales: 4200, Orders: 145 },
    { name: "Jul 05", Sales: 5100, Orders: 160 },
    { name: "Jul 10", Sales: 4800, Orders: 155 },
    { name: "Jul 15", Sales: 6200, Orders: 180 },
    { name: "Jul 20", Sales: 7500, Orders: 210 },
  ];

  const profitReportData = [
    { name: "Jul 01", Revenue: 4200, Cost: 2500, Profit: 1700 },
    { name: "Jul 05", Revenue: 5100, Cost: 3000, Profit: 2100 },
    { name: "Jul 10", Revenue: 4800, Cost: 2800, Profit: 2000 },
    { name: "Jul 15", Revenue: 6200, Cost: 3500, Profit: 2700 },
    { name: "Jul 20", Revenue: 7500, Cost: 4300, Profit: 3200 },
  ];

  const inventoryReportData = [
    { name: "Antibiotics", Quantity: 1540, Valuation: 12500 },
    { name: "Analgesics", Quantity: 2400, Valuation: 9600 },
    { name: "Cardiology", Quantity: 850, Valuation: 18400 },
    { name: "Inhalers", Quantity: 420, Valuation: 11200 },
    { name: "Diabetic", Quantity: 980, Valuation: 15600 },
  ];

  const expiryReportData = [
    { name: "Expired (Now)", count: 12, value: 450 },
    { name: "Near 30 Days", count: 24, value: 1200 },
    { name: "Near 60 Days", count: 48, value: 2900 },
    { name: "Near 90 Days", count: 110, value: 5800 },
  ];

  const customerReportData = [
    { name: "Jul 01", NewCustomers: 12, Returning: 85 },
    { name: "Jul 05", NewCustomers: 15, Returning: 90 },
    { name: "Jul 10", NewCustomers: 8, Returning: 95 },
    { name: "Jul 15", NewCustomers: 22, Returning: 112 },
    { name: "Jul 20", NewCustomers: 30, Returning: 125 },
  ];

  const orderReportData = [
    { name: "Jul 01", FulfillmentMinutes: 28, Cancellations: 3 },
    { name: "Jul 05", FulfillmentMinutes: 24, Cancellations: 1 },
    { name: "Jul 10", FulfillmentMinutes: 22, Cancellations: 2 },
    { name: "Jul 15", FulfillmentMinutes: 19, Cancellations: 4 },
    { name: "Jul 20", FulfillmentMinutes: 15, Cancellations: 2 },
  ];

  const topSellingMedicines = [
    { rank: 1, name: "Amoxicillin 500mg", category: "Antibiotics", sales: 1240, revenue: 1488 },
    { rank: 2, name: "Nexium 40mg", category: "Acid Reflux", sales: 980, revenue: 4410 },
    { rank: 3, name: "Crestor 10mg", category: "Cardiology", sales: 850, revenue: 2720 },
    { rank: 4, name: "Ventolin HFA Inhaler", category: "Respiratory", sales: 620, revenue: 17360 },
    { rank: 5, name: "Zoloft 50mg", category: "Mental Health", sales: 510, revenue: 1275 },
  ];

  const slowMovingMedicines = [
    { rank: 1, name: "Gleevec 400mg", category: "Oncology", stockMonths: 8, value: 4500 },
    { rank: 2, name: "Lyrica 75mg", category: "Neurology", stockMonths: 6.5, value: 2400 },
    { rank: 3, name: "Diovan 80mg", category: "Hypertension", stockMonths: 5.2, value: 1520 },
  ];

  // Helper for active data
  const getActiveReportConfig = () => {
    switch (activeTab) {
      case "sales":
        return {
          title: "Sales Revenue Report",
          data: salesReportData,
          columns: [
            { header: "Date Interval", key: "name" },
            { header: "Gross Sales ($)", key: "Sales" },
            { header: "Order Count", key: "Orders" },
          ],
        };
      case "profit":
        return {
          title: "Net Profit & Margins Report",
          data: profitReportData,
          columns: [
            { header: "Date Interval", key: "name" },
            { header: "Revenue ($)", key: "Revenue" },
            { header: "Cost ($)", key: "Cost" },
            { header: "Net Profit ($)", key: "Profit" },
          ],
        };
      case "inventory":
        return {
          title: "Inventory Stocks & Valuations",
          data: inventoryReportData,
          columns: [
            { header: "Drug Category", key: "name" },
            { header: "Stock Quantity (Packs)", key: "Quantity" },
            { header: "Valuation ($)", key: "Valuation" },
          ],
        };
      case "expiry":
        return {
          title: "Stock Expirations & Waste Risk",
          data: expiryReportData,
          columns: [
            { header: "Expiry Threshold", key: "name" },
            { header: "Batches Count", key: "count" },
            { header: "Valuation Risk ($)", key: "value" },
          ],
        };
      case "customer":
        return {
          title: "Customer Retention & Growth",
          data: customerReportData,
          columns: [
            { header: "Interval", key: "name" },
            { header: "New Registered Users", key: "NewCustomers" },
            { header: "Returning Users", key: "Returning" },
          ],
        };
      case "order":
        return {
          title: "Logistics Fulfillment Performance",
          data: orderReportData,
          columns: [
            { header: "Interval", key: "name" },
            { header: "Fulfillment SLA (Mins)", key: "FulfillmentMinutes" },
            { header: "Cancellations Count", key: "Cancellations" },
          ],
        };
    }
  };

  const currentReport = getActiveReportConfig();

  const renderActiveChart = () => {
    const data = currentReport.data;
    if (activeTab === "sales") {
      if (chartType === "bar") {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        );
      } else if (chartType === "line") {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    }

    if (activeTab === "profit") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="transparent" />
            <Area type="monotone" dataKey="Profit" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === "inventory") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Quantity" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Valuation" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === "expiry") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Risk Valuation ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === "customer") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="NewCustomers" name="New Registrants" stroke="#10b981" strokeWidth={3} />
            <Line type="monotone" dataKey="Returning" name="Returning Patients" stroke="#0284c7" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === "order") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorFulfillment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="FulfillmentMinutes" name="Delivery SLA (mins)" stroke="#0284c7" fillOpacity={1} fill="url(#colorFulfillment)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-6 h-6" />
            </span>
            Analytics Reporting Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reconcile daily clinical accounts, inspect inventory shelf movements, and export detailed PDFs.
          </p>
        </div>

        {/* Date Picker */}
        <DateRangePicker onChange={handleDateRangeChange} />
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Sales Period", value: "Rs 48,220.00", change: "+14.2% vs last month", icon: TrendingUp, positive: true },
          { label: "Net Period Margins", value: "38.5%", change: "+2.1% efficiency rise", icon: Percent, positive: true },
          { label: "Logistics Fulfillment", value: "19.5 Mins", change: "-4.2 mins delivery dispatch", icon: Activity, positive: true },
          { label: "Expired Wastage Risk", value: "Rs 450.00", change: "12 batches quarantine", icon: AlertTriangle, positive: false },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block">{stat.label}</span>
                <span className={`p-1.5 rounded bg-slate-50 dark:bg-slate-850 text-slate-500`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">{stat.value}</h3>
              <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${
                stat.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
              }`}>
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Tabs Container */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2">
        {(["sales", "profit", "inventory", "expiry", "customer", "order"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab !== "sales") setChartType("area");
            }}
            className={`pb-3 px-4 text-xs md:text-sm font-bold capitalize relative border-b-2 transition-all duration-200 ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            {tab} Report
          </button>
        ))}
      </div>

      {/* Chart and Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reusable Chart Card Wrapper */}
        <div className="lg:col-span-8">
          <ChartCard
            title={currentReport.title}
            description={`Reporting data from ${dateRange.startDate} to ${dateRange.endDate}`}
            chartType={activeTab === "sales" ? chartType : undefined}
            onChartTypeChange={activeTab === "sales" ? setChartType : undefined}
            supportedTypes={["area", "bar", "line"]}
          >
            {renderActiveChart()}
          </ChartCard>
        </div>

        {/* Top/Slow list cards */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-500" />
              Top Fast-Moving Medicines
            </h2>
            <div className="space-y-3">
              {topSellingMedicines.map((item) => (
                <div key={item.rank} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white block">{item.sales} sold</span>
                    <span className="text-[10px] text-emerald-600 font-bold">${item.revenue} rev</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Slow-Moving Stock Alerts
            </h2>
            <div className="space-y-3">
              {slowMovingMedicines.map((item) => (
                <div key={item.rank} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block text-red-500">{item.stockMonths} mos idle</span>
                    <span className="text-[10px] text-slate-400 font-bold">${item.value} tied</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Data Table with PDF Exporter */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Sheet Ledger ({currentReport.title})
              </h2>
              <p className="text-xs text-slate-400">
                Audited reports matching query intervals and date parameters.
              </p>
            </div>

            {/* Reusable Report Exporter */}
            <ReportExporter
              data={currentReport.data}
              columns={currentReport.columns}
              filename={`${activeTab}_report`}
              reportTitle={currentReport.title}
              reportSubtitle={`Audited period: ${dateRange.startDate} to ${dateRange.endDate}`}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  {currentReport.columns.map((col) => (
                    <th key={col.key} className="py-3">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentReport.data.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100/50 dark:border-slate-800/50">
                    {currentReport.columns.map((col) => (
                      <td key={col.key} className="py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {typeof row[col.key] === "number" && col.header.includes("$")
                          ? `$${row[col.key].toLocaleString()}`
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
