# Database.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** Database Design Document  
**Project Type:** Multi-Tenant Industrial SaaS Platform

---

# 1. Database Overview

The Digital Industrial Workflow System (DIWS) uses a document-oriented database design to support industrial operations for multiple companies on a shared SaaS platform. The database must support flexible product structures, warehouse and stock tracking, procurement, production workflows, sales, dispatch, document management, notifications, and future expansion.

MongoDB is a strong fit for this system because it supports flexible schemas, nested documents, and scalable multi-tenant data modeling.

---

# 2. Database Technology Stack

- **Primary Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Search:** MongoDB Atlas Search
- **File Metadata Storage:** MongoDB
- **File Storage:** Cloudflare R2 or AWS S3
- **Future AI Retrieval:** MongoDB Atlas Vector Search

---

# 3. Database Design Principles

## 3.1 Multi-Tenant Design

Each record that belongs to a company should include a `companyId` field so data can be isolated logically.

## 3.2 Document-Oriented Design

Entities such as products, workflows, and documents may have different structures depending on industry, so a document database provides flexibility.

## 3.3 Reference Where Needed

Use references between documents where relationships are important, such as:

- users → company
- factories → company
- warehouses → factory/company
- stock movements → products and warehouses
- work orders → products and factories

## 3.4 Store Files Separately

Large files such as images, PDFs, manuals, and reports should be stored in object storage. MongoDB should store only metadata and file URLs.

## 3.5 Auditability

Important actions such as login, stock changes, approvals, and deletions should be stored in audit logs.

---

# 4. Multi-Tenant Strategy

DIWS is designed as a shared SaaS platform, so all companies use the same infrastructure while keeping their data separate.

## Tenant Isolation Rule

Every tenant-aware collection should include:

- `companyId`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Example Tenant-Aware Collections

- users
- roles
- departments
- factories
- warehouses
- products
- suppliers
- customers
- inventory_items
- stock_movements
- purchase_requests
- purchase_orders
- goods_receipts
- production_plans
- work_orders
- sales_orders
- dispatch_orders
- documents
- notifications
- audit_logs

---

# 5. Core Collections

## 5.1 companies

Stores company registration and configuration details.

### Key Fields

- `_id`
- `name`
- `code`
- `industry`
- `logo`
- `email`
- `phone`
- `address`
- `gstNumber`
- `currency`
- `timezone`
- `status`
- `subscriptionPlan`
- `createdAt`
- `updatedAt`

### Purpose

Represents each customer organization on the platform.

---

## 5.2 users

Stores platform and company users.

### Key Fields

- `_id`
- `companyId`
- `name`
- `email`
- `phone`
- `passwordHash`
- `roleId`
- `departmentId`
- `status`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### Purpose

Handles authentication and user access.

---

## 5.3 roles

Defines roles and permissions.

### Key Fields

- `_id`
- `companyId`
- `name`
- `description`
- `permissions`
- `createdAt`
- `updatedAt`

### Purpose

Supports role-based access control.

---

## 5.4 departments

Stores department names such as production, purchase, inventory, and sales.

### Key Fields

- `_id`
- `companyId`
- `name`
- `description`
- `createdAt`
- `updatedAt`

---

## 5.5 factories

Stores factory-level information.

### Key Fields

- `_id`
- `companyId`
- `name`
- `location`
- `managerId`
- `status`
- `createdAt`
- `updatedAt`

---

## 5.6 warehouses

Stores warehouse information and stock location details.

### Key Fields

- `_id`
- `companyId`
- `factoryId`
- `name`
- `type`
- `location`
- `capacity`
- `status`
- `createdAt`
- `updatedAt`

### Warehouse Types

- Raw Material
- Work-in-Progress
- Finished Goods
- Scrap
- Transit

---

## 5.7 product_categories

Stores product categories used across industries.

### Key Fields

- `_id`
- `companyId`
- `name`
- `description`
- `createdAt`
- `updatedAt`

---

## 5.8 products

Stores products, raw materials, semi-finished items, and finished goods.

### Key Fields

- `_id`
- `companyId`
- `categoryId`
- `name`
- `sku`
- `type`
- `uom`
- `attributes`
- `images`
- `documents`
- `status`
- `createdAt`
- `updatedAt`

### Product Types

- Raw Material
- Semi-Finished
- Finished Goods
- Consumable

### Example Attributes

A product can store different attributes depending on industry:

- thickness
- length
- width
- color
- grade
- finish
- weight

---

## 5.9 suppliers

Stores vendor and supplier details.

### Key Fields

- `_id`
- `companyId`
- `name`
- `contactPerson`
- `email`
- `phone`
- `address`
- `gstNumber`
- `paymentTerms`
- `status`
- `createdAt`
- `updatedAt`

---

## 5.10 customers

Stores customer details.

### Key Fields

