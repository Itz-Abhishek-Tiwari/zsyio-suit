import React from "react";
import { Badge } from "./badge";
import {
  ShieldCheck,
  UserCog,
  Code2,
  Headphones,
  Shield,
  Sparkles,
  Zap,
  Crown,
  Eye,
  Settings,
  Flame,
  Star,
  CheckCircle2,
  Activity,
  TrendingUp,
  Briefcase,
  LucideIcon,
} from "lucide-react";

export const ROLE_COLOR_STYLES: Record<
  string,
  { badgeClass: string; dot: string }
> = {
  purple: {
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    dot: "bg-purple-500",
  },
  blue: {
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    dot: "bg-blue-500",
  },
  emerald: {
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  amber: {
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  pink: {
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200/90 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30",
    dot: "bg-pink-500",
  },
  rose: {
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  indigo: {
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  teal: {
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/90 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30",
    dot: "bg-teal-500",
  },
  cyan: {
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200/90 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  orange: {
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200/90 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
  violet: {
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200/90 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30",
    dot: "bg-violet-500",
  },
  gray: {
    badgeClass: "bg-muted text-muted-foreground border-border dark:bg-muted/50 dark:text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export const ROLE_ICONS_MAP: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "user-cog": UserCog,
  code: Code2,
  headphones: Headphones,
  shield: Shield,
  sparkles: Sparkles,
  zap: Zap,
  crown: Crown,
  eye: Eye,
  settings: Settings,
  flame: Flame,
  star: Star,
  check: CheckCircle2,
  activity: Activity,
  "trending-up": TrendingUp,
  briefcase: Briefcase,
};

export const USER_ROLE_CONFIG: Record<
  string,
  {
    label: string;
    desc: string;
    badgeClass: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    desc: "Primary workspace owner & root administrator",
    badgeClass: "bg-amber-500/15 text-amber-800 border-amber-400/80 dark:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/50 font-bold",
    dot: "bg-amber-500",
    icon: Crown,
  },
  ADMIN: {
    label: "Admin",
    desc: "Full system administration & user management",
    badgeClass: ROLE_COLOR_STYLES.purple.badgeClass,
    dot: ROLE_COLOR_STYLES.purple.dot,
    icon: ShieldCheck,
  },
  MANAGER: {
    label: "Manager",
    desc: "Manage clients, products, teams & assign tasks",
    badgeClass: ROLE_COLOR_STYLES.amber.badgeClass,
    dot: ROLE_COLOR_STYLES.amber.dot,
    icon: UserCog,
  },
  DEVELOPER: {
    label: "Developer",
    desc: "Work on assigned tasks & view client projects",
    badgeClass: ROLE_COLOR_STYLES.blue.badgeClass,
    dot: ROLE_COLOR_STYLES.blue.dot,
    icon: Code2,
  },
  SUPPORT: {
    label: "Support",
    desc: "Handle support request tickets & client notes",
    badgeClass: ROLE_COLOR_STYLES.emerald.badgeClass,
    dot: ROLE_COLOR_STYLES.emerald.dot,
    icon: Headphones,
  },
};

export interface UserRoleBadgeProps {
  role?: string;
  customRole?: {
    name?: string;
    label?: string;
    color?: string | null;
    icon?: string | null;
  } | null;
  showIcon?: boolean;
  className?: string;
}

export function UserRoleBadge({
  role,
  customRole,
  showIcon = false,
  className,
}: UserRoleBadgeProps) {
  if (!role && !customRole) return null;

  if (customRole) {
    const colorKey = customRole.color || "purple";
    const colorStyle = ROLE_COLOR_STYLES[colorKey] ?? ROLE_COLOR_STYLES.purple;
    const IconComponent = ROLE_ICONS_MAP[customRole.icon || "shield"] ?? Shield;

    return (
      <Badge
        variant="outline"
        className={`text-[11px] font-semibold border ${colorStyle.badgeClass} ${className ?? ""}`}
      >
        {showIcon ? (
          <IconComponent className="w-3 h-3 shrink-0" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${colorStyle.dot} shrink-0`} />
        )}
        <span>{customRole.label || customRole.name}</span>
      </Badge>
    );
  }

  const roleStr = String(role);
  const cfg = USER_ROLE_CONFIG[roleStr] ?? {
    label: roleStr,
    desc: "",
    badgeClass: ROLE_COLOR_STYLES.gray.badgeClass,
    dot: ROLE_COLOR_STYLES.gray.dot,
    icon: UserCog,
  };
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold border ${cfg.badgeClass} ${className ?? ""}`}
    >
      {showIcon ? (
        <Icon className="w-3 h-3 shrink-0" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      )}
      <span>{cfg.label}</span>
    </Badge>
  );
}
