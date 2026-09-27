import { auth } from "@zsyio/auth";
import { SalesDashboard } from "@/components/dashboard/SalesDashboard";

export const metadata = {
  title: "Sales Dashboard - Zsyio Pulse",
  description: "Sales pipeline KPIs, conversion funnels, and revenue metrics.",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Super Admin";
  const userRole = session?.user?.role;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <SalesDashboard userName={userName} userRole={userRole} />
    </div>
  );
}
