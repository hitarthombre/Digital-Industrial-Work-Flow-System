# TODO.md

# Digital Industrial Workflow System (DIWS)

Version: 1.0

---

## 1. Project Setup

- [X] Finalize project scope
- [X] Finalize MVP features
- [X] Prepare folder structure
- [X] Set up Git repository
- [X] Set up frontend project
- [X] Set up backend project
- [X] Configure environment variables
- [X] Create base documentation files

---

## 2. Documentation

- [X] PRD.md
- [X] Roadmap.md
- [X] Architecture.md
- [X] Database.md
- [X] API.md
- [X] Design.md
- [X] UI.md
- [X] Navigation.md
- [X] Routes.md
- [X] Modules.md
- [X] TODO.md

---

## 3. Frontend Setup

- [X] Create React app
- [X] Add TypeScript
- [X] Add Tailwind CSS
- [X] Add UI component library
- [X] Set up routing
- [X] Create layout structure
- [X] Create reusable components
- [X] Set up state management
- [X] Set up form handling
- [X] Set up API integration
- [X] Add table components
- [X] Add chart components

---

## 4. Backend Setup

- [X] Create Node + Express server
- [X] Add TypeScript
- [X] Set up project structure
- [X] Configure database connection
- [X] Configure authentication
- [X] Configure middleware
- [X] Configure logging
- [X] Configure validation
- [X] Configure error handling
- [X] Set up file upload support
- [X] Set up background jobs
- [X] Set up notifications

---

## 5. Authentication & Security

- [X] User registration
- [X] Login system
- [X] Forgot password
- [X] Password reset
- [X] Email verification
- [X] JWT authentication
- [X] Role-based access control
- [X] Permission checks
- [X] Company-based access isolation
- [X] Session handling
- [X] Logout flow

---

## 5.1 Workspace Layout & Protected Guard

- [x] Protected Route Guard (`ProtectedRoute.tsx`)
- [x] App Shell Layout (`DashboardLayout.tsx`)
- [x] Sidebar Navigation Menu (`Sidebar.tsx`)
- [x] Workspace Header & User Profile Dropdown (`Header.tsx`)

---

## 6. Company Management

### Backend (API & Business Logic)

- [x] Company Profile Controller & Service (`GET /api/companies/:id`, `PUT /api/companies/:id`)
- [x] Company Settings Endpoints (`PUT /api/companies/:id/settings`)
- [x] Company Branding & Logo Upload Endpoint (`POST /api/companies/:id/logo`)
- [x] Subscription Details & Plan Management Endpoints (`GET/PUT /api/companies/:id/subscription`)
- [x] Multi-tenant company workspace isolation verification

### Frontend (UI Pages & Forms)
- [x] Company Profile Page (`/app/company`)
- [x] Company Settings Page (`/app/company/settings`)
- [x] Company Branding & Logo Upload Page (`/app/company/branding`)
- [x] Company Subscription & Plan Page (`/app/company/subscription`)
- [x] Company Switcher Component (`Header.tsx` / `Sidebar.tsx`)

---

## 7. User Management

### Backend (API & Business Logic)

- [x] User management service & controller (`GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`)
- [x] Create / add user manually endpoint (`POST /api/users`)
- [x] Edit user profile & contact info endpoint (`PUT /api/users/:id`)
- [x] Role & department assignment logic (`PUT /api/users/:id`)
- [x] Activate/deactivate user status endpoint (`PATCH /api/users/:id/status`)
- [x] User list, pagination & search filtering (`GET /api/users`)
- [x] User invitation & email token flow (`POST /api/users/invite`)
- [x] User activity history endpoint (`GET /api/users/:id/activity`)

### Frontend (UI Pages & Forms)

- [x] User List Page (`/app/users`)
- [x] Add User / Invite User Form & Modal (`/app/users/new`)
- [x] User Details View (`/app/users/:id`)
- [x] Edit User Profile Page (`/app/users/:id/edit`)
- [x] Role & Department Selector Controls
- [x] User Status Toggle & Deactivation Dialog
- [x] User Activity History Timeline Component

