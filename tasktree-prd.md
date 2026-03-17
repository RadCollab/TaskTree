# TaskTree — Product Requirements Document

> **Version:** 1.0 — Phase 1 Scope  
> **Last Updated:** March 2026  
> **Status:** Active Development

---

## 1. Product Overview

TaskTree is a cross-platform productivity app designed for people with ADHD or focus challenges. It gamifies the task management process through an interactive bird collection mechanic powered by Rive animations. The core loop: completing tasks fills a "Bird Happiness" meter → the birds celebrate → you earn hearts → hearts unlock trees, birds, and cosmetic traits.

This PRD covers **Phase 1**: the foundational todo list manager, scheduling system, and settings. Phase 2 (Rive integration, bird collection game) is outlined at a high level in Section 9 to ensure Phase 1 architecture doesn't create blockers.

---

## 2. Platform Targets

| Platform | Target Experience |
|---|---|
| iOS | Native via React Native / Expo |
| Android | Native via React Native / Expo |
| Web | Desktop-first, fully responsive — accessible without downloading the native app |

The web experience is not a marketing page. It is the full application rendered responsively in a browser, prioritizing desktop layout while being usable on mobile browsers.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native + Expo | Replaces previous Flutter build entirely |
| Web | Expo Web / React Native Web | Same codebase targets web via responsive layouts |
| Database | Supabase (new instance) | Separate from the existing production DB; may reconnect to that DB in the future once the schema is reconciled |
| Auth | Supabase Auth — Email + Password only | Social login deferred |
| Local Storage | AsyncStorage / MMKV | Full local-first operation before sign-up |
| Animations (Phase 2) | Rive | Stubbed in Phase 1; integrated in Phase 2 |
| Primary Font | Nunito Sans | All UI text; loaded via Google Fonts or bundled |

### 3.1 Design System — Color Variables

All colors are defined as semantic design tokens derived from the Figma source of truth.

**Surface Colors:**

| Token | Hex | Usage |
|---|---|---|
| `BG` | `#f7f5ee` | Page / app background (warm off-white) |
| `Card` | `#ffffff` | Card and item backgrounds |
| `Sheet` | `#f7f7f5` | Bottom sheet and modal backgrounds |

**Content & Border Colors:**

| Token | Hex | Usage |
|---|---|---|
| `Content` | `#312a47` | Primary text and icon color (dark purple-gray) |
| `Border` | `#e8e7e3` | Standard borders and dividers |
| `Border DK` | `#d4d3cf` | Emphasized borders (e.g., active states, heavier dividers) |

**List Type Colors:**

Used for the color picker grid in the Style Tag flow (§6.5) and list type indicators. 17 swatches, ordered as they appear in the Figma palette:

| # | Token | Hex | Swatch Name |
|---|---|---|---|
| 2 | `Types/2-red` | `#b73c3c` | Red |
| 3 | `Types/3-orange` | `#b7613c` | Orange |
| 4 | `Types/4-yellow` | `#c19224` | Yellow |
| 5 | `Types/5-lime` | `#a9b11d` | Lime |
| 6 | `Types/6-avocado` | `#62911b` | Avocado |
| 7 | `Types/7-green` | `#5eaf43` | Green |
| 8 | `Types/8-forest` | `#2e6d34` | Forest |
| 9 | `Types/9-mint` | `#229558` | Mint |
| 10 | `Types/10-teal` | `#149882` | Teal |
| 11 | `Types/11-aqua` | `#2d8ba3` | Aqua |
| 12 | `Types/12-blue` | `#114486` | Blue |
| 13 | `Types/13-royal` | `#1a239f` | Royal |
| 14 | `Types/14-indigo` | `#492e97` | Indigo |
| 15 | `Types/15-grape` | `#691ba0` | Grape |
| 16 | `Types/16-magenta` | `#a721ae` | Magenta |
| 17 | `Types/17-pink` | `#c0188a` | Pink |
| 18 | `Types/18-rose` | `#a82d56` | Rose |

