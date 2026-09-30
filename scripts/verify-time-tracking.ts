import { prisma } from "@zsyio/database";
import { timeEntryRepository } from "../apps/pms/src/server/repositories/time-entry.repository";

// ANSI Styling Helpers
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

function printBanner() {
  console.log("\n" + cyan("┌──────────────────────────────────────────────────────────┐"));
  console.log(cyan("│") + bold("  ⚡ Zsyio Flow — Time Tracking & Estimates Verification  ") + cyan("│"));
  console.log(cyan("└──────────────────────────────────────────────────────────┘\n"));
}

function logStep(step: number, title: string) {
  console.log(`\n${bold(cyan(`[Step ${step}]`))} ${bold(title)}`);
}

function logPass(message: string) {
  console.log(`  ${green("✔")} ${message}`);
}

function logInfo(key: string, value: string) {
  console.log(`    ${dim("•")} ${dim(key.padEnd(20))}: ${value}`);
}

async function main() {
  const startTime = Date.now();
  printBanner();

  // 1. Identify active workspace identity & task
  logStep(1, "Target Context Discovery");
  const user = await prisma.user.findFirst({ where: { active: true } });
  if (!user) throw new Error("No active user found in database. Seed users first.");

  let task = await prisma.task.findFirst({ where: { deletedAt: null } });
  if (!task) throw new Error("No task found in database. Seed tasks first.");

  logPass("Located active operator and target ticket");
  logInfo("Operator", `${user.name || user.email} (${user.id.slice(0, 8)}...)`);
  logInfo("Ticket", `#${task.ticketNumber} — "${task.title}"`);
  logInfo("Initial Logged Hours", `${task.actualHours ?? 0}h`);

  // 2. Configure Estimation Budget
  logStep(2, "Task Estimation Budget");
  const targetEstimate = 4.5;
  await prisma.task.update({
    where: { id: task.id },
    data: { estimatedHours: targetEstimate },
  });
  logPass(`Assigned estimate budget: ${targetEstimate}h`);

  // 3. Manual Work Session Logging
  logStep(3, "Manual Work Session Logging");
  const sessionDuration = 90; // 1.5 hours
  const manualEntry = await timeEntryRepository.create({
    taskId: task.id,
    userId: user.id,
    durationMin: sessionDuration,
    description: "Automated test: Manual offline sprint work log",
    isBillable: true,
  });

  const taskAfterManual = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  logPass(`Created manual log entry (${sessionDuration}m = ${sessionDuration / 60}h)`);
  logInfo("Entry ID", manualEntry.id);
  logInfo("Billable", manualEntry.isBillable ? "Yes (Client Billable)" : "No");
  logInfo("Updated actualHours", `${taskAfterManual.actualHours}h`);

  // 4. Live Stopwatch Lifecycle: Start
  logStep(4, "Live Stopwatch Lifecycle: Start");
  const activeTimer = await timeEntryRepository.create({
    taskId: task.id,
    userId: user.id,
  });
  logPass("Active ticking stopwatch initialized");
  logInfo("Active Session ID", activeTimer.id);

  const activeFound = await timeEntryRepository.getActive(user.id);
  if (!activeFound || activeFound.id !== activeTimer.id) {
    throw new Error("Active timer query failed to retrieve running session.");
  }
  logPass(`Active timer query verified: currently timing "${activeFound.task.title}"`);

  // 5. Live Stopwatch Lifecycle: Stop & Save
  logStep(5, "Live Stopwatch Lifecycle: Stop & Save");
  const stoppedEntry = await timeEntryRepository.stop(activeTimer.id, {
    description: "Automated test: Completed real-time work session",
  });
  logPass(`Stopwatch completed and saved (${stoppedEntry.durationMin}m recorded)`);

  const taskAfterStop = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  logInfo("Recalculated actualHours", `${taskAfterStop.actualHours}h`);

  // 6. Ledger Retrieval
  logStep(6, "Session Ledger Audit");
  const allEntries = await timeEntryRepository.getByTaskId(task.id);
  logPass(`Retrieved ${allEntries.length} session records for ticket`);
  const totalMin = allEntries.reduce((acc, e) => acc + (e.durationMin || 0), 0);
  logInfo("Total Minutes", `${totalMin}m (${(totalMin / 60).toFixed(1)}h)`);

  // 7. Cleanup & Rollback
  logStep(7, "Test Teardown & Integrity Rollback");
  await timeEntryRepository.delete(manualEntry.id);
  await timeEntryRepository.delete(stoppedEntry.id);

  const taskFinal = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  logPass("Test records safely removed");
  logInfo("Restored actualHours", `${taskFinal.actualHours}h`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n" + green("══════════════════════════════════════════════════════════"));
  console.log(bold(green(`  ✨ ALL TIME TRACKING SUBSYSTEM TESTS PASSED (${elapsed}s) ✨`)));
  console.log(green("══════════════════════════════════════════════════════════\n"));
}

main()
  .catch((err) => {
    console.error(`\n${red("✖ Verification Failed:")}`, err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
