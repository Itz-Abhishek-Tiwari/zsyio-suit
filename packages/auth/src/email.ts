import { getActiveEmailProvider } from "./providers";

export async function sendEmail(to: string, subject: string, body: string) {
  return getActiveEmailProvider().send(to, subject, body);
}

export interface SendInvitationEmailParams {
  to: string;
  name: string;
  roleName: string;
  inviterName: string;
  inviteToken: string;
  appUrl?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Design Tokens for HTML Emails (imported directly from tokens/primitives.json) ──
const EMAIL_THEME = {
  // Surfaces & Backgrounds
  bodyBg: "#0F172A",
  wrapperBg: "#0F172A",
  containerBg: "#101828",
  cardBg: "#1E293B",
  headerGradientStart: "#1E293B",
  headerGradientEnd: "#0F172A",
  footerBg: "#0F172A",

  // Shadows
  containerShadow: "rgba(0, 0, 0, 0.4)",

  // Borders & Dividers
  border: "#1E293B",
  cardBorder: "#334155",
  rowBorder: "rgba(255, 255, 255, 0.05)",

  // Typography Colors
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textSubtle: "#64748B",
  textWhite: "#FFFFFF",

  // Brand / Primary Action (Zsyio Primary)
  primary: "#4F46E5",
  primaryHover: "#4338CA",
  primaryShadow: "rgba(79, 70, 229, 0.35)",

  // Role Badge
  roleBadgeBg: "rgba(79, 70, 229, 0.15)",
  roleBadgeBorder: "rgba(79, 70, 229, 0.35)",
  roleBadgeText: "#818CF8",

  // Status Badge (Success / Security Notification)
  statusBadgeBg: "rgba(16, 185, 129, 0.12)",
  statusBadgeBorder: "rgba(16, 185, 129, 0.3)",
  statusBadgeText: "#34D399",

  // Alert Box & Security Notices
  alertBg: "rgba(239, 68, 68, 0.08)",
  alertBorder: "rgba(239, 68, 68, 0.25)",
  alertTitle: "#F87171",

  // Accent & Link
  accent: "#818CF8",
  link: "#6366F1",

  // Status / Highlight
  validityText: "#FBBF24",
} as const;


// ── Robust Base URL Resolver for Dynamic Hosting Environments ──
export function resolveAppBaseUrl(providedUrl?: string): string {
  if (providedUrl && providedUrl.trim()) {
    return providedUrl.replace(/\/+$/, "");
  }
  const envUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";

  return envUrl.replace(/\/+$/, "");
}

function renderEmailShell({
  title,
  subtitle,
  contentHtml,
  footerExtra,
}: {
  title?: string;
  subtitle?: string;
  contentHtml: string;
  footerExtra?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "Zsyio")}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${EMAIL_THEME.bodyBg};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: ${EMAIL_THEME.textPrimary};
      line-height: 1.6;
    }
    .wrapper {
      background-color: ${EMAIL_THEME.wrapperBg};
      padding: 40px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: ${EMAIL_THEME.containerBg};
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid ${EMAIL_THEME.border};
      box-shadow: 0 20px 40px ${EMAIL_THEME.containerShadow};
    }
    .header {
      background: linear-gradient(135deg, ${EMAIL_THEME.headerGradientStart} 0%, ${EMAIL_THEME.headerGradientEnd} 100%);
      padding: 32px 28px;
      text-align: center;
      border-bottom: 1px solid ${EMAIL_THEME.cardBorder};
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: ${EMAIL_THEME.textWhite};
      letter-spacing: -0.3px;
      margin: 0;
    }
    .brand-subtitle {
      color: ${EMAIL_THEME.textMuted};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-top: 4px;
    }
    .content {
      padding: 36px 32px 28px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: ${EMAIL_THEME.textWhite};
      margin: 0 0 12px;
    }
    .intro {
      font-size: 14px;
      color: ${EMAIL_THEME.textMuted};
      margin: 0 0 24px;
      line-height: 1.6;
    }
    .info-card, .otp-card, .details-card {
      background: ${EMAIL_THEME.cardBg};
      border: 1px solid ${EMAIL_THEME.cardBorder};
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .role-badge {
      display: inline-block;
      padding: 3px 10px;
      background: ${EMAIL_THEME.roleBadgeBg};
      border: 1px solid ${EMAIL_THEME.roleBadgeBorder};
      color: ${EMAIL_THEME.roleBadgeText};
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      background: ${EMAIL_THEME.statusBadgeBg};
      border: 1px solid ${EMAIL_THEME.statusBadgeBorder};
      color: ${EMAIL_THEME.statusBadgeText};
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .actions, .btn-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .btn-accept, .btn {
      display: inline-block;
      background: ${EMAIL_THEME.primary};
      color: ${EMAIL_THEME.textWhite} !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 13px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 14px ${EMAIL_THEME.primaryShadow};
      margin-bottom: 12px;
    }
    .btn-decline {
      display: inline-block;
      color: ${EMAIL_THEME.textMuted} !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
    }
    .fallback {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid ${EMAIL_THEME.border};
      font-size: 11px;
      color: ${EMAIL_THEME.textSubtle};
      word-break: break-all;
    }
    .fallback-link {
      color: ${EMAIL_THEME.link};
      text-decoration: none;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      color: ${EMAIL_THEME.textMuted};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: ${EMAIL_THEME.primary};
      margin: 0;
      padding: 10px 0;
    }
    .otp-expiry {
      margin-top: 10px;
      font-size: 12px;
      color: ${EMAIL_THEME.validityText};
      font-weight: 600;
    }
    .security-notice, .alert-box {
      background: ${EMAIL_THEME.alertBg};
      border: 1px solid ${EMAIL_THEME.alertBorder};
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 12px;
      color: ${EMAIL_THEME.textSecondary};
      margin-top: 20px;
      line-height: 1.5;
    }
    .alert-title {
      font-weight: 700;
      color: ${EMAIL_THEME.alertTitle};
      margin-bottom: 6px;
    }
    .footer {
      background: ${EMAIL_THEME.footerBg};
      border-top: 1px solid ${EMAIL_THEME.border};
      padding: 20px 32px;
      text-align: center;
      font-size: 11px;
      color: ${EMAIL_THEME.textSubtle};
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">ZSYIO ONE</h1>
        <div class="brand-subtitle">${escapeHtml(subtitle || "Operations & Project Workspace")}</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        ${footerExtra || `This is an automated transmission from Zsyio.<br />&copy; ${new Date().getFullYear()} Zsyio Operations. All rights reserved.`}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendUserInvitationEmail({
  to,
  name,
  roleName,
  inviterName,
  inviteToken,
  appUrl,
}: SendInvitationEmailParams): Promise<void> {
  const baseUrl = resolveAppBaseUrl(appUrl);
  const acceptUrl = `${baseUrl}/invite/${inviteToken}?action=accept`;
  const rejectUrl = `${baseUrl}/invite/${inviteToken}?action=reject`;

  const subject = `Invitation: Join Zsyio Workspace (${roleName})`;

  const contentHtml = `
    <h2 class="greeting">Hello ${escapeHtml(name)},</h2>
    <p class="intro">
      <strong style="color: ${EMAIL_THEME.textPrimary};">${escapeHtml(inviterName)}</strong> has invited you to collaborate as a team member on the Zsyio Workspace.
    </p>

    <div class="info-card">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: ${EMAIL_THEME.textMuted}; font-size: 12px; padding: 6px 0;">Assigned Role:</td>
          <td style="text-align: right; padding: 6px 0;">
            <span class="role-badge">${escapeHtml(roleName)}</span>
          </td>
        </tr>
        <tr>
          <td style="color: ${EMAIL_THEME.textMuted}; font-size: 12px; padding: 6px 0;">Invited Email:</td>
          <td style="text-align: right; color: ${EMAIL_THEME.textPrimary}; font-family: monospace; font-size: 12px; padding: 6px 0;">
            ${escapeHtml(to)}
          </td>
        </tr>
        <tr>
          <td style="color: ${EMAIL_THEME.textMuted}; font-size: 12px; padding: 6px 0;">Link Validity:</td>
          <td style="text-align: right; color: ${EMAIL_THEME.validityText}; font-size: 12px; font-weight: 600; padding: 6px 0;">
            7 days
          </td>
        </tr>
      </table>
    </div>

    <p style="color: ${EMAIL_THEME.textSecondary}; font-size: 13px; margin: 0 0 16px;">
      Click below to accept the invitation and set up your personal workspace password:
    </p>

    <div class="actions">
      <a href="${acceptUrl}" class="btn-accept" target="_blank" rel="noopener noreferrer">
        Accept & Join Workspace &rarr;
      </a>
      <br />
      <a href="${rejectUrl}" class="btn-decline" target="_blank" rel="noopener noreferrer">
        Decline Invitation
      </a>
    </div>

    <div class="fallback">
      If the button above does not open, visit this URL directly:<br />
      <a href="${acceptUrl}" class="fallback-link">${acceptUrl}</a>
    </div>
  `;

  const htmlBody = renderEmailShell({
    title: "Invitation to Zsyio Workspace",
    subtitle: "Operations & Project Workspace",
    contentHtml,
    footerExtra: `This is an automated invitation from Zsyio.<br />If you did not request or expect this email, you can safely disregard or decline it.`,
  });

  await sendEmail(to, subject, htmlBody);
}

export interface SendPasswordResetOtpParams {
  to: string;
  name: string;
  otp: string;
  expiresInMinutes?: number;
}

export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
  expiresInMinutes = 10,
}: SendPasswordResetOtpParams): Promise<void> {
  const subject = `Your Zsyio Password Reset Verification Code: ${otp}`;

  const contentHtml = `
    <h2 class="greeting">Hello ${escapeHtml(name)},</h2>
    <p class="intro">
      We received a request to reset the password for your Zsyio account (<strong style="color: ${EMAIL_THEME.textPrimary};">${escapeHtml(to)}</strong>).
    </p>

    <div class="otp-card">
      <div class="otp-label">Your One-Time Verification Code</div>
      <div class="otp-code">${escapeHtml(otp)}</div>
      <div class="otp-expiry">⏱ This code will expire in ${expiresInMinutes} minutes</div>
    </div>

    <p style="color: ${EMAIL_THEME.textSecondary}; font-size: 13px; margin: 0 0 12px;">
      Enter this 6-digit code on the password reset page to set a new password. Never share this code with anyone.
    </p>

    <div class="security-notice">
      <strong>Security Notice:</strong> If you did not request this verification code, please ignore this email or notify your system administrator immediately. Your password remains unchanged.
    </div>
  `;

  const htmlBody = renderEmailShell({
    title: "Password Reset Code",
    subtitle: "Security & Account Clearance",
    contentHtml,
  });

  await sendEmail(to, subject, htmlBody);
}

export interface SendPasswordChangedAlertParams {
  to: string;
  name: string;
  changedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  appUrl?: string;
}

export async function sendPasswordChangedAlertEmail({
  to,
  name,
  changedAt = new Date(),
  ipAddress,
  userAgent,
  appUrl,
}: SendPasswordChangedAlertParams): Promise<void> {
  const baseUrl = resolveAppBaseUrl(appUrl);
  const resetUrl = `${baseUrl}/forgot-password`;
  const subject = "Security Alert: Your Zsyio Password Was Changed";

  const formattedDate = changedAt.toUTCString();
  const device = formatDeviceString(userAgent);

  const contentHtml = `
    <div class="status-badge">Security Notification</div>
    <h2 class="greeting">Hello ${escapeHtml(name)},</h2>
    <p class="intro">
      The password for your Zsyio account (<strong style="color: ${EMAIL_THEME.textPrimary};">${escapeHtml(to)}</strong>) was recently changed.
    </p>

    <div class="details-card">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid ${EMAIL_THEME.rowBorder};">
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textMuted};">Account</td>
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textPrimary}; font-weight: 600; text-align: right;">${escapeHtml(to)}</td>
        </tr>
        <tr style="border-bottom: 1px solid ${EMAIL_THEME.rowBorder};">
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textMuted};">Date &amp; Time</td>
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textPrimary}; font-weight: 600; text-align: right;">${escapeHtml(formattedDate)}</td>
        </tr>
        <tr style="border-bottom: 1px solid ${EMAIL_THEME.rowBorder};">
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textMuted};">Device</td>
          <td style="padding: 8px 0; color: ${EMAIL_THEME.textPrimary}; font-weight: 600; text-align: right;">${escapeHtml(device)}</td>
        </tr>
        ${
          ipAddress
            ? `<tr>
                <td style="padding: 8px 0; color: ${EMAIL_THEME.textMuted};">IP Address</td>
                <td style="padding: 8px 0; color: ${EMAIL_THEME.textPrimary}; font-weight: 600; font-family: monospace; text-align: right;">${escapeHtml(ipAddress)}</td>
              </tr>`
            : ""
        }
      </table>
    </div>

    <div class="alert-box">
      <div class="alert-title">⚠️ Didn't request this change?</div>
      If you did not initiate this password change, your account may be compromised. Please reset your password immediately or reach out to your workspace administrator.
    </div>

    <div class="btn-container">
      <a href="${resetUrl}" class="btn">Secure Account / Reset Password</a>
    </div>
  `;

  const htmlBody = renderEmailShell({
    title: "Security Alert: Password Changed",
    subtitle: "Security & Account Protection",
    contentHtml,
  });

  await sendEmail(to, subject, htmlBody);
}

function formatDeviceString(userAgent?: string): string {
  if (!userAgent) return "Web Browser";
  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS")) return "Mac Desktop / Safari / Chrome";
  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("iPhone")) return "Apple iPhone";
  if (userAgent.includes("iPad")) return "Apple iPad";
  if (userAgent.includes("Android")) return "Android Device";
  if (userAgent.includes("Linux")) return "Linux Desktop / Device";
  return "Web Browser";
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

