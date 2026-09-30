import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import dotenv from "dotenv";

const rootDir = process.cwd();

// Load environment variables
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

import { prisma } from "@zsyio/database";

const backupFile = path.join(rootDir, "neon_backup_PMS.sql");
const tempSqlFile = path.join(rootDir, "clean_neon_restore.sql");

// Strict topological order ensuring parent tables exist before child tables
const ALL_TABLES_ORDER = [
  "CustomRole",
  "CustomTaskType",
  "CustomKanbanColumn",
  "SalesTag",
  "TaskTag",
  "LeavePolicy",
  "User",
  "Team",
  "TeamMember",
  "Client",
  "Product",
  "SalesPipeline",
  "PipelineStage",
  "SalesLead",
  "SalesLeadTag",
  "SalesActivity",
  "SalesAuditLog",
  "CompanyHoliday",
  "HrPolicySettings",
  "UserLeaveAllocation",
  "WorkSession",
  "OooSession",
  "AttendanceRegularization",
  "LeaveRequest",
  "TimesheetAuditLog",
  "NoteFolder",
  "Note",
  "NoteFolderShare",
  "NoteShare",
  "NoteStar",
  "NotificationPreference",
  "Notification",
  "Task",
  "TaskAssignee",
  "TaskReviewer",
  "TaskTeam",
  "TaskTagAssignment",
  "TestCase",
  "Comment",
  "Attachment",
  "ActivityLog",
  "DashboardNote",
  "DashboardNoteTeam",
  "DashboardNoteUser",
];