---

## 8. Factory Management

### Backend (API & Business Logic)

- [x] Factory model, service & controller (`GET /api/factories`, `POST /api/factories`, `PUT /api/factories/:id`, `DELETE /api/factories/:id`)
- [x] Create factory endpoint (`POST /api/factories`)
- [x] Edit factory details endpoint (`PUT /api/factories/:id`)
- [x] Factory deletion / deactivation endpoint (`DELETE /api/factories/:id`)
- [x] Factory list & search query endpoint (`GET /api/factories`)
- [x] Factory details retrieval endpoint (`GET /api/factories/:id`)
- [x] Factory location & geo-coordinates mapping
- [x] Factory manager assignment logic
- [x] Factory status management (`PATCH /api/factories/:id/status`)

### Frontend (UI Pages & Forms)

- [x] Factory List Page (`/app/factories`)
- [x] Create Factory Page & Form (`/app/factories/new`)
- [x] Factory Details View (`/app/factories/:id`)
- [x] Edit Factory Page (`/app/factories/:id/edit`)
- [x] Factory Location & Address Form Component
- [x] Factory Manager & Status Assignment Controls

---

## 9. Warehouse Management

- [x] Create warehouse
- [x] Edit warehouse
- [x] Delete warehouse
- [x] Warehouse list
- [x] Warehouse details
- [x] Warehouse location
- [x] Warehouse transfer flow

---

## 10. Product Management

- [x] Create product
- [x] Edit product
- [x] Delete product
- [x] Product list
- [x] Product categories
- [x] Product variants
- [x] Custom attributes
- [x] Product unit of measurement
- [x] Product image upload
- [x] Product document attachment

---

## 11. Supplier Management

- [x] Create supplier
- [x] Edit supplier
- [x] Delete supplier
- [x] Supplier list
- [x] Supplier details
- [x] Supplier documents
- [x] Purchase history

---

## 12. Customer Management

- [x] Create customer
- [x] Edit customer
- [x] Delete customer
- [x] Customer list
- [x] Customer details
- [x] Customer order history
- [x] Customer documents

---

## 13. Inventory Management

### Backend (API, Schemas & Business Logic)

- [x] Create Mongoose schemas for Inventory, StockMovement, StockAdjustment, and LowStockAlert
- [x] Implement Stock In endpoint (`POST /api/inventory/stock-in`)
- [x] Implement Stock Out endpoint (`POST /api/inventory/stock-out`)
- [x] Implement Stock Transfer endpoint (`POST /api/inventory/transfer`)
- [x] Implement Stock Adjustment endpoint (`POST /api/inventory/adjust`)
- [x] Build Stock Movement History logging endpoint (`GET /api/inventory/history`)
- [x] Support Raw Material stock endpoint (`GET /api/inventory/raw-materials`) & Finished Goods stock endpoint (`GET /api/inventory/finished-goods`)
- [x] Implement Low Stock Alert check service and notification trigger (`GET /api/inventory/alerts/low-stock`)
- [x] Generate Inventory Reports endpoint (`GET /api/inventory/reports`)
- [x] Add Zod validation schemas, Winston logging, and audit error handling for all inventory routes

### Frontend (UI Pages & Components)

- [x] Create Inventory Overview Page (`/app/inventory`) with tabs for Raw Materials & Finished Goods
- [x] Build Stock In (`StockInModal.tsx`) & Stock Out (`StockOutModal.tsx`) modal forms with real-time field validation
- [x] Design Stock Transfer Form (`StockTransferModal.tsx`) for transferring inventory between warehouses
- [x] Create Stock Adjustment Form (`StockAdjustmentModal.tsx`) for manual cycle count reconciliations
- [x] Build Low Stock Alert Banner & Notification Panel drawer (`LowStockAlertBanner.tsx`)
- [x] Implement Stock Movement History Timeline & Audit Log Table (`StockMovementTimeline.tsx`)
- [x] Build Inventory Reports & Stock Distribution Chart Components (`InventoryReportsCharts.tsx`)
- [x] Integrate React Query / Axios hooks with backend `/api/inventory` endpoints (`useInventory.ts` & `inventoryService.ts`)

