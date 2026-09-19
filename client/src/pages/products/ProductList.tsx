import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type { IProduct, ProductFilterParams } from '../../types/product';
import { INDUSTRIAL_CATEGORIES } from '../../components/products/CategorySelector';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import './ProductPages.css';

export const ProductList: React.FC = () => {

  // State
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    activeCount: 0,
    lowStockCount: 0,
    totalCategories: 0,
    totalVariants: 0,
  });

  // Filters & Controls
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name' | 'price' | 'stock'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Deletion modal
  const [deleteProductTarget, setDeleteProductTarget] = useState<IProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus, sortBy, sortOrder]);

  const fetchProducts = async (search = searchQuery) => {
    setLoading(true);
    try {
      const filterParams: ProductFilterParams = {
        search,
        category: selectedCategory,
        status: selectedStatus,
        sortBy,
        sortOrder,
      };

      const res = await productService.getProducts(filterParams);
      if (res.data) {
        setProducts(res.data);
      }
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await productService.duplicateProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate product');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductTarget) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(deleteProductTarget._id);
      setDeleteProductTarget(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTotalStock = (product: IProduct) => {
    return product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
  };

  return (
    <div className="prod-page-container">
      {/* PAGE HEADER */}
      <div className="prod-page-header">
        <div className="prod-header-left">
          <div className="prod-breadcrumbs">
            <span>Operations</span>
            <span>/</span>
            <span className="active">Product Catalog</span>
          </div>
          <h1 className="prod-page-title">
            <Package className="text-copper" size={30} />
            Industrial Product Catalog
          </h1>
          <p className="prod-page-subtitle">
            Centralized engineering catalog, multi-attribute variants, CAD drawings & technical spec sheets.
          </p>
        </div>

        <div className="prod-header-actions">
          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={() => fetchProducts()}
            title="Refresh list"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/app/products/new" className="diws-btn diws-btn-primary">
            <Plus size={18} /> Add New Product
          </Link>
        </div>
      </div>

      {/* METRIC STATS ROW */}
      <div className="prod-stats-grid">
        <div className="prod-stat-card">
          <div className="prod-stat-icon-wrap forest">
            <Boxes size={24} />
          </div>
          <div className="prod-stat-info">
            <span className="prod-stat-value">{metrics.totalProducts}</span>
            <span className="prod-stat-label">Catalog Products</span>
          </div>
        </div>

        <div className="prod-stat-card">
          <div className="prod-stat-icon-wrap copper">
            <Layers size={24} />
          </div>
          <div className="prod-stat-info">
            <span className="prod-stat-value">{metrics.totalVariants}</span>
            <span className="prod-stat-label">Configured SKU Variants</span>
          </div>
        </div>

        <div className="prod-stat-card">
          <div className="prod-stat-icon-wrap emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="prod-stat-info">
            <span className="prod-stat-value">{metrics.activeCount}</span>
            <span className="prod-stat-label">Active Industrial Items</span>
          </div>
        </div>

        <div className="prod-stat-card">
          <div className="prod-stat-icon-wrap amber">
            <AlertTriangle size={24} />
          </div>
          <div className="prod-stat-info">
            <span className="prod-stat-value">{metrics.lowStockCount}</span>
            <span className="prod-stat-label">Low Stock Alerts</span>
          </div>
        </div>
      </div>

      {/* CATALOG FILTER TOOLBAR */}
      <div className="prod-toolbar">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="prod-search-form">
          <Search size={18} className="prod-search-icon" />
          <input
            type="text"
            className="prod-search-input"
            placeholder="Search by part name, SKU prefix, brand, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Filters */}
        <div className="prod-filters-row">
          {/* Category */}
          <select
            className="prod-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {INDUSTRIAL_CATEGORIES.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            className="prod-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort */}
          <select
            className="prod-filter-select"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_') as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
          >
            <option value="updatedAt_desc">Recently Updated</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="stock_desc">Total Stock (Highest)</option>
          </select>

          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="diws-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading catalog inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <Package size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            No matching products found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Try adjusting your search criteria or add your first industrial part to the catalog.
          </p>
          <Link to="/app/products/new" className="diws-btn diws-btn-primary">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="prod-grid">
          {products.map((prod) => {
            const primaryMedia = prod.media.find((m) => m.isPrimary) || prod.media[0];
            const stockTotal = getTotalStock(prod);

            return (
              <div key={prod._id} className="prod-card">
                <div className="prod-card-image-wrap">
                  {primaryMedia ? (
                    <img src={primaryMedia.url} alt={prod.name} className="prod-card-img" />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF',
                      }}
                    >
                      <Package size={40} />
                    </div>
                  )}

                  <div className="prod-card-badges">
                    <span className={`prod-status-tag ${prod.status}`}>{prod.status}</span>
                  </div>
                </div>

                <div className="prod-card-content">
                  <span className="prod-category-tag">{prod.category}</span>
                  <h3 className="prod-card-title" title={prod.name}>
                    {prod.name}
                  </h3>
                  <div className="prod-card-sku">SKU: {prod.skuPrefix}</div>

                  <div className="prod-card-meta-row">
                    <div className="prod-price-box">
                      <span className="prod-price-val">
                        ${prod.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="prod-price-label">Base Price</span>
                    </div>

                    <div className="prod-variants-indicator" title="Configured SKU variants & stock">
                      <Layers size={13} />
                      <span>{prod.variants.length} SKUs &bull; {stockTotal} stock</span>
                    </div>
                  </div>

                  <div className="prod-card-actions">
                    <Link to={`/app/products/${prod._id}`} className="prod-view-btn">
                      <Eye size={15} /> View Details
                    </Link>
                    <Link
                      to={`/app/products/${prod._id}/edit`}
                      className="prod-icon-btn"
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      type="button"
                      className="prod-icon-btn"
                      onClick={() => handleDuplicate(prod._id)}
                      title="Duplicate Product"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      className="prod-icon-btn"
                      onClick={() => setDeleteProductTarget(prod)}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="prod-table-card">
          <table className="prod-catalog-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Base Price</th>
                <th>Variants</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const primaryMedia = prod.media.find((m) => m.isPrimary) || prod.media[0];
                const stockTotal = getTotalStock(prod);

                return (
                  <tr key={prod._id}>
                    <td>
                      <div className="table-product-cell">
                        {primaryMedia ? (
                          <img
                            src={primaryMedia.url}
                            alt={prod.name}
                            className="table-product-thumb"
                          />
                        ) : (
                          <div className="table-product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color="#9CA3AF" />
                          </div>
                        )}
                        <div className="table-product-info">
                          <Link to={`/app/products/${prod._id}`} className="table-product-name">
                            {prod.name}
                          </Link>
                          <span className="table-product-sku">{prod.skuPrefix}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="prod-category-tag" style={{ margin: 0 }}>
                        {prod.category}
                      </span>
                    </td>
                    <td>{prod.brand}</td>
                    <td>
                      <strong>
                        ${prod.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>
                      <span className="prod-variants-indicator">
                        <Layers size={12} /> {prod.variants.length}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: stockTotal === 0 ? '#DC2626' : stockTotal < 20 ? '#D97706' : '#047857',
                        }}
                      >
                        {stockTotal} units
                      </span>
                    </td>
                    <td>
                      <span className={`prod-status-tag ${prod.status}`}>{prod.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/app/products/${prod._id}`}
                          className="prod-icon-btn"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/app/products/${prod._id}/edit`}
                          className="prod-icon-btn"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          type="button"
                          className="prod-icon-btn"
                          onClick={() => handleDuplicate(prod._id)}
                          title="Duplicate"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          className="prod-icon-btn"
                          onClick={() => setDeleteProductTarget(prod)}
                          title="Delete"
                        >
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteProductTarget && (
        <div className="diws-modal-backdrop" onClick={() => setDeleteProductTarget(null)}>
          <div className="diws-modal" onClick={(e) => e.stopPropagation()}>
            <div className="diws-modal-header">
              <h3 className="diws-modal-title">Delete Product</h3>
              <button
                type="button"
                className="diws-modal-close"
                onClick={() => setDeleteProductTarget(null)}
              >
                &times;
              </button>
            </div>
            <div className="diws-modal-body">
              <p>
                Are you sure you want to delete <strong>{deleteProductTarget.name}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                This will also remove all associated {deleteProductTarget.variants.length} variant SKUs,
                attached CAD documents, and spec sheets. This action cannot be undone.
              </p>
            </div>
            <div className="diws-modal-footer">
              <button
                type="button"
                className="diws-btn diws-btn-secondary"
                onClick={() => setDeleteProductTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="diws-btn diws-btn-danger"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
