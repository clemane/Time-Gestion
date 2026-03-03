# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of the Time Gestion app with Terre & Sauge palette, DM Serif Display + Plus Jakarta Sans typography, floating tab bar, responsive desktop sidebar, compact headers, and simplified UX.

**Architecture:** CSS-first redesign — replace design tokens and global styles first, then update layout components (AppShell, navigation), then restyle each view. No store/logic changes except: remove SearchView route (search becomes inline), simplify note creation flow (remove bottom sheet intermediary).

**Tech Stack:** Vue 3, CSS custom properties, Google Fonts (DM Serif Display, Plus Jakarta Sans), Lucide icons, existing Pinia stores unchanged.

---

### Task 1: Add Google Fonts and update index.html

**Files:**
- Modify: `apps/frontend/index.html`

**Step 1: Add Google Fonts preconnect and stylesheet links**

Add to `<head>` before the inline script:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Step 2: Update the inline theme-color defaults**

In the inline script, change the light fallback from `#F2F2F7` to `#FAF8F5` and dark from `#000000` to `#1C1A17`.

Also update the `<meta name="theme-color">` default to `#FAF8F5`.

**Step 3: Verify fonts load**

Run: `cd apps/frontend && npx vite --open`
Expected: Page loads with new fonts visible in Network tab.

**Step 4: Commit**

```
feat(ui): add DM Serif Display and Plus Jakarta Sans fonts
```

---

### Task 2: Replace global CSS design tokens and base styles

**Files:**
- Modify: `apps/frontend/src/styles/main.css`

**Step 1: Replace the entire `:root` block**

Replace the `:root` CSS variables with the Terre & Sauge palette:

```css
:root {
  /* Terre & Sauge — Primary */
  --color-primary: #7C9A82;
  --color-primary-light: #9AB8A0;
  --color-primary-dark: #5E7D64;
  --color-primary-ghost: rgba(124, 154, 130, 0.12);

  /* Terre & Sauge — Accent */
  --color-accent: #C4856A;
  --color-accent-ghost: rgba(196, 133, 106, 0.12);

  /* Light Theme */
  --color-bg: #FAF8F5;
  --color-bg-secondary: #F0EDE8;
  --color-bg-elevated: #FFFFFF;
  --color-text: #2C2520;
  --color-text-secondary: #8C8279;
  --color-text-tertiary: #B8AFA6;
  --color-border: rgba(44, 37, 32, 0.08);
  --color-border-subtle: rgba(44, 37, 32, 0.04);

  /* Translucent bar — warm tint */
  --bar-bg: rgba(250, 248, 245, 0.88);
  --bar-border: rgba(44, 37, 32, 0.06);
  --bar-blur: 24px;

  /* Glass (backward compat) */
  --glass-bg: rgba(250, 248, 245, 0.88);
  --glass-border: rgba(44, 37, 32, 0.06);
  --glass-blur: 24px;

  /* Semantic */
  --color-danger: #C45C4A;
  --color-danger-ghost: rgba(196, 92, 74, 0.12);
  --color-success: #6B9E76;
  --color-warning: #D4A547;

  /* Radius — organic, generous */
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Shadows — warm-tinted */
  --shadow-xs: 0 1px 2px rgba(44, 37, 32, 0.04);
  --shadow: 0 2px 8px rgba(44, 37, 32, 0.05);
  --shadow-md: 0 4px 20px rgba(44, 37, 32, 0.06);
  --shadow-lg: 0 8px 32px rgba(44, 37, 32, 0.1);
  --shadow-overlay: 0 12px 48px rgba(44, 37, 32, 0.15);

  /* Spacing */
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --nav-height: 64px;

  /* Typography */
  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;

  /* Easings */
  --spring: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Step 2: Update body styles**

```css
body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: -0.01em;
}
```

**Step 3: Update dark theme**

```css
[data-theme="dark"] {
  --color-bg: #1C1A17;
  --color-bg-secondary: #262320;
  --color-bg-elevated: #2E2B27;
  --color-text: #E8E2D9;
  --color-text-secondary: #9C9488;
  --color-text-tertiary: #6B6560;
  --color-border: rgba(232, 226, 217, 0.1);
  --color-border-subtle: rgba(232, 226, 217, 0.05);
  --color-primary-ghost: rgba(124, 154, 130, 0.2);
  --color-accent-ghost: rgba(196, 133, 106, 0.2);
  --color-danger-ghost: rgba(196, 92, 74, 0.2);
  --bar-bg: rgba(28, 26, 23, 0.9);
  --bar-border: rgba(232, 226, 217, 0.08);
  --glass-bg: rgba(28, 26, 23, 0.9);
  --glass-border: rgba(232, 226, 217, 0.08);
  --shadow-xs: none;
  --shadow: none;
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-overlay: 0 12px 48px rgba(0, 0, 0, 0.5);
}
```

**Step 4: Add paper grain texture utility**

After the dark theme block, add:

```css
/* Paper grain texture */
.grain-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

