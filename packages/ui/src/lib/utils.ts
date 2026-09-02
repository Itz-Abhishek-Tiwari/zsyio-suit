import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared error-message unwrapping for mutation/API error handling and toasts.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const errorData = err as
    | { data?: { error?: { message?: string }; message?: string }; message?: string }
    | undefined;
  return (
    errorData?.data?.error?.message ||
    errorData?.data?.message ||
    errorData?.message ||
    (err instanceof Error ? err.message : undefined) ||
    fallback
  );
}

/**
 * Formats a numeric value into a concise currency string (e.g. €1.2M, €45K, €3,500).
 */
export function formatCurrency(value: number | null | undefined, currency = "€"): string {
  if (value === null || value === undefined) return "-";
  if (value >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${value.toLocaleString()}`;
}

/**
 * Deterministically formats an entity into a human-readable badge/ticket string (e.g. "TSK-12", "LEAD-104").
 * Supports raw numbers, existing prefix strings, or fallback 32-bit FNV-1a hashing for strings like CUIDs.
 */
export function formatEntityId(
  idOrEntity?: string | number | { id?: string | null; ticketNumber?: number | null; leadNumber?: number | null } | null,
  options?: {
    prefix?: string;
    numberSlots?: number;
    baseSlotOffset?: number;
  }
): string {
  const prefix = options?.prefix ?? "ID";
  const numberSlots = options?.numberSlots ?? 900000;
  const baseSlotOffset = options?.baseSlotOffset ?? 100000;

  if (!idOrEntity) return `${prefix}-1`;

  if (typeof idOrEntity === "object" && idOrEntity !== null) {
    const num = idOrEntity.ticketNumber ?? idOrEntity.leadNumber;
    if (typeof num === "number" && num > 0) {
      return `${prefix}-${num}`;
    }
    return formatEntityId(idOrEntity.id, options);
  }

  if (typeof idOrEntity === "number") {
    return `${prefix}-${idOrEntity}`;
  }

  const str = String(idOrEntity).trim();
  if (!str) return `${prefix}-1`;

  const prefixRegex = new RegExp(`^(?:${prefix}-?)?(\\d+)$`, "i");
  const numericMatch = str.match(prefixRegex);
  if (numericMatch) {
    return `${prefix}-${numericMatch[1]}`;
  }

  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash >>> 0) % numberSlots) + baseSlotOffset;
  return `${prefix}-${num}`;
}

export function formatTicketId(
  idOrTask?: string | number | { id?: string | null; ticketNumber?: number | null } | null,
  prefix = "TSK"
): string {
  return formatEntityId(idOrTask, { prefix, numberSlots: 900000, baseSlotOffset: 100000 });
}

export function formatLeadId(
  idOrLead?: string | number | { id?: string | null; leadNumber?: number | null } | null,
  prefix = "LEAD"
): string {
  return formatEntityId(idOrLead, { prefix, numberSlots: 900, baseSlotOffset: 100 });
}
