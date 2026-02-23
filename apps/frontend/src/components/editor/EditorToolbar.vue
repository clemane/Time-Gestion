<template>
  <div class="editor-toolbar">
    <div class="toolbar-scroll">
      <button :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
        <strong>B</strong>
      </button>
      <button :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
        <em>I</em>
      </button>
      <button :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
        <s>S</s>
      </button>
      <span class="separator" />
      <button :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">
        H1
      </button>
      <button :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
        H2
      </button>
      <button :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
        H3
      </button>
      <span class="separator" />
      <button :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
        &bull; List
      </button>
      <button :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
        1. List
      </button>
      <button :class="{ active: editor.isActive('taskList') }" @click="editor.chain().focus().toggleTaskList().run()">
        &#x2611; Todo
      </button>
      <span class="separator" />
      <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }">
        &laquo; &raquo;
      </button>
      <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }">
        &lt;/&gt;
      </button>
      <button @click="editor.chain().focus().setHorizontalRule().run()">
        &#x2015;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

defineProps<{ editor: Editor }>();
</script>

<style scoped>
.editor-toolbar {
  position: fixed;
  bottom: calc(56px + var(--safe-area-bottom));
  left: 0;
  right: 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  z-index: 50;
}

.toolbar-scroll {
  display: flex;
  gap: 2px;
  padding: 6px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.toolbar-scroll button {
  flex-shrink: 0;
  padding: 6px 10px;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 14px;
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-scroll button.active {
  background: var(--color-primary);
  color: white;
}

.toolbar-scroll button:active {
  background: var(--color-bg-secondary);
}

.separator {
  width: 1px;
  background: var(--color-border);
  margin: 4px 4px;
  flex-shrink: 0;
}
</style>