[data-theme="dark"] .grain-bg::before {
  opacity: 0.02;
}
```

**Step 5: Verify dark mode and light mode both render correctly**

Run dev server and toggle themes.

**Step 6: Commit**

```
feat(ui): replace design tokens with Terre & Sauge palette
```

---

### Task 3: Update useTheme composable for new palette

**Files:**
- Modify: `apps/frontend/src/composables/useTheme.ts`

**Step 1: Update ACCENT_PRESETS to match new palette**

Replace the presets array with warm-toned options that complement Terre & Sauge:

```typescript
export const ACCENT_PRESETS: AccentColor[] = [
  { name: 'Sauge', value: '#7C9A82', light: '#9AB8A0', dark: '#5E7D64' },
  { name: 'Terre cuite', value: '#C4856A', light: '#D4A08A', dark: '#A66B52' },
  { name: 'Miel', value: '#D4A547', light: '#E0BD6E', dark: '#B88C32' },
  { name: 'Lavande', value: '#8B7EB8', light: '#A99ACA', dark: '#6E6398' },
  { name: 'Ocean', value: '#5E8C8A', light: '#7EAAA8', dark: '#4A7270' },
  { name: 'Rouille', value: '#B85C4A', light: '#D07A6A', dark: '#9A4838' },
  { name: 'Olive', value: '#8A9A5E', light: '#A4B278', dark: '#6E7E48' },
  { name: 'Prune', value: '#8E5E7A', light: '#AA7E96', dark: '#724A62' },
];
```

**Step 2: Update meta theme-color defaults in the watchEffect**

Change `#F2F2F7` to `#FAF8F5` and `#000000` to `#1C1A17`:

```typescript
const themeColor = theme === 'dark' ? '#1C1A17' : '#FAF8F5';
```

**Step 3: Commit**

```
feat(ui): update accent presets and theme colors for Terre & Sauge
```

---

### Task 4: Redesign AppShell with responsive layout

**Files:**
- Modify: `apps/frontend/src/components/layout/AppShell.vue`

**Step 1: Rewrite the component**

The new AppShell must:
- On mobile/tablet: show content + floating bottom nav
- On desktop (>1024px): show sidebar nav on left + content area on right
- Add grain texture class to body
- Status bar for offline mode stays

```vue
<template>
  <div class="app-shell grain-bg">
    <div class="status-bar" v-if="!isOnline">
      <WifiOff :size="14" />
      <span>Mode hors-ligne</span>
    </div>

    <!-- Desktop sidebar (hidden on mobile) -->
    <aside class="desktop-sidebar">
      <div class="sidebar-brand">
        <span class="brand-mark">TG</span>
        <span class="brand-name">Time Gestion</span>
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: isActive(item.to) }"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="app-content">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import BottomNav from './BottomNav.vue';
import { isOnline } from '@/sync/online';
import { FileText, Calendar, UtensilsCrossed, Settings, WifiOff } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/calendar', label: 'Calendrier', icon: Calendar },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/settings', label: 'Reglages', icon: Settings },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.status-bar {
  background: var(--color-warning);
  color: #2C2520;
  text-align: center;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.desktop-sidebar {
  display: none;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(var(--nav-height) + 24px + var(--safe-area-bottom));
  -webkit-overflow-scrolling: touch;
}

/* ── Desktop layout ── */
@media (min-width: 1025px) {
  .app-shell {
    flex-direction: row;
  }

  .desktop-sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    flex-shrink: 0;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    padding: 24px 12px;
    gap: 32px;
  }

  .app-content {
    flex: 1;
    padding-bottom: 0;
    max-width: 900px;
  }
}

/* ── Sidebar brand ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--color-text);
}

/* ── Sidebar nav links ── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sidebar-link:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.sidebar-link.active {
  background: var(--color-primary-ghost);
  color: var(--color-primary);
}
</style>
```

