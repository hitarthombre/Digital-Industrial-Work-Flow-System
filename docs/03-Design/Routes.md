# Routes.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** Route Structure Document

---

# 1. Overview

This document defines the application route structure for the Digital Industrial Workflow System (DIWS). The routes are organized by public pages, company app pages, and platform admin pages.

The route design should support a clean, scalable, and role-based experience for all users.

---

# 2. Routing Principles

- Keep public and protected routes separate
- Group app routes by module
- Use nested routes for related pages
- Protect company and admin routes with authentication
- Apply role-based route guards
- Support dynamic detail pages
- Keep URLs readable and predictable

---

# 3. Public Routes

These routes are accessible without login.

| Route              | Purpose              |
| ------------------ | -------------------- |
| `/`                | Landing page         |
| `/about`           | About the platform   |
| `/features`        | Platform features    |
| `/pricing`         | Pricing plans        |
| `/contact`         | Contact page         |
| `/login`           | User login           |
| `/register`        | Company registration |
| `/forgot-password` | Password recovery    |
| `/reset-password`  | Reset password       |
| `/terms`           | Terms and conditions |
| `/privacy`         | Privacy policy       |

---

# 4. Authentication Routes

These routes are used for account access and session handling.

| Route              | Purpose            |
| ------------------ | ------------------ |
| `/login`           | Login              |
| `/register`        | Register company   |
| `/forgot-password` | Request reset link |
| `/reset-password`  | Set new password   |
| `/logout`          | Logout action      |

---

# 5. Company App Routes

These routes are available after login for company users.

## 5.1 Dashboard Routes

| Route                     | Purpose                 |
| ------------------------- | ----------------------- |
| `/app`                    | Redirect to dashboard   |
| `/app/dashboard`          | Main dashboard overview |
| `/app/dashboard/overview` | KPI and summary view    |

---

## 5.2 Company Routes

| Route                       | Purpose              |
| --------------------------- | -------------------- |
| `/app/company`              | Company profile      |
| `/app/company/settings`     | Company settings     |
| `/app/company/branding`     | Branding and logo    |
| `/app/company/subscription` | Subscription details |

---

## 5.3 User Routes

| Route                  | Purpose            |
| ---------------------- | ------------------ |
| `/app/users`           | User list          |
| `/app/users/new`       | Add user           |
| `/app/users/:id`       | User details       |
| `/app/users/:id/edit`  | Edit user          |
| `/app/roles`           | Role list          |
| `/app/roles/new`       | Create role        |
| `/app/roles/:id`       | Role details       |
| `/app/departments`     | Department list    |
| `/app/departments/new` | Create department  |
| `/app/departments/:id` | Department details |

---

## 5.4 Factory Routes

| Route                     | Purpose         |
| ------------------------- | --------------- |
| `/app/factories`          | Factory list    |
| `/app/factories/new`      | Create factory  |
| `/app/factories/:id`      | Factory details |
| `/app/factories/:id/edit` | Edit factory    |

---

## 5.5 Warehouse Routes

| Route                           | Purpose             |
| ------------------------------- | ------------------- |
| `/app/warehouses`               | Warehouse list      |
| `/app/warehouses/new`           | Create warehouse    |
| `/app/warehouses/:id`           | Warehouse details   |
| `/app/warehouses/:id/edit`      | Edit warehouse      |
| `/app/warehouses/transfers`     | Warehouse transfers |
| `/app/warehouses/transfers/new` | Create transfer     |
| `/app/warehouses/transfers/:id` | Transfer details    |

---

## 5.6 Product Routes

| Route                         | Purpose          |
| ----------------------------- | ---------------- |
| `/app/products`               | Product list     |
| `/app/products/new`           | Create product   |
| `/app/products/:id`           | Product details  |
| `/app/products/:id/edit`      | Edit product     |
| `/app/product-categories`     | Category list    |
| `/app/product-categories/new` | Create category  |
| `/app/product-categories/:id` | Category details |
| `/app/product-variants`       | Variant list     |

---

## 5.7 Supplier Routes

| Route                     | Purpose          |
| ------------------------- | ---------------- |
| `/app/suppliers`          | Supplier list    |
| `/app/suppliers/new`      | Create supplier  |
| `/app/suppliers/:id`      | Supplier details |
| `/app/suppliers/:id/edit` | Edit supplier    |

---

## 5.8 Customer Routes

