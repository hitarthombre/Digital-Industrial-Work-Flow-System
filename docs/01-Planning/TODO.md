# TODO.md

# Digital Industrial Workflow System (DIWS)

Version: 1.0

---

## 1. Project Setup

- [x] Finalize project scope
- [x] Finalize MVP features
- [x] Prepare folder structure
- [x] Set up Git repository
- [x] Set up frontend project
- [x] Set up backend project
- [x] Configure environment variables
- [x] Create base documentation files

---

## 2. Documentation

- [x] PRD.md
- [x] Roadmap.md
- [x] Architecture.md
- [x] Database.md
- [x] API.md
- [x] Design.md
- [x] UI.md
- [x] Navigation.md
- [x] Routes.md
- [x] Modules.md
- [x] TODO.md

---

## 3. Frontend Setup

- [x] Create React app
- [x] Add TypeScript
- [x] Add Tailwind CSS
- [x] Add UI component library
- [x] Set up routing
- [x] Create layout structure
- [x] Create reusable components
- [x] Set up state management
- [x] Set up form handling
- [x] Set up API integration
- [x] Add table components
- [x] Add chart components

---

## 4. Backend Setup

- [x] Create Node + Express server
- [x] Add TypeScript
- [x] Set up project structure
- [x] Configure database connection
- [x] Configure authentication
- [x] Configure middleware
- [x] Configure logging
- [x] Configure validation
- [x] Configure error handling
- [x] Set up file upload support
- [x] Set up background jobs
- [x] Set up notifications

---

## 5. Authentication & Security

- [x] User registration
- [x] Login system
- [x] Forgot password
- [x] Password reset
- [x] Email verification
- [x] JWT authentication
- [x] Role-based access control
- [x] Permission checks
- [x] Company-based access isolation
- [x] Session handling
- [x] Logout flow

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

- [ ] Create warehouse
- [ ] Edit warehouse
- [ ] Delete warehouse
- [ ] Warehouse list
- [ ] Warehouse details
- [ ] Warehouse location
- [ ] Warehouse transfer flow

---

## 10. Product Management

- [ ] Create product
- [ ] Edit product
- [ ] Delete product
- [ ] Product list
- [ ] Product categories
- [ ] Product variants
- [ ] Custom attributes
- [ ] Product unit of measurement
- [ ] Product image upload
- [ ] Product document attachment

---

## 11. Supplier Management

- [ ] Create supplier
- [ ] Edit supplier
- [ ] Delete supplier
- [ ] Supplier list
- [ ] Supplier details
- [ ] Supplier documents
- [ ] Purchase history

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

- [ ] Add stock in
- [ ] Stock out
- [ ] Stock transfer
- [ ] Stock adjustment
- [ ] Stock history
- [ ] Raw material stock
- [ ] Finished goods stock
- [ ] Low stock alerts
- [ ] Inventory reports
- [ ] Stock movement logs

---

## 14. Procurement Module

- [ ] Purchase request creation
- [ ] Purchase request approval
- [ ] Purchase order creation
- [ ] Purchase order tracking
- [ ] Goods receipt note
- [ ] Purchase returns
- [ ] Supplier purchase history
- [ ] Procurement reports

---

## 15. Production Module

- [ ] Production planning
- [ ] Work order creation
- [ ] Job card management
- [ ] Production stage tracking
- [ ] Material consumption
- [ ] Production completion
- [ ] Scrap tracking
- [ ] Production reports

---

## 16. Sales Module

- [ ] Quotation creation
- [ ] Sales order creation
- [ ] Sales order approval
- [ ] Sales invoice creation
- [ ] Sales payment tracking
- [ ] Sales history
- [ ] Sales reports

---

## 17. Dispatch Module

- [ ] Dispatch order creation
- [ ] Transport details entry
- [ ] Delivery tracking
- [ ] Shipment status update
- [ ] Dispatch document upload
- [ ] Dispatch reports

---

## 18. Document Management

- [ ] Upload documents
- [ ] Categorize documents
- [ ] Search documents
- [ ] Preview files
- [ ] Download files
- [ ] Link files to records
- [ ] Store SOPs
- [ ] Store manuals
- [ ] Store certificates
- [ ] Store product documents

---

## 19. Dashboard

- [ ] Build main dashboard
- [ ] Add KPI cards
- [ ] Add recent activity panel
- [ ] Add inventory summary
- [ ] Add production summary
- [ ] Add procurement summary
- [ ] Add sales summary
- [ ] Add alerts section
- [ ] Add quick action buttons

---

## 20. Reports

- [ ] Inventory report
- [ ] Purchase report
- [ ] Production report
- [ ] Sales report
- [ ] Dispatch report
- [ ] Supplier report
- [ ] Customer report
- [ ] Export PDF
- [ ] Export Excel

---

## 21. Notifications

- [ ] In-app notifications
- [ ] Email notifications
- [ ] Low stock alerts
- [ ] Order status alerts
- [ ] Task reminders
- [ ] Notification history

---

## 22. Search & Filters

- [ ] Global search
- [ ] Module-wise search
- [ ] Date filters
- [ ] Status filters
- [ ] Factory filters
- [ ] Warehouse filters
- [ ] Sort options
- [ ] Saved filters

---

## 23. Activity & Audit

- [ ] Activity timeline
- [ ] Audit log system
- [ ] Track create/update/delete events
- [ ] Track login/logout events
- [ ] Track permission changes
- [ ] Track stock changes

---

## 24. Validation & Error Handling

- [ ] Form validation
- [ ] API validation
- [ ] File validation
- [ ] Permission error handling
- [ ] Not found page
- [ ] Server error page
- [ ] Loading states
- [ ] Empty states

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
