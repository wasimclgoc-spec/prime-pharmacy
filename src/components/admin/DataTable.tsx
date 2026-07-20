"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronDown, ChevronUp, ChevronsUpDown, Search, 
  ChevronLeft, ChevronRight, SlidersHorizontal, CheckSquare, Square
} from "lucide-react";
import { clsx } from "clsx";

export interface Column<T> {
  header: string;
  accessorKey?: string; // string path, e.g. "name" or "price"
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[]; // keys to search in, e.g. ["name", "sku", "barcode"]
  filterNode?: React.ReactNode;
  defaultSort?: { key: string; order: "asc" | "desc" };
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  filterNode,
  defaultSort,
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" } | null>(
    defaultSort || null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((c) => c.header)
  );
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // 1. Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm || searchKeys.length === 0) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      return searchKeys.some((key) => {
        const value = row[key];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Safe conversions
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortConfig.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  const handleSort = (key: string) => {
    let order: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
  };

  const toggleColumn = (header: string) => {
    if (visibleColumns.includes(header)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((col) => col !== header));
      }
    } else {
      setVisibleColumns([...visibleColumns, header]);
    }
  };

  const filteredColumns = columns.filter((col) => visibleColumns.includes(col.header));

  return (
    <div className="space-y-4">
      {/* Table Controls (Search, Filters, Column Selector) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        {searchKeys.length > 0 && (
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Filters slot + Column Visibility */}
        <div className="flex flex-wrap items-center gap-3">
          {filterNode}

          {/* Column Toggle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm text-slate-600 dark:text-slate-300 flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Columns</span>
            </button>

            {showColumnDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColumnDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl z-20 p-2">
                  <div className="text-xs font-semibold px-3 py-1.5 text-slate-400 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 mb-1">
                    Toggle Columns
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {columns.map((col) => {
                      const isVisible = visibleColumns.includes(col.header);
                      return (
                        <button
                          key={col.header}
                          onClick={() => toggleColumn(col.header)}
                          className="w-full text-left px-3 py-1.5 text-sm flex items-center space-x-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {isVisible ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                          <span>{col.header}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="w-full overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              {filteredColumns.map((col, idx) => (
                <th
                  key={idx}
                  className={clsx(
                    "px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider select-none",
                    col.sortable && col.accessorKey && "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  onClick={() => {
                    if (col.sortable && col.accessorKey) {
                      handleSort(col.accessorKey);
                    }
                  }}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && col.accessorKey && (
                      <span>
                        {sortConfig?.key === col.accessorKey ? (
                          sortConfig.order === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    "transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/25",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {filteredColumns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String((row as any)[col.accessorKey] ?? "-")
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={filteredColumns.length}
                  className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  No records found matching your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = currentPage === pageNum;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(pageNum)}
                  className={clsx(
                    "w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                      : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
