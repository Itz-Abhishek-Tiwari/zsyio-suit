import { auth, getAllowedEmailDomains } from "@zsyio/auth";
import { redirect } from "next/navigation";
import { LoginPageLayout } from "@zsyio/ui";
import { BriefcaseBusiness, Users, CalendarDays, MessageSquare } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function Page() {
  const session = await auth();
  if (session?.user) redirect("/");
  return <LoginPageLayout
    appName="Zsyio Recruit"
    appTagline="Hiring workspace"
    appIcon={<BriefcaseBusiness className="w-6 h-6 text-primary-foreground" />}
    badgeText="Connected hiring"
    headline="Build your next team."
    description="Keep your open roles, candidate pipeline, and interview feedback in one shared workspace."
    features={[
      { icon: <BriefcaseBusiness className="w-4 h-4" />, title: "Open roles", description: "Publish roles to the careers page." },
      { icon: <Users className="w-4 h-4" />, title: "Candidate pipeline", description: "Follow applications through each stage." },
      { icon: <CalendarDays className="w-4 h-4" />, title: "Interviews", description: "Keep interview schedules in view." },
      { icon: <MessageSquare className="w-4 h-4" />, title: "Shared feedback", description: "Keep notes with each application." },
    ]}
    footerLeft="One account across the Zsyio suite"
    footerRight="Recruit"
    formHeading="Sign in to Recruit"
    formSubtitle="Use your workspace account to continue."
    securityNote="Access is controlled by your workspace permissions."
  ><LoginForm serverAllowedDomains={getAllowedEmailDomains()} /></LoginPageLayout>;
}
