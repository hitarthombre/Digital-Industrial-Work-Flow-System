# UI.md

# Digital Industrial Workflow System (DIWS)

**Version:** 1.0  
**Document Type:** User Interface Design Document  
**Project Type:** Multi-Tenant Industrial SaaS Platform

---

# 1. UI Overview

The DIWS user interface is designed for industrial and manufacturing teams to manage daily operations quickly and clearly. The UI should feel professional, structured, and easy to use even for non-technical users.

The main goals of the interface are:

- fast access to modules
- simple navigation
- clear visibility of business data
- easy form filling
- readable tables and reports
- support for multiple roles and companies

---

# 2. UI Design Goals

- Keep the interface clean and minimal
- Prioritize functionality over decoration
- Make the dashboard informative
- Use clear section spacing and hierarchy
- Make data tables easy to scan
- Make forms simple and guided
- Use consistent components everywhere
- Support both desktop and mobile layouts
- Make role-based views visually clear

---

# 3. Visual Style

## 3.1 Overall Style

The platform should use a modern industrial admin style:

- clean layout
- neutral background
- strong primary accent color
- soft shadows
- rounded cards
- simple icons
- highly readable text

## 3.2 UI Tone

- professional
- practical
- trustworthy
- operational
- efficient

## 3.3 Suggested Look

- left sidebar navigation
- top header bar
- card-based dashboard
- table-heavy operation pages
- modal and drawer actions
- status badges for workflows

---

# 4. Layout Structure

The application should use a consistent layout across all authenticated pages.

## 4.1 Main Layout

- Sidebar on the left
- Header on the top
- Content area in the center
- Optional right panel for alerts or details

## 4.2 Layout Regions

- **Sidebar:** main navigation
- **Header:** company switcher, search, notifications, profile
- **Main Content:** module screens
- **Footer:** optional, used only if needed

---

# 5. Public UI Pages

These are the pages visible before login.

## Pages

- Home / Landing page
- About page
- Features page
- Pricing page
- Contact page
- Login page
- Register page
- Forgot password page
- Reset password page
- Privacy page
- Terms page

## Public Page Style

- marketing-oriented but minimal
- large headings
- simple call-to-action buttons
- easy mobile layout
- industrial brand feeling

---

# 6. Company App UI Pages

These pages are used by company users after login.

## Main Pages

- Dashboard
- Company profile
- Users
- Roles
- Departments
- Factories
- Warehouses
- Products
- Suppliers
- Customers
- Inventory
- Procurement
- Production
- Sales
- Dispatch
- Documents
- Reports
- Notifications
- Audit logs
- Settings

---

# 7. Platform Admin UI Pages

These pages are used by platform-level users.

## Main Pages

- Platform dashboard
- Companies
- Platform users
- Support
- Analytics
- Audit logs
- Settings
- Feature flags
- Maintenance

---

# 8. Dashboard UI

The dashboard should be the most visually rich page in the system.

## 8.1 Dashboard Components

- KPI cards
- line charts
- bar charts
- status widgets
- recent activity list
- pending approvals
- low stock alerts
- production summary
- purchase summary
- sales summary
- dispatch summary

## 8.2 KPI Card Examples

- Total stock value
- Open purchase orders
- Active work orders
- Finished goods count
- Pending dispatches
- Low stock items

## 8.3 Dashboard Behavior

- show role-relevant data
- allow date range filters
- refresh data quickly
- support quick actions

---

# 9. Sidebar Navigation UI

The sidebar should be easy to scan and organized by module.

## Sidebar Groups

- Dashboard
- Organization
- Master Data
- Operations
- Records
- Settings

## Sidebar Behavior

- collapsible
- active state highlight
- icons for all items
- nested submenus
- role-based visibility

---

# 10. Top Header UI

The top bar should contain high-priority controls.

## Header Elements

- company switcher
- global search
- notification bell
- theme toggle
- user avatar
- profile menu

## Header Behavior

- fixed at top
- responsive on mobile
- compact and functional

---

# 11. Tables UI

Tables are a core part of the DIWS interface.

## Table Requirements

- sticky header
- searchable rows
- sortable columns
- pagination
- filters
- row actions
- bulk actions
- status badges
- column visibility controls

## Table Examples

- product list
- supplier list
- purchase order list
- work order list
- sales order list
- document list
- report list

## Table Design Principles

- keep text readable
- use row spacing
- highlight statuses clearly
- avoid clutter
- use action menus for row operations

---

# 12. Forms UI

Forms should be simple, structured, and easy to complete.

## Form Principles

- label above field
- inline validation
- clear required markers
- grouped sections
- helpful placeholders
- error messages in red
- save and cancel buttons clearly visible

## Form Types

- create forms
- edit forms
- step forms
- modal forms
- drawer forms

## Example Form Sections

- basic information
- contact details
- stock details
- workflow details
- documents
- status

---

# 13. Modals and Drawers

Use modals and drawers for quick tasks.

## Use Cases

- quick create
- item preview
- status update
- permission update
- file upload
- comments
- confirmation dialogs

## Design Rules

