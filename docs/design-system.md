# 🎨 Zsyio / Zsyio Design System Specification

**Version:** 2.1  
**Design Language:** Sapphire & Charcoal (Stripe-inspired High-Trust Architecture)  
**Target Systems:** Zsyio PMS, Notes, HRMS, Sales, Admin, and `@zsyio/ui` Monorepo Packages.  
**Audience:** Frontend Engineers, Designers, Product Managers, and AI Agents.

---

## 1. Design Philosophy & Tenets

Zsyio Suite is designed as a **high-density, precision productivity system** inspired by the refined engineering aesthetics of Stripe, Linear, and Vercel. 

### Core Tenets:
1. **Precision Geometry over Bubbly Consumer Forms**:
   - Avoid oversized radii (`rounded-2xl`, `rounded-3xl`, `rounded-full` pills) on primary interactive controls.
   - Interactive elements (buttons, inputs, selects, tabs, nav items) strictly adhere to **crisp, mathematical radii** (`rounded-sm` to `rounded-md`).
2. **Information Density with Breathing Room**:
   - Data must be dense, legible, and immediately actionable without requiring excessive scrolling.
   - Typography uses proportional scaling, tight line-heights, and tabular numeral alignment.
3. **Sapphire & Charcoal**:
   - **Dark Mode**: Balanced slate navy and rich charcoal surfaces (`#0F172A`, `#1E293B`, `#243048`) with comfortable contrast (never pitch-black void), illuminated by crisp 1px borders and focused sapphire blue actions.
   - **Light Mode**: Calming, clean slate paper-white (`#F8FAFC`, `#F1F5F9`) with high-contrast text and crisp sapphire blue controls.
4. **Semantic Token Purity**:
   - Hardcoded arbitrary hex colors (`#1e293b`) or ad-hoc Tailwind colors (`bg-blue-600`) are **strictly prohibited**.
   - Every color, radius, and elevation must map to CSS custom properties declared in `tokens.css`.

---

## 2. Geometry & Border Radius Standards

To preserve visual consistency, radius tokens are mapped to functional component types according to this hierarchy:

| Token | Class | Size | Designated Usage |
|---|---|---|---|
| `--radius-xs` | `rounded-xs` | **2px** | Micro indicators, inline code chips, scrollbar thumbs. |
| `--radius-sm` | `rounded-sm` | **4px** | Status badges, compact tags, icon buttons (`h-8 w-8`), segment tab pills, avatar badges. |
| `--radius-md` | `rounded-md` | **6px** | **Default interactive radius**: Buttons, Form Inputs, Textareas, Select Triggers & Dropdowns, Dropdown Menus, Popovers, Nav Links, App Switcher Items. |
| `--radius-lg` | `rounded-lg` | **8px** | **Surfaces & Containers**: Cards (`obsidian-card`), Dialog/Modal content wrappers, preview sheets, drawer panels. |
| `--radius-xl` | `rounded-xl` | **12px** | Full-width container headers, marketing hero media containers, media lightbox wrappers. |
| `--radius-full` | `rounded-full` | **9999px** | **Strictly circular elements**: User circular avatars, status dots, notification counters. Never for rectangular buttons or tabs. |

> [!WARNING]
> **Anti-Pattern**: Do NOT use `rounded-xl` or `rounded-full` on buttons, inputs, tabs, or sidebar nav links. That produces bubbly iOS-style shapes that clash with the suite's engineering aesthetic.

---

## 3. Typography System

The typography system uses three purposeful font families loaded in `layout.tsx`:

```
Display Headings  ──► Space Grotesk     (--font-display)
Body & Interface  ──► Plus Jakarta Sans (--font-body)
Code & Tabular    ──► JetBrains Mono    (--font-mono)
```

### 3.1 Type Scale & Application

