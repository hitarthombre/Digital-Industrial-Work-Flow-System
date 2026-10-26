import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { EmailVerification } from '../models/EmailVerification';
import { PasswordReset } from '../models/PasswordReset';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { Factory } from '../models/Factory';
import { Warehouse } from '../models/Warehouse';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Variant } from '../models/Variant';
import { Inventory } from '../models/Inventory';
import { StockMovement } from '../models/StockMovement';
import { StockTransfer } from '../models/StockTransfer';
import { StockAdjustment } from '../models/StockAdjustment';
import { LowStockAlert } from '../models/LowStockAlert';
import { Supplier } from '../models/Supplier';
import { Customer } from '../models/Customer';
import { PurchaseRequest } from '../models/PurchaseRequest';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { GoodsReceiptNote } from '../models/GoodsReceiptNote';
import { PurchaseReturn } from '../models/PurchaseReturn';
import { WorkOrder } from '../models/WorkOrder';
import { ProductionPlan } from '../models/ProductionPlan';
import { Quotation } from '../models/Quotation';
import { SalesOrder } from '../models/SalesOrder';
import { SalesInvoice } from '../models/SalesInvoice';
import { DispatchOrder } from '../models/DispatchOrder';
import { DocumentModel } from '../models/Document';
import { SavedFilter } from '../models/SavedFilter';
import { UserInvitation } from '../models/UserInvitation';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from '../services/role.service';

