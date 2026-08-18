---
name: Zsyio Suite
description: Unified enterprise operational workspace design system
colors:
  primary: "#2383E2"
  primary-hover: "#1D70C2"
  primary-light: "#E7F3F8"
  primary-dark: "#529CCA"
  neutral-bg: "#FBFBFA"
  neutral-fg: "#37352F"
  neutral-bg-dark: "#191919"
  neutral-fg-dark: "#E6E6E5"
  surface-card: "#FFFFFF"
  surface-card-dark: "#202020"
  surface-subtle: "#F7F6F3"
  surface-subtle-dark: "#202020"
  border: "rgba(55, 53, 47, 0.09)"
  border-dark: "rgba(255, 255, 255, 0.094)"
  border-strong: "rgba(55, 53, 47, 0.16)"
  border-strong-dark: "rgba(255, 255, 255, 0.16)"
  destructive: "#EB5757"
  destructive-dark: "#FF6B6B"
  success: "#448361"
  success-dark: "#529E72"
  warning: "#C29243"
  warning-dark: "#CA9849"
  muted-fg: "#787774"
  muted-fg-dark: "#9B9B9B"
  cover-emerald: "#064E3B"
  cover-amber: "#B45309"
  cover-rose: "#9F1239"
  cover-warm-brown: "#78350F"
  template-teal: "#0D9488"
  template-sky: "#0EA5E9"
  template-emerald: "#10B981"
  template-indigo-deep: "#4F46E5"
  template-indigo: "#6366F1"
  template-amber: "#F59E0B"
  template-violet: "#8B5CF6"
  status-orange: "#F97316"
  status-red: "#EF4444"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.024em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.018em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  nano:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "9px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  pico:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "8px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
  compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  2xl: "10px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: Zsyio Suite

## Overview
The Zsyio Suite design system establishes a high-density, tactile, and restrained operational environment for daily power users across Project Management (Zsyio Flow PMS), Knowledge Base & Docs (Zsyio Canvas Notes), Sales CRM (Zsyio Pulse), HRMS (Zsyio People), and Administration (Zsyio Core Admin). 

Rooted in a Notion/Linear-inspired utilitarian aesthetic, the system balances dense data tables and Kanban task flows with warm, calm typographic rhythm and zero visual noise. It completely rejects generic AI clichés—such as multi-stop decorative gradients, unmotivated glassmorphic blur, and floating saturated orb halos—in favor of strict token fidelity, accessible contrast, and tactile physical feedback.

## Colors
Color in Zsyio operates under a **Restrained** strategy: neutral grounds carry the content, while precise semantic colors signal state, priority, and focus.

- **Primary Accent (`--primary`)**: `#2383E2` (light) / `#529CCA` (dark). Used for intentional actions, primary buttons, active links, and focus rings. Never applied as ambient wallpaper or text gradients.
- **Surfaces & Grounds**:
  - Light Ground: `#FBFBFA` (warm ivory) with `#FFFFFF` elevated cards and `#F7F6F3` subtle sidebars.
  - Dark Ground: `#191919` (obsidian charcoal) with `#202020` cards and elevated panels.
- **Borders & Dividers**:
  - Light: `rgba(55, 53, 47, 0.09)` (subtle) and `rgba(55, 53, 47, 0.16)` (strong / input boundaries).
  - Dark: `rgba(255, 255, 255, 0.094)` (subtle) and `rgba(255, 255, 255, 0.16)` (strong).
- **Semantics & Feedback**:
  - Success: `#448361` (light) / `#529E72` (dark) for completed tasks, approvals, and positive metrics.
  - Warning: `#C29243` (light) / `#CA9849` (dark) for review states, warnings, and medium priority.
  - Destructive / Error: `#EB5757` (light) / `#FF6B6B` (dark) for blockers, critical priority, and errors.
  - Status Backlog / Neutral: `#787774` (light) / `#9B9B9B` (dark).

## Typography
Zsyio uses clean, legible system stacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) optimized for information-dense desktop and mobile displays.

- **Scale & Hierarchy**:
  - **Display (`30px` / `36px`, weight 600, tracking `-0.028em`)**: Major dashboard headings and landing hero headlines.
  - **Headline (`24px`, weight 600, tracking `-0.024em`)**: Page titles and modal headers.
  - **Title (`18px` / `20px`, weight 600, tracking `-0.018em`)**: Section headers, card titles, and drawer headers.
  - **Body (`14px` / `16px`, weight 400, line-height 1.6)**: Primary interface copy, document text, and table rows. Measure maintained between 65–75ch for prose.
  - **Label & Caption (`12px`, weight 500, line-height 1.4)**: Metadata tags, status badges, timestamps, and column labels.
