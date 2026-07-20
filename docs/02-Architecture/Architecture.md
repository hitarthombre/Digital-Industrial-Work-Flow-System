# Architecture.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** System Architecture  
**Project Type:** Multi-Tenant Industrial SaaS Platform

---

# 1. Architecture Overview

Digital Industrial Workflow System (DIWS) is a cloud-based, multi-tenant SaaS platform designed for manufacturing and industrial organizations. The system enables multiple companies to register and operate independently on the same platform while keeping their data logically isolated.

The architecture is designed to support core industrial workflows such as company management, factory management, warehouse management, product management, inventory control, procurement, production, sales, dispatch, document management, reporting, and notifications.

The platform follows a modular architecture so that each business domain can be developed, tested, and scaled independently.

---

# 2. Architectural Goals

- Support multiple companies on one platform
- Keep tenant data isolated and secure
- Provide a scalable industrial workflow system
- Make modules reusable and maintainable
- Support future expansion into advanced features
- Keep the system easy to understand and operate
- Provide a strong foundation for AI, RAG, and automation later

---

# 3. High-Level System Architecture

```text
                    Digital Industrial Workflow System

                     ┌────────────────────────────┐
                     │        Frontend App        │
                     │  React + TypeScript + UI   │
                     └──────────────┬─────────────┘
                                    │
                                    ▼
                     ┌────────────────────────────┐
                     │         API Server         │
                     │ Node.js + Express + JWT    │
                     └──────────────┬─────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
   ┌──────────────┐       ┌────────────────┐       ┌────────────────┐
   │ MongoDB Atlas │       │ File Storage   │       │ Background Jobs │
   │ Main Database │       │ Cloud Storage   │       │ Queue + Worker  │
   └──────────────┘       └────────────────┘       └────────────────┘
```

---

# 4. Architecture Style

DIWS follows these architectural principles:

- Client-Server Architecture
- Multi-Tenant SaaS Architecture
- Modular Monolithic Backend for easier development and maintenance in the initial phase
- REST API-Based Communication
- Role-Based Access Control
- Document-Oriented Data Design
- Cloud-Based Storage and Deployment

---

# 5. Core Layers

## 5.1 Presentation Layer

This layer is responsible for the user interface and user interaction.

### Responsibilities

- Display dashboards
- Show tables, forms, charts, and reports
- Handle user actions
- Validate form inputs
- Communicate with backend APIs

### Technologies

- React
- TypeScript
- Tailwind CSS
- UI component library
- React Router
- State management tools

---

## 5.2 Application Layer

This layer contains the business logic and API services.

### Responsibilities

- Handle authentication
- Process business workflows
- Enforce permissions
- Validate requests
- Manage business rules
- Coordinate module actions

### Technologies

- Node.js
- Express.js
- TypeScript

---

## 5.3 Data Layer

This layer stores and retrieves application data.

### Responsibilities

- Store company data
- Store operational records
- Track workflow history
- Store document metadata
- Support queries and reports

### Technologies

- MongoDB Atlas
- Mongoose

---

## 5.4 File Storage Layer

This layer handles uploaded documents and media files.

### Responsibilities

- Store images
- Store PDFs
- Store product documents
- Store manuals and certificates
- Serve downloadable files

### Technologies

- Cloudflare R2 or AWS S3

---

## 5.5 Background Processing Layer

This layer handles tasks that should not block the user experience.

### Responsibilities

- Send email notifications
- Generate reports
- Process uploaded files
- Run scheduled tasks
- Index documents for future search
- Maintain audit logs

### Technologies

- Redis
- BullMQ

---

# 6. Multi-Tenant Architecture

DIWS is a multi-tenant platform, meaning several companies can use the same software instance while keeping their data separated.

## 6.1 Tenant Isolation Strategy

Each business record includes a `companyId` field. All queries and actions are filtered using this identifier.

### Example

- Company A can only see Company A data
- Company B can only see Company B data
- No cross-company access is allowed unless explicitly granted at platform level

## 6.2 Tenant-Aware Entities

The following entities should be company-aware:

- Users
- Factories
- Warehouses
- Products
- Suppliers
- Customers
- Inventory
- Procurement records
- Production records
- Sales records
- Dispatch records
- Documents
- Reports
- Notifications

---

# 7. Module-Based Architecture

The backend should be split into modules so the codebase remains clean and scalable.

## Core Modules

- Authentication
- Company Management
- User Management
- Role & Permission Management
- Factory Management
- Warehouse Management
- Product Management
- Supplier Management
- Customer Management
- Inventory Management
- Procurement
- Production Management
- Sales Management
- Dispatch Management
- Document Management
- Reports
- Notifications
- Audit Logs

Each module should contain:

- routes
- controllers
- services
- models
- validations
- helpers

---

# 8. Recommended Backend Structure

```text
server/
└── src/
    ├── modules/
    │   ├── auth/
    │   ├── company/
    │   ├── users/
    │   ├── roles/
    │   ├── factories/
    │   ├── warehouses/
    │   ├── products/
    │   ├── suppliers/
    │   ├── customers/
    │   ├── inventory/
    │   ├── procurement/
    │   ├── production/
    │   ├── sales/
    │   ├── dispatch/
    │   ├── documents/
    │   ├── reports/
    │   ├── notifications/
    │   └── audit/
    ├── middleware/
    ├── config/
    ├── utils/
    ├── jobs/
    ├── sockets/
    ├── validators/
    └── app.ts
```

