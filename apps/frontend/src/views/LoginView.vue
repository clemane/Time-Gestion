<template>
  <div class="auth-page">
    <div class="auth-bg"></div>
    <div class="auth-card">
      <div class="auth-logo">TG</div>
      <h1>Time Gestion</h1>
      <p class="subtitle">Connectez-vous a votre compte</p>
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" placeholder="email@exemple.com" />
        </div>
        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password" placeholder="••••••" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
      <p class="link">Pas de compte ? <RouterLink to="/register">Creer un compte</RouterLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleLogin() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/notes');
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur de connexion';
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
  padding: 24px;
  background: linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);
  position: relative;
  overflow: hidden;
}

.auth-bg {
  display: none;
}

.auth-card {
  position: relative;
  background: var(--color-bg-elevated);
  border: none;
  border-radius: var(--radius-xl);
  padding: 40px 24px 32px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--shadow-lg);
  animation: auth-enter 400ms ease both;
}

.auth-logo {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  margin: 0 auto 16px;
  letter-spacing: -0.02em;
}

.auth-card h1 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0;
  margin-bottom: 4px;
  text-align: center;
  color: var(--color-text);
}

.subtitle {
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 28px;
  font-size: 15px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
}

.field input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 17px;
  transition: border-color var(--transition-fast);
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.field input::placeholder {
  color: var(--color-text-tertiary);
}

.error {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--color-danger-ghost);
  border-radius: var(--radius);
  font-weight: 500;
}

.btn-primary {
  width: 100%;
  height: 50px;
  padding: 0 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-primary:active {
  opacity: 0.7;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.link {
  text-align: center;
  margin-top: 20px;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.link a {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 17px;
}
</style>
