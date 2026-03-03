<template>
  <div class="tags-input">
    <span v-for="(tag, i) in modelValue" :key="tag" class="tag-chip">
      {{ tag }}
      <button class="tag-remove" @click="removeTag(i)">&times;</button>
    </span>
    <input
      v-model="newTag"
      class="tag-field"
      placeholder="Ajouter un tag..."
      @keydown.enter.prevent="addTag"
      @keydown.,="addTag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [tags: string[]] }>();

const newTag = ref('');

function addTag() {
  const tag = newTag.value.replace(',', '').trim();
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag]);
  }
  newTag.value = '';
}

function removeTag(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
</script>

<style scoped>
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md, 12px);
  border: 0.5px solid var(--color-border);
  min-height: 44px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  opacity: 0.7;
}

.tag-remove:hover { opacity: 1; }

.tag-field {
  border: none;
  background: none;
  outline: none;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  flex: 1;
  min-width: 100px;
}

.tag-field::placeholder {
  color: var(--color-text-tertiary);
}
</style>
