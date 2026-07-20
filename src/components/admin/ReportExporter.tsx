"use client";

import React, { useState } from "react";
import { Download, FileText, Table, Printer, Check, AlertCircle } from "lucide-react";

interface Column {
  header: string;
  key: string;
}

interface ReportExporterProps {
  data: any[];
  columns: Column[];
  filename?: string;
  reportTitle?: string;
  reportSubtitle?: string;
}

export default function ReportExporter({
  data,
  columns,
  filename = "report",
  reportTitle = "Prime Pharmacy Report",
  reportSubtitle = `Generated on ${new Date().toLocaleDateString()}`,
}: ReportExporterProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const cleanValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val).replace(/"/g, '""');
  };

  const handleExportCSV = () => {
    setExporting("csv");
    try {
      const headers = columns.map((col) => `"${col.header}"`).join(",");
      const rows = data.map((row) =>
        columns.map((col) => `"${cleanValue(row[col.key])}"`).join(",")
      );
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Export Failed:", err);
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      // Dynamically try to import jspdf
      let jsPDF;
      try {
        const mod = await import("jspdf");
        jsPDF = mod.default || mod.jsPDF;
      } catch (e) {
        console.warn("jsPDF package not found. Falling back to structured print PDF simulation.");
      }

      if (jsPDF) {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        
        // PDF Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(5, 150, 105); // emerald green
        doc.text("PRIME PHARMACY", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(reportTitle, 14, 28);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(reportSubtitle, 14, 34);

        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(14, 38, 196, 38);

        // Draw Table
        let y = 46;
        const colWidth = 182 / columns.length;

        // Table Headers
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(14, y - 5, 182, 7, "F");
        doc.setTextColor(71, 85, 105); // slate-600

        columns.forEach((col, idx) => {
          doc.text(col.header, 16 + idx * colWidth, y);
        });

        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700

        data.forEach((row, rowIdx) => {
          if (y > 270) {
            doc.addPage();
            y = 25;
            // Redraw header for new page
            doc.setFont("helvetica", "bold");
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y - 5, 182, 7, "F");
            columns.forEach((col, idx) => {
              doc.text(col.header, 16 + idx * colWidth, y);
            });
            y += 7;
            doc.setFont("helvetica", "normal");
          }

          // Alternating background
          if (rowIdx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(14, y - 5, 182, 7, "F");
          }

          columns.forEach((col, colIdx) => {
            const val = cleanValue(row[col.key]);
            const truncatedVal = val.length > 25 ? val.substring(0, 22) + "..." : val;
            doc.text(truncatedVal, 16 + colIdx * colWidth, y);
          });
          y += 7;
        });

        doc.save(`${filename}_${Date.now()}.pdf`);
      } else {
        // Fallback: Trigger custom high-quality print styling
        handlePrint();
      }
    } catch (err) {
      console.error("PDF Export Failed:", err);
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const handlePrint = () => {
    setExporting("print");
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to print reports.");
        return;
      }

      const tableHeaders = columns.map((col) => `<th>${col.header}</th>`).join("");
      const tableRows = data
        .map(
          (row, idx) =>
            `<tr class="${idx % 2 === 0 ? "even" : ""}">` +
            columns.map((col) => `<td>${cleanValue(row[col.key])}</td>`).join("") +
            "</tr>"
        )
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; padding: 40px; }
              header { margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
              h1 { color: #059669; font-size: 28px; margin: 0 0 5px 0; }
              h2 { font-size: 18px; color: #1e293b; margin: 0 0 10px 0; }
              .subtitle { font-size: 12px; color: #64748b; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
              th { background-color: #f1f5f9; color: #475569; text-align: left; padding: 10px; font-weight: bold; border-bottom: 1px solid #cbd5e1; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              tr.even { background-color: #f8fafc; }
              footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-t: 1px solid #e2e8f0; padding-top: 20px; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <header>
              <h1>PRIME PHARMACY</h1>
              <h2>${reportTitle}</h2>
              <p class="subtitle">${reportSubtitle}</p>
            </header>
            <table>
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <footer>
              <p>Prime Pharmacy Admin CRM - Confidential Report - Page 1 of 1</p>
            </footer>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print Failed:", err);
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={handleExportCSV}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 transition-all dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-400 dark:hover:bg-emerald-900/40 disabled:opacity-50"
      >
        {exporting === "csv" ? (
          <Check className="w-3.5 h-3.5 animate-bounce" />
        ) : (
          <Table className="w-3.5 h-3.5" />
        )}
        <span>Export Excel / CSV</span>
      </button>

      <button
        onClick={handleExportPDF}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200/50 transition-all dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/40 disabled:opacity-50"
      >
        {exporting === "pdf" ? (
          <Check className="w-3.5 h-3.5 animate-bounce" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        <span>Export PDF Report</span>
      </button>

      <button
        onClick={handlePrint}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 disabled:opacity-50"
      >
        {exporting === "print" ? (
          <Check className="w-3.5 h-3.5 animate-bounce" />
        ) : (
          <Printer className="w-3.5 h-3.5" />
        )}
        <span>Print Document</span>
      </button>
    </div>
  );
}