| Level | Size | Weight | Line Height | Tracking | Recommended Classes | Typical Usage |
|---|---|---|---|---|---|---|
| **Display Hero** | 24px–30px | 700 | 1.2 | `-0.03em` | `font-display text-2xl font-bold tracking-tight` | Dashboard titles, Page headers, Welcome banners |
| **Section Title** | 16px–18px | 600 | 1.3 | `-0.02em` | `font-display text-base font-semibold tracking-tight` | Card headers, Modal titles, Table section headers |
| **Subtitle / Subhead** | 13px–14px | 500 | 1.4 | `-0.01em` | `text-sm font-medium text-foreground-secondary` | Section descriptions, filter bar labels |
| **Body (Default)** | 13px–14px | 400/500 | 1.5 | `normal` | `text-sm text-foreground` | Content text, table cells, descriptions |
| **Interactive / Label** | 12px | 500/600 | 1.0 | `-0.01em` | `text-xs font-semibold leading-none` | Buttons, Select items, Nav links, Form field labels |
| **Micro / Caption** | 10px–11px | 600/700 | 1.2 | `0.02em` | `text-[11px] font-mono uppercase tracking-wider text-muted-foreground` | Status badges, table headers, timestamp metadata |

### 3.2 Tabular Numbers Rule
Any interface element that displays numbers, counts, monetary values, timestamps, or ticket codes **must** enforce tabular alignment:
```tsx
// Correct
<span className="font-mono tabular-nums text-xs">TSK-8491</span>
<span className="tabular-nums font-semibold">1,248 tasks</span>

// Incorrect (numbers shift width on change)
<span>TSK-8491</span>
```

---

## 4. Color & Semantic Token Architecture

All colors are controlled through CSS custom variables declared in `packages/ui/src/styles/tokens.css` and compiled via `npm run build:tokens`.

### 4.1 Surface & Neutral Tokens

| Token Name | Tailwind Utility | Light Theme (`:root`) | Dark Theme (`[data-theme="dark"]`) | Description |
|---|---|---|---|---|
| `--background` | `bg-background` | `#F8FAFC` | `#0F172A` | App shell, viewport root (comfortable dark navy) |
| `--foreground` | `text-foreground` | `#0F172A` | `#F8FAFC` | Primary text, highest contrast |
| `--foreground-secondary` | `text-foreground-secondary` | `#475569` | `#CBD5E1` | Supporting descriptions, secondary headers |
| `--foreground-tertiary` | `text-foreground-tertiary` | `#64748B` | `#94A3B8` | Micro copy, placeholder text, hints |
| `--foreground-disabled` | `text-foreground-disabled` | `#94A3B8` | `#64748B` | Inactive elements, disabled text |
| `--surface-card` / `--card` | `bg-card` | `#FFFFFF` | `#1E293B` | Content cards, data lists, tables |
| `--surface-elevated` | `bg-surface-elevated` | `#FFFFFF` | `#243048` | Dropdowns, dialogs, popovers, tooltips |
| `--surface-subtle` | `bg-surface-subtle` | `#F1F5F9` | `#182234` | Hover backgrounds, alternating table rows |
| `--border` | `border-border` | `#E2E8F0` | `rgba(255, 255, 255, 0.08)` | Default card and divider borders |
| `--border-strong` | `border-border-strong` | `#CBD5E1` | `rgba(255, 255, 255, 0.16)` | Active borders, hover states |
| `--border-focus` | `border-border-focus` | `var(--color-blue-600)` | `var(--color-blue-400)` | Focus ring and highlighted controls |

### 4.2 Primary Brand & Action Tokens

| Token Name | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--primary` | Blue 600 (`#2563EB`) | Blue 500 (`#3B82F6`) | Primary actions, key badges, selected states |
| `--primary-hover` | Blue 700 (`#1D4ED8`) | Blue 400 (`#60A5FA`) | Hover state for primary buttons |
| `--primary-light` | Blue 50 (`#EFF6FF`) | `rgba(59, 130, 246, 0.15)` | Active tab tint, icon button background |
| `--primary-foreground`| White (`#FFFFFF`) | White (`#FFFFFF`) | High contrast label over primary fill |

