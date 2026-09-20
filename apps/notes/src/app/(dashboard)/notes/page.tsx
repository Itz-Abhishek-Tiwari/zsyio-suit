import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { can } from "@zsyio/auth/permissions";
import { NotesView } from "./notes-view";
import { AccessDenied } from "@/components/shared";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Knowledge Base & Notes - Zsyio Canvas",
  description: "Collaborative Notion-style notes, project specifications, and role/person-based shared workspaces.",
};

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  if (!can(role, "note:view", permissions)) {
    return (
      <AccessDenied
        role={role}
        requiredAction="note:view"
        title="Knowledge Base Restricted"
        description="Viewing internal workspace documents and documentation folders requires Note Viewer permissions."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-[75vh] flex items-center justify-center rounded-lg border border-border bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <NotesView />
    </Suspense>
  );
}
