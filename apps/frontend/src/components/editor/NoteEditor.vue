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

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const editorStyle = computed(() => {
  if (!props.categoryStyle) return {};
  const s: Record<string, string> = {};
  if (props.categoryStyle.backgroundColor) {
    s.backgroundColor = props.categoryStyle.backgroundColor;
    s.color = isLightColor(props.categoryStyle.backgroundColor) ? '#111827' : '#f9fafb';
  }
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
  background: var(--color-bg-elevated);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 120px;
  -webkit-overflow-scrolling: touch;
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 200px;
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.47;
  color: var(--color-text);
  letter-spacing: -0.022em;
}

.editor-content :deep(.tiptap a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.editor-content :deep(.tiptap > * + *) {
  margin-top: 0.4em;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--color-text-tertiary);
  pointer-events: none;
  float: left;
  height: 0;
}

/* Headings */
.editor-content :deep(.tiptap h1),
.editor-content :deep(.tiptap h2),
.editor-content :deep(.tiptap h3) {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-text);
  margin-top: 1em;
  margin-bottom: 0.2em;
}

.editor-content :deep(.tiptap h1) {
  font-size: 28px;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
.editor-content :deep(.tiptap h2) {
  font-size: 22px;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.editor-content :deep(.tiptap h3) {
  font-size: 19px;
  letter-spacing: -0.017em;
  line-height: 1.3;
}

/* Task lists - iOS checklist style */
.editor-content :deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li label) {
  margin-top: 2px;
  flex-shrink: 0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li label input[type="checkbox"]) {
  width: 22px;
  height: 22px;
  accent-color: var(--color-primary);
  cursor: pointer;
  border-radius: 50%;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li[data-checked="true"] > div > p) {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

/* Lists */
.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  padding-left: 1.3em;
}

.editor-content :deep(.tiptap li) {
  padding: 2px 0;
}

.editor-content :deep(.tiptap li::marker) {
  color: var(--color-text-secondary);
}

/* Blockquote */
.editor-content :deep(.tiptap blockquote) {
  border-left: 3px solid var(--color-border);
  padding-left: 14px;
  color: var(--color-text-secondary);
  margin: 12px 0;
}

/* Images */
.editor-content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: var(--radius);
  margin: 8px 0;
}

/* Tables */
.editor-content :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.editor-content :deep(.tiptap td),
.editor-content :deep(.tiptap th) {
  border: 0.5px solid var(--color-border);
  padding: 8px 12px;
  min-width: 60px;
  font-size: 15px;
}

.editor-content :deep(.tiptap th) {
  background: var(--color-bg);
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* HR */
.editor-content :deep(.tiptap hr) {
  border: none;
  height: 0.5px;
  background: var(--color-border);
  margin: 20px 0;
}

/* Inline code */
.editor-content :deep(.tiptap code) {
  background: var(--color-bg);
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 0.9em;
  font-family: var(--font-mono);
  color: var(--color-primary);
}

/* Code block */
.editor-content :deep(.tiptap pre) {
  background: var(--color-bg);
  border-radius: var(--radius);
  padding: 14px 16px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
}

.editor-content :deep(.tiptap pre code) {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

.editor-content :deep(.tiptap strong) {
  font-weight: 600;
}
</style>
