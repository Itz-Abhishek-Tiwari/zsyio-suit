import type { Metadata } from "next";
import { auth } from "@zsyio/auth";
import { LandingView } from "./landing-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zsyio — Work, connected.",
  description:
    "Projects, knowledge, people, and relationships. Discover five focused apps in one connected workspace with Zsyio.",
};

function sanitizeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.trim().replace(/\/+$/, "");
}

export default async function LandingPage() {
  const session = await auth();

  const appUrls = {
    pms: sanitizeUrl(process.env.NEXT_PUBLIC_PMS_URL, "http://localhost:3000"),
    notes: sanitizeUrl(process.env.NEXT_PUBLIC_NOTES_URL, "http://localhost:3001"),
    hrms: sanitizeUrl(process.env.NEXT_PUBLIC_HRMS_URL, "http://localhost:3002"),
    admin: sanitizeUrl(process.env.NEXT_PUBLIC_ADMIN_URL, "http://localhost:3003"),
    sales: sanitizeUrl(process.env.NEXT_PUBLIC_SALES_URL, "http://localhost:3004"),
  };

  return (
    <LandingView
      user={
        session?.user
          ? {
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }
          : null
      }
      appUrls={appUrls}
    />
  );
}
