import { ref, computed, watchEffect, type Ref } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AccentColor {
  name: string;
  value: string;
  light: string;
  dark: string;
}

export const ACCENT_PRESETS: AccentColor[] = [
  { name: 'Sauge', value: '#7C9A82', light: '#9AB8A0', dark: '#5E7D64' },
  { name: 'Terre cuite', value: '#C4856A', light: '#D4A08A', dark: '#A66B52' },
  { name: 'Miel', value: '#D4A547', light: '#E0BD6E', dark: '#B88C32' },
  { name: 'Lavande', value: '#8B7EB8', light: '#A99ACA', dark: '#6E6398' },
  { name: 'Ocean', value: '#5E8C8A', light: '#7EAAA8', dark: '#4A7270' },
  { name: 'Rouille', value: '#B85C4A', light: '#D07A6A', dark: '#9A4838' },
  { name: 'Olive', value: '#8A9A5E', light: '#A4B278', dark: '#6E7E48' },
  { name: 'Prune', value: '#8E5E7A', light: '#AA7E96', dark: '#724A62' },
];

const STORAGE_MODE_KEY = 'tg-theme-mode';
const STORAGE_ACCENT_KEY = 'tg-theme-accent';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function loadMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_MODE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function loadAccent(): AccentColor {
  const stored = localStorage.getItem(STORAGE_ACCENT_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name && parsed.value) return parsed;
    } catch { /* ignore */ }
  }
  return ACCENT_PRESETS[0];
}

// Singleton state shared across all composable calls
const mode: Ref<ThemeMode> = ref(loadMode());
const accentColor: Ref<AccentColor> = ref(loadAccent());

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const resolvedTheme = computed<'light' | 'dark'>(() => {
  if (mode.value === 'system') {
    return darkQuery.matches ? 'dark' : 'light';
  }
  return mode.value;
});

// Listen for OS theme changes when in system mode
darkQuery.addEventListener('change', () => {
  // Force reactivity update by re-assigning when in system mode
  if (mode.value === 'system') {
    mode.value = 'system';
  }
});

let initialized = false;

export function useTheme() {
  if (!initialized) {
    initialized = true;

    watchEffect(() => {
      const theme = resolvedTheme.value;
      const accent = accentColor.value;
      const doc = document.documentElement;

      // Apply data-theme
      doc.setAttribute('data-theme', theme);

      // Apply accent color variables
      doc.style.setProperty('--color-primary', accent.value);
      doc.style.setProperty('--color-primary-light', accent.light);
      doc.style.setProperty('--color-primary-dark', accent.dark);
      const ghostAlpha = theme === 'dark' ? 0.2 : 0.1;
      doc.style.setProperty('--color-primary-ghost', hexToRgba(accent.value, ghostAlpha));

      // Update meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]');
      const themeColor = theme === 'dark' ? '#1C1A17' : '#FAF8F5';
      if (meta) {
        meta.setAttribute('content', themeColor);
      }
    });
  }

  function setMode(newMode: ThemeMode) {
    document.body.classList.add('theme-transitioning');
    mode.value = newMode;
    localStorage.setItem(STORAGE_MODE_KEY, newMode);
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  }

  function setAccent(accent: AccentColor) {
    accentColor.value = accent;
    localStorage.setItem(STORAGE_ACCENT_KEY, JSON.stringify(accent));
  }

  return {
    mode,
    accentColor,
    resolvedTheme,
    setMode,
    setAccent,
    ACCENT_PRESETS,
  };
}
