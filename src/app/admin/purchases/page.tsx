"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus2,
  ListOrdered,
  Truck,
  RotateCcw,
  BarChart,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  Calendar,
} from "lucide-react";

interface POItem {
  id: string;
  medicineName: string;
  quantity: number;
  unitCost: number;
  receivedQty?: number;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: POItem[];
  totalCost: number;
  status: "Pending" | "Received" | "Cancelled";
  receivedDate?: string;
  shippingFee: number;
  taxRate: number;
}

interface SupplierReturn {
  id: string;
  supplierName: string;
  date: string;
  medicineName: string;
  qty: number;
  unitRefund: number;
  reason: string;
  status: "Completed" | "Pending";
}

const mockSuppliers = [
  { id: "SUP-001", name: "AstraZeneca Distribution Ltd" },
  { id: "SUP-002", name: "Pfizer Wholesale Global" },
  { id: "SUP-003", name: "Novartis Pharma Supply" },
  { id: "SUP-004", name: "GlaxoSmithKline Logistics" },
];

const mockMedicinesList = [
  { name: "Nexium 40mg", defaultCost: 4.5 },
  { name: "Crestor 10mg", defaultCost: 3.2 },
  { name: "Symbicort Inhaler", defaultCost: 28.0 },
  { name: "Lipitor 20mg", defaultCost: 5.1 },
  { name: "Lyrica 75mg", defaultCost: 6.8 },
  { name: "Viagra 100mg", defaultCost: 12.0 },
  { name: "Zoloft 50mg", defaultCost: 2.5 },
  { name: "Diovan 80mg", defaultCost: 3.9 },
  { name: "Amoxicillin 500mg", defaultCost: 1.2 },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2026-101",
    supplierId: "SUP-001",
    supplierName: "AstraZeneca Distribution Ltd",
    date: "2026-07-10",
    items: [
      { id: "it-1", medicineName: "Nexium 40mg", quantity: 500, unitCost: 4.5, receivedQty: 500 },
      { id: "it-2", medicineName: "Crestor 10mg", quantity: 300, unitCost: 3.2, receivedQty: 300 },
    ],
    totalCost: 3210.0,
    status: "Received",
    receivedDate: "2026-07-12",
    shippingFee: 50,
    taxRate: 15,
  },
  {
    id: "PO-2026-102",
    supplierId: "SUP-002",
    supplierName: "Pfizer Wholesale Global",
    date: "2026-07-18",
    items: [
      { id: "it-3", medicineName: "Lipitor 20mg", quantity: 400, unitCost: 5.1 },
      { id: "it-4", medicineName: "Zoloft 50mg", quantity: 200, unitCost: 2.5 },
    ],
    totalCost: 2540.0,
    status: "Pending",
    shippingFee: 60,
    taxRate: 15,
  },
];

