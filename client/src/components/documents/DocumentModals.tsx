import React, { useState } from "react";
import { Upload, Pencil, X, Download, FileText, ExternalLink } from "lucide-react";
import { FormModal, Field, inputCls } from "../ops/OpsUI";
import { useLookup } from "../../hooks/useLookups";
import { useMutation } from "../../hooks/useApiQuery";
import { documentService, fileService } from "../../services/operationsService";
import { DOCUMENT_CATEGORIES } from "../../types/operations";
import type { ILibraryDocument, DocumentCategory, DocumentLinkModule } from "../../types/operations";
import { humanize, toInputDate, formatFileSize, formatDate, refName } from "../../utils/format";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  sop: "SOPs",
  manual: "Manuals",
  certificate: "Certificates",
  product_document: "Product Docs",
  drawing: "Drawings",
  contract: "Contracts",
  policy: "Policies",
  report: "Reports",
  invoice: "Invoices",
  other: "Other",
};

const ALLOWED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.dwg,.dxf,.zip";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Record pickers available for linking (modules backed by a lookup list)
const LINKABLE: Array<{ module: DocumentLinkModule; lookup: "products" | "suppliers" | "customers" | "factories" | "warehouses" }> = [
  { module: "product", lookup: "products" },
  { module: "supplier", lookup: "suppliers" },
  { module: "customer", lookup: "customers" },
  { module: "factory", lookup: "factories" },
  { module: "warehouse", lookup: "warehouses" },
];

const RecordPicker: React.FC<{
  module: DocumentLinkModule;
  value: string;
  onChange: (id: string, label: string) => void;
}> = ({ module, value, onChange }) => {
  const entry = LINKABLE.find((l) => l.module === module);
  const { options } = useLookup(entry?.lookup || "products", !!entry);
  if (!entry) return null;
  return (
    <select
      className={inputCls}
      value={value}
      onChange={(e) => {
        const opt = options.find((o) => o._id === e.target.value);
        onChange(e.target.value, opt ? `${opt.name}${opt.sku ? ` (${opt.sku})` : opt.code ? ` (${opt.code})` : ""}` : "");
      }}
    >
      <option value="">— Select {humanize(module)} —</option>
      {options.map((o) => (
        <option key={o._id} value={o._id}>
          {o.name} {o.sku || o.code ? `(${o.sku || o.code})` : ""}
        </option>
      ))}
    </select>
  );
};

interface DocumentFormModalProps {
  document?: ILibraryDocument | null;
  defaultCategory?: DocumentCategory;
  onClose: () => void;
  onSaved: (doc: ILibraryDocument) => void;
}

