import { auth } from "@zsyio/auth";
import { notFound } from "next/navigation";
import { NotificationsSettingsView } from "./notifications-settings-view";

export const metadata = {
  title: "Notification Preferences - Zsyio Flow",
  description: "Configure your alerts, task notifications, @mentions, and workflow triggers.",
};

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user) notFound();

  return <NotificationsSettingsView />;
}
