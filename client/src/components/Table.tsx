import React, { useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationProps;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
  rowKey?: (item: T, index: number) => string | number;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  pagination,
  onSort,
  emptyMessage = "No records found.",
  rowKey,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (!onSort) return;

    let newDirection: "asc" | "desc" = "asc";
    if (sortKey === key) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }

    setSortKey(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  const getRowKey = (item: T, index: number): string | number => {
    if (rowKey) return rowKey(item, index);
    const itemWithId = item as any;
    return itemWithId.id || itemWithId._id || index;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* Scrollable Container */}
      <div 
        style={{
          width: "100%",
          overflowX: "auto",
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
          {/* Table Headers */}
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
              {columns.map((col) => {
                const alignStyle = col.align === "right" ? "right" : col.align === "center" ? "center" : "left";
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding: "1rem 1.25rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      textAlign: alignStyle,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => col.sortable && (e.currentTarget.style.color = "var(--text-main)")}
                    onMouseLeave={(e) => col.sortable && (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-row-${rIdx}`} style={{ borderBottom: rIdx < 4 ? "1px solid var(--border-color)" : "none" }}>
                  {columns.map((col) => (
                    <td key={`skeleton-cell-${col.key}`} style={{ padding: "1.25rem" }}>
                      <div 
                        style={{
                          height: "1rem",
                          backgroundColor: "var(--border-color)",
                          borderRadius: "4px",
                          width: col.key === "name" || col.key === "title" ? "70%" : "40%",
                          animation: "pulse 1.5s infinite ease-in-out",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
                    <Inbox size={40} strokeWidth={1.5} style={{ color: "var(--border-color)" }} />
                    <p style={{ fontWeight: 500 }}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data State
              data.map((item, rIdx) => (
                <tr 
                  key={getRowKey(item, rIdx)} 
                  style={{ 
                    borderBottom: rIdx < data.length - 1 ? "1px solid var(--border-color)" : "none",
                    transition: "background-color 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.01)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {columns.map((col) => {
                    const alignStyle = col.align === "right" ? "right" : col.align === "center" ? "center" : "left";
                    return (
                      <td 
                        key={col.key} 
                        style={{ 
                          padding: "1rem 1.25rem", 
                          color: "var(--text-main)", 
                          textAlign: alignStyle,
                          verticalAlign: "middle" 
                        }}
                      >
                        {col.render ? col.render(item, rIdx) : (item as any)[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0.5rem" }}>
          {/* Info label */}
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {pagination.totalItems && (
              <span>
                Showing Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalItems} entries)
              </span>
            )}
          </div>

          {/* Button actions */}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="diws-btn diws-btn-secondary"
              style={{ padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", minWidth: "auto" }}
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === pagination.currentPage;
              
              // Only render standard amount of numbers to prevent overflow
              if (
                pageNum === 1 || 
                pageNum === pagination.totalPages || 
                Math.abs(pageNum - pagination.currentPage) <= 1
              ) {
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => pagination.onPageChange(pageNum)}
                    disabled={loading}
                    className={`diws-btn ${isCurrent ? "diws-btn-primary" : "diws-btn-secondary"}`}
                    style={{ 
                      padding: "0.375rem 0.75rem", 
                      minWidth: "2.25rem",
                      borderColor: isCurrent ? "var(--primary-accent)" : "var(--border-color)"
                    }}
                  >
                    {pageNum}
                  </button>
                );
              }

              // Ellipses rendering
              if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                return <span key={`ell-${pageNum}`} style={{ color: "var(--text-muted)", alignSelf: "center", padding: "0 0.25rem" }}>...</span>;
              }
              
              return null;
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="diws-btn diws-btn-secondary"
              style={{ padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", minWidth: "auto" }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Animation rules injected into style context */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
