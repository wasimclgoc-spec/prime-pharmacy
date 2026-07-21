"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  Package,
  DollarSign,
  FileText,
  CreditCard,
  CornerUpLeft,
  Calculator,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  products: string[];
  outstandingBalance: number;
  status: "Active" | "Inactive";
}

interface PurchaseOrder {
  id: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  status: "Draft" | "Pending" | "Completed" | "Cancelled";
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  paidAmount: number;
  status: "Paid" | "Partially Paid" | "Unpaid";
}

interface ReturnRecord {
  id: string;
  date: string;
  item: string;
  qty: number;
  refundAmount: number;
  status: "Pending" | "Refunded" | "Rejected";
}

// Mock initial data
const initialSuppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "AstraZeneca Distribution Ltd",
    contactPerson: "Dr. Sarah Jenkins",
    phone: "+1 (555) 019-2834",
    email: "s.jenkins@astrazeneca-dist.com",
    products: ["Nexium", "Crestor", "Symbicort"],
    outstandingBalance: 12450.0,
    status: "Active",
  },
  {
    id: "SUP-002",
    name: "Pfizer Wholesale Global",
    contactPerson: "Michael Chang",
    phone: "+1 (555) 014-9982",
    email: "m.chang@pfizer-wholesale.com",
    products: ["Lipitor", "Lyrica", "Viagra", "Zoloft"],
    outstandingBalance: 8720.5,
    status: "Active",
  },
  {
    id: "SUP-003",
    name: "Novartis Pharma Supply",
    contactPerson: "Elena Rostova",
    phone: "+1 (555) 018-7721",
    email: "e.rostova@novartis-supply.org",
    products: ["Diovan", "Gleevec", "Entresto"],
    outstandingBalance: 0.0,
    status: "Active",
  },
  {
    id: "SUP-004",
    name: "GlaxoSmithKline Logistics",
    contactPerson: "David Smith",
    phone: "+1 (555) 012-3456",
    email: "d.smith@gsk-logistics.net",
    products: ["Advair", "Ventolin", "Amoxil"],
    outstandingBalance: 15400.25,
    status: "Active",
  },
  {
    id: "SUP-005",
    name: "Sandoz Generics Inc",
    contactPerson: "Patricia Neil",
    phone: "+1 (555) 016-4433",
    email: "p.neil@sandoz-generic.com",
    products: ["Amoxicillin", "Lisinopril", "Metformin"],
    outstandingBalance: -1200.0, // Credit credit note
    status: "Inactive",
  },
];

const mockOrders: Record<string, PurchaseOrder[]> = {
  "SUP-001": [
    { id: "PO-2026-001", date: "2026-07-15", itemsCount: 4, totalAmount: 8500.0, status: "Completed" },
    { id: "PO-2026-012", date: "2026-07-19", itemsCount: 2, totalAmount: 3950.0, status: "Pending" },
  ],
  "SUP-002": [
    { id: "PO-2026-003", date: "2026-06-28", itemsCount: 8, totalAmount: 14200.0, status: "Completed" },
    { id: "PO-2026-009", date: "2026-07-10", itemsCount: 3, totalAmount: 4520.5, status: "Completed" },
  ],
};

const mockInvoices: Record<string, Invoice[]> = {
  "SUP-001": [
    { id: "INV-AZ-991", date: "2026-07-15", amount: 8500.0, paidAmount: 0.0, status: "Unpaid" },
    { id: "INV-AZ-982", date: "2026-07-19", amount: 3950.0, paidAmount: 0.0, status: "Unpaid" },
  ],
  "SUP-002": [
    { id: "INV-PF-112", date: "2026-06-28", amount: 14200.0, paidAmount: 14200.0, status: "Paid" },
    { id: "INV-PF-231", date: "2026-07-10", amount: 4520.5, paidAmount: 2000.0, status: "Partially Paid" },
    { id: "INV-PF-250", date: "2026-07-18", amount: 6200.0, paidAmount: 0.0, status: "Unpaid" },
  ],
};

