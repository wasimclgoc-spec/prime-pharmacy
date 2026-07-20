"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Truck,
  UserCheck,
  CheckCircle2,
  Clock,
  Navigation,
  Check,
  Search,
  Users,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "Idle" | "Delivering" | "Offline";
  assignmentsCount: number;
}

interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  items: string;
  status: "Ready" | "Assigned" | "Out for Delivery" | "Delivered" | "Cancelled";
  driverName?: string;
  etaMinutes?: number;
  deliveryFee: number;
  amount: number;
}

const initialDrivers: Driver[] = [
  { id: "DRV-01", name: "Alex Rivera", phone: "+1 (555) 012-9988", status: "Idle", assignmentsCount: 0 },
  { id: "DRV-02", name: "David Miller", phone: "+1 (555) 015-1122", status: "Delivering", assignmentsCount: 2 },
  { id: "DRV-03", name: "Sophia Martinez", phone: "+1 (555) 017-4455", status: "Idle", assignmentsCount: 0 },
  { id: "DRV-04", name: "Marcus Johnson", phone: "+1 (555) 014-6633", status: "Offline", assignmentsCount: 0 },
];

const initialOrders: DeliveryOrder[] = [
  {
    id: "ORD-9901",
    customerName: "Robert Dowson",
    address: "742 Evergreen Terrace, Springfield",
    phone: "+1 (555) 019-1144",
    items: "Amoxicillin 500mg (2x), Nexium 40mg (1x)",
    status: "Ready",
    deliveryFee: 5.0,
    amount: 45.5,
  },
  {
    id: "ORD-9902",
    customerName: "Emily Watson",
    address: "123 Maple Street, Sector 4",
    phone: "+1 (555) 013-8822",
    items: "Ventolin Inhaler (1x), Crestor 10mg (1x)",
    status: "Ready",
    deliveryFee: 3.5,
    amount: 68.2,
  },
  {
    id: "ORD-9892",
    customerName: "Gregory House",
    address: "221B Baker St, West District",
    phone: "+1 (555) 011-5500",
    items: "Vicodin 10mg (3x), Lipitor 20mg (1x)",
    status: "Out for Delivery",
    driverName: "David Miller",
    etaMinutes: 12,
    deliveryFee: 7.0,
    amount: 154.0,
  },
  {
    id: "ORD-9885",
    customerName: "Clara Oswald",
    address: "55 Totter's Lane, London Outskirts",
    phone: "+1 (555) 018-9911",
    items: "Zoloft 50mg (1x)",
    status: "Delivered",
    driverName: "David Miller",
    deliveryFee: 5.0,
    amount: 32.5,
  },
];