---

## 14. Procurement Module

- [x] Purchase request creation & Form Modal (`PurchaseRequestModal.tsx` & `PurchaseRequestsList.tsx`)
- [x] Purchase request approval & RBAC controls (`PurchaseRequestModal.tsx`)
- [x] Purchase order creation & management (`PurchaseOrderModal.tsx` & `PurchaseOrdersList.tsx`)
- [x] Purchase order live tracking & progress bar (`POLiveTracker.tsx` & `PurchaseOrderDetailsPage.tsx`)
- [x] Goods receipt note (GRN) inspection form (`GRNFormModal.tsx`)
- [x] Purchase return request modal (`PurchaseReturnModal.tsx`)
- [x] Supplier purchase history timeline tab (`PurchaseHistoryTimeline.tsx`)
- [x] Procurement summary reports dashboard & API integration (`ProcurementDashboard.tsx`, `useProcurement.ts`, `procurementService.ts`)


## 15. Production Module

- [x] Production planning (`ProductionPlan` model, `/api/production/plans`, plans tab in `ProductionDashboard.tsx`)
- [x] Work order creation (`WorkOrder` model, `POST /api/production/work-orders`, `WorkOrderModal`)
- [x] Job card management (`/work-orders/:id/job-cards`, job cards panel in `WorkOrderDetails.tsx`)
- [x] Production stage tracking (`PATCH /work-orders/:id/stages/:stageId`, stage tracker)
- [x] Material consumption (`POST /work-orders/:id/consume` issues raw material stock, `ConsumeMaterialModal`)
- [x] Production completion (`POST /work-orders/:id/output` receives finished goods, `RecordOutputModal`)
- [x] Scrap tracking (`POST /work-orders/:id/scrap`, scrap log)
- [x] Production reports (`GET /api/production/reports`, reports tab)

---

## 16. Sales Module

- [x] Quotation creation (`Quotation` model, `/api/sales/quotations`, `QuotationsList.tsx`, convert-to-order flow)
- [x] Sales order creation (`SalesOrder` model, `POST /api/sales/orders`, `SalesOrderModal`, synced to customer order history)
- [x] Sales order approval (`PATCH /api/sales/orders/:id/approve`, `OrderApprovalModal`)
- [x] Sales invoice creation (`SalesInvoice` model, `POST /api/sales/invoices`, `InvoiceModal`)
- [x] Sales payment tracking (`POST /api/sales/invoices/:id/payments`, overdue detection, `InvoicesList.tsx`)
- [x] Sales history (`GET /api/sales/history` activity feed on `SalesDashboard.tsx`)
- [x] Sales reports (`GET /api/sales/reports`, revenue trend, top customers/products)


## 17. Dispatch Module

- [x] Dispatch order creation (`DispatchOrder` model, `POST /api/dispatch`, from a sales order or ad hoc)
- [x] Transport details entry (`PUT /api/dispatch/:id/transport`, `TransportModal`)
- [x] Delivery tracking (`GET /api/dispatch/:id/track`, progress stepper in `DispatchDetails.tsx`)
- [x] Shipment status update (`PATCH /api/dispatch/:id/status`, deducts stock on ship, updates sales order)
- [x] Dispatch document upload (`POST /api/dispatch/:id/documents`, `DispatchDocumentModal`)
- [x] Dispatch reports (`GET /api/dispatch/reports`, reports tab in `DispatchList.tsx`)

---

## 18. Document Management

