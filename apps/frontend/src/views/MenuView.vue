<template>
  <div
    class="menu-view"
    @touchstart="ptr.onTouchStart"
    @touchmove="ptr.onTouchMove"
    @touchend="ptr.onTouchEnd"
  >
    <!-- Pull-to-refresh -->
    <div class="pull-indicator" :style="{ height: ptr.pullDistance.value + 'px' }">
      <div v-if="ptr.refreshing.value" class="pull-spinner"></div>
      <svg
        v-else-if="ptr.pulling.value"
        class="pull-arrow"
        :class="{ 'pull-ready': ptr.pullDistance.value >= 80 }"
        viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"
      >
        <polyline points="7 13 12 18 17 13"/>
        <line x1="12" y1="2" x2="12" y2="18"/>
      </svg>
    </div>

    <header class="menu-header">
      <h1>Menu</h1>
      <div class="view-tabs">
        <button :class="{ active: currentTab === 'recipes' }" @click="currentTab = 'recipes'">Recettes</button>
        <button :class="{ active: currentTab === 'planning' }" @click="currentTab = 'planning'">Planning</button>
        <button :class="{ active: currentTab === 'shopping' }" @click="currentTab = 'shopping'">Courses</button>
      </div>
    </header>

    <!-- ═══ TAB: RECETTES ═══ -->
    <template v-if="currentTab === 'recipes'">
      <div class="search-bar">
        <SearchIcon :size="16" class="search-icon" />
        <input v-model="searchQuery" placeholder="Rechercher une recette..." class="search-input" />
      </div>

      <div v-if="allTags.length > 0" class="group-chips">
        <button class="group-chip" :class="{ active: !selectedTag }" @click="selectedTag = null">Toutes</button>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="group-chip"
          :class="{ active: selectedTag === tag }"
          @click="selectedTag = selectedTag === tag ? null : tag"
        >{{ tag }}</button>
      </div>

      <div v-if="filteredRecipes.length > 0" class="recipe-grid">
        <RecipeCard
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          :recipe="recipe"
          @toggle-favorite="recipesStore.toggleFavorite"
        />
      </div>
      <div v-else class="empty-state">
        <UtensilsCrossed :size="48" class="empty-icon" />
        <p class="empty-text">Aucune recette</p>
        <p class="empty-sub">Ajoutez votre premiere recette !</p>
      </div>

      <button class="fab" @click="$router.push('/menu/recipes/new')">
        <Plus :size="24" />
      </button>
    </template>

    <!-- ═══ TAB: PLANNING ═══ -->
    <template v-if="currentTab === 'planning'">
      <WeekNavigator
        :current-week-start="mealPlanStore.currentWeekStart"
        @prev="mealPlanStore.prevWeek()"
        @next="mealPlanStore.nextWeek()"
      />

      <div class="planning-days">
        <div v-for="day in weekDays" :key="day.date" class="day-section">
          <h3 class="day-label">{{ day.label }}</h3>
          <div class="day-slots">
            <MealSlotCard
              v-for="slot in (mealPlanStore.slotsByDay[day.date] || [])"
              :key="slot.id"
              :slot="slot"
              :recipe-name="getRecipeName(slot.recipeId)"
              @assign="openPicker(slot.id)"
              @remove="mealPlanStore.removeSlot(slot.id)"
            />
            <button class="add-slot-btn" @click="addNewSlot(day.date)">
              <Plus :size="14" /> Ajouter un repas
            </button>
          </div>
        </div>
      </div>

      <RecipePicker
        :open="showPicker"
        @select="onPickRecipe"
        @close="showPicker = false"
      />
    </template>

    <!-- ═══ TAB: COURSES ═══ -->
    <template v-if="currentTab === 'shopping'">
      <div class="shopping-actions">
        <button class="action-btn primary" @click="generateList">
          <RefreshCw :size="16" /> Generer la liste
        </button>
        <button
          v-if="shoppingStore.items.some(i => i.isChecked)"
          class="action-btn danger"
          @click="shoppingStore.clearChecked(mealPlanStore.currentWeekStart)"
        >
          <Trash2 :size="16" /> Supprimer coches
        </button>
      </div>

      <div v-if="shoppingStore.items.length > 0" class="shopping-list">
        <ShoppingItemRow
          v-for="item in shoppingStore.items"
          :key="item.id"
          :item="item"
          @toggle="shoppingStore.toggleCheck(item.id)"
          @remove="shoppingStore.removeItem(item.id)"
        />
      </div>
      <div v-else class="empty-state">
        <ShoppingCart :size="48" class="empty-icon" />
        <p class="empty-text">Liste vide</p>
        <p class="empty-sub">Planifiez des recettes puis generez la liste</p>
      </div>

      <div class="add-manual">
        <input
          v-model="newItemName"
          placeholder="Ajouter un article..."
          class="manual-input"
          @keydown.enter="addManualItem"
        />
        <button v-if="newItemName.trim()" class="manual-add-btn" @click="addManualItem">
          <Plus :size="18" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRecipesStore } from '@/stores/recipes';
