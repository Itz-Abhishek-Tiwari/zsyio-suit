"use client";

import React from "react";
import {
  FileText,
  Calendar,
  FileCode,
  Cpu,
  Sparkles,
  AlertTriangle,
  Users,
  Folder,
  BookOpen,
  Code,
  Shield,
  Layers,
  Flame,
  CheckCircle,
  Lightbulb,
  Target,
  Database,
  Workflow,
  Compass,
  Terminal,
  Briefcase,
  Key,
  Boxes,
  FileCheck,
  Rocket,
  Zap,
  Settings,
  HelpCircle,
  Activity,
  Bookmark,
  Server,
  Lock,
  Globe,
  Bug,
  Share2,
  Sliders,
  Archive,
  BarChart2,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@zsyio/ui";

interface NoteIconProps {
  icon?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const SIZE_MAP = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10 sm:w-12 sm:h-12",
};

export const NOTE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-text": FileText,
  calendar: Calendar,
  "file-code": FileCode,
  cpu: Cpu,
  sparkles: Sparkles,
  "alert-triangle": AlertTriangle,
  users: Users,
  folder: Folder,
  "book-open": BookOpen,
  code: Code,
  shield: Shield,
  layers: Layers,
  flame: Flame,
  check: CheckCircle,
  "check-circle": CheckCircle,
  lightbulb: Lightbulb,
  target: Target,
  database: Database,
  workflow: Workflow,
  compass: Compass,
  terminal: Terminal,
  briefcase: Briefcase,
  key: Key,
  boxes: Boxes,
  "file-check": FileCheck,
  rocket: Rocket,
  zap: Zap,
  settings: Settings,
  "help-circle": HelpCircle,
  activity: Activity,
  bookmark: Bookmark,
  server: Server,
  lock: Lock,
  globe: Globe,
  bug: Bug,
  share: Share2,
  sliders: Sliders,
  archive: Archive,
  "bar-chart": BarChart2,
  "trending-up": TrendingUp,
  "message-square": MessageSquare,
};

export function NoteIcon({ icon, className, size = "md" }: NoteIconProps) {
  if (!icon) {
    return <FileText className={cn(SIZE_MAP[size], "text-muted-foreground", className)} />;
  }

  const key = icon.toLowerCase().trim();
  const IconComponent = NOTE_ICON_MAP[key];

  if (IconComponent) {
    return <IconComponent className={cn(SIZE_MAP[size], "text-primary shrink-0", className)} />;
  }

  // Fallback to FileText icon if unknown string
  return <FileText className={cn(SIZE_MAP[size], "text-primary shrink-0", className)} />;
}