| Route                     | Purpose          |
| ------------------------- | ---------------- |
| `/app/customers`          | Customer list    |
| `/app/customers/new`      | Create customer  |
| `/app/customers/:id`      | Customer details |
| `/app/customers/:id/edit` | Edit customer    |

---

## 5.9 Inventory Routes

| Route                       | Purpose            |
| --------------------------- | ------------------ |
| `/app/inventory`            | Inventory overview |
| `/app/inventory/stock`      | Stock list         |
| `/app/inventory/stock-in`   | Stock in           |
| `/app/inventory/stock-out`  | Stock out          |
| `/app/inventory/transfer`   | Stock transfer     |
| `/app/inventory/adjustment` | Stock adjustment   |
| `/app/inventory/history`    | Inventory history  |
| `/app/inventory/alerts`     | Low stock alerts   |

---

## 5.10 Procurement Routes

| Route                           | Purpose                  |
| ------------------------------- | ------------------------ |
| `/app/procurement`              | Procurement overview     |
| `/app/procurement/requests`     | Purchase request list    |
| `/app/procurement/requests/new` | Create purchase request  |
| `/app/procurement/requests/:id` | Purchase request details |
| `/app/procurement/orders`       | Purchase order list      |
| `/app/procurement/orders/new`   | Create purchase order    |
| `/app/procurement/orders/:id`   | Purchase order details   |
| `/app/procurement/grn`          | Goods receipt list       |
| `/app/procurement/grn/new`      | Create goods receipt     |
| `/app/procurement/grn/:id`      | Goods receipt details    |

---

## 5.11 Production Routes

| Route                             | Purpose                 |
| --------------------------------- | ----------------------- |
| `/app/production`                 | Production overview     |
| `/app/production/plans`           | Production plan list    |
| `/app/production/plans/new`       | Create production plan  |
| `/app/production/plans/:id`       | Production plan details |
| `/app/production/work-orders`     | Work order list         |
| `/app/production/work-orders/new` | Create work order       |
| `/app/production/work-orders/:id` | Work order details      |
| `/app/production/stages`          | Stage tracking          |
| `/app/production/consumption`     | Material consumption    |
| `/app/production/scrap`           | Scrap records           |

---

## 5.12 Sales Routes

| Route                       | Purpose             |
| --------------------------- | ------------------- |
| `/app/sales`                | Sales overview      |
| `/app/sales/quotations`     | Quotation list      |
| `/app/sales/quotations/new` | Create quotation    |
| `/app/sales/quotations/:id` | Quotation details   |
| `/app/sales/orders`         | Sales order list    |
| `/app/sales/orders/new`     | Create sales order  |
| `/app/sales/orders/:id`     | Sales order details |
| `/app/sales/invoices`       | Invoice list        |
| `/app/sales/invoices/new`   | Create invoice      |
| `/app/sales/invoices/:id`   | Invoice details     |

---

## 5.13 Dispatch Routes

| Route                      | Purpose                |
| -------------------------- | ---------------------- |
| `/app/dispatch`            | Dispatch overview      |
| `/app/dispatch/orders`     | Dispatch order list    |
| `/app/dispatch/orders/new` | Create dispatch order  |
| `/app/dispatch/orders/:id` | Dispatch order details |
| `/app/dispatch/transport`  | Transport records      |
| `/app/dispatch/delivery`   | Delivery tracking      |
| `/app/dispatch/documents`  | Dispatch documents     |

---

## 5.14 Document Routes

| Route                       | Purpose             |
| --------------------------- | ------------------- |
| `/app/documents`            | Document list       |
| `/app/documents/upload`     | Upload document     |
| `/app/documents/:id`        | Document details    |
| `/app/documents/categories` | Document categories |
| `/app/documents/search`     | Search documents    |

---

## 5.15 Reports Routes

| Route                      | Purpose             |
| -------------------------- | ------------------- |
| `/app/reports`             | Reports dashboard   |
| `/app/reports/inventory`   | Inventory reports   |
| `/app/reports/procurement` | Procurement reports |
| `/app/reports/production`  | Production reports  |
| `/app/reports/sales`       | Sales reports       |
| `/app/reports/dispatch`    | Dispatch reports    |
| `/app/reports/suppliers`   | Supplier reports    |
| `/app/reports/customers`   | Customer reports    |
| `/app/reports/export`      | Export center       |

