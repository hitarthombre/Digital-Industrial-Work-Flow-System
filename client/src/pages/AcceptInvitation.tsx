import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "../components/Button";
import { Logo } from "../components/Logo";
import {
  CheckCircle2,
  AlertCircle,
  Building,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

export const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role?: string;
    companyId?: { name: string; code: string };
    invitedBy?: { firstName: string; lastName: string };
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setVerifying(false);
      setVerifyError("No invitation token provided in URL.");
    }
  }, [token]);

  const verifyToken = async (tokenStr: string) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const response = await api.get<{
        success: boolean;
        data: any;
      }>(`/users/invite/verify/${tokenStr}`);

      if (response.data) {
        setInvitationData(response.data);
      }
    } catch (err: any) {
      setVerifyError(err.message || "Invitation token is invalid or has expired.");
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.password) {
      setSubmitError("First name, last name, and password are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/users/invite/accept", {
        token,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to accept invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block mb-4">
          <Logo variant="full" size="lg" darkBg />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Join Workspace</h2>
        <p className="mt-1 text-sm text-slate-400">
          Complete your account registration to access the platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          {verifying ? (
            <div className="py-8 text-center text-slate-300">
              <RefreshCw className="animate-spin text-amber-500 mx-auto mb-3" size={32} />
              <p className="text-sm font-medium">Validating invitation token...</p>
            </div>
          ) : verifyError ? (
            <div className="py-6 text-center">
              <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Invalid Invitation</h3>
              <p className="text-xs text-rose-400 mb-6">{verifyError}</p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="py-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-extrabold text-white mb-2">Account Setup Complete!</h3>
              <p className="text-xs text-slate-300 mb-6">
                Your workspace account has been created. You can now log in with your email address and password.
              </p>
              <Button
                variant="copper"
                className="w-full"
                icon={<ArrowRight size={16} />}
                onClick={() => navigate("/login")}
              >
                Proceed to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info Banner */}
              {invitationData && (
                <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Building size={14} />
                    {invitationData.companyId?.name || "Company Workspace"}
                  </div>
                  <div>
                    Invited as: <span className="text-white font-semibold">{invitationData.role || "Employee"}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">{invitationData.email}</div>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <Button
                variant="copper"
                type="submit"
                loading={submitting}
                className="w-full mt-2"
                icon={<CheckCircle2 size={16} />}
              >
                Complete Registration
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
