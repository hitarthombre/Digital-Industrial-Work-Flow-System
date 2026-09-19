import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import type {
  CreateProductInput,
  IndustrialCategory,
  IVariantOption,
  IProductVariant,
  ICustomAttribute,
  IProductMedia,
  IProductDocument,
  ProductStatus,
} from '../../types/product';
import CategorySelector from '../../components/products/CategorySelector';
import VariantBuilder from '../../components/products/VariantBuilder';
import CustomAttributesBuilder from '../../components/products/CustomAttributesBuilder';
import ProductMediaUploader from '../../components/products/ProductMediaUploader';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Package,
  Layers,
  Sliders,
  UploadCloud,
  FileCheck,
  Save,
  AlertCircle,
} from 'lucide-react';
import './ProductPages.css';

interface ProductBuilderProps {
  mode: 'create' | 'edit';
  initialProductId?: string;
}

const WIZARD_STEPS = [
  { step: 1, title: 'General Info', icon: <Package size={16} /> },
  { step: 2, title: 'Variant Matrix', icon: <Layers size={16} /> },
  { step: 3, title: 'Technical Specs', icon: <Sliders size={16} /> },
  { step: 4, title: 'Media & Specs', icon: <UploadCloud size={16} /> },
  { step: 5, title: 'Review & Publish', icon: <FileCheck size={16} /> },
];

