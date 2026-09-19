import React, { useState } from 'react';
import type { ICustomAttribute, AttributeCategory } from '../../types/product';
import {
  Plus,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';

interface CustomAttributesBuilderProps {
  attributes: ICustomAttribute[];
  onChangeAttributes: (attributes: ICustomAttribute[]) => void;
}

const ATTRIBUTE_CATEGORIES: AttributeCategory[] = [
  'General',
  'Physical',
  'Mechanical',
  'Electrical',
  'Environmental',
  'Compliance',
];

const PRESET_SUGGESTIONS: {
  category: AttributeCategory;
  name: string;
  defaultUnit?: string;
  placeholder: string;
}[] = [
  { category: 'Mechanical', name: 'Tensile Strength', defaultUnit: 'MPa', placeholder: 'e.g. 850' },
  { category: 'Mechanical', name: 'Max Operating RPM', defaultUnit: 'RPM', placeholder: 'e.g. 6000' },
  { category: 'Mechanical', name: 'Continuous Torque', defaultUnit: 'N·m', placeholder: 'e.g. 18.5' },
  { category: 'Mechanical', name: 'Material Hardness', defaultUnit: 'HRC', placeholder: 'e.g. 58-62' },
  { category: 'Electrical', name: 'Nominal Operating Voltage', defaultUnit: 'V', placeholder: 'e.g. 24 or 400' },
  { category: 'Electrical', name: 'Rated Current', defaultUnit: 'A', placeholder: 'e.g. 12.5' },
  { category: 'Electrical', name: 'Power Consumption', defaultUnit: 'kW', placeholder: 'e.g. 3.2' },
  { category: 'Environmental', name: 'Ingress Protection', defaultUnit: '', placeholder: 'e.g. IP67 / NEMA 4X' },
  { category: 'Environmental', name: 'Operating Temp Range', defaultUnit: '°C', placeholder: 'e.g. -20 to +85' },
  { category: 'Physical', name: 'Outer Diameter', defaultUnit: 'mm', placeholder: 'e.g. 65' },
  { category: 'Physical', name: 'Tolerance Class', defaultUnit: '', placeholder: 'e.g. ISO 2768-m' },
  { category: 'Compliance', name: 'Safety Standards', defaultUnit: '', placeholder: 'e.g. CE, UL 508A, RoHS' },
];

const COMMON_UNITS = [
  '',
  'mm',
  'cm',
  'm',
  'in',
  'kg',
  'g',
  'lbs',
  'V',
  'VDC',
  'VAC',
  'A',
  'mA',
  'W',
  'kW',
  'hp',
  'N·m',
  'RPM',
  'Hz',
  'bar',
  'psi',
  'MPa',
  'GPa',
  '°C',
  '°F',
  'μm',
  'HRC',
  'HRA',
  'cSt',
  'L/min',
  'GPM',
  'dB',
];

export const CustomAttributesBuilder: React.FC<CustomAttributesBuilderProps> = ({
  attributes,
  onChangeAttributes,
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  // New attribute form state
  const [newCategory, setNewCategory] = useState<AttributeCategory>('Mechanical');
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const handleAddAttribute = () => {
    if (!newName.trim() || !newValue.trim()) return;

    const newAttr: ICustomAttribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: newCategory,
      name: newName.trim(),
      value: newValue.trim(),
      unit: newUnit.trim() || undefined,
    };

    onChangeAttributes([...attributes, newAttr]);
    setNewName('');
    setNewValue('');
    setNewUnit('');
  };

  const handleAddPreset = (preset: (typeof PRESET_SUGGESTIONS)[0]) => {
    setNewCategory(preset.category);
    setNewName(preset.name);
    setNewUnit(preset.defaultUnit || '');
  };

  const handleRemoveAttribute = (id: string) => {
    onChangeAttributes(attributes.filter((a) => a.id !== id));
  };

  const handleUpdateAttribute = (id: string, field: keyof ICustomAttribute, val: string) => {
    onChangeAttributes(
      attributes.map((a) => (a.id === id ? { ...a, [field]: val } : a))
    );
  };

  const filteredAttributes =
    activeCategoryFilter === 'ALL'
      ? attributes
      : attributes.filter((a) => a.category === activeCategoryFilter);

  return (
    <div className="custom-attributes-builder">
      {/* Quick Presets Bar */}
      <div className="attributes-presets-box">
        <div className="presets-header">
          <Sparkles size={16} className="text-copper" />
          <span>Quick Industrial Specification Presets (Click to autofill):</span>
        </div>
        <div className="presets-list">
          {PRESET_SUGGESTIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handleAddPreset(preset)}
            >
              <span className="preset-cat-tag">{preset.category}:</span> {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Attribute Row */}
      <div className="add-attribute-card">
        <div className="add-attr-title">Add Technical Specification / Custom Attribute</div>
        <div className="add-attr-form-grid">
          {/* Category Select */}
          <div className="form-cell category-cell">
            <label>Domain Group</label>
            <select
              className="diws-select"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as AttributeCategory)}
            >
              {ATTRIBUTE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Specification Name */}
          <div className="form-cell name-cell">
            <label>Attribute Name *</label>
            <input
              type="text"
              className="diws-input"
              placeholder="e.g. Ingress Protection, Tensile Yield..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAttribute();
                }
              }}
            />
          </div>

          {/* Value */}
          <div className="form-cell value-cell">
            <label>Value *</label>
            <input
              type="text"
              className="diws-input"
              placeholder="e.g. 850 or IP67 or 24-48"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAttribute();
                }
              }}
            />
          </div>

          {/* Unit */}
          <div className="form-cell unit-cell">
            <label>Unit (Optional)</label>
            <input
              type="text"
              list="common-units-list"
              className="diws-input"
              placeholder="mm, V, MPa..."
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
            <datalist id="common-units-list">
              {COMMON_UNITS.map((u, i) => (
                <option key={i} value={u} />
              ))}
            </datalist>
          </div>

          {/* Add Button */}
          <div className="form-cell button-cell">
            <label>&nbsp;</label>
            <button
              type="button"
              className="diws-btn diws-btn-primary full-width"
              onClick={handleAddAttribute}
              disabled={!newName.trim() || !newValue.trim()}
            >
              <Plus size={16} /> Add Spec
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="attributes-filter-bar">
        <div className="filter-tab-buttons">
          <button
            type="button"
            className={`filter-tab-btn ${activeCategoryFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('ALL')}
          >
            All Specs ({attributes.length})
          </button>
          {ATTRIBUTE_CATEGORIES.map((cat) => {
            const count = attributes.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`filter-tab-btn ${activeCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Attributes Table */}
      {filteredAttributes.length > 0 ? (
        <div className="attributes-table-container">
          <table className="custom-attributes-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Category</th>
                <th>Specification Name</th>
                <th>Value</th>
                <th style={{ width: '100px' }}>Unit</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAttributes.map((attr) => (
                <tr key={attr.id}>
                  <td>
                    <span className={`category-tag tag-${attr.category.toLowerCase()}`}>
                      {attr.category}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleUpdateAttribute(attr.id, 'name', e.target.value)}
                      className="inline-edit-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleUpdateAttribute(attr.id, 'value', e.target.value)}
                      className="inline-edit-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attr.unit || ''}
                      placeholder="—"
                      onChange={(e) => handleUpdateAttribute(attr.id, 'unit', e.target.value)}
                      className="inline-edit-input unit-input"
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="delete-attr-btn"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      title="Remove specification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-attributes-state">
          <Info size={28} className="text-muted" />
          <p>
            No technical specifications in this section. Use the form above or pick a quick preset to add specifications.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomAttributesBuilder;