> **Note:** Position 1 in the palette (likely `Content` / `#312a47` or black) is visible in the Figma color grid but not defined as a separate type token. The color picker grid also includes `Content` as the first swatch.

### 3.2 Design System — Icons

List icons are selected in the Style Tag flow (§6.5). Each icon is available in **outlined** and **filled** variants (two rows in the picker grid).

**9 icon shapes:**

`triangle` · `diamond` · `pentagon` · `circle` · `star` · `hexagon` · `square` · `bookmark` · `heart`

### 3.3 Design System — Typography

All text uses **Nunito Sans** (Google Fonts). Five named text styles are defined:

| Style Name | Weight | Size | Line Height | Usage |
|---|---|---|---|---|
| `Headline Medium` | Black (900) | 16px | 100% (auto) | Section headers, modal titles |
| `Body Large` | Black (900) | 13px | 100% (auto) | Emphasized body text, bold labels |
| `Body Small` | Bold (700) | 13px | 16px | Secondary body text, descriptions |
| `Title Medium` | Regular (400) | 16px | 20px | List names, larger UI labels |
| `Title Small` | Regular (400) | 13px | 16px | Item titles, standard UI text |

All styles use `letter-spacing: 0`.

### 3.4 Design System — Effects

| Effect Name | Type | Value | Usage |
|---|---|---|---|
| `nav` | Drop Shadow | `rgba(0, 0, 0, 0.07)` · offset `0 1.22px` · blur `15px` · spread `0` | Navigation bar / tab bar shadow |

---

## 4. Authentication & Data Strategy

### 4.1 Local-First Model

The app runs entirely on local storage until the user explicitly creates an account. There is **no sign-up gate at launch** — a user can open the app and start using it immediately.

- All tasks, events, lists, and settings persist locally via AsyncStorage or MMKV.
- The user is never prompted to sign up unless they initiate it.
- Sign-up will be surfaced in Settings ("Back up your data / sync across devices").

### 4.2 Sign-Up & Sync

When a user signs up:
1. All existing local data is migrated and uploaded to Supabase.
2. The app switches from local storage to Supabase as the source of truth.
3. If the Supabase sync fails mid-migration, local data is preserved and the migration retries.

### 4.3 Auth Scope (Phase 1)

- Email + password only.
- Password reset via email link.
- No social login.
- No onboarding flow until sign-up.
- Session persists until the user logs out.

---

## 5. Data Model

### 5.1 Core Concept: Everything Is a Task

All items share a base `Task` entity. The `type` field governs scheduling behavior. This keeps the data model flat and consistent.

```
Task {
  id: uuid
  list_id: uuid              // Which list this belongs to
  title: string
  notes: string?
  type: "task" | "event"     // Controls scheduling behavior
  is_priority: boolean       // Floats to top; shows every day until completed
  is_completed: boolean
  completed_at: timestamp?
  date: date?                // The day this task is assigned to
  start_time: time?
  duration_minutes: number?  // Used by auto-scheduler
  end_time: time?            // Derived or manual (events only)
  is_all_day: boolean        // Events only
  repeats: boolean
  repeat_config: json?       // Frequency, days, end date
  notification_enabled: boolean
  created_at: timestamp
  updated_at: timestamp
  user_id: uuid?             // Null when local-only
}
```

### 5.2 Scheduling Behavior by Type

| Behavior | Task | Event |
|---|---|---|
| Auto-scheduler can move it | ✅ | ❌ — Events are anchors |
| Has start time & duration | Optional | Required (or All Day) |
| Has end time | Derived from duration | Required |
| Shows as "All Day" | No | Optional |
| Moves to auto-scheduling queue | Yes | No — fixed in place |

### 5.3 Lists

Lists are user-created groupings. Two system lists exist by default and cannot be deleted.

