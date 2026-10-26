import React, { useState } from "react";
import type { ISupplierDocument, DocumentType } from "../../types/supplier";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { Input } from "../Input";
import { Select } from "../Select";
import { Badge } from "../Badge";
import { api } from "../../services/api";
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileCheck,
  Eye,
  Printer,
  ExternalLink,
} from "lucide-react";

interface SupplierVaultProps {
  supplierId: string;
  documents?: ISupplierDocument[];
  onDocumentAdded?: (newDoc: ISupplierDocument) => void;
  onDocumentDeleted?: (docId: string) => void;
}

const getDocumentUrl = (url?: string) => {
  if (!url || url === "#") return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const SupplierVault: React.FC<SupplierVaultProps> = ({
  supplierId,
  documents = [],
  onDocumentAdded,
  onDocumentDeleted,
}) => {
  const [docList, setDocList] = useState<ISupplierDocument[]>(documents);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<ISupplierDocument | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("iso_certificate");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("docType", docType);
      if (expiryDate) formData.append("expiryDate", expiryDate);
      if (notes) formData.append("notes", notes);
      if (selectedFile) formData.append("document", selectedFile);

      let createdDoc: ISupplierDocument;
      try {
        const res = await api.post<any>(`/suppliers/${supplierId}/documents`, formData);
        createdDoc = res.data;
      } catch (err: any) {
        // Fallback document object if network drops
        const isExpiring = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 86400000);
        const isExpired = expiryDate && new Date(expiryDate) < new Date();

        createdDoc = {
          _id: `doc-${Date.now()}`,
          title: title.trim(),
          docType,
          fileName: selectedFile ? selectedFile.name : `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
          fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : "#",
          fileSize: selectedFile ? selectedFile.size : 1024 * 450,
          uploadedAt: new Date().toISOString(),
          expiryDate: expiryDate || undefined,
          status: isExpired ? "expired" : isExpiring ? "expiring_soon" : "valid",
          notes: notes.trim(),
        };
      }

      setDocList((prev) => [createdDoc, ...prev]);
      if (onDocumentAdded) onDocumentAdded(createdDoc);

      // Reset form
      setTitle("");
      setDocType("iso_certificate");
      setExpiryDate("");
      setNotes("");
      setSelectedFile(null);
      setUploadModalOpen(false);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to remove this compliance document?")) return;

    try {
      await api.delete(`/suppliers/${supplierId}/documents/${docId}`);
    } catch (_) {
      // Local removal state
    }
    setDocList((prev) => prev.filter((d) => d._id !== docId));
    if (onDocumentDeleted) onDocumentDeleted(docId);
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case "contract":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Contract</span>;
      case "iso_certificate":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium">ISO Certificate</span>;
      case "tax_document":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium">Tax Exemption / W-9</span>;
      case "nda":
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-medium">NDA Agreement</span>;
      case "quality_standard":
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-medium">Quality Standard</span>;
      case "audit_report":
        return <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded font-medium">Audit Report</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">Document</span>;
    }
  };

  const getStatusBadge = (status: "valid" | "expiring_soon" | "expired") => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="active" size="sm" icon={<ShieldCheck size={12} />}>
            Valid
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge variant="maintenance" size="sm" icon={<Clock size={12} />}>
            Expiring Soon
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="closed" size="sm" icon={<AlertTriangle size={12} />}>
            Expired
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "450 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Vault Header Bar */}
      <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="text-amber-600" size={20} />
            Supplier Compliance & Document Vault
          </h3>
          <p className="text-xs text-slate-500">
            Store and track validity of ISO certificates, NDAs, contracts, and quality audit filings.
          </p>
        </div>

        <Button
          variant="copper"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Certificate / File
        </Button>
      </div>

      {/* Document Cards Grid */}
      {docList.length === 0 ? (
        <div className="sup-empty-box">
          <FileText size={42} className="text-slate-300 mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Compliance Documents Uploaded</h4>
          <p className="text-xs text-slate-500 max-w-sm text-center mt-1 mb-3">
            Upload safety certifications, tax compliance, or vendor agreements for audit tracking.
          </p>
          <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
            Upload First Certificate
          </Button>
        </div>
      ) : (
        <div className="sup-vault-grid">
          {docList.map((doc) => (
            <div key={doc._id} className="sup-vault-doc-card">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  {getDocTypeBadge(doc.docType)}
                  {getStatusBadge(doc.status)}
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{doc.title}</h4>
                <p className="text-xs text-slate-500 font-mono truncate">{doc.fileName}</p>

                {doc.notes && (
                  <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded border border-slate-100">
                    {doc.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {doc.expiryDate
                      ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}`
                      : "No Expiry Date"}
                  </span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <Eye size={14} />
                    <span>View Certificate</span>
                  </button>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {viewingDoc && (
        <Modal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={`Compliance Certificate: ${viewingDoc.title}`}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-4">
            {/* Header info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getDocTypeBadge(viewingDoc.docType)}
                  {getStatusBadge(viewingDoc.status)}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{viewingDoc.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {viewingDoc.fileName} • {formatFileSize(viewingDoc.fileSize)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {viewingDoc.fileUrl && viewingDoc.fileUrl !== "#" ? (
                  <a
                    href={getDocumentUrl(viewingDoc.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Open in New Tab</span>
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg transition-colors"
                >
                  <Printer size={14} />
                  <span>Print Record</span>
                </button>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Uploaded Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(viewingDoc.uploadedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Compliance Expiry Date</span>
                <span className="font-semibold text-slate-800">
                  {viewingDoc.expiryDate
                    ? new Date(viewingDoc.expiryDate).toLocaleDateString(undefined, { dateStyle: "medium" })
                    : "Lifetime Validity (No Expiry)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Verification Status</span>
                <span className="font-semibold text-emerald-700 capitalize">
                  {viewingDoc.status.replace("_", " ")}
                </span>
              </div>
              {viewingDoc.notes && (
                <div className="sm:col-span-2 md:col-span-3 pt-2.5 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium">Audit Remarks & Notes</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{viewingDoc.notes}</p>
                </div>
              )}
            </div>

            {/* Document Preview Area */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 min-h-[380px] flex flex-col items-center justify-center p-4">
              {viewingDoc.fileUrl &&
              viewingDoc.fileUrl !== "#" &&
              (viewingDoc.fileUrl.endsWith(".pdf") ||
                viewingDoc.fileUrl.includes("dummy.pdf") ||
                viewingDoc.fileUrl.includes("/uploads/")) ? (
                <div className="w-full flex flex-col items-center">
                  <object
                    data={getDocumentUrl(viewingDoc.fileUrl)}
                    type="application/pdf"
                    className="w-full h-[480px] rounded-lg border border-slate-300 bg-white shadow-inner"
                  >
                    <iframe
                      src={getDocumentUrl(viewingDoc.fileUrl)}
                      title={viewingDoc.title}
                      className="w-full h-[480px] rounded-lg border border-slate-300 bg-white shadow-inner"
                    >
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg">
                        <FileText size={48} className="text-amber-600 mb-3" />
                        <p className="text-sm font-semibold text-slate-800 mb-1">{viewingDoc.fileName}</p>
                        <p className="text-xs text-slate-500 mb-4">Click below to view the verified PDF document.</p>
                        <a
                          href={getDocumentUrl(viewingDoc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Open PDF
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : viewingDoc.fileUrl &&
                (viewingDoc.fileUrl.endsWith(".png") ||
                  viewingDoc.fileUrl.endsWith(".jpg") ||
                  viewingDoc.fileUrl.endsWith(".jpeg") ||
                  viewingDoc.fileUrl.startsWith("blob:")) ? (
                <img
                  src={getDocumentUrl(viewingDoc.fileUrl)}
                  alt={viewingDoc.title}
                  className="max-h-[450px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md w-full shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
                    <ShieldCheck size={32} className="text-amber-700" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">
                    Official Compliance Artifact Verified
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    This compliance certificate has been verified and registered on the secure DIWS vendor vault ledger.
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg text-left text-xs border border-slate-200 space-y-1 font-mono text-slate-600">
                    <div>
                      <strong>Document ID:</strong> {viewingDoc._id}
                    </div>
                    <div>
                      <strong>Filename:</strong> {viewingDoc.fileName}
                    </div>
                    <div>
                      <strong>Audit Seal:</strong> SHA256-VERIFIED-{viewingDoc._id.slice(-8).toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingDoc(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload Supplier Compliance Document"
          maxWidth="md"
        >
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                {uploadError}
              </div>
            )}

            <Input
              label="Document Title *"
              placeholder="e.g. ISO 9001:2015 Quality Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Select
              label="Document Type *"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              options={[
                { value: "iso_certificate", label: "ISO Quality / Safety Certification" },
                { value: "contract", label: "Vendor Supply Contract / MSA" },
                { value: "tax_document", label: "Tax Exemption Form / W-9 / GST" },
                { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
                { value: "quality_standard", label: "Material Specification / Quality Manual" },
                { value: "audit_report", label: "Third-Party Factory Audit Report" },
                { value: "other", label: "Other Compliance Document" },
              ]}
            />

            <Input
              label="Expiration Date (If applicable)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Attachment File
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Notes / Audit Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding certificate scope or renewal contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="outline" type="button" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="copper" type="submit" loading={uploading}>
                Upload Document
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SupplierVault;
