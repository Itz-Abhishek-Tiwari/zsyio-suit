"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Clock,
  Shield,
  KeyRound,
  Users2,
  CheckCircle2,
  Sparkles,
  Camera,
  Trash2,
  Save,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  UserAvatar,
  ImageUploader,
  Modal,
  useTheme,
  getErrorMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from "@zsyio/ui";
import { cn } from "@/lib/utils";
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from "@/store/api/usersApi";
import type { UpdateProfileInput } from "@zsyio/types";

const TIMEZONES = [
  { value: "Asia/Kolkata",        label: "India Standard Time (IST)",         offset: "+5:30", city: "New Delhi / Mumbai" },
  { value: "Europe/Berlin",       label: "Central European Time (CET/CEST)",  offset: "+1:00", city: "Berlin / Frankfurt" },
  { value: "Europe/London",       label: "Greenwich Mean Time (GMT/BST)",     offset: "+0:00", city: "London" },
  { value: "America/New_York",    label: "Eastern Time (EST/EDT)",            offset: "-5:00", city: "New York / Boston" },
  { value: "America/Chicago",     label: "Central Time (CST/CDT)",            offset: "-6:00", city: "Chicago / Dallas" },
  { value: "America/Denver",      label: "Mountain Time (MST/MDT)",           offset: "-7:00", city: "Denver / Phoenix" },
  { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)",            offset: "-8:00", city: "San Francisco / Seattle" },
  { value: "Asia/Dubai",          label: "Gulf Standard Time (GST)",          offset: "+4:00", city: "Dubai" },
  { value: "Asia/Singapore",      label: "Singapore Time (SGT)",              offset: "+8:00", city: "Singapore" },
  { value: "Asia/Tokyo",          label: "Japan Standard Time (JST)",         offset: "+9:00", city: "Tokyo" },
  { value: "Australia/Sydney",    label: "Australian Eastern Time (AEST)",    offset: "+10:00", city: "Sydney / Melbourne" },
  { value: "UTC",                 label: "Coordinated Universal Time (UTC)",  offset: "+0:00", city: "Universal Time" },
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design & UI/UX",
  "Quality Assurance",
  "DevOps & Infrastructure",
  "Sales & Business Development",
  "Human Resources",
  "Operations & Support",
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
];

type ProfileSection = "general" | "preferences" | "security" | "teams";