**Step 2: Verify on mobile and desktop**

Resize browser to check both layouts.

**Step 3: Commit**

```
feat(ui): redesign AppShell with responsive desktop sidebar
```

---

### Task 5: Redesign BottomNav as floating tab bar

**Files:**
- Modify: `apps/frontend/src/components/layout/BottomNav.vue`

**Step 1: Rewrite BottomNav as floating capsule**

The nav becomes a floating pill centered at the bottom. Hidden on desktop (>1024px). 4 items only (no Search).

```vue
<template>
  <nav class="floating-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <component :is="item.icon" :size="20" :stroke-width="isActive(item.to) ? 2.2 : 1.6" />
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import { FileText, Calendar, UtensilsCrossed, Settings } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/calendar', label: 'Calendrier', icon: Calendar },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/settings', label: 'Reglages', icon: Settings },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
</script>

<style scoped>
.floating-nav {
  position: fixed;
  bottom: calc(16px + var(--safe-area-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bar-bg);
  backdrop-filter: blur(var(--bar-blur)) saturate(1.6);
  -webkit-backdrop-filter: blur(var(--bar-blur)) saturate(1.6);
  border: 1px solid var(--bar-border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 16px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 18px;
  transition: color var(--transition-fast), background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active {
  color: white;
  background: var(--color-primary);
}

.nav-label {
  line-height: 1;
}

/* Hide on desktop */
@media (min-width: 1025px) {
  .floating-nav {
    display: none;
  }
}
</style>
```

**Step 2: Verify floating nav appearance**

Check that the capsule is centered, glass effect works, active state shows pill background.

**Step 3: Commit**

```
feat(ui): replace bottom bar with floating tab bar capsule
```

---

### Task 6: Update router — remove search route, update nav order

**Files:**
- Modify: `apps/frontend/src/router/index.ts`
- Modify: `apps/frontend/src/App.vue`

**Step 1: Remove the search route from router**

Remove the `/search` route entry from the routes array. Keep the SearchView file for now (it will be repurposed as inline search later if needed).

**Step 2: Update App.vue navOrder**

Change the nav order to reflect the 4-tab layout:

```typescript
const navOrder: Record<string, number> = {
  '/notes': 0,
  '/calendar': 1,
  '/menu': 2,
  '/settings': 3,
};
```

Also update the child page detection to include `/menu/`:

```typescript
if (path.startsWith('/notes/') || path.startsWith('/settings/') || path.startsWith('/menu/recipes')) {
  return 'slide-left';
}
```

**Step 3: Commit**

```
feat(ui): remove search route, update navigation order
```

---

### Task 7: Redesign NotesView with compact header and inline search

**Files:**
- Modify: `apps/frontend/src/views/NotesView.vue`

**Step 1: Rewrite the template and styles**

Key changes:
- Compact header: `h1` in DM Serif Display at 24px, search icon button in header
- Search: inline expandable field that slides down when tapped (replaces separate search page)
- Remove the bottom sheet for new note creation — FAB directly creates a blank note
- Note cards grouped in rounded card containers
- Category dot indicator instead of colored backgrounds

The script `createNoteWithCategory` logic simplifies to just create a blank note:

