import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { getAppUrl } from "@zsyio/ui";

export const metadata = {
  title: "Knowledge Base & Notes - Zsyio",
  description: "Collaborative Notion-style notes, project specifications, and role/person-based shared workspaces.",
};

export default async function NotesRedirectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  redirect(getAppUrl("notes"));
}