const mockReturns: Record<string, ReturnRecord[]> = {
  "SUP-001": [
    { id: "RET-001", date: "2026-07-16", item: "Nexium 40mg (Damaged)", qty: 20, refundAmount: 400.0, status: "Refunded" },
  ],
  "SUP-002": [
    { id: "RET-002", date: "2026-07-12", item: "Zoloft 50mg (Wrong batch)", qty: 10, refundAmount: 250.0, status: "Pending" },
  ],
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("SUP-001");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "invoices" | "returns" | "calculator">("orders");

  // Supplier modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  // Balance calculator state
  const [calcInvoiceAmount, setCalcInvoiceAmount] = useState<string>("");
  const [calcPaidAmount, setCalcPaidAmount] = useState<string>("");
  const [calcReturnAmount, setCalcReturnAmount] = useState<string>("");

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingSupplier({
      id: `SUP-00${suppliers.length + 1}`,
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      products: [],
      outstandingBalance: 0,
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setModalMode("edit");
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      if (selectedSupplierId === id && updated.length > 0) {
        setSelectedSupplierId(updated[0].id);
      }
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name) return;

    if (modalMode === "add") {
      setSuppliers([...suppliers, editingSupplier as Supplier]);
    } else {
      setSuppliers(
        suppliers.map((s) => (s.id === editingSupplier.id ? (editingSupplier as Supplier) : s))
      );
    }
    setIsModalOpen(false);
  };

  const handleCalculateBalance = () => {
    const inv = parseFloat(calcInvoiceAmount) || 0;
    const paid = parseFloat(calcPaidAmount) || 0;
    const ret = parseFloat(calcReturnAmount) || 0;

    // Outstanding = current + new invoices - payments - return refunds
    const adjustment = inv - paid - ret;
    
    setSuppliers(
      suppliers.map((s) => {
        if (s.id === selectedSupplierId) {
          return {
            ...s,
            outstandingBalance: parseFloat((s.outstandingBalance + adjustment).toFixed(2)),
          };
        }
        return s;
      })
    );

    // Reset fields
    setCalcInvoiceAmount("");
    setCalcPaidAmount("");
    setCalcReturnAmount("");
    alert("Outstanding balance adjusted successfully based on calculation!");
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.products.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Package className="w-6 h-6" />
            </span>
            Supplier Directory & Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage drug manufacturers, wholesale vendors, procurement streams, and accounting.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Supplier List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col h-[650px]">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers, contact, or drugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200/80 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-850 dark:border-slate-800 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplierId(supplier.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  selectedSupplierId === supplier.id
                    ? "bg-emerald-50/30 border-emerald-500/50 dark:bg-emerald-950/10 dark:border-emerald-600/50 shadow-sm"
                    : "bg-white border-slate-150 hover:bg-slate-50/50 dark:bg-slate-900 dark:border-slate-800/80 dark:hover:bg-slate-850"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                      {supplier.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <User className="w-3 h-3 text-emerald-500" /> {supplier.contactPerson}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      supplier.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {supplier.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {supplier.products.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Outstanding Balance</span>
                    <span
                      className={`font-bold text-sm ${
                        supplier.outstandingBalance > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      ${supplier.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditModal(supplier)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 transition"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Account Details, Purchases, Invoices, Returns & Calculator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Supplier Profile Summary */}
          {selectedSupplier && (
            <motion.div
              layoutId="supplier-profile"
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-1 rounded">
                    {selectedSupplier.id}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
                    {selectedSupplier.name}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Due Account</span>
                  <span
                    className={`text-2xl font-black ${
                      selectedSupplier.outstandingBalance > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    ${selectedSupplier.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <User className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">Contact:</span> {selectedSupplier.contactPerson}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">Phone:</span> {selectedSupplier.phone}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">Email:</span> {selectedSupplier.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">Key Products:</span> {selectedSupplier.products.join(", ")}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-150 dark:border-slate-800">
                <div className="flex gap-4">
                  {(["orders", "invoices", "returns", "calculator"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-bold capitalize relative ${
                        activeTab === tab
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab === "orders" && "Purchase Orders"}
                      {tab === "invoices" && "Invoices & Payments"}
                      {tab === "returns" && "Returns Tracking"}
                      {tab === "calculator" && "Balance Adjuster"}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[220px]">
                {activeTab === "orders" && (
                  <div className="space-y-3">
                    {mockOrders[selectedSupplier.id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                              <th className="py-2">Order ID</th>
                              <th className="py-2">Date</th>
                              <th className="py-2">Medicines</th>
                              <th className="py-2">Total Amount</th>
                              <th className="py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockOrders[selectedSupplier.id].map((po) => (
                              <tr key={po.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{po.id}</td>
                                <td className="py-3 text-slate-500">{po.date}</td>
                                <td className="py-3 text-slate-500">{po.itemsCount} items</td>
                                <td className="py-3 font-semibold">Rs ${po.totalAmount.toLocaleString()}</td>
                                <td className="py-3 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                      po.status === "Completed"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    }`}
                                  >
                                    {po.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        No purchase orders found for this supplier.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "invoices" && (
                  <div className="space-y-3">
                    {mockInvoices[selectedSupplier.id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                              <th className="py-2">Invoice ID</th>
                              <th className="py-2">Date</th>
                              <th className="py-2">Amount</th>
                              <th className="py-2">Paid</th>
                              <th className="py-2">Due</th>
                              <th className="py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockInvoices[selectedSupplier.id].map((inv) => (
                              <tr key={inv.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{inv.id}</td>
                                <td className="py-3 text-slate-500">{inv.date}</td>
                                <td className="py-3 font-semibold">Rs ${inv.amount.toLocaleString()}</td>
                                <td className="py-3 text-emerald-600 font-medium">Rs ${inv.paidAmount.toLocaleString()}</td>
                                <td className="py-3 text-red-600 font-semibold">Rs ${(inv.amount - inv.paidAmount).toLocaleString()}</td>
                                <td className="py-3 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                      inv.status === "Paid"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : inv.status === "Partially Paid"
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        No invoice data available.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "returns" && (
                  <div className="space-y-3">
                    {mockReturns[selectedSupplier.id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                              <th className="py-2">Return ID</th>
                              <th className="py-2">Date</th>
                              <th className="py-2">Medicine (Reason)</th>
                              <th className="py-2">Qty</th>
                              <th className="py-2">Refund</th>
                              <th className="py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockReturns[selectedSupplier.id].map((ret) => (
                              <tr key={ret.id} className="border-b border-slate-100/50 dark:border-slate-800/50">
                                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{ret.id}</td>
                                <td className="py-3 text-slate-500">{ret.date}</td>
                                <td className="py-3 text-slate-600 dark:text-slate-300">{ret.item}</td>
                                <td className="py-3 font-medium">{ret.qty} units</td>
                                <td className="py-3 font-semibold text-emerald-600">Rs ${ret.refundAmount}</td>
                                <td className="py-3 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                      ret.status === "Refunded"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    }`}
                                  >
                                    {ret.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <CornerUpLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        No supplier returns logged.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "calculator" && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Outstanding Balance Adjuster
                      </h4>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      Enter invoice, payment, or credit returns to automatically recalculate and reconcile this supplier's outstanding ledger balance.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          New Invoice (+)
                        </label>
                        <input
                          type="number"
                          placeholder="$ 0.00"
                          value={calcInvoiceAmount}
                          onChange={(e) => setCalcInvoiceAmount(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Payment Made (-)
                        </label>
                        <input
                          type="number"
                          placeholder="$ 0.00"
                          value={calcPaidAmount}
                          onChange={(e) => setCalcPaidAmount(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          Return Credit (-)
                        </label>
                        <input
                          type="number"
                          placeholder="$ 0.00"
                          value={calcReturnAmount}
                          onChange={(e) => setCalcReturnAmount(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleCalculateBalance}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                      >
                        Commit Account Reconcile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && editingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 max-w-lg w-full p-6 relative overflow-hidden"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <span className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
                  <User className="w-5 h-5" />
                </span>
                {modalMode === "add" ? "Register New Supplier" : "Edit Supplier Details"}
              </h3>

              <form onSubmit={handleSaveSupplier} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Supplier / Manufacturer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.name || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      required
                      value={editingSupplier.contactPerson || ""}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editingSupplier.phone || ""}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editingSupplier.email || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Products (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nexium, Crestor"
                      value={editingSupplier.products?.join(", ") || ""}
                      onChange={(e) =>
                        setEditingSupplier({
                          ...editingSupplier,
                          products: e.target.value.split(",").map((p) => p.trim()),
                        })
                      }
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={editingSupplier.status || "Active"}
                      onChange={(e) =>
                        setEditingSupplier({
                          ...editingSupplier,
                          status: e.target.value as "Active" | "Inactive",
                        })
                      }
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                  >
                    Save Supplier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