const initialReturns: SupplierReturn[] = [
  {
    id: "RET-2026-01",
    supplierName: "Pfizer Wholesale Global",
    date: "2026-07-15",
    medicineName: "Zoloft 50mg",
    qty: 25,
    unitRefund: 2.5,
    reason: "Damaged box sealing",
    status: "Completed",
  },
];

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [returns, setReturns] = useState<SupplierReturn[]>(initialReturns);
  const [activeSubTab, setActiveSubTab] = useState<"create" | "receive" | "returns" | "history">("create");

  // Create PO form state
  const [poSupplierId, setPoSupplierId] = useState(mockSuppliers[0].id);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [currentItemName, setCurrentItemName] = useState(mockMedicinesList[0].name);
  const [currentItemQty, setCurrentItemQty] = useState<string>("100");
  const [currentItemCost, setCurrentItemCost] = useState<string>("4.50");
  const [shippingFee, setShippingFee] = useState<string>("50");
  const [taxRate, setTaxRate] = useState<string>("15"); // %

  // Stock receiving form state
  const [receivingPOId, setReceivingPOId] = useState<string | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  // Return logging state
  const [retSupplierName, setRetSupplierName] = useState(mockSuppliers[0].name);
  const [retMedicine, setRetMedicine] = useState(mockMedicinesList[0].name);
  const [retQty, setRetQty] = useState("10");
  const [retRefund, setRetRefund] = useState("4.50");
  const [retReason, setRetReason] = useState("Damaged");

  // Notifications
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleAddPOItem = () => {
    const qty = parseInt(currentItemQty) || 0;
    const cost = parseFloat(currentItemCost) || 0;

    if (qty <= 0 || cost <= 0) {
      showNotification("Please enter valid positive quantity and cost values.", "error");
      return;
    }

    const newItem: POItem = {
      id: `poit-${Date.now()}`,
      medicineName: currentItemName,
      quantity: qty,
      unitCost: cost,
    };

    setPoItems([...poItems, newItem]);
    showNotification(`Added ${currentItemName} to draft purchase order.`);
  };

  const handleRemovePOItem = (id: string) => {
    setPoItems(poItems.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => poItems.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const calculateTotalCost = () => {
    const sub = calculateSubtotal();
    const ship = parseFloat(shippingFee) || 0;
    const tax = sub * ((parseFloat(taxRate) || 0) / 100);
    return parseFloat((sub + ship + tax).toFixed(2));
  };

  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      showNotification("Please add at least one medicine item to the purchase order.", "error");
      return;
    }

    const supplier = mockSuppliers.find((s) => s.id === poSupplierId);
    if (!supplier) return;

    const newPO: PurchaseOrder = {
      id: `PO-2026-${100 + purchaseOrders.length + 1}`,
      supplierId: poSupplierId,
      supplierName: supplier.name,
      date: new Date().toISOString().split("T")[0],
      items: poItems,
      totalCost: calculateTotalCost(),
      status: "Pending",
      shippingFee: parseFloat(shippingFee) || 0,
      taxRate: parseFloat(taxRate) || 15,
    };

    setPurchaseOrders([newPO, ...purchaseOrders]);
    setPoItems([]);
    showNotification(`Purchase Order ${newPO.id} successfully created and sent to supplier.`);
    setActiveSubTab("history");
  };

  // Stock Updates & Receiving
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setReceivingPOId(po.id);
    const initialQtys: Record<string, number> = {};
    po.items.forEach((item) => {
      initialQtys[item.id] = item.quantity; // default to order qty
    });
    setReceivedQtys(initialQtys);
  };

  const handleConfirmReceipt = () => {
    if (!receivingPOId) return;

    setPurchaseOrders(
      purchaseOrders.map((po) => {
        if (po.id === receivingPOId) {
          const updatedItems = po.items.map((it) => ({
            ...it,
            receivedQty: receivedQtys[it.id] || 0,
          }));

          // Side effect representation: "Stock levels successfully updated"
          const totalStockAdded = updatedItems.reduce((sum, item) => sum + (item.receivedQty || 0), 0);
          showNotification(
            `Successfully received goods for ${po.id}. Stock count automatically updated (+${totalStockAdded} packs).`
          );

          return {
            ...po,
            items: updatedItems,
            status: "Received" as const,
            receivedDate: new Date().toISOString().split("T")[0],
          };
        }
        return po;
      })
    );

    setReceivingPOId(null);
  };

  // Supplier Returns
  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(retQty) || 0;
    const ref = parseFloat(retRefund) || 0;

    if (qty <= 0 || ref <= 0) {
      showNotification("Please enter valid quantities and refunds.", "error");
      return;
    }

    const newReturn: SupplierReturn = {
      id: `RET-2026-${returns.length + 1}`,
      supplierName: retSupplierName,
      date: new Date().toISOString().split("T")[0],
      medicineName: retMedicine,
      qty,
      unitRefund: ref,
      reason: retReason,
      status: "Completed",
    };

    setReturns([newReturn, ...returns]);
    setRetQty("");
    setRetRefund("");
    setRetReason("");
    showNotification(`Supplier Return ${newReturn.id} logged. Refund credit notes issued successfully.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 max-w-md ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
            }`}
          >
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <span className="text-sm font-semibold">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ListOrdered className="w-6 h-6" />
            </span>
            Procurement & Purchases
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch purchase orders, check-in incoming goods, handle supplier returns, and trace acquisition costs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2">
        {[
          { id: "create", label: "Create Purchase Order", icon: FilePlus2 },
          { id: "receive", label: "Receiving Goods", icon: Truck },
          { id: "returns", label: "Supplier Returns", icon: RotateCcw },
          { id: "history", label: "Purchase History & Audits", icon: BarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
                activeSubTab === tab.id
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {/* Create PO panel */}
        {activeSubTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Builder */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                Purchase Order Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Select Wholesaler / Supplier
                  </label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    {mockSuppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Shipping ($)
                    </label>
                    <input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      VAT Tax (%)
                    </label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add items section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Medicines & Purchase pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Drug / Medicine Name
                    </label>
                    <select
                      value={currentItemName}
                      onChange={(e) => {
                        setCurrentItemName(e.target.value);
                        const found = mockMedicinesList.find((m) => m.name === e.target.value);
                        if (found) setCurrentItemCost(found.defaultCost.toFixed(2));
                      }}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    >
                      {mockMedicinesList.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Quantity (Packs)
                    </label>
                    <input
                      type="number"
                      value={currentItemQty}
                      onChange={(e) => setCurrentItemQty(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentItemCost}
                      onChange={(e) => setCurrentItemCost(e.target.value)}
                      placeholder="e.g. 3.50"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPOItem}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Procurement Items ({poItems.length})
                </h3>
                {poItems.length > 0 ? (
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {poItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.medicineName}</p>
                          <p className="text-xs text-slate-400">
                            {item.quantity} units @ Rs ${item.unitCost.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Rs ${(item.quantity * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => handleRemovePOItem(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No medicines added to this purchase order yet.
                  </p>
                )}
              </div>
            </div>

            {/* Cost & Profit Margin Analysis */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Order Financial Breakdown
                </h2>

                <div className="space-y-3.5 text-sm font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      Rs ${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping Freight:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      ${(parseFloat(shippingFee) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated VAT Tax ({taxRate}%):</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      Rs ${(calculateSubtotal() * ((parseFloat(taxRate) || 0) / 100)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex justify-between text-base font-black">
                    <span className="text-slate-800 dark:text-slate-200">Total Purchase Cost:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Rs ${calculateTotalCost().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BarChart className="w-4 h-4" /> Cost & Markup Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    By purchasing these stocks wholesale, the estimated store valuation will increase by approx.{" "}
                    <strong className="text-slate-800 dark:text-white">
                      Rs ${(calculateSubtotal() * 1.65).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </strong>{" "}
                    with an average 40% margin model.
                  </p>
                </div>

                <button
                  onClick={handleSavePurchaseOrder}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition"
                >
                  Create & Dispatch Purchase Order <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receiving goods panel */}
        {activeSubTab === "receive" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Goods Consignments
              </h2>
              <p className="text-xs text-slate-400">
                Confirm received product units from dispatched supplier sheets to automatically refresh inventory stock counts.
              </p>
            </div>

            <div className="space-y-4">
              {purchaseOrders.filter((po) => po.status === "Pending").length > 0 ? (
                purchaseOrders
                  .filter((po) => po.status === "Pending")
                  .map((po) => (
                    <div
                      key={po.id}
                      className="p-5 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {po.id}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {po.supplierName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Ordered on {po.date} • {po.items.length} medicines • Total: Rs ${po.totalCost.toLocaleString()}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {po.items.map((it) => (
                            <span
                              key={it.id}
                              className="text-[10px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300"
                            >
                              {it.medicineName} ({it.quantity} packs)
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenReceiveModal(po)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 self-start md:self-center transition"
                      >
                        <Truck className="w-4 h-4" /> Check-in & Receive Goods
                      </button>
                    </div>
                  ))
              ) : (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/80" />
                  <p className="font-semibold">All products fully checked-in!</p>
                  <p className="text-xs mt-1">There are no outstanding purchase deliveries awaiting reception.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supplier returns panel */}
        {activeSubTab === "returns" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-500" /> Log Returns to Vendor
              </h2>

              <form onSubmit={handleSaveReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Wholesaler / Supplier
                  </label>
                  <select
                    value={retSupplierName}
                    onChange={(e) => setRetSupplierName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    {mockSuppliers.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Medicine / Drug
                  </label>
                  <select
                    value={retMedicine}
                    onChange={(e) => setRetMedicine(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    {mockMedicinesList.map((med) => (
                      <option key={med.name} value={med.name}>
                        {med.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Return Qty
                    </label>
                    <input
                      type="number"
                      value={retQty}
                      onChange={(e) => setRetQty(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Refund Per Unit ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={retRefund}
                      onChange={(e) => setRetRefund(e.target.value)}
                      placeholder="e.g. 4.50"
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Return Reason
                  </label>
                  <input
                    type="text"
                    value={retReason}
                    onChange={(e) => setRetReason(e.target.value)}
                    placeholder="e.g. Broken sealed box, wrong drug batch"
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  Log Return Credit Note
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supplier Returns Log
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="py-2">ID</th>
                      <th className="py-2">Supplier</th>
                      <th className="py-2">Medicine</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Total Credit</th>
                      <th className="py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret) => (
                      <tr key={ret.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{ret.id}</td>
                        <td className="py-3 text-slate-500 font-medium">{ret.supplierName}</td>
                        <td className="py-3 text-slate-500">{ret.medicineName}</td>
                        <td className="py-3 text-slate-500 font-bold">{ret.qty} packs</td>
                        <td className="py-3 font-semibold text-emerald-600">
                          Rs ${(ret.qty * ret.unitRefund).toFixed(2)}
                        </td>
                        <td className="py-3 text-slate-400 italic">{ret.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* History & Audits tab */}
        {activeSubTab === "history" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Acquisition History Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Trace all previous supplier procurements, receiving journals, and order invoicing.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-3">PO Code</th>
                    <th className="py-3">Supplier Name</th>
                    <th className="py-3">Order Date</th>
                    <th className="py-3">Total Value</th>
                    <th className="py-3">Fulfillment</th>
                    <th className="py-3">Received On</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                      <td className="py-3.5 font-bold text-slate-700 dark:text-slate-300">{po.id}</td>
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-100">{po.supplierName}</td>
                      <td className="py-3.5 text-slate-500">{po.date}</td>
                      <td className="py-3.5 font-black text-slate-900 dark:text-white">
                        Rs ${po.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            po.status === "Received"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{po.receivedDate || "Awaiting consignment..."}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Receive Good Check-in Modal */}
      <AnimatePresence>
        {receivingPOId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setReceivingPOId(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-500" />
                Goods Consignment Check-in ({receivingPOId})
              </h3>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Verify actual package counts received at the loading dock. Any discrepant or damaged units should be omitted and returned via Return journals.
                </p>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                  {purchaseOrders
                    .find((po) => po.id === receivingPOId)
                    ?.items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.medicineName}</p>
                          <p className="text-xs text-slate-400">Ordered: {item.quantity} packs</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-400">Received:</label>
                          <input
                            type="number"
                            value={receivedQtys[item.id] !== undefined ? receivedQtys[item.id] : item.quantity}
                            onChange={(e) =>
                              setReceivedQtys({
                                ...receivedQtys,
                                [item.id]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 text-center text-sm px-2.5 py-1 border border-slate-200 rounded focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setReceivingPOId(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReceipt}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Finalize Receipt & Add Stock
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline fallback icon for closing modal
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
