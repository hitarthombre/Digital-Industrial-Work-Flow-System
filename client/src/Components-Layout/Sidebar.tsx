import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Palette,
  CreditCard,
  Users,
  UserCheck,
  Factory,
  Warehouse,
  Boxes,
  Package,
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
  Receipt,
  ShieldCheck,
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
  const { hasPermission, user } = useAuth();

  // State to expand/collapse submenus
  const [isCompanySubmenuOpen, setIsCompanySubmenuOpen] = useState(
    location.pathname.startsWith("/app/company")
  );

  const [isProcurementSubmenuOpen, setIsProcurementSubmenuOpen] = useState(
    location.pathname.startsWith("/app/procurement")
  );

  const [isSalesSubmenuOpen, setIsSalesSubmenuOpen] = useState(
    location.pathname.startsWith("/app/sales")
  );

  const toggleCompanySubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCompanySubmenuOpen((prev) => !prev);
  };

  const toggleProcurementSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProcurementSubmenuOpen((prev) => !prev);
  };

  const isCompanyActive = location.pathname.startsWith("/app/company");
  const isProcurementActive = location.pathname.startsWith("/app/procurement");
  const isSalesActive = location.pathname.startsWith("/app/sales");

  // Permission Checks
  const canViewCompany = hasPermission("company:read") || hasPermission("company:settings:read");
  const canViewCompanyProfile = hasPermission("company:read");
  const canViewCompanySettings = hasPermission("company:settings:read");
  const canViewCompanyBranding = hasPermission("company:branding:update") || hasPermission("company:read");
  const canViewCompanySubscription = hasPermission("company:read");

  const canViewUsers = hasPermission("users:read");
  const canViewFactories = hasPermission("factories:read");
  const canViewWarehouses = hasPermission("warehouses:read");
  const canViewSuppliers = hasPermission("procurement:read") || hasPermission("suppliers:read");
  const canViewCustomers = hasPermission("sales:read") || hasPermission("customers:read");
  const hasOrganizationGroup = canViewUsers || canViewFactories || canViewWarehouses || canViewSuppliers || canViewCustomers;

  const canViewProducts = hasPermission("products:read");
  const canViewInventory = hasPermission("inventory:read");
  const canViewProcurement = hasPermission("procurement:read");
  const canViewProduction = hasPermission("production:read");
  const canViewSales = hasPermission("sales:read");
  const canViewDispatch = hasPermission("dispatch:read");
  const hasOperationsGroup = canViewProducts || canViewInventory || canViewProcurement || canViewProduction || canViewSales || canViewDispatch;

  const canViewDocuments = hasPermission("documents:read");
  const canViewReports = hasPermission("reports:read");
  const canViewAudit = hasPermission("audit:read") || hasPermission("roles:manage") || user?.role === "Company Owner" || user?.role === "Company Admin";
  const hasRecordsGroup = canViewDocuments || canViewReports || canViewAudit;

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
          {!collapsed ? (
            <>
              <div className="diws-sidebar-logo-container">
                <Logo variant="full" size="sm" darkBg />
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                className="diws-sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          ) : (
            <div className="diws-sidebar-collapsed-header">
              {/* Desktop Expand Toggle */}
              <button
                className="diws-sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}

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
              title="Dashboard"
              className={({ isActive }) =>
                `diws-sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onCloseMobile}
            >
              <div className="diws-sidebar-item-left">
                <LayoutDashboard size={18} className="diws-sidebar-icon" />
                {!collapsed && <span>Dashboard</span>}
              </div>
            </NavLink>
          </div>

          {/* GROUP 2: COMPANY MANAGEMENT */}
          {canViewCompany && (
            <div className="diws-sidebar-group">
              {!collapsed && <div className="diws-sidebar-group-label">COMPANY</div>}

              {/* Parent Collapsible Button */}
              <button
                className={`diws-sidebar-item diws-sidebar-submenu-trigger ${
                  isCompanyActive ? "active" : ""
                }`}
                title="Company Management"
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
                  {canViewCompanyProfile && (
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
                  )}

                  {canViewCompanySettings && (
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
                  )}

                  {canViewCompanyBranding && (
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
                  )}

                  {canViewCompanySubscription && (
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* GROUP 3: ORGANIZATION */}
          {hasOrganizationGroup && (
            <div className="diws-sidebar-group">
              {!collapsed && <div className="diws-sidebar-group-label">ORGANIZATION</div>}

              {canViewUsers && (
                <NavLink
                  to="/app/users"
                  title="User Management"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Users size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>User Management</span>}
                  </div>
                </NavLink>
              )}

              {canViewFactories && (
                <NavLink
                  to="/app/factories"
                  title="Factories"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Factory size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Factories</span>}
                  </div>
                </NavLink>
              )}

              {canViewWarehouses && (
                <NavLink
                  to="/app/warehouses"
                  title="Warehouses"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Warehouse size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Warehouses</span>}
                  </div>
                </NavLink>
              )}

              {canViewSuppliers && (
                <NavLink
                  to="/app/suppliers"
                  title="Suppliers"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Building2 size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Suppliers</span>}
                  </div>
                </NavLink>
              )}

              {canViewCustomers && (
                <NavLink
                  to="/app/customers"
                  title="Customers"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <UserCheck size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Customers</span>}
                  </div>
                </NavLink>
              )}
            </div>
          )}

          {/* GROUP 4: OPERATIONS */}
          {hasOperationsGroup && (
            <div className="diws-sidebar-group">
              {!collapsed && <div className="diws-sidebar-group-label">OPERATIONS</div>}

              {canViewProducts && (
                <NavLink
                  to="/app/products"
                  title="Products"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Package size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Products</span>}
                  </div>
                </NavLink>
              )}

              {canViewInventory && (
                <NavLink
                  to="/app/inventory"
                  title="Inventory"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Boxes size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Inventory</span>}
                  </div>
                </NavLink>
              )}

              {/* Procurement Nav Trigger & Submenu */}
              {canViewProcurement && (
                <>
                  <button
                    className={`diws-sidebar-item diws-sidebar-submenu-trigger ${
                      isProcurementActive ? "active" : ""
                    }`}
                    title="Procurement"
                    onClick={toggleProcurementSubmenu}
                  >
                    <div className="diws-sidebar-item-left">
                      <ShoppingCart size={18} className="diws-sidebar-icon" />
                      {!collapsed && <span>Procurement</span>}
                    </div>
                    {!collapsed && (
                      <div className="diws-sidebar-submenu-arrow">
                        {isProcurementSubmenuOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    )}
                  </button>

                  {isProcurementSubmenuOpen && !collapsed && (
                    <div className="diws-sidebar-submenu">
                      <NavLink
                        to="/app/procurement"
                        end
                        className={({ isActive }) =>
                          `diws-sidebar-subitem ${isActive ? "active" : ""}`
                        }
                        onClick={onCloseMobile}
                      >
                        <BarChart3 size={15} />
                        <span>Dashboard</span>
                      </NavLink>

                      <NavLink
                        to="/app/procurement/requests"
                        className={({ isActive }) =>
                          `diws-sidebar-subitem ${isActive ? "active" : ""}`
                        }
                        onClick={onCloseMobile}
                      >
                        <ShoppingCart size={15} />
                        <span>Purchase Requests</span>
                      </NavLink>

                      <NavLink
                        to="/app/procurement/orders"
                        className={({ isActive }) =>
                          `diws-sidebar-subitem ${isActive ? "active" : ""}`
                        }
                        onClick={onCloseMobile}
                      >
                        <FileText size={15} />
                        <span>Purchase Orders</span>
                      </NavLink>
                    </div>
                  )}
                </>
              )}

              {canViewProduction && (
                <NavLink
                  to="/app/production"
                  title="Production"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Cpu size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Production</span>}
                  </div>
                </NavLink>
              )}

              {/* Sales Nav Trigger & Submenu */}
              {canViewSales && (
                <>
                  <button
                    className={`diws-sidebar-item diws-sidebar-submenu-trigger ${
                      isSalesActive ? "active" : ""
                    }`}
                    title="Sales"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSalesSubmenuOpen((prev) => !prev);
                    }}
                  >
                    <div className="diws-sidebar-item-left">
                      <TrendingUp size={18} className="diws-sidebar-icon" />
                      {!collapsed && <span>Sales</span>}
                    </div>
                    {!collapsed && (
                      <div className="diws-sidebar-submenu-arrow">
                        {isSalesSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    )}
                  </button>

                  {isSalesSubmenuOpen && !collapsed && (
                    <div className="diws-sidebar-submenu">
                      {[
                        { to: "/app/sales", label: "Overview", icon: <BarChart3 size={15} />, end: true },
                        { to: "/app/sales/quotations", label: "Quotations", icon: <FileText size={15} /> },
                        { to: "/app/sales/orders", label: "Sales Orders", icon: <ShoppingCart size={15} /> },
                        { to: "/app/sales/invoices", label: "Invoices", icon: <Receipt size={15} /> },
                      ].map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => `diws-sidebar-subitem ${isActive ? "active" : ""}`}
                          onClick={onCloseMobile}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}

              {canViewDispatch && (
                <NavLink
                  to="/app/dispatch"
                  title="Dispatch & Logistics"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <Truck size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Dispatch</span>}
                  </div>
                </NavLink>
              )}
            </div>
          )}

          {/* GROUP 5: RECORDS */}
          {hasRecordsGroup && (
            <div className="diws-sidebar-group">
              {!collapsed && <div className="diws-sidebar-group-label">RECORDS</div>}

              {canViewDocuments && (
                <NavLink
                  to="/app/documents"
                  title="Documents"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <FileText size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Documents</span>}
                  </div>
                </NavLink>
              )}

              {canViewReports && (
                <NavLink
                  to="/app/reports"
                  title="Reports"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <BarChart3 size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Reports</span>}
                  </div>
                </NavLink>
              )}

              {canViewAudit && (
                <NavLink
                  to="/app/audit"
                  title="Audit Trail"
                  className={({ isActive }) =>
                    `diws-sidebar-item ${isActive ? "active" : ""}`
                  }
                  onClick={onCloseMobile}
                >
                  <div className="diws-sidebar-item-left">
                    <ShieldCheck size={18} className="diws-sidebar-icon" />
                    {!collapsed && <span>Audit Trail</span>}
                  </div>
                </NavLink>
              )}
            </div>
          )}
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
