import type { INotification } from "../types/operations";

export interface ParsedNotification {
  cleanTitle: string;
  cleanMessage: string;
  actionUrl?: string;
  actionLabel?: string;
  isExternalLink: boolean;
  token?: string;
  category: "security" | "email" | "stock" | "order" | "dispatch" | "production" | "system";
}

export function parseNotification(n: INotification): ParsedNotification {
  const title = (n.title || "Notification").trim();
  const rawMessage = (n.message || "").trim();
  const type = (n.type || "").toLowerCase();
  const titleLower = title.toLowerCase();

  // 1. Determine Category
  let category: ParsedNotification["category"] = "system";
  if (titleLower.includes("password") || titleLower.includes("reset") || type.includes("auth")) {
    category = "security";
  } else if (titleLower.includes("verify") || titleLower.includes("email") || type.includes("email")) {
    category = "email";
  } else if (titleLower.includes("stock") || type.includes("stock") || type.includes("inventory")) {
    category = "stock";
  } else if (titleLower.includes("dispatch") || titleLower.includes("shipment") || type.includes("dispatch")) {
    category = "dispatch";
  } else if (
    titleLower.includes("order") ||
    titleLower.includes("sales") ||
    titleLower.includes("quotation") ||
    titleLower.includes("invoice") ||
    type.includes("order") ||
    type.includes("sales")
  ) {
    category = "order";
  } else if (titleLower.includes("work order") || titleLower.includes("production") || type.includes("production")) {
    category = "production";
  }

  // 2. Extract Action URL
  let actionUrl: string | undefined = n.link?.trim();
  let isExternalLink = false;

  const urlMatch = rawMessage.match(/https?:\/\/[^\s)\],]+/i);
  if (urlMatch) {
    const rawUrl = urlMatch[0];
    try {
      const parsed = new URL(rawUrl);
      if (
        parsed.hostname === window.location.hostname ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1"
      ) {
        actionUrl = parsed.pathname + parsed.search + parsed.hash;
        isExternalLink = false;
      } else {
        if (!actionUrl) actionUrl = rawUrl;
        isExternalLink = true;
      }
    } catch {
      if (!actionUrl) actionUrl = rawUrl;
    }
  }

  // 3. Extract Token (64 or 32 hex chars, or any long token string)
  let token: string | undefined;
  const tokenRegex = /(?:Reset Token|Verification Token|Token)[:=\s]+([a-fA-F0-9]{16,64})/i;
  const tokenMatch = rawMessage.match(tokenRegex);
  if (tokenMatch) {
    token = tokenMatch[1];
  } else if (actionUrl) {
    const queryTokenMatch = actionUrl.match(/[?&]token=([a-fA-F0-9]{16,64})/i);
    if (queryTokenMatch) {
      token = queryTokenMatch[1];
    }
  }

  // 4. Action Label
  let actionLabel = "View Details";
  if (actionUrl) {
    if (actionUrl.includes("reset-password") || titleLower.includes("password")) {
      actionLabel = "Reset Password";
    } else if (actionUrl.includes("verify-email") || titleLower.includes("verify")) {
      actionLabel = "Verify Email";
    } else if (actionUrl.includes("/dispatch") || category === "dispatch") {
      actionLabel = "Track Shipment";
    } else if (actionUrl.includes("/orders") || category === "order") {
      actionLabel = "View Order";
    } else if (actionUrl.includes("/inventory") || category === "stock") {
      actionLabel = "View Inventory";
    } else if (actionUrl.includes("/production") || category === "production") {
      actionLabel = "View Production";
    }
  }

  // 5. Clean Formatted Message
  let cleanMessage = rawMessage;
  if (titleLower.includes("password reset") || titleLower.includes("password")) {
    cleanMessage = "A password reset request was submitted for your account (valid for 1 hour).";
  } else if (titleLower.includes("verify your email") || titleLower.includes("verify email")) {
    cleanMessage = "Please verify your email address to confirm your account and enable full platform features.";
  } else {
    cleanMessage = cleanMessage
      .replace(/https?:\/\/[^\s)\],]+/gi, "")
      .replace(/(?:Reset Token|Verification Token|Token)[:=\s]+[a-fA-F0-9]{16,64}/gi, "")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    if (!cleanMessage) {
      cleanMessage = rawMessage;
    }
  }

  return {
    cleanTitle: title,
    cleanMessage,
    actionUrl,
    actionLabel,
    isExternalLink,
    token,
    category,
  };
}
