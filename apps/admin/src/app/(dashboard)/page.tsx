"use client";

import { useState } from "react";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Globe,
  Users2,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Building2,
  Lock,
  Clock,
} from "lucide-react";
import {
  DashboardHero,
  KpiCard,
  Button,
  UserAvatar,
  UserRoleBadge,
  UserStatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@zsyio/ui";
import { useSession } from "next-auth/react";
import { useGetAdminStatsQuery } from "@/store/api/adminApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { formatDate } from "@zsyio/ui";

import { DomainManagementModal } from "@/components/domains/DomainManagementModal";

export default function AdminDashboardPage() {
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const { data: session } = useSession();
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery({ limit: 6 });

  const userName =
    session?.user?.name ||
    (session?.user?.email ? session.user.email.split("@")[0].replace(/[._-]/g, " ") : "Super Admin");
  const userRole = session?.user?.role ? session.user.role.replace(/_/g, " ") : "Security Administrator";

  const recentUsers = users.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Executive Command Deck */}
      <DashboardHero
        badge={{
          label: "Admin & Identity Governance",
          icon: ShieldCheck,
          variant: "violet",
        }}
        systemStatus={{
          label: "ZERO-TRUST IAM ACTIVE",
        }}
        userName={userName}
        userRole={userRole}
        accentTone="violet"
        description="Manage corporate directory, enforce permission policies, organize teams, and audit access clearance."
        metrics={[
          {
            label: "Accounts",
            value: statsLoading ? "..." : String(stats?.totalUsers ?? 0),
            icon: Users,
            subtext: `${stats?.activeUsers ?? 0} active accounts`,
          },
          {
            label: "Teams",
            value: statsLoading ? "..." : String(stats?.totalTeams ?? 0),
            icon: Users2,
            subtext: "Cross-functional units",
          },
          {
            label: "Roles",
            value: statsLoading ? "..." : String(stats?.totalRoles ?? 0),
            icon: KeyRound,
            subtext: "RBAC security matrix",
          },
          {
            label: "Clearance",
            value: "100%",
            icon: ShieldCheck,
            trend: "up",
            subtext: "Zero-trust policy enforced",
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md text-xs font-semibold gap-1.5 border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs">
              <Link href="/teams">
                <Users2 className="w-3.5 h-3.5 text-primary" />
                <span>Teams</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-md text-xs font-semibold gap-1.5 border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs">
              <Link href="/roles">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Roles Matrix</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-md text-xs font-bold gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs">
              <Link href="/users">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Manage Users</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          label="Total Accounts"
          value={statsLoading ? "..." : String(stats?.totalUsers ?? 0)}
          icon={<Users className="w-5 h-5" />}
          variant="primary"
        />
        <KpiCard
          label="Active Users"
          value={statsLoading ? "..." : String(stats?.activeUsers ?? 0)}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="primary"
        />
        <KpiCard
          label="Pending Invites"
          value={statsLoading ? "..." : String(stats?.pendingInvitations ?? 0)}
          icon={<Clock className="w-5 h-5" />}
          variant="amber"
        />
        <KpiCard
          label="Deactivated"
          value={statsLoading ? "..." : String(stats?.deactivatedUsers ?? 0)}
          icon={<ShieldAlert className="w-5 h-5" />}
          variant="rose"
        />
        <KpiCard
          label="Total Teams"
          value={statsLoading ? "..." : String(stats?.totalTeams ?? 0)}
          icon={<Users2 className="w-5 h-5" />}
          variant="sky"
        />
        <KpiCard
          label="Custom Roles"
          value={statsLoading ? "..." : String(stats?.totalRoles ?? 0)}
          icon={<KeyRound className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* Security Policy & Domain Restriction Banner */}
      <div className="rounded-lg border border-border/80 bg-card p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary-light text-primary flex items-center justify-center border border-primary/20">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-base text-foreground font-display">
                Corporate Domain Restriction Policy
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Account invitations and logins are restricted to whitelisted corporate email domains. Zero-trust token caching ensures instantaneous permission propagation and revocation.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold text-foreground-secondary">Authorized Domains:</span>
              {(stats?.allowedDomains ?? ["zsyio.com", "mediloon.de"]).map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-primary-light text-primary border border-primary/20"
                >
                  <Building2 className="w-3 h-3" />
                  @{domain}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDomainModalOpen(true)}
              className="rounded-md text-xs font-semibold w-full sm:w-auto gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Configure Domains</span>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-md text-xs font-semibold w-full sm:w-auto">
              <Link href="/roles">Review Role Matrix</Link>
            </Button>
            <Button asChild size="sm" className="rounded-md text-xs font-semibold w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground">
              <Link href="/users">Open Directory</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Quick Actions & Recent Accounts Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Navigation Cards */}
        <div className="flex flex-col gap-3.5">
          <h3 className="font-bold text-sm text-foreground">Management Suites</h3>

          <Link
            href="/users"
            className="rounded-lg border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-md bg-primary-light text-primary flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  User Directory
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invite users, update roles, toggle active status, and trigger password resets.
              </p>
            </div>
          </Link>

          <Link
            href="/roles"
            className="rounded-lg border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Roles &amp; Permissions Matrix
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Granular permission matrix across dashboards, tasks, reports, and timesheets.
              </p>
            </div>
          </Link>

          <Link
            href="/teams"
            className="rounded-lg border border-border/80 bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Users2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Teams &amp; Departments
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organize company departments, assign team leads, and manage member rosters.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent User Directory Table */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Recent User Roster</h3>
            <Link
              href="/users"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All Users ({stats?.totalUsers ?? 0})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden">
            {usersLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading roster...</div>
            ) : recentUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No users registered yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider">User</TableHead>
                    <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider">Role</TableHead>
                    <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} className="w-7 h-7 text-xs ring-1 ring-border" />
                          <div className="flex flex-col min-w-0">
                            <Link href={`/users/${u.id}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                              {u.name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground font-mono truncate">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <UserRoleBadge customRole={u.customRole} role={u.role} />
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <UserStatusBadge active={u.active} invitationStatus={u.invitationStatus} />
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {formatDate(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <DomainManagementModal
        open={isDomainModalOpen}
        onOpenChange={setIsDomainModalOpen}
      />
    </div>
  );
}
