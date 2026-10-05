import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from './setup';

import User from '../models/User';
import Company from '../models/Company';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import Inventory from '../models/Inventory';
import StockMovement from '../models/StockMovement';
import Supplier from '../models/Supplier';
import Customer from '../models/Customer';
import PurchaseOrder from '../models/PurchaseOrder';
import GoodsReceiptNote from '../models/GoodsReceiptNote';
import ProductionPlan from '../models/ProductionPlan';
import WorkOrder from '../models/WorkOrder';
import SalesOrder from '../models/SalesOrder';
import DispatchOrder from '../models/DispatchOrder';
import SalesInvoice from '../models/SalesInvoice';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('DIWS Full End-to-End Industrial Pipeline Integration Test', () => {
  it('should execute the complete industrial workflow pipeline without data mismatch', async () => {
    // ----------------------------------------------------
    // STEP 1: Multi-Tenant & Master Setup
    // ----------------------------------------------------
    const company = await Company.create({
      name: 'Titan Heavy Industries Ltd',
      code: 'TITAN-01',
      email: 'info@titanind.com',
      phone: '+912233445566',
      address: 'Industrial Estate Sector 5',
      city: 'Vadodara',
      country: 'India'
    });
    const companyId = company._id as mongoose.Types.ObjectId;

    const user = await User.create({
      companyId,
      firstName: 'Plant',
      lastName: 'Manager',
      email: 'plantmanager@titanind.com',
      passwordHash: '$2b$10$wN9aE3zT2r11xXxXxXxXx.HASHED_PASSWORD_VALUE',
      role: 'Admin'
    });
    const userId = user._id as mongoose.Types.ObjectId;

    const rawWarehouse = await Warehouse.create({
      companyId,
      code: 'WH-RAW',
      name: 'Raw Materials Storage',
      capacity: 50000,
      createdBy: userId
    });

    const fgWarehouse = await Warehouse.create({
      companyId,
      code: 'WH-FG',
      name: 'Finished Goods Depot',
      capacity: 20000,
      createdBy: userId
    });

    const supplier = await Supplier.create({
      companyId,
      name: 'Tata Steel Industrial',
      code: 'SUP-TATA',
      email: 'orders@tatasteel.com',
      primaryContact: {
        name: 'Sales Manager',
        email: 'orders@tatasteel.com'
      },
      createdBy: userId
    });

    const customer = await Customer.create({
      companyId,
      name: 'L&T Construction',
      code: 'CUST-LNT',
      email: 'procurement@lnt.com',
      primaryContact: {
        name: 'Purchase Agent',
        email: 'procurement@lnt.com'
      },
      createdBy: userId
    });

    // ----------------------------------------------------
    // STEP 2: Product Catalog Setup
    // ----------------------------------------------------
    const rawSteel = await Product.create({
      companyId,
      sku: 'RM-STEEL-100',
      name: 'Structural Alloy Steel',
      costPrice: 20,
      price: 35,
      uom: { unit: 'kg' },
      minStockLevel: 25,
      createdBy: userId
    });

    const finishedGear = await Product.create({
      companyId,
      sku: 'FG-GEAR-500',
      name: 'Heavy Transmission Gear box',
      costPrice: 200,
      price: 450,
      uom: { unit: 'unit' },
      minStockLevel: 5,
      createdBy: userId
    });

    // ----------------------------------------------------
    // STEP 3: Procurement Pipeline (PO & GRN)
    // ----------------------------------------------------
    const purchaseOrder = await PurchaseOrder.create({
      companyId,
      poNumber: 'PO-2026-9001',
      supplierId: supplier._id,
      warehouseId: rawWarehouse._id,
      issuerId: userId,
      items: [
        {
          productId: rawSteel._id,
          itemName: rawSteel.name,
          sku: rawSteel.sku,
          itemCategory: 'raw_material',
          quantityOrdered: 100,
          quantityReceived: 0,
          unit: 'kg',
          unitPrice: 20,
          totalPrice: 2000
        }
      ],
      subtotal: 2000,
      taxTotal: 200,
      grandTotal: 2200,
      status: 'Approved'
    });

    // Process Goods Receipt Note (GRN)
    const grn = await GoodsReceiptNote.create({
      companyId,
      grnNumber: 'GRN-2026-001',
      purchaseOrderId: purchaseOrder._id,
      supplierId: supplier._id,
      warehouseId: rawWarehouse._id,
      receivedBy: userId,
      items: [
        {
          productId: rawSteel._id,
          sku: rawSteel.sku,
          itemName: rawSteel.name,
          itemCategory: 'raw_material',
          quantityOrdered: 100,
          quantityReceived: 100,
          quantityAccepted: 100,
          quantityRejected: 0,
          unit: 'kg',
          unitCost: 20,
          totalCost: 2000
        }
      ],
      totalAcceptedCost: 2000,
      status: 'Completed'
    });

    // Update Raw Warehouse Inventory
    let rawInventory = await Inventory.create({
      companyId,
      warehouseId: rawWarehouse._id,
      productId: rawSteel._id,
      sku: rawSteel.sku,
      itemName: rawSteel.name,
      itemCategory: 'raw_material',
      quantity: 100,
      reservedQuantity: 0,
      unitCost: 20,
      totalValue: 2000
    });

    await StockMovement.create({
      companyId,
      warehouseId: rawWarehouse._id,
      inventoryId: rawInventory._id,
      type: 'stock_in',
      itemCategory: 'raw_material',
      quantity: 100,
      sku: rawSteel.sku,
      itemName: rawSteel.name,
      referenceNumber: grn.grnNumber,
      performedBy: userId
    });

    expect(rawInventory.quantity).toBe(100);

    // ----------------------------------------------------
    // STEP 4: Manufacturing Pipeline (Production Plan & Work Order)
    // ----------------------------------------------------
    const prodPlan = await ProductionPlan.create({
      companyId,
      planNumber: 'PLAN-2026-001',
      title: 'Q4 Heavy Gear Assembly Batch',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Approved',
      createdBy: userId,
      items: [
        {
          productId: finishedGear._id,
          itemName: finishedGear.name,
          sku: finishedGear.sku,
          plannedQuantity: 10,
          producedQuantity: 0,
          unit: 'unit'
        }
      ]
    });

    const workOrder = await WorkOrder.create({
      companyId,
      workOrderNumber: 'WO-2026-5501',
      planId: prodPlan._id,
      warehouseId: rawWarehouse._id,
      outputWarehouseId: fgWarehouse._id,
      productId: finishedGear._id,
      sku: finishedGear.sku,
      itemName: finishedGear.name,
      unit: 'unit',
      plannedQuantity: 10,
      producedQuantity: 0,
      status: 'In Progress',
      createdBy: userId,
      materials: [
        {
          sku: rawSteel.sku,
          itemName: rawSteel.name,
          requiredQuantity: 50,
          consumedQuantity: 0,
          unit: 'kg'
        }
      ]
    });

    // Deduct Raw Material from rawWarehouse inventory
    rawInventory = await Inventory.findOneAndUpdate(
      { _id: rawInventory._id },
      { $inc: { quantity: -50 } },
      { new: true }
    ) as any;

    await StockMovement.create({
      companyId,
      warehouseId: rawWarehouse._id,
      inventoryId: rawInventory._id,
      type: 'stock_out',
      itemCategory: 'raw_material',
      quantity: 50,
      sku: rawSteel.sku,
      itemName: rawSteel.name,
      referenceNumber: workOrder.workOrderNumber,
      performedBy: userId
    });

    expect(rawInventory.quantity).toBe(50); // 100 - 50 = 50

    // Work Order Completion: Produce 10 Finished Goods in WH-FG
    let fgInventory = await Inventory.create({
      companyId,
      warehouseId: fgWarehouse._id,
      productId: finishedGear._id,
      sku: finishedGear.sku,
      itemName: finishedGear.name,
      itemCategory: 'finished_goods',
      quantity: 10,
      reservedQuantity: 0,
      unitCost: 200,
      totalValue: 2000
    });

    await StockMovement.create({
      companyId,
      warehouseId: fgWarehouse._id,
      inventoryId: fgInventory._id,
      type: 'stock_in',
      itemCategory: 'finished_goods',
      quantity: 10,
      sku: finishedGear.sku,
      itemName: finishedGear.name,
      referenceNumber: workOrder.workOrderNumber,
      performedBy: userId
    });

    await WorkOrder.findByIdAndUpdate(workOrder._id, { status: 'Completed', producedQuantity: 10 });

    expect(fgInventory.quantity).toBe(10);

    // ----------------------------------------------------
    // STEP 5: Sales & Dispatch Pipeline
    // ----------------------------------------------------
    const salesOrder = await SalesOrder.create({
      companyId,
      orderNumber: 'SO-2026-8801',
      customerId: customer._id,
      warehouseId: fgWarehouse._id,
      createdBy: userId,
      items: [
        {
          sku: finishedGear.sku,
          itemName: finishedGear.name,
          quantity: 5,
          unitPrice: 450,
          totalPrice: 2250,
          unitCost: 200
        }
      ],
      subtotal: 2250,
      taxAmount: 225,
      grandTotal: 2475,
      status: 'Approved',
      paymentStatus: 'unpaid'
    });

    // Reserve 5 finished goods in FG warehouse
    fgInventory = await Inventory.findOneAndUpdate(
      { _id: fgInventory._id },
      { $inc: { reservedQuantity: 5 } },
      { new: true }
    ) as any;

    expect(fgInventory.reservedQuantity).toBe(5);
    expect(fgInventory.quantity - fgInventory.reservedQuantity).toBe(5);

    // Execute Dispatch Order
    const dispatchOrder = await DispatchOrder.create({
      companyId,
      dispatchNumber: 'DSP-2026-001',
      salesOrderId: salesOrder._id,
      warehouseId: fgWarehouse._id,
      transport: {
        mode: 'road',
        carrierName: 'BlueDart Logistics',
        trackingNumber: 'BD-9988776655'
      },
      status: 'Shipped',
      createdBy: userId,
      items: [
        {
          sku: finishedGear.sku,
          itemName: finishedGear.name,
          quantity: 5,
          unit: 'unit'
        }
      ]
    });

    // Complete Dispatch: Deduct 5 units from quantity & reservedQuantity
    fgInventory = await Inventory.findOneAndUpdate(
      { _id: fgInventory._id },
      { $inc: { quantity: -5, reservedQuantity: -5 } },
      { new: true }
    ) as any;

    await StockMovement.create({
      companyId,
      warehouseId: fgWarehouse._id,
      inventoryId: fgInventory._id,
      type: 'stock_out',
      itemCategory: 'finished_goods',
      quantity: 5,
      sku: finishedGear.sku,
      itemName: finishedGear.name,
      referenceNumber: dispatchOrder.dispatchNumber,
      performedBy: userId
    });

    expect(fgInventory.quantity).toBe(5);
    expect(fgInventory.reservedQuantity).toBe(0);

    // Generate Sales Invoice
    const salesInvoice = await SalesInvoice.create({
      companyId,
      invoiceNumber: 'INV-2026-4401',
      salesOrderId: salesOrder._id,
      customerId: customer._id,
      createdBy: userId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          sku: finishedGear.sku,
          itemName: finishedGear.name,
          quantity: 5,
          unitPrice: 450,
          totalPrice: 2250,
          unitCost: 200
        }
      ],
      subtotal: 2250,
      taxAmount: 225,
      grandTotal: 2475,
      balanceDue: 2475,
      status: 'Unpaid'
    });

    expect(salesInvoice.invoiceNumber).toBe('INV-2026-4401');
    expect(salesInvoice.grandTotal).toBe(2475);

    // ----------------------------------------------------
    // STEP 6: Final Verification Across Pipeline
    // ----------------------------------------------------
    const finalRawInventory = await Inventory.findOne({
      companyId,
      sku: rawSteel.sku,
      warehouseId: rawWarehouse._id
    });
    const finalFgInventory = await Inventory.findOne({
      companyId,
      sku: finishedGear.sku,
      warehouseId: fgWarehouse._id
    });
    const stockMovements = await StockMovement.find({ companyId });

    expect(finalRawInventory?.quantity).toBe(50); // 100 received - 50 consumed in manufacturing
    expect(finalFgInventory?.quantity).toBe(5);   // 10 produced - 5 sold and dispatched
    expect(stockMovements.length).toBe(4);        // 1 GRN Stock In, 1 WorkOrder Stock Out, 1 WorkOrder Stock In, 1 Dispatch Stock Out
  });
});