```
List {
  id: uuid
  name: string
  color: string              // Hex
  icon: string               // Icon key from supported icon set
  behavior: "task" | "event" // Items in this list default to this type
  is_system: boolean         // True for "Tasks" and "Events" defaults
  sort_order: number
  user_id: uuid?
}
```

**System Lists:**
- **Tasks** — behavior: `task`
- **Events** — behavior: `event`

**Custom Lists** — user-created, can be styled (color + icon) and configured to behave like either a task or an event for scheduling purposes.

### 5.4 User Settings

```
UserSettings {
  id: uuid
  user_id: uuid?
  theme: "system" | "light" | "dark"
  font: "default" | "open-dyslexic" | "lexend" | "comic-neue" | "arial"
  typical_work_days: string[]      // ["Mo", "Tu", "We", "Th", "Fr"]
  typical_start_time: time         // e.g. "09:00"
  typical_end_time: time           // e.g. "17:00"
  animations_tree: boolean
  animations_birdex: boolean
  animations_chat: boolean
  dyslexia_mode: boolean
}
```

---

## 6. Core Features — Phase 1

### 6.1 Navigation Structure

The app has two primary views accessible via a persistent tab bar at the bottom:

| Tab | Icon | Description |
|---|---|---|
| Schedule | Calendar icon | Today's task/event list in time order |
| Planning | Pencil/list icon | Full backlog, organized by list |

Above the tab bar on the Schedule view, a Rive animation panel occupies the top half of the screen (Phase 2). In Phase 1 this area shows the RIVE wordmark / placeholder.

---

### 6.2 Schedule Tab

The daily view. Shows all tasks and events assigned to today, in scheduled order.

**Item Types Displayed:**
- **Task** — Circle checkbox on the left. Tap to complete.
- **Event** — Square checkbox. Bold "All Day" label if applicable.
- **Priority Task** — Circle with a `!` indicator. Appears every day until completed. Acts like a persistent sticky task.

**Interactions:**
- Tap item → inline expansion or detail sheet (TBD based on UX testing)
- Long press → multi-select mode
- Tap circle/square → mark complete (animates out to "Completed" section)
- `+ Add` button → quick-add sheet (title, type, time)
- Swipe left → delete with confirmation
- Swipe right → mark priority

**Completed Section:**
- Collapsed by default, expandable with a chevron
- Shows all items completed today
- No persistent history tracking in Phase 1 (history/streaks deferred)

**Header:**
- Displays app icon/logo area
- Stats row: hearts count, tree count, bird count, friend count (placeholder values in Phase 1)
- Settings gear icon

---

### 6.3 Planning Tab

The backlog view. Shows all tasks across all lists, not filtered by date.

**Layout:**
- Lists displayed as collapsible sections
- Each list shows its color dot, icon, name, and item count badge with a `>` chevron
- Items within each list show title, recurrence info, and duration if set
- `+ Add Task` / `+ Add Event` per list section
- `Manage Lists` button at bottom

**Multi-Select Mode:**
- Activated by tapping the icon on the left side of any item
- Selected items can be batch-assigned to a date → "Add to Schedule"
- `Clear` button deselects all
- `Add to Schedule` button confirms and assigns selected items to today (or a chosen date)

**Manage Lists Sheet:**
- Shows all lists with their icon and behavior type label
- Tap `Edit` on any list → opens Style Tag flow (see 6.5)
- `+ Add New` → opens new list creation flow
- System lists (Tasks, Events) are shown but cannot be deleted

---

### 6.4 Auto Schedule

Accessible from the Schedule tab header (icon button). Opens a modal that automatically assigns start times to unscheduled tasks in today's schedule.

**Modal Options:**
- **Schedule by Priority** (toggle) — Priority tasks are scheduled first.
- **Schedule by Momentum** (toggle) — Tasks with shorter duration are scheduled first to build momentum.

> **Note for developer:** The full scheduling algorithm logic will be added here by the product owner. The implementation should expose a clean function `autoSchedule(tasks, events, settings, options)` that returns an ordered list of tasks with assigned start times. Events are treated as immovable anchors — the algorithm schedules tasks around them.

