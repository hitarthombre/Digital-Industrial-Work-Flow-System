import React, { useState } from "react";
import type { ICustomerDocument, DocumentType } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { Input } from "../Input";
import { Select } from "../Select";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Download,
  Search,
  Paperclip,
} from "lucide-react";

interface CustomerDocumentVaultProps {
  customerId: string;
  documents?: ICustomerDocument[];
  onDocumentChange?: () => void;
}

export const CustomerDocumentVault: React.FC<CustomerDocumentVaultProps> = ({
  customerId,
  documents = [],
  onDocumentChange,
}) => {
  const [docList, setDocList] = useState<ICustomerDocument[]>(documents);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("contract");
  const [fileName, setFileName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setDocList(documents);
  }, [documents]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const payload = {
        title,
        docType,
        fileName: fileName.trim() || `${title.replace(/\s+/g, "_")}.pdf`,
        expiryDate: expiryDate || undefined,
        notes,
        fileSize: Math.floor(Math.random() * (2000000 - 300000) + 300000),
      };

      const res = await customerService.uploadCustomerDocument(customerId, payload);
      if (res.data) {
        setDocList((prev) => [res.data, ...prev]);
        setIsUploadModalOpen(false);
        resetForm();
        if (onDocumentChange) onDocumentChange();
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to remove this attached document?")) return;

    try {
      await customerService.deleteCustomerDocument(customerId, docId);
      setDocList((prev) => prev.filter((d) => d._id !== docId));
      if (onDocumentChange) onDocumentChange();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDocType("contract");
    setFileName("");
    setExpiryDate("");
    setNotes("");
    setUploadError(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "350 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case "contract":
        return "Contract / MSA";
      case "tax_certificate":
        return "Tax Exemption Cert";
      case "nda":
        return "NDA Agreement";
      case "credit_application":
        return "Credit Application";
      case "purchase_order":
        return "Purchase Order";
      default:
        return "General Record";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge variant="success">Valid & Active</Badge>;
      case "expiring_soon":
        return <Badge variant="warning">Expiring Soon</Badge>;
      case "expired":
        return <Badge variant="danger">Expired</Badge>;
      case "pending_review":
        return <Badge variant="primary">Pending Review</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Filtered documents
  const filteredDocs = docList.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || doc.docType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="customer-document-vault">
      {/* Header and Actions Toolbar */}
      <div className="vault-toolbar">
        <div className="vault-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search documents by title or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="vault-actions">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Document Types</option>
            <option value="contract">Contracts & MSAs</option>
            <option value="nda">NDAs</option>
            <option value="tax_certificate">Tax Certificates</option>
            <option value="credit_application">Credit Applications</option>
            <option value="purchase_order">Purchase Orders</option>
            <option value="other">Other</option>
          </select>

          <Button
            variant="primary"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<Upload size={16} />}
          >
            Attach Document
          </Button>
        </div>
      </div>

      {/* Documents Grid / Empty State */}
      {filteredDocs.length === 0 ? (
        <div className="empty-vault-state">
          <FileText size={48} className="empty-icon" />
          <h4>No Attached Documents</h4>
          <p>There are no compliance, contract, or legal files attached for this account yet.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<Plus size={14} />}
            style={{ marginTop: "12px" }}
          >
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocs.map((doc) => (
            <div key={doc._id} className="doc-card">
              <div className="doc-card-header">
                <div className="doc-icon-badge">
                  <FileText size={20} className="text-primary" />
                </div>
                <div className="doc-meta">
                  <span className="doc-type-label">{getDocTypeLabel(doc.docType)}</span>
                  <h4 className="doc-title" title={doc.title}>
                    {doc.title}
                  </h4>
                </div>
              </div>

              <div className="doc-card-body">
                <div className="doc-file-info">
                  <Paperclip size={14} className="text-muted" />
                  <span className="file-name" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                  <span className="file-size">({formatFileSize(doc.fileSize)})</span>
                </div>

                {doc.notes && <p className="doc-notes">{doc.notes}</p>}

                <div className="doc-dates">
                  <div className="date-item">
                    <span>Uploaded:</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  {doc.expiryDate && (
                    <div className="date-item">
                      <span>Expires:</span>
                      <span>{new Date(doc.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="doc-status-row">{getStatusBadge(doc.status)}</div>
              </div>

              <div className="doc-card-footer">
                <a
                  href={doc.fileUrl || "#"}
                  download={doc.fileName}
                  onClick={(e) => {
                    if (!doc.fileUrl || doc.fileUrl === "#") {
                      e.preventDefault();
                      alert(`Downloading attachment: ${doc.fileName}`);
                    }
                  }}
                  className="btn-doc-download"
                >
                  <Download size={14} /> Download
                </a>

                <button
                  className="btn-doc-delete"
                  onClick={() => handleDeleteDocument(doc._id)}
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            resetForm();
          }}
          title="Attach Document to Customer Account"
        >
          <form onSubmit={handleUploadSubmit} className="doc-upload-form">
            {uploadError && <div className="form-error-alert">{uploadError}</div>}

            <Input
              label="Document Title *"
              placeholder="e.g. Master Supply Agreement 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="form-row">
              <Select
                label="Document Category"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                options={[
                  { value: "contract", label: "Contract / MSA" },
                  { value: "tax_certificate", label: "Tax Exemption Certificate" },
                  { value: "nda", label: "NDA / Confidentiality" },
                  { value: "credit_application", label: "Credit Application" },
                  { value: "purchase_order", label: "Purchase Order" },
                  { value: "other", label: "Other / General" },
                ]}
              />

              <Input
                label="File Name"
                placeholder="e.g. MSA_2026_Signed.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>

            <Input
              label="Expiration Date (Optional)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />

            <div className="form-group">
              <label className="form-label">File Attachment</label>
              <div className="file-dropzone">
                <Upload size={24} className="dropzone-icon" />
                <p>Click or drag PDF / DOCX file to attach</p>
                <input
                  type="file"
                  className="file-input-hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFileName(f.name);
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes & Comments</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Add optional notes or compliance instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Upload & Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDocumentVault;
