import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FolderOpen, Upload, RefreshCw, Search, Eye, Download, Pencil, Trash2, FileText, AlertTriangle, Link2 } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, LoadingBox, EmptyBox, ErrorBanner, Pager } from "../../components/ops/OpsUI";
import { SavedFiltersBar } from "../../components/ops/SavedFiltersBar";
import { DocumentFormModal, DocumentPreviewModal, CATEGORY_LABELS } from "../../components/documents/DocumentModals";
import { useApiQuery, useDebounced, useMutation } from "../../hooks/useApiQuery";
import { documentService } from "../../services/operationsService";
import { DOCUMENT_CATEGORIES, DOCUMENT_LINK_MODULES } from "../../types/operations";
import type { ILibraryDocument, DocumentCategory } from "../../types/operations";
import { formatDate, formatFileSize, humanize, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

interface LibraryFilters {
  search?: string;
  category?: string;
  linkedModule?: string;
  expiring?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const DocumentLibrary: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<LibraryFilters>({});
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<ILibraryDocument | null>(null);
  const [previewing, setPreviewing] = useState<ILibraryDocument | null>(null);
  const action = useMutation();

  const search = useDebounced(filters.search);
  const query = { ...filters, search, page, limit: 24 };
  const list = useApiQuery(() => documentService.getDocuments(query), [query]);
  const stats = useApiQuery(() => documentService.getStats(), []);

  // Deep link from global search: /app/documents?open=<id>
  const openId = searchParams.get("open");
  useEffect(() => {
    if (!openId) return;
    documentService
      .getDocument(openId)
      .then((res) => setPreviewing(res.data))
      .catch(() => undefined)
      .finally(() => setSearchParams({}, { replace: true }));
  }, [openId, setSearchParams]);

  const setFilter = (patch: LibraryFilters) => {
    setFilters({ ...filters, ...patch });
    setPage(1);
  };

  const refresh = () => {
    list.refetch();
    stats.refetch();
  };

  const remove = async (doc: ILibraryDocument) => {
    if (!window.confirm(`Remove "${doc.title}" from the document library?`)) return;
    await action.mutate(() => documentService.deleteDocument(doc._id)).catch(() => undefined);
    refresh();
  };

  const s = stats.data?.data;

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<FolderOpen className="text-amber-600" size={28} />}
        title="Document Library"
        subtitle="SOPs, manuals, certificates, drawings and product documents — categorised, searchable and linked to records."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={refresh}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Upload size={16} />} onClick={() => setUploading(true)}>
              Upload Document
            </Button>
          </>
        }
      />

      {/* Category browser */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilter({ category: undefined, expiring: undefined })}
          className={`text-left rounded-lg border p-3 transition ${!filters.category && !filters.expiring ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-500">All documents</div>
          <div className="text-xl font-extrabold text-slate-900">{s?.total ?? "—"}</div>
          <div className="text-[10px] text-slate-400">{formatFileSize(s?.totalSize)}</div>
        </button>
        {DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter({ category: c, expiring: undefined })}
            className={`text-left rounded-lg border p-3 transition ${filters.category === c ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-500">{CATEGORY_LABELS[c]}</div>
            <div className="text-xl font-extrabold text-slate-900">{s?.byCategory[c] ?? 0}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilter({ expiring: filters.expiring ? undefined : "true", category: undefined })}
          className={`text-left rounded-lg border p-3 transition ${filters.expiring ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
        >
          <div className="text-[10px] font-bold uppercase text-rose-600 flex items-center gap-1">
            <AlertTriangle size={10} /> Expiring ≤30d
          </div>
          <div className="text-xl font-extrabold text-slate-900">{s?.expiringSoon ?? 0}</div>
        </button>
      </div>

      <div className="proc-filter-bar flex-col items-stretch">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div className="proc-search-box">
            <Search size={16} className="proc-search-icon" />
            <input
              className="proc-search-input"
              placeholder="Search title, file name, tags, document number or linked record..."
              value={filters.search || ""}
              onChange={(e) => setFilter({ search: e.target.value })}
            />
          </div>
          <select className="proc-select-filter" value={filters.linkedModule || ""} onChange={(e) => setFilter({ linkedModule: e.target.value || undefined })} aria-label="Linked record type">
            <option value="">Any link</option>
            {DOCUMENT_LINK_MODULES.map((m) => (
              <option key={m} value={m}>
                {m === "none" ? "Not linked" : `Linked: ${humanize(m)}`}
              </option>
            ))}
          </select>
          <select
            className="proc-select-filter"
            value={`${filters.sortBy || "createdAt"}:${filters.sortOrder || "desc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(":");
              setFilter({ sortBy, sortOrder: sortOrder as "asc" | "desc" });
            }}
            aria-label="Sort"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="title:asc">Title A–Z</option>
            <option value="fileSize:desc">Largest first</option>
            <option value="expiryDate:asc">Expiring soonest</option>
          </select>
        </div>
        <SavedFiltersBar
          module="documents"
          current={filters as Record<string, any>}
          onApply={(f) => {
            setFilters(f as LibraryFilters);
            setPage(1);
          }}
        />
      </div>

      <ErrorBanner message={list.error || action.error} onRetry={list.refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {list.loading ? (
          <LoadingBox label="Loading documents..." />
        ) : !list.data?.data.length ? (
          <EmptyBox
            icon={<FileText size={40} />}
            title={filters.search || filters.category ? "No matching documents" : "The library is empty"}
            message="Upload SOPs, manuals and certificates so the whole team can find them."
            action={
              <Button size="sm" icon={<Upload size={14} />} onClick={() => setUploading(true)}>
                Upload Document
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Linked To</th>
                  <th>Version</th>
                  <th>Expiry</th>
                  <th>Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((doc) => {
                  const expiringSoon = doc.expiryDate && new Date(doc.expiryDate).getTime() - Date.now() < 30 * 86400000;
                  return (
                    <tr key={doc._id}>
                      <td>
                        <button type="button" className="text-left" onClick={() => setPreviewing(doc)}>
                          <div className="font-bold text-slate-900 hover:text-amber-700">{doc.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {doc.documentNumber && <span className="font-mono mr-1">{doc.documentNumber} ·</span>}
                            {doc.fileName} · {formatFileSize(doc.fileSize)}
                          </div>
                          {doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.tags.slice(0, 4).map((t) => (
                                <span key={t} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      </td>
                      <td>
                        <button type="button" className="text-xs font-semibold text-slate-700 hover:text-amber-700" onClick={() => setFilter({ category: doc.category as DocumentCategory })}>
                          {CATEGORY_LABELS[doc.category]}
                        </button>
                      </td>
                      <td className="text-xs">
                        {doc.linkedRecordLabel ? (
                          <span className="inline-flex items-center gap-1">
                            <Link2 size={12} className="text-slate-400" />
                            {humanize(doc.linkedModule)}: {doc.linkedRecordLabel}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-xs font-mono">v{doc.version}</td>
                      <td className={`text-xs ${expiringSoon ? "text-rose-600 font-bold" : ""}`}>{formatDate(doc.expiryDate)}</td>
                      <td className="text-xs">
                        <div>{formatDate(doc.createdAt)}</div>
                        <div className="text-[11px] text-slate-500">{refName(doc.uploadedBy)}</div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <button type="button" className="p-1.5 text-slate-500 hover:text-amber-700" title="Preview" onClick={() => setPreviewing(doc)}>
                            <Eye size={15} />
                          </button>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download={doc.fileName} className="p-1.5 text-slate-500 hover:text-amber-700" title="Download">
                            <Download size={15} />
                          </a>
                          <button type="button" className="p-1.5 text-slate-500 hover:text-amber-700" title="Edit" onClick={() => setEditing(doc)}>
                            <Pencil size={15} />
                          </button>
                          <button type="button" className="p-1.5 text-slate-400 hover:text-rose-600" title="Remove" onClick={() => remove(doc)} disabled={action.submitting}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
      </div>

      {(uploading || editing) && (
        <DocumentFormModal
          document={editing}
          defaultCategory={(filters.category as DocumentCategory) || undefined}
          onClose={() => {
            setUploading(false);
            setEditing(null);
          }}
          onSaved={() => {
            setUploading(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
      {previewing && (
        <DocumentPreviewModal
          document={previewing}
          onClose={() => setPreviewing(null)}
          onEdit={() => {
            setEditing(previewing);
            setPreviewing(null);
          }}
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
