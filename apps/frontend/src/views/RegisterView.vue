<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Time Gestion</h1>
      <p class="subtitle">Creer un compte</p>
      <form @submit.prevent="handleRegister">
        <div class="field">
          <label for="displayName">Nom</label>
          <input id="displayName" v-model="displayName" type="text" required autocomplete="name" placeholder="Votre nom" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" placeholder="email@exemple.com" />
        </div>
        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" v-model="password" type="password" required autocomplete="new-password" placeholder="••••••" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Creation...' : 'Creer un compte' }}
        </button>
      </form>
      <p class="link">Deja un compte ? <RouterLink to="/login">Se connecter</RouterLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const displayName = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleRegister() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.register(email.value, password.value, displayName.value);
    router.push('/notes');
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la creation du compte';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 16px;
  background: var(--color-bg-secondary);
}

.auth-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.auth-card h1 {
  font-size: 24px;
  margin-bottom: 4px;
  text-align: center;
}

.subtitle {
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.error {
  color: var(--color-danger);
  font-size: 14px;
  margin-bottom: 12px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