- [x] Upload documents
- [x] Categorize documents (`Document` model with categories, category browser in `DocumentLibrary.tsx`)
- [x] Search documents (`GET /api/documents?search=` across title, file, tags, number, linked record)
- [x] Preview files
- [x] Download files
- [x] Link files to records
- [x] Store SOPs (`sop` category in the document library)
- [x] Store manuals (`manual` category in the document library)
- [x] Store certificates
- [x] Store product documents

---

## 19. Dashboard

- [x] Build main dashboard (`MainDashboard.tsx` at `/app/dashboard`, `GET /api/dashboard/summary`)
- [x] Add KPI cards
- [x] Add recent activity panel
- [x] Add inventory summary
- [x] Add production summary
- [x] Add procurement summary
- [x] Add sales summary
- [x] Add alerts section
- [x] Add quick action buttons

---

## 20. Reports

- [x] Inventory report (`GET /api/reports/inventory`, `ReportsCenter.tsx`)
- [x] Purchase report
- [x] Production report
- [x] Sales report
- [x] Dispatch report
- [x] Supplier report
- [x] Customer report
- [x] Export PDF (`GET /api/reports/:type/export?format=pdf`, PDFKit)
- [x] Export Excel (`GET /api/reports/:type/export?format=xlsx`, ExcelJS)

---

## 21. Notifications

- [x] In-app notifications
- [x] Email notifications
- [x] Low stock alerts
- [x] Order status alerts (PO, sales order, work order, plan and shipment status changes notify the owners; bell in `Header.tsx`)
- [x] Task reminders (`reminder.service.ts` hourly sweep: overdue work orders/invoices, late POs/shipments, pending approvals)
- [x] Notification history

---

## 22. Search & Filters

- [x] Global search (`GET /api/search`, permission-aware; `GlobalSearch.tsx` with Ctrl+K)
- [x] Module-wise search
- [x] Date filters
- [x] Status filters
- [x] Factory filters
- [x] Warehouse filters
- [x] Sort options
- [x] Saved filters (`SavedFilter` model, `/api/saved-filters`, `SavedFiltersBar` on operations lists)

---

## 23. Activity & Audit

- [x] Activity timeline
- [x] Audit log system
- [x] Track create/update/delete events
- [x] Track login/logout events
- [x] Track permission changes (role create/update/delete and user role changes audited under `permissions`)
- [x] Track stock changes (stock in/out/transfer/adjust audited under `inventory`; `AuditTrail.tsx` "Stock changes" view)

---

## 24. Validation & Error Handling

- [x] Form validation
- [x] API validation
- [x] File validation
- [x] Permission error handling
- [x] Not found page
- [x] Server error page
- [x] Loading states
- [x] Empty states

---

## 25. Testing

- [ ] Test authentication
- [ ] Test RBAC
- [ ] Test company isolation
- [ ] Test inventory flow
- [ ] Test procurement flow
- [ ] Test production flow
- [ ] Test sales flow
- [ ] Test dispatch flow
- [ ] Test document upload
- [ ] Test reports
- [ ] Test notifications

---

## 26. Deployment

- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Connect database
- [ ] Configure storage
- [ ] Configure Redis
- [ ] Set environment variables
- [ ] Configure domain
- [ ] Configure SSL
- [ ] Production testing

---

## 27. Future Enhancements

- [ ] AI assistant
- [ ] RAG knowledge base
- [ ] Machine management
- [ ] Maintenance module
- [ ] Quality module
- [ ] QR code support
- [ ] Barcode support
- [ ] Workflow builder
- [ ] OCR
- [ ] Mobile app
- [ ] IoT integration
- [ ] PLC integration
- [ ] Predictive analytics
- [ ] Supplier portal
- [ ] Customer portal

---

## 28. Final Review

- [ ] Check all requirements
- [ ] Review all documents
- [ ] Verify module completeness
- [ ] Verify route structure
- [ ] Verify database design
- [ ] Verify API design
- [ ] Prepare presentation
- [ ] Prepare demo
- [ ] Final project submission
