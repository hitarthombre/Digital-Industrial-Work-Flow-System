import React, { useState, useRef } from 'react';
import type { IProductMedia, IProductDocument, DocumentCategory } from '../../types/product';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  Star,
  FileCode,
  Download,
  Plus,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface ProductMediaUploaderProps {
  media: IProductMedia[];
  documents: IProductDocument[];
  onChangeMedia: (media: IProductMedia[]) => void;
  onChangeDocuments: (documents: IProductDocument[]) => void;
}

const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string; badgeColor: string }[] = [
  { id: 'spec_sheet', label: 'Technical Datasheet / Spec Sheet', badgeColor: 'blue' },
  { id: 'cad_drawing', label: 'CAD Drawing / 3D Blueprint', badgeColor: 'purple' },
  { id: 'safety_data_sheet', label: 'Safety Data Sheet (MSDS)', badgeColor: 'amber' },
  { id: 'user_manual', label: 'User & Maintenance Manual', badgeColor: 'emerald' },
  { id: 'compliance_cert', label: 'Certificate of Conformity', badgeColor: 'teal' },
];

export const ProductMediaUploader: React.FC<ProductMediaUploaderProps> = ({
  media,
  documents,
  onChangeMedia,
  onChangeDocuments,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'documents'>('images');
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<DocumentCategory>('spec_sheet');
  const [docVersionInput, setDocVersionInput] = useState('1.0');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Image Upload Processing
  const processImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const newMediaItems: IProductMedia[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not a supported image.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Image "${file.name}" exceeds maximum allowed size (10MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newImg: IProductMedia = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          url: resultUrl,
          sizeBytes: file.size,
          isPrimary: media.length === 0 && newMediaItems.length === 0,
          type: file.type,
          caption: file.name.replace(/\.[^/.]+$/, ''),
        };
        newMediaItems.push(newImg);

        if (newMediaItems.length === files.length) {
          onChangeMedia([...media, ...newMediaItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Document Upload Processing
  const processDocFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const newDocs: IProductDocument[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`Document "${file.name}" exceeds 50MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newDoc: IProductDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          category: selectedDocCategory,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          url: resultUrl || '#',
          uploadedAt: new Date().toISOString(),
          version: docVersionInput || '1.0',
        };
        newDocs.push(newDoc);

        if (newDocs.length === files.length) {
          onChangeDocuments([...documents, ...newDocs]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Set Primary Image
  const handleSetPrimaryImage = (id: string) => {
    onChangeMedia(
      media.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  // Remove Image
  const handleRemoveImage = (id: string) => {
    const remaining = media.filter((img) => img.id !== id);
    if (remaining.length > 0 && !remaining.some((m) => m.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    onChangeMedia(remaining);
  };

  // Remove Document
  const handleRemoveDoc = (id: string) => {
    onChangeDocuments(documents.filter((d) => d.id !== id));
  };

  // Add Industrial Sample Photos (convenient for demo/testing)
  const handleAddSamplePhotos = () => {
    const samples: IProductMedia[] = [
      {
        id: `media-sample-${Date.now()}-1`,
        name: 'heavy_machinery_isometric.jpg',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 185000,
        isPrimary: media.length === 0,
        type: 'image/jpeg',
        caption: 'Industrial Assembly Isometric View',
      },
      {
        id: `media-sample-${Date.now()}-2`,
        name: 'precision_interface_ports.jpg',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 142000,
        isPrimary: false,
        type: 'image/jpeg',
        caption: 'Connector Wiring & Terminal Block',
      },
    ];
    onChangeMedia([...media, ...samples]);
  };

  // Add Sample Spec Sheet
  const handleAddSampleDoc = () => {
    const sampleDoc: IProductDocument = {
      id: `doc-sample-${Date.now()}`,
      name: 'Industrial_Technical_Specification_Sheet_v2.pdf',
      category: 'spec_sheet',
      fileSize: 2450000,
      fileType: 'application/pdf',
      url: '#',
      uploadedAt: new Date().toISOString(),
      version: '2.1',
    };
    onChangeDocuments([...documents, sampleDoc]);
  };

  const getDocIcon = (category: DocumentCategory, fileType: string) => {
    if (category === 'cad_drawing' || fileType.includes('step') || fileType.includes('dwg')) {
      return <FileCode size={20} className="text-purple" />;
    }
    if (category === 'compliance_cert') {
      return <FileCheck size={20} className="text-teal" />;
    }
    return <FileText size={20} className="text-copper" />;
  };

  return (
    <div className="product-media-uploader-module">
      {/* Tab Switcher */}
      <div className="media-tabs-header">
        <button
          type="button"
          className={`media-tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <ImageIcon size={18} />
          <span>Product Images & Gallery ({media.length})</span>
        </button>
        <button
          type="button"
          className={`media-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={18} />
          <span>Spec Sheets & CAD Attachments ({documents.length})</span>
        </button>
      </div>

      {uploadError && (
        <div className="upload-error-banner">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ===================== TAB 1: PRODUCT IMAGES ===================== */}
      {activeTab === 'images' && (
        <div className="media-tab-content">
          {/* Drag and Drop Zone */}
          <div
            className={`uploader-dropzone ${isImageDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsImageDragging(true);
            }}
            onDragLeave={() => setIsImageDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
              processImageFiles(e.dataTransfer.files);
            }}
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden-file-input"
              onChange={(e) => processImageFiles(e.target.files)}
            />
            <div className="dropzone-icon-box">
              <Upload size={32} className="dropzone-icon text-copper" />
            </div>
            <div className="dropzone-title">Drag & Drop Product Images here</div>
            <div className="dropzone-subtitle">
              Supports high-resolution PNG, JPG, WEBP, SVG (Max 10MB per image)
            </div>
            <button
              type="button"
              className="diws-btn diws-btn-copper diws-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
            >
              <Plus size={14} /> Browse Files
            </button>
          </div>

          <div className="media-action-row">
            <span className="media-count-note">
              {media.length} image{media.length !== 1 ? 's' : ''} uploaded
            </span>
            <button
              type="button"
              className="sample-add-btn"
              onClick={handleAddSamplePhotos}
            >
              + Quick Add Sample Industrial Images
            </button>
          </div>

          {/* Image Grid Preview */}
          {media.length > 0 && (
            <div className="media-cards-grid">
              {media.map((img) => (
                <div
                  key={img.id}
                  className={`media-preview-card ${img.isPrimary ? 'primary-card' : ''}`}
                >
                  <div className="media-img-wrapper">
                    <img src={img.url} alt={img.caption || img.name} />
                    {img.isPrimary && (
                      <span className="primary-badge">
                        <Star size={12} fill="#B87333" /> Primary Cover
                      </span>
                    )}
                  </div>
                  <div className="media-meta">
                    <div className="media-name" title={img.name}>
                      {img.name}
                    </div>
                    <div className="media-size">{formatBytes(img.sizeBytes)}</div>
                  </div>
                  <div className="media-card-actions">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        className="make-primary-btn"
                        onClick={() => handleSetPrimaryImage(img.id)}
                      >
                        Set as Cover
                      </button>
                    )}
                    <button
                      type="button"
                      className="delete-media-btn"
                      onClick={() => handleRemoveImage(img.id)}
                      title="Remove image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: TECHNICAL DOCUMENTS ===================== */}
      {activeTab === 'documents' && (
        <div className="media-tab-content">
          {/* Document Config before upload */}
          <div className="doc-category-config-bar">
            <div className="config-group">
              <label>Attachment Classification:</label>
              <select
                className="diws-select-sm"
                value={selectedDocCategory}
                onChange={(e) => setSelectedDocCategory(e.target.value as DocumentCategory)}
              >
                {DOCUMENT_CATEGORIES.map((dc) => (
                  <option key={dc.id} value={dc.id}>
                    {dc.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="config-group">
              <label>Revision / Version:</label>
              <input
                type="text"
                className="diws-input-sm"
                style={{ width: '80px' }}
                value={docVersionInput}
                onChange={(e) => setDocVersionInput(e.target.value)}
                placeholder="v1.0"
              />
            </div>
          </div>

          {/* Drag & Drop Documents */}
          <div
            className={`uploader-dropzone doc-dropzone ${isDocDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDocDragging(true);
            }}
            onDragLeave={() => setIsDocDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDocDragging(false);
              processDocFiles(e.dataTransfer.files);
            }}
            onClick={() => docInputRef.current?.click()}
          >
            <input
              ref={docInputRef}
              type="file"
              multiple
              accept=".pdf,.step,.stp,.dwg,.dxf,.docx,.xlsx,.txt"
              className="hidden-file-input"
              onChange={(e) => processDocFiles(e.target.files)}
            />
            <div className="dropzone-icon-box">
              <FileText size={32} className="dropzone-icon text-copper" />
            </div>
            <div className="dropzone-title">Drag & Drop Technical Spec Sheets & CAD Files</div>
            <div className="dropzone-subtitle">
              PDF Datasheets, STEP / CAD 3D Models, MSDS Safety, User Manuals (Max 50MB)
            </div>
            <button
              type="button"
              className="diws-btn diws-btn-copper diws-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                docInputRef.current?.click();
              }}
            >
              <Plus size={14} /> Select Spec Sheet
            </button>
          </div>

          <div className="media-action-row">
            <span className="media-count-note">
              {documents.length} document{documents.length !== 1 ? 's' : ''} attached
            </span>
            <button
              type="button"
              className="sample-add-btn"
              onClick={handleAddSampleDoc}
            >
              + Quick Add Sample Spec Sheet
            </button>
          </div>

          {/* Documents List */}
          {documents.length > 0 ? (
            <div className="documents-list-container">
              {documents.map((doc) => {
                const categoryDef = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category);
                return (
                  <div key={doc.id} className="doc-attachment-card">
                    <div className="doc-icon-wrap">
                      {getDocIcon(doc.category, doc.fileType)}
                    </div>
                    <div className="doc-info-wrap">
                      <div className="doc-title-row">
                        <span className="doc-name">{doc.name}</span>
                        {doc.version && <span className="doc-version-tag">Rev {doc.version}</span>}
                        <span className={`doc-category-badge badge-${doc.category}`}>
                          {categoryDef?.label.split(' / ')[0] || doc.category}
                        </span>
                      </div>
                      <div className="doc-meta-row">
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Attached {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="doc-actions">
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="doc-action-btn"
                        title="Download Spec Sheet"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        type="button"
                        className="delete-doc-btn"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Remove Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-documents-state">
              <p>No technical documents or spec sheets uploaded for this product yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductMediaUploader;
