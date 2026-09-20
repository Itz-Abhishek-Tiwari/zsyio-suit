import { LoginForm } from "./login-form";
import { FileText, Share2, BookOpen, ShieldCheck, Lock } from "lucide-react";
import { auth } from "@zsyio/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LoginPageLayout } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Sign In - Zsyio Canvas",
  description: "Sign in to access your Zsyio Knowledge & Documentation Workspace.",
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
      appName="Zsyio Canvas"
      appTagline="Knowledge & Docs Portal"
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
      badgeText="Knowledge Base & Documentation Platform"
      headline="Team Documentation & Knowledge Management."
      description="Create, organize, and collaborate on project documentation, technical specs, and team notes across Zsyio."
      features={[
        {
          icon: <FileText className="w-4 h-4" />,
          iconClassName: "bg-primary-light text-primary",
          title: "Rich Documentation",
          description: "Structured markdown notes, code blocks, and sprint runbooks in one place.",
        },
        {
          icon: <Share2 className="w-4 h-4" />,
          iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          title: "Team Collaboration",
          description: "Share documentation and engineering decisions directly across teams.",
        },
        {
          icon: <BookOpen className="w-4 h-4" />,
          iconClassName: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          title: "Knowledge Vault",
          description: "Searchable wiki and guidelines with instantaneous query resolution.",
        },
        {
          icon: <ShieldCheck className="w-4 h-4" />,
          iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          title: "Zero-Trust IAM",
          description: "Restricted internal documentation with verified domain authorization.",
        },
      ]}
      footerLeft={
        <div className="flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[11px]">256-bit TLS · EU Data Privacy Compliant</span>
        </div>
      }
      footerRight={<span className="font-mono text-[10px] text-muted-foreground">Zsyio v1.2</span>}
      formHeading="Sign in to Notes"
      formSubtitle="Enter your corporate username with approved domain to access documentation."
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