export default function DeliveryPage() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [orders, setOrders] = useState<DeliveryOrder[]>(initialOrders);
  const [selectedDriverId, setSelectedDriverId] = useState<Record<string, string>>({});
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchTerm] = useState("");

  const handleAssignDriver = (orderId: string) => {
    const driverId = selectedDriverId[orderId];
    if (!driverId) {
      alert("Please select a driver from the dropdown list first.");
      return;
    }

    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;

    // Update orders status
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "Assigned",
            driverName: driver.name,
            etaMinutes: Math.floor(Math.random() * 25) + 15, // random ETA between 15-40 mins
          };
        }
        return o;
      })
    );

    // Update driver assignments count & status
    setDrivers(
      drivers.map((d) => {
        if (d.id === driverId) {
          return {
            ...d,
            status: "Delivering",
            assignmentsCount: d.assignmentsCount + 1,
          };
        }
        return d;
      })
    );

    // clear selection
    setSelectedDriverId((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
  };

  const handleUpdateStatus = (orderId: string, nextStatus: DeliveryOrder["status"]) => {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: nextStatus,
            // If delivered, ETA is 0
            etaMinutes: nextStatus === "Delivered" ? 0 : o.etaMinutes,
          };
        }
        return o;
      })
    );

    // If delivery is completed/cancelled, reduce driver assignments count
    if (nextStatus === "Delivered" || nextStatus === "Cancelled") {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.driverName) {
        setDrivers(
          drivers.map((d) => {
            if (d.name === order.driverName) {
              const newCount = Math.max(0, d.assignmentsCount - 1);
              return {
                ...d,
                assignmentsCount: newCount,
                status: newCount === 0 ? "Idle" : "Delivering",
              };
            }
            return d;
          })
        );
      }
    }
  };

  const handleConfirmDelivery = () => {
    if (!confirmingOrderId) return;
    handleUpdateStatus(confirmingOrderId, "Delivered");
    setConfirmingOrderId(null);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Truck className="w-6 h-6" />
            </span>
            Delivery Logistics & Fleet
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch driver agents, supervise ETAs, and audit door-to-door medicine prescription shipments.
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ready to Dispatch", value: orders.filter((o) => o.status === "Ready").length, icon: ClipboardList, color: "text-amber-500 bg-amber-50" },
          { label: "Out for Delivery", value: orders.filter((o) => o.status === "Out for Delivery").length, icon: Navigation, color: "text-blue-500 bg-blue-50" },
          { label: "Delivered Today", value: orders.filter((o) => o.status === "Delivered").length, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
          { label: "Active Drivers", value: drivers.filter((d) => d.status !== "Offline").length, icon: Users, color: "text-slate-600 bg-slate-50" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
              <span className={`p-2.5 rounded-lg shrink-0 ${stat.color} dark:bg-slate-800`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">{stat.label}</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map View & Drivers list container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drivers Roster Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-4 h-[650px] flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-emerald-500" />
              Delivery Staff Roster
            </h2>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {drivers.length} TOTAL
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {drivers.map((driver) => (
              <div key={driver.id} className="p-3.5 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <User className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{driver.name}</span>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                      driver.status === "Idle"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : driver.status === "Delivering"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {driver.status}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> {driver.phone}
                  </span>
                  <span>Active tasks: {driver.assignmentsCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map cards grid */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col h-[650px]">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4.5 h-4.5 text-emerald-500" />
                Live Dispatch Map Coordinates (Grid View)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Interact with localized addresses and adjust ETAs.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shipping files..."
                value={searchQuery}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pr-1">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                  order.status === "Delivered"
                    ? "bg-slate-50/50 border-slate-100 dark:bg-slate-900 dark:border-slate-800 opacity-70"
                    : "bg-white border-slate-150 dark:bg-slate-900 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                      {order.id}
                    </span>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        order.status === "Ready"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          : order.status === "Assigned"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : order.status === "Out for Delivery"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{order.customerName}</p>
                    <p className="text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-red-500" /> {order.address}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-300" /> {order.phone}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 italic font-semibold mt-1 bg-slate-50 dark:bg-slate-850 p-1.5 rounded">
                      {order.items}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {order.status === "Ready" ? (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">
                        Select Driver Dispatch
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedDriverId[order.id] || ""}
                          onChange={(e) =>
                            setSelectedDriverId({ ...selectedDriverId, [order.id]: e.target.value })
                          }
                          className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-800 dark:border-slate-700"
                        >
                          <option value="">-- Assign Driver --</option>
                          {drivers
                            .filter((d) => d.status !== "Offline")
                            .map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.name} ({drv.status})
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleAssignDriver(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded transition"
                        >
                          Dispatch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Driver: <strong className="text-slate-700 dark:text-slate-300">{order.driverName}</strong></span>
                        {order.etaMinutes !== undefined && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Clock className="w-3.5 h-3.5" /> ETA {order.etaMinutes} mins
                          </span>
                        )}
                      </div>

                      {order.status === "Assigned" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "Out for Delivery")}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded transition flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Set Out For Delivery
                        </button>
                      )}

                      {order.status === "Out for Delivery" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setConfirmingOrderId(order.id)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded transition flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm Delivery
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Cancelled")}
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-250 dark:border-slate-700 dark:bg-slate-800 rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Signature Overlay */}
      <AnimatePresence>
        {confirmingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 relative"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Signoff & Delivery Receipt
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Verify receipt of payment and medicine boxes for order <strong className="text-slate-700 dark:text-white">{confirmingOrderId}</strong>.
              </p>

              {/* Digital signature pad mockup */}
              <div className="border border-slate-200 border-dashed rounded-lg bg-slate-50 p-6 flex flex-col items-center justify-center h-28 relative">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest absolute top-2">
                  Customer Signature Pad
                </span>
                <div className="w-3/4 h-0.5 bg-slate-300 absolute bottom-8"></div>
                <p className="text-[10px] text-slate-400 font-medium absolute bottom-3">
                  Draw or sign above on screen
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 mt-4">
                <button
                  onClick={() => setConfirmingOrderId(null)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                >
                  Verify Delivered
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
