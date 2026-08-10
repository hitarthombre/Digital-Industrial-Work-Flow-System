import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../custom-ui.css";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          minHeight: "100vh", 
          backgroundColor: "var(--ivory, #F7F4ED)",
          gap: "1rem"
        }}
      >
        <span className="diws-spinner" style={{ width: "36px", height: "36px", borderTopColor: "var(--copper, #B87333)" }} />
        <p style={{ color: "var(--text-muted, #66736A)", fontSize: "0.95rem", fontWeight: 500 }}>
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
