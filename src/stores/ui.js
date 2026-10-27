import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen  = ref(false)
  const toasts       = ref([])
  let   _id = 0

  const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
  const closeSidebar  = () => (sidebarOpen.value = false)

  function addToast(message, type = 'success', ms = 3500) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, ms)
  }
  const success = (m) => addToast(m, 'success')
  // Errors and hints stay up longer — they usually need to be read, not glanced at
  const error   = (m) => addToast(m || 'Something went wrong.', 'error', 6000)
  const info    = (m) => addToast(m, 'info', 5000)

  return { sidebarOpen, toasts, toggleSidebar, closeSidebar, success, error, info }
})
