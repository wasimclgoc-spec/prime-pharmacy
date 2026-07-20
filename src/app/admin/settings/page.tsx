"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Users,
  Building,
  DollarSign,
  Clock,
  Shield,
  BellRing,
  Trash2,
  Plus,
  Lock,
  Cpu,
  Bookmark,
  CheckCircle2,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  role: "Admin" | "Pharmacist" | "Manager" | "Inventory Staff" | "Delivery Staff" | "Cashier";
  email: string;
}

interface AuditLog {
  timestamp: string;
  user: string;
  event: string;
  severity: "info" | "warning" | "critical";
}

const initialStaff: StaffMember[] = [
  { id: "S-01", name: "Dr. Jonathan Crane", role: "Pharmacist", email: "j.crane@prime-pharmacy.com" },
  { id: "S-02", name: "Mary Jane Watson", role: "Manager", email: "m.jane@prime-pharmacy.com" },
  { id: "S-03", name: "Bruce Wayne", role: "Admin", email: "b.wayne@prime-pharmacy.com" },
  { id: "S-04", name: "Peter Parker", role: "Delivery Staff", email: "p.parker@prime-pharmacy.com" },
];

const initialAuditLogs: AuditLog[] = [
  { timestamp: "2026-07-20 14:15", user: "Bruce Wayne", event: "Approved Purchase Order PO-2026-101", severity: "info" },
  { timestamp: "2026-07-20 13:42", user: "Mary Jane Watson", event: "Changed VAT rate configuration to 15%", severity: "warning" },
  { timestamp: "2026-07-19 10:02", user: "Dr. Jonathan Crane", event: "Quarantined expired batch B-9102", severity: "critical" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "staff" | "finance" | "operating" | "security" | "audits">("profile");

  // Profile Form
  const [pharmacyName, setPharmacyName] = useState("Prime Pharmacy Headquarter");
  const [pharmacyEmail, setPharmacyEmail] = useState("ops@prime-pharmacy.com");
  const [pharmacyPhone, setPharmacyPhone] = useState("+1 (555) 019-1000");
  const [pharmacyAddress, setPharmacyAddress] = useState("450 Health Avenue, Sector 5, Medical City");
  const [pharmacyLicense, setPharmacyLicense] = useState("LIC-PHARM-2026-X1109");

  // Staff Form
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<StaffMember["role"]>("Pharmacist");
  const [newStaffEmail, setNewStaffEmail] = useState("");

  // Finance
  const [vatRate, setVatRate] = useState("15");
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [currency, setCurrency] = useState("PKR (Rs)");
  const [deliveryZoneA, setDeliveryZoneA] = useState("5.00");
  const [deliveryZoneB, setDeliveryZoneB] = useState("10.00");

  // Operating & AI
  const [openHour, setOpenHour] = useState("08:00");
  const [closeHour, setOpenClose] = useState("22:00");
  const [aiConfidence, setAiConfidence] = useState("85");
  const [aiAutoApprove, setAiAutoApprove] = useState("70");

  // Security
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30"); // mins

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newStaff: StaffMember = {
      id: `S-0${staffList.length + 1}`,
      name: newStaffName,
      role: newStaffRole,
      email: newStaffEmail,
    };

    setStaffList([...staffList, newStaff]);
    setNewStaffName("");
    setNewStaffEmail("");

    // Log to audits
    const newLog: AuditLog = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      user: "Current Admin",
      event: `Registered new staff member: ${newStaffName} (${newStaffRole})`,
      severity: "info",
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleRemoveStaff = (id: string) => {
    const staff = staffList.find((s) => s.id === id);
    if (!staff) return;

    if (confirm(`Remove ${staff.name} from pharmacy staff?`)) {
      setStaffList(staffList.filter((s) => s.id !== id));

      // Log to audits
      const newLog: AuditLog = {
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        user: "Current Admin",
        event: `Revoked clearance and removed staff member: ${staff.name}`,
        severity: "warning",
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleSaveSettings = () => {
    alert("System settings saved successfully!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-6 h-6" />
            </span>
            System Configurations & Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reconfigure store profile coordinates, assign staff access tokens, fine-tune taxes, and inspect audit logs.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition"
        >
          Save All System Configs
        </button>
      </div>

      {/* Settings layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-1">
          {[
            { id: "profile", label: "Pharmacy Profile", icon: Building },
            { id: "staff", label: "Staff Directory Access", icon: Users },
            { id: "finance", label: "Taxes & Delivery Zones", icon: DollarSign },
            { id: "operating", label: "Operating & AI Config", icon: Clock },
            { id: "security", label: "Security & Alerts", icon: Shield },
            { id: "audits", label: "System Audit Logs", icon: Lock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold rounded-lg transition ${
                  activeTab === item.id
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Panel Area */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 min-h-[500px]">
          {activeTab === "profile" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <Building className="w-5 h-5 text-emerald-500" /> Pharmacy Business Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Pharmacy Name</label>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Commercial License Key</label>
                  <input
                    type="text"
                    value={pharmacyLicense}
                    onChange={(e) => setPharmacyLicense(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Support Email</label>
                  <input
                    type="email"
                    value={pharmacyEmail}
                    onChange={(e) => setPharmacyEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Operations Phone</label>
                  <input
                    type="text"
                    value={pharmacyPhone}
                    onChange={(e) => setPharmacyPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Store Facility Address</label>
                  <input
                    type="text"
                    value={pharmacyAddress}
                    onChange={(e) => setPharmacyAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <Users className="w-5 h-5 text-emerald-500" /> Authorized Staff Access Directory
              </h2>

              {/* Add staff form inline */}
              <form onSubmit={handleAddStaff} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Register New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Member Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. j.doe@prime.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role / Clearance</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Manager">Manager</option>
                      <option value="Inventory Staff">Inventory Staff</option>
                      <option value="Delivery Staff">Delivery Staff</option>
                      <option value="Cashier">Cashier</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Staff
                    </button>
                  </div>
                </div>
              </form>

              {/* Roster list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Staff List ({staffList.length})</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  {staffList.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                          {member.id}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{member.name}</p>
                          <p className="text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">
                          {member.role}
                        </span>
                        <button
                          onClick={() => handleRemoveStaff(member.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "finance" && (
            <div className="space-y-6 text-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Financial Settings & Logistics Zones
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Standard Store VAT Rate (%)</label>
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Tax Inclusions</label>
                  <select
                    value={taxInclusive ? "inclusive" : "exclusive"}
                    onChange={(e) => setTaxInclusive(e.target.value === "inclusive")}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="inclusive">Tax Inclusive pricing</option>
                    <option value="exclusive">Tax Exclusive pricing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Base System Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="PKR (Rs)">PKR (Rs) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - Sterling</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Zones Fees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1.5">Inner City Zone A Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryZoneA}
                      onChange={(e) => setDeliveryZoneA(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1.5">Outer City Zone B Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryZoneB}
                      onChange={(e) => setDeliveryZoneB(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "operating" && (
            <div className="space-y-6 text-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <Clock className="w-5 h-5 text-emerald-500" /> Operating Standards & AI Confidences
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Pharmacy Opening Time</label>
                  <input
                    type="time"
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Pharmacy Closing Time</label>
                  <input
                    type="time"
                    value={closeHour}
                    onChange={(e) => setOpenClose(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-500" /> AI Prophet Autopilot Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1.5">Confidence Threshold ({aiConfidence}%)</label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={aiConfidence}
                      onChange={(e) => setAiConfidence(e.target.value)}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      Minimum math probability for companion medicine pairing recommendations.
                    </span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1.5">Auto-Approve Reorder Trigger ({aiAutoApprove}%)</label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={aiAutoApprove}
                      onChange={(e) => setAiAutoApprove(e.target.value)}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      Automatically submit PO drafts if the model's confidence exceeds this index.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 text-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <Shield className="w-5 h-5 text-emerald-500" /> Security Access Rules & Alerts
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <div>
                    <strong className="text-xs text-slate-700 dark:text-slate-300 block font-bold">Two-Factor Authenticator (2FA)</strong>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Force OTP challenges upon clinical staff logins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={() => setTwoFactor(!twoFactor)}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <strong className="text-xs text-slate-700 dark:text-slate-300 block font-bold">Admin Session Timeout (Mins)</strong>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Disconnect idle panels automatically</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audits" && (
            <div className="space-y-5 text-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-emerald-500" /> System Audit Trail logs
              </h2>

              <p className="text-slate-400">
                A chronological ledger tracing all high-level data writes and security shifts. (Read-only security log)
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-lg flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">{log.timestamp}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{log.event}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Triggered by: {log.user}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                        log.severity === "info"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.severity === "warning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
