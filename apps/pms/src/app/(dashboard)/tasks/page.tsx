import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { TasksView } from "./tasks-view";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <TasksView role={session.user.role} permissions={session.user.permissions} />;
}
