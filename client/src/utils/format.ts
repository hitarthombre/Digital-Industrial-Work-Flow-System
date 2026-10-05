// Shared display formatters for the operations modules

export const formatMoney = (value?: number | null) =>
  (Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (value?: number | null, digits = 2) =>
  (Number(value) || 0).toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

export const formatDateTime = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const toInputDate = (value?: string | Date | null) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const humanize = (value?: string | null) =>
  value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const timeAgo = (value?: string | Date | null) => {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

// Name of a populated reference (or a fallback when it is just an id)
export const refName = (ref: any, fallback = "—") => {
  if (!ref || typeof ref !== "object") return fallback;
  if (ref.name) return ref.name;
  if (ref.firstName || ref.lastName) return `${ref.firstName || ""} ${ref.lastName || ""}`.trim();
  return ref.email || fallback;
};

export const refId = (ref: any): string => (ref && typeof ref === "object" ? ref._id : ref) || "";

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
