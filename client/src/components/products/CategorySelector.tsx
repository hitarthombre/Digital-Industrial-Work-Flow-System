import React from 'react';
import type { IndustrialCategory } from '../../types/product';
import {
  Cpu,
  Wrench,
  Layers,
  Activity,
  Boxes,
  Zap,
  RotateCw,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const INDUSTRIAL_CATEGORIES: {
  category: IndustrialCategory;
  icon: React.ReactNode;
  description: string;
  subcategories: string[];
}[] = [
  {
    category: 'Industrial Automation',
    icon: <RotateCw size={18} />,
    description: 'Robotics, servo systems, motion controllers, PLC racks & HMIs',
    subcategories: ['Motion Control & Drives', 'Robotics & End-Effectors', 'Linear Actuators', 'HMIs & Displays'],
  },
  {
    category: 'CNC Tooling & Machining',
    icon: <Wrench size={18} />,
    description: 'End mills, carbide inserts, collets, tool holders & coolant systems',
    subcategories: ['Milling Cutters', 'Turning Inserts', 'Tool Holders (BT/CAT/HSK)', 'Workholding & Clamps'],
  },
  {
    category: 'Hydraulics & Pneumatics',
    icon: <Activity size={18} />,
    description: 'Pumps, proportional valves, cylinders, fittings & pressure lines',
    subcategories: ['Proportional Valves', 'Hydraulic Cylinders', 'Pneumatic Actuators', 'Pressure Regulators & Gauges'],
  },
  {
    category: 'Electronics & Sensors',
    icon: <Cpu size={18} />,
    description: 'Industrial sensors, edge gateways, encoders, power supplies & I/O',
    subcategories: ['Programmable Logic Controllers', 'Proximity & Optical Sensors', 'Power Supplies (DIN-Rail)', 'Encoders & Transducers'],
  },
  {
    category: 'Raw Materials & Alloys',
    icon: <Layers size={18} />,
    description: 'Billet stock, aerospace alloys, extruded aluminum & engineered plastics',
    subcategories: ['Titanium & Nickel Alloys', 'Tool & Stainless Steels', 'Extruded Aluminum Profiles', 'Engineering Polymers'],
  },
  {
    category: 'Fasteners & Hardware',
    icon: <Boxes size={18} />,
    description: 'High-tensile bolts, structural fasteners, bearings, pins & bushings',
    subcategories: ['Structural Fasteners', 'Precision Dowels & Pins', 'Industrial Bearings', 'Retaining Rings & Shims'],
  },
  {
    category: 'Power Transmission',
    icon: <Zap size={18} />,
    description: 'Gearboxes, timing belts, precision couplings, chains & sprockets',
    subcategories: ['Planetary Gearboxes', 'Flexible Couplings', 'Timing Belts & Pulleys', 'Roller Chains'],
  },
  {
    category: 'Safety & PPE',
    icon: <ShieldCheck size={18} />,
    description: 'Light curtains, emergency interlocks, lockout-tagout & operator gear',
    subcategories: ['Machine Safety Interlocks', 'Safety Light Curtains', 'LOTO Systems', 'Protective Enclosures'],
  },
];

interface CategorySelectorProps {
  selectedCategory: IndustrialCategory;
  selectedSubCategory?: string;
  onSelectCategory: (cat: IndustrialCategory) => void;
  onSelectSubCategory?: (subCat: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  onSelectSubCategory,
}) => {
  const currentCategoryData = INDUSTRIAL_CATEGORIES.find((c) => c.category === selectedCategory);

  return (
    <div className="product-category-selector">
      <div className="category-selection-label">Select Industrial Domain Category *</div>
      <div className="category-cards-grid">
        {INDUSTRIAL_CATEGORIES.map((item) => {
          const isSelected = item.category === selectedCategory;
          return (
            <button
              key={item.category}
              type="button"
              className={`category-pill-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCategory(item.category)}
            >
              <div className="category-pill-icon">{item.icon}</div>
              <div className="category-pill-text">
                <div className="category-pill-name">{item.category}</div>
                <div className="category-pill-sub">{item.description}</div>
              </div>
              {isSelected && (
                <span className="category-check-badge">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentCategoryData && currentCategoryData.subcategories.length > 0 && onSelectSubCategory && (
        <div className="subcategory-selector-section">
          <div className="subcategory-label">Suggested Subcategory / Taxonomy:</div>
          <div className="subcategory-chips">
            {currentCategoryData.subcategories.map((sub) => {
              const isSubActive = selectedSubCategory === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  className={`subcategory-chip ${isSubActive ? 'active' : ''}`}
                  onClick={() => onSelectSubCategory(isSubActive ? '' : sub)}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
