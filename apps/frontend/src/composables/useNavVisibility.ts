import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const manualHide = ref(false);

const mainRoutes = new Set(['/dashboard', '/notes', '/calendar', '/menu', '/settings']);

export function useNavVisibility() {
  function hide() { manualHide.value = true; }
  function show() { manualHide.value = false; }
  return { manualHide, mainRoutes, hideNav: hide, showNav: show };
}

export function useNavVisible() {
  const route = useRoute();
  const { manualHide } = useNavVisibility();
  const navVisible = computed(() => {
    if (manualHide.value) return false;
    return mainRoutes.has(route.path);
  });
  return { navVisible };
}
