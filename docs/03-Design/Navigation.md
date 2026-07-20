# Navigation.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** Navigation Structure Document

---

# 1. Overview

This document defines the navigation structure for the Digital Industrial Workflow System (DIWS). The navigation is designed to make the platform easy to use for industrial and manufacturing teams while keeping the interface organized by module and role.

The navigation should be clean, simple, and scalable so that future modules can be added without major redesign.

---

# 2. Navigation Principles

- Keep the main menu simple and clear
- Group related modules together
- Show only allowed items based on user role
- Make navigation easy for factory staff and office staff
- Support multi-company switching
- Keep important actions accessible in one or two clicks
- Ensure the layout works on desktop and mobile screens

---

# 3. Main Navigation Layout

The platform should use a **sidebar + top bar** layout.

## Sidebar

The sidebar contains the primary modules.

## Top Bar

The top bar contains:

- Company switcher
- Global search
- Notifications
- User profile menu
- Theme toggle

---

# 4. Public Navigation

These routes are available before login.

- Home
- About
- Features
- Pricing
- Contact
- Login
- Register
- Forgot Password

---

# 5. Company App Navigation

These items are visible after login for company users.

## 5.1 Dashboard

- Overview
- KPIs
- Recent Activity
- Alerts

## 5.2 Company

- Company Profile
- Company Settings
- Branding
- Subscription

## 5.3 Users

- User List
- Invite User
- Roles
- Departments
- Permissions

## 5.4 Factories

- Factory List
- Create Factory
- Factory Details

## 5.5 Warehouses

- Warehouse List
- Create Warehouse
- Warehouse Details
- Transfers

## 5.6 Products

- Product List
- Create Product
- Categories
- Variants
- Attributes

## 5.7 Suppliers

- Supplier List
- Create Supplier
- Supplier Details

## 5.8 Customers

- Customer List
- Create Customer
- Customer Details

## 5.9 Inventory

- Stock Overview
- Stock In
- Stock Out
- Stock Transfer
- Stock Adjustment
- Stock History

## 5.10 Procurement

- Purchase Requests
- Purchase Orders
- Goods Receipt
- Purchase Returns

## 5.11 Production

- Production Plan
- Work Orders
- Production Stages
- Material Consumption
- Scrap Records

## 5.12 Sales

- Quotations
- Sales Orders
- Invoices
- Sales History

## 5.13 Dispatch

- Dispatch Orders
- Transport Details
- Delivery Tracking
- Dispatch Documents

## 5.14 Documents

- Document List
- Upload Document
- Categories
- Search Documents

## 5.15 Reports

- Inventory Reports
- Purchase Reports
- Production Reports
- Sales Reports
- Dispatch Reports
- Export Options

## 5.16 Notifications

- Notification List
- Unread Notifications
- Notification History

## 5.17 Audit

- Activity Logs
- Audit Logs

## 5.18 Settings

- Profile Settings
- Password Change
- Preferences
- Logout

---

# 6. Platform Admin Navigation

These items are visible only to platform-level users.

## 6.1 Dashboard

- Platform Overview
- Company Metrics
- System Metrics

## 6.2 Companies

- Company List
- Company Details
- Approvals
- Subscription Status

## 6.3 Users

- Platform Users
- Support Users
- Role Management

## 6.4 Support

- Tickets
- User Help Requests
- Resolutions

## 6.5 Analytics

- Usage Trends
- Growth Metrics
- Activity Reports

## 6.6 Audit Logs

- System Logs
- Security Logs
- Action History

## 6.7 System Settings

- Feature Flags
- Configuration
- Maintenance Settings

---

# 7. Role-Based Navigation Rules

The menu should change based on the logged-in user's role.

## Example Rules

- A **Company Owner** sees all company modules
- A **Factory Manager** sees factory-related modules
- A **Warehouse Manager** sees inventory and warehouse modules
- A **Purchase Manager** sees procurement modules
- A **Sales Executive** sees sales and customer modules
- A **Dispatch Manager** sees dispatch modules
- A **Platform Admin** sees platform modules only

---

# 8. Suggested Sidebar Grouping

## Group 1: Home

- Dashboard

## Group 2: Organization

- Company
- Users
- Factories
- Warehouses

## Group 3: Master Data

- Products
- Suppliers
- Customers

## Group 4: Operations

- Inventory
- Procurement
- Production
- Sales
- Dispatch

## Group 5: Records

- Documents
- Reports
- Notifications
- Audit

## Group 6: Settings

- Settings
- Logout

---

# 9. Mobile Navigation

For mobile devices, the sidebar should collapse into:

- hamburger menu
- bottom sheet or drawer navigation
- quick access actions for common modules

### Mobile Priorities

- Dashboard
- Inventory
- Production
- Sales
- Dispatch
- Notifications

---

# 10. Navigation States

Each menu item should support the following states:

- Active
- Hovered
- Collapsed
- Disabled
- Hidden by role

---

# 11. Breadcrumb Navigation

Breadcrumbs should be shown on inner pages to help users understand where they are.

### Example

Dashboard > Inventory > Stock History

### Example

Production > Work Orders > Work Order Details

---

# 12. Quick Action Navigation

Important actions should be available from dashboard cards or top buttons.

## Examples

- Create Purchase Order
- Add Stock
- Create Work Order
- Create Sales Order
- Upload Document
- View Reports

---

# 13. Search Navigation

The top search should allow users to quickly find:

- Products
- Suppliers
- Customers
- Orders
- Documents
- Users
- Warehouses

---

# 14. Navigation Conclusion

The DIWS navigation structure is designed to keep the system simple, efficient, and scalable. It organizes the platform by business function and user role, helping manufacturing teams quickly access the tools they need while keeping the interface easy to learn and expand in future versions.
