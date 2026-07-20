# Modules.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** Module Design Document  
**Project Type:** Multi-Tenant Industrial SaaS Platform

---

# 1. Overview

This document describes the main functional modules of the Digital Industrial Workflow System (DIWS). The system is designed as a modular industrial SaaS platform so manufacturing companies can manage their operations in one place.

Each module focuses on a specific business area and can work independently while still connecting to the rest of the system.

---

# 2. Module Design Principles

- Each module should have a clear responsibility
- Modules should be reusable and easy to maintain
- Modules should support multi-tenant data isolation
- Modules should communicate through APIs and shared business rules
- Modules should be designed so future features can be added easily
- Every module should support role-based access control

---

# 3. Core Platform Modules

## 3.1 Authentication Module

### Purpose

Handles login, registration, password management, and secure access.

### Features

- Company registration
- User registration
- Login
- Logout
- Forgot password
- Reset password
- Email verification
- JWT token handling
- Session management

### Related Entities

- users
- companies
- roles

---

## 3.2 Company Management Module

### Purpose

Handles company setup and company-level configuration.

### Features

- Create company
- Update company profile
- Company branding
- Company settings
- Subscription details
- Company workspace management
- Industry selection

### Related Entities

- companies

---

## 3.3 User Management Module

### Purpose

Manages users inside each company workspace.

### Features

- Invite users
- Add users
- Edit users
- Deactivate users
- Assign roles
- Assign departments
- View user activity

### Related Entities

- users
- roles
- departments

---

## 3.4 Role & Permission Module

### Purpose

Controls access to screens, actions, and records.

### Features

- Create roles
- Edit roles
- Delete roles
- Set permissions
- View permission matrix
- Restrict module access

### Related Entities

- roles
- permissions

---

# 4. Organizational Modules

## 4.1 Department Management Module

### Purpose

Organizes users into departments for better workflow control.

### Features

- Create departments
- Edit departments
- Delete departments
- Assign users to departments

### Example Departments

- Production
- Inventory
- Purchase
- Sales
- Dispatch
- Accounts
- Admin

### Related Entities

- departments

---

## 4.2 Factory Management Module

### Purpose

Stores and manages multiple factory locations for each company.

### Features

- Create factory
- Edit factory
- Delete factory
- Factory details
- Factory location
- Factory manager assignment
- Factory status

### Related Entities

- factories

---

## 4.3 Warehouse Management Module

### Purpose

Manages raw material, finished goods, scrap, and transit warehouses.

### Features

- Create warehouse
- Edit warehouse
- Delete warehouse
- Warehouse type
- Warehouse location
- Warehouse transfer support
- Warehouse status

### Warehouse Types

- Raw Material
- Work-in-Progress
- Finished Goods
- Scrap
- Transit

### Related Entities

- warehouses

---

# 5. Master Data Modules

## 5.1 Product Management Module

### Purpose

Stores all products, materials, and industrial items used in operations.

### Features

- Create product
- Edit product
- Delete product
- Product categories
- Product variants
- Custom attributes
- Units of measurement
- Product images
- Product documents
- Product status

### Product Types

- Raw Material
- Semi-Finished
- Finished Goods
- Consumables

### Related Entities

- products
- product_categories
- product_variants

---

## 5.2 Supplier Management Module

### Purpose

Stores vendor and supplier information.

### Features

- Add supplier
- Edit supplier
- Delete supplier
- Supplier profile
- Purchase history
- Supplier documents
- Supplier status

### Related Entities

- suppliers

---

## 5.3 Customer Management Module

### Purpose

Stores customer information and order history.

### Features

- Add customer
- Edit customer
- Delete customer
- Customer profile
- Order history
- Customer documents
- Customer status

### Related Entities

- customers

---

# 6. Inventory and Stock Modules

## 6.1 Inventory Management Module

### Purpose

Tracks stock in real time across warehouses.

### Features

- View stock
- Add stock in
- Stock out
- Stock transfer
- Stock adjustment
- Inventory transactions
- Low stock alerts
- Current stock summary
- Reserved stock tracking

### Inventory Types

- Raw Material Stock
- Finished Goods Stock
- Work-in-Progress Stock
- Scrap Stock

### Related Entities

- inventory_items
- stock_movements

---

## 6.2 Stock Movement Module

### Purpose

Tracks every stock change in the system.

### Features

- Record stock in
- Record stock out
- Record transfer
- Record adjustment
- Record consumption
- Record scrap
- Maintain movement history

### Related Entities

- stock_movements

---

# 7. Procurement Modules

## 7.1 Purchase Request Module

### Purpose

Handles internal purchase demand from departments or production teams.

### Features

- Create purchase request
- Edit request
- Approve request
- Reject request
- Track request status
- Link request to required items

### Related Entities

- purchase_requests

---

## 7.2 Purchase Order Module

### Purpose

Creates formal orders for suppliers.

### Features

- Create purchase order
- Edit order
- Send order to supplier
- Track order status
- View order history
- Link order to purchase request

### Related Entities

- purchase_orders

---

## 7.3 Goods Receipt Module

### Purpose

Handles receiving of incoming goods.

### Features

- Receive goods
- Verify received items
- Update inventory
- Record shortages or damage
- Link receipt to purchase order

### Related Entities

- goods_receipts

---

# 8. Production Modules

