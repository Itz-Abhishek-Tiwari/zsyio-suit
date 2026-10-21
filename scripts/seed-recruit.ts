import { prisma } from "@zsyio/database";

type SeedEvent = {
  kind: "INTERVIEW" | "FEEDBACK" | "STAGE";
  title: string;
  body?: string;
  /** Days from now; negative is in the past. */
  daysFromNow?: number;
  hour?: number;
};

type SeedCandidate = {
  name: string;
  email: string;
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
  source: string;
  phone?: string;
  currentCompany?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  rejectionReason?: string;
  events?: SeedEvent[];
};

const jobs: {
  title: string;
  department: string;
  location: string;
  employment: string;
  status: string;
  description: string;
  candidates: SeedCandidate[];
}[] = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Indore, India",
    employment: "FULL_TIME",
    status: "OPEN",
    description:
      "Own the web experience across the Zsyio suite. You will build accessible, fast interfaces in React and Next.js and help shape our shared component library.",
    candidates: [
      {
        name: "Riya Sen", email: "riya.sen@example.com", stage: "INTERVIEW", source: "LinkedIn",
        phone: "+91 98765 43210", currentCompany: "Freshworks", expectedSalary: "₹28 LPA", noticePeriod: "60 days",
        linkedinUrl: "https://www.linkedin.com/in/riya-sen-demo", resumeUrl: "https://example.com/resumes/riya-sen.pdf",
        events: [
          { kind: "STAGE", title: "APPLIED → SCREENING" },
          { kind: "FEEDBACK", title: "Recruiter screen", body: "Strong React fundamentals and clear communicator. Moving to technical round." },
          { kind: "STAGE", title: "SCREENING → INTERVIEW" },
          { kind: "INTERVIEW", title: "Technical round", body: "Live coding: build a filterable table. Review the component API design.", daysFromNow: 2, hour: 11 },
        ],
      },
      {
        name: "Arjun Mehta", email: "arjun.mehta@example.com", stage: "SCREENING", source: "Referral",
        phone: "+91 91234 56789", currentCompany: "Zoho", expectedSalary: "₹24 LPA", noticePeriod: "30 days",
        linkedinUrl: "https://www.linkedin.com/in/arjun-mehta-demo",
        events: [{ kind: "STAGE", title: "APPLIED → SCREENING" }],
      },
      {
        name: "Neha Kapoor", email: "neha.kapoor@example.com", stage: "OFFER", source: "Careers website",
        phone: "+91 99887 76655", currentCompany: "Razorpay", expectedSalary: "₹32 LPA", noticePeriod: "45 days",
        resumeUrl: "https://example.com/resumes/neha-kapoor.pdf",
        events: [
          { kind: "INTERVIEW", title: "Technical round", body: "Excellent system design discussion.", daysFromNow: -9, hour: 15 },
          { kind: "FEEDBACK", title: "Technical round feedback", body: "Strong hire. Great accessibility knowledge and mentoring mindset." },
          { kind: "INTERVIEW", title: "Culture and team fit", daysFromNow: -4, hour: 12 },
          { kind: "STAGE", title: "INTERVIEW → OFFER" },
        ],
      },
      { name: "Karan Verma", email: "karan.verma@example.com", stage: "APPLIED", source: "Careers website" },
      {
        name: "Sana Sheikh", email: "sana.sheikh@example.com", stage: "REJECTED", source: "LinkedIn",
        currentCompany: "TCS", expectedSalary: "₹40 LPA", noticePeriod: "90 days", rejectionReason: "Salary expectations",
        events: [{ kind: "STAGE", title: "SCREENING → REJECTED", body: "Salary expectations — Well above the budgeted range for this role." }],
      },
    ],
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    employment: "FULL_TIME",
    status: "OPEN",
    description:
      "Design clear, calm interfaces for hiring, HR and project tools. You will work closely with engineers and extend our design system.",
    candidates: [
      {
        name: "Ishita Rao", email: "ishita.rao@example.com", stage: "HIRED", source: "Referral",
        phone: "+91 90000 11122", currentCompany: "Swiggy", expectedSalary: "₹26 LPA", noticePeriod: "30 days",
        linkedinUrl: "https://www.linkedin.com/in/ishita-rao-demo", resumeUrl: "https://example.com/resumes/ishita-rao.pdf",
        events: [
          { kind: "FEEDBACK", title: "Portfolio review", body: "Thoughtful case studies with measurable outcomes." },
          { kind: "INTERVIEW", title: "Design challenge review", daysFromNow: -14, hour: 14 },
          { kind: "STAGE", title: "OFFER → HIRED" },
        ],
      },
      {
        name: "Dev Malhotra", email: "dev.malhotra@example.com", stage: "INTERVIEW", source: "Direct",
        phone: "+91 98100 22334", currentCompany: "Freelance", expectedSalary: "₹20 LPA", noticePeriod: "Immediate",
        events: [{ kind: "INTERVIEW", title: "Portfolio walkthrough", daysFromNow: 1, hour: 16 }],
      },
      { name: "Pooja Nair", email: "pooja.nair@example.com", stage: "APPLIED", source: "LinkedIn", linkedinUrl: "https://www.linkedin.com/in/pooja-nair-demo" },
      {
        name: "Vikram Joshi", email: "vikram.joshi@example.com", stage: "REJECTED", source: "Careers website",
        rejectionReason: "Skills mismatch",
        events: [{ kind: "STAGE", title: "SCREENING → REJECTED", body: "Skills mismatch — Portfolio is mostly graphic design with little product work." }],
      },
    ],
  },
  {
    title: "HR Operations Executive",
    department: "People",
    location: "Indore, India",
    employment: "FULL_TIME",
    status: "OPEN",
    description:
      "Run onboarding, attendance and leave operations. You will keep people data accurate and make everyday HR tasks painless for the team.",
    candidates: [
      {
        name: "Meera Iyer", email: "meera.iyer@example.com", stage: "SCREENING", source: "Job board",
        phone: "+91 97000 33445", currentCompany: "Infosys", expectedSalary: "₹9 LPA", noticePeriod: "60 days",
      },
      { name: "Rohit Das", email: "rohit.das@example.com", stage: "APPLIED", source: "Job board", noticePeriod: "30 days" },
      {
        name: "Ananya Bose", email: "ananya.bose@example.com", stage: "REJECTED", source: "Referral",
        rejectionReason: "Candidate withdrew",
        events: [{ kind: "STAGE", title: "INTERVIEW → REJECTED", body: "Candidate withdrew — Accepted another offer." }],
      },
    ],
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    location: "Mumbai, India",
    employment: "CONTRACT",
    status: "PAUSED",
    description: "Open conversations with prospective clients and book qualified demos for the sales team. Hiring is paused until next quarter.",
    candidates: [
      { name: "Aditya Kulkarni", email: "aditya.kulkarni@example.com", stage: "SCREENING", source: "LinkedIn", currentCompany: "Byju's", expectedSalary: "₹7 LPA" },
    ],
  },
  {
    title: "QA Engineer Intern",
    department: "Engineering",
    location: "Remote",
    employment: "PART_TIME",
    status: "CLOSED",
    description: "Help us test releases across the suite. This internship has been filled.",
    candidates: [
      {
        name: "Tanvi Gupta", email: "tanvi.gupta@example.com", stage: "HIRED", source: "Campus",
        phone: "+91 96000 44556", noticePeriod: "Immediate",
        events: [{ kind: "STAGE", title: "OFFER → HIRED" }],
      },
    ],
  },
];

