import { api } from './api';
import type {
  IProduct,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams,
  GetProductsResponse,
} from '../types/product';

const STORAGE_KEY = 'diws_product_catalog_v1';

// Industrial initial mock catalog data
const INITIAL_PRODUCTS: IProduct[] = [
  {
    _id: 'prod-001',
    skuPrefix: 'SRV-800',
    name: 'Heavy-Duty Industrial Brushless Servo Motor 3.5kW',
    brand: 'ApexMotion Dynamics',
    category: 'Industrial Automation',
    subCategory: 'Motion Control & Drives',
    description:
      'High-torque industrial synchronous AC servo motor engineered for high-precision CNC axis drives, robotic arms, and heavy industrial automation gantry systems. Features IP67 sealed casing and integrated 24-bit multi-turn optical encoder.',
    shortDescription: '3.5kW 3000RPM High-Torque Servo Motor with 24-bit Optical Absolute Encoder.',
    tags: ['Servo Motor', 'CNC', 'Automation', 'Robotics', 'IP67'],
    basePrice: 1420.0,
    costPrice: 890.0,
    msrp: 1750.0,
    currency: 'USD',
    taxRate: 18.0,
    status: 'active',
    isFeatured: true,
    leadTimeDays: 7,
    minOrderQuantity: 1,
    dimensions: {
      length: 285,
      width: 130,
      height: 130,
      unit: 'mm',
      weightKg: 8.4,
    },
    variantOptions: [
      {
        id: 'opt-1',
        name: 'Holding Brake',
        values: ['Without Brake', '24V Electromagnetic Brake'],
      },
      {
        id: 'opt-2',
        name: 'Shaft Type',
        values: ['Keyway 22mm', 'Smooth Shaft 22mm'],
      },
    ],
    variants: [
      {
        id: 'var-101',
        sku: 'SRV-800-NOBRK-KEY',
        barcode: '890123450011',
        attributes: { 'Holding Brake': 'Without Brake', 'Shaft Type': 'Keyway 22mm' },
        price: 1420.0,
        priceAdjustment: 0,
        costPrice: 890.0,
        stockQuantity: 45,
        minStockAlert: 10,
        weightKg: 8.4,
        isActive: true,
      },
      {
        id: 'var-102',
        sku: 'SRV-800-NOBRK-SMO',
        barcode: '890123450012',
        attributes: { 'Holding Brake': 'Without Brake', 'Shaft Type': 'Smooth Shaft 22mm' },
        price: 1420.0,
        priceAdjustment: 0,
        costPrice: 890.0,
        stockQuantity: 28,
        minStockAlert: 5,
        weightKg: 8.4,
        isActive: true,
      },
      {
        id: 'var-103',
        sku: 'SRV-800-BRK24-KEY',
        barcode: '890123450013',
        attributes: { 'Holding Brake': '24V Electromagnetic Brake', 'Shaft Type': 'Keyway 22mm' },
        price: 1610.0,
        priceAdjustment: 190.0,
        costPrice: 990.0,
        stockQuantity: 18,
        minStockAlert: 8,
        weightKg: 9.8,
        isActive: true,
      },
      {
        id: 'var-104',
        sku: 'SRV-800-BRK24-SMO',
        barcode: '890123450014',
        attributes: { 'Holding Brake': '24V Electromagnetic Brake', 'Shaft Type': 'Smooth Shaft 22mm' },
        price: 1610.0,
        priceAdjustment: 190.0,
        costPrice: 990.0,
        stockQuantity: 12,
        minStockAlert: 5,
        weightKg: 9.8,
        isActive: true,
      },
    ],
    customAttributes: [
      { id: 'attr-1', category: 'Electrical', name: 'Rated Power', value: '3.5', unit: 'kW' },
      { id: 'attr-2', category: 'Electrical', name: 'Input Voltage', value: '380 - 480', unit: 'V' },
      { id: 'attr-3', category: 'Mechanical', name: 'Rated Speed', value: '3000', unit: 'RPM' },
      { id: 'attr-4', category: 'Mechanical', name: 'Peak Torque', value: '33.4', unit: 'N·m' },
      { id: 'attr-5', category: 'Environmental', name: 'Ingress Protection', value: 'IP67' },
      { id: 'attr-6', category: 'Compliance', name: 'Certifications', value: 'CE, UL 1004-6, RoHS, ISO 9001' },
    ],
    media: [
      {
        id: 'img-1',
        name: 'servo_motor_isometric.webp',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 124500,
        isPrimary: true,
        type: 'image/jpeg',
        caption: 'Servo Motor Assembly & Thermal Housing',
      },
      {
        id: 'img-2',
        name: 'servo_motor_connectors.webp',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 98400,
        isPrimary: false,
        type: 'image/jpeg',
        caption: 'M23 Military-Grade Power & Encoder Connectors',
      },
      {
        id: 'img-3',
        name: 'servo_motor_testing.webp',
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 142000,
        isPrimary: false,
        type: 'image/jpeg',
        caption: 'Dyno Testing & Rotor Balance Calibration',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'SRV-800_Datasheet_Rev4.pdf',
        category: 'spec_sheet',
        fileSize: 1845000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-08-12T10:30:00Z',
        version: '4.2',
      },
      {
        id: 'doc-2',
        name: 'SRV-800_CAD_Assembly_3D.step',
        category: 'cad_drawing',
        fileSize: 14500000,
        fileType: 'application/step',
        url: '#',
        uploadedAt: '2026-08-14T14:15:00Z',
        version: '1.0',
      },
      {
        id: 'doc-3',
        name: 'Safety_MSDS_ThermalGrease_Coating.pdf',
        category: 'safety_data_sheet',
        fileSize: 640000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-08-15T09:00:00Z',
      },
    ],
    createdAt: '2026-08-10T12:00:00Z',
    updatedAt: '2026-09-15T08:45:00Z',
  },
  {
    _id: 'prod-002',
    skuPrefix: 'END-CAR',
    name: 'Precision Solid Carbide 4-Flute End Mill Set (AlTiN Coated)',
    brand: 'TitanCraft Cutters',
    category: 'CNC Tooling & Machining',
    subCategory: 'Milling Cutters',
    description:
      'Ultra-fine micrograin solid carbide end mill set designed for high-feed aggressive milling in stainless steel, titanium alloys, and pre-hardened tool steels up to 58 HRC. Features AlTiN nanofilm PVD coating and variable helix geometry to suppress harmonic chatter.',
    shortDescription: 'High-performance micrograin carbide end mill set for hardened steel & titanium.',
    tags: ['CNC Tooling', 'Carbide', 'End Mill', 'Machining', 'AlTiN'],
    basePrice: 185.0,
    costPrice: 72.0,
    msrp: 220.0,
    currency: 'USD',
    taxRate: 18.0,
    status: 'active',
    isFeatured: true,
    leadTimeDays: 2,
    minOrderQuantity: 5,
    dimensions: {
      length: 75,
      width: 12,
      height: 12,
      unit: 'mm',
      weightKg: 0.18,
    },
    variantOptions: [
      {
        id: 'opt-v1',
        name: 'Diameter',
        values: ['6mm', '8mm', '10mm', '12mm'],
      },
      {
        id: 'opt-v2',
        name: 'Flute Length',
        values: ['Standard Flute', 'Extended Reach'],
      },
    ],
    variants: [
      {
        id: 'var-201',
        sku: 'END-CAR-06-STD',
        barcode: '890123450021',
        attributes: { Diameter: '6mm', 'Flute Length': 'Standard Flute' },
        price: 185.0,
        priceAdjustment: 0,
        costPrice: 72.0,
        stockQuantity: 120,
        minStockAlert: 20,
        isActive: true,
      },
      {
        id: 'var-202',
        sku: 'END-CAR-06-EXT',
        barcode: '890123450022',
        attributes: { Diameter: '6mm', 'Flute Length': 'Extended Reach' },
        price: 215.0,
        priceAdjustment: 30.0,
        costPrice: 85.0,
        stockQuantity: 65,
        minStockAlert: 15,
        isActive: true,
      },
      {
        id: 'var-203',
        sku: 'END-CAR-12-STD',
        barcode: '890123450023',
        attributes: { Diameter: '12mm', 'Flute Length': 'Standard Flute' },
        price: 295.0,
        priceAdjustment: 110.0,
        costPrice: 115.0,
        stockQuantity: 8,
        minStockAlert: 15,
        isActive: true,
      },
    ],
    customAttributes: [
      { id: 'ca-1', category: 'Physical', name: 'Grain Size', value: '0.4', unit: 'μm' },
      { id: 'ca-2', category: 'Mechanical', name: 'Substrate Hardness', value: '92.5', unit: 'HRA' },
      { id: 'ca-3', category: 'General', name: 'Coating', value: 'AlTiN Nanocomposite' },
      { id: 'ca-4', category: 'Environmental', name: 'Max Operating Temp', value: '900', unit: '°C' },
    ],
    media: [
      {
        id: 'img-201',
        name: 'carbide_endmill_macro.webp',
        url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 154000,
        isPrimary: true,
        type: 'image/jpeg',
        caption: 'AlTiN 4-Flute Variable Helix Cutting Head',
      },
    ],
    documents: [
      {
        id: 'doc-201',
        name: 'Feeds_and_Speeds_CuttingParameters.pdf',
        category: 'spec_sheet',
        fileSize: 920000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-07-20T11:00:00Z',
      },
    ],
    createdAt: '2026-07-15T09:20:00Z',
    updatedAt: '2026-09-18T14:10:00Z',
  },
  {
    _id: 'prod-003',
    skuPrefix: 'HYD-VAL',
    name: 'Proportional Directional Hydraulic Valve 350 Bar D03',
    brand: 'HydroVortex Power',
    category: 'Hydraulics & Pneumatics',
    subCategory: 'Proportional Valves',
    description:
      'Direct-operated proportional directional spool valve for closed-loop position, pressure, and velocity control in automated metal forming presses, plastic injection molders, and heavy industrial machinery.',
    shortDescription: 'NG6/CETOP 3 electro-hydraulic proportional valve with integrated feedback LVDT.',
    tags: ['Hydraulics', 'Proportional Valve', 'CETOP 3', 'Fluid Power'],
    basePrice: 940.0,
    costPrice: 580.0,
    msrp: 1150.0,
    currency: 'USD',
    taxRate: 18.0,
    status: 'active',
    isFeatured: false,
    leadTimeDays: 14,
    minOrderQuantity: 1,
    dimensions: {
      length: 195,
      width: 70,
      height: 98,
      unit: 'mm',
      weightKg: 2.9,
    },
    variantOptions: [
      {
        id: 'opt-h1',
        name: 'Spool Configuration',
        values: ['Closed Center (E)', 'Float Center (D)', 'Regenerative (P)'],
      },
      {
        id: 'opt-h2',
        name: 'Command Signal',
        values: ['±10V Voltage', '4-20mA Current'],
      },
    ],
    variants: [
      {
        id: 'var-301',
        sku: 'HYD-VAL-E-10V',
        barcode: '890123450031',
        attributes: { 'Spool Configuration': 'Closed Center (E)', 'Command Signal': '±10V Voltage' },
        price: 940.0,
        priceAdjustment: 0,
        costPrice: 580.0,
        stockQuantity: 24,
        minStockAlert: 6,
        isActive: true,
      },
      {
        id: 'var-302',
        sku: 'HYD-VAL-E-20MA',
        barcode: '890123450032',
        attributes: { 'Spool Configuration': 'Closed Center (E)', 'Command Signal': '4-20mA Current' },
        price: 980.0,
        priceAdjustment: 40.0,
        costPrice: 610.0,
        stockQuantity: 16,
        minStockAlert: 4,
        isActive: true,
      },
    ],
    customAttributes: [
      { id: 'ha-1', category: 'Physical', name: 'Max Operating Pressure', value: '350', unit: 'bar' },
      { id: 'ha-2', category: 'Physical', name: 'Nominal Flow Rate', value: '40', unit: 'L/min' },
      { id: 'ha-3', category: 'Electrical', name: 'Supply Voltage', value: '24', unit: 'VDC' },
      { id: 'ha-4', category: 'Environmental', name: 'Fluid Viscosity Range', value: '20 - 380', unit: 'cSt' },
    ],
    media: [
      {
        id: 'img-301',
        name: 'hydraulic_manifold_valve.webp',
        url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 138000,
        isPrimary: true,
        type: 'image/jpeg',
        caption: 'Proportional Valve Subplate Mount CETOP 03',
      },
    ],
    documents: [
      {
        id: 'doc-301',
        name: 'HydroVortex_Valve_HydraulicSchematics.pdf',
        category: 'spec_sheet',
        fileSize: 3100000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-06-10T16:00:00Z',
      },
      {
        id: 'doc-302',
        name: 'CE_Conformity_Declaration.pdf',
        category: 'compliance_cert',
        fileSize: 420000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-06-10T16:05:00Z',
      },
    ],
    createdAt: '2026-06-05T08:00:00Z',
    updatedAt: '2026-09-02T10:15:00Z',
  },
  {
    _id: 'prod-004',
    skuPrefix: 'PLC-X9',
    name: 'Modular Industrial PAC / PLC Edge Controller System',
    brand: 'NexusLogic Systems',
    category: 'Electronics & Sensors',
    subCategory: 'Programmable Logic Controllers',
    description:
      'Quad-core industrial programmable automation controller (PAC) featuring native OPC UA, dual gigabit TSN Ethernet, Modbus TCP/IP, and hot-swappable I/O backplane. Supports IEC 61131-3 languages and Python edge analytics runtime.',
    shortDescription: 'High-speed quad-core PLC with native OPC-UA and TSN industrial networking.',
    tags: ['PLC', 'OPC-UA', 'Industry 4.0', 'SCADA', 'Automation'],
    basePrice: 2150.0,
    costPrice: 1350.0,
    msrp: 2600.0,
    currency: 'USD',
    taxRate: 18.0,
    status: 'active',
    isFeatured: true,
    leadTimeDays: 10,
    minOrderQuantity: 1,
    dimensions: {
      length: 160,
      width: 110,
      height: 125,
      unit: 'mm',
      weightKg: 1.25,
    },
    variantOptions: [
      {
        id: 'opt-p1',
        name: 'Processor & Memory',
        values: ['Standard 4GB RAM / 32GB eMMC', 'Enterprise 8GB RAM / 128GB NVMe'],
      },
      {
        id: 'opt-p2',
        name: 'Fieldbus Protocol',
        values: ['EtherCAT Master', 'PROFINET IRT', 'EtherNet/IP'],
      },
    ],
    variants: [
      {
        id: 'var-401',
        sku: 'PLC-X9-STD-ECAT',
        barcode: '890123450041',
        attributes: { 'Processor & Memory': 'Standard 4GB RAM / 32GB eMMC', 'Fieldbus Protocol': 'EtherCAT Master' },
        price: 2150.0,
        priceAdjustment: 0,
        costPrice: 1350.0,
        stockQuantity: 32,
        minStockAlert: 8,
        isActive: true,
      },
      {
        id: 'var-402',
        sku: 'PLC-X9-ENT-ECAT',
        barcode: '890123450042',
        attributes: { 'Processor & Memory': 'Enterprise 8GB RAM / 128GB NVMe', 'Fieldbus Protocol': 'EtherCAT Master' },
        price: 2580.0,
        priceAdjustment: 430.0,
        costPrice: 1620.0,
        stockQuantity: 14,
        minStockAlert: 5,
        isActive: true,
      },
    ],
    customAttributes: [
      { id: 'pa-1', category: 'Electrical', name: 'Power Consumption', value: '18', unit: 'W' },
      { id: 'pa-2', category: 'General', name: 'Operating System', value: 'Real-Time Linux (PREEMPT_RT)' },
      { id: 'pa-3', category: 'Environmental', name: 'Operating Temp Range', value: '-25 to +70', unit: '°C' },
      { id: 'pa-4', category: 'Compliance', name: 'EMC Immunity', value: 'EN 61131-2 Zone B' },
    ],
    media: [
      {
        id: 'img-401',
        name: 'plc_controller_front.webp',
        url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 162000,
        isPrimary: true,
        type: 'image/jpeg',
        caption: 'DIN-Rail Mount Controller Chassis with Status LEDs',
      },
    ],
    documents: [
      {
        id: 'doc-401',
        name: 'NexusLogic_PLC_X9_HardwareManual.pdf',
        category: 'user_manual',
        fileSize: 5800000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-05-18T10:00:00Z',
      },
    ],
    createdAt: '2026-05-12T14:30:00Z',
    updatedAt: '2026-09-12T11:20:00Z',
  },
  {
    _id: 'prod-005',
    skuPrefix: 'FST-TI6',
    name: 'Grade 5 Aerospace Titanium Hex Flange Bolts (M8 to M16)',
    brand: 'AeroFast Precision',
    category: 'Fasteners & Hardware',
    subCategory: 'Structural Fasteners',
    description:
      'Ultra-lightweight high-tensile Ti-6Al-4V Grade 5 titanium flanged hex head bolts. Precision rolled threads according to ISO 965 tolerance standards. Exceptional corrosion resistance in marine, aerospace, and aggressive chemical processing environments.',
    shortDescription: 'Grade 5 (Ti-6Al-4V) titanium rolled thread flanged bolts, high strength-to-weight.',
    tags: ['Titanium', 'Fasteners', 'Bolts', 'Aerospace', 'Ti-6Al-4V'],
    basePrice: 14.5,
    costPrice: 5.2,
    msrp: 19.0,
    currency: 'USD',
    taxRate: 18.0,
    status: 'active',
    isFeatured: false,
    leadTimeDays: 3,
    minOrderQuantity: 50,
    dimensions: {
      length: 50,
      width: 14,
      height: 14,
      unit: 'mm',
      weightKg: 0.024,
    },
    variantOptions: [
      {
        id: 'opt-f1',
        name: 'Thread Size',
        values: ['M8 x 1.25', 'M10 x 1.50', 'M12 x 1.75'],
      },
      {
        id: 'opt-f2',
        name: 'Length',
        values: ['30mm', '45mm', '60mm'],
      },
    ],
    variants: [
      {
        id: 'var-501',
        sku: 'FST-TI6-M8-30',
        barcode: '890123450051',
        attributes: { 'Thread Size': 'M8 x 1.25', Length: '30mm' },
        price: 14.5,
        priceAdjustment: 0,
        costPrice: 5.2,
        stockQuantity: 850,
        minStockAlert: 100,
        isActive: true,
      },
      {
        id: 'var-502',
        sku: 'FST-TI6-M10-45',
        barcode: '890123450052',
        attributes: { 'Thread Size': 'M10 x 1.50', Length: '45mm' },
        price: 18.2,
        priceAdjustment: 3.7,
        costPrice: 6.8,
        stockQuantity: 420,
        minStockAlert: 50,
        isActive: true,
      },
      {
        id: 'var-503',
        sku: 'FST-TI6-M12-60',
        barcode: '890123450053',
        attributes: { 'Thread Size': 'M12 x 1.75', Length: '60mm' },
        price: 24.0,
        priceAdjustment: 9.5,
        costPrice: 9.1,
        stockQuantity: 0,
        minStockAlert: 50,
        isActive: false,
      },
    ],
    customAttributes: [
      { id: 'fa-1', category: 'Mechanical', name: 'Tensile Strength', value: '950', unit: 'MPa' },
      { id: 'fa-2', category: 'Mechanical', name: 'Yield Strength', value: '880', unit: 'MPa' },
      { id: 'fa-3', category: 'Physical', name: 'Density', value: '4.43', unit: 'g/cm³' },
      { id: 'fa-4', category: 'Compliance', name: 'Specification', value: 'ASTM B348 / AMS 4928' },
    ],
    media: [
      {
        id: 'img-501',
        name: 'titanium_bolts_flanged.webp',
        url: 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=800&q=80',
        sizeBytes: 110000,
        isPrimary: true,
        type: 'image/jpeg',
        caption: 'Ti-6Al-4V Flanged Hex Fasteners',
      },
    ],
    documents: [
      {
        id: 'doc-501',
        name: 'Titanium_Fasteners_Mechanical_Certificate.pdf',
        category: 'compliance_cert',
        fileSize: 480000,
        fileType: 'application/pdf',
        url: '#',
        uploadedAt: '2026-04-14T09:00:00Z',
      },
    ],
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-08-30T15:40:00Z',
  },
];

