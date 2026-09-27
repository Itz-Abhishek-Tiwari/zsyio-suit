"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { SalesLeadForm } from "@/components/leads/SalesLeadForm";
import { PageHeader } from "@/components/shared";
import { Button, Skeleton } from "@zsyio/ui";
import type { SalesStage } from "@zsyio/types";

function NewLeadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageParam = searchParams.get("stage") as SalesStage | null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <PageHeader
        title="Create New Sales Lead"
        titleIcon={<UserPlus className="w-5 h-5" />}
        description="Add a new prospective client deal and contact to your sales pipeline."
        borderBottom
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/leads"
              className="hover:text-foreground hover:underline transition-colors"
            >
              Leads
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">New Lead</span>
          </div>
        }
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold rounded-lg"
          >
            <Link href="/leads" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel
            </Link>
          </Button>
        }
      />

      <SalesLeadForm
        layout="page"
        defaultStage={stageParam ?? "NEW_LEAD"}
        onSuccess={(lead) => router.push(`/leads/${lead.id}`)}
        onCancel={() => router.push("/leads")}
      />
    </div>
  );
}

export default function NewLeadPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 py-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 w-full rounded-lg lg:col-span-2" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <NewLeadContent />
    </Suspense>
  );
}
