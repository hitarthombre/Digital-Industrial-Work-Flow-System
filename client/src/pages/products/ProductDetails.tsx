import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { IProduct } from '../../types/product';
import {
  Package,
  Layers,
  Sliders,
  FileText,
  Boxes,
  Edit,
  Trash2,
  Copy,
  Printer,
  Download,
  AlertTriangle,
  FileCode,
  FileCheck,
  Clock,
} from 'lucide-react';
import './ProductPages.css';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery Active Image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'specs' | 'variants' | 'docs' | 'inventory'>('specs');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetails(id);
    }
  }, [id]);

  const fetchDetails = async (prodId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(prodId);
      setProduct(data);
      if (data.media && data.media.length > 0) {
        const primaryIdx = data.media.findIndex((m) => m.isPrimary);
        setActiveImageIndex(primaryIdx !== -1 ? primaryIdx : 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;
    try {
      const duplicated = await productService.duplicateProduct(product._id);
      navigate(`/app/products/${duplicated._id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate product');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      navigate('/app/products');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePrintSpecSheet = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="prod-page-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="diws-spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading industrial specification data...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="prod-page-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <AlertTriangle size={48} className="text-amber" style={{ margin: '0 auto 1rem' }} />
        <h2>Product Record Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The requested catalog item does not exist or has been removed.'}
        </p>
        <Link to="/app/products" className="diws-btn diws-btn-primary">
          Back to Product Catalog
        </Link>
      </div>
    );
  }

  const activeMedia = product.media[activeImageIndex] || product.media[0];
  const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

  // Group attributes by category
  const groupedAttributes = product.customAttributes.reduce<Record<string, typeof product.customAttributes>>(
    (acc, attr) => {
      if (!acc[attr.category]) acc[attr.category] = [];
      acc[attr.category].push(attr);
      return acc;
    },
    {}
  );

  return (
    <div className="prod-page-container">
      {/* PAGE HEADER */}
      <div className="prod-page-header">
        <div className="prod-header-left">
          <div className="prod-breadcrumbs">
            <Link to="/app/products">Product Catalog</Link>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="active">{product.skuPrefix}</span>
          </div>
          <h1 className="prod-page-title">
            <Package className="text-copper" size={30} />
            {product.name}
          </h1>
          <p className="prod-page-subtitle">
            Part Number: <strong>{product.skuPrefix}</strong> &bull; Manufacturer: {product.brand}
          </p>
        </div>

        <div className="prod-header-actions">
          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={handlePrintSpecSheet}
            title="Print Specification Sheet"
          >
            <Printer size={16} /> Print Specs
          </button>
          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={handleDuplicate}
            title="Duplicate Product Record"
          >
            <Copy size={16} /> Duplicate
          </button>
          <Link
            to={`/app/products/${product._id}/edit`}
            className="diws-btn diws-btn-primary"
          >
            <Edit size={16} /> Edit Product
          </Link>
          <button
            type="button"
            className="diws-btn diws-btn-danger"
            onClick={() => setShowDeleteModal(true)}
            title="Delete from Catalog"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="prod-details-layout">
        {/* ===================== TOP HERO: GALLERY & SUMMARY ===================== */}
        <div className="prod-hero-card">
          {/* Gallery View */}
          <div className="prod-gallery-wrap">
            <div className="prod-gallery-main">
              {activeMedia ? (
                <img src={activeMedia.url} alt={activeMedia.caption || product.name} />
              ) : (
                <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                  <Package size={56} style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>No image uploaded</p>
                </div>
              )}
            </div>

            {product.media.length > 1 && (
              <div className="prod-gallery-thumbs">
                {product.media.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`prod-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img.url} alt={img.name} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Summary Pane */}
          <div className="prod-summary-pane">
            <div className="prod-brand-tag">{product.brand}</div>
            <h2 className="prod-details-title">{product.name}</h2>

            <div className="prod-sku-bar">
              <span>SKU: <strong>{product.skuPrefix}</strong></span>
              <span>&bull;</span>
              <span className={`prod-status-tag ${product.status}`}>{product.status}</span>
              <span>&bull;</span>
              <span className="prod-category-tag" style={{ margin: 0 }}>
                {product.category}
              </span>
            </div>

            {/* Pricing Hero Box */}
            <div className="prod-pricing-hero">
              <div>
                <div className="hero-base-price">
                  ${product.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="prod-price-label">Standard Base Price ({product.currency})</div>
              </div>

              <div className="hero-cost-info">
                <div>Cost: <strong>${product.costPrice.toFixed(2)}</strong></div>
                {product.msrp && (
                  <div>MSRP: <strong>${product.msrp.toFixed(2)}</strong></div>
                )}
                <div>
                  Margin:{' '}
                  <strong style={{ color: '#047857' }}>
                    {product.basePrice > 0
                      ? Math.round(((product.basePrice - product.costPrice) / product.basePrice) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              </div>
            </div>

            <p className="prod-description-text">{product.description}</p>

            {/* Quick Metrics Chips */}
            <div className="prod-quick-chips">
              <div className="quick-chip-item">
                <Layers size={15} className="text-copper" />
                <span>
                  <strong>{product.variants.length}</strong> Configured Variants
                </span>
              </div>
              <div className="quick-chip-item">
                <Boxes size={15} className="text-copper" />
                <span>
                  <strong>{totalStock}</strong> Total Units in Stock
                </span>
              </div>
              <div className="quick-chip-item">
                <Clock size={15} className="text-copper" />
                <span>
                  Lead Time: <strong>{product.leadTimeDays || 7} Days</strong>
                </span>
              </div>
              <div className="quick-chip-item">
                <FileText size={15} className="text-copper" />
                <span>
                  <strong>{product.documents.length}</strong> Spec Sheets / CAD
                </span>
              </div>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {product.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: '#FAF0E6',
                      border: '1px solid #EED8C3',
                      color: 'var(--copper)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================== TABBED CONTENT ===================== */}
        <div className="prod-tabs-container">
          <div className="prod-tab-nav">
            <button
              type="button"
              className={`prod-tab-link ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              <Sliders size={16} />
              <span>Technical Specifications ({product.customAttributes.length})</span>
            </button>
            <button
              type="button"
              className={`prod-tab-link ${activeTab === 'variants' ? 'active' : ''}`}
              onClick={() => setActiveTab('variants')}
            >
              <Layers size={16} />
              <span>Variant & SKU Matrix ({product.variants.length})</span>
            </button>
            <button
              type="button"
              className={`prod-tab-link ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <FileText size={16} />
              <span>Spec Sheets & Technical Documents ({product.documents.length})</span>
            </button>
            <button
              type="button"
              className={`prod-tab-link ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Boxes size={16} />
              <span>Inventory & Manufacturing Operations</span>
            </button>
          </div>

          {/* TAB 1: SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div className="prod-tab-pane">
              {/* Physical Dimensions Banner */}
              {product.dimensions && (
                <div
                  style={{
                    background: '#FAF7F2',
                    border: '1px solid #E6E0D4',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '2rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Overall Envelope Dimensions:
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--forest)' }}>
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Net Unit Weight:
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--forest)' }}>
                      {product.dimensions.weightKg} kg
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Minimum Order Quantity (MOQ):
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--forest)' }}>
                      {product.minOrderQuantity || 1} unit(s)
                    </div>
                  </div>
                </div>
              )}

              {/* Grouped Custom Attributes Tables */}
              {Object.keys(groupedAttributes).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
                    <div
                      key={groupName}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          background: '#FAF7F2',
                          padding: '0.75rem 1.25rem',
                          borderBottom: '1px solid var(--border)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--forest)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span className={`category-tag tag-${groupName.toLowerCase()}`}>
                          {groupName}
                        </span>
                        <span>Domain Specifications</span>
                      </div>
                      <table className="custom-attributes-table">
                        <tbody>
                          {attrs.map((a) => (
                            <tr key={a.id}>
                              <td style={{ width: '40%', fontWeight: 600, color: '#374151' }}>
                                {a.name}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--forest-dark)' }}>
                                {a.value} {a.unit && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{a.unit}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No custom technical specifications defined for this product.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VARIANTS & SKU MATRIX */}
          {activeTab === 'variants' && (
            <div className="prod-tab-pane">
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  All configured SKU combinations, pricing delta, and current stock status.
                </span>
                <Link to={`/app/products/${product._id}/edit`} className="diws-btn diws-btn-secondary diws-btn-sm">
                  <Edit size={14} /> Edit Variant Matrix
                </Link>
              </div>

              <div className="matrix-table-wrapper">
                <table className="variant-matrix-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Variant Attributes</th>
                      <th>SKU Code</th>
                      <th>Barcode</th>
                      <th>Price Adj.</th>
                      <th>Variant Price</th>
                      <th>Cost</th>
                      <th>Stock Qty</th>
                      <th>Alert Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className={!v.isActive ? 'row-inactive' : ''}>
                        <td>
                          <span
                            className={`prod-status-tag ${
                              v.isActive ? (v.stockQuantity > 0 ? 'active' : 'out_of_stock') : 'draft'
                            }`}
                          >
                            {v.isActive ? (v.stockQuantity > 0 ? 'In Stock' : 'Out of Stock') : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div className="matrix-attribute-badges">
                            {Object.entries(v.attributes).map(([attrK, attrV]) => (
                              <span key={attrK} className="matrix-attr-pill">
                                <span className="pill-key">{attrK}:</span>
                                <span className="pill-val">{attrV}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontFamily: 'monospace' }}>{v.sku}</strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', color: '#66736A' }}>
                            {v.barcode || '—'}
                          </span>
                        </td>
                        <td>
                          {v.priceAdjustment && v.priceAdjustment !== 0 ? (
                            <span style={{ color: v.priceAdjustment > 0 ? '#047857' : '#DC2626', fontWeight: 600 }}>
                              {v.priceAdjustment > 0 ? `+$${v.priceAdjustment.toFixed(2)}` : `-$${Math.abs(v.priceAdjustment).toFixed(2)}`}
                            </span>
                          ) : (
                            'Base'
                          )}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--forest)' }}>
                            ${v.price.toFixed(2)}
                          </strong>
                        </td>
                        <td>${(v.costPrice || product.costPrice).toFixed(2)}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 800,
                              color: v.stockQuantity <= (v.minStockAlert || 5) ? '#DC2626' : '#047857',
                            }}
                          >
                            {v.stockQuantity} units
                          </span>
                        </td>
                        <td>{v.minStockAlert || 5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS & SPEC SHEETS */}
          {activeTab === 'docs' && (
            <div className="prod-tab-pane">
              {product.documents.length > 0 ? (
                <div className="documents-list-container">
                  {product.documents.map((doc) => (
                    <div key={doc.id} className="doc-attachment-card">
                      <div className="doc-icon-wrap">
                        {doc.category === 'cad_drawing' ? (
                          <FileCode size={22} className="text-purple" />
                        ) : doc.category === 'compliance_cert' ? (
                          <FileCheck size={22} className="text-teal" />
                        ) : (
                          <FileText size={22} className="text-copper" />
                        )}
                      </div>
                      <div className="doc-info-wrap">
                        <div className="doc-title-row">
                          <span className="doc-name">{doc.name}</span>
                          {doc.version && <span className="doc-version-tag">Rev {doc.version}</span>}
                          <span className={`doc-category-badge badge-${doc.category}`}>
                            {doc.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="doc-meta-row">
                          <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          <span>&bull;</span>
                          <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="doc-action-btn"
                          title="Download Spec Sheet / Blueprint"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p>No attached engineering drawings or spec sheets for this product.</p>
                  <Link to={`/app/products/${product._id}/edit`} className="diws-btn diws-btn-copper diws-btn-sm" style={{ marginTop: '0.75rem' }}>
                    Upload Documents
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY & MANUFACTURING */}
          {activeTab === 'inventory' && (
            <div className="prod-tab-pane">
              <div className="review-summary-grid">
                <div className="review-summary-card">
                  <div className="review-card-title">
                    <Boxes size={18} className="text-copper" /> Inventory Health & Replenishment
                  </div>
                  <div className="review-row">
                    <span className="review-label">Total On-Hand Stock:</span>
                    <span className="review-value">{totalStock} Units</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Production Lead Time:</span>
                    <span className="review-value">{product.leadTimeDays || 7} Working Days</span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Minimum Order Qty (MOQ):</span>
                    <span className="review-value">{product.minOrderQuantity || 1} Units</span>
                  </div>
                </div>

                <div className="review-summary-card">
                  <div className="review-card-title">
                    <Clock size={18} className="text-copper" /> Quality & Audit Logs
                  </div>
                  <div className="review-row">
                    <span className="review-label">Created:</span>
                    <span className="review-value">
                      {new Date(product.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Last Updated:</span>
                    <span className="review-value">
                      {new Date(product.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="review-row">
                    <span className="review-label">Catalog Manager:</span>
                    <span className="review-value">DIWS Industrial Admin</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="diws-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="diws-modal" onClick={(e) => e.stopPropagation()}>
            <div className="diws-modal-header">
              <h3 className="diws-modal-title">Confirm Deletion</h3>
              <button
                type="button"
                className="diws-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="diws-modal-body">
              <p>
                Are you sure you want to delete <strong>{product.name}</strong> from the catalog?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                This will permanently delete all {product.variants.length} variant SKUs, attached
                media, and technical documents.
              </p>
            </div>
            <div className="diws-modal-footer">
              <button
                type="button"
                className="diws-btn diws-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="diws-btn diws-btn-danger"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