**Actions:**
- `Cancel` — dismiss with no changes
- `Confirm` — apply the scheduled times to today's tasks

---

### 6.5 Custom List Creation (Style Tag Flow)

A multi-step sheet flow for creating or editing a custom list.

**Step 1 of 3 — Style Tag**
- Icon picker: tap `+` to open icon selection grid (9 shapes: triangle, diamond, pentagon, circle, star, hexagon, square, bookmark, heart — each in outlined and filled variants; see §3.2)
- Name field: text input with placeholder "Stand up..."
- Color picker: grid of ~20 color swatches (black, reds, oranges, yellows, greens, blues, purples, pinks)
- `Cancel` / `Next`

**Step 2 of 3 — How does this Tag act?**
- User selects whether items in this list behave like a **Task** or an **Event**
- Task: "Has start time & duration. Will move in auto-scheduling."
- Event: "Has start & end time, or 'all day'. Will NOT move in auto-scheduling."
- `Back` / `Next`

**Step 3 of 3 — Set Defaults**
- These defaults apply to new items added to this list
- **Priority: show until complete** (toggle)
- **Length** (time picker — e.g., 5 min / 30 min) — only shown if behavior is "task"
- **Repeats** (toggle)
- **Notification** (toggle)
- `Back` / `Save`

---

### 6.6 Settings

Settings is accessible from the gear icon on the Schedule header. It is a sheet/modal, not a full navigation screen.

**Top Actions:**
- `Suggest Features` button
- `Report a Bug` button
- `Logout` (top right — only visible when signed in)

**Settings Sections:**

**Theme (Font Size / Appearance)**
- Font size selector: Small (A) / Default (A) / Large (A)
- Dark / Light Mode toggle
- Work Time (opens sub-sheet)
- Accessibility Settings (opens sub-sheet)

**Delete Account**
- Red destructive text link at bottom
- Tapping opens a confirmation sheet: "This Will Delete All Of Your Data — You can always create another account, though."
- Two options: `Cancel` / `Confirm Deletion` (destructive)
- Secondary system confirmation dialog before executing

**Work Time Sub-Sheet:**
- Title: "Work Time"
- Typical Work Days: pill toggles for Mo / Tu / We / Th / Fr / Sa / Su (multi-select)
- Typical Start Time: time input (default 9:00am)
- Typical End Time: time input (default 5:00pm)
- `Cancel` / `Save`
- Used by the auto-scheduler to know the available window for scheduling tasks

**Accessibility Sub-Sheet:**
- Title: "Accessibility"
- Tree Animations On/Off (toggle)
- Birdex Animations On/Off (toggle)
- Chat Animations On/Off (toggle)
- Dyslexia Mode On/Off (toggle)
- Select Font dropdown: Open Dyslexic / Lexend / Comic Neue / Arial
  - Font URLs:
    - Open Dyslexic: https://opendyslexic.org/
    - Lexend: https://fonts.google.com/specimen/Lexend
    - Comic Neue: https://fonts.google.com/specimen/Comic+Neue
    - Arial: System Font
- `Cancel` / `Save`

---

## 7. UX Patterns & Interaction Standards

### 7.1 Sheet System
All secondary views (auto schedule, list creation, settings, work time, accessibility) open as bottom sheets with a drag handle. They can be dismissed by dragging down or tapping a cancel/close button.

### 7.2 Multi-Select
Tapping the left icon of any planning item enters multi-select mode. The bottom bar transitions to show `Clear` and `Add to Schedule` actions. Exiting multi-select requires either completing the action or tapping `Clear`.

### 7.3 Completion Animation
When a task is marked complete, it should animate gracefully out of the active list and into the Completed section. In Phase 2 this feeds the Bird Happiness meter. The completion event should fire a named callback (`onTaskComplete`) that Phase 2 will hook into.

