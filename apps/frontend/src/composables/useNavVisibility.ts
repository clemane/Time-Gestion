import { ref } from 'vue';

const visible = ref(true);

export function useNavVisibility() {
  function hide() { visible.value = false; }
  function show() { visible.value = true; }
  return { navVisible: visible, hideNav: hide, showNav: show };
}
