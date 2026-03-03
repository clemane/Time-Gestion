<template>
  <div class="editor-toolbar">
    <div class="toolbar-scroll">
      <button :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Gras">
        <Bold :size="18" />
      </button>
      <button :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italique">
        <Italic :size="18" />
      </button>
      <button :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Barre">
        <Strikethrough :size="18" />
      </button>
      <span class="separator" />
      <button :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="Titre 1">
        <Heading1 :size="18" />
      </button>
      <button :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="Titre 2">
        <Heading2 :size="18" />
      </button>
      <button :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="Titre 3">
        <Heading3 :size="18" />
      </button>
      <span class="separator" />
      <button :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Liste">
        <List :size="18" />
      </button>
      <button :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Liste numerotee">
        <ListOrdered :size="18" />
      </button>
      <button :class="{ active: editor.isActive('taskList') }" @click="editor.chain().focus().toggleTaskList().run()" title="Checklist">
        <ListChecks :size="18" />
      </button>
      <span class="separator" />
      <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }" title="Citation">
        <Quote :size="18" />
      </button>
      <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }" title="Code">
        <Code :size="18" />
      </button>
      <button @click="editor.chain().focus().setHorizontalRule().run()" title="Separateur">
        <Minus :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Code, Minus } from 'lucide-vue-next';

defineProps<{ editor: Editor }>();
</script>

<style scoped>
.editor-toolbar {
  position: fixed;
  bottom: calc(50px + var(--safe-area-bottom) + 2px);
  left: 0;
  right: 0;
  background: var(--bar-bg);
  backdrop-filter: blur(var(--bar-blur));
  -webkit-backdrop-filter: blur(var(--bar-blur));
  border-top: 0.5px solid var(--bar-border);
  z-index: 50;
}

.toolbar-scroll {
  display: flex;
  gap: 0;
  padding: 6px 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.toolbar-scroll::-webkit-scrollbar {
  display: none;
}

.toolbar-scroll button {
  flex-shrink: 0;
  padding: 8px 10px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  min-width: 36px;
  min-height: 36px;
}

.toolbar-scroll button:active {
  background: var(--color-primary-ghost);
}

.toolbar-scroll button.active {
  background: var(--color-primary-ghost);
  color: var(--color-primary);
  font-weight: 600;
}

.separator {
  width: 0.5px;
  background: var(--color-border);
  margin: 8px 4px;
  flex-shrink: 0;
}
</style>