```typescript
async function createNote() {
  showNewNoteSheet.value = false;
  const note = await notesStore.create({
    title: 'Nouvelle note',
    calendarId: selectedGroupId.value || undefined,
  });
  router.push(`/notes/${note.id}`);
}
```

Keep the bottom sheet as an option but make the FAB default behavior create a blank note. Long-press or secondary action opens category picker.

Style changes:
- `.notes-header h1` → `font-family: var(--font-display); font-size: 24px; font-weight: 400;`
- Search bar gets warm styling with `background: var(--color-bg-secondary); border-radius: var(--radius);`
- Group chips use `background: var(--color-bg-elevated)` with subtle border
- Active chip uses `background: var(--color-primary); color: white;`
- FAB uses `background: var(--color-primary); border-radius: 16px;` (slightly squircle)
- Sheet gets warm overlay `background: rgba(44, 37, 32, 0.3)`

**Step 2: Add expandable search toggle**

Add a `showSearch` ref. Header shows a search icon; when tapped, a search field slides down below the header with `v-if` and `Transition`.

**Step 3: Verify notes list renders with new styles**

**Step 4: Commit**

```
feat(ui): redesign NotesView with compact header and warm palette
```

---

### Task 8: Redesign NoteCard component

**Files:**
- Modify: `apps/frontend/src/components/notes/NoteCard.vue`

**Step 1: Add category dot indicator**

Add a small colored dot on the left side of the card if the note has a category:

```vue
<div class="category-dot" v-if="category" :style="{ background: category.style?.backgroundColor || 'var(--color-primary)' }"></div>
```

Style changes:
- Card padding: `14px 16px`
- Title: `font-family: var(--font-body); font-size: 15px; font-weight: 600;`
- Subtitle text: `font-size: 13px;`
- Category dot: `width: 4px; border-radius: 2px; align-self: stretch;` (vertical bar on left)
- Remove `min-height: 64px` — let cards be compact

**Step 2: Commit**

```
feat(ui): redesign NoteCard with category dot indicator
```

---

### Task 9: Redesign NoteDetailView

**Files:**
- Modify: `apps/frontend/src/views/NoteDetailView.vue`

**Step 1: Update styles for warm palette**

Key changes:
- Background: `var(--color-bg-elevated)` instead of hardcoded `#ffffff`
- Header border: use `var(--color-border)` instead of hardcoded `rgba(0,0,0,0.12)`
- Title font: `font-family: var(--font-display); font-size: 26px; font-weight: 400;`
- Quick action chips: use `background: var(--color-bg-secondary); border-radius: var(--radius-full); padding: 6px 12px;` instead of bare text
- Modal backgrounds: use `var(--color-bg-elevated)` instead of hardcoded `#ffffff`
- Dropdown background: same
- All hardcoded `rgba(0,0,0,...)` become `var(--color-border)` or semantic variables

**Step 2: Commit**

```
feat(ui): redesign NoteDetailView with warm palette
```

---

### Task 10: Redesign CalendarView

**Files:**
- Modify: `apps/frontend/src/views/CalendarView.vue`

**Step 1: Update header and tabs**

- Header: `font-family: var(--font-display); font-size: 24px; font-weight: 400;`
- Segmented control gets organic pill styling:
  - `border-radius: var(--radius-full);`
  - Active tab: `background: var(--color-primary); color: white; border-radius: var(--radius-full);`
  - Inactive: `color: var(--color-text-secondary);`
- Group chips: warm styling matching NotesView

**Step 2: Update day detail and FAB**

- Day items: `border-radius: var(--radius);` grouped container
- FAB: `border-radius: 16px;` squircle style matching NotesView

**Step 3: Commit**

```
feat(ui): redesign CalendarView with organic segmented control
```

---

### Task 11: Redesign MonthView, WeekView, AgendaView calendar sub-components

**Files:**
- Modify: `apps/frontend/src/components/calendar/MonthView.vue`
- Modify: `apps/frontend/src/components/calendar/WeekView.vue`
- Modify: `apps/frontend/src/components/calendar/AgendaView.vue`

**Step 1: Update MonthView**