### 4.3 Semantic Feedback Tokens

| Intent | Token Base | Light Background / Border | Dark Background / Border | Use Cases |
|---|---|---|---|---|
| **Success** | `--success` (`#039855` / `#12B76A`) | `#ECFDF3` / `#A6F4C5` | `rgba(16, 185, 129, 0.15)` / `rgba(16, 185, 129, 0.3)` | `DONE` status, QA passed, positive delta |
| **Warning** | `--warning` (`#DC6803` / `#F79009`) | `#FFFAEB` / `#FEDF89` | `rgba(245, 158, 11, 0.15)` / `rgba(245, 158, 11, 0.3)` | Approaching SLA, in progress, pending review |
| **Destructive** | `--destructive` (`#D92D20` / `#EF4444`) | `#FEF3F2` / `#FECDCA` | `rgba(239, 68, 68, 0.15)` / `rgba(239, 68, 68, 0.3)` | `BLOCKED` status, overdue, delete actions |
| **Info / Tech** | `--color-blue-500` (`#3B82F6`) | `#EFF6FF` / `#BFDBFE` | `rgba(59, 130, 246, 0.15)` / `rgba(59, 130, 246, 0.3)` | QA status, technical metadata, branch info |

---

## 5. Standard Component Guidelines

All standardized components live in `packages/ui/src/components` and are imported via `@zsyio/ui`.

### 5.1 Buttons (`<Button>`)
* **Geometry**: Always `rounded-md`, compact height (`h-8` for sm, `h-9` for default, `h-10` for lg).
* **Typography**: `text-xs font-semibold leading-none`.
* **Micro-interactions**: `active:scale-[0.98] transition-all duration-150`.
* **Variants**:
  - `default`: Solid primary background (`bg-primary text-primary-foreground hover:bg-primary-hover`).
  - `secondary`: Subtle cyan wash (`bg-primary-light text-primary border border-primary/20`).
  - `outline`: Surface background with crisp border (`border border-border bg-surface-elevated text-foreground hover:bg-surface-subtle`).
  - `ghost`: Transparent until hovered (`text-muted-foreground hover:bg-surface-subtle hover:text-foreground`).
  - `destructive`: Red background for irreversible operations.

```tsx
import { Button } from "@zsyio/ui";
import { Plus } from "lucide-react";

// Standard action button
<Button size="default" variant="default">
  <Plus className="size-4" />
  Create Task
</Button>
```

### 5.2 Form Inputs & Selects (`<Input>`, `<Textarea>`, `<Select>`)
* **Geometry**: Standard `rounded-md`, height `h-10` (or `min-h-[90px]` for textareas).
* **Borders & Focus**:
  - Default: `border border-input-border bg-input`.
  - Hover: `hover:border-border-strong`.
  - Focus: `focus:border-ring focus:ring-4 focus:ring-ring/15`.

```tsx
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@zsyio/ui";

<Input placeholder="Enter ticket title..." />

<Select defaultValue="TODO">
  <SelectTrigger>
    <SelectValue placeholder="Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="TODO">To Do</SelectItem>
    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
  </SelectContent>
</Select>
```

### 5.3 Cards & Surface Panels (`<Card>`, `.obsidian-card`)
* **Light Mode**: Clean white surface with subtle 1px border (`border-border`) and light shadow (`shadow-2xs`).
* **Dark Mode**: `.obsidian-card` applies top-edge highlight:
  `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 2px 8px rgba(0, 0, 0, 0.5);`
* **Padding**: Standard header/content padding is `p-4` or `p-5`.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@zsyio/ui";

<Card className="obsidian-card">
  <CardHeader>
    <CardTitle>Sprint Velocity</CardTitle>
    <CardDescription>Track weekly story points and throughput</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Charts or Metrics */}
  </CardContent>
