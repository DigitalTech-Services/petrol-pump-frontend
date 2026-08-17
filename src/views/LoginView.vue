<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:var(--bg)">

    <!-- Background glow -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style="background:radial-gradient(circle,#f59e0b,transparent 70%)"/>
    </div>

    <div class="w-full max-w-[420px] relative z-10">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 font-display font-bold text-3xl text-[var(--bg)]"
          style="background:linear-gradient(135deg,#f59e0b,#d97706); box-shadow:0 0 50px rgba(245,158,11,0.35)"
         > {{ businessName?.charAt(0)?.toUpperCase() }}</div>
        <h1 class="font-display font-bold text-[30px] text-[var(--text)] tracking-wide">{{ businessName }}</h1>
        <!-- <p class="text-[13px] text-[var(--text-3)] mt-1.5">HP Fuel Station · Khopoli, Maharashtra</p> -->
      </div>

      <!-- Demo Accounts Banner -->
      <!-- <div class="mb-5 p-4 rounded-xl" style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2)">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[#f59e0b] text-base">🔑</span>
          <span class="font-display font-bold text-[14px] text-[#f59e0b]">Demo Accounts — Click to Fill</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="demo in demoAccounts" :key="demo.role"
            @click="fillDemo(demo)"
            class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all duration-150 text-left"
            style="background:var(--bg-3); border:1px solid var(--border)"
            :class="form.email === demo.email ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.08)]' : 'hover:border-[var(--border-2)]'"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[12px] text-[var(--text)] flex-shrink-0"
              :style="{ background: demo.color }">{{ demo.initials }}</div>
            <div>
              <div class="text-[11.5px] font-semibold text-[var(--text)]">{{ demo.label }}</div>
              <div class="text-[10px] text-[var(--text-3)]">{{ demo.password }}</div>
            </div>
          </button>
        </div>
      </div> -->

      <!-- Login Card -->
      <div class="card p-7">
        <h2 class="font-display font-bold text-[20px] text-[var(--text)] mb-0.5">Sign In</h2>
        <p class="text-[13px] text-[var(--text-3)] mb-5">Enter your credentials</p>

        <form @submit.prevent="handleLogin">

          <!-- Email -->
          <div class="mb-4">
            <label class="field-label">Email</label>
            <input
              v-model="form.email"
              type="text"
              class="form-input w-full"
              placeholder="admin@petromines.com"
              autocomplete="username"
              required
            />
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label class="field-label">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="form-input w-full pr-10"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-sm"
              ><component :is="showPass ? EyeOff : Eye" :size="16" /></button>
            </div>
          </div>

          <!-- Remember -->
          <!-- <div class="flex items-center justify-between mb-5 text-[12.5px]">
            <label class="flex items-center gap-2 cursor-pointer text-[var(--text-2)]">
              <input type="checkbox" v-model="form.remember" class="accent-[#f59e0b] rounded" />
              Remember me
            </label>
            <a href="#" class="text-[#f59e0b] hover:text-[#fbbf24] transition-colors">Forgot password?</a>
          </div> -->

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary w-full justify-center py-2.5 text-[14px]"
            :disabled="loading"
          >
            <RotateCw v-if="loading" :size="14" class="animate-spin mr-1" />
            <span>{{ loading ? 'Signing in…' : 'Sign In →' }}</span>
          </button>

          <!-- Error -->
          <Transition name="fade">
            <div v-if="errorMsg" class="mt-3 px-4 py-3 rounded-lg text-[12.5px]"
              style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
              <AlertTriangle :size="13" class="inline mr-1" />{{ errorMsg }}
            </div>
          </Transition>

        </form>
      </div>

      <!-- Credentials cheatsheet -->
      <!-- <div class="mt-4 p-3 rounded-lg text-[11.5px] text-[var(--text-3)]" style="background:var(--bg-2); border:1px solid var(--bg-4)">
        <div class="font-semibold text-[var(--text-2)] mb-1.5">Quick credentials:</div>
        <div class="grid grid-cols-1 gap-0.5 font-mono-custom">
          <div>admin@petromines.com / <span class="text-[#f59e0b]">admin123</span></div>
          <div>manager@petromines.com / <span class="text-[#3b82f6]">manager123</span></div>
          <div>staff@petromines.com / <span class="text-[#10b981]">staff123</span></div>
        </div>
      </div> -->

      <!-- <p class="text-center text-[11.5px] text-[var(--text-3)] mt-5">
        Petromines Management v1.0 · No backend required for demo
      </p> -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/api'
import { RotateCw, AlertTriangle, Eye, EyeOff } from 'lucide-vue-next'

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const loading  = ref(false)
const showPass = ref(false)
const errorMsg = ref('')

const form = reactive({ email: '', password: '', remember: false })

// ── Business name preview — swaps the default brand for the typed
// email's own business name, debounced so we don't fire on every keystroke.
const DEFAULT_BUSINESS_NAME = ''
const businessName = ref(DEFAULT_BUSINESS_NAME)
let lookupTimer = null

watch(() => form.email, (email) => {
  clearTimeout(lookupTimer)
  const trimmed = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    businessName.value = DEFAULT_BUSINESS_NAME
    return
  }
  lookupTimer = setTimeout(async () => {
    try {
      const res = await authApi.lookupBusinessName(trimmed)
      businessName.value = res.data?.business_name || DEFAULT_BUSINESS_NAME
    } catch {
      businessName.value = DEFAULT_BUSINESS_NAME
    }
  }, 400)
})

// const demoAccounts = [
//   { label:'Admin',   role:'admin',   email:'admin@petromines.com',   password:'admin123',   initials:'KP', color:'#f59e0b' },
//   { label:'Manager', role:'manager', email:'manager@petromines.com', password:'manager123', initials:'SA', color:'#6366f1' },
//   { label:'Staff',   role:'staff',   email:'staff@petromines.com',   password:'staff123',   initials:'AK', color:'#10b981' },
// ]

// function fillDemo(demo) {
//   form.email    = demo.email
//   form.password = demo.password
//   errorMsg.value = ''
// }

async function handleLogin() {
  // if (!form.email || !form.password) return
  loading.value  = true
  errorMsg.value = ''
  try {
    await auth.login({ email: form.email, password: form.password, remember: form.remember })
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    errorMsg.value = e?.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 11.5px;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