interface NavItem {
  id: ProfileSection;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface UserProfileViewProps {
  onSaved?: () => void;
  isModal?: boolean;
}

// ── Row field wrapper (label col + content col) ────────────────────────
function SettingsRow({
  label,
  hint,
  children,
  last = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-2 sm:gap-6 py-4",
        !last && "border-b border-border/40"
      )}
    >
      <div className="sm:w-44 md:w-48 shrink-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {hint}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Section header inside content area ────────────────────────────────
function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-2 pb-3.5 border-b border-border/50">
      <h2 className="text-sm font-semibold text-foreground font-display">{children}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function UserProfileView({ onSaved, isModal = false }: UserProfileViewProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();

  const { data: profileData, isLoading: isLoadingProfile, refetch } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMyProfileMutation();

  const [activeSection, setActiveSection] = useState<ProfileSection>("general");
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Form state
  const [name, setName]                     = useState("");
  const [jobTitle, setJobTitle]             = useState("");
  const [department, setDepartment]         = useState("");
  const [bio, setBio]                       = useState("");
  const [phone, setPhone]                   = useState("");
  const [avatarUrl, setAvatarUrl]           = useState<string | null>(null);
  const [timeZone, setTimeZone]             = useState("Asia/Kolkata");
  const [selectedTheme, setSelectedTheme]   = useState("system");

  // Baseline state to accurately track unsaved changes
  const [initialData, setInitialData] = useState<{
    name: string;
    jobTitle: string;
    department: string;
    bio: string;
    phone: string;
    avatarUrl: string | null;
    timeZone: string;
    theme: string;
  } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword]       = useState("");
  const [newPassword, setNewPassword]               = useState("");
  const [confirmPassword, setConfirmPassword]       = useState("");
  const [showCurrentPass, setShowCurrentPass]       = useState(false);
  const [showNewPass, setShowNewPass]               = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      const initial = {
        name: u.name || "",
        jobTitle: u.jobTitle || "",
        department: u.department || "",
        bio: u.bio || "",
        phone: u.phone || "",
        avatarUrl: u.avatarUrl || null,
        timeZone: u.timeZone || "Asia/Kolkata",
        theme: u.theme || "system",
      };
      setInitialData(initial);
      setName(initial.name);
      setJobTitle(initial.jobTitle);
      setDepartment(initial.department);
      setBio(initial.bio);
      setPhone(initial.phone);
      setAvatarUrl(initial.avatarUrl);
      setTimeZone(initial.timeZone);
      setSelectedTheme(initial.theme);
    }
  }, [profileData]);

  const user = profileData?.user;

  // Live time for timezone picker
  const [liveTime, setLiveTime] = useState<{ time: string; date: string }>({ time: "", date: "" });
  const activeTimezone = useMemo(() => {
    return TIMEZONES.find((t) => t.value === timeZone) || {
      value: timeZone,
      label: timeZone,
      offset: "+0:00",
      city: timeZone,
    };
  }, [timeZone]);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          timeZone: timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        const dateStr = now.toLocaleDateString("en-US", {
          timeZone: timeZone,
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        setLiveTime({ time: timeStr, date: dateStr });
      } catch {
        setLiveTime({ time: "--:--:--", date: "Invalid timezone" });
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  const hasFormChanges = useMemo(() => {
    if (!initialData) return false;
    return (
      name !== initialData.name ||
      jobTitle !== initialData.jobTitle ||
      department !== initialData.department ||
      bio !== initialData.bio ||
      phone !== initialData.phone ||
      avatarUrl !== initialData.avatarUrl ||
      timeZone !== initialData.timeZone ||
      selectedTheme !== initialData.theme
    );
  }, [initialData, name, jobTitle, department, bio, phone, avatarUrl, timeZone, selectedTheme]);

  const handleResetForm = () => {
    if (!initialData) return;
    setName(initialData.name);
    setJobTitle(initialData.jobTitle);
    setDepartment(initialData.department);
    setBio(initialData.bio);
    setPhone(initialData.phone);
    setAvatarUrl(initialData.avatarUrl);
    setTimeZone(initialData.timeZone);
    setSelectedTheme(initialData.theme);
    toast.info("Changes discarded");
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error("Full name is required");
      return;
    }
    try {
      const payload: UpdateProfileInput = {
        name: name.trim(),
        jobTitle: jobTitle.trim() || null,
        department: department.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        avatarUrl: avatarUrl || null,
        timeZone,
        theme: selectedTheme,
      };
      await updateProfile(payload).unwrap();
      if (selectedTheme !== theme) setTheme(selectedTheme);
      await updateSession({ name: payload.name, theme: selectedTheme });
      toast.success("Profile saved successfully");
      refetch();
      onSaved?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save profile"));
    }
  };

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8)  s += 25;
    if (newPassword.length >= 12) s += 15;
    if (/[A-Z]/.test(newPassword)) s += 20;
    if (/[0-9]/.test(newPassword)) s += 20;
    if (/[^A-Za-z0-9]/.test(newPassword)) s += 20;
    return Math.min(s, 100);
  }, [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast.error("Current password required"); return; }
    if (newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const navItems: NavItem[] = [
    { id: "general",     label: "General",     icon: <User className="w-4 h-4" /> },
    { id: "preferences", label: "Preferences", icon: <Sparkles className="w-4 h-4" /> },
    { id: "security",    label: "Security",    icon: <Lock className="w-4 h-4" /> },
    { id: "teams",       label: "Teams",       icon: <Users2 className="w-4 h-4" />, count: user?.teamMemberships?.length ?? 0 },
  ];

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col h-full min-h-[480px]">
        <div className="flex flex-1 min-h-0 animate-pulse">
          <div className="w-52 shrink-0 border-r border-border/50 bg-surface-subtle/30 p-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-surface-subtle mx-auto" />
            <div className="h-3 w-28 bg-surface-subtle rounded mx-auto" />
            <div className="h-2.5 w-36 bg-surface-subtle/70 rounded mx-auto" />
            <div className="pt-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-surface-subtle rounded-md" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="h-5 w-40 bg-surface-subtle rounded-md" />
            <div className="h-px bg-border/50" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-6 py-3 border-b border-border/50">
                <div className="w-44 shrink-0 space-y-1.5">
                  <div className="h-3 w-24 bg-surface-subtle rounded" />
                  <div className="h-2 w-32 bg-surface-subtle/60 rounded" />
                </div>
                <div className="flex-1 h-9 bg-surface-subtle rounded-md max-w-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0 overflow-hidden bg-background", !isModal && "max-w-5xl mx-auto w-full")}>

      {/* ── MAIN TWO-COLUMN BODY ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR NAVIGATION ── */}
        <aside className="w-48 sm:w-52 shrink-0 border-r border-border/50 bg-surface-subtle/25 flex flex-col justify-between pt-5 pb-3 px-3 overflow-y-auto">
          <div>
            {/* User identity block */}
            <div className="mb-4 px-1 text-center">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="relative group mb-2.5 block mx-auto w-fit cursor-pointer"
                title="Change avatar"
              >
                <UserAvatar
                  user={{ name: name || user?.name, email: user?.email, avatarUrl: avatarUrl || undefined }}
                  size="lg"
                  className="w-14 h-14 text-base border border-border ring-2 ring-background shadow-sm"
                />
                <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </span>
              </button>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {name || user?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                  {user?.email}
                </p>
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20  tracking-wide">
                  {user?.customRole?.label || user?.role || "MEMBER"}
                </span>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex flex-col gap-1 pt-2 border-t border-border/50">
              {navItems.map((item) => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left w-full cursor-pointer",
                      active
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-mono font-semibold border",
                          active
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-subtle text-muted-foreground border-border/60"
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom link: open full settings if inside modal */}
          {isModal && (
            <div className="pt-3 border-t border-border/50 mt-2">
              <button
                type="button"
                onClick={() => {
                  onSaved?.();
                  router.push("/settings/profile");
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-md transition-colors cursor-pointer"
              >
                <span>Full settings page</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </aside>

        {/* ── RIGHT CONTENT AREA (INDIVIDUAL SCROLL) ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto px-6 sm:px-8 py-5 pb-12 [scrollbar-width:thin]">

          {/* ── SECTION: GENERAL ── */}
          {activeSection === "general" && (
            <div>
              <SectionHeading sub="Public information displayed across your workspace.">
                General Profile
              </SectionHeading>

              {/* Avatar row */}
              <SettingsRow label="Profile Photo" hint="Appears on task assignments and comments.">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <UserAvatar
                      user={{ name: name || user?.name, email: user?.email, avatarUrl: avatarUrl || undefined }}
                      size="lg"
                      className="w-14 h-14 text-base border border-border shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarModalOpen(true)}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAvatarModalOpen(true)}
                        className="h-7 text-xs rounded-md gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Change photo
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAvatarUrl(null)}
                          className="h-7 text-xs rounded-md gap-1 text-destructive hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or GIF. Max 500×500px.</p>
                  </div>
                </div>
              </SettingsRow>

              <SettingsRow label="Full Name" hint="Required. Shown on tasks and mentions.">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="h-9 text-xs rounded-md max-w-sm"
                />
              </SettingsRow>

              <SettingsRow label="Corporate Email" hint="Bound to your organisation SSO domain.">
                <div className="flex items-center gap-2.5 max-w-sm">
                  <div className="relative flex-1">
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="h-9 text-xs rounded-md font-mono text-muted-foreground bg-surface-subtle cursor-not-allowed pl-8"
                    />
                    <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-success/10 text-success border border-success/20 shrink-0">
                    <CheckCheck className="w-3 h-3" />
                    SSO verified
                  </span>
                </div>
              </SettingsRow>

              <SettingsRow label="Professional Title" hint="Your role or specialisation.">
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Lead Frontend Architect"
                  className="h-9 text-xs rounded-md max-w-sm"
                />
              </SettingsRow>

              <SettingsRow label="Department" hint="Select or type your division.">
                <div className="max-w-sm">
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    list="depts"
                    className="h-9 text-xs rounded-md"
                  />
                  <datalist id="depts">
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </SettingsRow>

              <SettingsRow label="Phone / Extension" hint="Direct contact for urgent pings.">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 30 1234 5678"
                  type="tel"
                  className="h-9 text-xs rounded-md max-w-sm"
                />
              </SettingsRow>

              <SettingsRow label="Security Role" hint="Managed by workspace admins.">
                <div className="flex items-center gap-3">
                  <div className="h-9 px-3 rounded-md border border-border/80 bg-surface-subtle flex items-center gap-2 text-xs max-w-sm w-full">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">
                      {user?.customRole?.label || user?.role || "Team Member"}
                    </span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {user?.customRole?.isSystem ? "system" : "custom"}
                    </span>
                  </div>
                </div>
              </SettingsRow>

              <SettingsRow label="About Me" hint={`${bio.length} / 500 characters`} last>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief intro - your focus area, working hours, how you collaborate best..."
                  className="text-xs rounded-md bg-background resize-none leading-relaxed max-w-lg"
                />
              </SettingsRow>
            </div>
          )}

          {/* ── SECTION: PREFERENCES ── */}
          {activeSection === "preferences" && (
            <div>
              <SectionHeading sub="Timezone and visual theme settings for your workspace.">
                Preferences
              </SectionHeading>

              <SettingsRow label="Active Timezone" hint={`Major cities: ${activeTimezone.city}`}>
                <div className="flex flex-col gap-3 max-w-md">
                  <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value} className="text-xs">
                          <div className="flex items-center justify-between w-full gap-6">
                            <span className="font-medium">{tz.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">UTC {tz.offset}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Live clock card */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-md border border-border/70 bg-surface-subtle/70">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono text-muted-foreground   flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-primary" />
                        Live time - {activeTimezone.city || timeZone}
                      </span>
                      <span className="font-mono tabular-nums text-xl font-semibold text-foreground tracking-tight mt-0.5">
                        {liveTime.time || "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">{liveTime.date}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                      UTC {activeTimezone.offset}
                    </span>
                  </div>
                </div>
              </SettingsRow>

              <SettingsRow label="Color Theme" hint="Applies to all Zsyio apps on this device." last>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { id: "light",  label: "Light",  icon: <Sun className="w-4 h-4 text-warning" />,     desc: "Slate paper white" },
                    { id: "dark",   label: "Dark",   icon: <Moon className="w-4 h-4 text-primary" />,      desc: "Sapphire charcoal" },
                    { id: "system", label: "System", icon: <Laptop className="w-4 h-4 text-muted-foreground" />, desc: "Matches your OS" },
                  ].map((t) => {
                    const active = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(t.id);
                          setTheme(t.id);
                        }}
                        className={cn(
                          "relative flex flex-col items-start gap-2 p-3.5 rounded-lg border w-36 transition-all cursor-pointer text-left",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border/70 bg-surface-subtle/50 hover:border-border-strong hover:bg-surface-subtle"
                        )}
                      >
                        {active && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                        {t.icon}
                        <div>
                          <p className="text-xs font-semibold text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SettingsRow>
            </div>
          )}

          {/* ── SECTION: SECURITY ── */}
          {activeSection === "security" && (
            <div>
              <SectionHeading sub="Manage your authentication credentials and account security.">
                Security &amp; Password
              </SectionHeading>

              <SettingsRow label="Current Password" hint="Required to change your password.">
                <div className="relative max-w-sm">
                  <Input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-9 text-xs rounded-md pr-9 bg-background"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </SettingsRow>

              <SettingsRow label="New Password" hint="Min 8 chars, one , one number.">
                <div className="flex flex-col gap-2.5 max-w-sm">
                  <div className="relative">
                    <Input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-9 text-xs rounded-md pr-9 bg-background"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div className="flex flex-col gap-1.5">
                      <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden border border-border/50">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-150",
                            passwordStrength < 50 ? "bg-destructive" : passwordStrength < 80 ? "bg-warning" : "bg-success"
                          )}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {[
                          { label: "8+ chars", ok: newPassword.length >= 8 },
                          { label: "Uppercase", ok: /[A-Z]/.test(newPassword) },
                          { label: "Number",    ok: /[0-9]/.test(newPassword) },
                          { label: "Match",     ok: !!newPassword && newPassword === confirmPassword },
                        ].map(({ label, ok }) => (
                          <span
                            key={label}
                            className={cn(
                              "flex items-center gap-1 text-xs font-mono transition-colors",
                              ok ? "text-success font-semibold" : "text-muted-foreground"
                            )}
                          >
                            <CheckCircle2 className="w-3 h-3" /> {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SettingsRow>

              <SettingsRow label="Confirm Password" hint="Repeat your new password.">
                <div className="relative max-w-sm">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={cn(
                      "h-9 text-xs rounded-md bg-background",
                      confirmPassword && newPassword !== confirmPassword && "border-destructive focus:ring-destructive/20"
                    )}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <AlertCircle className="absolute right-2.5 top-2.5 w-4 h-4 text-destructive" />
                  )}
                </div>
              </SettingsRow>

              <SettingsRow label="" last>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="h-8 text-xs rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-1.5 cursor-pointer"
                >
                  {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  Update password
                </Button>
              </SettingsRow>

              {/* Account info strip */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="px-4 py-3 rounded-md border border-border/60 bg-surface-subtle/50 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Zero-Trust IAM Active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Corporate domain enforcement and token revocation enabled.
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 rounded-md border border-border/60 bg-surface-subtle/50 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Member Since</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION: TEAMS ── */}
          {activeSection === "teams" && (
            <div>
              <SectionHeading sub="Project teams and rosters you are currently enrolled in.">
                Teams &amp; Access
              </SectionHeading>

              {user?.teamMemberships && user.teamMemberships.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {user.teamMemberships.map((tm, i) => (
                    <div
                      key={tm.teamId}
                      className={cn(
                        "flex items-center justify-between gap-4 py-3.5",
                        i < user.teamMemberships!.length - 1 && "border-b border-border/40"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-border"
                          style={{ backgroundColor: tm.team?.color || "var(--primary)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{tm.team?.name}</p>
                          {tm.team?.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{tm.team.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono  px-1.5 py-0.5 shrink-0">
                        {tm.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-lg border border-border/60 bg-surface-subtle flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No team memberships</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      You are not enrolled in any project teams yet. Contact your workspace administrator to be added.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── PINNED ACTION FOOTER (ALWAYS VISIBLE, NEVER CUT OFF) ── */}
      {(activeSection === "general" || activeSection === "preferences") && (
        <footer className="shrink-0 border-t border-border/70 bg-card/95 backdrop-blur-xs px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {hasFormChanges ? (
              <div className="flex items-center gap-2 text-xs text-warning font-medium">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />
                <span>Unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>All profile changes saved</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFormChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetForm}
                disabled={isUpdating}
                className="h-8 text-xs rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Discard
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSaveProfile}
              disabled={!hasFormChanges || isUpdating}
              className="h-8 px-4 text-xs rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save changes
            </Button>
          </div>
        </footer>
      )}

      {/* ── AVATAR PICKER MODAL ── */}
      <Modal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        title="Change Profile Photo"
        description="Upload a photo or choose from curated presets."
        icon={<Camera className="w-4 h-4 text-primary" />}
        size="md"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-center p-5 rounded-lg bg-surface-subtle border border-border/70">
            <UserAvatar
              user={{ name: name || user?.name, email: user?.email, avatarUrl: avatarUrl || undefined }}
              size="xl"
              className="w-20 h-20 text-xl border border-border shadow-md"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Upload photo</label>
            <ImageUploader
              value={avatarUrl}
              onChange={(v) => setAvatarUrl(v)}
              aspectRatio="square"
              maxDimension={500}
              label="Drop image or click to upload"
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Or choose a preset</label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={cn(
                    "w-11 h-11 rounded-full overflow-hidden border transition-transform cursor-pointer shrink-0 ",
                    avatarUrl === preset ? "border-primary ring-2 ring-primary/30" : "border-border/60 opacity-75 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setAvatarModalOpen(false)} className="h-8 text-xs rounded-md cursor-pointer">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setAvatarModalOpen(false);
                await handleSaveProfile();
              }}
              className="h-8 text-xs rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-semibold cursor-pointer"
            >
              Apply &amp; Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
