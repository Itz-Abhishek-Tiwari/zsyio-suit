import { UsersView } from "./users-view";
import { prisma } from "@zsyio/database";
import { getAllowedEmailDomains, setDynamicAllowedDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "User Directory - Zsyio Console",
  description: "Manage accounts, invitations, active statuses, and capability clearances.",
};

export default async function UsersPage() {
  const dbDomains = await prisma.allowedDomain.findMany({
    where: { isActive: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  const allowedDomains =
    dbDomains.length > 0 ? dbDomains.map((d) => d.domain) : getAllowedEmailDomains();

  setDynamicAllowedDomains(allowedDomains);

  return <UsersView serverAllowedDomains={allowedDomains} />;
}
