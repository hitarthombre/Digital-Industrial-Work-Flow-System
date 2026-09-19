import React, { useState, useEffect } from "react";
import type { ICustomerDocument, DocumentCategory } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Modal } from "../Modal";
import {
  FileText,
  UploadCloud,
  FileCheck,
  Trash2,
  Download,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";

interface CustomerDocumentVaultProps {
  customerId: string;
}

export const CustomerDocumentVault: React.FC<CustomerDocumentVaultProps> = ({ customerId }) => {
  const [documents, setDocuments] = useState<ICustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("CONTRACT");
  const [docNotes, setDocNotes] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Delete modal state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [customerId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerDocuments(customerId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load document vault.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFileToUpload(selected);
      if (!docTitle) {
        setDocTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploading(true);
    setError(null);
    try {
      const created = await customerService.uploadCustomerDocument(
        customerId,
        fileToUpload,
        docTitle || fileToUpload.name,
        docCategory,
        docNotes
      );
      setDocuments((prev) => [created, ...prev]);
      setIsUploadOpen(false);
      setFileToUpload(null);
      setDocTitle("");
      setDocNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDocId) return;
    setDeleting(true);
    try {
      await customerService.deleteCustomerDocument(customerId, deleteDocId);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteDocId));
      setDeleteDocId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCategoryBadge = (cat: DocumentCategory) => {
    switch (cat) {
      case "CONTRACT":
        return <Badge variant="primary">Contract</Badge>;
      case "TAX_CERTIFICATE":
        return <Badge variant="warning">Tax Cert</Badge>;
      case "CREDIT_AGREEMENT":
        return <Badge variant="primary">Credit Agreement</Badge>;
      case "INVOICE":
        return <Badge variant="success">Invoice</Badge>;
      case "PO":
        return <Badge variant="secondary">Purchase Order</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="customer-vault-container">
      {/* Vault Top Control Bar */}
      <div className="vault-control-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="filter-box">
            <Filter size={16} className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Document Types</option>
              <option value="CONTRACT">Contracts</option>
              <option value="TAX_CERTIFICATE">Tax Certificates</option>
              <option value="CREDIT_AGREEMENT">Credit Agreements</option>
              <option value="INVOICE">Invoices</option>
              <option value="PO">Purchase Orders</option>
              <option value="OTHER">Other Attachments</option>
            </select>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            className="gap-2 shrink-0"
          >
            <UploadCloud size={16} />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading document vault...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <FileCheck size={40} className="empty-icon" />
          <h4>No Documents Attached</h4>
          <p>No contracts, certificates, or tax files have been uploaded for this customer yet.</p>
          <Button variant="outline" onClick={() => setIsUploadOpen(true)} className="mt-3 gap-2">
            <UploadCloud size={16} />
            Attach First Document
          </Button>
        </div>
      ) : (
        <div className="vault-grid">
          {filteredDocs.map((doc) => (
            <div key={doc._id} className="doc-card">
              <div className="doc-card-header">
                <div className="doc-icon-wrapper">
                  <FileText size={22} className="text-blue-600" />
                </div>
                <div className="doc-title-area">
                  <h4 className="doc-title" title={doc.title}>
                    {doc.title}
                  </h4>
                  <span className="doc-filename">{doc.fileName}</span>
                </div>
                <div>{getCategoryBadge(doc.category)}</div>
              </div>

              {doc.notes && <p className="doc-notes">{doc.notes}</p>}

              <div className="doc-card-meta">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>
                  {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {doc.uploadedBy && (
                  <>
                    <span>•</span>
                    <span>By {doc.uploadedBy}</span>
                  </>
                )}
              </div>

              <div className="doc-card-actions">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={doc.fileName}
                  className="doc-action-btn text-blue-600 hover:bg-blue-50"
                >
                  <Download size={14} />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteDocId(doc._id)}
                  className="doc-action-btn text-rose-600 hover:bg-rose-50 ml-auto"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="Attach New Document"
          maxWidth="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="file-drop-zone">
              <input
                type="file"
                id="docFileInput"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label htmlFor="docFileInput" className="drop-zone-label">
                <UploadCloud size={32} className="text-slate-400 mb-2" />
                {fileToUpload ? (
                  <div className="text-center">
                    <span className="font-semibold text-slate-900 block">{fileToUpload.name}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(fileToUpload.size)}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="font-medium text-slate-700 block">Click to browse or drop file here</span>
                    <span className="text-xs text-slate-500 block mt-1">PDF, DOCX, PNG, JPG up to 25MB</span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="form-label">Document Title *</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Master Supply Agreement 2026"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Document Category *</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                className="form-input"
                required
              >
                <option value="CONTRACT">Contract / Agreement</option>
                <option value="TAX_CERTIFICATE">Tax Exemption Certificate</option>
                <option value="CREDIT_AGREEMENT">Credit Application / Terms</option>
                <option value="INVOICE">Invoice Document</option>
                <option value="PO">Purchase Order</option>
                <option value="OTHER">Other / General File</option>
              </select>
            </div>

            <div>
              <label className="form-label">Internal Notes / Description</label>
              <textarea
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Add optional notes for your sales team..."
                className="form-input rows-3"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!fileToUpload || uploading}>
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDocId && (
        <Modal
          isOpen={!!deleteDocId}
          onClose={() => setDeleteDocId(null)}
          title="Confirm Document Removal"
          maxWidth="sm"
        >
          <div className="p-2 text-slate-700">
            <p>Are you sure you want to permanently remove this document attachment?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteDocId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Document"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDocumentVault;