</Card>
```

### 5.4 Badges & Status Indicators (`<Badge>`, `<StatusBadge>`)
* **Geometry**: `rounded-sm` or `rounded-md`, padding `px-2 py-0.5`.
* **Font**: `text-[11px] font-mono font-medium leading-tight`.
* **Design**: Never use heavy saturated blocks for badges. Use subtle tinted backgrounds with a matching tinted border:

```tsx
import { Badge, StatusBadge } from "@zsyio/ui";

<StatusBadge status="IN_PROGRESS" />
<Badge variant="success">PASSED</Badge>
```

### 5.5 Navigation & Sidebars (`<SuiteSideRail>`, `<SuiteSidebar>`, `<AppSwitcher>`)
* **Side Rail**: Fixed `w-14` (56px) compact vertical dock displaying suite apps. Active app icon has `rounded-md` with cyan glow indicator.
* **Suite Sidebar**:
  - Expanded: `w-60` (240px) with collapsible nav sections.
  - Collapsed: `w-16` (64px) icon-only mode with floating tooltips.
  - Nav items: `h-9 rounded-md text-xs font-medium` with subtle hover transitions and cyan active state indicator.

---

## 6. Layout & Spatial Grid

1. **4px Base Unit**:
   - `space-1` = 4px, `space-2` = 8px, `space-3` = 12px, `space-4` = 16px, `space-6` = 24px, `space-8` = 32px.
2. **Page Anatomy**:
   ```
   ┌─────────┬──────────────┬────────────────────────────────────────────────────────┐
   │ SideRail│ SuiteSidebar │ SuiteHeader (56px height, breadcrumb, search, user menu)│
   │ (56px)  │ (240px)      ├────────────────────────────────────────────────────────┤
   │         │              │ PageHeader (Title, Action Buttons, View Toggles)       │
   │         │              ├────────────────────────────────────────────────────────┤
   │         │              │ Main Content Viewport (p-6, max-w-7xl / full width)    │
   └─────────┴──────────────┴────────────────────────────────────────────────────────┘
   ```
3. **Motion & Transitions**:
   - Micro-transitions: `duration-150 ease-out` for hover and focus states.
   - Panel transitions: `duration-200 cubic-bezier(0.16, 1, 0.3, 1)` for slide-overs, drawer sheets, and sidebar collapses.
   - Spring curves: `transition: { type: "spring", stiffness: 350, damping: 25 }` for tab indicator sliders.

---

## 7. Developer Rules: Dos & Don'ts

| Practice | ❌ Bad Pattern (Forbidden) | ✅ Good Pattern (Standard) |
|---|---|---|
| **Colors** | `<div className="bg-[#1f2937] text-white">` | `<div className="bg-surface-elevated text-foreground border border-border">` |
| **Buttons** | `<button className="rounded-xl px-6 py-3 bg-blue-600">` | `<Button variant="default" size="default">` |
| **Corner Radius** | `rounded-2xl`, `rounded-3xl` on buttons/inputs | `rounded-md` for controls, `rounded-lg` for card containers |
| **Numbers & IDs** | `<span>1,234.50</span>` | `<span className="tabular-nums font-mono">1,234.50</span>` |
| **Status Styling**| Hardcoded badge styles in page files | `<StatusBadge status={task.status} />` from `@zsyio/ui` |
| **Dark Theme** | Manual conditional checks `theme === 'dark' ? '#000' : '#fff'` | Rely on CSS tokens (`var(--background)`, `var(--foreground)`) |
| **Modals** | Custom unstyled `div` with absolute positioning | `<Dialog>` or `<Sheet>` with `@zsyio/ui` primitives |

---

## 8. Multi-Brand Token Compilation

Zsyio Suite supports white-label and multi-brand token theming:

```
tokens/
└── primitives.json          # Master design primitives (Color, Space, Radius, Font, Shadow)
scripts/
└── build-tokens.mjs         # Token compiler
packages/ui/src/styles/
└── tokens.css               # Generated CSS variables (Never edit manually)
```

To recompile design tokens after updating primitives:
```bash
npm run build:tokens
```
This distributes updated tokens across `@zsyio/ui` and all client applications in `apps/*`.
