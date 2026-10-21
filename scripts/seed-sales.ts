import bcrypt from "bcryptjs";
import {
  prisma,
  ClientType,
  SalesStage,
  SalesPriority,
  SalesActivityType,
  SalesAuditAction,
} from "@zsyio/database";

export async function seedSales() {
  console.log("🌱 Seeding Sales CRM pipeline, leads, activities, and tags...");

  // 1. Ensure default Sales Pipeline and its 7 Stages
  let pipeline = await prisma.salesPipeline.findFirst({
    where: { isDefault: true },
    include: { stages: true },
  });

  if (!pipeline || pipeline.stages.length === 0) {
    if (pipeline) {
      await prisma.pipelineStage.deleteMany({ where: { pipelineId: pipeline.id } });
      await prisma.salesPipeline.delete({ where: { id: pipeline.id } });
    }

    pipeline = await prisma.salesPipeline.create({
      data: {
        name: "Enterprise Healthcare Pipeline",
        description: "Core sales funnel for clinics, hospitals, and medtech partnerships",
        isDefault: true,
        stages: {
          create: [
            { name: "New Lead",      stageKey: SalesStage.NEW_LEAD,      order: 0, color: "#6366f1" },
            { name: "Contacted",     stageKey: SalesStage.CONTACTED,     order: 1, color: "#3b82f6" },
            { name: "Qualified",     stageKey: SalesStage.QUALIFIED,     order: 2, color: "#8b5cf6" },
            { name: "Proposal Sent", stageKey: SalesStage.PROPOSAL_SENT, order: 3, color: "#f59e0b" },
            { name: "Negotiation",   stageKey: SalesStage.NEGOTIATION,   order: 4, color: "#f97316" },
            { name: "Won",           stageKey: SalesStage.WON,           order: 5, color: "#10b981" },
            { name: "Lost",          stageKey: SalesStage.LOST,          order: 6, color: "#ef4444" },
          ],
        },
      },
      include: { stages: true },
    });
  }

  const stageMap = new Map<SalesStage, string>();
  for (const s of pipeline.stages) {
    stageMap.set(s.stageKey, s.id);
  }

  // 2. Ensure Sales Custom Roles and Sales-Only Users exist
  console.log("🛡️  Upserting Sales Representative & Sales Manager custom roles...");
  const salesRepRole = await prisma.customRole.upsert({
    where: { name: "SALES_REP" },
    update: {
      label: "Sales Representative",
      description: "Sales representative with access strictly to the Sales CRM module",
      isSystem: false,
      permissions: [
        "app:access:sales",
        "sales:view",
        "sales:create",
        "sales:edit",
        "sales:dashboard:view",
      ],
      color: "blue",
      icon: "trending-up",
    },
    create: {
      name: "SALES_REP",
      label: "Sales Representative",
      description: "Sales representative with access strictly to the Sales CRM module",
      isSystem: false,
      permissions: [
        "app:access:sales",
        "sales:view",
        "sales:create",
        "sales:edit",
        "sales:dashboard:view",
      ],
      color: "blue",
      icon: "trending-up",
    },
  });

  const salesManagerRole = await prisma.customRole.upsert({
    where: { name: "SALES_MANAGER" },
    update: {
      label: "Sales Manager",
      description: "Sales manager overseeing CRM pipeline, leads, team assignments, and deals",
      isSystem: false,
      permissions: [
        "app:access:sales",
        "sales:view",
        "sales:create",
        "sales:edit",
        "sales:delete",
        "sales:assign",
        "sales:pipeline:manage",
        "sales:dashboard:view",
        "sales:convert",
      ],
      color: "violet",
      icon: "briefcase",
    },
    create: {
      name: "SALES_MANAGER",
      label: "Sales Manager",
      description: "Sales manager overseeing CRM pipeline, leads, team assignments, and deals",
      isSystem: false,
      permissions: [
        "app:access:sales",
        "sales:view",
        "sales:create",
        "sales:edit",
        "sales:delete",
        "sales:assign",
        "sales:pipeline:manage",
        "sales:dashboard:view",
        "sales:convert",
      ],
      color: "violet",
      icon: "briefcase",
    },
  });

  console.log("👤 Upserting sales-specific team members (Lucas Vance & Elena Rostova)...");
  const defaultPasswordHash = await bcrypt.hash("password", 10);

  const salesRepUser = await prisma.user.upsert({
    where: { email: "lucas.vance@zsyio.de" },
    update: {
      name: "Lucas Vance",
      role: "DEVELOPER",
      customRoleId: salesRepRole.id,
      passwordHash: defaultPasswordHash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
    },
    create: {
      name: "Lucas Vance",
      email: "lucas.vance@zsyio.de",
      role: "DEVELOPER",
      customRoleId: salesRepRole.id,
      passwordHash: defaultPasswordHash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
    },
  });

  const salesManagerUser = await prisma.user.upsert({
    where: { email: "elena.rostova@zsyio.de" },
    update: {
      name: "Elena Rostova",
      role: "MANAGER",
      customRoleId: salesManagerRole.id,
      passwordHash: defaultPasswordHash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
    },
    create: {
      name: "Elena Rostova",
      email: "elena.rostova@zsyio.de",
      role: "MANAGER",
      customRoleId: salesManagerRole.id,
      passwordHash: defaultPasswordHash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
    },
  });

  const defaultUser = salesRepUser;
  const secondaryUser = salesManagerUser;

  // 3. Create or find Tags
  const tagNames = ["Enterprise", "Hospital", "SaaS", "Urgent", "Diagnostics", "Telehealth", "MedTech", "AI/ML", "Referral"];
  const tagMap = new Map<string, string>();
  for (const name of tagNames) {
    const tag = await prisma.salesTag.upsert({
      where: { name },
      update: {},
      create: {
        name,
        color: name === "Urgent" ? "#ef4444" : name === "Enterprise" ? "#8b5cf6" : "#3b82f6",
      },
    });
    tagMap.set(name, tag.id);
  }

  // 4. Clean up any existing sales leads
  const existingSalesClients = await prisma.client.findMany({
    where: { clientType: ClientType.SALES },
    select: { id: true },
  });

  if (existingSalesClients.length > 0) {
    const clientIds = existingSalesClients.map((c) => c.id);
    await prisma.salesLead.deleteMany({ where: { clientId: { in: clientIds } } });
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  }

  // 5. Seed rich sales leads
  const leadsData = [
    {
      companyName: "BioPharma Solutions GmbH",
      domain: "biopharma-solutions.de",
      contactName: "Dr. Marlene Weber",
      contactEmail: "marlene.weber@biopharma-solutions.de",
      contactPhone: "+49 89 1234567",
      notes: "Seeking modular patient management software for 4 regional clinical trial centers.",
      stage: SalesStage.NEW_LEAD,
      priority: SalesPriority.HIGH,
      dealValue: 48000,
      probability: 20,
      leadSource: "Website Inbound",
      daysAgoCreated: 2,
      tags: ["Enterprise", "MedTech"],
      activities: [
        {
          type: SalesActivityType.EMAIL,
          title: "Initial inquiry response sent",
          description: "Sent overview brochure, security compliance sheet, and calendar booking link.",
          daysAgo: 1,
          status: "DONE",
        },
        {
          type: SalesActivityType.FOLLOWUP,
          title: "Introductory discovery call",
          description: "Explore clinical workflow needs and trial management requirements.",
          daysAhead: 2,
          status: "PENDING",
        },
      ],
    },
    {
      companyName: "Klinikum Nordwest Health System",
      domain: "klinikum-nordwest.org",
      contactName: "Prof. Dr. Hans Richter",
      contactEmail: "h.richter@klinikum-nordwest.org",
      contactPhone: "+49 69 9876543",
      notes: "Met at HealthTech Summit Frankfurt. Expanding 600-bed facility, urgent EHR and PMS integration.",
      stage: SalesStage.CONTACTED,
      priority: SalesPriority.CRITICAL,
      dealValue: 145000,
      probability: 40,
      leadSource: "Conference 2026",
      daysAgoCreated: 6,
      tags: ["Hospital", "Urgent", "Enterprise"],
      activities: [
        {
          type: SalesActivityType.MEETING,
          title: "Summit booth introduction",
          description: "Discussed hospital PMS integration and compliance with hospital board director.",
          daysAgo: 5,
          status: "DONE",
        },
        {
          type: SalesActivityType.CALL,
          title: "Follow-up phone conversation",
          description: "Confirmed hospital IT architecture and HL7/FHIR compatibility requirements.",
          daysAgo: 2,
          status: "DONE",
        },
        {
          type: SalesActivityType.TASK,
          title: "Prepare technical architecture brief",
          description: "Send security whitepaper and high-availability SLA specifications to hospital CIO.",
          daysAhead: 1,
          status: "PENDING",
        },
      ],
    },
    {
      companyName: "Apex Dental Care Network",
      domain: "apexdental.co.uk",
      contactName: "Sarah Jenkins",
      contactEmail: "s.jenkins@apexdental.co.uk",
      contactPhone: "+44 20 7946 0912",
      notes: "Chain of 18 dental clinics in Greater London looking to centralize patient appointment queues.",
      stage: SalesStage.QUALIFIED,
      priority: SalesPriority.MEDIUM,
      dealValue: 36000,
      probability: 60,
      leadSource: "Referral",
      daysAgoCreated: 12,
      tags: ["SaaS", "Referral"],
      activities: [
        {
          type: SalesActivityType.CALL,
          title: "Discovery & Qualification",
          description: "Reviewed clinic chain footprint, seat counts, and budget parameters (£30k cap).",
          daysAgo: 8,
          status: "DONE",
        },
        {
          type: SalesActivityType.MEETING,
          title: "Software Demonstration",
          description: "Showcased Kanban task workflows, multi-clinic roles, and staff timesheets.",
          daysAgo: 3,
          status: "DONE",
        },
        {
          type: SalesActivityType.FOLLOWUP,
          title: "Send customized tiered proposal",
          description: "Outline 18-location licensing model and priority technical support SLA.",
          daysAhead: 3,
          status: "PENDING",
        },
      ],
    },
    {
      companyName: "CardioVascular Diagnostics UK",
      domain: "cardiodiagnostics.com",
      contactName: "Dr. Liam Patel",
      contactEmail: "l.patel@cardiodiagnostics.com",
      contactPhone: "+44 161 496 0188",
      notes: "Cardiology imaging center processing 2,500 patient scans monthly. Needs automated ticket dispatch.",
      stage: SalesStage.PROPOSAL_SENT,
      priority: SalesPriority.HIGH,
      dealValue: 82000,
      probability: 75,
      leadSource: "Inbound Demo",
      daysAgoCreated: 18,
      tags: ["Diagnostics", "Enterprise"],
      activities: [
        {
          type: SalesActivityType.CALL,
          title: "Inbound demo request",
          description: "Demonstrated custom intake fields and automated task routing to doctors.",
          daysAgo: 14,
          status: "DONE",
        },
        {
          type: SalesActivityType.EMAIL,
          title: "Formal Proposal Delivered",
          description: "Sent €82,000 comprehensive package including data migration & HIPAA compliance setup.",
          daysAgo: 4,
          status: "DONE",
        },
        {
          type: SalesActivityType.FOLLOWUP,
          title: "Proposal Review Call",
          description: "Discuss contract terms, data hosting options, and onboarding schedule.",
          daysAhead: 2,
          status: "PENDING",
        },
      ],
    },
    {
      companyName: "Swiss MedTech Innovations AG",
      domain: "swissmedtech.ch",
      contactName: "Beatrix Vogt",
      contactEmail: "beatrix.vogt@swissmedtech.ch",
      contactPhone: "+41 44 215 8890",
      notes: "Zurich medical device OEM. Building connected surgical instruments platform.",
      stage: SalesStage.NEGOTIATION,
      priority: SalesPriority.CRITICAL,
      dealValue: 210000,
      probability: 85,
      leadSource: "Referral",
      daysAgoCreated: 28,
      tags: ["MedTech", "Enterprise", "Urgent"],
      activities: [
        {
          type: SalesActivityType.MEETING,
          title: "Executive alignment meeting",
          description: "Met with CTO and VP Procurement in Zurich. Agreed in principle to 3-year term.",
          daysAgo: 7,
          status: "DONE",
        },
        {
          type: SalesActivityType.NOTE,
          title: "Legal redlining in progress",
          description: "Data protection terms and indemnity clauses are being finalized by legal counsel.",
          daysAgo: 2,
          status: "DONE",
        },
        {
          type: SalesActivityType.TASK,
          title: "Final contract signature target",
          description: "Execute master service agreement and issue invoice for kickoff milestone.",
          daysAhead: 4,
          status: "PENDING",
        },
      ],
    },
    {
      companyName: "Bavaria Telehealth Partners",
      domain: "bavaria-telehealth.de",
      contactName: "Klaus Lindner",
      contactEmail: "klaus.lindner@bavaria-telehealth.de",
      contactPhone: "+49 89 5544332",
      notes: "Telehealth provider serving 50,000 remote patients. Won deal — ready to transition to engineering.",
      stage: SalesStage.WON,
      priority: SalesPriority.HIGH,
      dealValue: 125000,
      probability: 100,
      leadSource: "Inbound Call",
      daysAgoCreated: 35,
      tags: ["Telehealth", "Enterprise"],
      activities: [
        {
          type: SalesActivityType.CALL,
          title: "Kickoff scoping call",
          description: "Outlined sprint milestones with lead developer and client success manager.",
          daysAgo: 10,
          status: "DONE",
        },
        {
          type: SalesActivityType.NOTE,
          title: "Contract Signed & Deposit Paid",
          description: "Contract countersigned on 2026-09-08. 50% deposit received in corporate account.",
          daysAgo: 5,
          status: "DONE",
        },
      ],
    },
    {
      companyName: "Nordic Ambulatory Care Clinic",
      domain: "nordicambulatory.se",
      contactName: "Elena Rostova",
      contactEmail: "elena.r@nordicambulatory.se",
      contactPhone: "+46 8 123 4567",
      notes: "Single specialized clinic. Chose a lightweight local freemium tool due to budget constraints.",
      stage: SalesStage.LOST,
      priority: SalesPriority.LOW,
      dealValue: 18000,
      probability: 0,
      leadSource: "Cold Outreach",
      daysAgoCreated: 40,
      tags: ["Referral"],
      activities: [
        {
          type: SalesActivityType.CALL,
          title: "Discovery outreach call",
          description: "Client indicated lack of budget for custom PMS rollout this fiscal year.",
          daysAgo: 20,
          status: "DONE",
        },
        {
          type: SalesActivityType.NOTE,
          title: "Deal Closed Lost - Budget Constraints",
          description: "Re-engage in Q1 2027 when new fiscal clinic budget opens up.",
          daysAgo: 15,
          status: "DONE",
        },
      ],
    },
    {
      companyName: "NeuroScan Diagnostics Labs",
      domain: "neuroscan-analytics.com",
      contactName: "Marc Dupont",
      contactEmail: "m.dupont@neuroscan.fr",
      contactPhone: "+33 1 42 68 55 00",
      notes: "AI-assisted MRI neurological scan processing clinic network in Paris & Lyon.",
      stage: SalesStage.QUALIFIED,
      priority: SalesPriority.HIGH,
      dealValue: 95000,
      probability: 65,
      leadSource: "Website Inbound",
      daysAgoCreated: 9,
      tags: ["AI/ML", "Diagnostics", "Enterprise"],
      activities: [
        {
          type: SalesActivityType.MEETING,
          title: "Product architecture demo",
          description: "Walkthrough of secure DICOM file attachments and doctor task review columns.",
          daysAgo: 4,
          status: "DONE",
        },
        {
          type: SalesActivityType.FOLLOWUP,
          title: "Send cloud security compliance packet",
          description: "Include GDPR and French HDS health data hosting documentation.",
          daysAhead: 1,
          status: "PENDING",
        },
      ],
    },
  ];

  for (let i = 0; i < leadsData.length; i++) {
    const item = leadsData[i];
    const assignee = i % 2 === 0 ? defaultUser : secondaryUser;
    const createdAt = new Date(Date.now() - item.daysAgoCreated * 24 * 60 * 60 * 1000);

    // Create Client
    const client = await prisma.client.create({
      data: {
        name: item.companyName,
        domain: item.domain,
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        notes: item.notes,
        clientType: ClientType.SALES,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const stageId = stageMap.get(item.stage)!;
    const expectedCloseAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const nextFollowUpAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create SalesLead
    const lead = await prisma.salesLead.create({
      data: {
        clientId: client.id,
        pipelineId: pipeline.id,
        stageId,
        currentStage: item.stage,
        priority: item.priority,
        dealValue: item.dealValue,
        probability: item.probability,
        leadSource: item.leadSource,
        expectedCloseAt,
        nextFollowUpAt,
        lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        assignedToId: assignee?.id ?? null,
        createdAt,
        updatedAt: new Date(),
      },
    });

    // Link Tags
    for (const tagName of item.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await prisma.salesLeadTag.create({
          data: {
            leadId: lead.id,
            tagId,
          },
        });
      }
    }

    // Create Activities
    for (const act of item.activities) {
      const actDate = act.daysAgo !== undefined
        ? new Date(Date.now() - act.daysAgo * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + (act.daysAhead || 1) * 24 * 60 * 60 * 1000);

      await prisma.salesActivity.create({
        data: {
          leadId: lead.id,
          type: act.type,
          title: act.title,
          description: act.description,
          dueAt: act.status === "PENDING" ? actDate : null,
          completedAt: act.status === "DONE" ? actDate : null,
          status: act.status,
          priority: item.priority,
          assignedToId: assignee?.id ?? null,
          createdById: defaultUser?.id ?? null,
          createdAt: actDate,
          updatedAt: actDate,
        },
      });
    }

    // Create Audit Log
    await prisma.salesAuditLog.create({
      data: {
        leadId: lead.id,
        actorId: defaultUser?.id ?? null,
        action: SalesAuditAction.CREATED,
        nextValue: item.stage,
        metadata: {
          note: `Lead created via ${item.leadSource} with valuation €${item.dealValue.toLocaleString()}`,
        },
        createdAt,
      },
    });

    if (item.stage !== SalesStage.NEW_LEAD) {
      await prisma.salesAuditLog.create({
        data: {
          leadId: lead.id,
          actorId: defaultUser?.id ?? null,
          action: SalesAuditAction.STAGE_CHANGED,
          prevValue: SalesStage.NEW_LEAD,
          nextValue: item.stage,
          createdAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const [cCount, lCount, aCount] = await Promise.all([
    prisma.client.count({ where: { clientType: ClientType.SALES } }),
    prisma.salesLead.count(),
    prisma.salesActivity.count(),
  ]);

  console.log(`✅ Sales CRM seed completed!`);
  console.log(`   - Sales Clients: ${cCount}`);
  console.log(`   - Sales Leads: ${lCount}`);
  console.log(`   - Activities: ${aCount}`);
}

// Allow direct CLI invocation via `pnpm tsx scripts/seed-sales.ts`
if (process.argv[1]?.includes("seed-sales")) {
  seedSales()
    .catch((e) => {
      console.error("❌ Sales seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