- `_id`
- `companyId`
- `name`
- `contactPerson`
- `email`
- `phone`
- `address`
- `gstNumber`
- `creditLimit`
- `status`
- `createdAt`
- `updatedAt`

---

# 6. Inventory Collections

## 6.1 inventory_items

Represents the current stock of a product in a warehouse.

### Key Fields

- `_id`
- `companyId`
- `productId`
- `warehouseId`
- `quantity`
- `reservedQuantity`
- `availableQuantity`
- `batchNumber`
- `lotNumber`
- `status`
- `createdAt`
- `updatedAt`

### Purpose

Shows current available stock.

---

## 6.2 stock_movements

Tracks every movement of stock.

### Key Fields

- `_id`
- `companyId`
- `productId`
- `warehouseId`
- `movementType`
- `quantity`
- `referenceType`
- `referenceId`
- `reason`
- `createdBy`
- `createdAt`

### Movement Types

- Stock In
- Stock Out
- Transfer In
- Transfer Out
- Adjustment
- Consumption
- Scrap
- Return

### Purpose

Provides full traceability of inventory changes.

---

# 7. Procurement Collections

## 7.1 purchase_requests

Stores internal purchase requests.

### Key Fields

- `_id`
- `companyId`
- `requestedBy`
- `departmentId`
- `items`
- `priority`
- `status`
- `requestedAt`
- `approvedBy`
- `createdAt`
- `updatedAt`

---

## 7.2 purchase_orders

Stores purchase orders sent to suppliers.

### Key Fields

- `_id`
- `companyId`
- `supplierId`
- `purchaseRequestId`
- `items`
- `orderNumber`
- `orderDate`
- `expectedDate`
- `status`
- `totalAmount`
- `createdAt`
- `updatedAt`

---

## 7.3 goods_receipts

Stores received goods against purchase orders.

### Key Fields

- `_id`
- `companyId`
- `purchaseOrderId`
- `supplierId`
- `receivedBy`
- `items`
- `receivedDate`
- `status`
- `remarks`
- `createdAt`
- `updatedAt`

### Purpose

Updates stock when materials arrive.

---

# 8. Production Collections

## 8.1 production_plans

Stores planned production schedules.

### Key Fields

