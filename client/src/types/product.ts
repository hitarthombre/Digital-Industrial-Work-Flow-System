export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock' | 'discontinued';

export type IndustrialCategory = 
  | 'Industrial Automation'
  | 'CNC Tooling & Machining'
  | 'Raw Materials & Alloys'
  | 'Hydraulics & Pneumatics'
  | 'Fasteners & Hardware'
  | 'Electronics & Sensors'
  | 'Power Transmission'
  | 'Safety & PPE';

export interface IVariantOption {
  id: string;
  name: string; // e.g., "Size", "Material", "Voltage", "Finish"
  values: string[]; // e.g., ["M6", "M8", "M10"]
}

export interface IProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>; // e.g., { "Size": "M8", "Material": "Stainless Steel 316" }
  price: number; // Final variant price
  priceAdjustment?: number; // Delta relative to base price (+ or -)
  costPrice?: number;
  stockQuantity: number;
  minStockAlert?: number;
  weightKg?: number;
  isActive: boolean;
}

export type AttributeCategory = 'General' | 'Physical' | 'Electrical' | 'Mechanical' | 'Environmental' | 'Compliance';

export interface ICustomAttribute {
  id: string;
  category: AttributeCategory;
  name: string; // e.g., "Operating Temperature", "Tensile Strength", "Input Voltage"
  value: string; // e.g., "-20°C to +85°C", "800", "24"
  unit?: string; // e.g., "°C", "MPa", "VDC", "mm", "kg"
}

export interface IProductMedia {
  id: string;
  name: string;
  url: string; // data URL or hosted link
  sizeBytes: number;
  isPrimary: boolean;
  type: string; // 'image/png', 'image/jpeg', etc.
  caption?: string;
}

export type DocumentCategory = 
  | 'spec_sheet' 
  | 'cad_drawing' 
  | 'safety_data_sheet' 
  | 'user_manual' 
  | 'compliance_cert';

export interface IProductDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileSize: number;
  fileType: string; // 'application/pdf', 'application/step', etc.
  url: string;
  uploadedAt: string;
  version?: string;
}

export interface IProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: 'mm' | 'cm' | 'm' | 'in';
  weightKg?: number;
}

export interface IProduct {
  _id: string;
  skuPrefix: string;
  name: string;
  brand: string;
  category: IndustrialCategory;
  subCategory?: string;
  description: string;
  shortDescription?: string;
  tags: string[];
  
  // Pricing
  basePrice: number;
  costPrice: number;
  msrp?: number;
  currency: string;
  taxRate?: number;
  
  // Status & Visibility
  status: ProductStatus;
  isFeatured?: boolean;
  
  // Manufacturing & Inventory Specs
  leadTimeDays?: number;
  minOrderQuantity?: number;
  targetWarehouseId?: string;
  targetFactoryId?: string;
  dimensions?: IProductDimensions;
  
  // Dynamic Structure
  variantOptions: IVariantOption[];
  variants: IProductVariant[];
  customAttributes: ICustomAttribute[];
  
  // Attachments
  media: IProductMedia[];
  documents: IProductDocument[];
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateProductInput {
  name: string;
  skuPrefix: string;
  brand: string;
  category: IndustrialCategory;
  subCategory?: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  basePrice: number;
  costPrice: number;
  msrp?: number;
  currency?: string;
  taxRate?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  leadTimeDays?: number;
  minOrderQuantity?: number;
  dimensions?: IProductDimensions;
  variantOptions?: IVariantOption[];
  variants?: IProductVariant[];
  customAttributes?: ICustomAttribute[];
  media?: IProductMedia[];
  documents?: IProductDocument[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  _id: string;
}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: 'name' | 'price' | 'stock' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetProductsResponse {
  success: boolean;
  data: IProduct[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics?: {
    totalProducts: number;
    activeCount: number;
    lowStockCount: number;
    totalCategories: number;
    totalVariants: number;
  };
}
