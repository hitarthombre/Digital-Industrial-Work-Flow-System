import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../components/Logo";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Palette,
  CreditCard,
  Users,
  Factory,
  Warehouse,
  Boxes,
  ShoppingCart,
  Cpu,
  TrendingUp,
  Truck,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();

  // State to expand/collapse the Company submenu
  const [isCompanySubmenuOpen, setIsCompanySubmenuOpen] = useState(
    location.pathname.startsWith("/app/company")
  );

  const toggleCompanySubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCompanySubmenuOpen((prev) => !prev);
  };

  const isCompanyActive = location.pathname.startsWith("/app/company");

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="diws-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`diws-app-sidebar ${isMobileOpen ? "mobile-open" : ""} ${
          collapsed ? "collapsed" : ""
        }`}
      >
        {/* Sidebar Header & Brand Logo */}
        <div className="diws-sidebar-header">
          <div className="diws-sidebar-logo-container">
            <Logo
              variant={collapsed ? "mark" : "full"}
              size="sm"
              darkBg
            />
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            className="diws-sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            className="diws-sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items Container */}
        <nav className="diws-sidebar-nav">
          {/* GROUP 1: HOME */}
          <div className="diws-sidebar-group">
            {!collapsed && <div className="diws-sidebar-group-label">HOME</div>}

            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <LayoutDashboard size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </div>

          {/* GROUP 2: COMPANY MANAGEMENT */}
          <div className="diws-sidebar-group">
            {!collapsed && <div className="diws-sidebar-group-label">COMPANY</div>}

            {/* Parent Collapsible Button */}
            <button
              className={`diws-sidebar-item diws-sidebar-submenu-trigger ${
                isCompanyActive ? "active" : ""
              }`}
              onClick={toggleCompanySubmenu}
            >
              <div className="diws-sidebar-item-left">
                <Building2 size={18} className="diws-sidebar-icon" />
                {!collapsed && <span>Company Management</span>}
              </div>
              {!collapsed && (
                <div className="diws-sidebar-submenu-arrow">
                  {isCompanySubmenuOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
              )}
            </button>

            {/* Submenu List */}
            {isCompanySubmenuOpen && !collapsed && (
              <div className="diws-sidebar-submenu">
                <NavLink
                  to="/app/company"
                  end
                  className={({ isActive }) =>
                    `diws-sidebar-subitem ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <Building2 size={15} />
                  <span>Company Profile</span>
                </NavLink>

                <NavLink
                  to="/app/company/settings"
                  className={({ isActive }) =>
                    `diws-sidebar-subitem ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <Settings size={15} />
                  <span>Regional Settings</span>
                </NavLink>

                <NavLink
                  to="/app/company/branding"
                  className={({ isActive }) =>
                    `diws-sidebar-subitem ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <Palette size={15} />
                  <span>Branding & Logo</span>
                </NavLink>

                <NavLink
                  to="/app/company/subscription"
                  className={({ isActive }) =>
                    `diws-sidebar-subitem ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <CreditCard size={15} />
                  <span>Subscription</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* GROUP 3: ORGANIZATION */}
          <div className="diws-sidebar-group">
            {!collapsed && <div className="diws-sidebar-group-label">ORGANIZATION</div>}

            <NavLink
              to="/app/users"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Users size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>User Management</span>}
            </NavLink>

            <NavLink
              to="/app/factories"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Factory size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Factories</span>}
            </NavLink>

            <NavLink
              to="/app/warehouses"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Warehouse size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Warehouses</span>}
            </NavLink>
          </div>

          {/* GROUP 4: OPERATIONS */}
          <div className="diws-sidebar-group">
            {!collapsed && <div className="diws-sidebar-group-label">OPERATIONS</div>}

            <NavLink
              to="/app/inventory"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Boxes size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Inventory</span>}
            </NavLink>

            <NavLink
              to="/app/procurement"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <ShoppingCart size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Procurement</span>}
            </NavLink>

            <NavLink
              to="/app/production"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Cpu size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Production</span>}
            </NavLink>

            <NavLink
              to="/app/sales"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <TrendingUp size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Sales</span>}
            </NavLink>

            <NavLink
              to="/app/dispatch"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <Truck size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Dispatch</span>}
            </NavLink>
          </div>

          {/* GROUP 5: RECORDS */}
          <div className="diws-sidebar-group">
            {!collapsed && <div className="diws-sidebar-group-label">RECORDS</div>}

            <NavLink
              to="/app/documents"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <FileText size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Documents</span>}
            </NavLink>

            <NavLink
              to="/app/reports"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <BarChart3 size={18} className="diws-sidebar-icon" />
              {!collapsed && <span>Reports</span>}
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer Info */}
        {!collapsed && (
          <div className="diws-sidebar-footer">
            <div className="diws-sidebar-footer-card">
              <span className="diws-footer-badge">DIWS v1.0</span>
              <p>Multi-Tenant Industrial Platform</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
