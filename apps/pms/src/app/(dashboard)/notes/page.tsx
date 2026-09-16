import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";

export const metadata = {
  title: "Knowledge Base & Notes - Zsyio",
  description: "Collaborative Notion-style notes, project specifications, and role/person-based shared workspaces.",
};

export default async function NotesRedirectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const notesUrl = (process.env.NEXT_PUBLIC_NOTES_URL || "http://localhost:3001").replace(/\/+$/, "");
  redirect(notesUrl);
}
