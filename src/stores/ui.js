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
  const error   = (m) => addToast(m, 'error')
  const info    = (m) => addToast(m, 'info')

  return { sidebarOpen, toasts, toggleSidebar, closeSidebar, success, error, info }
})
