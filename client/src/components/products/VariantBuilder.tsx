import React, { useState } from 'react';
import type { IVariantOption, IProductVariant } from '../../types/product';
import {
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Package,
  X,
  RefreshCw,
} from 'lucide-react';

interface VariantBuilderProps {
  basePrice: number;
  costPrice: number;
  skuPrefix: string;
  variantOptions: IVariantOption[];
  variants: IProductVariant[];
  onChangeOptions: (options: IVariantOption[]) => void;
  onChangeVariants: (variants: IProductVariant[]) => void;
}

const COMMON_OPTION_PRESETS = [
  { name: 'Size', values: ['Small', 'Medium', 'Large'] },
  { name: 'Metric Thread', values: ['M6 x 1.0', 'M8 x 1.25', 'M10 x 1.5'] },
  { name: 'Material', values: ['Stainless Steel 316', 'Titanium Gr.5', 'Anodized Aluminum 6061'] },
  { name: 'Input Voltage', values: ['24V DC', '110V AC', '230V AC', '480V AC 3-Phase'] },
  { name: 'Surface Finish', values: ['Black Oxide', 'Electro-Polished', 'Zinc Plated', 'Hard Chrome'] },
  { name: 'Mounting Style', values: ['Flange Mount', 'Foot Mount', 'DIN Rail'] },
];

