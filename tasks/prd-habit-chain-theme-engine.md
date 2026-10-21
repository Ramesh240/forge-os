# Product Requirements Document (PRD)

## Title: Habit Streak Visual Chain Upgrades & Pro Theme Engine
**Document Version:** 1.0.0  
**Status:** Ready for Review / Conversion to Ralph Format  
**Author:** ForgeOS Core Team  
**Target Path:** `tasks/prd-habit-chain-theme-engine.md`

---

## 1. Introduction / Overview

ForgeOS is an identity-driven habit mastery operating system rooted in James Clear's *Atomic Habits* and Robert Greene's *Mastery*. Currently, habit streaks are displayed as basic numeric indicators, and the application is locked to a dark "Obsidian" palette with hardcoded background styles.

This initiative introduces two high-impact capabilities:
1. **Interactive Habit Streak Visual Chain:** Upgrades habit tracking into an engaging, visual 7-day rolling chain with dynamic milestone flame animations, "Never Miss Twice" rebound urgency indicators, and gateway downscaler badges.
2. **Pro Theme & Palette Switcher Engine:** Replaces hardcoded styles with a comprehensive theme system offering Dark Obsidian, Daylight Minimal (Light), and Warm Sepia Parchment, paired with customizable accent colors (Indigo, Amber, Emerald, Rose). Theme customization is positioned as an exclusive cosmetic benefit for ForgeOS Pro subscribers, synchronizing seamlessly with the native Android wrapper.

---

## 2. Goals & Objectives

- **Boost Habit Retention:** Increase daily check-in frequency and completion rates through clear visual momentum (7-day chain visualization and milestone tiers).
- **Enforce "Never Miss Twice":** Visually highlight rebound opportunities when a habit was missed yesterday, preventing streak abandonment.
- **Deliver Modern Aesthetic Flexibility:** Provide a comfortable daylight viewing experience without sacrificing ForgeOS's focused, distraction-free aesthetic.
- **Drive Pro Conversions:** Gate light mode, sepia parchment, and custom accent palettes behind ForgeOS Pro, rewarding paid and beta supporters.
- **Cross-Platform Parity:** Ensure theme changes immediately synchronize native Android system bars via the JavaScript bridge.

---

## 3. User Stories

### US-001: 7-Day Rolling Visual Chain Component
**Description:** As a user, I want to see a 7-day rolling visual chain of nodes on each habit card so that I can immediately visualize my consistency and momentum over the past week.

**Acceptance Criteria:**
- [ ] Each habit card renders a horizontal row of 7 linked nodes representing the last 6 days plus today.
- [ ] Nodes display four distinct states:
  - **Completed (Past):** Solid accent circle with checkmark.
  - **Completed Gateway Only:** Distinct hollow/gateway icon indicator.
  - **Missed (Past):** Subtle muted node with a broken chain link or dash.
  - **Today Pending:** Glowing/pulsing outline prompting action.
  - **Today Completed:** Solid accent celebratory filled state.
- [ ] Hovering or tapping a node shows a tooltip with the date and completion details (duration / phase).
- [ ] Responsive on mobile screens (scales down cleanly without overflowing habit cards).
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

### US-002: Dynamic Milestone Flame & "Never Miss Twice" Rebound Badge
**Description:** As a user, I want dynamic streak flames and clear rebound alerts so that I feel rewarded for long streaks and motivated to recover immediately after missing a day.

**Acceptance Criteria:**
- [ ] Streak display upgrades dynamically based on `currentStreak`:
  - **Tier 1 (1–2 days):** *Spark* (dim amber flame).
  - **Tier 2 (3–6 days):** *Ember* (warm orange flame).
  - **Tier 3 (7–29 days):** *Blaze* (vibrant animated flame with subtle glow).
  - **Tier 4 (30+ days):** *Forge Core* (electric violet/indigo forged fire with crown/mastery badge).
- [ ] When `missedYesterday` is true, habit card renders an eye-catching "⚡ Never Miss Twice: Rebound Priority" badge.
- [ ] If `downscaledDaysRemaining > 0`, card shows the 2-minute gateway auto-downscaler status.
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

### US-003: Core Theme Engine & CSS Variable Foundation (Dark, Light, Sepia)
**Description:** As a developer and user, I want the application styles to rely on semantic CSS variables without hardcoded background overrides so that themes render with high contrast and zero visual glitches.

**Acceptance Criteria:**
- [ ] Remove hardcoded `#060609 !important` in `src/app/layout.tsx` and replace with dynamic theme class / `data-theme` attribute on `<html>`.
- [ ] `globals.css` defines complete semantic variables for `obsidian`, `light`, and `sepia`:
  - `--bg-primary`, `--bg-elevated`, `--bg-nav`, `--bg-modal`, `--bg-input`
  - `--border-subtle`, `--border-strong`
  - `--text-primary`, `--text-secondary`, `--text-muted`
- [ ] Light mode provides minimum 4.5:1 WCAG AA contrast for body text against backgrounds.
- [ ] Theme selection persists in `localStorage` (`forge_theme`) and applies immediately on page load to prevent theme flash (FOUC).
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

