import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  companyId?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted session on initial render
    const storedToken = localStorage.getItem("diws_token");
    const storedUser = localStorage.getItem("diws_user");

    if (storedToken && storedToken !== "undefined" && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch fresh profile & permissions
        const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
        const meUrl = rawApiUrl.endsWith('/api') ? `${rawApiUrl}/auth/me` : `${rawApiUrl}/api/auth/me`;

        fetch(meUrl, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Profile request returned status ${res.status}`);
            }
            return res.json();
          })
          .then((resData) => {
            if (resData.success && resData.data?.user) {
              const freshUser: User = {
                id: resData.data.user._id || resData.data.user.id || parsedUser.id,
                firstName: resData.data.user.firstName || parsedUser.firstName,
                lastName: resData.data.user.lastName || parsedUser.lastName,
                email: resData.data.user.email || parsedUser.email,
                role: resData.data.user.role || parsedUser.role,
                companyId: resData.data.user.companyId?._id || resData.data.user.companyId || parsedUser.companyId,
                permissions: resData.data.permissions || resData.data.user.permissions || [],
              };
              setUser(freshUser);
              localStorage.setItem("diws_user", JSON.stringify(freshUser));
            }
          })
          .catch((err) => {
            console.warn("Could not refresh user profile on startup", err);
          });
      } catch (error) {
        console.error("Failed to parse persisted user details", error);
        localStorage.removeItem("diws_token");
        localStorage.removeItem("diws_user");
      }
    } else {
      localStorage.removeItem("diws_token");
      localStorage.removeItem("diws_refresh_token");
      localStorage.removeItem("diws_user");
    }
    setLoading(false);

    const onAuthLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("diws_auth_logout", onAuthLogout);
    return () => window.removeEventListener("diws_auth_logout", onAuthLogout);
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("diws_token", newToken);
    localStorage.setItem("diws_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("diws_token");
    localStorage.removeItem("diws_refresh_token");
    localStorage.removeItem("diws_user");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem("diws_user", JSON.stringify(updated));
    }
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Super-user roles bypass granular permission checks
    if (user.role === "Company Owner" || user.role === "Company Admin") {
      return true;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(permission) || user.permissions.includes("*");
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === "Company Owner" || user.role === "Company Admin") {
      return true;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return permissions.some((p) => user.permissions?.includes(p) || user.permissions?.includes("*"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        hasPermission,
        hasAnyPermission,
        hasRole,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
