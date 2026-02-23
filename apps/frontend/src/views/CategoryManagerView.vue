<template>
  <div class="category-manager">
    <header class="manager-header">
      <button class="btn-back" @click="router.push('/settings')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Parametres
      </button>
      <h1>Categories</h1>
    </header>

    <!-- Existing categories list -->
    <div class="categories-list">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="category-card"
        :style="{ borderLeft: cat.style.backgroundColor ? `4px solid ${cat.style.backgroundColor}` : undefined }"
        @click="editCategory(cat)"
      >
        <div class="category-info">
          <span v-if="cat.icon" class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
        <button class="btn-delete" @click.stop="confirmDelete(cat.id)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <p v-if="categories.length === 0" class="empty">Aucune categorie</p>
    </div>

    <!-- Add / Edit form -->
    <div class="category-form">
      <h2>{{ editingId ? 'Modifier' : 'Nouvelle categorie' }}</h2>

      <label class="form-label">Nom</label>
      <input v-model="formName" type="text" class="form-input" placeholder="Nom de la categorie" />

      <label class="form-label">Icone</label>
      <input v-model="formIcon" type="text" class="form-input" placeholder="Ex: &#x1f4d6; ou texte" />

      <label class="form-label">Couleur de fond</label>
      <div class="color-row">
        <input v-model="formBgColor" type="color" class="form-color" />
        <input v-model="formBgColor" type="text" class="form-input form-input-sm" placeholder="#ffffff" />
      </div>

      <label class="form-label">Style de lignes</label>
      <select v-model="formLineStyle" class="form-input">
        <option value="none">Aucun</option>
        <option value="lined">Lignes</option>
        <option value="grid">Grille</option>
      </select>

      <label class="form-label">Police</label>
      <select v-model="formFontFamily" class="form-input">
        <option value="">Par defaut</option>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans-serif</option>
        <option value="monospace">Monospace</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
      </select>

      <label class="form-label">Taille de police</label>
      <input v-model.number="formFontSize" type="number" class="form-input" min="12" max="32" />

      <!-- Preview -->
      <div class="preview-section">
        <h3>Apercu</h3>
        <div
          class="preview-box"
          :style="{
            backgroundColor: formBgColor || '#ffffff',
            fontFamily: formFontFamily || 'inherit',
            fontSize: `${formFontSize}px`,
            backgroundImage: previewBackground,
          }"
        >
          <p>Exemple de texte dans cette categorie.</p>
          <p>Deuxieme ligne pour illustrer le style.</p>
        </div>
      </div>

      <div class="form-actions">
        <button v-if="editingId" class="btn-secondary" @click="cancelEdit">Annuler</button>
        <button class="btn-primary" @click="saveCategory" :disabled="!formName.trim()">
          {{ editingId ? 'Mettre a jour' : 'Creer' }}
        </button>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deletingId" class="modal-overlay" @click="deletingId = null">
      <div class="modal-content" @click.stop>
        <h3>Supprimer la categorie ?</h3>
        <p>Cette action est irreversible.</p>
        <div class="modal-actions">
          <button @click="deletingId = null">Annuler</button>
          <button class="btn-danger" @click="doDelete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoriesStore } from '@/stores/categories';
import type { Category, CategoryStyle } from '@time-gestion/shared';

const router = useRouter();
const categoriesStore = useCategoriesStore();

const categories = computed(() => categoriesStore.categories);

const editingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const formName = ref('');
const formIcon = ref('');
const formBgColor = ref('#ffffff');
const formLineStyle = ref<CategoryStyle['lineStyle']>('none');
const formFontFamily = ref('');
const formFontSize = ref(16);

const previewBackground = computed(() => {
  if (formLineStyle.value === 'lined') {
    return `repeating-linear-gradient(transparent, transparent ${formFontSize.value * 1.6 - 1}px, #ccc ${formFontSize.value * 1.6 - 1}px, #ccc ${formFontSize.value * 1.6}px)`;
  }
  if (formLineStyle.value === 'grid') {
    const size = formFontSize.value * 1.6;
    return `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)`;
  }
  return 'none';
});

function editCategory(cat: Category) {
  editingId.value = cat.id;
  formName.value = cat.name;
  formIcon.value = cat.icon || '';
  formBgColor.value = cat.style.backgroundColor || '#ffffff';
  formLineStyle.value = cat.style.lineStyle || 'none';
  formFontFamily.value = cat.style.fontFamily || '';
  formFontSize.value = cat.style.fontSize || 16;
}

function cancelEdit() {
  editingId.value = null;
  resetForm();
}

function resetForm() {
  formName.value = '';
  formIcon.value = '';
  formBgColor.value = '#ffffff';
  formLineStyle.value = 'none';
  formFontFamily.value = '';
  formFontSize.value = 16;
}

async function saveCategory() {
  if (!formName.value.trim()) return;

  const style: CategoryStyle = {
    backgroundColor: formBgColor.value,
    lineStyle: formLineStyle.value,
    fontFamily: formFontFamily.value,
    fontSize: formFontSize.value,
  };

  if (editingId.value) {
    await categoriesStore.update(editingId.value, {
      name: formName.value.trim(),
      icon: formIcon.value || null,
      style,
    });
    editingId.value = null;
  } else {
    await categoriesStore.create({
      name: formName.value.trim(),
      icon: formIcon.value || undefined,
      style,
    });
  }
  resetForm();
}

function confirmDelete(id: string) {
  deletingId.value = id;
}

async function doDelete() {
  if (deletingId.value) {
    await categoriesStore.remove(deletingId.value);
    if (editingId.value === deletingId.value) {
      editingId.value = null;
      resetForm();
    }
    deletingId.value = null;
  }
}

onMounted(async () => {
  await categoriesStore.loadFromLocal();
});
</script>

<style scoped>
.category-manager {
  padding-bottom: 32px;
}

.manager-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.manager-header h1 {
  font-size: 20px;
  font-weight: 700;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 15px;
  cursor: pointer;
}

.categories-list {
  padding: 16px;
}

.category-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.category-card:active {
  box-shadow: var(--shadow);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
}

.btn-delete {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius);
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 20px;
}

.category-form {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.category-form h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  margin-top: 12px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 15px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input-sm {
  flex: 1;
}

.color-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-color {
  width: 44px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 2px;
  cursor: pointer;
  background: var(--color-bg);
}

.preview-section {
  margin-top: 20px;
}

.preview-section h3 {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.preview-box {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  min-height: 80px;
  line-height: 1.6;
}

.preview-box p {
  margin-bottom: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  font-size: 15px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.modal-content {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 360px;
}

.modal-content h3 {
  margin-bottom: 8px;
}

.modal-content p {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-actions button {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.btn-danger {
  background: var(--color-danger) !important;
  color: white !important;
  border-color: var(--color-danger) !important;
}
</style>