- Day cells: use `var(--font-body)` font
- Selected day: `background: var(--color-primary); color: white; border-radius: var(--radius-full);`
- Today indicator: `color: var(--color-accent);`
- Event dots: small colored dots below date numbers

**Step 2: Update WeekView**

- Time column: `color: var(--color-text-tertiary); font-size: 12px;`
- Event blocks: `border-radius: var(--radius); background: var(--color-primary-ghost);`

**Step 3: Update AgendaView**

- Section headers: `font-family: var(--font-display);`
- Event rows: warm card styling with subtle borders

**Step 4: Commit**

```
feat(ui): redesign calendar sub-views with warm palette
```

---

### Task 12: Redesign EventForm modal

**Files:**
- Modify: `apps/frontend/src/components/calendar/EventForm.vue`

**Step 1: Update form styling**

- Modal overlay: `background: rgba(44, 37, 32, 0.3);`
- Form container: `background: var(--color-bg-elevated); border-radius: var(--radius-xl);`
- Input fields: `border-radius: var(--radius); border: 1px solid var(--color-border);`
- Labels: `font-size: 13px; font-weight: 600; color: var(--color-text-secondary);`
- Primary button: `background: var(--color-primary); border-radius: var(--radius);`

**Step 2: Commit**

```
feat(ui): redesign EventForm with warm styling
```

---

### Task 13: Redesign MenuView (recipes, planning, shopping)

**Files:**
- Modify: `apps/frontend/src/views/MenuView.vue`

**Step 1: Update header and tabs**

- Header title: `font-family: var(--font-display); font-size: 24px; font-weight: 400;`
- Sub-tabs (Recettes/Planning/Courses): organic pill segment like CalendarView
- Search bar: warm `background: var(--color-bg-elevated);` with subtle border

**Step 2: Update recipe grid**

- Grid gap: `16px`
- On tablet (≥768px): `grid-template-columns: repeat(3, 1fr);`

**Step 3: Update shopping list**

- Shopping items: rounded checkboxes (circular) with satisfying fill animation
- Action buttons: `border-radius: var(--radius);` with warm colors
- Manual add input: warm styling

**Step 4: Update empty states**

- Icon color: `var(--color-text-tertiary)`
- Title: `font-family: var(--font-display);`

**Step 5: Commit**

```
feat(ui): redesign MenuView with warm palette and organic pills
```

---

### Task 14: Redesign menu sub-components

**Files:**
- Modify: `apps/frontend/src/components/menu/RecipeCard.vue`
- Modify: `apps/frontend/src/components/menu/MealSlotCard.vue`
- Modify: `apps/frontend/src/components/menu/WeekNavigator.vue`
- Modify: `apps/frontend/src/components/menu/ShoppingItemRow.vue`
- Modify: `apps/frontend/src/components/menu/RecipePicker.vue`
- Modify: `apps/frontend/src/components/menu/TagsInput.vue`

**Step 1: Update RecipeCard**

- Card: `border-radius: var(--radius-lg); background: var(--color-bg-elevated); box-shadow: var(--shadow);`
- Image placeholder: use a warm gradient `linear-gradient(135deg, var(--color-bg-secondary), var(--color-border))` with a subtle utensil icon
- Title: `font-family: var(--font-body); font-weight: 600;`
- Favorite heart: `color: var(--color-accent);` when active

**Step 2: Update MealSlotCard**

- Warm card styling with left accent border in `var(--color-accent)`

**Step 3: Update WeekNavigator**

- Navigation arrows: `color: var(--color-primary);`
- Week label: `font-family: var(--font-display);`

**Step 4: Update ShoppingItemRow**

- Checkbox: circular, `border: 2px solid var(--color-border);` → checked: `background: var(--color-primary);`
- Checked text: `text-decoration: line-through; color: var(--color-text-tertiary);`

**Step 5: Update RecipePicker and TagsInput**

- Modal overlay warm
- Tags: `background: var(--color-bg-secondary); border-radius: var(--radius-full);`

**Step 6: Commit**

```
feat(ui): redesign menu sub-components with warm palette
```

