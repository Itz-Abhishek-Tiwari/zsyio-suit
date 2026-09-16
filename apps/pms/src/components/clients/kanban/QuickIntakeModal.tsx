"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Textarea } from "@zsyio/ui";
import { useCreateClientMutation } from "@/store/api/clientsApi";
import { getErrorMessage } from "@zsyio/ui";
import { toast } from "sonner";
import {
  UserPlus,
  Building2,
  Globe,
  Mail,
  Phone,
  StickyNote,
  Loader2,
  Sparkles,
} from "lucide-react";

interface QuickIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickIntakeModal({ isOpen, onClose }: QuickIntakeModalProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [createClient, { isLoading }] = useCreateClientMutation();

  const handleReset = () => {
    setName("");
    setDomain("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the prospect or organization name");
      return;
    }

    try {
      await createClient({
        name: name.trim(),
        domain: domain.trim() ? domain.trim() : null,
        contactName: contactName.trim() ? contactName.trim() : null,
        contactEmail: contactEmail.trim() ? contactEmail.trim() : null,
        contactPhone: contactPhone.trim() ? contactPhone.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
        status: "INTAKE",
      }).unwrap();

      toast.success(`Added "${name}" to Intake pipeline!`);
      handleReset();
      onClose();
    } catch (err: unknown) {
      const errorData = err as { data?: { error?: { fields?: Record<string, string[]> } } };
      const fieldErrors = errorData?.data?.error?.fields;
      const firstFieldErr = fieldErrors ? Object.values(fieldErrors).flat()[0] : null;
      toast.error(firstFieldErr || getErrorMessage(err, "Failed to add intake lead"));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleReset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-card shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-transparent p-5 border-b border-border/80">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pipeline In-Taking Stage</span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-500" />
              Add New Intake Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a prospective client in discussion. This will remain in your intake pipeline and won&apos;t appear in the main client roster until moved to Onboarding.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Organization / Lead Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Prospect / Company Name *</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Nexus Labs..."
              className="h-9 text-xs"
              autoFocus
              required
            />
          </div>

          {/* Website / Domain */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Website / Domain (optional)</span>
            </label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. acme.com"
              className="h-9 text-xs"
            />
          </div>

          {/* Primary Contact Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Contact Email</span>
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="alex@acme.com"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Contact Phone</span>
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Contact Person Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              <span>Primary Contact Person</span>
            </label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Alex Johnson (CTO)"
              className="h-9 text-xs"
            />
          </div>

          {/* Short Intake Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Intake Notes & Requirements</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussing MVP redesign for Q3. Met at conference. Budget range $40k-$60k..."
              rows={3}
              className="resize-none text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isLoading}
              className="h-8 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Add to Intake Pipeline
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