import { useMealPlanStore } from '@/stores/mealPlan';
import { useShoppingStore } from '@/stores/shopping';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useSync } from '@/composables/useSync';
import RecipeCard from '@/components/menu/RecipeCard.vue';
import WeekNavigator from '@/components/menu/WeekNavigator.vue';
import MealSlotCard from '@/components/menu/MealSlotCard.vue';
import ShoppingItemRow from '@/components/menu/ShoppingItemRow.vue';
import RecipePicker from '@/components/menu/RecipePicker.vue';
import {
  UtensilsCrossed, Plus, Search as SearchIcon,
  RefreshCw, Trash2, ShoppingCart,
} from 'lucide-vue-next';

const recipesStore = useRecipesStore();
const mealPlanStore = useMealPlanStore();
const shoppingStore = useShoppingStore();
const { sync } = useSync();

const ptr = usePullToRefresh(async () => {
  await sync();
  await recipesStore.loadFromLocal();
  await mealPlanStore.loadWeek();
  await shoppingStore.loadByWeek(mealPlanStore.currentWeekStart);
});

const currentTab = ref<'recipes' | 'planning' | 'shopping'>('recipes');
const searchQuery = ref('');
const selectedTag = ref<string | null>(null);
const showPicker = ref(false);
const pickerSlotId = ref<string | null>(null);
const newItemName = ref('');

const allTags = computed(() => {
  const tags = new Set<string>();
  for (const r of recipesStore.recipes) {
    for (const t of r.tags) tags.add(t);
  }
  return Array.from(tags).sort();
});

const filteredRecipes = computed(() => {
  let list = recipesStore.recipes;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(r => r.title.toLowerCase().includes(q));
  }
  if (selectedTag.value) {
    list = list.filter(r => r.tags.includes(selectedTag.value!));
  }
  return list;
});

const weekDays = computed(() => {
  const days: Array<{ date: string; label: string }> = [];
  const start = new Date(mealPlanStore.currentWeekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
    days.push({ date, label });
  }
  return days;
});

function getRecipeName(recipeId: string | null): string | undefined {
  if (!recipeId) return undefined;
  return recipesStore.recipes.find(r => r.id === recipeId)?.title;
}

function openPicker(slotId: string) {
  pickerSlotId.value = slotId;
  showPicker.value = true;
}

function onPickRecipe(recipeId: string) {
  if (pickerSlotId.value) {
    mealPlanStore.assignRecipe(pickerSlotId.value, recipeId);
  }
  showPicker.value = false;
  pickerSlotId.value = null;
}

async function addNewSlot(date: string) {
  const names = ['Petit-dejeuner', 'Dejeuner', 'Gouter', 'Diner'];
  const existing = (mealPlanStore.slotsByDay[date] || []).map(s => s.slotName);
  const available = names.find(n => !existing.includes(n)) || `Repas ${existing.length + 1}`;
  await mealPlanStore.addSlot({
    date,
    slotName: available,
    sortOrder: existing.length,
  });
}

async function generateList() {
  await shoppingStore.generateFromPlan(mealPlanStore.currentWeekStart);
}

async function addManualItem() {
  const name = newItemName.value.trim();
  if (!name) return;
  await shoppingStore.addManualItem({
    name,
    weekStart: mealPlanStore.currentWeekStart,
  });
  newItemName.value = '';
}

onMounted(async () => {
  await recipesStore.loadFromLocal();
  await mealPlanStore.loadWeek();
  await shoppingStore.loadByWeek(mealPlanStore.currentWeekStart);
});
</script>

<style scoped>
.menu-view {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--color-bg);
}

