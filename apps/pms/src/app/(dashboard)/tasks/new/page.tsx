import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@zsyio/ui";
import { PageHeader } from "@/components/shared";
import { ArrowLeft } from "lucide-react";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Create New Task"
        description="Define task details, set priorities, and assign team members."
        borderBottom
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tasks" className="hover:text-foreground hover:underline transition-colors">
              Tasks
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">New Task</span>
          </div>
        }
        actions={
          <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg">
            <Link href="/tasks" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel
            </Link>
          </Button>
        }
      />

      <TaskForm role={session.user.role} permissions={session.user.permissions} />
    </div>
  );
}
