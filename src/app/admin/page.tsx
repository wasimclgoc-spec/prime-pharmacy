"use client";

import React, { useMemo } from "react";
import { useAdminStore } from "@/lib/admin-store";
import StatCard from "@/components/admin/StatCard";
import { 
  DollarSign, ShoppingBag, ShoppingCart, RefreshCw, AlertTriangle, 
  Calendar, CheckCircle, XCircle, Users, ClipboardList, ShieldAlert
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import Link from "next/link";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#64748b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardPage() {
  const { 
    medicines, orders, customers, notifications,
    dailySalesTrend, medicineSalesDistribution, revenueProfitTrend, customerGrowthTrend
  } = useAdminStore();

  // 1. Calculate Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Low stock medicines (stock <= minStock)
    const lowStockMeds = medicines.filter(m => m.stock <= m.minStock);
    
    // Expired medicines
    const now = new Date();
    const expiredMeds = medicines.filter(m => new Date(m.expiry) < now);

    // Filter statuses
    const pendingOrders = orders.filter(o => o.status === "Pending");
    const completedOrders = orders.filter(o => o.status === "Delivered");
    const cancelledOrders = orders.filter(o => o.status === "Cancelled");

    // Sales math
    const totalRevenue = orders
      .filter(o => o.status !== "Cancelled" && o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + o.total, 0);

    return {
      todaySales: 4120, // Mock from data feed
      weeklySales: 29420,
      monthlySales: 118450,
      revenue: totalRevenue,
      pendingCount: pendingOrders.length,
      completedCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
      lowStockCount: lowStockMeds.length,
      expiredCount: expiredMeds.length,
      customerCount: customers.length
    };
  }, [medicines, orders, customers]);

  // 2. Format pie chart data for order status distribution
  const orderStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Recent Orders (take 5)
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  // Low stock alerts (take 5)
  const lowStockAlerts = useMemo(() => {
    return medicines
      .filter(m => m.stock <= m.minStock)
      .slice(0, 5)
      .sort((a,b) => a.stock - b.stock);
  }, [medicines]);

  // Expiry alerts (take 5, near or past expiry)
  const expiryAlerts = useMemo(() => {
    const now = new Date();
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 2); // 2 months warning
    
    return medicines
      .filter(m => {
        const exp = new Date(m.expiry);
        return exp <= threshold;
      })
      .slice(0, 5)
      .sort((a,b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  }, [medicines]);

  // Top Selling Medicines (mock sorted list matching distribution chart)
  const topSellingMedicines = useMemo(() => {
    return [...medicineSalesDistribution]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [medicineSalesDistribution]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-50">
            Control Dashboard
          </h1>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Real-time critical clinical logistics, drug storage, and sales telemetry.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-500">
            <Calendar className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            2026-07-20 Mon
          </span>
          <button 
            onClick={() => useAdminStore.getState().addNotification("Manual Sync Triggered", "Data synchronized with customer channel.", "System")}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl bg-white dark:bg-slate-900 transition-colors shadow-sm"
            title="Force refresh logs"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard 
          label="Today's Sales" 
          value={`Rs ${stats.todaySales}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend={{ value: 12.5, type: "increase" }}
          description="vs yesterday"
        />
        <StatCard 
          label="Weekly Sales" 
          value={`Rs ${stats.weeklySales.toLocaleString()}`} 
          icon={<ShoppingBag className="w-5 h-5" />} 
          trend={{ value: 4.8, type: "increase" }}
          description="vs last week"
        />
        <StatCard 
          label="Monthly Revenue" 
          value={`Rs ${stats.monthlySales.toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend={{ value: 18.2, type: "increase" }}
          description="vs last month"
        />
        <StatCard 
          label="Total Revenue" 
          value={`Rs ${stats.revenue.toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          description="All time paid orders"
        />
        <StatCard 
          label="Pending Orders" 
          value={stats.pendingCount} 
          icon={<ShoppingCart className="w-5 h-5" />} 
          className="border-amber-100 dark:border-amber-950 bg-amber-50/5"
          description="Awaiting approval"
        />
        <StatCard 
          label="Delivered" 
          value={stats.completedCount} 
          icon={<CheckCircle className="w-5 h-5 text-green-500" />} 
          description="Successful deliveries"
        />
        <StatCard 
          label="Cancelled" 
          value={stats.cancelledCount} 
          icon={<XCircle className="w-5 h-5 text-red-500" />} 
          description="Failed/Rejected sales"
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={stats.lowStockCount} 
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} 
          className="border-red-100 dark:border-red-950 bg-red-50/5"
          description="Needs urgent refill"
        />
        <StatCard 
          label="Expired Batches" 
          value={stats.expiredCount} 
          icon={<ShieldAlert className="w-5 h-5 text-red-600" />} 
          className="border-rose-100 dark:border-rose-950"
          description="Dispose immediately"
        />
        <StatCard 
          label="Active Customers" 
          value={stats.customerCount} 
          icon={<Users className="w-5 h-5" />} 
          description="Patient registry count"
        />
      </div>

      {/* Charts Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Daily Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Daily Sales Trend (Telemetry)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px' 
                  }} 
                />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Order Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Order Status Volume
          </h3>
          <div className="h-72 flex flex-col justify-between">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '12px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Status Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-xs">
              {orderStatusDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-500 font-semibold">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Chart: Revenue vs Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Financial Health Trend (Monthly Revenue & Profit)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueProfitTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" name="Total Revenue" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                <Area type="monotone" name="Gross Profit" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Medicine Category Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Product Category Stock Outflows
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicineSalesDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px' 
                  }} 
                />
                <Bar dataKey="sales" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Section Workspace Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Orders table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm xl:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Recent Outpatient Requests
              </h3>
              <Link href="/admin/orders" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                View All Orders →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-3">Order #</th>
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">Total</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Rx Needed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-3 pr-3 font-bold text-slate-800 dark:text-slate-200">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">
                        {o.customerName}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                        Rs ${o.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          o.status === "Pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                          o.status === "Delivered" ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                          o.status === "Cancelled" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
                          "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {o.prescriptionImage ? (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded text-[9px] font-bold">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Alerts & Safety Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Low Stock Alerts */}
          <div>
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Low Stock Alerts</span>
            </h3>
            <div className="space-y-2.5">
              {lowStockAlerts.map((med) => (
                <div key={med.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-red-50/20 dark:bg-red-950/5 border border-red-100/10">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{med.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Location: {med.storageLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-full font-bold">
                      {med.stock} left
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">Min: {med.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Near Expiry / Expired */}
          <div>
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-2 mb-3">
              <ShieldAlert className="w-4 h-4" />
              <span>Expiry Warnings</span>
            </h3>
            <div className="space-y-2.5">
              {expiryAlerts.map((med) => {
                const isPast = new Date(med.expiry) < new Date();
                return (
                  <div key={med.id} className={`flex justify-between items-center text-xs p-2 rounded-xl border border-transparent ${
                    isPast 
                      ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-100/10" 
                      : "bg-amber-50/20 dark:bg-amber-950/5 border-amber-100/10"
                  }`}>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{med.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Batch: {med.batch}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        isPast 
                          ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400" 
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                      }`}>
                        {isPast ? "Expired" : med.expiry}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Top Products Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Top Products Lists */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Outpatient Demand Leaders (Top Selling)
          </h3>
          <div className="space-y-3.5">
            {topSellingMedicines.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{m.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Stock available: {m.stock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Rs ${m.sales.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Accumulated sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Admin Audit Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span>Security Audit Log</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Full Log Encryption Active
              </span>
            </div>
            
            <div className="space-y-3.5">
              {useAdminStore().auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs pb-3 border-b border-slate-50 dark:border-slate-800 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {log.action}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-350 mt-1 font-semibold text-[11px]">
                    {log.details}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    User: {log.user} ({log.role})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
