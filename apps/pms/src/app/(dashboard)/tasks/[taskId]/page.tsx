import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  const canEdit = can(role, "task:edit:any", permissions) || can(role, "task:edit:own", permissions);

  return <TaskDetailPanel taskId={taskId} canEdit={canEdit} />;
}
