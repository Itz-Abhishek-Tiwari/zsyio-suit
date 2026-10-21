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
    badgeClass: "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/90",
    dot: "bg-notion-purple-fg",
  },
  blue: {
    badgeClass: "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/90",
    dot: "bg-notion-blue-fg",
  },
  emerald: {
    badgeClass: "bg-success-light text-success border-success/90",
    dot: "bg-success",
  },
  amber: {
    badgeClass: "bg-warning-light text-warning border-warning/90",
    dot: "bg-warning",
  },
  pink: {
    badgeClass: "bg-notion-pink text-notion-pink-fg border-notion-pink-fg/90",
    dot: "bg-notion-pink-fg",
  },
  rose: {
    badgeClass: "bg-destructive-light text-destructive border-destructive/90",
    dot: "bg-destructive",
  },
  indigo: {
    badgeClass: "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/90",
    dot: "bg-notion-purple-fg",
  },
  teal: {
    badgeClass: "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/90",
    dot: "bg-notion-blue-fg",
  },
  cyan: {
    badgeClass: "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/90",
    dot: "bg-notion-blue-fg",
  },
  orange: {
    badgeClass: "bg-notion-orange text-notion-orange-fg border-notion-orange-fg/90",
    dot: "bg-notion-orange-fg",
  },
  violet: {
    badgeClass: "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/90",
    dot: "bg-notion-purple-fg",
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
    badgeClass: "bg-warning/15 text-warning border-warning/80 font-semibold",
    dot: "bg-warning",
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
        className={`text-xs font-semibold border ${colorStyle.badgeClass} ${className ?? ""}`}
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
      className={`text-xs font-semibold border ${cfg.badgeClass} ${className ?? ""}`}
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
