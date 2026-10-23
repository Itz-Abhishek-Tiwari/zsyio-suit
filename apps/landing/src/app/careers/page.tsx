import type { Metadata } from "next";
import { prisma } from "@zsyio/database";
import { CareersView } from "./careers-view";

// Public page: serve a cached render and refresh the job list at most every 5 minutes.
export const revalidate = 300;
export const metadata: Metadata = {
  title: "Careers at Zsyio",
  description: "Explore open roles at Zsyio and apply to help build a more connected workspace.",
};

export default async function CareersPage() {
  let jobs: Awaited<ReturnType<typeof loadJobs>> = [];
  let unavailable = false;
  try { jobs = await loadJobs(); } catch { unavailable = true; }
  return <CareersView jobs={jobs} unavailable={unavailable} />;
}

function loadJobs() {
  return prisma.recruitJob.findMany({
    where: { status: "OPEN" },
    select: { id: true, title: true, department: true, location: true, employment: true, description: true },
    orderBy: { createdAt: "desc" },
  });
}
