import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Building2,
  ChevronDown,
  Search,
  User as UserIcon,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Check,
  Palette,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}

export interface CompanyOption {
  id: string;
  name: string;
  code: string;
  logo?: string;
  plan?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeCompanyId,
  onCompanyChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available companies for the company switcher
  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      try {
        const response = await api.get<{ success: boolean; data: any[] }>("/companies");
        if (isMounted && response?.data && response.data.length > 0) {
          const formatted = response.data.map((c) => ({
            id: c._id || c.id,
            name: c.name,
            code: c.code,
            logo: c.logo,
            plan: c.subscriptionPlan,
          }));
          setCompanies(formatted);

          // Set active company
          const active =
            formatted.find((c) => c.id === activeCompanyId) ||
            formatted.find((c) => c.id === user?.companyId) ||
            formatted[0];
          setSelectedCompany(active);
        } else if (isMounted) {
          // Fallback initial workspace company
          const defaultComp: CompanyOption = {
            id: user?.companyId || "default-company",
            name: "Apex Industrial Corp",
            code: "APEX",
            plan: "growth",
          };
          setCompanies([
            defaultComp,
            { id: "comp-2", name: "Global Steel Works", code: "GSW", plan: "starter" },
            { id: "comp-3", name: "Titan Furniture Mfg", code: "TFM", plan: "enterprise" },
          ]);
          setSelectedCompany(defaultComp);
        }
      } catch (_) {
        if (isMounted) {
          // Fallback companies list
          const defaultComp: CompanyOption = {
            id: user?.companyId || "default-company",
            name: "Apex Industrial Corp",
            code: "APEX",
            plan: "growth",
          };
          setCompanies([
            defaultComp,
            { id: "comp-2", name: "Global Steel Works", code: "GSW", plan: "starter" },
            { id: "comp-3", name: "Titan Furniture Mfg", code: "TFM", plan: "enterprise" },
          ]);
          setSelectedCompany(defaultComp);
        }
      }
    };

    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, [user?.companyId, activeCompanyId]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCompanyDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCompany = (comp: CompanyOption) => {
    setSelectedCompany(comp);
    setIsCompanyDropdownOpen(false);
    if (onCompanyChange) {
      onCompanyChange(comp.id);
    }
  };

  const userFullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Industrial User";

  return (
    <header className="diws-app-header">
      <div className="diws-header-left">
        {/* Mobile menu button */}
        <button
          className="diws-header-icon-btn diws-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Company Workspace Switcher Dropdown */}
        <div className="diws-company-switcher" ref={companyDropdownRef}>
          <button
            className="diws-company-switcher-trigger"
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            aria-expanded={isCompanyDropdownOpen}
          >
            <div className="diws-company-avatar">
              {selectedCompany?.logo ? (
                <img
                  src={selectedCompany.logo}
                  alt={selectedCompany.name}
                  className="diws-company-avatar-img"
                />
              ) : (
                <Building2 size={18} className="diws-company-avatar-icon" />
              )}
            </div>

            <div className="diws-company-info">
              <span className="diws-company-name">
                {selectedCompany?.name || "Select Company"}
              </span>
              <span className="diws-company-code">
                {selectedCompany?.code ? `[${selectedCompany.code}]` : "WORKSPACE"}
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`diws-switcher-chevron ${isCompanyDropdownOpen ? "open" : ""}`}
            />
          </button>

          {/* Company Switcher Menu */}
          {isCompanyDropdownOpen && (
            <div className="diws-dropdown-menu diws-company-dropdown-menu">
              <div className="diws-dropdown-header">
                <p className="diws-dropdown-title">Switch Workspace</p>
                <span className="diws-dropdown-subtitle">
                  Select active manufacturing company
                </span>
              </div>

              <div className="diws-dropdown-divider" />

              <div className="diws-company-list">
                {companies.map((comp) => {
                  const isSelected = selectedCompany?.id === comp.id;
                  return (
                    <button
                      key={comp.id}
                      className={`diws-company-option ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectCompany(comp)}
                    >
                      <div className="diws-company-avatar-sm">
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.name} />
                        ) : (
                          <Building2 size={14} />
                        )}
                      </div>
                      <div className="diws-company-option-text">
                        <div className="diws-company-option-name">{comp.name}</div>
                        <div className="diws-company-option-meta">
                          <span>{comp.code}</span>
                          {comp.plan && (
                            <span className="diws-plan-badge">{comp.plan}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={16} className="diws-check-icon" />}
                    </button>
                  );
                })}
              </div>

              <div className="diws-dropdown-divider" />

              <Link
                to="/app/company"
                className="diws-dropdown-action-btn"
                onClick={() => setIsCompanyDropdownOpen(false)}
              >
                <Building2 size={16} />
                <span>Manage Current Company</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="diws-header-center">
        <div className="diws-search-bar">
          <Search size={16} className="diws-search-icon" />
          <input
            type="text"
            placeholder="Search products, orders, warehouses, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="diws-search-shortcut">Ctrl K</kbd>
        </div>
      </div>

      {/* Right Side: Quick Links & Profile Dropdown */}
      <div className="diws-header-right">
        {/* User Profile Menu */}
        <div className="diws-profile-dropdown" ref={profileDropdownRef}>
          <button
            className="diws-profile-trigger"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="diws-user-avatar">
              <UserIcon size={18} />
            </div>
            <div className="diws-user-meta">
              <span className="diws-user-name">{userFullName}</span>
              <span className="diws-user-role">{user?.role || "Company Admin"}</span>
            </div>
            <ChevronDown size={14} className="diws-profile-chevron" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileDropdownOpen && (
            <div className="diws-dropdown-menu diws-profile-dropdown-menu">
              <div className="diws-user-profile-header">
                <div className="diws-profile-header-avatar">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="diws-profile-header-name">{userFullName}</p>
                  <p className="diws-profile-header-email">{user?.email}</p>
                  <span className="diws-role-pill">{user?.role || "Company Admin"}</span>
                </div>
              </div>

              <div className="diws-dropdown-divider" />

              <Link
                to="/app/company"
                className="diws-dropdown-item"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <Building2 size={16} />
                <span>Company Profile</span>
              </Link>

              <Link
                to="/app/company/settings"
                className="diws-dropdown-item"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <Settings size={16} />
                <span>Company Settings</span>
              </Link>

              <Link
                to="/app/company/branding"
                className="diws-dropdown-item"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <Palette size={16} />
                <span>Branding & Logo</span>
              </Link>

              <Link
                to="/app/company/subscription"
                className="diws-dropdown-item"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                <CreditCard size={16} />
                <span>Subscription Plan</span>
              </Link>

              <div className="diws-dropdown-divider" />

              <button
                className="diws-dropdown-item diws-logout-item"
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