### US-004: Dynamic Accent Color Palette System
**Description:** As a user, I want to customize my primary accent color across ForgeOS so that the workspace matches my aesthetic preference.

**Acceptance Criteria:**
- [ ] Support 4 curated accent palettes:
  - **Indigo Craft** (Default: `#6366f1`)
  - **Amber Forge** (`#f59e0b`)
  - **Emerald Vitality** (`#10b981`)
  - **Rose Mastery** (`#f43f5e`)
- [ ] Accent color dynamically updates `--accent-primary`, `--accent-glow`, button gradients, and focus rings.
- [ ] Selected accent is saved in `localStorage` (`forge_accent`) and synced to user preferences.
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

### US-005: Theme & Palette Switcher Modal with Pro Gating
**Description:** As a user, I want a theme picker in the top bar to preview and toggle themes, with premium themes cleanly gated behind ForgeOS Pro.

**Acceptance Criteria:**
- [ ] Add a `Palette` icon button in the header/top navbar that opens the Theme Settings drawer or modal.
- [ ] Theme switcher displays previews for:
  - Themes: Obsidian (Dark), Daylight (Light), Sepia (Parchment).
  - Accents: Indigo, Amber, Emerald, Rose.
- [ ] Default Obsidian theme is free and accessible to all users.
- [ ] For non-Pro users:
  - Light, Sepia, and custom accents display a subtle gold lock icon (`Lock`).
  - Clicking a locked theme triggers the `ProUpgradeCard` modal with a clear call-to-action.
- [ ] For Pro users (unlocked via Razorpay, Google Play, or Beta Tester email):
  - Selecting any theme or accent applies it instantly with smooth CSS transitions.
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

### US-006: Android Native Bridge & Viewport Theme Synchronization
**Description:** As an Android user, I want the native status bar, navigation bar, and splash screen colors to adjust when switching themes so that the app feels 100% native.

**Acceptance Criteria:**
- [ ] Updating theme dynamically updates the `<meta name="theme-color">` tag.
- [ ] Invoke `window.ForgeAndroidBridge?.setSystemBarTheme(theme, isDark)` if available:
  - Sets Android status bar icons to dark in light mode, and light in dark mode.
  - Updates navigation bar background color to match `--bg-primary`.
- [ ] Fallback gracefully when running in standard web browsers where `ForgeAndroidBridge` is undefined.
- [ ] Typecheck/lint passes.
- [ ] **[UI]** Verify in browser using dev-browser skill.

---

## 4. Functional Requirements

- **FR-1:** The habit card MUST render a 7-day history chain derived from existing `SessionLog` records and habit completion timestamps.
- **FR-2:** Clicking the 2-minute gateway timer on any day MUST mark that day's node as completed.
- **FR-3:** When a habit's `missedYesterday` is `true`, the card MUST render an amber Rebound Priority indicator until the day's session is logged.
- **FR-4:** Theme switching MUST NOT cause page reloads or layout shift.
- **FR-5:** The `<html>` element MUST receive `data-theme="obsidian|light|sepia"` and `data-accent="indigo|amber|emerald|rose"`.
- **FR-6:** The theme preference MUST be checked against `checkUserProStatus(userId)` or client-side `isPro` state before saving non-default themes.
- **FR-7:** The native Android bridge MUST be notified of theme switches without throwing JavaScript errors if the bridge is absent.

---

## 5. Non-Goals (Out of Scope)

- **Arbitrary Hex Color Picker:** Users will select from the 4 curated, accessibility-tested accent palettes, not arbitrary RGB pickers.
- **Theme-Specific Habit Icons:** Icons remain consistent across themes; only container backgrounds, borders, and accents shift.
- **Custom Fonts per Theme:** Typography remains standard Inter / SF Pro across all themes.

---

## 6. Design & Architecture Details

### Color Tokens Reference:

| Token | Obsidian (Dark) | Daylight (Light) | Sepia (Parchment) |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#060609` | `#f8fafc` | `#f4ecd8` |
| `--bg-elevated` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.85)` | `rgba(255,251,240,0.72)` |
| `--bg-modal` | `#0d0e15` | `#ffffff` | `#f7eedc` |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `rgba(15,23,42,0.08)` | `rgba(120,90,50,0.15)` |
| `--text-primary` | `#f4f4f5` | `#0f172a` | `#2b2118` |
| `--text-secondary`| `#a1a1aa` | `#475569` | `#5c4938` |

### Accent Palettes Reference:
- **Indigo:** Primary `#6366f1`, Glow `rgba(99,102,241,0.25)`
- **Amber:** Primary `#f59e0b`, Glow `rgba(245,158,11,0.25)`
- **Emerald:** Primary `#10b981`, Glow `rgba(16,185,129,0.25)`
- **Rose:** Primary `#f43f5e`, Glow `rgba(244,63,94,0.25)`

---

## 7. Next Steps

1. Review and validate this PRD.
2. Run `/ralph` (or ask to *"convert this PRD to ralph format"*) to generate atomic, iteration-sized stories in `scripts/ralph/prd.json`.
3. Launch the autonomous Ralph loop via `/goal` or `.\scripts\ralph\ralph.ps1`.