/* Pull-to-refresh */
.pull-indicator { display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; transition: height 300ms ease; }
.pull-arrow { transition: transform 300ms ease; color: var(--color-text-tertiary); transform: rotate(180deg); opacity: 0.6; }
.pull-arrow.pull-ready { transform: rotate(0deg); color: var(--color-primary); opacity: 1; }
.pull-spinner { width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Header */
.menu-header { padding: 16px 20px 12px; display: flex; justify-content: space-between; align-items: flex-end; }
.menu-header h1 { font-family: var(--font-display); font-size: 24px; font-weight: 400; letter-spacing: 0; color: var(--color-text); line-height: 1.1; }

/* Segmented control */
.view-tabs { display: flex; background: var(--color-bg-secondary); border-radius: var(--radius-full); padding: 3px; }
.view-tabs button { padding: 6px 14px; border: none; background: none; font-family: var(--font-body); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--color-text); border-radius: var(--radius-full); transition: background 200ms ease, box-shadow 200ms ease; -webkit-tap-highlight-color: transparent; min-height: 30px; }
.view-tabs button:active { opacity: 0.7; }
.view-tabs button.active { background: var(--color-primary); color: white; box-shadow: none; font-weight: 600; }

/* Search */
.search-bar { display: flex; align-items: center; gap: 8px; margin: 0 20px 12px; padding: 10px 12px; background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius); }
.search-icon { color: var(--color-text-tertiary); flex-shrink: 0; }
.search-input { border: none; background: none; outline: none; font-size: 15px; font-family: var(--font-body); color: var(--color-text); flex: 1; }
.search-input::placeholder { color: var(--color-text-tertiary); }

/* Group chips */
.group-chips { display: flex; gap: 8px; padding: 0 20px 12px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.group-chips::-webkit-scrollbar { display: none; }
.group-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: 9999px; font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; flex-shrink: 0; min-height: 36px; transition: background 200ms ease, color 200ms ease; -webkit-tap-highlight-color: transparent; }
.group-chip:active { opacity: 0.7; }
.group-chip.active { background: var(--color-primary-ghost); color: var(--color-primary); border-color: var(--color-primary); font-weight: 600; }

/* Recipe grid */
.recipe-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 0 20px 100px; }
@media (min-width: 768px) {
  .recipe-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Planning */
.planning-days { padding: 0 20px 100px; }
.day-section { margin-bottom: 16px; }
.day-label { font-family: var(--font-display); font-size: 14px; color: var(--color-text-secondary); text-transform: capitalize; margin-bottom: 8px; font-weight: 400; letter-spacing: 0; }
.day-slots { display: flex; flex-direction: column; gap: 1px; background: var(--color-border); border-radius: var(--radius-md, 12px); overflow: hidden; }
.add-slot-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: var(--color-bg-elevated); border: none; font-family: var(--font-body); font-size: 14px; color: var(--color-primary); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.add-slot-btn:active { background: var(--color-bg-secondary); }

/* Shopping */
.shopping-actions { display: flex; gap: 8px; padding: 8px 20px 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; border-radius: 10px; font-family: var(--font-body); font-size: 14px; font-weight: 500; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.action-btn.primary { background: var(--color-primary); color: white; border-radius: var(--radius); }
.action-btn.danger { background: var(--color-danger-ghost); color: var(--color-danger); border-radius: var(--radius); }
.action-btn:active { opacity: 0.7; }

.shopping-list { margin: 0 20px; border-radius: var(--radius-md, 12px); overflow: hidden; margin-bottom: 12px; }

.add-manual { display: flex; gap: 8px; padding: 0 20px 100px; }
.manual-input { flex: 1; padding: 12px 16px; background: var(--color-bg-elevated); border: 0.5px solid var(--color-border); border-radius: 10px; font-size: 15px; font-family: var(--font-body); color: var(--color-text); outline: none; }
.manual-input::placeholder { color: var(--color-text-tertiary); }
.manual-add-btn { background: var(--color-primary); color: white; border: none; border-radius: 10px; width: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; flex: 1; }
.empty-icon { color: var(--color-text-tertiary); opacity: 0.4; }
.empty-text { font-family: var(--font-display); font-size: 18px; font-weight: 400; color: var(--color-text); margin-top: 16px; }
.empty-sub { font-family: var(--font-body); font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; }

/* FAB */
.fab { position: fixed; bottom: calc(80px + var(--safe-area-bottom, 0px)); right: 20px; width: 56px; height: 56px; border-radius: 16px; background: var(--color-primary); color: white; border: none; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 50; display: flex; align-items: center; justify-content: center; transition: opacity 200ms ease, transform 200ms ease; -webkit-tap-highlight-color: transparent; animation: fab-in 300ms ease both; }
.fab:active { opacity: 0.7; }
@keyframes fab-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
