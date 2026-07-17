<template>
  <div class="min-h-screen" style="background:var(--bg)">

    <!-- Top Bar -->
    <header class="sticky top-0 z-30 flex items-center justify-between px-6 h-14 border-b"
      style="background:var(--bg-2); border-color:var(--bg-4)">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[var(--text)] text-sm"
          style="background:linear-gradient(135deg,#6366f1,#4f46e5)">A</div>
        <span class="font-display font-bold text-[var(--text)] text-[15px]">Admin Portal</span>
        <span class="text-[var(--border-2)] mx-1">·</span>
        <span class="text-[var(--text-3)] text-[13px]">Manage Users</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-[12.5px] text-[var(--text-2)]">
          Signed in as <strong class="text-[var(--text)]">{{ adminAuth.username }}</strong>
        </span>
        <button
          @click="handleLogout"
          class="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
          style="background:var(--bg-3); border:1px solid var(--border)"
        >Logout</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-6 py-8">

      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display font-bold text-[22px] text-[var(--text)]">Owners</h1>
          <p class="text-[13px] text-[var(--text-3)] mt-0.5">{{ owners.length }} owner account{{ owners.length !== 1 ? 's' : '' }} · {{ users.length - owners.length }} manager{{ users.length - owners.length !== 1 ? 's' : '' }}</p>
        </div>
        <button @click="openAdd" class="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-[var(--text)] transition-all"
          style="background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 0 20px rgba(99,102,241,0.25)">
          + Add Owner
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24 text-[var(--text-3)]">
        <RotateCw :size="20" class="animate-spin mr-2" /> Loading users…
      </div>

      <!-- Error -->
      <div v-else-if="fetchError" class="py-8 text-center">
        <p class="text-[#ef4444] text-[13px] mb-3">{{ fetchError }}</p>
        <button @click="loadUsers" class="text-[#6366f1] text-[13px] hover:underline">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!owners.length" class="py-20 text-center text-[var(--text-3)]">
        <Users :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-[14px]">No owners yet. Add the first one.</p>
      </div>

      <!-- Table -->
      <div v-else class="rounded-2xl overflow-hidden" style="border:1px solid var(--bg-4)">
        <table class="w-full text-[13px]">
          <thead>
            <tr style="background:var(--bg-2); border-bottom:1px solid var(--bg-4)">
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold w-8"></th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">#</th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Name</th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Email</th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Contact</th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Managers</th>
              <th class="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Created</th>
              <th class="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--text-3)] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(u, i) in owners" :key="u.id">
              <tr
                class="transition-colors hover:bg-[var(--bg-2)] cursor-pointer"
                style="border-bottom:1px solid var(--bg-3)"
                @click="toggleExpand(u.id)"
              >
                <td class="px-5 py-3.5 text-[var(--text-3)]">
                  <ChevronRight v-if="!managersOf(u.id).length" :size="15" class="opacity-20" />
                  <ChevronDown v-else-if="expanded.has(u.id)" :size="15" />
                  <ChevronRight v-else :size="15" />
                </td>
                <td class="px-5 py-3.5 text-[var(--text-3)]">{{ i + 1 }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-[var(--text)] flex-shrink-0"
                      :style="{ background: avatarColor(u.name) }">
                      {{ initials(u.name) }}
                    </div>
                    <div class="min-w-0">
                      <div class="text-[var(--text)] font-medium truncate">{{ u.name }}</div>
                      <div class="text-[11px] text-[var(--text-3)] truncate">{{ u.business_name || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-[var(--text-2)]">{{ u.email }}</td>
                <td class="px-5 py-3.5 text-[var(--text-2)]">{{ u.contact || '—' }}</td>
                <td class="px-5 py-3.5">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold" style="background:rgba(99,102,241,0.1); color:#818cf8">
                    {{ managersOf(u.id).length }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-[var(--text-3)] text-[12px]">{{ formatDate(u.created_at) }}</td>
                <td class="px-5 py-3.5 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="openEdit(u)"
                      class="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors text-[var(--text-2)] hover:text-[var(--text)]"
                      style="background:var(--bg-3); border:1px solid var(--border)"
                    >Edit</button>
                    <button
                      @click="openDelete(u)"
                      class="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]"
                      style="border:1px solid rgba(239,68,68,0.2)"
                    >Delete</button>
                  </div>
                </td>
              </tr>

              <!-- Nested managers -->
              <tr v-if="expanded.has(u.id) && managersOf(u.id).length" :key="`${u.id}-managers`">
                <td colspan="8" class="p-0" style="background:var(--bg)">
                  <table class="w-full text-[12.5px]">
                    <tbody>
                      <tr
                        v-for="m in managersOf(u.id)"
                        :key="m.id"
                        class="transition-colors hover:bg-[var(--bg-2)]"
                        style="border-bottom:1px solid var(--bg-3)"
                      >
                        <td class="px-5 py-2.5 w-8"></td>
                        <td class="px-5 py-2.5"></td>
                        <td class="px-5 py-2.5">
                          <div class="flex items-center gap-3 pl-4" style="border-left:2px solid var(--border)">
                            <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--text)] flex-shrink-0"
                              :style="{ background: avatarColor(m.name) }">
                              {{ initials(m.name) }}
                            </div>
                            <span class="text-[var(--text)]">{{ m.name }}</span>
                          </div>
                        </td>
                        <td class="px-5 py-2.5 text-[var(--text-2)]">{{ m.email }}</td>
                        <td class="px-5 py-2.5 text-[var(--text-2)]">{{ m.contact || '—' }}</td>
                        <td class="px-5 py-2.5">
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold" style="background:rgba(16,185,129,0.1); color:#10b981">
                            Manager
                          </span>
                        </td>
                        <td class="px-5 py-2.5 text-[var(--text-3)] text-[12px]">{{ formatDate(m.created_at) }}</td>
                        <td class="px-5 py-2.5 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              @click="openEdit(m)"
                              class="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors text-[var(--text-2)] hover:text-[var(--text)]"
                              style="background:var(--bg-3); border:1px solid var(--border)"
                            >Edit</button>
                            <button
                              @click="openDelete(m)"
                              class="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]"
                              style="border:1px solid rgba(239,68,68,0.2)"
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </main>

    <!-- ── Add / Edit Modal ── -->
    <Transition name="modal">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center px-4"
        style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
        @mousedown.self="closeModal">
        <div class="w-full max-w-[440px] rounded-2xl p-6" style="background:var(--bg-2); border:1px solid var(--border)">
          <h3 class="font-display font-bold text-[18px] text-[var(--text)] mb-1">
            {{ modal.mode === 'add' ? 'Add Owner' : (modal.userType === 'sub_user' ? 'Edit Manager' : 'Edit Owner') }}
          </h3>
          <p class="text-[12.5px] text-[var(--text-3)] mb-5">
            {{ modal.mode === 'add' ? 'Fill in the details to create a new owner account.' : 'Update account information.' }}
          </p>

          <form @submit.prevent="handleSubmit">

            <div class="mb-4" v-if="modal.mode === 'add' || modal.userType !== 'sub_user'">
              <label class="field-label">Business Name</label>
              <input v-model="form.business_name" type="text" class="form-input w-full" placeholder="Kailas Petromines" required />
            </div>

            <div class="mb-4">
              <label class="field-label">{{ modal.userType === 'sub_user' ? 'Manager Full Name' : 'Owner Full Name' }}</label>
              <input v-model="form.name" type="text" class="form-input w-full" placeholder="John Doe" required />
            </div>

            <div class="mb-4">
              <label class="field-label">Email</label>
              <input v-model="form.email" type="email" class="form-input w-full" placeholder="john@example.com" required />
            </div>

            <template v-if="modal.mode === 'add'">
              <div class="mb-4">
                <label class="field-label">Contact</label>
                <input v-model="form.contact" type="text" class="form-input w-full" placeholder="9876543210" maxlength="10" required />
              </div>

              <div class="mb-5">
                <label class="field-label">Password</label>
                <div class="relative">
                  <input
                    v-model="form.password"
                    :type="showPass ? 'text' : 'password'"
                    class="form-input w-full pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" @click="showPass = !showPass"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)] text-sm">
                    <component :is="showPass ? EyeOff : Eye" :size="16" />
                  </button>
                </div>
              </div>
            </template>

            <!-- Submit error -->
            <Transition name="fade">
              <div v-if="submitError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                <AlertTriangle :size="13" class="inline mr-1" />{{ submitError }}
              </div>
            </Transition>

            <!-- Actions -->
            <div class="flex gap-3 justify-end">
              <button type="button" @click="closeModal"
                class="px-4 py-2 rounded-xl text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
                style="background:var(--bg-3); border:1px solid var(--border)">
                Cancel
              </button>
              <button type="submit"
                class="px-5 py-2 rounded-xl text-[13px] font-semibold text-[var(--text)] transition-all flex items-center gap-2"
                style="background:linear-gradient(135deg,#6366f1,#4f46e5)"
                :disabled="submitting">
                <RotateCw v-if="submitting" :size="14" class="animate-spin" />
                <span>{{ submitting ? 'Saving…' : (modal.mode === 'add' ? 'Add User' : 'Save Changes') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ── Delete Confirmation Modal ── -->
    <Transition name="modal">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center px-4"
        style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
        @mousedown.self="deleteModal.open = false">
        <div class="w-full max-w-[380px] rounded-2xl p-6" style="background:var(--bg-2); border:1px solid var(--border)">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style="background:rgba(239,68,68,0.1)">
            <Trash2 :size="22" class="text-[#ef4444]" />
          </div>
          <h3 class="font-display font-bold text-[18px] text-[var(--text)] mb-1">Delete User</h3>
          <p class="text-[13px] text-[var(--text-3)] mb-5">
            Are you sure you want to delete <strong class="text-[var(--text)]">{{ deleteModal.user?.name }}</strong>?
            This action cannot be undone.
          </p>

          <Transition name="fade">
            <div v-if="deleteError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
              style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
              <AlertTriangle :size="13" class="inline mr-1" />{{ deleteError }}
            </div>
          </Transition>

          <div class="flex gap-3 justify-end">
            <button @click="deleteModal.open = false"
              class="px-4 py-2 rounded-xl text-[13px] font-medium text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
              style="background:var(--bg-3); border:1px solid var(--border)">
              Cancel
            </button>
            <button @click="confirmDelete"
              class="px-5 py-2 rounded-xl text-[13px] font-semibold text-[var(--text)] transition-all flex items-center gap-2"
              style="background:linear-gradient(135deg,#ef4444,#dc2626)"
              :disabled="deleting">
              <RotateCw v-if="deleting" :size="14" class="animate-spin" />
              <span>{{ deleting ? 'Deleting…' : 'Delete' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show"
        class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-[13px] font-medium text-[var(--text)] flex items-center gap-2"
        :style="toast.type === 'success'
          ? 'background:#10b981; box-shadow:0 4px 20px rgba(16,185,129,0.3)'
          : 'background:#ef4444; box-shadow:0 4px 20px rgba(239,68,68,0.3)'">
        {{ toast.type === 'success' ? '✓' : '✕' }} {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { adminApi } from '@/services/api'
import { RotateCw, Users, AlertTriangle, Trash2, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-vue-next'

const router    = useRouter()
const adminAuth = useAdminAuthStore()

const users      = ref([])
const loading    = ref(false)
const fetchError = ref('')

// ── Owner / manager grouping ──────────────────────────────────────
const owners = computed(() => users.value.filter(u => u.type !== 'sub_user'))

function managersOf(ownerId) {
  return users.value.filter(u => u.type === 'sub_user' && u.parent_user_id === ownerId)
}

const expanded = reactive(new Set())
function toggleExpand(ownerId) {
  if (expanded.has(ownerId)) expanded.delete(ownerId)
  else expanded.add(ownerId)
}

const modal = reactive({ open: false, mode: 'add', userId: null, userType: 'user' })
const form  = reactive({ name: '', business_name: '', email: '', contact: '', password: '' })
const showPass   = ref(false)
const submitting = ref(false)
const submitError = ref('')

const deleteModal = reactive({ open: false, user: null })
const deleting    = ref(false)
const deleteError = ref('')

const toast = reactive({ show: false, message: '', type: 'success' })
let toastTimer = null

// ── Helpers ───────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  clearTimeout(toastTimer)
  toast.message = message
  toast.type    = type
  toast.show    = true
  toastTimer = setTimeout(() => { toast.show = false }, 3000)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316']
function avatarColor(name) {
  const idx = (name?.charCodeAt(0) || 0) % COLORS.length
  return COLORS[idx]
}

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

// ── Data Loading ──────────────────────────────────────────────────
async function loadUsers() {
  loading.value    = true
  fetchError.value = ''
  try {
    const res = await adminApi.getUsers()
    users.value = res.data?.users || []
  } catch (e) {
    fetchError.value = e?.message || 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

// ── Modal helpers ─────────────────────────────────────────────────
function openAdd() {
  modal.mode     = 'add'
  modal.userId   = null
  modal.userType = 'user'
  form.name          = ''
  form.business_name = ''
  form.email         = ''
  form.contact       = ''
  form.password      = ''
  submitError.value = ''
  showPass.value    = false
  modal.open   = true
}

function openEdit(u) {
  modal.mode     = 'edit'
  modal.userId   = u.id
  modal.userType = u.type
  form.name          = u.name
  form.business_name = u.business_name || ''
  form.email         = u.email
  form.contact       = u.contact || ''
  form.password      = ''
  submitError.value = ''
  modal.open   = true
}

function closeModal() {
  modal.open = false
}

function openDelete(u) {
  deleteModal.user  = u
  deleteError.value = ''
  deleteModal.open  = true
}

// ── Form submit ───────────────────────────────────────────────────
async function handleSubmit() {
  submitting.value  = true
  submitError.value = ''
  try {
    if (modal.mode === 'add') {
      await adminApi.addUser({ name: form.name, business_name: form.business_name, email: form.email, contact: form.contact, password: form.password })
      showToast('Owner added successfully.')
    } else {
      const payload = { user_id: modal.userId, name: form.name, email: form.email }
      if (modal.userType !== 'sub_user') payload.business_name = form.business_name
      await adminApi.updateUser(payload)
      showToast('Account updated successfully.')
    }
    closeModal()
    await loadUsers()
  } catch (e) {
    submitError.value = e?.message || 'Operation failed.'
  } finally {
    submitting.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────
async function confirmDelete() {
  deleting.value    = true
  deleteError.value = ''
  try {
    await adminApi.deleteUser({ user_id: deleteModal.user.id })
    deleteModal.open = false
    showToast('User deleted.')
    await loadUsers()
  } catch (e) {
    deleteError.value = e?.message || 'Delete failed.'
  } finally {
    deleting.value = false
  }
}

// ── Logout ────────────────────────────────────────────────────────
async function handleLogout() {
  await adminAuth.logout()
  router.push('/admin/login')
}

onMounted(loadUsers)
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
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>
