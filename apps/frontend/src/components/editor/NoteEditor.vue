<template>
  <div class="note-editor" :style="editorStyle">
    <EditorContent :editor="editor" class="editor-content" />
    <EditorToolbar v-if="editor" :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch, computed } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import EditorToolbar from './EditorToolbar.vue';
import type { CategoryStyle } from '@time-gestion/shared';

const props = defineProps<{
  modelValue: Record<string, unknown>;
  categoryStyle?: CategoryStyle | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
}>();

const editor = useEditor({
  extensions: [
    StarterKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
    Placeholder.configure({ placeholder: 'Commencez a ecrire...' }),
  ],
  content: props.modelValue as Record<string, unknown>,
  onUpdate({ editor: e }) {
    emit('update:modelValue', e.getJSON() as Record<string, unknown>);
  },
});

const editorStyle = computed(() => {
  if (!props.categoryStyle) return {};
  const s: Record<string, string> = {};
  if (props.categoryStyle.backgroundColor) s.backgroundColor = props.categoryStyle.backgroundColor;
  if (props.categoryStyle.fontFamily) s.fontFamily = props.categoryStyle.fontFamily;
  if (props.categoryStyle.fontSize) s.fontSize = `${props.categoryStyle.fontSize}px`;
  return s;
});

watch(() => props.modelValue, (val) => {
  if (!editor.value) return;
  const current = JSON.stringify(editor.value.getJSON());
  const incoming = JSON.stringify(val);
  if (current !== incoming) {
    editor.value.commands.setContent(val as Record<string, unknown>, false);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px;
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 200px;
  font-size: 16px;
  line-height: 1.6;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--color-text-secondary);
  pointer-events: none;
  float: left;
  height: 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li label) {
  margin-top: 4px;
}

.editor-content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: var(--radius);
}

.editor-content :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.editor-content :deep(.tiptap td),
.editor-content :deep(.tiptap th) {
  border: 1px solid var(--color-border);
  padding: 8px;
  min-width: 60px;
}
</style>
