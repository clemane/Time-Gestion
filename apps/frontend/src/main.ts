import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './styles/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

const splash = document.getElementById('splash')
if (splash) {
  splash.classList.add('splash-fade-out')
  splash.addEventListener('transitionend', () => splash.remove())
}
