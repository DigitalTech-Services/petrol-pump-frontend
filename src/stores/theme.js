import { defineStore } from 'pinia'
import { ref } from 'vue'

export const THEMES = [
  { key: 'dark',  label: 'Dark' },
  { key: 'light', label: 'Light' },
]

// Personal display preference, not tied to a station or role — persisted per
// browser like auth.js's token/user, applied as a data-theme attribute the
// CSS variables in assets/css/main.css key off of.
export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('pm_theme') || 'dark')

  function apply(name) {
    document.documentElement.setAttribute('data-theme', name)
  }

  function setTheme(name) {
    theme.value = name
    localStorage.setItem('pm_theme', name)
    apply(name)
  }

  // Sync the DOM attribute on startup (index.html already set it pre-mount to
  // avoid a flash — this just keeps them in agreement going forward).
  apply(theme.value)

  return { theme, setTheme }
})