## 8.1 Production Planning Module

### Purpose

Plans upcoming production activities.

### Features

- Create production plan
- Assign factory
- Schedule production date
- Plan quantities
- Track plan status

### Related Entities

- production_plans

---

## 8.2 Work Order Module

### Purpose

Controls actual production execution.

### Features

- Create work order
- Assign product and quantity
- Set priority
- Track progress
- Update status
- Link to production plan

### Work Order Statuses

- Draft
- Planned
- In Progress
- On Hold
- Completed
- Cancelled

### Related Entities

- work_orders

---

## 8.3 Production Stage Module

### Purpose

Tracks each step of production.

### Features

- Create stage
- Track stage sequence
- Assign workers
- Assign machine later if needed
- Update stage completion
- Stage notes

### Related Entities

- production_stages

---

## 8.4 Material Consumption Module

### Purpose

Records raw material used in production.

### Features

- Issue material
- Deduct stock
- Link material to work order
- Record consumption quantity

### Related Entities

- material_consumption

---

## 8.5 Scrap Management Module

### Purpose

Records damaged or unusable materials.

### Features

- Add scrap record
- Mark reason for scrap
- Deduct from inventory
- Link to work order

### Related Entities

- scrap_records

---

# 9. Sales and Dispatch Modules

## 9.1 Quotation Module

### Purpose

Creates sales quotations for customers.

### Features

- Create quotation
- Edit quotation
- Approve quotation
- Convert quotation to sales order
- Track quotation status

### Related Entities

- quotations

---

## 9.2 Sales Order Module

### Purpose

Stores confirmed customer orders.

### Features

- Create sales order
- Edit order
- Reserve stock
- Track delivery date
- Update order status

### Related Entities

- sales_orders

---

## 9.3 Invoice Module

### Purpose

Generates billing records for sales.

### Features

- Create invoice
- View invoice
- Track payment status
- Link invoice to sales order

### Related Entities

- invoices

---

## 9.4 Dispatch Module

### Purpose

Handles shipping and delivery operations.

### Features

- Create dispatch order
- Assign transport details
- Update dispatch status
- Track delivery
- Upload dispatch documents

### Related Entities

- dispatch_orders
- transport_records

---

# 10. Document Module

### Purpose

Stores and organizes industrial documents.

### Features

- Upload documents
- Categorize files
- Search documents
- Download files
- Preview files
- Link files to records
- Manage document access

### Document Types

- SOPs
- Manuals
- Certificates
- Product documents
- Reports
- Invoices
- Purchase documents

### Related Entities

- documents

---

# 11. Dashboard and Reporting Modules

## 11.1 Dashboard Module

### Purpose

Shows operational summary and key indicators.

### Features

- KPI cards
- Recent activities
- Low stock alerts
- Pending orders
- Production summary
- Purchase summary
- Sales summary
- Dispatch summary

### Related Entities

- aggregated data from multiple modules

---

## 11.2 Reports Module

### Purpose

Generates module-wise reports for the company.

### Features

- Inventory report
- Purchase report
- Production report
- Sales report
- Dispatch report
- Supplier report
- Customer report
- Export to PDF
- Export to Excel

### Related Entities

- reports generated from all modules

---

# 12. Notification Module

### Purpose

Sends alerts and reminders to users.

### Features

- In-app notifications
- Email notifications
- Low stock alerts
- Order status alerts
- Approval alerts
- Task reminders

### Related Entities

- notifications

---

# 13. Audit Module

### Purpose

Stores logs of important actions in the system.

### Features

- Login tracking
- Create/update/delete logs
- Stock movement logs
- Permission change logs
- Document upload logs
- Order completion logs

### Related Entities

- audit_logs

---

# 14. Search Module

### Purpose

Provides quick access to system records.

### Features

- Global search
- Search products
- Search suppliers
- Search customers
- Search documents
- Search orders
- Filter by status, date, factory, warehouse

### Related Entities

- multiple module collections

---

# 15. Future Modules

These modules are planned for future releases.

## 15.1 Machine Management Module

- Machine registry
- Machine categories
- Machine usage tracking

## 15.2 Quality Module

- Inspection records
- Quality checks
- Defect tracking

## 15.3 Maintenance Module

- Preventive maintenance
- Repair logs
- Spare parts tracking

## 15.4 Workflow Builder Module

- Custom workflows
- Stage configuration
- Approval flows

## 15.5 AI / RAG Module

- AI assistant
- Knowledge base
- Document retrieval

## 15.6 QR / Barcode Module

- Barcode generation
- QR scanning
- Label printing

---

# 16. Module Interaction Flow

A typical workflow may pass through several modules.

### Example: Procurement to Production

1. Purchase Request Module
2. Purchase Order Module
3. Goods Receipt Module
4. Inventory Module
5. Production Planning Module
6. Work Order Module
7. Material Consumption Module
8. Reports Module

### Example: Sales to Dispatch

1. Quotation Module
2. Sales Order Module
3. Inventory Module
4. Dispatch Module
5. Invoice Module
6. Reports Module

---

# 17. Module Design Conclusion

The DIWS module structure is designed to make the platform organized, scalable, and easy to maintain. Each module has a clear responsibility, and modules can be expanded later without affecting the entire system. This modular design is well suited for a multi-tenant industrial SaaS product and gives a strong foundation for future advanced features.
