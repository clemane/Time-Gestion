<template>
  <div class="settings-view">
    <header class="settings-header">
      <h1>Parametres</h1>
    </header>

    <!-- User info -->
    <div class="settings-section">
      <div class="user-card" v-if="auth.user">
        <div class="user-avatar">
          {{ initials }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ auth.user.displayName }}</span>
          <span class="user-email">{{ auth.user.email }}</span>
        </div>
      </div>
    </div>

    <!-- Appearance -->
    <div class="settings-section">
      <h2 class="section-title">Apparence</h2>

      <div class="theme-card">
        <div class="theme-mode-selector">
          <button
            v-for="opt in themeOptions"
            :key="opt.mode"
            class="theme-mode-btn"
            :class="{ active: themeMode === opt.mode }"
            @click="setThemeMode(opt.mode)"
          >
            <component :is="opt.icon" :size="18" />
            <span>{{ opt.label }}</span>
          </button>
        </div>

        <div class="accent-section">
          <span class="accent-label">Couleur d'accent</span>
          <div class="accent-grid">
            <button
              v-for="preset in ACCENT_PRESETS"
              :key="preset.name"
              class="accent-swatch"
              :class="{ active: currentAccent.name === preset.name }"
              :style="{ background: preset.value }"
              :title="preset.name"
              @click="setAccent(preset)"
            >
              <CheckIcon v-if="currentAccent.name === preset.name" :size="16" class="accent-check" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar management -->
    <div class="settings-section">
      <h2 class="section-title">Groupes</h2>

      <div class="calendars-list">
        <div v-for="cal in calendarsStore.calendars" :key="cal.id" class="calendar-row">
          <template v-if="editingCalendarId === cal.id">
            <input
              v-model="editName"
              type="text"
              class="cal-input"
              placeholder="Nom du calendrier"
              @keyup.enter="saveCalendar(cal.id)"
            />
            <input
              v-model="editColor"
              type="color"
              class="cal-color-picker"
            />
            <button class="cal-action-btn save" @click="saveCalendar(cal.id)" title="Enregistrer">
              <Check :size="18" />
            </button>
            <button class="cal-action-btn cancel" @click="cancelEdit()" title="Annuler">
              <X :size="18" />
            </button>
          </template>
          <template v-else>
            <span class="cal-dot" :style="{ background: cal.color }"></span>
            <span class="cal-name">{{ cal.name }}</span>
            <button class="cal-action-btn" @click="startEdit(cal)" title="Modifier">
              <Pencil :size="16" />
            </button>
            <button class="cal-action-btn danger" @click="confirmDeleteCalendar(cal.id, cal.name)" title="Supprimer">
              <Trash2 :size="16" />
            </button>
          </template>
        </div>

        <EmptyState
          v-if="calendarsStore.calendars.length === 0"
          :icon="CalendarIcon"
          title="Aucun groupe"
          description="Ajoutez un groupe pour organiser vos notes et evenements"
        />
      </div>

      <!-- Add new calendar form -->
      <div class="add-calendar-form">
        <input
          v-model="newCalName"
          type="text"
          class="cal-input"
          placeholder="Nouveau groupe..."
          @keyup.enter="addCalendar"
        />
        <input
          v-model="newCalColor"
          type="color"
          class="cal-color-picker"
        />
        <button class="cal-add-btn" @click="addCalendar" :disabled="!newCalName.trim()">
          Ajouter
        </button>
      </div>
    </div>

    <!-- Notification preferences -->
    <div class="settings-section">
      <h2 class="section-title">Notifications</h2>
      <div class="notification-toggle">
        <div class="toggle-info">
          <span class="toggle-label">Rappels d'evenements</span>
          <span class="toggle-desc">
            {{ notificationStatus }}
          </span>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            :checked="notificationsEnabled"
            @change="toggleNotifications"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Settings links -->
    <div class="settings-section">
      <h2 class="section-title">Gestion</h2>
      <router-link to="/settings/categories" class="settings-link">
        <span class="link-icon"><TagIcon :size="20" /></span>
        <span class="link-text">Gerer les categories</span>
        <ChevronRight :size="18" class="link-arrow" />
      </router-link>
    </div>

    <!-- Shared with me -->
    <div class="settings-section">
      <h2 class="section-title">Partages recus</h2>
      <div v-if="sharesStore.loading" class="shares-loading">
        Chargement...
      </div>
      <EmptyState
        v-else-if="sharesStore.sharedWithMe.length === 0"
        :icon="Share2"
        title="Aucun partage recu"
        description="Les notes et calendriers partages avec vous apparaitront ici"
      />
      <div v-else class="shares-list">
        <div v-for="share in sharesStore.sharedWithMe" :key="share.id" class="share-card">
          <div class="share-card-icon">
            <component :is="getResourceIcon(share.resourceType)" :size="20" />
          </div>
          <div class="share-card-info">
            <span class="share-card-type">{{ resourceLabel(share.resourceType) }}</span>
            <span class="share-card-perm">{{ share.permission === 'READ' ? 'Lecture seule' : 'Lecture et ecriture' }}</span>
          </div>
          <span class="share-card-from">de {{ share.ownerId }}</span>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div class="settings-section">
      <button class="btn-logout" @click="handleLogout">
        Se deconnecter
      </button>
    </div>

    <!-- Delete confirmation dialog -->
    <Transition name="modal">
      <div v-if="deleteConfirm" class="dialog-overlay" @click="deleteConfirm = null">
        <div class="dialog-box" @click.stop>
          <p class="dialog-text">Supprimer le groupe <strong>{{ deleteConfirm.name }}</strong> ?</p>
          <p class="dialog-subtext">Les notes et evenements associes perdront leur groupe.</p>
          <div class="dialog-actions">
            <button class="dialog-btn" @click="deleteConfirm = null">Annuler</button>
            <button class="dialog-btn danger" @click="doDeleteCalendar">Supprimer</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSharesStore } from '@/stores/shares';
