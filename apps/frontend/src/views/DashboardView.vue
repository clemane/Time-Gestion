<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventsStore } from '@/stores/events'
import { useNotesStore } from '@/stores/notes'
import { useMealPlanStore } from '@/stores/mealPlan'
import { useRecipesStore } from '@/stores/recipes'
import { Calendar, FileText, UtensilsCrossed, Sun, Sunset, Moon } from 'lucide-vue-next'

const eventsStore = useEventsStore()
const notesStore = useNotesStore()
const mealPlanStore = useMealPlanStore()
const recipesStore = useRecipesStore()

// Ensure meal plan data for the current week is loaded
onMounted(() => {
  mealPlanStore.loadWeek()
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon apres-midi'
  return 'Bonsoir'
})

const greetingIcon = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return Sun
  if (hour < 18) return Sunset
  return Moon
})

const todayStr = computed(() => {
  return new Date().toISOString().slice(0, 10)
})

const todayEvents = computed(() => {
  return eventsStore.events.filter(e => {
    const eventDate = e.startAt?.slice(0, 10)
    return eventDate === todayStr.value
  }).sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''))
})

const todayMeals = computed(() => {
  return mealPlanStore.mealSlots.filter(s => {
    const slotDate = s.date.split('T')[0]
    return slotDate === todayStr.value && !s.deletedAt
  }).sort((a, b) => a.sortOrder - b.sortOrder)
})

const pinnedNotes = computed(() => {
  return notesStore.notes.filter(n => n.isPinned && !n.deletedAt)
})

// Resolve a recipe name from recipeId
function getRecipeTitle(recipeId: string | null): string {
  if (!recipeId) return ''
  const recipe = recipesStore.recipes.find(r => r.id === recipeId)
  return recipe?.title || ''
}

// Translate slot names to French
function formatSlotName(slotName: string): string {
  const names: Record<string, string> = {
    breakfast: 'Petit-dej',
    lunch: 'Dejeuner',
    dinner: 'Diner',
    snack: 'Gouter',
  }
  return names[slotName] || slotName
}

// Format time from ISO string
function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Format today's date
const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
})
</script>

<template>
  <div class="dashboard">
    <!-- Greeting -->
    <section class="greeting-section">
      <div class="greeting-icon">
        <component :is="greetingIcon" :size="28" />
      </div>
      <h1 class="greeting-text">{{ greeting }}</h1>
      <p class="greeting-date">{{ todayFormatted }}</p>
    </section>

    <!-- Today's Events -->
    <section class="dashboard-section" v-if="todayEvents.length">
      <div class="section-header">
        <Calendar :size="18" />
        <h2>Evenements</h2>
      </div>
      <div class="section-content">
        <div v-for="event in todayEvents" :key="event.id" class="event-item">
          <span class="event-time">{{ event.allDay ? 'Journee' : formatTime(event.startAt) }}</span>
          <span class="event-title">{{ event.title }}</span>
        </div>
      </div>
    </section>

    <!-- Today's Meals -->
    <section class="dashboard-section" v-if="todayMeals.length">
      <div class="section-header">
        <UtensilsCrossed :size="18" />
        <h2>Repas</h2>
      </div>
      <div class="section-content">
        <div v-for="meal in todayMeals" :key="meal.id" class="meal-item">
          <span class="meal-type">{{ formatSlotName(meal.slotName) }}</span>
          <span class="meal-title">{{ meal.customTitle || getRecipeTitle(meal.recipeId) || 'Pas de recette' }}</span>
        </div>
      </div>
    </section>

    <!-- Pinned Notes -->
    <section class="dashboard-section" v-if="pinnedNotes.length">
      <div class="section-header">
        <FileText :size="18" />
        <h2>Notes epinglees</h2>
      </div>
      <div class="section-content">
        <router-link v-for="note in pinnedNotes" :key="note.id" :to="`/notes/${note.id}`" class="note-item">
          <span class="note-title">{{ note.title || 'Sans titre' }}</span>
        </router-link>
      </div>
    </section>

    <!-- Empty state if nothing today -->
    <div v-if="!todayEvents.length && !todayMeals.length && !pinnedNotes.length" class="empty-state">
      <p>Rien de prevu aujourd'hui</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.greeting-section {
  text-align: center;
  margin-bottom: 32px;
  padding-top: 8px;
}

.greeting-icon {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.greeting-text {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-text);
  margin: 0;
}

.greeting-date {
  color: var(--color-text-secondary);
  text-transform: capitalize;
  margin-top: 4px;
  font-size: 15px;
}

.dashboard-section {
  margin-bottom: 24px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-xs);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-primary);
}

.section-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.section-content {
  display: flex;
  flex-direction: column;
}

.event-item,
.meal-item,
.note-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  gap: 12px;
  align-items: center;
}

.event-item:last-child,
.meal-item:last-child,
.note-item:last-child {
  border-bottom: none;
}

.event-time,
.meal-type {
  color: var(--color-text-secondary);
  font-size: 13px;
  min-width: 50px;
  flex-shrink: 0;
}

.event-title,
.meal-title,
.note-title {
  font-size: 15px;
  color: var(--color-text);
}

.note-item {
  text-decoration: none;
  color: var(--color-text);
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-tertiary);
  font-size: 15px;
}
</style>
