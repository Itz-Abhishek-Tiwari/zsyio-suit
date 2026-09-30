import fs from "fs";
import path from "path";

const rootDir = process.cwd();

for (const envFile of [".env", ".env.local"]) {
  const fullPath = path.join(rootDir, envFile);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

import {
  prisma,
  Role,
  SessionStatus,
  ApprovalStatus,
  LeaveType,
  LeaveStatus,
  RegularizationStatus,
  RegularizationType,
  TimesheetAuditAction,
} from "@zsyio/database";

function normalizeDate(d: Date, timeZone: string = "Europe/Berlin"): Date {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = dtf.format(d);
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0));
}

async function main() {
  console.log("🚀 Starting Comprehensive Zsyio People (HRMS) Data Seeding...");

  // 1. Fetch all users
  const users = await prisma.user.findMany();
  const userMap = new Map(users.map((u) => [u.email, u]));

  const admin = userMap.get("admin@zsyio.com");
  const marcus = userMap.get("marcus.brody@zsyio.com");
  const sarah = userMap.get("sarah.chen@zsyio.com");
  const david = userMap.get("david.kim@zsyio.com");
  const elena = userMap.get("elena.rostova@zsyio.com");
  const priya = userMap.get("priya.patel@zsyio.com");
  const liam = userMap.get("liam.torres@zsyio.com");
  const aiko = userMap.get("aiko.yamamoto@zsyio.com");
  const noah = userMap.get("noah.weber@zsyio.com");
  const support = userMap.get("support@zsyio.com");
  const fatima = userMap.get("fatima.alrashid@zsyio.com");
  const rachel = userMap.get("rachel.green@zsyio.com");
  const alex = userMap.get("alex.vance@zsyio.com");
  const superadmin = userMap.get("superadmin@mediloon.de");

  if (!admin) {
    throw new Error("Admin user admin@zsyio.com not found!");
  }

  // 2. Clean existing HRMS data
  console.log("🧹 Cleaning existing HRMS data...");
  await prisma.timesheetAuditLog.deleteMany({});
  await prisma.attendanceRegularization.deleteMany({});
  await prisma.oooSession.deleteMany({});
  await prisma.workSession.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.userLeaveAllocation.deleteMany({});

  // 3. Ensure Leave Policies exist
  console.log("📋 Verifying Leave Policies...");
  const leavePolicies = [
    { leaveType: LeaveType.EARNED, label: "Paid Time Off (PTO)", totalDays: 20.0, color: "emerald", carryForward: true, maxCarryDays: 5.0, description: "Annual accrued vacation & personal time off" },
    { leaveType: LeaveType.SICK, label: "Sick & Medical Leave", totalDays: 10.0, color: "amber", carryForward: false, description: "Health appointments, unexpected illness, medical recovery" },
    { leaveType: LeaveType.CASUAL, label: "Personal Casual Leave", totalDays: 8.0, color: "blue", carryForward: false, description: "Personal administration, family obligations, urgent errands" },
    { leaveType: LeaveType.COMPENSATORY, label: "Compensatory Off", totalDays: 5.0, color: "purple", carryForward: false, description: "Earned comp-off from weekend or holiday critical deployments" },
    { leaveType: LeaveType.UNPAID, label: "Unpaid Leave", totalDays: 30.0, color: "gray", carryForward: false, description: "Leave without pay / sabbatical subject to leadership review" },
  ];

  for (const lp of leavePolicies) {
    await prisma.leavePolicy.upsert({
      where: { leaveType: lp.leaveType },
      create: lp,
      update: lp,
    });
  }

  // 4. Ensure HR Policy Settings exist
  await prisma.hrPolicySettings.upsert({
    where: { id: "default-hr-policy" },
    create: {
      id: "default-hr-policy",
      standardDailyHours: 8.0,
      halfDayMinimumHours: 4.0,
      overtimeThresholdMins: 30,
      weekendDays: "0,6",
      updatedById: admin.id,
    },
    update: {
      standardDailyHours: 8.0,
      halfDayMinimumHours: 4.0,
      overtimeThresholdMins: 30,
      weekendDays: "0,6",
    },
  });

  // 5. Seed User Leave Allocations for ALL users in the system (2026)
  console.log("🎁 Seeding Leave Allocations for all workspace users...");
  for (const u of users) {
    for (const lp of leavePolicies) {
      await prisma.userLeaveAllocation.upsert({
        where: {
          userId_leaveType_year: {
            userId: u.id,
            leaveType: lp.leaveType,
            year: 2026,
          },
        },
        create: {
          userId: u.id,
          leaveType: lp.leaveType,
          year: 2026,
          totalDays: lp.totalDays,
          notes: "Annual company quota allocation for 2026",
        },
        update: {
          totalDays: lp.totalDays,
        },
      });
    }
  }

  // 6. Seed 30-day historical work sessions up to yesterday
  console.log("⏱️ Seeding 30-day work sessions history for team members...");
  const teamMembersWithHistory = [
    admin,
    marcus,
    sarah,
    david,
    elena,
    priya,
    liam,
    aiko,
    noah,
    rachel,
    fatima,
    alex,
  ].filter(Boolean) as typeof users;

  const now = new Date();
  const todayNormalized = normalizeDate(now);

  for (const u of teamMembersWithHistory) {
    const isCurrentAdmin = u.id === admin.id;

    for (let dayOffset = 29; dayOffset >= 1; dayOffset--) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - dayOffset);
      const normalizedDay = normalizeDate(sessionDate);
      const dow = normalizedDay.getUTCDay();

      // Skip Sundays (0); allow occasional Saturday shifts for realism
      if (dow === 0) continue;
      if (dow === 6 && dayOffset > 7) continue;

      // Deterministic but realistic variations
      const seedVal = (u.email.length * 37 + dayOffset * 19) % 100;
      const startMinutes = [0, 10, 15, 20, 30, 45][seedVal % 6];
      const startTime = new Date(normalizedDay);
      startTime.setUTCHours(8, startMinutes, 0, 0); // ~08:00 - 08:45 UTC

      // Admin has an incomplete session 2 days ago for the warning banner demo
      const isIncomplete = isCurrentAdmin && dayOffset === 2;

      if (isIncomplete) {
        await prisma.workSession.create({
          data: {
            userId: u.id,
            createdById: u.id,
            date: normalizedDay,
            startTime,
            endTime: null,
            durationMinutes: null,
            status: SessionStatus.INCOMPLETE,
            approvalStatus: ApprovalStatus.PENDING,
            reason: "System auto-flagged: Session was not clocked out at end of business day",
          },
        });
        continue;
      }

      // Occasional other team members have 1-2 incomplete sessions
      const otherIncomplete = !isCurrentAdmin && (dayOffset === 3 && seedVal % 5 === 0);
      if (otherIncomplete) {
        await prisma.workSession.create({
          data: {
            userId: u.id,
            createdById: u.id,
            date: normalizedDay,
            startTime,
            endTime: null,
            durationMinutes: null,
            status: SessionStatus.INCOMPLETE,
            approvalStatus: ApprovalStatus.PENDING,
            reason: "Incomplete punch recorded",
          },
        });
        continue;
      }

      // Normal completed workday (7.5h to 9h)
      const durationOptions = [465, 480, 495, 510, 525, 540]; // 7h 45m to 9h
      const duration = durationOptions[seedVal % durationOptions.length];
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const ws = await prisma.workSession.create({
        data: {
          userId: u.id,
          createdById: u.id,
          date: normalizedDay,
          startTime,
          endTime,
          durationMinutes: duration,
          status: SessionStatus.COMPLETED,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });

      // Add Lunch break (45m or 60m)
      const breakOffsetHours = 3.5 + (seedVal % 3) * 0.5;
      const breakStart = new Date(startTime.getTime() + breakOffsetHours * 3600000);
      const breakMinutes = seedVal % 2 === 0 ? 45 : 60;
      const breakEnd = new Date(breakStart.getTime() + breakMinutes * 60000);

      await prisma.oooSession.create({
        data: {
          userId: u.id,
          createdById: u.id,
          workSessionId: ws.id,
          date: normalizedDay,
          startTime: breakStart,
          endTime: breakEnd,
          durationMinutes: breakMinutes,
          status: SessionStatus.COMPLETED,
          approvalStatus: ApprovalStatus.APPROVED,
          reason: "Lunch break",
        },
      });

      // Occasional afternoon coffee break
      if (seedVal % 3 === 0) {
        const coffeeStart = new Date(breakEnd.getTime() + 2 * 3600000);
        const coffeeMins = 15;
        await prisma.oooSession.create({
          data: {
            userId: u.id,
            createdById: u.id,
            workSessionId: ws.id,
            date: normalizedDay,
            startTime: coffeeStart,
            endTime: new Date(coffeeStart.getTime() + coffeeMins * 60000),
            durationMinutes: coffeeMins,
            status: SessionStatus.COMPLETED,
            approvalStatus: ApprovalStatus.APPROVED,
            reason: "Coffee & team alignment break",
          },
        });
      }
    }
  }

  // 7. Seed TODAY'S LIVE SESSIONS (Saturday, Oct 3, 2026)
  console.log("⚡ Seeding TODAY live sessions (active working, on break, completed)...");

  // A. Admin User: CLOCKED IN & ACTIVELY WORKING TODAY
  // Started at 07:30 UTC (~3.5 hours ago)
  const adminTodayStart = new Date(todayNormalized);
  adminTodayStart.setUTCHours(7, 30, 0, 0);

  const adminWorkSession = await prisma.workSession.create({
    data: {
      userId: admin.id,
      createdById: admin.id,
      date: todayNormalized,
      startTime: adminTodayStart,
      endTime: null,
      durationMinutes: null,
      status: SessionStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      entryType: "AUTOMATIC",
    },
  });

  // Admin completed a morning coffee break 1 hour ago
  const adminBreakStart = new Date(todayNormalized);
  adminBreakStart.setUTCHours(9, 30, 0, 0);
  const adminBreakEnd = new Date(todayNormalized);
  adminBreakEnd.setUTCHours(10, 0, 0, 0);

  await prisma.oooSession.create({
    data: {
      userId: admin.id,
      createdById: admin.id,
      workSessionId: adminWorkSession.id,
      date: todayNormalized,
      startTime: adminBreakStart,
      endTime: adminBreakEnd,
      durationMinutes: 30,
      status: SessionStatus.COMPLETED,
      approvalStatus: ApprovalStatus.APPROVED,
      reason: "Morning coffee & architecture review",
    },
  });

  // B. Other Employees WORKING NOW (Active sessions)
  const activeWorkers = [
    { user: david, startHour: 7, startMin: 0 },
    { user: elena, startHour: 7, startMin: 15 },
    { user: liam, startHour: 8, startMin: 0 },
    { user: rachel, startHour: 7, startMin: 45 },
    { user: marcus, startHour: 6, startMin: 45 },
  ];

  for (const worker of activeWorkers) {
    if (!worker.user) continue;
    const startTime = new Date(todayNormalized);
    startTime.setUTCHours(worker.startHour, worker.startMin, 0, 0);

    const ws = await prisma.workSession.create({
      data: {
        userId: worker.user.id,
        createdById: worker.user.id,
        date: todayNormalized,
        startTime,
        endTime: null,
        durationMinutes: null,
        status: SessionStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        entryType: "AUTOMATIC",
      },
    });

    // Completed morning break for realism
    const morningBreak = new Date(todayNormalized);
    morningBreak.setUTCHours(worker.startHour + 2, 0, 0, 0);
    await prisma.oooSession.create({
      data: {
        userId: worker.user.id,
        createdById: worker.user.id,
        workSessionId: ws.id,
        date: todayNormalized,
        startTime: morningBreak,
        endTime: new Date(morningBreak.getTime() + 20 * 60000),
        durationMinutes: 20,
        status: SessionStatus.COMPLETED,
        approvalStatus: ApprovalStatus.APPROVED,
        reason: "Morning sync & standup coffee",
      },
    });
  }

  // C. Employees CURRENTLY ON BREAK (Active OOO Session)
  const breakWorkers = [
    { user: priya, startHour: 6, startMin: 30, breakReason: "Lunch break", breakStartHour: 10, breakStartMin: 30 },
    { user: noah, startHour: 7, startMin: 15, breakReason: "Coffee & sprint review catch-up", breakStartHour: 10, breakStartMin: 45 },
    { user: fatima, startHour: 6, startMin: 45, breakReason: "Client call transition break", breakStartHour: 10, breakStartMin: 50 },
  ];

  for (const bw of breakWorkers) {
    if (!bw.user) continue;
    const workStart = new Date(todayNormalized);
    workStart.setUTCHours(bw.startHour, bw.startMin, 0, 0);

    const ws = await prisma.workSession.create({
      data: {
        userId: bw.user.id,
        createdById: bw.user.id,
        date: todayNormalized,
        startTime: workStart,
        endTime: null,
        durationMinutes: null,
        status: SessionStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });

    const breakStart = new Date(todayNormalized);
    breakStart.setUTCHours(bw.breakStartHour, bw.breakStartMin, 0, 0);

    await prisma.oooSession.create({
      data: {
        userId: bw.user.id,
        createdById: bw.user.id,
        workSessionId: ws.id,
        date: todayNormalized,
        startTime: breakStart,
        endTime: null,
        durationMinutes: null,
        status: SessionStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
        reason: bw.breakReason,
      },
    });
  }

  // D. Employees CLOCKED OUT TODAY (Completed shifts)
  const completedToday = [
    { user: aiko, startHour: 4, durationMins: 390 }, // early shift (6.5h)
    { user: support, startHour: 3, durationMins: 420 }, // early support shift (7h)
    { user: alex, startHour: 4, durationMins: 330 }, // maintenance shift (5.5h)
  ];

  for (const ct of completedToday) {
    if (!ct.user) continue;
    const startTime = new Date(todayNormalized);
    startTime.setUTCHours(ct.startHour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + ct.durationMins * 60000);

    const ws = await prisma.workSession.create({
      data: {
        userId: ct.user.id,
        createdById: ct.user.id,
        date: todayNormalized,
        startTime,
        endTime,
        durationMinutes: ct.durationMins,
        status: SessionStatus.COMPLETED,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });

    const bStart = new Date(startTime.getTime() + 180 * 60000);
    await prisma.oooSession.create({
      data: {
        userId: ct.user.id,
        createdById: ct.user.id,
        workSessionId: ws.id,
        date: todayNormalized,
        startTime: bStart,
        endTime: new Date(bStart.getTime() + 30 * 60000),
        durationMinutes: 30,
        status: SessionStatus.COMPLETED,
        approvalStatus: ApprovalStatus.APPROVED,
        reason: "Shift meal break",
      },
    });
  }

  // 8. Seed Rich Leave Requests (Past, Today, and Future)
  console.log("🏖️ Seeding Leave Requests (Approved, Pending, Rejected)...");

  const leavesToSeed = [
    // Admin leaves:
    {
      user: admin,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-09-14T00:00:00.000Z"),
      endDate: new Date("2026-09-16T00:00:00.000Z"),
      daysCount: 3,
      reason: "Annual Q3 Executive Strategy & Family Retreat",
      status: LeaveStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved by Engineering Leadership. Have a great retreat!",
      reviewedAt: new Date("2026-09-10T14:30:00.000Z"),
    },
    {
      user: admin,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-08-21T00:00:00.000Z"),
      endDate: new Date("2026-08-21T00:00:00.000Z"),
      daysCount: 1,
      reason: "Personal banking and residential relocation administrative work",
      status: LeaveStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved. All systems stable.",
      reviewedAt: new Date("2026-08-19T09:00:00.000Z"),
    },
    {
      user: admin,
      leaveType: LeaveType.SICK,
      startDate: new Date("2026-09-04T00:00:00.000Z"),
      endDate: new Date("2026-09-04T00:00:00.000Z"),
      daysCount: 1,
      reason: "Viral flu recovery and medical rest",
      status: LeaveStatus.APPROVED,
      reviewer: sarah,
      reviewerComment: "Get well soon!",
      reviewedAt: new Date("2026-09-04T08:15:00.000Z"),
    },
    {
      user: admin,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-11-17T00:00:00.000Z"),
      endDate: new Date("2026-11-20T00:00:00.000Z"),
      daysCount: 4,
      reason: "Q4 Year-End Vacation & Holiday Family Travel",
      status: LeaveStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
      reviewedAt: null,
    },

    // Active Leaves TODAY (Oct 03, 2026):
    {
      user: sarah,
      leaveType: LeaveType.SICK,
      startDate: new Date("2026-10-02T00:00:00.000Z"),
      endDate: new Date("2026-10-05T00:00:00.000Z"),
      daysCount: 3,
      reason: "Post-surgery recovery and doctor recommended bed rest",
      status: LeaveStatus.APPROVED,
      reviewer: admin,
      reviewerComment: "Approved. Take all the rest you need Sarah.",
      reviewedAt: new Date("2026-10-01T16:00:00.000Z"),
    },
    {
      user: superadmin,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-10-06T00:00:00.000Z"),
      daysCount: 4,
      reason: "Bavaria hiking expedition and off-grid retreat",
      status: LeaveStatus.APPROVED,
      reviewer: admin,
      reviewerComment: "Approved by leadership. Emergency escalations routed to Marcus.",
      reviewedAt: new Date("2026-09-28T11:00:00.000Z"),
    },

    // Other Team Pending Leaves (visible in Approvals queue):
    {
      user: liam,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-11-03T00:00:00.000Z"),
      endDate: new Date("2026-11-07T00:00:00.000Z"),
      daysCount: 5,
      reason: "Annual vacation — Spain road trip and Mediterranean photography",
      status: LeaveStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
      reviewedAt: null,
    },
    {
      user: elena,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-10-12T00:00:00.000Z"),
      endDate: new Date("2026-10-12T00:00:00.000Z"),
      daysCount: 1,
      reason: "Family anniversary and children's school convocation ceremony",
      status: LeaveStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
      reviewedAt: null,
    },
    {
      user: noah,
      leaveType: LeaveType.COMPENSATORY,
      startDate: new Date("2026-10-09T00:00:00.000Z"),
      endDate: new Date("2026-10-09T00:00:00.000Z"),
      daysCount: 1,
      reason: "Comp-off for midnight production release and hotfix deployment",
      status: LeaveStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
      reviewedAt: null,
    },
    {
      user: priya,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-11-24T00:00:00.000Z"),
      endDate: new Date("2026-11-26T00:00:00.000Z"),
      daysCount: 3,
      reason: "Thanksgiving family gathering and out-of-state travel",
      status: LeaveStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
      reviewedAt: null,
    },

    // Other Team Approved Leaves:
    {
      user: david,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-10-20T00:00:00.000Z"),
      endDate: new Date("2026-10-24T00:00:00.000Z"),
      daysCount: 5,
      reason: "Family vacation — pre-aligned with Marcus and frontend squad",
      status: LeaveStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved. All sprint tickets assigned to Aiko.",
      reviewedAt: new Date("2026-09-30T10:00:00.000Z"),
    },
    {
      user: aiko,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-10-15T00:00:00.000Z"),
      endDate: new Date("2026-10-15T00:00:00.000Z"),
      daysCount: 0.5,
      isHalfDay: true,
      halfDayType: "FIRST_HALF",
      reason: "Morning specialist doctor consultation and health checkup",
      status: LeaveStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved. See you in the afternoon.",
      reviewedAt: new Date("2026-10-01T15:00:00.000Z"),
    },
    {
      user: rachel,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-09-18T00:00:00.000Z"),
      endDate: new Date("2026-09-18T00:00:00.000Z"),
      daysCount: 1,
      reason: "Apartment lease signing and utility setup",
      status: LeaveStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved.",
      reviewedAt: new Date("2026-09-16T12:00:00.000Z"),
    },

    // Rejected Leaves:
    {
      user: marcus,
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
      daysCount: 3,
      reason: "Long weekend trip during Q3 closing",
      status: LeaveStatus.REJECTED,
      reviewer: admin,
      reviewerComment: "Cannot approve during Q3 enterprise billing cutover. Please reschedule to mid-October.",
      reviewedAt: new Date("2026-09-20T17:00:00.000Z"),
    },
    {
      user: fatima,
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-09-25T00:00:00.000Z"),
      endDate: new Date("2026-09-25T00:00:00.000Z"),
      daysCount: 1,
      reason: "Personal appointment on client SLA audit day",
      status: LeaveStatus.REJECTED,
      reviewer: marcus,
      reviewerComment: "On-call support coverage required for Apex QBR. Please coordinate swap with Support Desk first.",
      reviewedAt: new Date("2026-09-22T09:30:00.000Z"),
    },
  ];

  for (const lr of leavesToSeed) {
    if (!lr.user) continue;
    await prisma.leaveRequest.create({
      data: {
        userId: lr.user.id,
        leaveType: lr.leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        daysCount: lr.daysCount,
        isHalfDay: (lr as any).isHalfDay ?? false,
        halfDayType: (lr as any).halfDayType ?? null,
        reason: lr.reason,
        status: lr.status,
        reviewerId: lr.reviewer?.id ?? null,
        reviewerComment: lr.reviewerComment ?? null,
        reviewedAt: lr.reviewedAt ?? null,
      },
    });
  }

  // 9. Seed Attendance Regularizations
  console.log("📝 Seeding Attendance Regularizations (Pending, Approved, Rejected)...");

  const regularizationsToSeed = [
    // PENDING Regularizations (Visible to Admin & Manager in Approvals Tab)
    {
      user: admin,
      date: new Date("2026-10-01T00:00:00.000Z"),
      type: RegularizationType.MISSED_PUNCH_OUT,
      requestedClockIn: new Date("2026-10-01T08:30:00.000Z"),
      requestedClockOut: new Date("2026-10-01T17:45:00.000Z"),
      reason: "Corporate VPN tunnel dropped unexpectedly at 17:30; continued working locally until 17:45 without punch station access.",
      status: RegularizationStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
    },
    {
      user: david,
      date: new Date("2026-09-28T00:00:00.000Z"),
      type: RegularizationType.MISSED_PUNCH_IN,
      requestedClockIn: new Date("2026-09-28T08:45:00.000Z"),
      requestedClockOut: new Date("2026-09-28T17:30:00.000Z"),
      reason: "Office building keycard and biometric terminal offline during emergency evacuation drill.",
      status: RegularizationStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
    },
    {
      user: priya,
      date: new Date("2026-09-25T00:00:00.000Z"),
      type: RegularizationType.MISSED_BOTH,
      requestedClockIn: new Date("2026-09-25T09:00:00.000Z"),
      requestedClockOut: new Date("2026-09-25T18:15:00.000Z"),
      reason: "Handled offsite emergency P1 client triage call from home before commute, was unable to log into dashboard.",
      status: RegularizationStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
    },
    {
      user: liam,
      date: new Date("2026-09-29T00:00:00.000Z"),
      type: RegularizationType.TIME_CORRECTION,
      requestedClockIn: new Date("2026-09-29T09:15:00.000Z"),
      requestedClockOut: new Date("2026-09-29T19:00:00.000Z"),
      reason: "Stayed 1h 15m overtime assisting security compliance vulnerability patch; punch station timed out earlier.",
      status: RegularizationStatus.PENDING,
      reviewer: null,
      reviewerComment: null,
    },

    // APPROVED Regularizations
    {
      user: elena,
      date: new Date("2026-09-18T00:00:00.000Z"),
      type: RegularizationType.MISSED_PUNCH_OUT,
      requestedClockIn: new Date("2026-09-18T08:30:00.000Z"),
      requestedClockOut: new Date("2026-09-18T17:15:00.000Z"),
      reason: "Laptop battery died right before clocking out at airport departure lounge.",
      status: RegularizationStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved. Verified Git commit timestamps corresponding to the timeframe.",
      reviewedAt: new Date("2026-09-19T10:00:00.000Z"),
    },
    {
      user: noah,
      date: new Date("2026-09-15T00:00:00.000Z"),
      type: RegularizationType.MISSED_PUNCH_IN,
      requestedClockIn: new Date("2026-09-15T09:00:00.000Z"),
      requestedClockOut: new Date("2026-09-15T17:30:00.000Z"),
      reason: "Forgot to punch in after morning dentist appointment.",
      status: RegularizationStatus.APPROVED,
      reviewer: marcus,
      reviewerComment: "Approved based on Slack standup message at 09:05.",
      reviewedAt: new Date("2026-09-16T11:20:00.000Z"),
    },
    {
      user: aiko,
      date: new Date("2026-09-11T00:00:00.000Z"),
      type: RegularizationType.TIME_CORRECTION,
      requestedClockIn: new Date("2026-09-11T09:00:00.000Z"),
      requestedClockOut: new Date("2026-09-11T18:45:00.000Z"),
      reason: "Worked extra 45m finalizing Design System Figma tokens sync.",
      status: RegularizationStatus.APPROVED,
      reviewer: admin,
      reviewerComment: "Approved. Design System release was delivered on schedule.",
      reviewedAt: new Date("2026-09-12T09:45:00.000Z"),
    },

    // REJECTED Regularizations
    {
      user: rachel,
      date: new Date("2026-09-08T00:00:00.000Z"),
      type: RegularizationType.MISSED_BOTH,
      requestedClockIn: new Date("2026-09-08T09:00:00.000Z"),
      requestedClockOut: new Date("2026-09-08T17:00:00.000Z"),
      reason: "Forgot to punch entire day during sales client visit.",
      status: RegularizationStatus.REJECTED,
      reviewer: admin,
      reviewerComment: "No client calendar event or CRM visit log found for this date. Please resubmit with client confirmation.",
      reviewedAt: new Date("2026-09-09T14:15:00.000Z"),
    },
  ];

  for (const reg of regularizationsToSeed) {
    if (!reg.user) continue;
    const createdReg = await prisma.attendanceRegularization.create({
      data: {
        userId: reg.user.id,
        date: reg.date,
        type: reg.type,
        requestedClockIn: reg.requestedClockIn,
        requestedClockOut: reg.requestedClockOut,
        reason: reg.reason,
        status: reg.status,
        reviewerId: reg.reviewer?.id ?? null,
        reviewerComment: reg.reviewerComment ?? null,
        reviewedAt: (reg as any).reviewedAt ?? null,
      },
    });

    // Add Audit log for approved regularizations
    if (reg.status === RegularizationStatus.APPROVED && reg.reviewer) {
      await prisma.timesheetAuditLog.create({
        data: {
          actorId: reg.reviewer.id,
          action: TimesheetAuditAction.REGULARIZED,
          field: "approvalStatus",
          oldValue: "PENDING",
          newValue: "APPROVED",
          reason: `Regularization approved: ${reg.reason}`,
        },
      });
    }
  }

  // 10. Summary verification
  const totalWs = await prisma.workSession.count();
  const totalOoo = await prisma.oooSession.count();
  const totalLeaves = await prisma.leaveRequest.count();
  const totalRegs = await prisma.attendanceRegularization.count();
  const totalAllocs = await prisma.userLeaveAllocation.count();
  const activeNow = await prisma.workSession.count({ where: { status: SessionStatus.ACTIVE, endTime: null } });
  const onBreakNow = await prisma.oooSession.count({ where: { status: SessionStatus.ACTIVE, endTime: null } });

  console.log("\n=======================================================");
  console.log("✨ ZSYIO PEOPLE (HRMS) FULL SEED COMPLETE!");
  console.log("=======================================================");
  console.log(`📊 Work Sessions:       ${totalWs}`);
  console.log(`☕ OOO / Breaks:         ${totalOoo}`);
  console.log(`🏖️ Leave Requests:       ${totalLeaves}`);
  console.log(`📝 Regularizations:      ${totalRegs}`);
  console.log(`🎁 Leave Allocations:    ${totalAllocs}`);
  console.log(`🟢 Working Now:          ${activeNow}`);
  console.log(`🟡 On Break Now:         ${onBreakNow}`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding HRMS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