class ProductService {
  private getLocalCatalog(): IProduct[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
  }

  private saveLocalCatalog(products: IProduct[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  async getProducts(params: ProductFilterParams = {}): Promise<GetProductsResponse> {
    try {
      // Attempt backend API call first
      const queryParams: Record<string, string | number> = {};
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.search) queryParams.search = params.search;
      if (params.category && params.category !== 'ALL') queryParams.category = params.category;
      if (params.status && params.status !== 'ALL') queryParams.status = params.status;

      const response = await api.get<GetProductsResponse>('/products', { params: queryParams });
      if (response && response.data) {
        return response;
      }
    } catch (_) {
      // Backend not running or endpoint not yet registered, fall through to local persistence
    }

    // Local in-memory filtering & pagination
    let items = this.getLocalCatalog();

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.skuPrefix.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q))
      );
    }

    if (params.category && params.category !== 'ALL') {
      items = items.filter((p) => p.category === params.category);
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter((p) => p.status === params.status);
    }

    // Sort
    const sortBy = params.sortBy || 'updatedAt';
    const sortOrder = params.sortOrder || 'desc';
    items.sort((a, b) => {
      let valA: any = a[sortBy as keyof IProduct] || '';
      let valB: any = b[sortBy as keyof IProduct] || '';
      if (sortBy === 'stock') {
        valA = a.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
        valB = b.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
      }
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const page = params.page || 1;
    const limit = params.limit || 12;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = items.slice((page - 1) * limit, page * limit);

    // Compute Catalog Metrics
    const allItems = this.getLocalCatalog();
    const activeCount = allItems.filter((p) => p.status === 'active').length;
    const lowStockCount = allItems.filter((p) =>
      p.variants.some((v) => v.stockQuantity <= (v.minStockAlert || 10))
    ).length;
    const categoriesSet = new Set(allItems.map((p) => p.category));
    const totalVariants = allItems.reduce((acc, p) => acc + p.variants.length, 0);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      metrics: {
        totalProducts: allItems.length,
        activeCount,
        lowStockCount,
        totalCategories: categoriesSet.size,
        totalVariants,
      },
    };
  }

  async getProductById(id: string): Promise<IProduct> {
    try {
      const response = await api.get<{ success: boolean; data: IProduct }>(`/products/${id}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (_) {
      // fallback
    }

    const items = this.getLocalCatalog();
    const found = items.find((p) => p._id === id);
    if (!found) {
      throw new Error(`Product with ID "${id}" was not found.`);
    }
    return found;
  }

  async createProduct(input: CreateProductInput): Promise<IProduct> {
    try {
      const response = await api.post<{ success: boolean; data: IProduct }>('/products', input);
      if (response && response.data) {
        return response.data;
      }
    } catch (_) {
      // fallback
    }

    const items = this.getLocalCatalog();
    const now = new Date().toISOString();
    const newProduct: IProduct = {
      ...input,
      _id: `prod-${Date.now()}`,
      tags: input.tags || [],
      currency: input.currency || 'USD',
      status: input.status || 'draft',
      variantOptions: input.variantOptions || [],
      variants: input.variants || [],
      customAttributes: input.customAttributes || [],
      media: input.media || [],
      documents: input.documents || [],
      createdAt: now,
      updatedAt: now,
    };

    items.unshift(newProduct);
    this.saveLocalCatalog(items);
    return newProduct;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<IProduct> {
    try {
      const response = await api.put<{ success: boolean; data: IProduct }>(`/products/${id}`, input);
      if (response && response.data) {
        return response.data;
      }
    } catch (_) {
      // fallback
    }

    const items = this.getLocalCatalog();
    const index = items.findIndex((p) => p._id === id);
    if (index === -1) {
      throw new Error(`Product with ID "${id}" was not found.`);
    }

    const updatedProduct: IProduct = {
      ...items[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updatedProduct;
    this.saveLocalCatalog(items);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await api.delete(`/products/${id}`);
    } catch (_) {
      // fallback
    }

    const items = this.getLocalCatalog();
    const filtered = items.filter((p) => p._id !== id);
    this.saveLocalCatalog(filtered);
    return true;
  }

  async duplicateProduct(id: string): Promise<IProduct> {
    const original = await this.getProductById(id);
    const duplicatedInput: CreateProductInput = {
      ...original,
      name: `${original.name} (Copy)`,
      skuPrefix: `${original.skuPrefix}-COPY`,
      status: 'draft',
      variants: original.variants.map((v, i) => ({
        ...v,
        id: `var-copy-${Date.now()}-${i}`,
        sku: `${v.sku}-COPY`,
      })),
    };

    return this.createProduct(duplicatedInput);
  }
}

export const productService = new ProductService();