- **Monospace (`--font-mono`)**: Reserved for code snippets, UUIDs, git hashes, and formula outputs. Monospace is never used as decorative styling for generic labels.
- **Tabular Figures**: All numerical metrics, countdowns, timestamps, and financial figures enforce `font-variant-numeric: tabular-nums` to eliminate jitter during updates.

## Layout
- **Density & Spatial Rhythm**: Standard 4px baseline grid with 8px increments (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
- **Monorepo App Architecture**:
  - Shared global navigation bar (`suite-header-gradient`) pinned at top with blurred backdrop-filter (`12px`) for subtle content separation.
  - Collapsible persistent sidebar (`suite-sidebar-gradient`, width `240px` expanded, `56px` rail collapsed).
  - Main workbench area with responsive fluid grid (`max-width: 1440px` for dashboards, fluid for Kanban boards and document canvases).
- **Breakpoints**:
  - Mobile: `< 640px` (stacked single-column layout, bottom sheets for navigation).
  - Tablet: `640px – 1024px` (two-column dashboard, collapsible sidebar).
  - Desktop: `> 1024px` (multi-column Kanban, side-by-side document and metadata inspector).

## Elevation & Depth
Depth in Zsyio is tonal and structural, avoiding exaggerated drop shadows or zero-offset glowing halos.

- **Elevation Levels**:
  - Flat Ground (`--background`): Base application canvas.
  - Elevated Cards (`--surface-card`): `1px solid var(--border)` with `--shadow-xs` (`0 1px 2px rgba(15, 15, 15, 0.04)`).
  - Hover States: Border color shifts to `rgba(35, 131, 226, 0.35)` with subtle lift (`--shadow-md`).
  - Dropdowns & Popovers: `--surface-elevated` with `--shadow-lg` (`0 8px 24px -4px rgba(15, 15, 15, 0.08)`) and `1px solid var(--border-strong)`.
  - Modals & Drawers: Centered dialogs with dark overlay (`rgba(0, 0, 0, 0.45)`) and `--shadow-2xl`.

## Shapes
- **Corner Radii**:
  - Subtle controls (inputs, buttons, badges): `4px` (`--radius-md`) to maintain crisp, professional tool contours.
  - Containers (cards, modals, popovers): `6px` (`--radius-lg`) to `8px` (`--radius-xl`).
  - Avatars & Status Pills: Fully rounded (`9999px`).
- **Focus Rings**:
  - High-visibility accessible outline: `2px solid var(--ring)` with `2px` offset (`outline-offset: 2px`).
  - Never suppress focus rings with `outline: none` without providing an active tokenized alternative.

## Components
- **Buttons (`Button`)**:
  - Variants: `primary` (solid blue), `secondary` (subtle border and surface), `ghost` (transparent until hover), `destructive` (soft red fill or text), `outline`.
  - Padding: `8px 16px` (regular), `6px 12px` (small/dense).
- **Inputs & Textareas (`Input`, `Textarea`, `SearchInput`)**:
  - Solid background (`--input`), crisp border (`--input-border`), and responsive focus ring.
- **Badges (`Badge`, `StatusBadge`, `UserRoleBadge`)**:
  - Compact `12px` typography, soft background tint (`15%` opacity of semantic hue), and solid matching text color.
- **Document & Note Editor (`RichTextEditor`, `CoverPicker`, `FormattedText`)**:
  - Notion-grade typography and block editing with Tiptap.
  - Interactive Mermaid diagram previews with zoom, pan, and SVG export.
  - High-fidelity cover pickers with curated unslashed enterprise gradients and patterns.

## Do's and Don'ts

### Do
- Always use semantic CSS variables (`var(--primary)`, `var(--card)`, `var(--border)`) rather than raw hex values.
- Apply `font-variant-numeric: tabular-nums` to numbers and currency across table views.
- Ensure all interactive elements have visible `:focus-visible` styles with a minimum contrast ratio of 4.5:1.
- Provide clear empty states (`EmptyState`) with guided call-to-actions for zero-data views.
- Keep micro-animations purposeful and brief (`150ms – 250ms` ease-out transitions).

### Don't
- Do not use multi-stop gradient text (`background-clip: text`) on headlines.
- Do not add decorative floating blurred orbs or glowing halos behind cards.
- Do not use emoji or raw unicode symbols as substitutes for cohesive Lucide SVG icons.
- Do not strip focus rings (`outline: none !important`) on form elements or editor surfaces.
- Do not invent ad-hoc spacing values; strictly adhere to the 4px/8px token rhythm.
