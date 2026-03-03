import type { Category } from '@time-gestion/shared';

export function getDefaultCategories(): Omit<Category, 'id' | 'userId'>[] {
  return [
    {
      name: 'Note',
      icon: '📝',
      style: { backgroundColor: '#ffffff', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
      defaultContent: null,
      isDefault: true,
      sortOrder: 0,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Checklist',
      icon: '✅',
      style: { backgroundColor: '#f0fdf4', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
            ],
          },
        ],
      },
      isDefault: true,
      sortOrder: 1,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Liste de courses',
      icon: '🛒',
      style: { backgroundColor: '#fefce8', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Courses' }],
          },
          {
            type: 'taskList',
            content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
            ],
          },
        ],
      },
      isDefault: true,
      sortOrder: 2,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Journal',
      icon: '📔',
      style: { backgroundColor: '#fdf4ff', lineStyle: 'lined', fontFamily: 'Georgia, serif', fontSize: 16 },
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }],
          },
          { type: 'paragraph' },
        ],
      },
      isDefault: true,
      sortOrder: 3,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Idees',
      icon: '💡',
      style: { backgroundColor: '#eff6ff', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
      defaultContent: null,
      isDefault: true,
      sortOrder: 4,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Reunion',
      icon: '🤝',
      style: { backgroundColor: '#fef2f2', lineStyle: 'lined', fontFamily: 'sans-serif', fontSize: 15 },
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Ordre du jour' }],
          },
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph' }] },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Notes' }],
          },
          { type: 'paragraph' },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Actions' }],
          },
          {
            type: 'taskList',
            content: [
              { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
            ],
          },
        ],
      },
      isDefault: true,
      sortOrder: 5,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      name: 'Recette',
      icon: '🍳',
      style: { backgroundColor: '#fff7ed', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Ingredients' }],
          },
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph' }] },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Etapes' }],
          },
          {
            type: 'orderedList',
            content: [
              { type: 'listItem', content: [{ type: 'paragraph' }] },
            ],
          },
        ],
      },
      isDefault: true,
      sortOrder: 6,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];
}