import { useCalendarsStore } from '@/stores/calendars';
import { useReminders } from '@/composables/useReminders';
import { useTheme, ACCENT_PRESETS, type ThemeMode, type AccentColor } from '@/composables/useTheme';
import { Tag as TagIcon, ChevronRight, Check, Check as CheckIcon, X, Pencil, Trash2, Share2, FileText, FolderOpen, Calendar as CalendarIcon, Sun, Moon, Monitor } from 'lucide-vue-next';
import EmptyState from '@/components/ui/EmptyState.vue';
import type { ResourceType, Calendar } from '@time-gestion/shared';

const router = useRouter();
const auth = useAuthStore();
const sharesStore = useSharesStore();
const calendarsStore = useCalendarsStore();
const { requestPermission, startReminders, stopReminders } = useReminders();
const { mode: themeMode, accentColor: currentAccent, setMode: setThemeMode, setAccent } = useTheme();

const themeOptions = [
  { mode: 'light' as ThemeMode, label: 'Clair', icon: Sun },
  { mode: 'dark' as ThemeMode, label: 'Sombre', icon: Moon },
  { mode: 'system' as ThemeMode, label: 'Systeme', icon: Monitor },
];

const initials = computed(() => {
  if (!auth.user?.displayName) return '?';
  return auth.user.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const newCalName = ref('');
const newCalColor = ref(randomColor());

const editingCalendarId = ref<string | null>(null);
const editName = ref('');
const editColor = ref('');

const deleteConfirm = ref<{ id: string; name: string } | null>(null);

function randomColor(): string {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#2563eb', '#65a30d'];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function addCalendar() {
  const name = newCalName.value.trim();
  if (!name) return;

  await calendarsStore.create({ name, color: newCalColor.value });
  newCalName.value = '';
  newCalColor.value = randomColor();
}

function startEdit(cal: Calendar) {
  editingCalendarId.value = cal.id;
  editName.value = cal.name;
  editColor.value = cal.color;
}

function cancelEdit() {
  editingCalendarId.value = null;
  editName.value = '';
  editColor.value = '';
}

async function saveCalendar(id: string) {
  const name = editName.value.trim();
  if (!name) return;

  await calendarsStore.update(id, { name, color: editColor.value });
  cancelEdit();
}

function confirmDeleteCalendar(id: string, name: string) {
  deleteConfirm.value = { id, name };
}

async function doDeleteCalendar() {
  if (!deleteConfirm.value) return;
  await calendarsStore.remove(deleteConfirm.value.id);
  deleteConfirm.value = null;
}

const notificationsEnabled = ref(false);

const notificationStatus = computed(() => {
  if (!('Notification' in window)) {
    return 'Non supporte par ce navigateur';
  }
  if (Notification.permission === 'denied') {
    return 'Bloque par le navigateur';
  }
  return notificationsEnabled.value
    ? 'Activees'
    : 'Desactivees';
});

function loadNotificationPref() {
  const stored = localStorage.getItem('tg-notifications-enabled');
  notificationsEnabled.value = stored === 'true';
}

async function toggleNotifications() {
  if (!notificationsEnabled.value) {
    await requestPermission();
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationsEnabled.value = true;
      localStorage.setItem('tg-notifications-enabled', 'true');
      startReminders();
    }
  } else {
    notificationsEnabled.value = false;
    localStorage.setItem('tg-notifications-enabled', 'false');
    stopReminders();
  }
}

function getResourceIcon(type: ResourceType): Component {
  switch (type) {
    case 'NOTE': return FileText;
    case 'FOLDER': return FolderOpen;
    case 'CALENDAR': return CalendarIcon;
    default: return FileText;
  }
}

function resourceLabel(type: ResourceType): string {
  switch (type) {
    case 'NOTE': return 'Note';
    case 'FOLDER': return 'Dossier';
    case 'CALENDAR': return 'Calendrier';
    default: return type;
  }
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

onMounted(async () => {
  sharesStore.loadSharedWithMe();
  await calendarsStore.loadFromLocal();
  loadNotificationPref();
});
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────── */

.settings-view {
  padding-bottom: 40px;
  overflow-y: auto;
  height: 100%;
  background: var(--color-bg);
}

.settings-header {
  padding: 8px 16px 8px;
}

.settings-header h1 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0;
}

.settings-section {
  padding: 0 16px;
  margin-bottom: 24px;
}

/* ── Section titles ───────────────────────────────────────── */

.section-title {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  font-weight: 400;
  margin-bottom: 7px;
  padding-left: 16px;
}

/* ── User card ────────────────────────────────────────────── */

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  -webkit-tap-highlight-color: transparent;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 20px;
  font-weight: 400;
}

