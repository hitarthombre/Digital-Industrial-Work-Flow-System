# Database — Digital Industrial Workflow System (DIWS)

## Database Choice
- MongoDB Atlas

## Why MongoDB
- Flexible schema for different industries
- Easy multi-tenant modeling
- Good fit for documents, workflows, and product attributes
- Atlas Search and Vector Search support for AI

## Core Collections
- companies
- users
- roles
- permissions
- factories
- departments
- warehouses
- products
- product_categories
- product_attributes
- suppliers
- customers
- inventory_items
- stock_movements
- purchase_requests
- purchase_orders
- goods_receipts
- production_work_orders
- production_stages
- sales_orders
- dispatch_orders
- documents
- notifications
- audit_logs
- ai_documents
- ai_chunks
- embeddings

## Multi-Tenant Rule
Every business record should include:
- companyId
- createdBy
- timestamps

## File Storage Rule
Store files in object storage and save only:
- fileUrl
- fileName
- fileType
- size
- uploadedBy
- companyId

## AI Data
For RAG:
- parse documents
- chunk text
- store chunks
- generate embeddings
- retrieve relevant chunks during chat
