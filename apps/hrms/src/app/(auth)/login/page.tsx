import { LoginForm } from "./login-form";
import { Users2, Clock, ShieldCheck, FileSpreadsheet, Sparkles } from "lucide-react";
import { auth } from "@zsyio/auth";
import { redirect } from "next/navigation";
import { LoginPageLayout, safeCallbackPath } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Sign In - Zsyio People",
  description: "Sign in to access your Zsyio People Timesheet & Attendance Workspace.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (session?.user) {
    const { callbackUrl } = await searchParams;
    redirect(safeCallbackPath(typeof callbackUrl === "string" ? callbackUrl : undefined));
  }

  const allowedDomains = getAllowedEmailDomains();

  return (
    <LoginPageLayout
      appName="Zsyio People"
      appTagline="Timesheet & Attendance Hub"
      appIcon={<Users2 className="w-5 h-5 text-white" />}
      badgeIcon={<Clock className="w-3.5 h-3.5" />}
      badgeText="Daily Attendance & Time Tracking"
      headline="Accurate Working Hours, Monitored Breaks & Timesheets."
      description="Record employee clock in/out sessions, manage temporary breaks, handle missed time entries with audit trails, and review organisation-wide timesheets."
      features={[
        {
          icon: <Clock className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "Live Clocking",
          description: "Real-time stopwatch and status tracking (Working, On Break, Clocked Out).",
        },
        {
          icon: <ShieldCheck className="w-4 h-4" />,
          iconClassName: "bg-success/10 text-success",
          title: "Admin Audit Log",
          description: "Super Admin corrections with immutable audit logging and export to CSV/Excel.",
        },
        {
          icon: <FileSpreadsheet className="w-4 h-4" />,
          iconClassName: "bg-notion-purple-fg/10 text-notion-purple-fg",
          title: "Timesheets",
          description: "Weekly and monthly timesheet views with approval workflows.",
        },
        {
          icon: <Users2 className="w-4 h-4" />,
          iconClassName: "bg-notion-blue-fg/10 text-notion-blue-fg",
          title: "Team Overview",
          description: "Organisation-wide attendance board with live status indicators.",
        },
      ]}
      footerLeft={
        <span className="font-mono text-xs">
          © {new Date().getFullYear()} Zsyio Operations
        </span>
      }
      footerRight={
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          Zsyio
        </span>
      }
      formHeading="Welcome back"
      formSubtitle="Enter your corporate username with approved domain to access HRMS."
      securityNote={
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Protected by Zsyio Role-Based Access Control</span>
        </>
      }
    >
      <LoginForm serverAllowedDomains={allowedDomains} />
    </LoginPageLayout>
  );
}
