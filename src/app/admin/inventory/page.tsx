"use client";

import React, { useState, useMemo } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { Medicine } from "@/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { 
  Plus, Upload, Download, Camera, AlertTriangle, Trash2, Edit3, 
  Eye, RefreshCw, X, ShieldAlert, Check, CheckSquare
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminInventoryPage() {
  const { 
    medicines, suppliers, addMedicine, updateMedicine, deleteMedicine, bulkImportMedicines
  } = useAdminStore();

  // State
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [expiryFilter, setExpiryFilter] = useState("All");

  // Form Fields State
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    sku: "",
    category: "Antibiotics",
    brand: "",
    generic: "",
    batch: "",
    expiry: "",
    cost: 0,
    price: 0,
    stock: 0,
    minStock: 10,
    storageLocation: "",
    supplierId: "sup-1",
    prescriptionRequired: false,
    tax: 5,
    discount: 0,
  });

  const [csvPaste, setCsvPaste] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  const categories = ["Antibiotics", "Analgesics", "Cardiovascular", "Antidiabetics", "Antihistamines", "Respiratory", "Dermatology", "Vitamins"];

  // 1. Process Filters
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      // Category Filter
      const catMatch = categoryFilter === "All" || m.category === categoryFilter;

      // Stock Filter
      let stockMatch = true;
      if (stockFilter === "Low Stock") {
        stockMatch = m.stock <= m.minStock && m.stock > 0;
      } else if (stockFilter === "Out of Stock") {
        stockMatch = m.stock === 0;
      } else if (stockFilter === "In Stock") {
        stockMatch = m.stock > m.minStock;
      }

      // Expiry Filter
      let expiryMatch = true;
      const now = new Date();
      const nearExpiryThreshold = new Date();
      nearExpiryThreshold.setMonth(nearExpiryThreshold.getMonth() + 2); // 2 months
      
      const expDate = new Date(m.expiry);

      if (expiryFilter === "Expired") {
        expiryMatch = expDate < now;
      } else if (expiryFilter === "Near Expiry") {
        expiryMatch = expDate >= now && expDate <= nearExpiryThreshold;
      } else if (expiryFilter === "Safe") {
        expiryMatch = expDate > nearExpiryThreshold;
      }

      return catMatch && stockMatch && expiryMatch;
    });
  }, [medicines, categoryFilter, stockFilter, expiryFilter]);

  // 2. Setup Form for Add/Edit
  const handleOpenAdd = () => {
    setSelectedMedicine(null);
    setFormData({
      name: "",
      barcode: `BAR-${Math.floor(10000000 + Math.random() * 90000000)}`,
      sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
      category: "Antibiotics",
      brand: "",
      generic: "",
      batch: `B-BAT${Math.floor(1000 + Math.random() * 9000)}`,
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      cost: 5.0,
      price: 15.0,
      stock: 50,
      minStock: 15,
      storageLocation: "Shelf A-1",
      supplierId: "sup-1",
      prescriptionRequired: false,
      tax: 5,
      discount: 0,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setSelectedMedicine(med);
    setFormData({
      name: med.name,
      barcode: med.barcode,
      sku: med.sku,
      category: med.category,
      brand: med.brand,
      generic: med.generic,
      batch: med.batch,
      expiry: med.expiry,
      cost: med.cost,
      price: med.price,
      stock: med.stock,
      minStock: med.minStock,
      storageLocation: med.storageLocation,
      supplierId: med.supplierId,
      prescriptionRequired: med.prescriptionRequired,
      tax: med.tax,
      discount: med.discount,
    });
    setIsFormModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMedicine) {
      updateMedicine(selectedMedicine.id, formData);
    } else {
      addMedicine(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleOpenDelete = (med: Medicine) => {
    setSelectedMedicine(med);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedMedicine) {
      deleteMedicine(selectedMedicine.id);
      setIsDeleteOpen(false);
      setSelectedMedicine(null);
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = "id,name,barcode,sku,category,brand,generic,batch,expiry,cost,price,stock,minStock,storageLocation,supplierId,prescriptionRequired,tax,discount\n";
    const csvContent = medicines.map((m) => 
      `"${m.id}","${m.name}","${m.barcode}","${m.sku}","${m.category}","${m.brand}","${m.generic}","${m.batch}","${m.expiry}",${m.cost},${m.price},${m.stock},${m.minStock},"${m.storageLocation}","${m.supplierId}",${m.prescriptionRequired},${m.tax},${m.discount}`
    ).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prime_pharmacy_inventory_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Import Submit
  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCsvError("");
    setCsvSuccess("");

    const result = bulkImportMedicines(csvPaste);
    if (result.success) {
      setCsvSuccess(`Successfully loaded ${result.count} medicine files into the system store!`);
      setCsvPaste("");
      setTimeout(() => setIsBulkOpen(false), 2000);
    } else {
      setCsvError(result.error || "Failed to parse CSV. Check formatting.");
    }
  };

  // Barcode Scanner Simulator
  const handleScanSimulation = (barcodeInput: string) => {
    const foundMed = medicines.find(m => m.barcode === barcodeInput);
    setScannedResult(barcodeInput);
    if (foundMed) {
      setTimeout(() => {
        setIsBarcodeScannerOpen(false);
        handleOpenEdit(foundMed);
        setScannedResult(null);
      }, 1500);
    } else {
      // Error
    }
  };

  // Table Columns Definition
  const columns: Column<Medicine>[] = [
    {
      header: "Medicine Detail",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center space-x-3.5">
          <img 
            src={row.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100"} 
            alt={row.name} 
            className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
          />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.name}</p>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
              {row.generic}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "SKU / Barcode",
      accessorKey: "sku",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold block">{row.sku}</span>
          <span className="text-[10px] text-slate-400">{row.barcode}</span>
        </div>
      )
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg">
          {row.category}
        </span>
      )
    },
    {
      header: "Batch / Expiry",
      accessorKey: "expiry",
      sortable: true,
      cell: (row) => {
        const now = new Date();
        const nearExpiryThreshold = new Date();
        nearExpiryThreshold.setMonth(nearExpiryThreshold.getMonth() + 2);

        const expDate = new Date(row.expiry);
        const isExpired = expDate < now;
        const isNear = expDate >= now && expDate <= nearExpiryThreshold;

        return (
          <div>
            <span className="text-slate-400 text-xs block font-medium">Batch: {row.batch}</span>
            <span className={`text-xs font-bold ${
              isExpired ? "text-red-600 dark:text-red-400 font-extrabold" :
              isNear ? "text-amber-600 dark:text-amber-400" :
              "text-slate-600 dark:text-slate-300"
            }`}>
              {row.expiry} {isExpired && "(Expired)"} {isNear && "(Near)"}
            </span>
          </div>
        );
      }
    },
    {
      header: "Financials",
      accessorKey: "price",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="text-slate-700 dark:text-slate-200 font-bold block">Rs ${row.price.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Cost: Rs ${row.cost.toFixed(2)}</span>
        </div>
      )
    },
    {
      header: "Stock Level",
      accessorKey: "stock",
      sortable: true,
      cell: (row) => {
        const isLow = row.stock <= row.minStock && row.stock > 0;
        const isOut = row.stock === 0;

        return (
          <div>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
              isOut ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400" :
              isLow ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
              "bg-green-100 text-green-850 dark:bg-green-950/20 dark:text-green-400"
            }`}>
              {row.stock} Units
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
              Min: {row.minStock} Units
            </span>
          </div>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => {
        const isRx = row.prescriptionRequired;
        return (
          <div className="space-y-1">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              row.status === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450" :
              row.status === "Discontinued" ? "bg-slate-100 text-slate-600 dark:bg-slate-850" :
              "bg-red-50 text-red-700"
            }`}>
              {row.status}
            </span>
            {isRx && (
              <span className="block text-[9px] text-rose-600 font-bold tracking-wide uppercase">
                Rx Required
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"
            title="Edit Medicine Record"
          >
            <Edit3 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            title="Delete Medicine Record"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-50">
            Medicine Inventory
          </h1>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Browse, search, sort, scan barcodes, and manage chemical compounds in stock.
          </p>
        </div>
        
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-slate-650 dark:text-slate-300 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Camera className="w-4.5 h-4.5 text-emerald-500" />
            <span>Scan Barcode</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-slate-650 dark:text-slate-300 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Upload className="w-4.5 h-4.5" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-slate-650 dark:text-slate-300 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Download className="w-4.5 h-4.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/10 transition-colors"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Interactive Inventory History Log summary banner */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 dark:border-emerald-500/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Stock Warning Protocol
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
              The system automatically flags medicines with stock levels below their minimum thresholds.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <span className="px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
            Low Stock Medicines: {medicines.filter(m => m.stock <= m.minStock).length}
          </span>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg">
            Near Expiry: {medicines.filter(m => {
              const diff = new Date(m.expiry).getTime() - Date.now();
              return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
            }).length}
          </span>
        </div>
      </div>

      {/* Filters Slot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">
              Drug Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">Healthy Stock (&gt; Min)</option>
              <option value="Low Stock">Low Stock (≤ Min)</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Expiry status filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">
              Expiry Warning Status
            </label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="All">All Expiries</option>
              <option value="Safe">Safe Expiry (&gt; 2 months)</option>
              <option value="Near Expiry">Near Expiry (&lt; 2 months)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Central Table */}
      <DataTable 
        data={filteredMedicines} 
        columns={columns} 
        searchPlaceholder="Search by name, SKU, generic formula, barcode..."
        searchKeys={["name", "sku", "barcode", "generic"]}
        pageSize={10}
      />

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedMedicine ? `Edit Medicine Record: ${selectedMedicine.name}` : "Add New Medicine File"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Medicine Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Amoxicillin 500mg"
              />
            </div>

            {/* Generic Formula */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Generic Name / Formula
              </label>
              <input
                type="text"
                required
                value={formData.generic}
                onChange={(e) => setFormData({ ...formData, generic: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Amoxicillin"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                SKU Stock Keeping Unit
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="AMX-500"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Barcode Number
              </label>
              <input
                type="text"
                required
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="8901234567"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="GlaxoSmithKline"
              />
            </div>

            {/* Batch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Batch Code
              </label>
              <input
                type="text"
                required
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="B-AMX4012"
              />
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Expiry Date
              </label>
              <input
                type="date"
                required
                value={formData.expiry}
                onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Cost price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Retail price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Retail Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Stock count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Initial Stock Level
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Min Stock threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Minimum Stock Threshold
              </label>
              <input
                type="number"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Storage Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Storage Location / Drawer
              </label>
              <input
                type="text"
                required
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Shelf A-3"
              />
            </div>

            {/* Supplier select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Assigned Supplier Wholesaler
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Discount and tax */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseInt(e.target.value, 10) || 5 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Prescription Checkbox */}
            <div className="md:col-span-2 flex items-center space-x-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
              <input
                type="checkbox"
                id="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 bg-white"
              />
              <label htmlFor="prescriptionRequired" className="select-none cursor-pointer">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Prescription Only Drug (Rx Barrier Check)
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">
                  Customers must upload a licensed medical prescription to request this medicine via the AI Assistant.
                </span>
              </label>
            </div>

          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/10 transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Record Deletion"
        size="sm"
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 mb-2">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">
              Are you sure you want to delete this medicine?
            </h4>
            <p className="text-xs text-slate-450 dark:text-slate-450 mt-1.5 leading-relaxed font-semibold">
              This will permanently delete the chemical file for <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedMedicine?.name}</span> from inventory. This action cannot be reversed.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-500 transition-colors"
            >
              No, Retain
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4.5 py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/10 transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import Medicines (CSV Portal)"
        size="lg"
      >
        <form onSubmit={handleBulkImportSubmit} className="space-y-5">
          {csvError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 text-xs font-bold">
              {csvError}
            </div>
          )}
          {csvSuccess && (
            <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900 text-xs font-bold">
              {csvSuccess}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider block">
              Paste CSV Data (with Headers)
            </label>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
              CSV Headers must include at least: <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-rose-500 font-bold">name, barcode, sku, category, brand, generic, batch, expiry, cost, price, stock, minstock</code>.
            </p>
            <textarea
              required
              rows={8}
              value={csvPaste}
              onChange={(e) => setCsvPaste(e.target.value)}
              placeholder="name,barcode,sku,category,brand,generic,batch,expiry,cost,price,stock,minstock&#10;Lipitor Extra,8901234567401,LIP-EX,Cardiovascular,Lipitor,Atorvastatin,B-EX98,2027-11-20,15.5,35.0,200,15"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-colors"
            >
              Parse & Load CSV
            </button>
          </div>
        </form>
      </Modal>

      {/* Barcode Scanner simulator modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        title="Optical Barcode Scanner Simulator"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-semibold text-center">
            Simulate scanning a pharmaceutical package barcode with the camera feed. Click a quick preset code below to auto-resolve the drug card.
          </p>

          {/* Simulated Scanner viewfinder view */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-850">
            {/* Camera flash / scanning overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-emerald-500/60 shadow-lg shadow-emerald-500/30 -translate-y-1/2 animate-bounce" />

            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 z-10">
              <Camera className="w-8 h-8 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {scannedResult ? `Decoding: ${scannedResult}` : "Resolving optical feed..."}
              </span>
            </div>
          </div>

          {/* Quick presets list for simulation testing */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase block text-center">
              Quick Barcode Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleScanSimulation("8901234567000")}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 transition-all text-center"
              >
                Amoxil (8901234567000)
              </button>
              <button
                onClick={() => handleScanSimulation("8901234567001")}
                className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 transition-all text-center"
              >
                Panadol (8901234567001)
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
