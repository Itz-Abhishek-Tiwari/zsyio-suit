import type { Metadata } from "next";
import { auth } from "@zsyio/auth";
import { prisma } from "@zsyio/database";
import { CareersView } from "./careers-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Careers at Zsyio",
  description: "Explore open roles at Zsyio and apply to help build a more connected workspace.",
};

export default async function CareersPage() {
  const session = await auth();
  let jobs: Awaited<ReturnType<typeof loadJobs>> = [];
  let unavailable = false;
  try { jobs = await loadJobs(); } catch { unavailable = true; }
  return <CareersView jobs={jobs} unavailable={unavailable} signedIn={Boolean(session?.user)} />;
}

function loadJobs() {
  return prisma.recruitJob.findMany({
    where: { status: "OPEN" },
    select: { id: true, title: true, department: true, location: true, employment: true, description: true },
    orderBy: { createdAt: "desc" },
  });
}