---

### Task 15: Redesign RecipeFormView and RecipeDetailView

**Files:**
- Modify: `apps/frontend/src/views/RecipeFormView.vue`
- Modify: `apps/frontend/src/views/RecipeDetailView.vue`

**Step 1: Update RecipeFormView**

- Form fields: warm border styling
- Section headers: `font-family: var(--font-display);`
- Ingredients list: warm card container

**Step 2: Update RecipeDetailView**

- Header image area: warm gradient placeholder
- Title: `font-family: var(--font-display);`
- Ingredients/instructions sections: warm cards

**Step 3: Commit**

```
feat(ui): redesign recipe views with warm palette
```

---

### Task 16: Redesign SettingsView

**Files:**
- Modify: `apps/frontend/src/views/SettingsView.vue`

**Step 1: Update header**

- Title: `font-family: var(--font-display); font-size: 24px; font-weight: 400;`

**Step 2: Update user card**

- Avatar: `background: var(--color-primary);` instead of gray
- Warm card container

**Step 3: Update theme card**

- Segmented control: organic pill style
- Accent swatches: updated to match new ACCENT_PRESETS colors

**Step 4: Update toggle switch**

- Off state: `background: var(--color-bg-secondary);`
- On state: `background: var(--color-primary);`

**Step 5: Update dialog**

- Overlay: `background: rgba(44, 37, 32, 0.3);`
- Dialog box: `border-radius: var(--radius-lg);`
- Buttons: use `var(--color-primary)` and `var(--color-danger)`

**Step 6: Commit**

```
feat(ui): redesign SettingsView with warm palette
```

---

### Task 17: Redesign CategoryManagerView

**Files:**
- Modify: `apps/frontend/src/views/CategoryManagerView.vue`

**Step 1: Update styles**

- Header: compact, DM Serif Display
- Category rows: warm card container
- Edit/delete buttons: warm accent colors
- Add form: warm input styling

**Step 2: Commit**

```
feat(ui): redesign CategoryManagerView with warm palette
```

---

### Task 18: Redesign auth pages (Login, Register)

**Files:**
- Modify: `apps/frontend/src/views/LoginView.vue`
- Modify: `apps/frontend/src/views/RegisterView.vue`

**Step 1: Update LoginView**

- Background: add subtle warm gradient `background: linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);`
- Auth card: `border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);`
- Logo: `background: var(--color-primary); border-radius: var(--radius-lg);`
- Title "Time Gestion": `font-family: var(--font-display); font-size: 24px; font-weight: 400;`
- Input fields: `border-radius: var(--radius); border: 1px solid var(--color-border);`
- Primary button: `background: var(--color-primary); border-radius: var(--radius);`
- Links: `color: var(--color-primary);`

**Step 2: Update RegisterView**

Same style changes as LoginView — both share identical CSS structure.

**Step 3: Commit**

```
feat(ui): redesign auth pages with warm palette and serif branding
```

---

### Task 19: Redesign UI utility components

**Files:**
- Modify: `apps/frontend/src/components/ui/EmptyState.vue`
- Modify: `apps/frontend/src/components/ui/SkeletonCard.vue`

**Step 1: Update EmptyState**

- Title: `font-family: var(--font-display); font-size: 18px;`
- Description: `color: var(--color-text-tertiary);`
- Action button: `background: var(--color-primary); border-radius: var(--radius);`

**Step 2: Update SkeletonCard**

- Shimmer gradient: use warm tones `var(--color-bg-secondary)` to `var(--color-bg)` cycle
- Card shape: `border-radius: var(--radius-lg);`

**Step 3: Commit**

```
feat(ui): redesign EmptyState and SkeletonCard with warm palette
```

---

### Task 20: Redesign ShareDialog and EditorToolbar

**Files:**
- Modify: `apps/frontend/src/components/sharing/ShareDialog.vue`
- Modify: `apps/frontend/src/components/editor/EditorToolbar.vue`
- Modify: `apps/frontend/src/components/editor/NoteEditor.vue`

**Step 1: Update ShareDialog**