/** Upload a new library document, or edit metadata / upload a new revision of an existing one. */
export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ document, defaultCategory, onClose, onSaved }) => {
  const editing = !!document;
  const { submitting, error, setError, mutate } = useMutation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(document?.title || "");
  const [description, setDescription] = useState(document?.description || "");
  const [category, setCategory] = useState<DocumentCategory>(document?.category || defaultCategory || "sop");
  const [tags, setTags] = useState((document?.tags || []).join(", "));
  const [documentNumber, setDocumentNumber] = useState(document?.documentNumber || "");
  const [version, setVersion] = useState(document?.version || "1.0");
  const [linkedModule, setLinkedModule] = useState<DocumentLinkModule>(document?.linkedModule || "none");
  const [linkedRecordId, setLinkedRecordId] = useState(document?.linkedRecordId || "");
  const [linkedRecordLabel, setLinkedRecordLabel] = useState(document?.linkedRecordLabel || "");
  const [effectiveDate, setEffectiveDate] = useState(toInputDate(document?.effectiveDate));
  const [expiryDate, setExpiryDate] = useState(toInputDate(document?.expiryDate));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !file) return setError("Choose a file to upload");
    if (file && file.size > MAX_FILE_BYTES) return setError("Files must be 10MB or smaller");
    if (linkedModule !== "none" && !linkedRecordId) return setError(`Select the ${humanize(linkedModule)} to link, or choose "Not linked"`);

    const res = await mutate(async () => {
      const uploaded = file ? await fileService.upload(file) : null;
      const payload: Partial<ILibraryDocument> = {
        title: title.trim(),
        description: description || undefined,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        documentNumber: documentNumber || undefined,
        version: version || "1.0",
        linkedModule: linkedRecordId ? linkedModule : "none",
        linkedRecordId: linkedRecordId || (editing ? "" : undefined),
        linkedRecordLabel: linkedRecordId ? linkedRecordLabel : undefined,
        effectiveDate: effectiveDate || (editing ? "" : undefined),
        expiryDate: expiryDate || (editing ? "" : undefined),
        ...(uploaded
          ? { fileName: uploaded.fileName, fileUrl: uploaded.fileUrl, fileType: uploaded.fileType, fileSize: uploaded.fileSize }
          : {}),
      };
      return editing
        ? documentService.updateDocument(document!._id, payload)
        : documentService.createDocument(payload as ILibraryDocument);
    });
    onSaved(res.data);
  };

  return (
    <FormModal
      title={editing ? `Edit ${document!.title}` : "Upload Document"}
      subtitle={editing ? "Update details, or attach a new file as the next revision" : "Store SOPs, manuals, certificates and product documents in the company library"}
      icon={editing ? <Pencil className="text-amber-600" size={22} /> : <Upload className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel={editing ? "Save Changes" : "Upload"}
      error={error}
    >
      <Field label={editing ? "Replace File (optional)" : "File"} required={!editing} hint="PDF, images, office documents, CAD or zip — up to 10MB">
        <input
          type="file"
          className="text-xs"
          accept={ALLOWED_EXTENSIONS}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
        {editing && <p className="text-[11px] text-slate-500 mt-1">Current: {document!.fileName} ({formatFileSize(document!.fileSize)})</p>}
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Title" required className="sm:col-span-2">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </Field>
        <Field label="Category" required>
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Document Number">
          <input className={`${inputCls} uppercase`} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="e.g. SOP-QA-014" />
        </Field>
        <Field label="Version">
          <input className={inputCls} value={version} onChange={(e) => setVersion(e.target.value)} />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="welding, safety" />
        </Field>
        <Field label="Effective Date">
          <input type="date" className={inputCls} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </Field>
        <Field label="Expiry / Review Date" hint="Certificates expiring within 30 days are flagged">
          <input type="date" className={inputCls} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </Field>
        <Field label="Link To">
          <select
            className={inputCls}
            value={linkedModule}
            onChange={(e) => {
              setLinkedModule(e.target.value as DocumentLinkModule);
              setLinkedRecordId("");
              setLinkedRecordLabel("");
            }}
          >
            <option value="none">Not linked</option>
            {LINKABLE.map((l) => (
              <option key={l.module} value={l.module}>
                {humanize(l.module)}
              </option>
            ))}
          </select>
        </Field>
        {linkedModule !== "none" && (
          <Field label={`${humanize(linkedModule)} Record`} className="sm:col-span-3">
            <RecordPicker
              module={linkedModule}
              value={linkedRecordId}
              onChange={(id, label) => {
                setLinkedRecordId(id);
                setLinkedRecordLabel(label);
              }}
            />
          </Field>
        )}
      </div>
      <Field label="Description">
        <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      </Field>
    </FormModal>
  );
};

const isImage = (doc: ILibraryDocument) =>
  (doc.fileType || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.fileName);
const isPdf = (doc: ILibraryDocument) => doc.fileType === "application/pdf" || /\.pdf$/i.test(doc.fileName);

export const DocumentPreviewModal: React.FC<{ document: ILibraryDocument; onClose: () => void; onEdit?: () => void }> = ({ document, onClose, onEdit }) => (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="bg-white rounded-xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">{document.title}</h2>
          <p className="text-[11px] text-slate-500">
            {CATEGORY_LABELS[document.category]} · v{document.version}
            {document.documentNumber && ` · ${document.documentNumber}`} · {document.fileName} · {formatFileSize(document.fileSize)} · uploaded{" "}
            {formatDate(document.createdAt)} by {refName(document.uploadedBy)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button type="button" onClick={onEdit} className="p-2 text-slate-500 hover:text-amber-700" title="Edit">
              <Pencil size={16} />
            </button>
          )}
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" download={document.fileName} className="p-2 text-slate-500 hover:text-amber-700" title="Download">
            <Download size={16} />
          </a>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700" aria-label="Close preview">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-50 min-h-[300px] flex items-center justify-center">
        {isImage(document) ? (
          <img src={document.fileUrl} alt={document.title} className="max-w-full max-h-[75vh] object-contain" />
        ) : isPdf(document) ? (
          <iframe src={document.fileUrl} title={document.title} className="w-full h-[75vh] border-0" />
        ) : (
          <div className="text-center p-10">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-600 mb-3">This file type can't be previewed in the browser.</p>
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-700 inline-flex items-center gap-1">
              <ExternalLink size={13} /> Open {document.fileName}
            </a>
          </div>
        )}
      </div>
      {(document.description || document.tags.length > 0 || document.linkedRecordLabel) && (
        <div className="p-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          {document.description && <p>{document.description}</p>}
          {document.linkedRecordLabel && (
            <p>
              Linked to {humanize(document.linkedModule)}: <strong>{document.linkedRecordLabel}</strong>
            </p>
          )}
          {document.tags.length > 0 && (
            <p className="flex flex-wrap gap-1">
              {document.tags.map((t) => (
                <span key={t} className="bg-slate-100 rounded px-1.5 py-0.5">
                  #{t}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
);
