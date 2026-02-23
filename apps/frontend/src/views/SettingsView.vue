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

    <!-- Calendar management -->
    <div class="settings-section">
      <h2 class="section-title">Calendriers</h2>

      <!-- Existing calendars list -->
      <div class="calendars-list">
        <div v-for="cal in calendarsStore.calendars" :key="cal.id" class="calendar-row">
          <template v-if="editingCalendarId === cal.id">
            <!-- Inline edit mode -->
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
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button class="cal-action-btn cancel" @click="cancelEdit()" title="Annuler">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </template>
          <template v-else>
            <!-- Display mode -->
            <span class="cal-dot" :style="{ background: cal.color }"></span>
            <span class="cal-name">{{ cal.name }}</span>
            <button class="cal-action-btn" @click="startEdit(cal)" title="Modifier">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="cal-action-btn danger" @click="confirmDeleteCalendar(cal.id, cal.name)" title="Supprimer">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </template>
        </div>

        <div v-if="calendarsStore.calendars.length === 0" class="calendars-empty">
          Aucun calendrier
        </div>
      </div>

      <!-- Add new calendar form -->
      <div class="add-calendar-form">
        <input
          v-model="newCalName"
          type="text"
          class="cal-input"
          placeholder="Nouveau calendrier..."
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
        <span class="link-icon">&#x1f3f7;&#xfe0f;</span>
        <span class="link-text">Gerer les categories</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="link-arrow">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </router-link>
    </div>

    <!-- Shared with me -->
    <div class="settings-section">
      <h2 class="section-title">Partages recus</h2>
      <div v-if="sharesStore.loading" class="shares-loading">
        Chargement...
      </div>
      <div v-else-if="sharesStore.sharedWithMe.length === 0" class="shares-empty">
        Aucun partage recu
      </div>
      <div v-else class="shares-list">
        <div v-for="share in sharesStore.sharedWithMe" :key="share.id" class="share-card">
          <div class="share-card-icon">
            {{ resourceIcon(share.resourceType) }}
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
    <div v-if="deleteConfirm" class="dialog-overlay" @click="deleteConfirm = null">
      <div class="dialog-box" @click.stop>
        <p class="dialog-text">Supprimer le calendrier <strong>{{ deleteConfirm.name }}</strong> ?</p>
        <p class="dialog-subtext">Tous les evenements associes seront egalement supprimes.</p>
        <div class="dialog-actions">
          <button class="dialog-btn" @click="deleteConfirm = null">Annuler</button>
          <button class="dialog-btn danger" @click="doDeleteCalendar">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSharesStore } from '@/stores/shares';
import { useCalendarsStore } from '@/stores/calendars';
import { useReminders } from '@/composables/useReminders';
import type { ResourceType, Calendar } from '@time-gestion/shared';

const router = useRouter();
const auth = useAuthStore();
const sharesStore = useSharesStore();
const calendarsStore = useCalendarsStore();
const { requestPermission, startReminders, stopReminders } = useReminders();

// --- User initials ---
const initials = computed(() => {
  if (!auth.user?.displayName) return '?';
  return auth.user.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

// --- Calendar management ---
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

// --- Notifications ---
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
    // Enabling
    await requestPermission();
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationsEnabled.value = true;
      localStorage.setItem('tg-notifications-enabled', 'true');
      startReminders();
    }
  } else {
    // Disabling
    notificationsEnabled.value = false;
    localStorage.setItem('tg-notifications-enabled', 'false');
    stopReminders();
  }
}

// --- Shares helpers ---
function resourceIcon(type: ResourceType): string {
  switch (type) {
    case 'NOTE': return '\u{1f4dd}';
    case 'FOLDER': return '\u{1f4c1}';
    case 'CALENDAR': return '\u{1f4c5}';
    default: return '\u{1f4c4}';
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

// --- Logout ---
async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

// --- Init ---
onMounted(async () => {
  sharesStore.loadSharedWithMe();
  await calendarsStore.loadFromLocal();
  loadNotificationPref();
});
</script>

<style scoped>
.settings-view {
  padding-bottom: 32px;
  overflow-y: auto;
  height: 100%;
}

.settings-header {
  padding: 16px;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.settings-section {
  padding: 0 16px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

/* --- User card --- */
.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
}

.user-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* --- Calendars management --- */
.calendars-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.calendar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
}

.cal-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
}

.cal-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.cal-color-picker {
  width: 32px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
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
  padding: 4px;
  border-radius: var(--radius);
  flex-shrink: 0;
}

.cal-action-btn:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.cal-action-btn.danger:hover {
  color: var(--color-danger);
}

.cal-action-btn.save {
  color: var(--color-success);
}

.cal-action-btn.cancel {
  color: var(--color-text-secondary);
}

.calendars-empty {
  padding: 14px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
}

.add-calendar-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-add-btn {
  padding: 8px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.cal-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Notification toggle --- */
.notification-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
}

.toggle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-size: 15px;
  font-weight: 500;
}

.toggle-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.switch {
  position: relative;
  width: 48px;
  height: 28px;
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
  background: var(--color-border);
  border-radius: 28px;
  cursor: pointer;
  transition: background 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.switch input:checked + .slider {
  background: var(--color-primary);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* --- Settings links --- */
.settings-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--color-text);
  transition: box-shadow 0.2s;
}

.settings-link:active {
  box-shadow: var(--shadow);
}

.link-icon {
  font-size: 20px;
}

.link-text {
  flex: 1;
  font-size: 15px;
}

.link-arrow {
  color: var(--color-text-secondary);
}

/* --- Shares --- */
.shares-loading,
.shares-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.share-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
}

.share-card-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.share-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.share-card-type {
  font-size: 15px;
  font-weight: 500;
}

.share-card-perm {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.share-card-from {
  font-size: 12px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* --- Logout --- */
.btn-logout {
  width: 100%;
  padding: 14px;
  background: none;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius);
  color: var(--color-danger);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:active {
  background: rgba(239, 68, 68, 0.1);
}

/* --- Delete confirmation dialog --- */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dialog-box {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 340px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.dialog-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 6px;
}

.dialog-subtext {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
}

.dialog-btn.danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}
</style>
