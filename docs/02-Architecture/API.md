# API Design

## Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** API Design Document

---

# 1. Overview

This document defines the REST API endpoints for the Digital Industrial Workflow System (DIWS). These APIs enable communication between the frontend, backend, and future third-party integrations.

---

# 2. API Standards

## Architecture

- REST API
- JSON Request/Response
- Stateless Authentication
- JWT Bearer Token
- Resource-based URLs

---

## Base URL

```
/api
```

---

## Headers

### Request

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

---

### Success Response

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

---

### Error Response

```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": []
}
```

---

# 3. Authentication

**Base Route**

```
/auth
```

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | /register        | Register Company |
| POST   | /login           | Login User       |
| POST   | /logout          | Logout User      |
| GET    | /profile         | Current User     |
| POST   | /forgot-password | Forgot Password  |
| POST   | /reset-password  | Reset Password   |
| POST   | /refresh-token   | Refresh Token    |

---

# 4. Company Management

**Base Route**

```
/companies
```

| Method | Endpoint | Description    |
| ------ | -------- | -------------- |
| GET    | /        | Get Companies  |
| GET    | /:id     | Get Company    |
| POST   | /        | Create Company |
| PUT    | /:id     | Update Company |
| DELETE | /:id     | Delete Company |

---

# 5. User Management

**Base Route**

```
/users
```

| Method | Endpoint    | Description   |
| ------ | ----------- | ------------- |
| GET    | /           | Get Users     |
| GET    | /:id        | Get User      |
| POST   | /           | Create User   |
| PUT    | /:id        | Update User   |
| DELETE | /:id        | Delete User   |
| PATCH  | /:id/status | Update Status |

---

# 6. Roles & Permissions

**Base Route**

```
/roles
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 7. Departments

**Base Route**

```
/departments
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 8. Factory Management

**Base Route**

```
/factories
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 9. Warehouse Management

**Base Route**

```
/warehouses
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 10. Product Management

**Base Route**

```
/products
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

### Product Categories

```
/product-categories
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| PUT    | /:id     |
| DELETE | /:id     |

### Product Variants

```
/product-variants
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 11. Supplier Management

**Base Route**

```
/suppliers
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 12. Customer Management

**Base Route**

```
/customers
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 13. Inventory Management

**Base Route**

```
/inventory
```

| Method | Endpoint    |
| ------ | ----------- |
| GET    | /           |
| GET    | /stock      |
| POST   | /stock-in   |
| POST   | /stock-out  |
| POST   | /transfer   |
| POST   | /adjustment |
| GET    | /history    |

---

# 14. Procurement

**Base Route**

```
/procurement
```

### Purchase Requests

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /requests     |
| POST   | /requests     |
| GET    | /requests/:id |
| PUT    | /requests/:id |
| DELETE | /requests/:id |

### Purchase Orders

| Method | Endpoint    |
| ------ | ----------- |
| GET    | /orders     |
| POST   | /orders     |
| GET    | /orders/:id |
| PUT    | /orders/:id |
| DELETE | /orders/:id |

### Goods Receipt Note

| Method | Endpoint |
| ------ | -------- |
| GET    | /grn     |
| POST   | /grn     |

---

# 15. Production Management

**Base Route**

```
/production
```

### Production Plans

| Method | Endpoint   |
| ------ | ---------- |
| GET    | /plans     |
| POST   | /plans     |
| PUT    | /plans/:id |
| DELETE | /plans/:id |

### Work Orders

| Method | Endpoint         |
| ------ | ---------------- |
| GET    | /work-orders     |
| POST   | /work-orders     |
| GET    | /work-orders/:id |
| PUT    | /work-orders/:id |
| DELETE | /work-orders/:id |

### Production Operations

| Method | Endpoint          |
| ------ | ----------------- |
| POST   | /consume-material |
| POST   | /complete         |

---

# 16. Sales Management

**Base Route**

```
/sales
```

### Quotations

| Method | Endpoint        |
| ------ | --------------- |
| GET    | /quotations     |
| POST   | /quotations     |
| PUT    | /quotations/:id |
| DELETE | /quotations/:id |

### Sales Orders

| Method | Endpoint    |
| ------ | ----------- |
| GET    | /orders     |
| POST   | /orders     |
| GET    | /orders/:id |
| PUT    | /orders/:id |
| DELETE | /orders/:id |

### Invoices

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /invoices     |
| POST   | /invoices     |
| GET    | /invoices/:id |

---

# 17. Dispatch Management

**Base Route**

```
/dispatch
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /        |
| POST   | /        |
| GET    | /:id     |
| PUT    | /:id     |
| DELETE | /:id     |

---

# 18. Documents

**Base Route**

```
/documents
```

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /             |
| POST   | /upload       |
| GET    | /:id          |
| GET    | /download/:id |
| DELETE | /:id          |

---

# 19. Dashboard

**Base Route**

```
/dashboard
```

| Method | Endpoint     |
| ------ | ------------ |
| GET    | /overview    |
| GET    | /inventory   |
| GET    | /production  |
| GET    | /sales       |
| GET    | /procurement |
| GET    | /dispatch    |

---

# 20. Reports

**Base Route**

```
/reports
```

| Method | Endpoint     |
| ------ | ------------ |
| GET    | /inventory   |
| GET    | /production  |
| GET    | /sales       |
| GET    | /procurement |
| GET    | /dispatch    |
| GET    | /suppliers   |
| GET    | /customers   |

### Export

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /export/pdf   |
| GET    | /export/excel |

---

# 21. Notifications

**Base Route**

```
/notifications
```

| Method | Endpoint  |
| ------ | --------- |
| GET    | /         |
| GET    | /:id      |
| PATCH  | /:id/read |
| PATCH  | /read-all |
| DELETE | /:id      |

---

# 22. Search

**Base Route**

```
/search
```

| Method | Endpoint   |
| ------ | ---------- |
| GET    | /global    |
| GET    | /products  |
| GET    | /customers |
| GET    | /suppliers |
| GET    | /documents |
| GET    | /orders    |

---

# 23. Audit Logs

**Base Route**

```
/audit
```

| Method | Endpoint        |
| ------ | --------------- |
| GET    | /logs           |
| GET    | /activities     |
| GET    | /activities/:id |

---

# 24. File Management

**Base Route**

```
/files
```

| Method | Endpoint      |
| ------ | ------------- |
| POST   | /upload       |
| GET    | /             |
| GET    | /:id          |
| GET    | /download/:id |
| DELETE | /:id          |

---

# 25. System APIs

**Base Route**

```
/system
```

| Method | Endpoint |
| ------ | -------- |
| GET    | /health  |
| GET    | /status  |
| GET    | /version |

---

# 26. Common Query Parameters

| Parameter   | Description         |
| ----------- | ------------------- |
| page        | Page number         |
| limit       | Items per page      |
| search      | Search keyword      |
| sort        | Sort field          |
| order       | asc / desc          |
| status      | Filter by status    |
| factoryId   | Filter by factory   |
| warehouseId | Filter by warehouse |
| from        | Start date          |
| to          | End date            |

---

# 27. Standard HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 500  | Internal Server Error |

---

# 28. API Security

- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)
- Company Data Isolation
- Request Validation
- Rate Limiting
- Audit Logging
- HTTPS Only
- Secure File Upload Validation

---

# 29. Future APIs

The following APIs are planned for future versions:

- Machine Management
- Quality Control
- Maintenance
- Workflow Automation
- Barcode Management
- QR Code Management
- OCR
- AI Assistant
- Knowledge Base
- Mobile APIs
- Third-Party Integrations
- Public API
