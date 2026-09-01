import React from "react";
import "./Badge.css";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "active" | "inactive" | "maintenance" | "closed" | "primary" | "secondary" | "neutral" | "warning" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  icon,
  className = "",
}) => {
  return (
    <span className={`diws-badge diws-badge-${variant} diws-badge-${size} ${className}`}>
      {icon && <span className="diws-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