---

## 5.16 Notifications Routes

| Route                         | Purpose               |
| ----------------------------- | --------------------- |
| `/app/notifications`          | Notification list     |
| `/app/notifications/:id`      | Notification details  |
| `/app/notifications/settings` | Notification settings |

---

## 5.17 Audit Routes

| Route            | Purpose           |
| ---------------- | ----------------- |
| `/app/audit`     | Audit log list    |
| `/app/audit/:id` | Audit log details |
| `/app/activity`  | Activity timeline |

---

## 5.18 Settings Routes

| Route                       | Purpose            |
| --------------------------- | ------------------ |
| `/app/settings`             | Main settings page |
| `/app/settings/profile`     | Profile settings   |
| `/app/settings/security`    | Security settings  |
| `/app/settings/preferences` | Preferences        |
| `/app/settings/logout`      | Logout action      |

---

# 6. Platform Admin Routes

These routes are available only to platform-level users.

## 6.1 Admin Dashboard

| Route              | Purpose                     |
| ------------------ | --------------------------- |
| `/admin`           | Redirect to admin dashboard |
| `/admin/dashboard` | Platform overview           |

---

## 6.2 Company Administration

| Route                               | Purpose              |
| ----------------------------------- | -------------------- |
| `/admin/companies`                  | Company list         |
| `/admin/companies/:id`              | Company details      |
| `/admin/companies/:id/approvals`    | Approval screen      |
| `/admin/companies/:id/subscription` | Subscription details |

---

## 6.3 Platform Users

| Route              | Purpose                  |
| ------------------ | ------------------------ |
| `/admin/users`     | Platform user list       |
| `/admin/users/:id` | Platform user details    |
| `/admin/roles`     | Platform role management |

---

## 6.4 Support

| Route                        | Purpose           |
| ---------------------------- | ----------------- |
| `/admin/support`             | Support dashboard |
| `/admin/support/tickets`     | Support tickets   |
| `/admin/support/tickets/:id` | Ticket details    |

---

## 6.5 Analytics

| Route                     | Purpose            |
| ------------------------- | ------------------ |
| `/admin/analytics`        | Platform analytics |
| `/admin/analytics/usage`  | Usage metrics      |
| `/admin/analytics/growth` | Growth metrics     |

---

## 6.6 Audit and System

| Route                         | Purpose              |
| ----------------------------- | -------------------- |
| `/admin/audit`                | System audit logs    |
| `/admin/settings`             | Platform settings    |
| `/admin/settings/features`    | Feature flags        |
| `/admin/settings/maintenance` | Maintenance settings |

---

# 7. Dynamic Routes

Dynamic routes should be used for detail pages.

### Examples

- `/app/products/:id`
- `/app/customers/:id`
- `/app/suppliers/:id`
- `/app/factories/:id`
- `/app/warehouses/:id`
- `/app/procurement/orders/:id`
- `/app/production/work-orders/:id`
- `/app/sales/orders/:id`
- `/app/dispatch/orders/:id`
- `/app/documents/:id`

---

# 8. Route Guard Rules

## Public Guard

Allows access to public pages only.

## Auth Guard

Allows access only to logged-in users.

## Company Guard

Ensures the user belongs to a valid company workspace.

## Role Guard

Checks if the user has permission to access a page or action.

## Platform Admin Guard

Restricts platform admin routes to internal system users only.

---

# 9. Redirect Rules

- `/` should route to landing page for guests
- authenticated company users should be redirected to `/app/dashboard`
- authenticated platform users should be redirected to `/admin/dashboard`
- unknown routes should show a 404 page
- unauthorized access should show a 403 page

---

# 10. Error Routes

| Route  | Purpose        |
| ------ | -------------- |
| `/404` | Page not found |
| `/403` | Access denied  |
| `/500` | Server error   |

---

# 11. Suggested Route Naming Convention

Use:

- lowercase
- hyphen-separated words
- plural nouns for list pages
- `new` for create pages
- `:id` for detail pages
- `:id/edit` for edit pages

### Examples

- `/app/products`
- `/app/products/new`
- `/app/products/:id`
- `/app/products/:id/edit`

---

# 12. Route Structure Conclusion

The DIWS route structure is organized by module and role so the application remains easy to navigate, scalable, and maintainable. This structure supports the full industrial workflow while keeping public, company, and platform-admin areas clearly separated.