---

# 9. Recommended Frontend Structure

```text
client/
└── src/
    ├── app/
    ├── pages/
    ├── layouts/
    ├── components/
    ├── features/
    ├── hooks/
    ├── services/
    ├── store/
    ├── lib/
    ├── types/
    └── utils/
```

---

# 10. Request Flow

```text
User Action
   ↓
Frontend UI
   ↓
API Request
   ↓
Authentication / Authorization Check
   ↓
Business Logic Service
   ↓
Database / File Storage / Queue
   ↓
Response
   ↓
Frontend Update
```

---

# 11. Authentication & Authorization Flow

## Authentication

- User logs in with credentials
- Server validates the credentials
- Server generates JWT token
- Token is sent to the client
- Client stores token securely

## Authorization

- Every protected route checks the token
- Role and permission checks are applied
- Company context is validated
- Access is allowed only if the user has permission

---

# 12. Data Flow

## Example: Purchase Order Flow

1. User creates purchase request
2. Request is validated
3. Purchase order is generated
4. Supplier details are linked
5. Order is stored in MongoDB
6. Notification is sent
7. Report is updated

## Example: Production Flow

1. Work order is created
2. Raw material is issued
3. Production stage updates are recorded
4. Finished goods are added to inventory
5. Reports and activity logs are updated

## Example: Dispatch Flow

1. Sales order is confirmed
2. Goods are reserved from inventory
3. Dispatch record is created
4. Delivery status is updated
5. Inventory and reports are updated

---

# 13. Database Architecture

MongoDB is used as the primary database because it supports flexible and document-oriented data structures.

## Main Data Design Principles

- Store each business entity as a collection
- Include `companyId` in all tenant-aware records
- Use timestamps for tracking
- Store only file metadata in the database
- Keep large files in object storage

## Key Collections

- companies
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
- work_orders
- sales_orders
- dispatch_orders
- documents
- notifications
- audit_logs

---

# 14. Storage Architecture

## Database Storage

Used for:

- structured business records
- relationships
- logs
- workflow states
- metadata

## Object Storage

Used for:

- images
- PDFs
- invoices
- product files
- manuals
- certificates
- reports

---

# 15. Security Architecture

## Security Controls

- JWT authentication
- Password hashing
- Role-based access control
- Tenant isolation
- Input validation
- Rate limiting
- Secure headers
- File type restrictions
- Audit logging

## Security Principles

- Never trust client input
- Validate every request
- Check company ownership on every query
- Restrict file uploads
- Log sensitive actions
- Use HTTPS in production

---

# 16. Real-Time Architecture

Certain system actions should update in real time.

## Use Cases

- Notifications
- Inventory updates
- Production status
- Dispatch status
- Dashboard counters

## Technology

- Socket.IO

---

# 17. Background Job Architecture

Some operations should run in the background.

## Use Cases

- Email sending
- PDF generation
- Scheduled alerts
- File processing
- Data export
- Report generation

## Technology

- Redis
- BullMQ

---

# 18. Reporting Architecture

Reports should be generated using data from the main database.

## Report Types

- Inventory reports
- Purchase reports
- Production reports
- Sales reports
- Dispatch reports
- Supplier reports
- Customer reports

## Export Formats

- PDF
- Excel

---

# 19. Logging & Audit Architecture

DIWS should maintain logs for important actions.

## Logged Events

- Login
- Logout
- Create
- Update
- Delete
- Stock movement
- Role changes
- Permission changes
- Document upload
- Order completion

## Purpose

- Security tracking
- Operational traceability
- Debugging
- Compliance support

---

# 20. Scalability Considerations

The system should be built to scale in the following ways:

- Add more companies without changing the core design
- Add more modules later
- Support more users per company
- Handle larger inventories and documents
- Support future AI, RAG, and automation layers
- Scale background processing independently

---

# 21. Extensibility Strategy

The architecture should allow future features to be added without major rewrite.

## Future Modules

- Machine management
- Quality control
- Maintenance
- Workflow builder
- QR/barcode support
- Mobile app
- AI assistant
- RAG knowledge base
- OCR
- IoT integration
- Third-party integrations

---

# 22. Technology Summary

## Frontend

- React
- TypeScript
- Tailwind CSS

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- MongoDB Atlas

## File Storage

- Cloudflare R2 or AWS S3

## Queue / Cache

- Redis
- BullMQ

## Real-Time

- Socket.IO

## Validation

- Zod

## Reporting

- PDF and Excel generation libraries

---

# 23. Deployment Architecture

## Production Environment

- Frontend hosted on a web hosting platform
- Backend hosted on a cloud server
- Database hosted on managed MongoDB
- Files stored in object storage
- Background jobs on a worker service

## Deployment Principles

- Separate frontend and backend deployment
- Environment-based configuration
- Secure credentials
- Production logging
- Backup strategy
- Error monitoring

---

# 24. Architecture Conclusion

DIWS uses a modular, scalable, and multi-tenant architecture to support manufacturing companies on a shared SaaS platform. The system is designed to manage core industrial workflows efficiently while remaining flexible enough to support future expansion into advanced industrial, automation, and AI-driven features.