export const ProductBuilder: React.FC<ProductBuilderProps> = ({ mode, initialProductId }) => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<IndustrialCategory>('Industrial Automation');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [basePrice, setBasePrice] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(60);
  const [msrp, setMsrp] = useState<number>(140);
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [status, setStatus] = useState<ProductStatus>('active');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(1);

  // Dimensions
  const [dimLength, setDimLength] = useState<number>(100);
  const [dimWidth, setDimWidth] = useState<number>(50);
  const [dimHeight, setDimHeight] = useState<number>(50);
  const [dimWeightKg, setDimWeightKg] = useState<number>(1.5);

  // Modular Child States
  const [variantOptions, setVariantOptions] = useState<IVariantOption[]>([]);
  const [variants, setVariants] = useState<IProductVariant[]>([]);
  const [customAttributes, setCustomAttributes] = useState<ICustomAttribute[]>([]);
  const [media, setMedia] = useState<IProductMedia[]>([]);
  const [documents, setDocuments] = useState<IProductDocument[]>([]);

  // Load existing product if edit mode
  useEffect(() => {
    if (mode === 'edit' && initialProductId) {
      loadProductForEdit(initialProductId);
    }
  }, [mode, initialProductId]);

  const loadProductForEdit = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const prod = await productService.getProductById(id);
      setName(prod.name);
      setSkuPrefix(prod.skuPrefix);
      setBrand(prod.brand);
      setCategory(prod.category);
      setSubCategory(prod.subCategory || '');
      setDescription(prod.description);
      setShortDescription(prod.shortDescription || '');
      setTagsInput(prod.tags.join(', '));
      setBasePrice(prod.basePrice);
      setCostPrice(prod.costPrice);
      setMsrp(prod.msrp || prod.basePrice * 1.2);
      setCurrency(prod.currency || 'USD');
      setTaxRate(prod.taxRate || 18);
      setStatus(prod.status);
      setLeadTimeDays(prod.leadTimeDays || 7);
      setMinOrderQuantity(prod.minOrderQuantity || 1);

      if (prod.dimensions) {
        setDimLength(prod.dimensions.length || 0);
        setDimWidth(prod.dimensions.width || 0);
        setDimHeight(prod.dimensions.height || 0);
        setDimWeightKg(prod.dimensions.weightKg || 0);
      }

      setVariantOptions(prod.variantOptions || []);
      setVariants(prod.variants || []);
      setCustomAttributes(prod.customAttributes || []);
      setMedia(prod.media || []);
      setDocuments(prod.documents || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load product for editing');
    } finally {
      setLoading(false);
    }
  };

  // Step Validation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMsg(null);
    if (stepNumber === 1) {
      if (!name.trim()) {
        setErrorMsg('Product Name is required.');
        return false;
      }
      if (!skuPrefix.trim()) {
        setErrorMsg('Product SKU Prefix is required.');
        return false;
      }
      if (!brand.trim()) {
        setErrorMsg('Manufacturer / Brand is required.');
        return false;
      }
      if (basePrice < 0) {
        setErrorMsg('Base Price cannot be negative.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (forceStatus?: ProductStatus) => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    // If no variants were defined, create default single variant
    let finalVariants = variants;
    if (finalVariants.length === 0) {
      finalVariants = [
        {
          id: `var-default-${Date.now()}`,
          sku: `${skuPrefix.trim()}-BASE`,
          attributes: { Standard: 'Default' },
          price: basePrice,
          priceAdjustment: 0,
          costPrice,
          stockQuantity: 10,
          minStockAlert: 5,
          isActive: true,
        },
      ];
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const productPayload: CreateProductInput = {
      name: name.trim(),
      skuPrefix: skuPrefix.trim().toUpperCase(),
      brand: brand.trim(),
      category,
      subCategory: subCategory.trim() || undefined,
      description: description.trim(),
      shortDescription: shortDescription.trim() || undefined,
      tags,
      basePrice: Number(basePrice),
      costPrice: Number(costPrice),
      msrp: Number(msrp),
      currency,
      taxRate: Number(taxRate),
      status: forceStatus || status,
      leadTimeDays: Number(leadTimeDays),
      minOrderQuantity: Number(minOrderQuantity),
      dimensions: {
        length: Number(dimLength),
        width: Number(dimWidth),
        height: Number(dimHeight),
        weightKg: Number(dimWeightKg),
        unit: 'mm',
      },
      variantOptions,
      variants: finalVariants,
      customAttributes,
      media,
      documents,
    };

    try {
      if (mode === 'edit' && initialProductId) {
        await productService.updateProduct(initialProductId, {
          ...productPayload,
          _id: initialProductId,
        });
        navigate(`/app/products/${initialProductId}`);
      } else {
        const created = await productService.createProduct(productPayload);
        navigate(`/app/products/${created._id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="prod-page-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="diws-spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading product configuration...</p>
      </div>
    );
  }

  return (
    <div className="prod-page-container">
      {/* PAGE HEADER */}
      <div className="prod-page-header">
        <div className="prod-header-left">
          <div className="prod-breadcrumbs">
            <Link to="/app/products">Product Catalog</Link>
            <span>/</span>
            <span className="active">
              {mode === 'create' ? 'Add Product Wizard' : `Edit: ${name || 'Product'}`}
            </span>
          </div>
          <h1 className="prod-page-title">
            <Package className="text-copper" size={30} />
            {mode === 'create' ? 'Industrial Product Builder' : `Edit Product Catalog Record`}
          </h1>
          <p className="prod-page-subtitle">
            Configure product metadata, multi-attribute variants, technical specs & technical attachments.
          </p>
        </div>

        <div className="prod-header-actions">
          <Link to="/app/products" className="diws-btn diws-btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="diws-btn diws-btn-outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            <Save size={16} /> Save as Draft
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* WIZARD STEPPER */}
      <div className="wizard-container">
        <div className="wizard-stepper-card">
          <div className="wizard-steps-list">
            {WIZARD_STEPS.map((stepItem) => {
              const isCompleted = currentStep > stepItem.step;
              const isActive = currentStep === stepItem.step;
              return (
                <div
                  key={stepItem.step}
                  className={`wizard-step-item ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                  onClick={() => {
                    if (isCompleted || validateStep(currentStep)) {
                      setCurrentStep(stepItem.step);
                    }
                  }}
                >
                  <div className="step-circle">
                    {isCompleted ? <Check size={18} /> : stepItem.step}
                  </div>
                  <div className="step-labels">
                    <span className="step-num">Step 0{stepItem.step}</span>
                    <span className="step-name">{stepItem.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== STEP 1: GENERAL INFO ===================== */}
        {currentStep === 1 && (
          <div className="wizard-body-card">
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>
              Step 1: General Product Information & Category
            </h3>

            {/* Category Selector */}
            <CategorySelector
              selectedCategory={category}
              selectedSubCategory={subCategory}
              onSelectCategory={setCategory}
              onSelectSubCategory={setSubCategory}
            />

            <div className="wizard-form-grid two-col" style={{ marginTop: '1.5rem' }}>
              {/* Product Name */}
              <div className="diws-form-group">
                <label className="diws-label">Product Name / Title *</label>
                <input
                  type="text"
                  className="diws-input"
                  placeholder="e.g. Heavy-Duty Industrial Brushless Servo Motor 3.5kW"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* SKU Prefix */}
              <div className="diws-form-group">
                <label className="diws-label">SKU Prefix / Part Number Base *</label>
                <input
                  type="text"
                  className="diws-input"
                  placeholder="e.g. SRV-800, END-CAR, HYD-VAL"
                  value={skuPrefix}
                  onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                />
              </div>

              {/* Brand / Manufacturer */}
              <div className="diws-form-group">
                <label className="diws-label">Manufacturer / Brand *</label>
                <input
                  type="text"
                  className="diws-input"
                  placeholder="e.g. ApexMotion Dynamics, Siemens, Rexroth"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="diws-form-group">
                <label className="diws-label">Catalog Status</label>
                <select
                  className="diws-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                >
                  <option value="active">Active (Available for Production & Sale)</option>
                  <option value="draft">Draft (Under Review)</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="archived">Archived / Legacy</option>
                </select>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="wizard-form-grid three-col" style={{ marginTop: '1rem' }}>
              <div className="diws-form-group">
                <label className="diws-label">Base Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="diws-input"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="diws-form-group">
                <label className="diws-label">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="diws-input"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="diws-form-group">
                <label className="diws-label">MSRP ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="diws-input"
                  value={msrp}
                  onChange={(e) => setMsrp(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="diws-form-group" style={{ marginTop: '1rem' }}>
              <label className="diws-label">Full Technical Description</label>
              <textarea
                className="diws-input"
                style={{ height: '110px', resize: 'vertical' }}
                placeholder="Detailed technical overview of operation, manufacturing standards, construction materials, and target applications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="diws-form-group" style={{ marginTop: '1rem' }}>
              <label className="diws-label">Tags & Search Keywords (comma-separated)</label>
              <input
                type="text"
                className="diws-input"
                placeholder="Servo, CNC, High-Torque, IP67, Automation, 480V"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ===================== STEP 2: VARIANTS ===================== */}
        {currentStep === 2 && (
          <div className="wizard-body-card">
            <VariantBuilder
              basePrice={basePrice}
              costPrice={costPrice}
              skuPrefix={skuPrefix}
              variantOptions={variantOptions}
              variants={variants}
              onChangeOptions={setVariantOptions}
              onChangeVariants={setVariants}
            />
          </div>
        )}

        {/* ===================== STEP 3: TECHNICAL SPECS ===================== */}
        {currentStep === 3 && (
          <div className="wizard-body-card">
            <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>
              Step 3: Physical Dimensions & Custom Technical Attributes
            </h3>

            {/* Dimensions Row */}
            <div
              style={{
                background: '#FAF7F2',
                border: '1px solid #E6E0D4',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                Physical Footprint & Weight (Standard Metric)
              </h4>
              <div className="wizard-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="diws-form-group">
                  <label className="diws-label">Length (mm)</label>
                  <input
                    type="number"
                    className="diws-input"
                    value={dimLength}
                    onChange={(e) => setDimLength(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="diws-form-group">
                  <label className="diws-label">Width (mm)</label>
                  <input
                    type="number"
                    className="diws-input"
                    value={dimWidth}
                    onChange={(e) => setDimWidth(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="diws-form-group">
                  <label className="diws-label">Height (mm)</label>
                  <input
                    type="number"
                    className="diws-input"
                    value={dimHeight}
                    onChange={(e) => setDimHeight(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="diws-form-group">
                  <label className="diws-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="diws-input"
                    value={dimWeightKg}
                    onChange={(e) => setDimWeightKg(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Custom Attributes Builder Component */}
            <CustomAttributesBuilder
              attributes={customAttributes}
              onChangeAttributes={setCustomAttributes}
            />
          </div>
        )}

        {/* ===================== STEP 4: MEDIA & DOCUMENTS ===================== */}
        {currentStep === 4 && (
          <div className="wizard-body-card">
            <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>
              Step 4: Product Imagery, CAD Drawings & Spec Sheets
            </h3>
            <ProductMediaUploader
              media={media}
              documents={documents}
              onChangeMedia={setMedia}
              onChangeDocuments={setDocuments}
            />
          </div>
        )}

        {/* ===================== STEP 5: REVIEW & PUBLISH ===================== */}
        {currentStep === 5 && (
          <div className="wizard-body-card">
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>
              Step 5: Review & Publish Product Catalog Record
            </h3>

            <div className="review-summary-grid">
              {/* Card 1: Core Details */}
              <div className="review-summary-card">
                <div className="review-card-title">
                  <Package size={18} className="text-copper" /> Product Identification
                </div>
                <div className="review-row">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{name}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">SKU Prefix:</span>
                  <span className="review-value">{skuPrefix}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Brand:</span>
                  <span className="review-value">{brand}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Category:</span>
                  <span className="review-value">{category}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Status:</span>
                  <span className="review-value">{status.toUpperCase()}</span>
                </div>
              </div>

              {/* Card 2: Financials */}
              <div className="review-summary-card">
                <div className="review-card-title">
                  <Layers size={18} className="text-copper" /> Pricing & Inventory
                </div>
                <div className="review-row">
                  <span className="review-label">Base Price:</span>
                  <span className="review-value">${basePrice.toFixed(2)}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Cost Price:</span>
                  <span className="review-value">${costPrice.toFixed(2)}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">MSRP:</span>
                  <span className="review-value">${msrp.toFixed(2)}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Configured Variants:</span>
                  <span className="review-value">{variants.length || 1} SKU(s)</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Total Stock:</span>
                  <span className="review-value">
                    {variants.reduce((acc, v) => acc + v.stockQuantity, 0)} units
                  </span>
                </div>
              </div>

              {/* Card 3: Specs Breakdown */}
              <div className="review-summary-card">
                <div className="review-card-title">
                  <Sliders size={18} className="text-copper" /> Technical Specs
                </div>
                <div className="review-row">
                  <span className="review-label">Custom Attributes:</span>
                  <span className="review-value">{customAttributes.length} specs defined</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Footprint:</span>
                  <span className="review-value">
                    {dimLength} × {dimWidth} × {dimHeight} mm ({dimWeightKg} kg)
                  </span>
                </div>
                <div className="review-row">
                  <span className="review-label">Lead Time:</span>
                  <span className="review-value">{leadTimeDays} business days</span>
                </div>
              </div>

              {/* Card 4: Media Attachments */}
              <div className="review-summary-card">
                <div className="review-card-title">
                  <UploadCloud size={18} className="text-copper" /> Media & Attachments
                </div>
                <div className="review-row">
                  <span className="review-label">Product Images:</span>
                  <span className="review-value">{media.length} photos</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Technical Documents:</span>
                  <span className="review-value">{documents.length} files (CAD/PDF)</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem',
                background: '#EDF3EF',
                border: '1px solid #C4D7CC',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>Ready to Publish</strong>
                <p style={{ fontSize: '0.85rem', color: '#173A2A', margin: '0.2rem 0 0' }}>
                  All required parameters and variant matrices have been verified.
                </p>
              </div>
              <button
                type="button"
                className="diws-btn diws-btn-primary"
                onClick={() => handleSave('active')}
                disabled={saving}
              >
                <CheckCircle2 size={18} />
                {saving ? 'Saving...' : 'Save & Publish Product'}
              </button>
            </div>
          </div>
        )}

        {/* WIZARD FOOTER NAVIGATION */}
        <div className="wizard-footer-bar">
          <button
            type="button"
            className="diws-btn diws-btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={16} /> Previous Step
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep < WIZARD_STEPS.length ? (
              <button
                type="button"
                className="diws-btn diws-btn-primary"
                onClick={handleNext}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="diws-btn diws-btn-copper"
                onClick={() => handleSave('active')}
                disabled={saving}
              >
                <Check size={16} /> {saving ? 'Publishing...' : 'Complete & Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBuilder;
