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

---

## 2. Typography

We use exactly **one** font: `Geist Mono` (`--font-geist-mono`). It handles every text element in the app by modifying weight, size, and letter spacing.

### Font Configurations

- **Hero / Giant Headers**: 56px, weight `900`, tracking `-0.04em`.
- **Timers**: 52px, weight `800`, tracking `-0.04em`, color `violet-mid`.
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