export const VariantBuilder: React.FC<VariantBuilderProps> = ({
  basePrice,
  costPrice,
  skuPrefix,
  variantOptions,
  variants,
  onChangeOptions,
  onChangeVariants,
}) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueInput, setNewValueInput] = useState<{ [optionId: string]: string }>({});
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<string>('');
  const [bulkStockQuantity, setBulkStockQuantity] = useState<string>('');

  // Add Option
  const handleAddOption = (name: string, initialValues: string[] = []) => {
    if (!name.trim()) return;
    const exists = variantOptions.some(
      (opt) => opt.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) return;

    const newOption: IVariantOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      values: initialValues,
    };

    const updatedOptions = [...variantOptions, newOption];
    onChangeOptions(updatedOptions);
    setNewOptionName('');
  };

  // Remove Option
  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = variantOptions.filter((opt) => opt.id !== optionId);
    onChangeOptions(updatedOptions);
    regenerateMatrix(updatedOptions);
  };

  // Add value to Option
  const handleAddValue = (optionId: string) => {
    const val = (newValueInput[optionId] || '').trim();
    if (!val) return;

    const updatedOptions = variantOptions.map((opt) => {
      if (opt.id === optionId) {
        if (opt.values.includes(val)) return opt;
        return { ...opt, values: [...opt.values, val] };
      }
      return opt;
    });

    onChangeOptions(updatedOptions);
    setNewValueInput((prev) => ({ ...prev, [optionId]: '' }));
  };

  // Remove value from Option
  const handleRemoveValue = (optionId: string, valueToRemove: string) => {
    const updatedOptions = variantOptions.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, values: opt.values.filter((v) => v !== valueToRemove) };
      }
      return opt;
    });

    onChangeOptions(updatedOptions);
  };

  // Generate Cartesian Product of Option Values
  const regenerateMatrix = (currentOptions: IVariantOption[] = variantOptions) => {
    const validOptions = currentOptions.filter((opt) => opt.values.length > 0);

    if (validOptions.length === 0) {
      onChangeVariants([]);
      return;
    }

    // Cartesian product helper
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const optionNames = validOptions.map((o) => o.name);
    const valueLists = validOptions.map((o) => o.values);
    const combinations = cartesian(valueLists);

    const generatedVariants: IProductVariant[] = combinations.map((combo, idx) => {
      const attributes: Record<string, string> = {};
      combo.forEach((val, i) => {
        attributes[optionNames[i]] = val;
      });

      // Abbreviation for SKU
      const abbr = combo
        .map((val) =>
          val
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 4)
            .toUpperCase()
        )
        .join('-');

      const cleanPrefix = skuPrefix.trim() ? skuPrefix.trim() : 'PROD';
      const generatedSku = `${cleanPrefix}-${abbr}`;

      // Check if variant already exists with matching attributes to preserve configured prices/stock
      const existing = variants.find((v) =>
        Object.entries(attributes).every(([k, val]) => v.attributes[k] === val)
      );

      if (existing) {
        return {
          ...existing,
          sku: existing.sku || generatedSku,
        };
      }

      return {
        id: `var-${Date.now()}-${idx}`,
        sku: generatedSku,
        barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
        attributes,
        priceAdjustment: 0,
        price: basePrice,
        costPrice: costPrice,
        stockQuantity: 10,
        minStockAlert: 5,
        isActive: true,
      };
    });

    onChangeVariants(generatedVariants);
  };

  // Update specific variant field
  const handleUpdateVariant = (id: string, field: keyof IProductVariant, value: any) => {
    const updated = variants.map((v) => {
      if (v.id === id) {
        const copy = { ...v, [field]: value };
        if (field === 'priceAdjustment') {
          const adj = parseFloat(value) || 0;
          copy.price = Math.max(0, basePrice + adj);
        } else if (field === 'price') {
          const p = parseFloat(value) || 0;
          copy.priceAdjustment = p - basePrice;
        }
        return copy;
      }
      return v;
    });
    onChangeVariants(updated);
  };

  // Bulk Apply Price Adjustment
  const handleApplyBulkPrice = () => {
    const adj = parseFloat(bulkPriceAdjustment);
    if (isNaN(adj)) return;

    const updated = variants.map((v) => ({
      ...v,
      priceAdjustment: adj,
      price: Math.max(0, basePrice + adj),
    }));
    onChangeVariants(updated);
    setBulkPriceAdjustment('');
  };

  // Bulk Apply Stock
  const handleApplyBulkStock = () => {
    const stock = parseInt(bulkStockQuantity, 10);
    if (isNaN(stock) || stock < 0) return;

    const updated = variants.map((v) => ({
      ...v,
      stockQuantity: stock,
    }));
    onChangeVariants(updated);
    setBulkStockQuantity('');
  };

  return (
    <div className="variant-builder-container">
      {/* SECTION 1: VARIANT OPTIONS CONFIGURATION */}
      <div className="variant-section-card">
        <div className="variant-section-header">
          <div className="section-title-wrap">
            <Layers className="text-copper" size={20} />
            <div>
              <h3 className="section-title">1. Configure Variant Dimensions</h3>
              <p className="section-subtitle">
                Define option attributes (e.g. Size, Material, Voltage) and their available values.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="variant-presets-bar">
          <span className="preset-title">
            <Sparkles size={14} /> Quick Presets:
          </span>
          <div className="preset-buttons">
            {COMMON_OPTION_PRESETS.map((preset) => {
              const isAdded = variantOptions.some(
                (opt) => opt.name.toLowerCase() === preset.name.toLowerCase()
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={isAdded}
                  className={`preset-btn ${isAdded ? 'added' : ''}`}
                  onClick={() => handleAddOption(preset.name, preset.values)}
                >
                  + {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Option Input */}
        <div className="add-option-row">
          <input
            type="text"
            className="diws-input"
            placeholder="Enter custom option name (e.g., Shaft Diameter, Pressure Rating)..."
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddOption(newOptionName);
              }
            }}
          />
          <button
            type="button"
            className="diws-btn diws-btn-copper"
            onClick={() => handleAddOption(newOptionName)}
          >
            <Plus size={16} /> Add Dimension
          </button>
        </div>

        {/* Active Options & Value Chips */}
        {variantOptions.length > 0 ? (
          <div className="options-list-grid">
            {variantOptions.map((opt) => (
              <div key={opt.id} className="option-card">
                <div className="option-card-header">
                  <span className="option-name">{opt.name}</span>
                  <button
                    type="button"
                    className="delete-option-btn"
                    onClick={() => handleRemoveOption(opt.id)}
                    title="Remove dimension"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Values Tags */}
                <div className="option-values-container">
                  <div className="values-chips-wrap">
                    {opt.values.map((val) => (
                      <span key={val} className="value-chip">
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(opt.id, val)}
                          className="chip-remove-btn"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {opt.values.length === 0 && (
                      <span className="no-values-hint">No values configured yet.</span>
                    )}
                  </div>

                  {/* Add Value Input */}
                  <div className="add-value-input-wrap">
                    <input
                      type="text"
                      className="diws-input-sm"
                      placeholder={`Add ${opt.name} value...`}
                      value={newValueInput[opt.id] || ''}
                      onChange={(e) =>
                        setNewValueInput((prev) => ({ ...prev, [opt.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(opt.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="add-value-btn"
                      onClick={() => handleAddValue(opt.id)}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-dimensions-notice">
            <p>No variant dimensions added. This product will be managed as a single standalone item.</p>
          </div>
        )}

        {variantOptions.length > 0 && (
          <div className="generate-matrix-bar">
            <div className="matrix-info">
              {variants.length > 0 ? (
                <span>
                  <strong>{variants.length}</strong> unique SKU combinations generated.
                </span>
              ) : (
                <span>Click generate to compute all combinatorial SKU variants.</span>
              )}
            </div>
            <button
              type="button"
              className="diws-btn diws-btn-primary"
              onClick={() => regenerateMatrix()}
            >
              <RefreshCw size={15} /> Re-Generate SKU Matrix
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: COMBINATORIAL MATRIX TABLE */}
      {variants.length > 0 && (
        <div className="variant-section-card matrix-card">
          <div className="variant-section-header">
            <div className="section-title-wrap">
              <Package className="text-copper" size={20} />
              <div>
                <h3 className="section-title">2. Combinatorial Variant Matrix & Inventory</h3>
                <p className="section-subtitle">
                  Configure specific SKUs, barcodes, price adjustments, and stock quotas for each variant combination.
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Operations Bar */}
          <div className="matrix-bulk-toolbar">
            <div className="bulk-group">
              <span className="bulk-label">Bulk Price Adjust (+/- $):</span>
              <input
                type="number"
                step="0.1"
                className="diws-input-sm bulk-input"
                placeholder="e.g. 25.00"
                value={bulkPriceAdjustment}
                onChange={(e) => setBulkPriceAdjustment(e.target.value)}
              />
              <button
                type="button"
                className="diws-btn-sm diws-btn-secondary"
                onClick={handleApplyBulkPrice}
              >
                Apply to All
              </button>
            </div>

            <div className="bulk-group">
              <span className="bulk-label">Bulk Stock Qty:</span>
              <input
                type="number"
                min="0"
                className="diws-input-sm bulk-input"
                placeholder="e.g. 50"
                value={bulkStockQuantity}
                onChange={(e) => setBulkStockQuantity(e.target.value)}
              />
              <button
                type="button"
                className="diws-btn-sm diws-btn-secondary"
                onClick={handleApplyBulkStock}
              >
                Apply to All
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="matrix-table-wrapper">
            <table className="variant-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Active</th>
                  <th>Variant Attributes</th>
                  <th>Generated SKU</th>
                  <th>Barcode</th>
                  <th>Price Adj. ($)</th>
                  <th>Final Price ($)</th>
                  <th>Cost ($)</th>
                  <th>Stock Qty</th>
                  <th>Low Alert</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => {
                  return (
                    <tr key={variant.id} className={!variant.isActive ? 'row-inactive' : ''}>
                      {/* Active toggle */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'isActive', e.target.checked)
                          }
                          className="diws-checkbox"
                        />
                      </td>

                      {/* Attribute Pills */}
                      <td>
                        <div className="matrix-attribute-badges">
                          {Object.entries(variant.attributes).map(([attrKey, attrVal]) => (
                            <span key={attrKey} className="matrix-attr-pill">
                              <span className="pill-key">{attrKey}:</span>
                              <span className="pill-val">{attrVal}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'sku', e.target.value)
                          }
                          className="matrix-table-input"
                        />
                      </td>

                      {/* Barcode */}
                      <td>
                        <input
                          type="text"
                          value={variant.barcode || ''}
                          placeholder="UPC / EAN"
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, 'barcode', e.target.value)
                          }
                          className="matrix-table-input barcode-input"
                        />
                      </td>

                      {/* Price Adjustment */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.priceAdjustment || 0}
                          onChange={(e) =>
                            handleUpdateVariant(
                              variant.id,
                              'priceAdjustment',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="matrix-table-input num-input"
                        />
                      </td>

                      {/* Final Price */}
                      <td>
                        <div className="final-price-badge">
                          ${variant.price.toFixed(2)}
                        </div>
                      </td>

                      {/* Cost */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.costPrice || costPrice}
                          onChange={(e) =>
                            handleUpdateVariant(
                              variant.id,
                              'costPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="matrix-table-input num-input"
                        />
                      </td>

                      {/* Stock Quantity */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={variant.stockQuantity}
                          onChange={(e) =>
                            handleUpdateVariant(
                              variant.id,
                              'stockQuantity',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="matrix-table-input num-input stock-input"
                        />
                      </td>

                      {/* Low Stock Alert */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={variant.minStockAlert || 5}
                          onChange={(e) =>
                            handleUpdateVariant(
                              variant.id,
                              'minStockAlert',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="matrix-table-input num-input"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantBuilder;
