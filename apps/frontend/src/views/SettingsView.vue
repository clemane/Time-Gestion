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

        <div class="accent-section" v-if="themeMode !== 'totoro'">
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
            <button
              v-if="partner"
              class="cal-action-btn"
              :class="{ shared: isCalendarShared(cal.id) }"
              @click="toggleShareCalendar(cal)"
              :title="isCalendarShared(cal.id) ? 'Ne plus partager' : 'Partager avec partenaire'"
            >
              <Users :size="16" />
            </button>
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

    <!-- Partner -->
    <div class="settings-section">
      <h2 class="section-title">Partenaire</h2>

      <!-- Partner linked -->
      <div v-if="partner" class="partner-card">
        <div class="partner-info">
          <div class="partner-avatar">
            {{ partner.displayName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) }}
          </div>
          <div class="partner-details">
            <span class="partner-name">{{ partner.displayName }}</span>
            <span class="partner-email">{{ partner.email }}</span>
          </div>
        </div>
        <button class="partner-unlink-btn" @click="unlinkPartner" :disabled="partnerLoading">
          <UserMinus :size="16" />
          Dissocier
        </button>
      </div>

      <!-- No partner -->
      <div v-else class="partner-actions">
        <!-- Invite code display -->
        <div v-if="inviteCode" class="invite-code-card">
          <span class="invite-label">Code d'invitation</span>
          <div class="invite-code-row">
            <span class="invite-code">{{ inviteCode }}</span>
            <button class="invite-copy-btn" @click="navigator.clipboard.writeText(inviteCode!)" title="Copier">
              <Copy :size="16" />
            </button>
          </div>
          <span class="invite-timer">Expire dans {{ inviteCountdown }}</span>
        </div>

        <!-- Join input -->
        <div v-else-if="showJoinInput" class="join-card">
          <input
            v-model="joinCode"
            type="text"
            maxlength="6"
            inputmode="numeric"
            pattern="[0-9]*"
            class="join-input"
            placeholder="Code a 6 chiffres"
            @keyup.enter="joinPartner"
          />
          <div class="join-actions">
            <button class="partner-btn secondary" @click="showJoinInput = false">Annuler</button>
            <button class="partner-btn primary" @click="joinPartner" :disabled="joinCode.length !== 6 || partnerLoading">
              <Loader2 v-if="partnerLoading" :size="16" class="spin" />
              Rejoindre
            </button>
          </div>
        </div>

        <!-- Default buttons -->
        <div v-else class="partner-btn-group">
          <button class="partner-btn primary" @click="generateInvite" :disabled="partnerLoading">
            <UserPlus :size="16" />
            Inviter un partenaire
          </button>
          <button class="partner-btn secondary" @click="showJoinInput = true">
            <Users :size="16" />
            Rejoindre un partenaire
          </button>
        </div>
      </div>
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
import { Tag as TagIcon, ChevronRight, Check, Check as CheckIcon, X, Pencil, Trash2, Share2, FileText, FolderOpen, Calendar as CalendarIcon, Sun, Moon, Monitor, TreePine, Users, UserPlus, UserMinus, Copy, Loader2 } from 'lucide-vue-next';
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
  { mode: 'totoro' as ThemeMode, label: 'Totoro', icon: TreePine },
  { mode: 'system' as ThemeMode, label: 'Systeme', icon: Monitor },
];

// ── Partner state ──────────────────────────────────────────
const partner = ref<{ id: string; displayName: string; email: string } | null>(null);
const inviteCode = ref<string | null>(null);
const inviteExpiry = ref<Date | null>(null);
const inviteCountdown = ref('');
let countdownInterval: ReturnType<typeof setInterval> | null = null;
const showJoinInput = ref(false);
const joinCode = ref('');
const partnerLoading = ref(false);

async function loadPartner() {
  try {
    partner.value = await apiFetch<{ id: string; displayName: string; email: string } | null>('/partner');
  } catch {
    partner.value = null;
  }
}

async function generateInvite() {
  partnerLoading.value = true;
  try {
    const res = await apiFetch<{ code: string; expiresAt: string }>('/partner/invite', { method: 'POST' });
    inviteCode.value = res.code;
    inviteExpiry.value = new Date(res.expiresAt);
    showJoinInput.value = false;
    startCountdown();
  } finally {
    partnerLoading.value = false;
  }
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  if (!inviteExpiry.value) return;
  const remaining = Math.max(0, inviteExpiry.value.getTime() - Date.now());
  if (remaining <= 0) {
    inviteCode.value = null;
    inviteExpiry.value = null;
    inviteCountdown.value = '';
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  inviteCountdown.value = `${min}:${String(sec).padStart(2, '0')}`;
}

async function joinPartner() {
  if (joinCode.value.length !== 6) return;
  partnerLoading.value = true;
  try {
    await apiFetch('/partner/join', { method: 'POST', body: JSON.stringify({ code: joinCode.value }) });
    await loadPartner();
    joinCode.value = '';
    showJoinInput.value = false;
  } finally {
    partnerLoading.value = false;
  }
}

async function unlinkPartner() {
  partnerLoading.value = true;
  try {
    await apiFetch('/partner', { method: 'DELETE' });
    partner.value = null;
  } finally {
    partnerLoading.value = false;
  }
}

// ── Calendar sharing with partner ──────────────────────────
const myShares = computed(() =>
  sharesStore.sharedWithMe.filter(s => s.resourceType === 'CALENDAR'),
);

function isCalendarShared(calendarId: string): boolean {
  return myShares.value.some(s => s.resourceId === calendarId);
}

async function toggleShareCalendar(cal: Calendar) {
  if (!partner.value) return;
  const existing = myShares.value.find(s => s.resourceId === cal.id);
  if (existing) {
    await sharesStore.removeShare(existing.id);
  } else {
    await sharesStore.createShare({
      resourceType: 'CALENDAR',
      resourceId: cal.id,
      sharedWithEmail: partner.value.email,
      permission: 'WRITE',
    });
  }
  await sharesStore.loadSharedWithMe();
}

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
  loadPartner();
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

/* ── Partner section ──────────────────────────────────────── */

.partner-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.partner-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.partner-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.partner-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.partner-name {
  font-size: 17px;
  font-weight: 500;
}

.partner-email {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.partner-unlink-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 0.5px solid var(--color-danger);
  border-radius: var(--radius);
  color: var(--color-danger);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.partner-unlink-btn:active {
  background: var(--color-danger-ghost);
}

.partner-unlink-btn:disabled {
  opacity: 0.5;
}

.partner-actions {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.partner-btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partner-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.partner-btn:active {
  opacity: 0.7;
}

.partner-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.partner-btn.primary {
  background: var(--color-primary);
  color: white;
}

.partner-btn.secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.invite-code-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.invite-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.invite-code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.invite-code {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 6px;
  font-family: var(--font-mono, monospace);
  color: var(--color-primary);
}

.invite-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-full);
  -webkit-tap-highlight-color: transparent;
}

.invite-copy-btn:active {
  background: var(--color-bg-secondary);
}

.invite-timer {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.join-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.join-input {
  width: 100%;
  padding: 12px 16px;
  border: 0.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 8px;
  font-family: var(--font-mono, monospace);
  box-sizing: border-box;
}

.join-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.join-input::placeholder {
  font-size: 15px;
  letter-spacing: 0;
  font-weight: 400;
  font-family: var(--font-body);
}

.join-actions {
  display: flex;
  gap: 8px;
}

.join-actions .partner-btn {
  flex: 1;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cal-action-btn.shared {
  color: var(--color-primary);
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
