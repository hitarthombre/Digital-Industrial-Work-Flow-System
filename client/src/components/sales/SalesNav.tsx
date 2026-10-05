import React from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/app/sales", label: "Overview", end: true },
  { to: "/app/sales/quotations", label: "Quotations" },
  { to: "/app/sales/orders", label: "Sales Orders" },
  { to: "/app/sales/invoices", label: "Invoices & Payments" },
];

export const SalesNav: React.FC = () => (
  <div className="proc-tabs-bar">
    {LINKS.map((link) => (
      <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `proc-tab-btn no-underline ${isActive ? "active" : ""}`}>
        {link.label}
      </NavLink>
    ))}
  </div>
);

export default SalesNav;
