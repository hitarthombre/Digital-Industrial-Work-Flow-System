import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../custom-ui.css";

export const DashboardLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | undefined>();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleCompanyChange = (companyId: string) => {
    setActiveCompanyId(companyId);
  };

  return (
    <div className={`diws-dashboard-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Top Header */}
      <Header
        onToggleSidebar={toggleMobileSidebar}
        activeCompanyId={activeCompanyId}
        onCompanyChange={handleCompanyChange}
      />

      {/* Main Body Container */}
      <div className="diws-dashboard-body">
        {/* Left Sidebar Navigation */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <main className="diws-dashboard-content">
          <div className="diws-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
