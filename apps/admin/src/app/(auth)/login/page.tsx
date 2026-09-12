import { LoginForm } from "./login-form";
import { ShieldCheck, Lock, Users, KeyRound, ShieldAlert } from "lucide-react";
import { auth } from "@zsyio/auth";
import { redirect } from "next/navigation";
import { LoginPageLayout } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Admin Sign In - Zsyio Console",
  description: "Sign in to access Zsyio User Management, Roles & Access Control.",
};

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (session?.user) {
    redirect("/");
  }

  const allowedDomains = getAllowedEmailDomains();

  return (
    <LoginPageLayout
      appName="Zsyio Console"
      appTagline="Identity & Access Control"
      appIcon={<ShieldCheck className="w-5 h-5 text-white" />}
      statusLabel="IAM Gateway Active"
      badgeText="Dedicated User & Role Management Suite"
      headline="Centralized IAM & Permission Governance."
      description="Manage enterprise user directories, customize granular role matrices, configure cross-functional teams, and enforce strict domain whitelisting."
      features={[
        {
          icon: <Users className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "User Directory",
          description: "One-click invitations, real-time status toggling, and secure password reset workflows.",
        },
        {
          icon: <KeyRound className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "Granular Roles",
          description: "Resource-level permissions across dashboards, tasks, reports, clients, and timesheets.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4" />,
          iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          title: "Team Rosters",
          description: "Organize departments, assign team leads, and manage member capacities with team rosters.",
        },
        {
          icon: <ShieldAlert className="w-4 h-4" />,
          iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          title: "Domain Security",
          description: "Strict email domain restriction policy and audit logs for all security actions.",
        },
      ]}
      footerLeft={
        <div className="flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[11px]">Zero-Trust IAM · Salted bcrypt · Audit Logging</span>
        </div>
      }
      footerRight={<span className="font-mono text-[10px] text-muted-foreground">Zsyio v1.2</span>}
      formHeading="Admin Console Sign In"
      formSubtitle="Sign in with administrative clearance to manage users, teams, and security policies."
      securityNote={
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Protected by Zsyio Enterprise Security Clearance</span>
        </>
      }
    >
      <LoginForm serverAllowedDomains={allowedDomains} />
    </LoginPageLayout>
  );
}