export async function restoreNeonBackup() {
  console.log("🚀 Starting Supabase Database Restore from neon_backup_PMS.sql...\n");

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at ${backupFile}`);
  }

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Neither DIRECT_URL nor DATABASE_URL is set in environment.");
  }

  console.log("🧹 1. Clearing existing tables in Supabase DB (TRUNCATE CASCADE)...");
  // Build safe truncate list of all tables
  const truncateList = ALL_TABLES_ORDER.map((t) => `public."${t}"`).join(", ");
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${truncateList} CASCADE;`);
    console.log("✅ Existing database tables truncated cleanly.");
  } catch (err: any) {
    console.warn("⚠️  Truncate notice:", err.message);
  }

  console.log("\n📦 2. Parsing and buffering COPY data streams per table from neon_backup_PMS.sql...");
  const rl = readline.createInterface({
    input: fs.createReadStream(backupFile),
    crlfDelay: Infinity,
  });

  const tableDataMap = new Map<string, { header: string; rows: string[] }>();
  let currentTable: string | null = null;
  let currentHeader: string = "";
  let currentRows: string[] = [];

  for await (const line of rl) {
    if (line.startsWith("COPY public.")) {
      const match = line.match(/^COPY public\."([^"]+)" \((.+)\) FROM stdin;/);
      if (match) {
        currentTable = match[1];
        currentHeader = line;
        currentRows = [];
      }
    } else if (currentTable) {
      if (line === "\\.") {
        tableDataMap.set(currentTable, {
          header: currentHeader,
          rows: currentRows,
        });
        currentTable = null;
        currentHeader = "";
        currentRows = [];
      } else {
        currentRows.push(line);
      }
    }
  }

  console.log(`✅ Extracted data for ${tableDataMap.size} tables.`);

  console.log("\n📝 3. Preparing clean SQL restore stream with replica mode...");
  const sqlChunks: string[] = [
    "-- Clean Supabase Restore generated from neon_backup_PMS.sql\n",
    "SET statement_timeout = 0;\n",
    "SET client_encoding = 'UTF8';\n",
    "SET standard_conforming_strings = on;\n",
    "SET check_function_bodies = false;\n",
    "SET client_min_messages = warning;\n",
    "SET row_security = off;\n",
    "SET session_replication_role = 'replica';\n\n",
  ];

  const tableCounts: Record<string, number> = {};

  for (const tableName of ALL_TABLES_ORDER) {
    const data = tableDataMap.get(tableName);
    if (!data) continue;

    tableCounts[tableName] = data.rows.length;
    sqlChunks.push(`${data.header}\n`);
    for (const row of data.rows) {
      sqlChunks.push(`${row}\n`);
    }
    sqlChunks.push("\\.\n\n");
  }

  // Restore session replication role
  sqlChunks.push("SET session_replication_role = 'origin';\n\n");

  // Post-restore sequence and schema sync
  sqlChunks.push(`
DO $$
BEGIN
  -- Sync Task ticketNumber sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Task_ticketNumber_seq') THEN
    PERFORM setval('public."Task_ticketNumber_seq"', COALESCE((SELECT MAX("ticketNumber") FROM public."Task"), 1), true);
  END IF;
END $$;
`);

  fs.writeFileSync(tempSqlFile, sqlChunks.join(""), "utf8");

  console.log("📊 Row counts to be restored:");
  for (const [tbl, count] of Object.entries(tableCounts)) {
    if (count > 0) {
      console.log(`   - ${tbl.padEnd(26)}: ${count} rows`);
    }
  }

  console.log("\n📥 4. Piping clean SQL restore into Supabase via psql...");
  execSync(`psql "${dbUrl}" -f "${tempSqlFile}"`, {
    stdio: "inherit",
    maxBuffer: 1024 * 1024 * 100,
  });

  // Clean up temporary file
  if (fs.existsSync(tempSqlFile)) {
    fs.unlinkSync(tempSqlFile);
  }

  console.log("\n🔍 5. Verification of restored records in Supabase...");
  const [
    userCount,
    clientCount,
    productCount,
    taskCount,
    activityCount,
    commentCount,
    attachmentCount,
    testCaseCount,
    noteCount,
    notificationCount,
    salesPipelineCount,
    salesLeadCount,
    workSessionCount,
    leaveRequestCount,
    companyHolidayCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.product.count(),
    prisma.task.count(),
    prisma.activityLog.count(),
    prisma.comment.count(),
    prisma.attachment.count(),
    prisma.testCase.count(),
    prisma.note.count(),
    prisma.notification.count(),
    prisma.salesPipeline.count(),
    prisma.salesLead.count(),
    prisma.workSession.count(),
    prisma.leaveRequest.count(),
    prisma.companyHoliday.count(),
  ]);

  console.log("\n================ SUPABASE RESTORE SUMMARY ================");
  console.log(`   - Users:               ${userCount}`);
  console.log(`   - Clients:             ${clientCount}`);
  console.log(`   - Products:            ${productCount}`);
  console.log(`   - Tasks:               ${taskCount}`);
  console.log(`   - Test Cases:          ${testCaseCount}`);
  console.log(`   - Comments:            ${commentCount}`);
  console.log(`   - Attachments:         ${attachmentCount}`);
  console.log(`   - Activity Logs:       ${activityCount}`);
  console.log(`   - Notes:               ${noteCount}`);
  console.log(`   - Notifications:       ${notificationCount}`);
  console.log(`   - Sales Pipelines:     ${salesPipelineCount}`);
  console.log(`   - Sales Leads:         ${salesLeadCount}`);
  console.log(`   - Work Sessions:       ${workSessionCount}`);
  console.log(`   - Leave Requests:      ${leaveRequestCount}`);
  console.log(`   - Company Holidays:    ${companyHolidayCount}`);
  console.log("==========================================================");

  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, theme: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nUser accounts verified (${users.length}):`);
  for (const u of users) {
    console.log(`   - [${u.role}] ${u.name} <${u.email}> (theme: ${u.theme || "light"})`);
  }

  console.log("\n🎉 Supabase database successfully fed and verified with latest schema & data!");
}

restoreNeonBackup()
  .catch((err) => {
    console.error("❌ Restore failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
