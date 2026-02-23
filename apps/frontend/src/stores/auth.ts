import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@time-gestion/shared';
import { apiFetch, setAccessToken } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  async function register(email: string, password: string, displayName: string) {
    const data = await apiFetch<{ accessToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setAccessToken(data.accessToken);
    user.value = data.user;
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    user.value = data.user;
  }

  async function refresh() {
    try {
      const data = await apiFetch<{ accessToken: string; user: User }>('/auth/refresh', { method: 'POST' });
      setAccessToken(data.accessToken);
      user.value = data.user;
    } catch {
      user.value = null;
      setAccessToken(null);
    }
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    user.value = null;
    setAccessToken(null);
  }

  return { user, isAuthenticated, register, login, refresh, logout };
});
