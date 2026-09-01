import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./Components-Layout/Navbar";
import Footer from "./Components-Layout/Footer";
import DashboardLayout from "./Components-Layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";

import CompanyProfile from "./pages/company/CompanyProfile";
import CompanySettings from "./pages/company/CompanySettings";
import CompanyBranding from "./pages/company/CompanyBranding";
import CompanySubscription from "./pages/company/CompanySubscription";

import UserList from "./pages/users/UserList";
import CreateUser from "./pages/users/CreateUser";
import UserDetails from "./pages/users/UserDetails";
import EditUser from "./pages/users/EditUser";
import AcceptInvitation from "./pages/AcceptInvitation";

import FactoryList from "./pages/factories/FactoryList";
import CreateFactory from "./pages/factories/CreateFactory";
import FactoryDetails from "./pages/factories/FactoryDetails";
import EditFactory from "./pages/factories/EditFactory";

// Public Layout Shell Wrapper
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/accept-invite" element={<AcceptInvitation />} />
          </Route>

          {/* Protected Company App Workspace Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/company" replace />} />
            <Route path="dashboard" element={<Navigate to="/app/company" replace />} />
            <Route path="company" element={<CompanyProfile />} />
            <Route path="company/settings" element={<CompanySettings />} />
            <Route path="company/branding" element={<CompanyBranding />} />
            <Route path="company/subscription" element={<CompanySubscription />} />

            {/* User Management Module Routes */}
            <Route path="users" element={<UserList />} />
            <Route path="users/new" element={<CreateUser />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="users/:id/edit" element={<EditUser />} />

            {/* Factory Management Module Routes */}
            <Route path="factories" element={<FactoryList />} />
            <Route path="factories/new" element={<CreateFactory />} />
            <Route path="factories/:id" element={<FactoryDetails />} />
            <Route path="factories/:id/edit" element={<EditFactory />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}