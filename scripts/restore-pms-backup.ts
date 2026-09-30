import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import dotenv from "dotenv";

const rootDir = process.cwd();
dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

import { prisma } from "@zsyio/database";
const backupFile = path.join(rootDir, "supabase_backup_PMS.sql");
const tempSqlFile = path.join(rootDir, "clean_pms_restore.sql");

// Strict topological order ensuring parent tables exist before child tables
const INSERTION_ORDER = [
  "CustomRole",
  "CustomTaskType",
  "CustomKanbanColumn",
  "User",
  "Team",
  "TeamMember",
  "Client",
  "Product",
  "Task",
  "TaskAssignee",
  "TaskTeam",
  "TestCase",
  "Comment",
  "Attachment",
  "ActivityLog",
  "DashboardNote",
  "DashboardNoteTeam",
  "DashboardNoteUser",
  "NoteFolder",
  "Note",
  "NoteFolderShare",
  "NoteShare",
  "NoteStar",
  "Notification",
  "NotificationPreference",
];

// All tables to truncate in clean database reset
const ALL_TABLES_TO_TRUNCATE = [
  '"TaskTagAssignment"',
  '"TaskTag"',
  '"TaskReviewer"',
  '"SalesAuditLog"',
  '"SalesActivity"',
  '"SalesLeadTag"',
  '"SalesTag"',
  '"SalesLead"',
  '"PipelineStage"',
  '"SalesPipeline"',
  '"WorkSession"',
  '"OooSession"',
  '"LeaveRequest"',
  '"UserLeaveAllocation"',
  '"LeavePolicy"',
  '"CompanyHoliday"',
  '"AttendanceRegularization"',
  '"TimesheetAuditLog"',
  '"HrPolicySettings"',
  '"ActivityLog"',
  '"Attachment"',
  '"Comment"',
  '"TestCase"',
  '"TaskAssignee"',
  '"TaskTeam"',
  '"DashboardNoteTeam"',
  '"DashboardNoteUser"',
  '"DashboardNote"',
  '"Notification"',
  '"NotificationPreference"',
  '"Task"',
  '"TeamMember"',
  '"Team"',
  '"Product"',
  '"Client"',
  '"User"',
  '"CustomRole"',
  '"CustomTaskType"',
  '"CustomKanbanColumn"',
  '"NoteStar"',
  '"NoteShare"',
  '"NoteFolderShare"',
  '"Note"',
  '"NoteFolder"',
];

export async function restorePmsBackup() {
  console.log("🚀 Starting PMS Database Restore from supabase_backup_PMS.sql...");

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at ${backupFile}`);
  }

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Neither DIRECT_URL nor DATABASE_URL is set in environment.");
  }

  console.log("🧹 1. Clearing current data in Neon DB (TRUNCATE CASCADE)...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${ALL_TABLES_TO_TRUNCATE.join(", ")} CASCADE;`);
  console.log("✅ Current database data successfully cleared.");

  console.log("📦 2. Parsing and buffering COPY data streams per table...");
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

  console.log("📝 3. Writing clean SQL dump in strict foreign-key dependency order...");
  const sqlChunks: string[] = [
    "-- Clean PMS Restore generated from supabase_backup_PMS.sql\n",
    "SET statement_timeout = 0;\n",
    "SET client_encoding = 'UTF8';\n",
    "SET standard_conforming_strings = on;\n",
    "SET check_function_bodies = false;\n",
    "SET client_min_messages = warning;\n",
    "SET row_security = off;\n",
    "SET session_replication_role = 'replica';\n\n",
  ];

  const tableCounts: Record<string, number> = {};

  for (const tableName of INSERTION_ORDER) {
    const data = tableDataMap.get(tableName);
    if (!data) continue;

    tableCounts[tableName] = data.rows.length;
    sqlChunks.push(`${data.header}\n`);
    for (const row of data.rows) {
      sqlChunks.push(`${row}\n`);
    }
    sqlChunks.push("\\.\n\n");
  }

  sqlChunks.push("SET session_replication_role = 'origin';\n\n");

  // Schema adjustments & sequence fixes post-COPY
  sqlChunks.push("\n-- Post-restore schema fixes & defaults\n");
  sqlChunks.push("UPDATE public.\"User\" SET theme = 'light' WHERE theme IS NULL;\n");
  sqlChunks.push("UPDATE public.\"Client\" SET \"clientType\" = 'DEVELOPMENT' WHERE \"clientType\" IS NULL;\n");
  sqlChunks.push(`
DO $$
BEGIN
  -- Populate ticketNumber if missing
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as rn
    FROM public."Task"
  )
  UPDATE public."Task" t
  SET "ticketNumber" = n.rn
  FROM numbered n
  WHERE t.id = n.id AND (t."ticketNumber" IS NULL OR t."ticketNumber" = 0);

  -- Sync ticketNumber sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Task_ticketNumber_seq') THEN
    PERFORM setval('public."Task_ticketNumber_seq"', COALESCE((SELECT MAX("ticketNumber") FROM public."Task"), 1), true);
  END IF;
END $$;
`);

  fs.writeFileSync(tempSqlFile, sqlChunks.join(""), "utf8");

  console.log("📊 Tables to restore in topological order:");
  for (const [tbl, count] of Object.entries(tableCounts)) {
    console.log(`   - ${tbl.padEnd(25)}: ${count} rows`);
  }

  console.log("\n📥 4. Piping clean SQL restore into database using psql...");
  execSync(`psql "${dbUrl}" -f "${tempSqlFile}"`, {
    stdio: "inherit",
    maxBuffer: 1024 * 1024 * 100,
  });

  // Clean up temporary file
  if (fs.existsSync(tempSqlFile)) {
    fs.unlinkSync(tempSqlFile);
  }

  console.log("💼 5. Ensuring default Sales CRM pipeline and stages exist...");
  const { seedSales } = await import("./seed-sales");
  await seedSales();

  console.log("🔍 6. Verification of restored records and original passwords...");
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
  ]);

  console.log("\n================ RESTORE SUMMARY ================");
  console.log(`   - Users:            ${userCount}`);
  console.log(`   - Clients:          ${clientCount}`);
  console.log(`   - Products:         ${productCount}`);
  console.log(`   - Tasks:            ${taskCount}`);
  console.log(`   - Test Cases:       ${testCaseCount}`);
  console.log(`   - Comments:         ${commentCount}`);
  console.log(`   - Attachments:      ${attachmentCount}`);
  console.log(`   - Activity Logs:    ${activityCount}`);
  console.log(`   - Notes:            ${noteCount}`);
  console.log(`   - Notifications:    ${notificationCount}`);
  console.log(`   - Sales Pipelines:  ${salesPipelineCount}`);
  console.log("=================================================");

  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, theme: true, passwordHash: true },
  });
  console.log("\nUser accounts restored (with original SQL passwords preserved):");
  for (const u of users) {
    const hasHash = !!u.passwordHash;
    const hashPreview = u.passwordHash ? u.passwordHash.substring(0, 10) + "..." : "NONE";
    console.log(`   - [${u.role}] ${u.name} <${u.email}> (theme: ${u.theme}, hash: ${hashPreview})`);
  }

  console.log("\n🎉 Database restore and seed completed successfully!");
}

if (process.argv[1]?.includes("restore-pms-backup")) {
  restorePmsBackup()
    .catch((err) => {
      console.error("❌ Restore failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