### 7.4 Local State First
All UI interactions update local state immediately (optimistic updates). Supabase sync is a background operation. If the user is not signed in, there is no sync.

### 7.5 Empty States
Each list and the schedule view should have thoughtful empty states (not just blank screens). Phase 1 can use simple illustrated placeholders. Phase 2 will replace these with Rive animations.

---

## 8. Web Responsive Layout

The app targets desktop-first on web. Breakpoint strategy:

| Breakpoint | Layout |
|---|---|
| `< 768px` | Mobile layout — same as native app |
| `768px – 1200px` | Two-column: bird panel left, schedule/planning right |
| `> 1200px` | Three-column: bird panel, schedule, planning side by side |

Navigation on web uses a left sidebar instead of a bottom tab bar at desktop widths. The bird panel (Phase 2 Rive) remains a persistent fixture on the left at desktop sizes.

---

## 9. Phase 2 — Architecture Awareness (High Level)

Phase 1 must not create architectural dead ends for these Phase 2 systems.

### 9.1 Rive Integration
- The top ~50% of the Schedule screen is reserved for the Rive animation canvas.
- Phase 1 should render a static placeholder in this space.
- The Rive canvas will receive real-time data props: `happinessMeter (0–100)`, `birdCount`, `treeCount`.
- Expose a global event bus or context that Phase 2 can subscribe to: `onTaskComplete`, `onHappinessUpdate`, `onPartyTriggered`.

### 9.2 Bird Happiness Meter
- Completing tasks increments the Bird Happiness meter.
- At 100%, a "party" event fires, birds animate, and the user receives hearts.
- Hearts are the in-app currency for the collection game.
- The data model should include a `UserProgress` table: `happiness_current`, `happiness_total_earned`, `hearts`, `hearts_spent`.

### 9.3 Bird Collection
- Three sub-tabs: **Birds**, **Trees**, **Traits**
- **Birds**: list of owned birds. Each bird has a name (user-editable), traits array, and appearance config.
- **Trees**: owned trees with unlockable color and shape variants.
- **Traits**: daily shop with 3 random traits of random rarity. Purchasable with hearts. Restockable.
- All collection data lives in the `Collection` schema (separate from task data).

### 9.4 Birdex (Bird Encyclopedia)
- A discoverable/completable bird catalog.
- Birds are discovered by meeting unlock conditions.
- Phase 1: schema stub only, no UI.

---

## 10. Out of Scope — Phase 1

The following are explicitly deferred and should not be built in Phase 1:

- Rive animation integration
- Bird collection UI (Birds, Trees, Traits tabs)
- Bird Happiness meter and hearts system
- Birdex
- Social features (friends, sharing)
- Push notifications (UI toggle exists in Settings but does not need to be functional)
- Repeating tasks (UI exists in list creation but implementation is deferred)
- Task history / streaks
- Social login (Google, Apple)
- Onboarding flow

---

## 11. Open Questions / To Be Defined

- [ ] Auto-schedule algorithm — **to be filled in by product owner**
- [ ] Exact animation spec for task completion (duration, easing, behavior)
- [ ] Quick-add sheet field spec (what fields appear on initial add vs detail view)
- [ ] Item detail view — sheet or inline expansion?
- [ ] Whether duration is required or optional for Tasks in auto-schedule
- [ ] Web desktop three-column layout — confirm whether Planning tab is always visible or still tab-switched

---

## 12. Success Criteria — Phase 1

Phase 1 is complete when:

1. A user can open the app with no account and immediately start adding tasks and events.
2. Tasks and events are organized into lists (Tasks, Events, plus user-created custom lists).
3. Auto-schedule successfully assigns start times to tasks working around fixed events.
4. The app runs on iOS, Android, and web from a single codebase.
5. Local-first data persists across app restarts without an account.
6. Signing up migrates all local data to Supabase without data loss.
7. Settings (theme, font, work time, accessibility) persist and apply globally.
8. The Rive panel area is reserved and properly laid out, ready for Phase 2 integration.
