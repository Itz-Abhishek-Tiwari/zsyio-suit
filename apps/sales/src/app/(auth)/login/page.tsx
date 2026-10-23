import { LoginForm } from "./login-form";
import { TrendingUp, Target, DollarSign, Users, BarChart3, ShieldCheck } from "lucide-react";
import { auth } from "@zsyio/auth";
import { redirect } from "next/navigation";
import { LoginPageLayout, safeCallbackPath } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Sign In - Zsyio Pulse",
  description: "Sign in to access your Zsyio Pulse Sales Pipeline & Kanban Board.",
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
      appName="Zsyio Pulse"
      appTagline="CRM & Pipeline Management"
      appIcon={<TrendingUp className="w-5 h-5 text-white" />}
      badgeText="Lead to Client Lifecycle Management"
      headline="Close More Deals with Interactive Kanban Pipelines."
      description="Organize leads across stages from qualification to closing, log calls and activities, forecast deal values, and transition won clients into project delivery with automated client handoff."
      features={[
        {
          icon: <Target className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "Visual Kanban",
          description: "Drag-and-drop leads across 7 lifecycle pipeline stages.",
        },
        {
          icon: <DollarSign className="w-4 h-4" />,
          iconClassName: "bg-success/10 text-success",
          title: "Deal Forecasting",
          description: "Track win probabilities, expected close dates, and values.",
        },
        {
          icon: <Users className="w-4 h-4" />,
          iconClassName: "bg-notion-blue-fg/10 text-notion-blue-fg",
          title: "Client Conversion",
          description: "One-click transition from Sales Client to Development Client.",
        },
        {
          icon: <BarChart3 className="w-4 h-4" />,
          iconClassName: "bg-warning/10 text-warning",
          title: "Full Audit Trail",
          description: "Complete timeline of calls, emails, notes, and stage changes.",
        },
      ]}
      footerRight={<span className="font-mono text-xs text-muted-foreground">Zsyio v1.2 · Enterprise Edition</span>}
      formHeading="Welcome back"
      formSubtitle="Enter your corporate username with approved domain to access Sales CRM."
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
