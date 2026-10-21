import { prisma } from "@zsyio/database";
import bcrypt from "bcryptjs";

export async function resetAllPasswords() {
  console.log("🔐 Starting password reset for all database users...");

  const hash = await bcrypt.hash("password", 10);

  // Ensure Support user exists if not already present
  const supportEmail = "support@zsyio.de";
  const supportRole = await prisma.customRole.findFirst({
    where: { name: "SUPPORT" },
  });

  await prisma.user.upsert({
    where: { email: supportEmail },
    update: {
      passwordHash: hash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
      customRoleId: supportRole?.id ?? null,
    },
    create: {
      name: "Support User",
      email: supportEmail,
      role: "SUPPORT",
      customRoleId: supportRole?.id ?? null,
      passwordHash: hash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
    },
  });

  // Ensure notification preference exists for support user
  const supportUser = await prisma.user.findUnique({ where: { email: supportEmail } });
  if (supportUser) {
    await prisma.notificationPreference.upsert({
      where: { userId: supportUser.id },
      update: {},
      create: {
        userId: supportUser.id,
        taskAssigned: true,
        statusChanged: true,
        mentions: true,
        comments: true,
        dueDateReminders: true,
        dashboardNotes: true,
        inAppToasts: true,
        browserNotifications: true,
        browserSound: true,
      },
    });
  }

  // Update ALL users in the database
  const updateResult = await prisma.user.updateMany({
    data: {
      passwordHash: hash,
      active: true,
      mustChangePassword: false,
      invitationStatus: "ACCEPTED",
      resetOtpHash: null,
      resetOtpExpiresAt: null,
      resetOtpAttempts: 0,
    },
  });

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      mustChangePassword: true,
      invitationStatus: true,
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });

  console.log(`✅ Successfully updated ${updateResult.count} user accounts in the database.`);
  console.log("📋 Available users (password is 'password' for all):");
  allUsers.forEach((u) => {
    console.log(`   - [${u.role}] ${u.name} <${u.email}> (active: ${u.active})`);
  });

  return allUsers;
}

if (process.argv[1]?.includes("reset-passwords")) {
  resetAllPasswords()
    .catch((err) => {
      console.error("❌ Failed to reset passwords:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