function at(daysFromNow: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export async function seedRecruit() {
  console.log("🌱 Seeding Recruit jobs, candidates, and hiring activity...");

  const author =
    (await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No users found. Run the main seed first so Recruit has an author.");

  let createdJobs = 0;
  let createdCandidates = 0;

  for (const { candidates, ...job } of jobs) {
    let record = await prisma.recruitJob.findFirst({ where: { title: job.title } });
    if (!record) {
      record = await prisma.recruitJob.create({ data: { ...job, createdBy: author.id } });
      createdJobs++;
    }

    for (const { events = [], ...candidate } of candidates) {
      const existing = await prisma.recruitApplication.findUnique({
        where: { jobId_email: { jobId: record.id, email: candidate.email } },
      });
      if (existing) continue;
      await prisma.recruitApplication.create({
        data: {
          ...candidate,
          jobId: record.id,
          createdBy: author.id,
          events: {
            create: events.map((event) => ({
              kind: event.kind,
              title: event.title,
              body: event.body ?? "",
              scheduledAt:
                event.kind === "INTERVIEW" && event.daysFromNow !== undefined
                  ? at(event.daysFromNow, event.hour)
                  : undefined,
              authorId: author.id,
              authorName: author.name,
            })),
          },
        },
      });
      createdCandidates++;
    }
  }

  console.log(`✅ Recruit seeded (${createdJobs} new jobs, ${createdCandidates} new candidates; existing data left untouched).`);
}

// Allow direct CLI invocation via `pnpm tsx scripts/seed-recruit.ts`
if (process.argv[1]?.includes("seed-recruit")) {
  seedRecruit()
    .catch((e) => {
      console.error("❌ Recruit seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