- do not overload modals with too many fields
- use drawers for detail-heavy side panels
- use confirmation dialogs for destructive actions

---

# 14. Cards UI

Cards should be used for summary data and grouped content.

## Card Usage

- KPIs
- factory summary
- warehouse summary
- document summary
- recent activity
- quick actions
- order status blocks

## Card Style

- rounded corners
- subtle shadow
- clean title area
- consistent padding
- status indicator where needed

---

# 15. Status UI

The system should use clear statuses throughout the interface.

## Common Status Badges

- Draft
- Pending
- Approved
- Rejected
- In Progress
- On Hold
- Completed
- Cancelled
- Delivered
- Overdue
- Low Stock
- Active
- Inactive

## Status Design

- use color-coded badges
- keep badge text short
- place badges near title or in table rows

---

# 16. Search and Filter UI

Search is important because the system contains many records.

## Search Types

- global search
- module-specific search
- table search
- document search

## Filters

- date range
- status
- company
- factory
- warehouse
- category
- user role
- priority

## Filter Design

- filters should be easy to reset
- use chips or dropdowns
- show applied filters clearly

---

# 17. Detail Page UI

Detail pages are used for records like products, orders, factories, warehouses, customers, and documents.

## Detail Page Sections

- summary header
- key information
- status block
- timeline
- related records
- documents
- comments
- actions

## Detail Page Behavior

- editable if permitted
- quick actions available
- clear breadcrumb navigation
- split into logical sections

---

# 18. Production UI

Production screens should focus on clarity and progress tracking.

## Production Screens

- production plan list
- work order list
- work order details
- production stage tracking
- material consumption
- scrap entries

## Production UI Elements

- stage timeline
- progress bar
- status chips
- assigned users
- consumption table
- completion summary

---

# 19. Inventory UI

Inventory screens should help users quickly understand stock movement.

## Inventory Screens

- stock overview
- raw material stock
- finished goods stock
- stock in
- stock out
- transfer history
- stock adjustment history

## Inventory UI Elements

- stock cards
- warehouse filter
- stock movement table
- low stock warnings
- movement timeline

---

# 20. Procurement UI

Procurement pages should support purchasing workflow clearly.

## Procurement Screens

- purchase request list
- purchase request form
- purchase order list
- purchase order form
- goods receipt page

## Procurement UI Elements

- request status tags
- supplier selector
- item line table
- approval block
- order summary card

---

# 21. Sales and Dispatch UI

## Sales Screens

- quotation list
- quotation form
- sales order list
- invoice list

## Dispatch Screens

- dispatch order list
- transport details
- delivery tracking
- dispatch documents

## UI Elements

- customer selector
- order items table
- invoice summary
- transport card
- delivery status tracker

---

# 22. Document UI

Documents should be easy to upload, organize, and search.

## Document Screen Features

- upload button
- drag and drop upload area
- file preview
- file metadata
- category tags
- search box
- download action
- delete action

## Supported File Types

- PDF
- JPG
- PNG
- DOCX
- XLSX
- CSV

---

# 23. Notifications UI

Notifications should be visible but not distracting.

## Notification UI

- bell icon with unread count
- notification drawer or panel
- read/unread states
- grouped notification list
- timestamps
- quick link to source record

---

# 24. Audit and Activity UI

Audit and activity screens should support traceability.

## UI Elements

- action timeline
- event cards
- filter by user
- filter by module
- date range filter
- record reference link

---

# 25. Settings UI

Settings pages should be grouped and easy to navigate.

## Settings Sections

- profile settings
- password settings
- company settings
- branding settings
- permissions settings
- notification settings
- preference settings

## Settings UI

- tabs or side menu
- clear save/update button
- confirmation on sensitive changes

---

# 26. Responsive UI Behavior

The platform must work well on different screen sizes.

## Desktop

- full sidebar
- multi-column dashboard
- large tables
- expanded panels

## Tablet

- collapsible sidebar
- stacked cards
- narrower tables

## Mobile

- drawer navigation
- single-column layout
- simplified tables
- compact action buttons

---

# 27. Component Library

The UI should be built using reusable components.

## Core Components

- Button
- Input
- Select
- Modal
- Drawer
- Table
- Badge
- Card
- Tabs
- Breadcrumb
- Alert
- Toast
- Dropdown
- Avatar
- Pagination
- Tooltip
- Date picker
- File uploader

---

# 28. Theme and Branding

The interface should support basic branding.

## Theme Features

- light mode
- dark mode
- company logo
- company name
- primary color support

## Branding Goals

- make each company workspace feel personalized
- keep the platform visually professional
- maintain consistent brand structure

---

# 29. Accessibility

The UI should be usable by as many users as possible.

## Accessibility Requirements

- readable contrast
- keyboard navigation
- clear labels
- visible focus states
- semantic headings
- descriptive button text
- accessible form errors

---

# 30. UI Conclusion

The DIWS UI should feel like a practical industrial control center. It must be simple enough for everyday use while still supporting complex manufacturing workflows. The design should prioritize clarity, speed, and role-based functionality so users can manage industrial operations efficiently.
