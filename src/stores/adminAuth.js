import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/services/api'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const token = ref(localStorage.getItem('pm_admin_token') || null)
  const admin = ref(JSON.parse(localStorage.getItem('pm_admin') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const username   = computed(() => admin.value?.username || 'Admin')

  async function login(credentials) {
    try {
      const res = await adminApi.login(credentials)
      if (res.success) {
        token.value = res.data.token
        admin.value = res.data.admin
        localStorage.setItem('pm_admin_token', res.data.token)
        localStorage.setItem('pm_admin', JSON.stringify(res.data.admin))
        return res
      }
      throw { message: 'Invalid credentials!' }
    } catch (e) {
      throw { message: e?.message || 'Invalid credentials!' }
    }
  }

  async function logout() {
    try { await adminApi.logout() } catch (_) {}
    token.value = null
    admin.value = null
    localStorage.removeItem('pm_admin_token')
    localStorage.removeItem('pm_admin')
  }

  return { token, admin, isLoggedIn, username, login, logout }
})
