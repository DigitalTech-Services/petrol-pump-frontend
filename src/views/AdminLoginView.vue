<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:var(--bg)">

    <!-- Background glow -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style="background:radial-gradient(circle,#6366f1,transparent 70%)"/>
    </div>

    <div class="w-full max-w-[420px] relative z-10">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 font-display font-bold text-3xl text-[var(--text)]"
          style="background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 0 50px rgba(99,102,241,0.35)"
        >A</div>
        <h1 class="font-display font-bold text-[30px] text-[var(--text)] tracking-wide">Admin Portal</h1>
        <p class="text-[13px] text-[var(--text-3)] mt-1.5">Kailas Petromines · User Management</p>
      </div>

      <!-- Login Card -->
      <div class="card p-7">
        <h2 class="font-display font-bold text-[20px] text-[var(--text)] mb-0.5">Admin Sign In</h2>
        <p class="text-[13px] text-[var(--text-3)] mb-5">Enter your admin credentials</p>

        <form @submit.prevent="handleLogin">

          <!-- Username -->
          <div class="mb-4">
            <label class="field-label">Username</label>
            <input
              v-model="form.username"
              type="text"
              class="form-input w-full"
              placeholder="admin"
              autocomplete="username"
              required
            />
          </div>

          <!-- Password -->
          <div class="mb-5">
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

          <!-- Submit -->
          <button
            type="submit"
            class="w-full justify-center py-2.5 text-[14px] font-semibold rounded-xl text-[var(--text)] transition-all duration-150 flex items-center gap-2"
            style="background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 0 20px rgba(99,102,241,0.3)"
            :disabled="loading"
          >
            <RotateCw v-if="loading" :size="14" class="animate-spin" />
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

      <p class="text-center text-[11.5px] text-[var(--text-3)] mt-5">
        <router-link to="/login" class="hover:text-[var(--text-2)] transition-colors">← User Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { AlertTriangle, RotateCw, Eye, EyeOff } from 'lucide-vue-next'

const router   = useRouter()
const route    = useRoute()
const adminAuth = useAdminAuthStore()
const loading  = ref(false)
const showPass = ref(false)
const errorMsg = ref('')

const form = reactive({ username: '', password: '' })

async function handleLogin() {
  loading.value  = true
  errorMsg.value = ''
  try {
    await adminAuth.login({ username: form.username, password: form.password })
    const redirect = route.query.redirect || '/admin/users'
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
