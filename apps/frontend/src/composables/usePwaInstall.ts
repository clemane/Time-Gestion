import { ref, onMounted } from 'vue';

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const canInstall = ref(false);
const dismissed = ref(false);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tg-pwa-install-dismissed';

export function usePwaInstall() {
  onMounted(() => {
    // Check if already dismissed recently (7 days)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        dismissed.value = true;
      }
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      canInstall.value = false;
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
      canInstall.value = true;
    });

    window.addEventListener('appinstalled', () => {
      canInstall.value = false;
      deferredPrompt.value = null;
    });
  });

  async function install() {
    if (!deferredPrompt.value) return;
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === 'accepted') {
      canInstall.value = false;
    }
    deferredPrompt.value = null;
  }

  function dismiss() {
    dismissed.value = true;
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  return { canInstall, dismissed, install, dismiss };
}
