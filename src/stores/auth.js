import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'

// ── Demo accounts — work WITHOUT any backend ──────────────────────
// const DEMO_USERS = {
//   'admin@petromines.com': {
//     password: 'admin123',
//     user: { id: '1', name: 'Kailas Patil', email: 'admin@petromines.com',
//             role: 'admin', stationName: 'Kailas Petromines', avatar: 'KP' }
//   },
//   'manager@petromines.com': {
//     password: 'manager123',
//     user: { id: '2', name: 'Shaikh Ahmed', email: 'manager@petromines.com',
//             role: 'manager', stationName: 'Kailas Petromines', avatar: 'SA' }
//   },
//   'staff@petromines.com': {
//     password: 'staff123',
//     user: { id: '3', name: 'Ajay Kumar', email: 'staff@petromines.com',
//             role: 'staff', stationName: 'Kailas Petromines', avatar: 'AK' }
//   },
//   // shorthand aliases
//   'admin': {
//     password: 'admin123',
//     user: { id: '1', name: 'Kailas Patil', email: 'admin@petromines.com',
//             role: 'admin', stationName: 'Kailas Petromines', avatar: 'KP' }
//   },
// }

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('pm_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('pm_user') || 'null'))

  const isLoggedIn  = computed(() => !!token.value)
  const isOwner     = computed(() => user.value?.type === 'user')
  const isManager   = computed(() => user.value?.type === 'sub_user')
  const role        = computed(() => user.value?.type === 'sub_user' ? 'Manager' : 'Owner')
  const stationName = computed(() => user.value?.stationName || 'Kailas Petromines')
  const fullName    = computed(() => user.value?.name || 'Kailas Petromines')

  async function login(credentials) {
    // const { email, password } = credentials

    // ── 1. Try demo login first (no backend needed) ───────────────
    // const demo = DEMO_USERS[email?.toLowerCase().trim()]
    // if (demo && demo.password === password) {
    //   const fakeToken = 'demo_token_' + Date.now()
    //   token.value = fakeToken
    //   user.value  = demo.user
    //   localStorage.setItem('pm_token', fakeToken)
    //   localStorage.setItem('pm_user', JSON.stringify(demo.user))
    //   return { token: fakeToken, user: demo.user }
    // }

    // ── 2. Fall back to real API if backend is running ────────────
    try {
      const res = await authApi.login(credentials)

      // console.log(res.data);
      
      if (res.success) {
        token.value = res.data.token
        user.value  = res.data.user
        localStorage.setItem('pm_token', res.data.token)
        localStorage.setItem('pm_user', JSON.stringify(res.data.user))
        return res
      }
      
      throw { message: 'Invalid credentials!' }
    } catch (e) {
      // If API not reachable AND not a demo user → show helpful error
      // if (!demo) {
      throw { message: 'Invalid credentials!' }
      // }
      // throw e
    }
  }

  async function logout() {
    // Skip API call for demo tokens
    if (!token) {
      try { await authApi.logout() } catch (_) { }
    }
    token.value = null
    user.value = null
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_user')
  }

  return { token, user, isLoggedIn, isOwner, isManager, role, stationName, fullName, login, logout }
})
