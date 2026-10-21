import { LoginForm } from "./login-form";
import { Users, BarChart3, ShieldCheck, Layers, Lock } from "lucide-react";
import { auth } from "@zsyio/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LoginPageLayout } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Sign In - Zsyio Flow",
  description: "Sign in to access your Zsyio Project Management Workspace.",
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
      appName="Zsyio Flow"
      appTagline="Enterprise Operations Portal"
      appIcon={
        <Image
          src="/branding/zsyio-default/zsyio-mark-white.svg"
          alt="Zsyio"
          width={26}
          height={26}
          priority
          className="object-contain"
        />
      }
      statusLabel="99.99% Systems Online"
      badgeText="Multi-Tenant Engineering & Operations Platform"
      headline="Engineering Control & SLA Management for Zsyio."
      description="Manage client products, track sprint deliverables, automate role-based ticket workflows, and enforce security clearance."
      features={[
        {
          icon: <Users className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "Role Rosters",
          description: "Granular clearance permissions for Admins, Managers, Developers & Support.",
        },
        {
          icon: <Layers className="w-4 h-4" />,
          iconClassName: "bg-notion-blue-fg/10 text-notion-blue-fg",
          title: "Client Workspaces",
          description: "Isolate enterprise client environments, SLA contracts & deployment gateways.",
        },
        {
          icon: <BarChart3 className="w-4 h-4" />,
          iconClassName: "bg-notion-purple-fg/10 text-notion-purple-fg",
          title: "Real-Time Metrics",
          description: "Sprint velocity, overdue alert digest & workload distribution analytics.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4" />,
          iconClassName: "bg-success/10 text-success",
          title: "Zero-Trust IAM",
          description: "Strict domain whitelisting, bcrypt salted hashing & tamper-proof activity logs.",
        },
      ]}
      footerLeft={
        <div className="flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-xs">256-bit TLS · EU Data Privacy Compliant</span>
        </div>
      }
      footerRight={<span className="font-mono text-xs text-muted-foreground">Zsyio v1.2</span>}
      formHeading="Sign in to Workspace"
      formSubtitle="Enter your corporate username with approved domain to access your workspace."
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
