import { SalesLeadTable } from "@/components/leads/SalesLeadTable";
import { PageHeader } from "@/components/shared";
import { Button } from "@zsyio/ui";
import { Plus, Kanban } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Sales Leads - Zsyio Pulse",
  description: "View and manage all sales leads, opportunities, and clients.",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Leads"
        description="Track all prospective clients, deal statuses, contact info, and follow-up activities."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/kanban">
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <Kanban className="w-4 h-4" />
                Kanban View
              </Button>
            </Link>
            <Link href="/leads/new">
              <Button size="sm" className="gap-1.5 h-9">
                <Plus className="w-4 h-4" />
                New Lead
              </Button>
            </Link>
          </div>
        }
      />

      <SalesLeadTable />
    </div>
  );
}
