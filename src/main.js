import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useThemeStore } from './stores/theme'
import './assets/css/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
useThemeStore()
app.mount('#app')