- `_id`
- `companyId`
- `factoryId`
- `planName`
- `plannedDate`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`

---

## 8.2 work_orders

Stores production work orders.

### Key Fields

- `_id`
- `companyId`
- `productionPlanId`
- `factoryId`
- `productId`
- `quantity`
- `priority`
- `status`
- `startDate`
- `endDate`
- `createdBy`
- `createdAt`
- `updatedAt`

### Work Order Statuses

- Draft
- Planned
- In Progress
- On Hold
- Completed
- Cancelled

---

## 8.3 production_stages

Stores stage-level progress of a work order.

### Key Fields

- `_id`
- `companyId`
- `workOrderId`
- `stageName`
- `sequence`
- `assignedTo`
- `machineId`
- `status`
- `startedAt`
- `completedAt`
- `notes`
- `createdAt`
- `updatedAt`

### Purpose

Allows production tracking in multiple stages.

---

## 8.4 material_consumption

Stores raw material usage against production.

### Key Fields

- `_id`
- `companyId`
- `workOrderId`
- `productId`
- `warehouseId`
- `quantityUsed`
- `createdBy`
- `createdAt`

### Purpose

Helps reduce stock accurately during production.

---

## 8.5 scrap_records

Stores waste or damaged material records.

### Key Fields

- `_id`
- `companyId`
- `workOrderId`
- `productId`
- `quantity`
- `reason`
- `createdBy`
- `createdAt`

---

# 9. Sales Collections

## 9.1 quotations

Stores customer quotation records.

### Key Fields

- `_id`
- `companyId`
- `customerId`
- `quotationNumber`
- `items`
- `totalAmount`
- `status`
- `validUntil`
- `createdBy`
- `createdAt`
- `updatedAt`

---

## 9.2 sales_orders

Stores confirmed sales orders.

### Key Fields

- `_id`
- `companyId`
- `customerId`
- `quotationId`
- `orderNumber`
- `items`
- `totalAmount`
- `status`
- `orderDate`
- `deliveryDate`
- `createdBy`
- `createdAt`
- `updatedAt`

---

## 9.3 invoices

Stores invoice records.

### Key Fields

- `_id`
- `companyId`
- `salesOrderId`
- `invoiceNumber`
- `customerId`
- `amount`
- `tax`
- `grandTotal`
- `status`
- `invoiceDate`
- `createdAt`
- `updatedAt`

---

# 10. Dispatch Collections

## 10.1 dispatch_orders

Stores delivery and dispatch records.

### Key Fields

- `_id`
- `companyId`
- `salesOrderId`
- `warehouseId`
- `transportId`
- `dispatchNumber`
- `status`
- `dispatchDate`
- `deliveryDate`
- `createdBy`
- `createdAt`
- `updatedAt`

---

## 10.2 transport_records

Stores transport and logistics details.

### Key Fields

- `_id`
- `companyId`
- `vehicleNumber`
- `driverName`
- `driverPhone`
- `freightCharges`
- `status`
- `createdAt`
- `updatedAt`

---

# 11. Document Collections

## 11.1 documents

Stores metadata for uploaded files.

### Key Fields

- `_id`
- `companyId`
- `moduleType`
- `referenceId`
- `fileName`
- `fileUrl`
- `fileType`
- `fileSize`
- `uploadedBy`
- `createdAt`
- `updatedAt`

### Module Types

- Product
- Purchase
- Production
- Sales
- Dispatch
- Supplier
- Customer
- Factory
- General

---

# 12. Notification Collections

## 12.1 notifications

Stores user notifications.

### Key Fields

- `_id`
- `companyId`
- `userId`
- `title`
- `message`
- `type`
- `status`
- `readAt`
- `createdAt`

### Notification Types

- Low stock
- New order
- Approval request
- Dispatch update
- Production update
- Purchase update
- System alert

---

# 13. Audit Collections

## 13.1 audit_logs

Stores important system actions.

### Key Fields

- `_id`
- `companyId`
- `userId`
- `action`
- `module`
- `referenceId`
- `before`
- `after`
- `ipAddress`
- `createdAt`

### Purpose

Provides full traceability of changes made in the system.

---

# 14. AI and RAG Collections

These collections are optional for the current version but useful for future AI/RAG support.

## 14.1 ai_documents

Stores AI-indexed document metadata.

### Key Fields

- `_id`
- `companyId`
- `documentId`
- `sourceType`
- `title`
- `fileUrl`
- `status`
- `createdAt`
- `updatedAt`

---

## 14.2 ai_chunks

Stores chunks of extracted document text.

### Key Fields

- `_id`
- `companyId`
- `documentId`
- `chunkText`
- `chunkIndex`
- `metadata`
- `createdAt`

---

## 14.3 embeddings

Stores vector data for semantic search.

### Key Fields

- `_id`
- `companyId`
- `documentId`
- `chunkId`
- `embedding`
- `metadata`
- `createdAt`

---

# 15. Indexing Strategy

Indexes should be created on frequently searched fields.

## Recommended Indexes

- `companyId`
- `email`
- `roleId`
- `factoryId`
- `warehouseId`
- `productId`
- `supplierId`
- `customerId`
- `status`
- `createdAt`

## Compound Index Examples

- `companyId + email`
- `companyId + sku`
- `companyId + status`
- `companyId + warehouseId + productId`
- `companyId + salesOrderId`
- `companyId + purchaseOrderId`

---

# 16. Relationship Strategy

MongoDB is document-based, but some entities should reference others for consistency.

## Reference Examples

- `users.companyId` → `companies._id`
- `products.categoryId` → `product_categories._id`
- `warehouses.factoryId` → `factories._id`
- `inventory_items.productId` → `products._id`
- `inventory_items.warehouseId` → `warehouses._id`
- `purchase_orders.supplierId` → `suppliers._id`
- `sales_orders.customerId` → `customers._id`
- `work_orders.productionPlanId` → `production_plans._id`
- `dispatch_orders.salesOrderId` → `sales_orders._id`

---

# 17. Data Validation Rules

## Company Data

- Company name is required
- Company code should be unique
- Email must be valid

## User Data

- Email must be unique within a company
- Password must be hashed
- Role is required

## Inventory Data

- Stock quantity cannot be negative
- Stock movement must have a valid reference

## Production Data

- Work order quantity must be valid
- Completed stage must follow stage sequence

## Sales and Procurement

- Orders should link to valid entities
- Amounts should be calculated accurately
- Status transitions should be controlled

---

# 18. Backup and Recovery

The database should support:

- Automated backups
- Restore points
- Data export
- Disaster recovery planning

Important data includes:

- company records
- inventory
- orders
- production logs
- documents metadata
- audit logs

---

# 19. Data Retention Strategy

## Keep Long-Term

- Companies
- Users
- Orders
- Inventory transactions
- Audit logs
- Documents metadata

## Archive or Clean Periodically

- Temporary files
- Old notifications
- Expired sessions
- Old draft records

---

# 20. Future Database Enhancements

Future versions may add:

- Vector search expansion
- Full-text semantic search
- Machine telemetry tables
- Quality inspection records
- Maintenance logs
- Workflow templates
- Mobile sync queue
- Integration logs

---

# 21. Database Conclusion

The DIWS database design is built around a multi-tenant, modular, and flexible MongoDB structure. It is optimized for industrial workflows and can grow to support more advanced manufacturing capabilities in the future without requiring a complete redesign.