.user-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* ── Theme card (grouped section) ─────────────────────────── */

.theme-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.theme-mode-selector {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
}

.theme-mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.theme-mode-btn:active {
  background: var(--color-bg-secondary);
}

.theme-mode-btn.active {
  background: var(--color-primary);
  color: white;
  box-shadow: none;
}

/* ── Accent swatches ──────────────────────────────────────── */

.accent-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accent-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.accent-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.accent-swatch {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: opacity var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.accent-swatch.active {
  box-shadow: 0 0 0 2px var(--color-bg-elevated), 0 0 0 3.5px currentColor;
}

.accent-swatch:not(.active):active {
  opacity: 0.6;
}

.accent-check {
  color: white;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

/* ── Calendar / Group rows ────────────────────────────────── */

.calendars-list {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 12px;
}

.calendar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  background: var(--color-bg-elevated);
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.calendar-row:active {
  background: var(--color-bg-secondary);
}

/* 0.5px separator between rows */
.calendar-row + .calendar-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 0;
  height: 0.5px;
  background: var(--color-border);
}

.cal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-name {
  flex: 1;
  font-size: 17px;
  font-weight: 400;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-input {
  flex: 1;
  min-width: 0;
  padding: 7px 12px;
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 15px;
  transition: border-color var(--transition-fast);
}

.cal-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.cal-color-picker {
  width: 32px;
  height: 32px;
  padding: 2px;
  border: 0.5px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  cursor: pointer;
  flex-shrink: 0;
}

.cal-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.cal-action-btn:active {
  background: var(--color-bg-secondary);
}

.cal-action-btn:hover {
  color: var(--color-text);
}

.cal-action-btn.danger:hover {
  color: var(--color-danger);
}

.cal-action-btn.danger:active {
  background: var(--color-danger-ghost);
}

.cal-action-btn.save {
  color: var(--color-success);
}

.cal-action-btn.cancel {
  color: var(--color-text-secondary);
}

.add-calendar-form {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 10px 16px;
}

.cal-add-btn {
  padding: 7px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.cal-add-btn:active {
  opacity: 0.7;
}

.cal-add-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Notification toggle ──────────────────────────────────── */

.notification-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
}

.toggle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-size: 17px;
  font-weight: 400;
}

.toggle-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* iOS-style toggle */
.switch {
  position: relative;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: var(--color-bg-secondary);
  border-radius: 31px;
  cursor: pointer;
  transition: background 250ms ease;
}

.slider::before {
  content: '';
  position: absolute;
  width: 27px;
  height: 27px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.06);
  transition: transform 250ms ease;
}

.switch input:checked + .slider {
  background: var(--color-primary);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* ── Settings links ───────────────────────────────────────── */

.settings-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text);
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.settings-link:active {
  background: var(--color-bg-secondary);
}

.link-icon {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.link-text {
  flex: 1;
  font-size: 17px;
  font-weight: 400;
}

.link-arrow {
  color: var(--color-text-tertiary);
}

/* ── Shares ───────────────────────────────────────────────── */

.shares-loading {
  padding: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 15px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
}

.shares-list {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.share-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  position: relative;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.share-card:active {
  background: var(--color-bg-secondary);
}

/* 0.5px separator between share rows */
.share-card + .share-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 0;
  height: 0.5px;
  background: var(--color-border);
}

.share-card-icon {
  color: var(--color-text-secondary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.share-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.share-card-type {
  font-size: 17px;
  font-weight: 400;
}

.share-card-perm {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.share-card-from {
  font-size: 13px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* ── Logout button ────────────────────────────────────────── */

.btn-logout {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-danger);
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  text-align: center;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.btn-logout:active {
  background: var(--color-bg-secondary);
}

/* ── Dialog overlay (iOS alert style) ─────────────────────── */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dialog-box {
  background: var(--color-bg-elevated);
  border-radius: 14px;
  padding: 20px;
  max-width: 270px;
  width: 100%;
  text-align: center;
}

.dialog-text {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

.dialog-subtext {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  gap: 0;
  border-top: 0.5px solid var(--color-border);
  margin: 0 -20px -20px;
}

.dialog-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.dialog-btn:first-child {
  border-bottom-left-radius: 14px;
  font-weight: 600;
}

.dialog-btn:last-child {
  border-bottom-right-radius: 14px;
}

/* Vertical separator between dialog buttons */
.dialog-btn + .dialog-btn {
  border-left: 0.5px solid var(--color-border);
}

.dialog-btn:active {
  background: var(--color-bg-secondary);
}

.dialog-btn.danger {
  color: var(--color-danger);
  font-weight: 600;
}
</style>
