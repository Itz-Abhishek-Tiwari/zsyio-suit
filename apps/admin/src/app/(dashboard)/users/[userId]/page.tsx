import { notFound } from "next/navigation";
import { userRepository } from "@/server/repositories/user.repository";
import { UserDetailView } from "./user-detail-view";

export const metadata = {
  title: "User Profile & Security - Zsyio Console",
  description: "View and edit user account, role clearances, and team associations.",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await userRepository.findById(userId);

  if (!user) {
    notFound();
  }

  const serializableUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    invitationExpiresAt: user.invitationExpiresAt ? user.invitationExpiresAt.toISOString() : null,
    invitedAt: user.invitedAt ? user.invitedAt.toISOString() : null,
    customRole: user.customRole
      ? {
          ...user.customRole,
          createdAt: user.customRole.createdAt.toISOString(),
          updatedAt: user.customRole.updatedAt.toISOString(),
        }
      : null,
  };

  return <UserDetailView user={serializableUser} />;
}
