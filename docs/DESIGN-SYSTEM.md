# StudyQuest Design System Guide

This document serves as the implementation guide for AI agents and developers building the StudyQuest frontend in Next.js with Tailwind CSS v4. **All UI components MUST adhere to these exact styles, colors, and typography.**

## 1. Global Themes & Colors

StudyQuest is a **dark-mode first** application. It uses deep navy backgrounds with a primary violet accent that glows when active. Function-specific colors (like streak orange) are strictly reserved for their specific features.

These variables are already configured in `app/globals.css`. Use standard Tailwind classes (e.g., `bg-surface-up`, `text-violet-mid`) to apply them.

### Background Ramps

- **`bg-background`** (`#0D1117`): Base page background for everything.
- **`bg-surface`** (`#111827`): Default background for cards, standard widgets.
- **`bg-surface-up`** (`#162032`): Elevated elements, hovered cards.
- **`bg-surface-hi`** (`#1E2D45`): Highest elevation, progress bar tracks, and borders.

### Text Ramp

- **`text-foreground`** (`#E2E8F0`): Primary content, headings.
- **`text-text-sub`** (`#94A3B8`): Secondary info, descriptions.
- **`text-muted-foreground`** (`#475569`): Hints, timestamps, disabled states.

### Accents & Functional Colors

- **Violet (Primary Accent)**
  - `text-violet` (`#7C3AED`): Primary buttons, active state backgrounds.
  - `text-violet-mid` (`#A78BFA`): Labels, XP text, Timer text.
  - `bg-violet-glow` (`rgba(124, 58, 237, 0.22)`): Hover states, tags, button outer glows.
- **Streak (Gamification)**
  - `text-streak` (`#EA580C`): Used **ONLY** for streak numbers and icons (🔥).
  - `bg-streak-bg` (`rgba(234, 88, 12, 0.14)`): Streak tag backgrounds.
- **Semantic**
  - `text-success` (`#10B981`): Completed tasks, Deep focus mode.
  - `bg-success-bg` (`rgba(16, 185, 129, 0.1)`): Success tag backgrounds.
  - `text-destructive` (`#EF4444`): Delete, errors, streak-at-risk.
  - `text-amber` (`#D97706`): Blitz focus mode timer.
- **Timer Modes** (see `lib/timer-modes.ts` for the canonical values consumed by both the public and in-app timers):
  - Blitz — `text-amber` (`#D97706`).
  - Focus — `text-violet` (`#7C3AED`).
  - Deep — `#06B6D4` (no named token today; a raw hex used at every call site via `lib/timer-modes.ts`, consider promoting to a CSS variable if a fourth consumer appears).

---

## 2. Typography

We use exactly **one** font: `Geist Mono` (`--font-geist-mono`). It handles every text element in the app by modifying weight, size, and letter spacing.

### Font Configurations

- **Hero / Giant Headers**: 56px, weight `900`, tracking `-0.04em`.
- **Timers**: `font-mono font-black tracking-tight`, color neutral `text-white` (not `violet-mid` — the ring/glow carries the active mode color, so the digits themselves stay maximally legible at the sizes below). Rendered by the shared `components/timer/pomodoro-dial.tsx`, sized via its `size` prop: `md` 64px (compact/idle demo state), `lg` 88px (dashboard inline), `xl` 116px (immersive running state, dashboard focus-mode overlay).
- **Standard Heading**: 30px, weight `800`, tracking `-0.03em`.
- **Subheading**: 16px, weight `600`, tracking `-0.01em`.
- **Body**: 13px, weight `400`, tracking `0`, color `text-sub`.
- **Micro Label**: 10px, weight `600`, tracking `+0.15em`, color `muted-foreground`. **(ALWAYS uppercase)**

---

## 3. Component Styles

### Tag / Badge Defaults

- **Border Radius**: 4px (`rounded-sm`).
- **Font**: 11px, weight `500`, tracking `+0.04em`.
- **Padding**: Y: 3px, X: 10px.
- **Variants**:
  - _Default_: `bg-surface-hi text-text-sub border-border-up`
  - _Violet_: `bg-violet-glow text-violet-mid border-violet/30`
  - _Streak_: `bg-streak-bg text-streak border-streak/30`
  - _Success_: `bg-success-bg text-success border-success/25`

### Buttons

- **Font**: 12px, weight `600`, tracking `+0.04em`.
- **Border Radius**: 7px.
- **Primary (Call to Action)**: `bg-violet text-white border-violet shadow-[0_0_16px_var(--color-violet-glow)]`
- **Secondary**: `bg-surface-up text-foreground border-border`
- **Ghost**: Transparent background, `text-text-sub`.

### Inputs

- **Labels**: 10px, weight `600`, color `muted-foreground`, tracking `+0.1em`, uppercase.
- **Input Box**: `bg-surface`, `border-border`, radius `7px`, font 13px.

---

## 4. UI Patterns & Shadows

- **Glows**: We do not use standard gray drop shadows. Instead, active elements emit a colored glow. Primary actions have a violet glow: `shadow-[0_0_14px_var(--color-violet-glow)]`. Completed streak days emit a streak glow: `shadow-[0_0_8px_rgba(234,88,12,0.4)]`.
- **Blur**: Top navigation bars should use `bg-surface-up/90` with `backdrop-blur-md` (blur 10-12px).
- **Dividers**: Small uppercase tracking labels (e.g. `10px`, `text-violet-mid`, `tracking-[0.18em]`) displayed alongside a 1px `border-border` line extending horizontally.
- **Progress Bars (XP)**: Container `bg-surface-hi` (`h-5`, `rounded-full`). Fill: linear-gradient from `violet` to `violet-mid`, featuring an outer `violet-glow` box-shadow.

## 5. Developer / AI Directives

- **DO NOT** use default Tailwind shadows (`shadow-md`, `shadow-xl`) unless heavily modified to match the dark aesthetic. Use glows instead.
- **DO NOT** use generic fonts like Inter, Roboto, or standard sans. Everything is `font-mono`.
- **ALWAYS** check `globals.css` variable names before applying arbitrary hex values in utilities. Prefer the semantic variables (e.g., `text-violet-mid` over `text-[#A78BFA]`).
- The UI is compact and data-dense. Stick to specific fractional or custom padding sizes when building cards (e.g. padding `18px 20px`, smaller font sizes).
- **DO NOT** hardcode one-off surface/typography values (e.g. `bg-white/[0.04]`, `font-[700]`, `font-[200]`) directly on a page or feature component. If a shadcn/ui primitive already renders that surface (`Card`, `Badge`, `Button`, `Input`, etc.), the styling belongs in that component's own default classes in `components/ui/*.tsx` so a branding/palette change is a single edit instead of a repo-wide hunt. Known offenders to clean up when touched: `components/onboarding/wizard-shell.tsx`'s `bg-white/[0.04]` panel, and the same `border-white/10 bg-white/[0.0{3,4,5}]` card treatment repeated ad hoc across `app/leaderboard/page.tsx`, `app/dashboard/page.tsx`, `app/subjects/page.tsx`, `app/subjects/[id]/page.tsx`, and `app/settings/page.tsx` — these should become a `Card` variant (or a semantic `bg-surface-glass`-style token in `globals.css`), not repeated inline.
- **ALWAYS** prefer an existing shadcn/ui component (`components/ui/*`) over hand-rolling a new one. Only build a custom component when no shadcn primitive covers the pattern — check `components/ui/` first.