async function resetAndSeed() {
  try {
    console.log('--- Connecting to MongoDB Atlas ---');
    await connectDB();

    console.log('\n--- 1. Clearing All Business Data (Preserving Roles & Permissions) ---');

    await Company.deleteMany({});
    await User.deleteMany({});
    await UserInvitation.deleteMany({});
    await Session.deleteMany({});
    await EmailVerification.deleteMany({});
    await PasswordReset.deleteMany({});
    await Factory.deleteMany({});
    await Warehouse.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Variant.deleteMany({});
    await Inventory.deleteMany({});
    await StockMovement.deleteMany({});
    await StockTransfer.deleteMany({});
    await StockAdjustment.deleteMany({});
    await LowStockAlert.deleteMany({});
    await Supplier.deleteMany({});
    await Customer.deleteMany({});
    await PurchaseRequest.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await GoodsReceiptNote.deleteMany({});
    await PurchaseReturn.deleteMany({});
    await WorkOrder.deleteMany({});
    await ProductionPlan.deleteMany({});
    await Quotation.deleteMany({});
    await SalesOrder.deleteMany({});
    await SalesInvoice.deleteMany({});
    await DispatchOrder.deleteMany({});
    await DocumentModel.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await SavedFilter.deleteMany({});

    console.log('✓ Cleared all operational tables.');

    console.log('\n--- 2. Ensuring Roles & Permissions are Complete ---');
    for (const perm of SYSTEM_PERMISSIONS) {
      await Permission.updateOne({ code: perm.code }, { $set: perm }, { upsert: true });
    }

    const allPermissionCodes = SYSTEM_PERMISSIONS.map((p) => p.code);

    // Seed/Update System Roles
    for (const roleDef of DEFAULT_ROLES) {
      let perms = roleDef.permissions;
      if (roleDef.name === 'Company Owner' || roleDef.name === 'Company Admin') {
        perms = allPermissionCodes;
      } else if (roleDef.name === 'Factory Manager') {
        perms = Array.from(new Set([
          ...roleDef.permissions,
          'factories:create',
          'factories:read',
          'factories:update',
          'factories:delete',
        ]));
      }

      await Role.updateOne(
        { name: roleDef.name, companyId: null },
        {
          $set: {
            name: roleDef.name,
            description: roleDef.description,
            permissions: perms,
            isSystemRole: true,
          },
        },
        { upsert: true }
      );
    }

    const ownerRole = await Role.findOne({ name: 'Company Owner' });
    if (!ownerRole) throw new Error('Company Owner role not found!');

    console.log('✓ System permissions and default roles are up to date.');

    console.log('\n--- 3. Creating Primary Company Workspace ---');
    const company = await Company.create({
      name: 'Apex Industrial Corp',
      code: 'APEX',
      industry: 'Industrial Machinery & Heavy Discrete Manufacturing',
      email: 'hitarththombre@gmail.com',
      phone: '+91 9898541230',
      address: '100 Industrial Boulevard, GIDC Estate',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
      postalCode: '391750',
      gstNumber: '24AAACA9840M1Z2',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'active',
      subscriptionPlan: 'enterprise',
      branding: {
        displayName: 'Apex Industrial Corp',
        primaryColor: '#b45309',
      },
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
      },
      isDeleted: false,
    });
    console.log(`✓ Created Company: ${company.name} (${company.code}) - ID: ${company._id}`);

    console.log('\n--- 4. Creating Primary Super-User (hitarththombre@gmail.com) ---');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const user = await User.create({
      companyId: company._id,
      firstName: 'Hitarth',
      lastName: 'Thombre',
      email: 'hitarththombre@gmail.com',
      phone: '+91 9898541230',
      passwordHash,
      role: 'Company Owner',
      roleId: ownerRole._id,
      status: 'active',
      isEmailVerified: true,
    });
    console.log(`✓ Created User: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);

    console.log('\n--- 5. Creating Real Factories ---');
    const fac1 = await Factory.create({
      companyId: company._id,
      name: 'Vadodara Heavy Machinery Plant',
      code: 'FAC-VAD-01',
      description: 'Primary fabrication and CNC machining facility for structural hydraulic systems.',
      location: {
        address: 'Plot 42, GIDC Industrial Estate, Ranoli',
        city: 'Vadodara',
        state: 'Gujarat',
        country: 'India',
        postalCode: '391750',
        latitude: 22.385,
        longitude: 73.181,
      },
      managerId: user._id,
      contactEmail: 'hitarththombre@gmail.com',
      contactPhone: '+91 9898541230',
      capacity: 1500,
      totalSqFt: 65000,
      shiftCount: 3,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      operatingHours: '24 Hours (3 Shifts)',
      status: 'active',
      isDeleted: false,
      createdBy: user._id,
    });

    const fac2 = await Factory.create({
      companyId: company._id,
      name: 'Gujarat Precision Assembly Facility',
      code: 'FAC-GUJ-02',
      description: 'Cleanroom precision assembly and electronic testing facility.',
      location: {
        address: 'Sector 18, Savli Industrial Zone',
        city: 'Vadodara',
        state: 'Gujarat',
        country: 'India',
        postalCode: '391775',
      },
      managerId: user._id,
      contactEmail: 'plant2@apexindustrial.com',
      contactPhone: '+91 9876543210',
      capacity: 2000,
      totalSqFt: 45000,
      shiftCount: 2,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      operatingHours: '08:00 - 20:00 (2 Shifts)',
      status: 'active',
      isDeleted: false,
      createdBy: user._id,
    });
    console.log(`✓ Created 2 Factories: ${fac1.code}, ${fac2.code}`);

    console.log('\n--- 6. Creating Real Warehouses ---');
    const wh1 = await Warehouse.create({
      companyId: company._id,
      name: 'Central Logistics Hub & Raw Material Depot',
      code: 'WH-RAW-01',
      type: 'raw_material',
      description: 'Bulk raw steel sheets, bar stock, castings, and standard fasteners depot.',
      address: 'Plot 42-B, GIDC Ranoli, Vadodara, Gujarat',
      capacity: 50000,
      currentUsage: 18500,
      managerId: user._id,
      contactEmail: 'hitarththombre@gmail.com',
      contactPhone: '+91 9898541230',
      status: 'active',
      isDeleted: false,
      createdBy: user._id,
    });

    const wh2 = await Warehouse.create({
      companyId: company._id,
      name: 'Finished Goods Distribution Depot',
      code: 'WH-FG-02',
      type: 'finished_goods',
      description: 'Climate-controlled warehouse for packaged actuators and outbound shipments.',
      address: 'Sector 18-A, Savli Logistics Park, Vadodara, Gujarat',
      capacity: 35000,
      currentUsage: 12000,
      managerId: user._id,
      contactEmail: 'logistics@apexindustrial.com',
      contactPhone: '+91 9876543211',
      status: 'active',
      isDeleted: false,
      createdBy: user._id,
    });
    console.log(`✓ Created 2 Warehouses: ${wh1.code}, ${wh2.code}`);

    console.log('\n--- 7. Creating Product Categories & Master Products ---');
    const catRaw = await Category.create({
      companyId: company._id,
      name: 'Raw Materials & Structural Metals',
      code: 'CAT-RAW',
      description: 'Industrial plate stock, alloy round bars, and unworked metals.',
      status: 'active',
      createdBy: user._id,
    });

    const catWip = await Category.create({
      companyId: company._id,
      name: 'Machined Components & Sub-Assemblies (WIP)',
      code: 'CAT-WIP',
      description: 'CNC turned shafts, machined pistons, and pre-assembled housings.',
      status: 'active',
      createdBy: user._id,
    });

    const catFg = await Category.create({
      companyId: company._id,
      name: 'Finished Heavy Industrial Machinery',
      code: 'CAT-FG',
      description: 'Ready-to-dispatch complete industrial hydraulic actuators and assemblies.',
      status: 'active',
      createdBy: user._id,
    });

    // 1. Raw Steel Plate
    const prod1 = await Product.create({
      companyId: company._id,
      name: 'Cold-Rolled Industrial Steel Sheet (Grade A36)',
      sku: 'STL-CRS-001',
      barcode: '8901234567890',
      description: '10mm thick cold-rolled structural steel plate conforming to ASTM A36.',
      categoryId: catRaw._id,
      categoryName: catRaw.name,
      type: 'raw_material',
      status: 'active',
      price: 145.0,
      costPrice: 95.0,
      uom: { unit: 'kg' },
      weight: 10.0,
      createdBy: user._id,
    });

    // 2. High-Tensile Fasteners
    const prod2 = await Product.create({
      companyId: company._id,
      name: 'High-Tensile Alloy Fasteners (Grade 8.8 M16)',
      sku: 'FST-HTA-002',
      barcode: '8901234567891',
      description: 'M16 x 80mm black oxide finished high-tensile mounting bolts.',
      categoryId: catRaw._id,
      categoryName: catRaw.name,
      type: 'component',
      status: 'active',
      price: 14.0,
      costPrice: 8.0,
      uom: { unit: 'pcs' },
      weight: 0.25,
      createdBy: user._id,
    });

    // 3. Drive Shaft (WIP)
    const prod3 = await Product.create({
      companyId: company._id,
      name: 'Precision CNC Machine Drive Shaft (50mm)',
      sku: 'MCH-SFT-003',
      barcode: '8901234567892',
      description: '50mm diameter hardened and ground steel drive shaft with keyed ends.',
      categoryId: catWip._id,
      categoryName: catWip.name,
      type: 'semi_finished',
      status: 'active',
      price: 320.0,
      costPrice: 210.0,
      uom: { unit: 'pcs' },
      weight: 12.5,
      createdBy: user._id,
    });

    // 4. Finished Hydraulic Actuator
    const prod4 = await Product.create({
      companyId: company._id,
      name: 'Heavy Duty Industrial Hydraulic Actuator (500kN)',
      sku: 'ACT-HYD-004',
      barcode: '8901234567893',
      description: 'High-performance dual-acting hydraulic actuator with 500kN force rating.',
      categoryId: catFg._id,
      categoryName: catFg.name,
      type: 'finished_good',
      status: 'active',
      price: 2850.0,
      costPrice: 1720.0,
      uom: { unit: 'pcs' },
      weight: 85.0,
      createdBy: user._id,
      billOfMaterials: [
        {
          componentProductId: prod1._id,
          sku: prod1.sku,
          name: prod1.name,
          quantity: 15,
          unit: 'kg',
          unitCost: prod1.costPrice,
          totalCost: 15 * prod1.costPrice,
          scrapPercentage: 2,
        },
        {
          componentProductId: prod2._id,
          sku: prod2.sku,
          name: prod2.name,
          quantity: 24,
          unit: 'pcs',
          unitCost: prod2.costPrice,
          totalCost: 24 * prod2.costPrice,
          scrapPercentage: 0,
        },
        {
          componentProductId: prod3._id,
          sku: prod3.sku,
          name: prod3.name,
          quantity: 1,
          unit: 'pcs',
          unitCost: prod3.costPrice,
          totalCost: prod3.costPrice,
          scrapPercentage: 1,
        },
      ],
    });
    console.log(`✓ Created 4 Products with Bill of Materials: ${prod1.sku}, ${prod2.sku}, ${prod3.sku}, ${prod4.sku}`);

    console.log('\n--- 8. Creating Warehouse Inventory Stock Records ---');
    await Inventory.create({
      companyId: company._id,
      warehouseId: wh1._id,
      factoryId: fac1._id,
      productId: prod1._id,
      sku: prod1.sku,
      itemName: prod1.name,
      itemCategory: 'raw_material',
      quantity: 5500,
      reservedQuantity: 500,
      unit: 'kg',
      unitCost: prod1.costPrice,
      totalValue: 5500 * prod1.costPrice,
      minThreshold: 1000,
      maxThreshold: 10000,
      reorderPoint: 2000,
      reorderQuantity: 4000,
      locationInWarehouse: 'Bay-1 / Rack-A / Shelf-2',
      status: 'in_stock',
    });

    await Inventory.create({
      companyId: company._id,
      warehouseId: wh1._id,
      factoryId: fac1._id,
      productId: prod2._id,
      sku: prod2.sku,
      itemName: prod2.name,
      itemCategory: 'components',
      quantity: 12000,
      reservedQuantity: 1200,
      unit: 'pcs',
      unitCost: prod2.costPrice,
      totalValue: 12000 * prod2.costPrice,
      minThreshold: 2000,
      maxThreshold: 25000,
      reorderPoint: 3500,
      reorderQuantity: 10000,
      locationInWarehouse: 'Bay-2 / Bin-14',
      status: 'in_stock',
    });

    await Inventory.create({
      companyId: company._id,
      warehouseId: wh1._id,
      factoryId: fac1._id,
      productId: prod3._id,
      sku: prod3.sku,
      itemName: prod3.name,
      itemCategory: 'components',
      quantity: 450,
      reservedQuantity: 50,
      unit: 'pcs',
      unitCost: prod3.costPrice,
      totalValue: 450 * prod3.costPrice,
      minThreshold: 50,
      maxThreshold: 800,
      reorderPoint: 100,
      reorderQuantity: 300,
      locationInWarehouse: 'Bay-3 / Rack-C / Shelf-1',
      status: 'in_stock',
    });

    await Inventory.create({
      companyId: company._id,
      warehouseId: wh2._id,
      factoryId: fac1._id,
      productId: prod4._id,
      sku: prod4.sku,
      itemName: prod4.name,
      itemCategory: 'finished_goods',
      quantity: 65,
      reservedQuantity: 10,
      unit: 'pcs',
      unitCost: prod4.costPrice,
      totalValue: 65 * prod4.costPrice,
      minThreshold: 10,
      maxThreshold: 120,
      reorderPoint: 15,
      reorderQuantity: 30,
      locationInWarehouse: 'Zone-FG / Row-01 / Bay-A',
      status: 'in_stock',
    });
    console.log('✓ Created 4 Inventory records across WH-RAW-01 and WH-FG-02.');

    console.log('\n--- 9. Creating Real Suppliers with Document Vault Certificates ---');
    const sup1 = await Supplier.create({
      companyId: company._id,
      name: 'Apex Metallurgy & Steel Works Corp',
      code: 'SUP-101',
      category: 'raw_material',
      status: 'active',
      rating: 5,
      complianceStatus: 'compliant',
      primaryContact: {
        name: 'Robert Vance',
        email: 'rvance@apexsteel.com',
        phone: '+1 (555) 234-5678',
        role: 'Key Account Manager',
        isPrimary: true,
      },
      address: {
        street: '140 Industrial Parkway',
        city: 'Pittsburgh',
        state: 'PA',
        country: 'USA',
        postalCode: '15201',
      },
      taxId: 'US-984019283',
      paymentTerms: 'Net 30',
      tags: ['Steel', 'Cold-Rolled', 'ISO 9001', 'Structural Plates'],
      totalSpend: 154000,
      totalOrders: 28,
      createdBy: user._id,
      documents: [
        {
          title: 'ISO 9001:2015 Quality Management Certification',
          docType: 'iso_certificate',
          fileName: 'ISO_9001_ApexSteel_2025.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: 1024 * 720,
          uploadedAt: new Date('2025-01-10'),
          expiryDate: new Date('2027-01-10'),
          status: 'valid',
          notes: 'Certified for high-grade industrial cold-rolled steel manufacturing standards.',
        },
        {
          title: 'Master Industrial Supply Agreement 2026',
          docType: 'contract',
          fileName: 'MSA_ApexSteel_Signed.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: 1024 * 1200,
          uploadedAt: new Date('2026-01-05'),
          expiryDate: new Date('2028-01-05'),
          status: 'valid',
          notes: 'Long-term raw material supply contract with fixed discount rates.',
        },
        {
          title: 'W-9 Official Tax Compliance Exemption Certificate',
          docType: 'tax_document',
          fileName: 'W9_TaxExemption_Apex.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: 1024 * 340,
          uploadedAt: new Date('2025-06-15'),
          expiryDate: new Date('2026-10-15'),
          status: 'valid',
          notes: 'Verified federal corporate tax identification and reporting form.',
        },
      ],
    });

    const sup2 = await Supplier.create({
      companyId: company._id,
      name: 'Gujarat Precision Fasteners Pvt Ltd',
      code: 'SUP-102',
      category: 'components',
      status: 'active',
      rating: 4,
      complianceStatus: 'compliant',
      primaryContact: {
        name: 'Anil Sharma',
        email: 'asharma@gujaratfasteners.com',
        phone: '+91 98250 12345',
        role: 'Sales Director',
        isPrimary: true,
      },
      address: {
        street: 'Plot 77, GIDC Estate',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        postalCode: '382445',
      },
      taxId: '24AAACF1234K1Z5',
      paymentTerms: 'Net 45',
      tags: ['Fasteners', 'Grade 8.8', 'Bolts', 'M16'],
      totalSpend: 48000,
      totalOrders: 14,
      createdBy: user._id,
      documents: [
        {
          title: 'Fastener Tensile Strength & Quality Test Report',
          docType: 'quality_standard',
          fileName: 'Tensile_Test_Grade88_Report.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize: 1024 * 480,
          uploadedAt: new Date('2026-02-01'),
          expiryDate: new Date('2027-02-01'),
          status: 'valid',
          notes: 'Batch testing for 800 MPa minimum tensile strength.',
        },
      ],
    });
    console.log(`✓ Created 2 Suppliers: ${sup1.name}, ${sup2.name} with real compliance certificates.`);

    console.log('\n--- 10. Creating Real Customers with Automated Credit Limits ---');
    const cust1 = await Customer.create({
      companyId: company._id,
      companyName: 'Larsen & Toubro Limited',
      name: 'Larsen & Toubro Heavy Industrial Division',
      code: 'CUST-101',
      customerType: 'corporate',
      status: 'active',
      creditLimit: 350000,
      creditStanding: {
        limit: 350000,
        usedCredit: 45000,
        availableCredit: 305000,
        utilizationPercentage: 12.8,
        status: 'excellent',
        score: 92,
        paymentTerms: 'Net 30',
        isCreditHold: false,
      },
      contactName: 'Vikram Mehta',
      email: 'vmehta@larsen.com',
      phone: '+91 22 6752 5656',
      billingAddress: {
        street: 'L&T House, Ballard Estate',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
      },
      taxId: '27AAACL0123M1Z8',
      totalRevenue: 345000,
      ordersCount: 16,
      createdBy: user._id,
    });

    const cust2 = await Customer.create({
      companyId: company._id,
      companyName: 'Tata Motors Limited',
      name: 'Tata Motors Commercial Vehicle Hub',
      code: 'CUST-102',
      customerType: 'enterprise',
      status: 'active',
      creditLimit: 500000,
      creditStanding: {
        limit: 500000,
        usedCredit: 82000,
        availableCredit: 418000,
        utilizationPercentage: 16.4,
        status: 'excellent',
        score: 95,
        paymentTerms: 'Net 45',
        isCreditHold: false,
      },
      contactName: 'Pooja Nair',
      email: 'pnair@tatamotors.com',
      phone: '+91 20 6613 1111',
      billingAddress: {
        street: 'Pimpri Industrial Zone',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '411018',
      },
      taxId: '27AAACT9988P1Z3',
      totalRevenue: 620000,
      ordersCount: 22,
      createdBy: user._id,
    });
    console.log(`✓ Created 2 Customers: ${cust1.name}, ${cust2.name}.`);

    console.log('\n--- 11. Creating Real Work Orders ---');
    const wo1 = await WorkOrder.create({
      companyId: company._id,
      workOrderNumber: 'WO-2026-001',
      factoryId: fac1._id,
      warehouseId: wh2._id,
      productId: prod4._id,
      itemName: prod4.name,
      sku: prod4.sku,
      unit: 'pcs',
      plannedQuantity: 25,
      producedQuantity: 10,
      scrapQuantity: 1,
      priority: 'high',
      status: 'In Progress',
      plannedStartDate: new Date(),
      plannedEndDate: new Date(Date.now() + 14 * 86400000),
      assignedTo: user._id,
      createdBy: user._id,
      materialCost: 25 * prod4.costPrice,
    });

    const wo2 = await WorkOrder.create({
      companyId: company._id,
      workOrderNumber: 'WO-2026-002',
      factoryId: fac1._id,
      warehouseId: wh1._id,
      productId: prod3._id,
      itemName: prod3.name,
      sku: prod3.sku,
      unit: 'pcs',
      plannedQuantity: 100,
      producedQuantity: 100,
      scrapQuantity: 2,
      priority: 'medium',
      status: 'Completed',
      plannedStartDate: new Date(Date.now() - 7 * 86400000),
      plannedEndDate: new Date(Date.now() - 1 * 86400000),
      assignedTo: user._id,
      createdBy: user._id,
      materialCost: 100 * prod3.costPrice,
    });
    console.log(`✓ Created 2 Work Orders: ${wo1.workOrderNumber}, ${wo2.workOrderNumber}.`);

    console.log('\n--- 12. Creating Real Purchase Order & Sales Order/Invoice ---');
    const po1 = await PurchaseOrder.create({
      companyId: company._id,
      poNumber: 'PO-2026-001',
      supplierId: sup1._id,
      warehouseId: wh1._id,
      factoryId: fac1._id,
      issuerId: user._id,
      status: 'Goods Received',
      paymentTerms: 'Net 30',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 86400000),
      items: [
        {
          productId: prod1._id,
          sku: prod1.sku,
          itemName: prod1.name,
          itemCategory: 'raw_material',
          quantityOrdered: 2500,
          quantityReceived: 2500,
          unit: 'kg',
          unitPrice: prod1.costPrice,
          totalPrice: 2500 * prod1.costPrice,
        },
      ],
      subtotal: 2500 * prod1.costPrice,
      taxTotal: 2500 * prod1.costPrice * 0.18,
      shippingCost: 500,
      grandTotal: 2500 * prod1.costPrice * 1.18 + 500,
    });

    const so1 = await SalesOrder.create({
      companyId: company._id,
      orderNumber: 'SO-2026-001',
      customerId: cust1._id,
      warehouseId: wh2._id,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 10 * 86400000),
      customerPoNumber: 'LT-PO-99120',
      status: 'Approved',
      paymentTerms: 'Net 30',
      paymentStatus: 'paid',
      amountInvoiced: 10 * prod4.price * 1.18,
      amountPaid: 10 * prod4.price * 1.18,
      items: [
        {
          productId: prod4._id,
          sku: prod4.sku,
          itemName: prod4.name,
          quantity: 10,
          unitPrice: prod4.price,
          totalPrice: 10 * prod4.price,
          unit: 'pcs',
        },
      ],
      subtotal: 10 * prod4.price,
      taxTotal: 10 * prod4.price * 0.18,
      shippingCost: 1200,
      grandTotal: 10 * prod4.price * 1.18 + 1200,
      createdBy: user._id,
    });

    const invReal = await SalesInvoice.create({
      companyId: company._id,
      invoiceNumber: 'INV-2026-001',
      salesOrderId: so1._id,
      customerId: cust1._id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      items: [
        {
          productId: prod4._id,
          sku: prod4.sku,
          itemName: prod4.name,
          quantity: 10,
          unitPrice: prod4.price,
          totalPrice: 10 * prod4.price,
          unit: 'pcs',
        },
      ],
      subtotal: 10 * prod4.price,
      taxTotal: 10 * prod4.price * 0.18,
      shippingCost: 1200,
      grandTotal: 10 * prod4.price * 1.18 + 1200,
      amountPaid: 10 * prod4.price * 1.18 + 1200,
      balanceDue: 0,
      status: 'Paid',
      createdBy: user._id,
    });
    console.log(`✓ Created PO (${po1.poNumber}), Sales Order (${so1.orderNumber}), and Invoice (${invReal.invoiceNumber}).`);

    console.log('\n======================================================');
    console.log('✅ DATABASE RESET & LIVE SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`Company:        Apex Industrial Corp (APEX)`);
    console.log(`Primary Login:  hitarththombre@gmail.com`);
    console.log(`Password:       Password@123`);
    console.log(`Role:           Company Owner (Full Permissions)`);
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Error during reset and seed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

resetAndSeed();
