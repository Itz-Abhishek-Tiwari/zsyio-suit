"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@zsyio/ui";
import { ClientDeepReport } from "@/components/reports/ClientDeepReport";
import { ExternalLink, Globe, Mail } from "lucide-react";
import { Button } from "@zsyio/ui";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import Link from "next/link";
import { useGetClientReportQuery, type ClientReportResponse } from "@/store/api/reportsApi";

interface ClientReportModalProps {
  clientId: string | null;
  clientName?: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: ClientReportResponse;
}

export function ClientReportModal({
  clientId,
  clientName,
  isOpen,
  onClose,
  initialData,
}: ClientReportModalProps) {
  const { data: fetchedData } = useGetClientReportQuery(clientId ?? "", {
    skip: !clientId || Boolean(initialData),
  });

  if (!clientId) return null;

  const data = initialData || fetchedData;
  const client = data?.client;

  const name = client?.name || clientName || "Client Account";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[96vw] sm:w-[92vw] max-h-[90vh] overflow-y-auto rounded-lg p-0 bg-card border-border/80 shadow-md flex flex-col">
        <div className="sticky top-0 z-30 bg-card border-b border-border/80 px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-semibold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-lg font-semibold text-foreground tracking-tight">
                  {name}
                </DialogTitle>
                {client?.status && (
                  <ClientStatusBadge
                    status={client.status}
                    className="shrink-0 text-xs font-semibold"
                  />
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {client?.domain && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.domain}
                  </span>
                )}
                {client?.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pr-8 sm:pr-0">
            <Button
              asChild
              variant="default"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 rounded-lg shadow-xs"
            >
              <Link href={`/clients/${clientId}`}>
                <ExternalLink className="w-3.5 h-3.5" /> View Client Account
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-2">
          <ClientDeepReport
            clientId={clientId}
            initialData={data}
            hideHeader={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
