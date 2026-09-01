import React, { useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import { api } from "../../services/api";
import { Send, Mail, Shield, CheckCircle2, AlertCircle, Copy } from "lucide-react";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");
  const [departmentId, setDepartmentId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    role: string;
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          id: string;
          email: string;
          role: string;
          inviteUrl: string;
          expiresAt: string;
        };
      }>("/users/invite", {
        email: email.trim(),
        role,
        departmentId: departmentId.trim() || undefined,
      });

      if (response.data) {
        setInviteResult(response.data);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteUrl) {
      navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleReset = () => {
    setEmail("");
    setRole("Employee");
    setDepartmentId("");
    setError(null);
    setInviteResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Invite Team Member"
      maxWidth="md"
    >
      {inviteResult ? (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <CheckCircle2 size={28} className="text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Invitation Sent Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                An email invitation has been dispatched to <strong>{inviteResult.email}</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Direct Workspace Access Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteResult.inviteUrl}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 outline-none"
              />
              <Button
                variant={copied ? "primary" : "secondary"}
                type="button"
                onClick={handleCopyLink}
                icon={copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              This tokenized activation URL will expire in 7 days.
            </p>
          </div>

          <div className="flex justify-end mt-2">
            <Button variant="copper" type="button" onClick={handleReset}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <p className="text-xs text-slate-500">
            Send an email invitation link for a new user to set up their account and join your company workspace.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 text-slate-400" size={16} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition cursor-pointer"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Operator">Operator</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department Code / ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. DEPT-PROD-01"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-2">
            <Button variant="outline" type="button" onClick={handleReset} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="copper"
              type="submit"
              loading={submitting}
              icon={<Send size={16} />}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default InviteUserModal;