- Modal overlay: warm `rgba(44, 37, 32, 0.3)`
- Dialog: `border-radius: var(--radius-xl);`
- Input fields and buttons: warm styling

**Step 2: Update EditorToolbar**

- Toolbar background: `var(--bar-bg)` with backdrop blur
- Button colors: `var(--color-text-secondary)`, active: `var(--color-primary)`
- Separator: `var(--color-border)`

**Step 3: Update NoteEditor**

- Editor area: ensure font-family inherits `var(--font-body)`
- Link color: `var(--color-primary)`

**Step 4: Commit**

```
feat(ui): redesign ShareDialog, EditorToolbar, and NoteEditor
```

---

### Task 21: Add responsive grid utilities and tablet breakpoints

**Files:**
- Modify: `apps/frontend/src/styles/main.css`

**Step 1: Add responsive utility classes at the end of main.css**

```css
/* ── Responsive utilities ── */
@media (min-width: 768px) {
  .app-content {
    padding-left: 24px;
    padding-right: 24px;
  }
}

@media (min-width: 1025px) {
  .app-content {
    padding-left: 40px;
    padding-right: 40px;
  }
}
```

**Step 2: Commit**

```
feat(ui): add responsive spacing utilities
```

---

### Task 22: Final visual QA pass and cleanup

**Files:**
- All modified files

**Step 1: Run dev server and check every view**

Checklist:
- [ ] Login page renders correctly
- [ ] Register page renders correctly
- [ ] Notes list with warm palette
- [ ] Note detail editor works
- [ ] Calendar month/week/agenda views
- [ ] Event form modal
- [ ] Menu: recipes tab
- [ ] Menu: planning tab
- [ ] Menu: shopping tab
- [ ] Settings page with new accent presets
- [ ] Dark mode toggle works
- [ ] Floating nav bar appears on mobile widths
- [ ] Desktop sidebar appears on >1024px
- [ ] No hardcoded iOS colors remain

**Step 2: Fix any remaining hardcoded colors**

Search all `.vue` files for:
- `#007AFF` (old iOS blue)
- `#F2F2F7` (old iOS light bg)
- `#000000` (old dark bg in context of theme)
- `-apple-system` (old font references not through var)

Replace any found instances with the appropriate CSS variable.

**Step 3: Run type check**

```bash
cd apps/frontend && npx vue-tsc --noEmit
```

**Step 4: Run build to verify no errors**

```bash
cd apps/frontend && npx vite build
```

**Step 5: Final commit**

```
feat(ui): complete UI redesign QA pass and cleanup
```

---

## Summary

| Task | Component | Key Change |
|------|-----------|------------|
| 1 | index.html | Add Google Fonts |
| 2 | main.css | Replace all design tokens |
| 3 | useTheme.ts | New accent presets, theme colors |
| 4 | AppShell | Desktop sidebar + responsive layout |
| 5 | BottomNav | Floating tab bar capsule |
| 6 | Router + App.vue | Remove search route, update nav |
| 7 | NotesView | Compact header, inline search, simplified creation |
| 8 | NoteCard | Category dot indicator |
| 9 | NoteDetailView | Warm palette, serif title |
| 10 | CalendarView | Organic segmented control |
| 11 | Calendar sub-views | Warm styling |
| 12 | EventForm | Warm modal styling |
| 13 | MenuView | Organic pills, warm grid |
| 14 | Menu sub-components | Warm cards and checkboxes |
| 15 | Recipe views | Warm palette |
| 16 | SettingsView | Warm palette, updated swatches |
| 17 | CategoryManagerView | Warm palette |
| 18 | Auth pages | Serif branding, warm palette |
| 19 | EmptyState + Skeleton | Warm palette |
| 20 | ShareDialog + Editor | Warm palette |
| 21 | main.css | Responsive utilities |
| 22 | All | QA pass and cleanup |

**Dependency chain:** Tasks 1-3 (foundations) → Tasks 4-6 (layout/nav) → Tasks 7-21 (views, can be parallelized in groups) → Task 22 (QA).
