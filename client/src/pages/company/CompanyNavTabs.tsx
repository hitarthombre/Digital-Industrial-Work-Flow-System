import React from "react";
import { NavLink } from "react-router-dom";
import { Building2, Settings, Palette, CreditCard } from "lucide-react";

export const CompanyNavTabs: React.FC = () => {
  return (
    <div className="diws-company-nav-tabs">
      <NavLink
        to="/app/company"
        end
        className={({ isActive }) =>
          `diws-company-tab ${isActive ? "active" : ""}`
        }
      >
        <Building2 size={17} />
        <span>Company Profile</span>
      </NavLink>

      <NavLink
        to="/app/company/settings"
        className={({ isActive }) =>
          `diws-company-tab ${isActive ? "active" : ""}`
        }
      >
        <Settings size={17} />
        <span>Regional Settings</span>
      </NavLink>

      <NavLink
        to="/app/company/branding"
        className={({ isActive }) =>
          `diws-company-tab ${isActive ? "active" : ""}`
        }
      >
        <Palette size={17} />
        <span>Branding & Logo</span>
      </NavLink>

      <NavLink
        to="/app/company/subscription"
        className={({ isActive }) =>
          `diws-company-tab ${isActive ? "active" : ""}`
        }
      >
        <CreditCard size={17} />
        <span>Subscription Plan</span>
      </NavLink>
    </div>
  );
};

export default CompanyNavTabs;
