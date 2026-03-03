import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getAccessToken } from '@/api/client';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/notes',
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/views/NotesView.vue'),
    },
    {
      path: '/notes/:id',
      name: 'note-detail',
      component: () => import('@/views/NoteDetailView.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
    },
    {
      path: '/menu',
      name: 'menu',
      component: () => import('@/views/MenuView.vue'),
    },
    {
      path: '/menu/recipes/new',
      name: 'recipe-new',
      component: () => import('@/views/RecipeFormView.vue'),
    },
    {
      path: '/menu/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
    {
      path: '/menu/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeFormView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/settings/categories',
      name: 'categories',
      component: () => import('@/views/CategoryManagerView.vue'),
    },
  ],
});

let initialAuthDone = false;

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // On first navigation, if we have a stored token but user isn't loaded yet,
  // try to refresh the session before deciding to redirect
  if (!initialAuthDone) {
    initialAuthDone = true;
    if (getAccessToken() && !auth.isAuthenticated) {
      await auth.refresh();
    }
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' };
  }
});

export { router };
