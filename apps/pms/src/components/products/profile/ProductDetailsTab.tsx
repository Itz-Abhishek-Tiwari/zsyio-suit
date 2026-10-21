"use client";

import Link from "next/link";
import { Button } from "@zsyio/ui";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import {
  Globe,
  GitBranch,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Building2,
  Terminal,
  ArrowUpRight,
} from "lucide-react";
import type { Environment } from "@zsyio/types";

export interface ProductDetailsTabProps {
  clientId: string;
  clientName: string;
  clientDomain?: string | null;
  clientLogoUrl?: string | null;
  clientStatus?: string;
  version: string | null;
  deployedUrl: string | null;
  repoUrl: string | null;
  environment: Environment;
  lastDeployed: string | null;
  totalCount: number;
  canViewClients?: boolean;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}

export function ProductDetailsTab({
  clientId,
  clientName,
  clientDomain,
  clientLogoUrl,
  clientStatus = "ACTIVE",
  version,
  deployedUrl,
  repoUrl,
  environment,
  lastDeployed,
  totalCount,
  canViewClients = false,
  copiedField,
  onCopy,
}: ProductDetailsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
          <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Globe className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Live Deployment</h3>
            <p className="text-xs text-muted-foreground">Hosting & environment</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Target Environment</span>
            <ProductEnvironmentBadge environment={environment} />
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Build Version</span>
            <span className="font-mono font-semibold text-foreground">{version || "-"}</span>
          </div>

          {deployedUrl ? (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-muted-foreground">Deployed Live URL</span>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border">
                <span className="font-mono text-xs text-foreground truncate">{deployedUrl}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onCopy(deployedUrl, "Deployed URL")}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "Deployed URL" ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs font-semibold gap-1"
                  >
                    <a href={deployedUrl.startsWith("http") ? deployedUrl : `https://${deployedUrl}`} target="_blank" rel="noreferrer">
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-1">No live URL registered.</p>
          )}

          {lastDeployed && (
            <div className="flex items-center justify-between pt-1 text-muted-foreground">
              <span>Last Deployed</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                {new Date(lastDeployed).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
          <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <GitBranch className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Source Repository</h3>
            <p className="text-xs text-muted-foreground">Git repository location</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {repoUrl ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground">Repository URL</span>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="font-mono text-xs text-foreground truncate">{repoUrl}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onCopy(repoUrl, "Repository URL")}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      {copiedField === "Repository URL" ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-xs font-semibold gap-1"
                    >
                      <a href={repoUrl} target="_blank" rel="noreferrer">
                        <span>Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  Git Clone Command
                </span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-subtle font-mono text-xs text-foreground border border-border/60">
                  <span className="truncate">git clone {repoUrl}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onCopy(`git clone ${repoUrl}`, "Clone Command")}
                    className="h-6 w-6 shrink-0"
                  >
                    {copiedField === "Clone Command" ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic py-1">No repository URL registered.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Client Account</h3>
              <p className="text-xs text-muted-foreground">Parent organization</p>
            </div>
          </div>
          <ClientStatusBadge status={clientStatus} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle/60 border border-border/60">
            <div className="flex items-center gap-2.5">
              {clientLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={clientLogoUrl}
                  alt={clientName}
                  className="w-9 h-9 rounded-lg object-contain border border-border bg-surface-elevated p-0.5"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center font-semibold text-xs">
                  {clientName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">{clientName}</span>
                {clientDomain && (
                  <span className="text-xs text-muted-foreground">
                    {clientDomain.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
            </div>

            {canViewClients && (
              <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1">
                <Link href={`/clients/${clientId}`}>
                  <span>View Client</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span>Client Code:</span>
              <span className="font-mono font-semibold text-foreground">
                {clientId.slice(0, 10)}...
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Product Tickets:</span>
              <span className="font-semibold text-foreground">{totalCount} registered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
