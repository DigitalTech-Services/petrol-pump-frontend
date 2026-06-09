<template>
  <div>
    <PageHeader title="Settings" subtitle="Station configuration & system preferences" :crumbs="['Home','Settings']">
      <template #actions>
        <button class="btn btn-primary" @click="saveAll">💾 Save Changes</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <!-- Sidebar Nav -->
      <div class="lg:col-span-1">
        <div class="card p-2">
          <button
            v-for="s in sections" :key="s.key"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-all duration-150 text-[13.5px]"
            :class="activeSection === s.key
              ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]'
              : 'text-[#8a9ab5] hover:bg-[#161b24] hover:text-white'"
            @click="activeSection = s.key"
          >
            <span class="text-base w-5 text-center flex-shrink-0">{{ s.icon }}</span>
            <span class="font-medium">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Content Panel -->
      <div class="lg:col-span-3 space-y-5">

        <!-- Station Details -->
        <template v-if="activeSection === 'station'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🏪</span>
              <div><div class="font-display font-bold text-[15px] text-white">Station Details</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Basic information about your fuel station</div></div>
            </div>
            <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="field-label">Station Name</label><input v-model="settings.stationName" class="form-input w-full" /></div>
              <div><label class="field-label">HP Dealer Code</label><input v-model="settings.dealerCode" class="form-input w-full" /></div>
              <div><label class="field-label">Owner Name</label><input v-model="settings.ownerName" class="form-input w-full" /></div>
              <div><label class="field-label">Contact Number</label><input v-model="settings.phone" class="form-input w-full" /></div>
              <div class="sm:col-span-2"><label class="field-label">Address</label><textarea v-model="settings.address" class="form-input w-full" rows="2" /></div>
              <div><label class="field-label">City</label><input v-model="settings.city" class="form-input w-full" /></div>
              <div><label class="field-label">State</label><input v-model="settings.state" class="form-input w-full" /></div>
              <div><label class="field-label">GST Number</label><input v-model="settings.gst" class="form-input w-full" /></div>
              <div><label class="field-label">PAN Number</label><input v-model="settings.pan" class="form-input w-full" /></div>
            </div>
          </div>
        </template>

        <!-- Fuel Rates -->
        <template v-if="activeSection === 'fuel'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">⛽</span>
              <div><div class="font-display font-bold text-[15px] text-white">Fuel Rates</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Current fuel prices (auto-affects revenue calculations)</div></div>
              <span class="ml-auto badge badge-green">Live Rates</span>
            </div>
            <div class="card-body space-y-5">
              <div v-for="fuel in fuelRates" :key="fuel.key"
                class="p-4 rounded-xl" style="background:#161b24; border:1px solid #1c2230">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-[13px] text-white"
                    :style="{ background: fuel.color }">{{ fuel.abbr }}</div>
                  <div>
                    <div class="font-display font-bold text-[15px] text-white">{{ fuel.name }}</div>
                    <div class="text-[11px] text-[#5a6a82]">{{ fuel.type }}</div>
                  </div>
                  <div class="ml-auto">
                    <span class="font-display font-bold text-[22px]" :style="{ color: fuel.color }">₹{{ fuel.rate }}</span>
                    <span class="text-[11px] text-[#5a6a82]">/L</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div><label class="field-label">Current Rate (₹/L)</label>
                    <input type="number" step="0.01" v-model="fuel.rate" class="form-input w-full" /></div>
                  <div><label class="field-label">Effective Date</label>
                    <input type="date" v-model="fuel.effectiveDate" class="form-input w-full" /></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Nozzle Config -->
        <template v-if="activeSection === 'nozzles'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🔧</span>
              <div><div class="font-display font-bold text-[15px] text-white">Nozzle Configuration</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Pump and nozzle assignments</div></div>
              <button class="btn btn-primary ml-auto text-[12px] py-1">＋ Add Nozzle</button>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead><tr><th>Nozzle ID</th><th>Pump</th><th>Fuel Type</th><th>Status</th><th>Last Reading</th></tr></thead>
                <tbody>
                  <tr v-for="n in nozzles" :key="n.id">
                    <td class="font-mono-custom text-[#f59e0b]">{{ n.id }}</td>
                    <td>{{ n.pump }}</td>
                    <td><span class="badge" :class="n.fuel === 'MS' ? 'badge-ms' : n.fuel === 'HSD' ? 'badge-hsd' : 'badge-speed'">{{ n.fuel }}</span></td>
                    <td><span class="badge" :class="n.active ? 'badge-green' : 'badge-red'">{{ n.active ? 'Active' : 'Inactive' }}</span></td>
                    <td class="font-mono-custom text-[12px]">{{ n.lastReading }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Users (owner only) -->
        <template v-if="activeSection === 'users'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">👤</span>
              <div>
                <div class="font-display font-bold text-[15px] text-white">User Management</div>
                <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Manage manager accounts for this station</div>
              </div>
              <button class="btn btn-primary ml-auto text-[12px] py-1" @click="openAddManager">＋ Add Manager</button>
            </div>

            <!-- Loading -->
            <div v-if="managersLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <span class="animate-spin inline-block mr-2">⟳</span>Loading…
            </div>

            <!-- Error -->
            <div v-else-if="managersError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ managersError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadManagers">Retry</button>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Contact</th><th>Role</th><th>Created</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <!-- Logged-in owner row -->
                  <tr>
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-display text-white"
                          style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                          {{ initials(auth.fullName) }}
                        </div>
                        <span class="font-medium text-white">{{ auth.fullName }}</span>
                      </div>
                    </td>
                    <td class="font-mono-custom text-[12px] text-[#8a9ab5]">{{ auth.user?.email }}</td>
                    <td class="text-[12px] text-[#8a9ab5]">{{ auth.user?.contact || '—' }}</td>
                    <td><span class="badge badge-ms">Owner</span></td>
                    <td class="text-[12px] text-[#5a6a82]">—</td>
                    <td><span class="text-[11px] text-[#5a6a82]">Current account</span></td>
                  </tr>
                  <!-- Sub-user (manager) rows -->
                  <tr v-for="m in managers" :key="m.id">
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-display text-white"
                          :style="{ background: avatarColor(m.name) }">
                          {{ initials(m.name) }}
                        </div>
                        <span class="font-medium text-white">{{ m.name }}</span>
                      </div>
                    </td>
                    <td class="font-mono-custom text-[12px] text-[#8a9ab5]">{{ m.email }}</td>
                    <td class="text-[12px] text-[#8a9ab5]">{{ m.contact || '—' }}</td>
                    <td><span class="badge badge-blue">Manager</span></td>
                    <td class="text-[12px] text-[#5a6a82]">{{ formatDate(m.created_at) }}</td>
                    <td>
                      <div class="flex gap-1.5">
                        <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditManager(m)">✏️ Edit</button>
                        <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteManager(m)">🗑</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!managers.length">
                    <td colspan="6" class="text-center text-[12.5px] text-[#5a6a82] py-6">
                      No managers added yet. Click <strong class="text-white">+ Add Manager</strong> to create one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add / Edit Manager Modal -->
          <Transition name="modal-fade">
            <div v-if="managerModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="managerModal.open = false">
              <div class="w-full max-w-[420px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">
                  {{ managerModal.mode === 'add' ? 'Add Manager' : 'Edit Manager' }}
                </h3>
                <p class="text-[12px] text-[#5a6a82] mb-5">
                  {{ managerModal.mode === 'add' ? 'Create a new manager account.' : 'Update manager details.' }}
                </p>
                <form @submit.prevent="submitManager">
                  <div class="mb-4">
                    <label class="field-label">Full Name</label>
                    <input v-model="managerForm.name" type="text" class="form-input w-full" placeholder="Shaikh Ahmed" required />
                  </div>
                  <div class="mb-4">
                    <label class="field-label">Email</label>
                    <input v-model="managerForm.email" type="email" class="form-input w-full" placeholder="manager@example.com" required />
                  </div>
                  <template v-if="managerModal.mode === 'add'">
                    <div class="mb-4">
                      <label class="field-label">Contact</label>
                      <input v-model="managerForm.contact" type="text" class="form-input w-full" placeholder="9876543210" maxlength="10" required />
                    </div>
                    <div class="mb-5">
                      <label class="field-label">Password</label>
                      <div class="relative">
                        <input v-model="managerForm.password" :type="showManagerPass ? 'text' : 'password'"
                          class="form-input w-full pr-10" placeholder="••••••••" required />
                        <button type="button" @click="showManagerPass = !showManagerPass"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6a82] hover:text-white text-sm">
                          {{ showManagerPass ? '🙈' : '👁' }}
                        </button>
                      </div>
                    </div>
                  </template>
                  <Transition name="fade">
                    <div v-if="managerSubmitError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                      style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                      ⚠️ {{ managerSubmitError }}
                    </div>
                  </Transition>
                  <div class="flex gap-3 justify-end">
                    <button type="button" @click="managerModal.open = false"
                      class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                      style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                    <button type="submit"
                      class="btn btn-primary px-5 py-2 flex items-center gap-2"
                      :disabled="managerSubmitting">
                      <span v-if="managerSubmitting" class="animate-spin">⟳</span>
                      {{ managerSubmitting ? 'Saving…' : (managerModal.mode === 'add' ? 'Add Manager' : 'Save Changes') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Transition>

          <!-- Delete Confirmation Modal -->
          <Transition name="modal-fade">
            <div v-if="deleteModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="deleteModal.open = false">
              <div class="w-full max-w-[360px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">Remove Manager</h3>
                <p class="text-[13px] text-[#5a6a82] mb-5">
                  Remove <strong class="text-white">{{ deleteModal.manager?.name }}</strong> as manager?
                  They will lose access immediately.
                </p>
                <Transition name="fade">
                  <div v-if="deleteError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                    style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                    ⚠️ {{ deleteError }}
                  </div>
                </Transition>
                <div class="flex gap-3 justify-end">
                  <button @click="deleteModal.open = false"
                    class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                    style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                  <button @click="confirmDeleteManager"
                    class="btn btn-danger px-5 py-2 flex items-center gap-2"
                    :disabled="deleting">
                    <span v-if="deleting" class="animate-spin">⟳</span>
                    {{ deleting ? 'Removing…' : 'Remove' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <!-- Notifications -->
        <template v-if="activeSection === 'notifications'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🔔</span>
              <div><div class="font-display font-bold text-[15px] text-white">Notification Preferences</div></div>
            </div>
            <div class="card-body space-y-4">
              <div v-for="notif in notifications" :key="notif.key"
                class="flex items-center justify-between p-4 rounded-xl"
                style="background:#161b24; border:1px solid #1c2230">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ notif.icon }}</span>
                  <div>
                    <div class="font-medium text-white text-[13.5px]">{{ notif.label }}</div>
                    <div class="text-[11.5px] text-[#5a6a82]">{{ notif.sub }}</div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="notif.enabled" class="sr-only peer">
                  <div class="w-10 h-5 rounded-full peer-checked:bg-[#f59e0b] bg-[#242d3e] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/services/api'
import PageHeader from '@/components/ui/PageHeader.vue'

const ui   = useUiStore()
const auth = useAuthStore()
const activeSection = ref('station')

const sections = computed(() => [
  { key:'station',       icon:'🏪', label:'Station Details' },
  { key:'fuel',          icon:'⛽', label:'Fuel Rates' },
  { key:'nozzles',       icon:'🔧', label:'Nozzle Config' },
  ...(auth.isOwner ? [{ key:'users', icon:'👤', label:'User Access' }] : []),
  { key:'notifications', icon:'🔔', label:'Notifications' },
])

const settings = reactive({
  stationName: 'Kailas Petromines',
  dealerCode:  'HP-MH-2024-0891',
  ownerName:   'Kailas Patil',
  phone:       '+91 98765 43210',
  address:     'NH 48, Near MIDC Gate, Khopoli',
  city:        'Khopoli',
  state:       'Maharashtra',
  gst:         '27AAAAA0000A1Z5',
  pan:         'AAAAA0000A',
})

const fuelRates = reactive([
  { key:'ms',    name:'MS Petrol',   abbr:'MS',  type:'Motor Spirit',    rate:104.77, effectiveDate:'2026-04-01', color:'#f59e0b' },
  { key:'hsd',   name:'HSD Diesel',  abbr:'HSD', type:'High Speed Diesel',rate:91.28, effectiveDate:'2026-04-01', color:'#10b981' },
  { key:'speed', name:'Speed',       abbr:'SP',  type:'Premium Petrol',  rate:113.85, effectiveDate:'2026-04-01', color:'#3b82f6' },
])

const nozzles = [
  { id:'MS-01', pump:'Pump 1', fuel:'MS',    active:true,  lastReading:'265,422.57' },
  { id:'MS-02', pump:'Pump 1', fuel:'MS',    active:true,  lastReading:'265,422.57' },
  { id:'MS-03', pump:'Pump 2', fuel:'MS',    active:true,  lastReading:'354,926.72' },
  { id:'MS-04', pump:'Pump 2', fuel:'MS',    active:true,  lastReading:'354,926.72' },
  { id:'MS-05', pump:'Pump 3', fuel:'MS',    active:true,  lastReading:'101,181.38' },
  { id:'MS-06', pump:'Pump 3', fuel:'MS',    active:false, lastReading:'101,181.38' },
  { id:'HSD-01',pump:'Pump 4', fuel:'HSD',   active:true,  lastReading:'48,235.60'  },
  { id:'HSD-02',pump:'Pump 4', fuel:'HSD',   active:true,  lastReading:'48,235.60'  },
  { id:'SP-01', pump:'Pump 5', fuel:'Speed', active:true,  lastReading:'12,450.22'  },
  { id:'SP-02', pump:'Pump 5', fuel:'Speed', active:true,  lastReading:'12,450.22'  },
]

// ── Manager (sub-user) management ────────────────────────────────
const managers        = ref([])
const managersLoading = ref(false)
const managersError   = ref('')

const managerModal = reactive({ open: false, mode: 'add', userId: null })
const managerForm  = reactive({ name: '', email: '', contact: '', password: '' })
const showManagerPass    = ref(false)
const managerSubmitting  = ref(false)
const managerSubmitError = ref('')

const deleteModal = reactive({ open: false, manager: null })
const deleting    = ref(false)
const deleteError = ref('')

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}
function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadManagers() {
  managersLoading.value = true
  managersError.value   = ''
  try {
    const res = await userApi.getSubUsers()
    managers.value = res.data?.sub_users || []
  } catch (e) {
    managersError.value = e?.message || 'Failed to load managers.'
  } finally {
    managersLoading.value = false
  }
}

function openAddManager() {
  managerModal.mode   = 'add'
  managerModal.userId = null
  managerForm.name    = ''
  managerForm.email   = ''
  managerForm.contact = ''
  managerForm.password= ''
  managerSubmitError.value = ''
  showManagerPass.value    = false
  managerModal.open   = true
}

function openEditManager(m) {
  managerModal.mode   = 'edit'
  managerModal.userId = m.id
  managerForm.name    = m.name
  managerForm.email   = m.email
  managerForm.contact = m.contact || ''
  managerForm.password= ''
  managerSubmitError.value = ''
  managerModal.open   = true
}

function openDeleteManager(m) {
  deleteModal.manager = m
  deleteError.value   = ''
  deleteModal.open    = true
}

async function submitManager() {
  managerSubmitting.value  = true
  managerSubmitError.value = ''
  try {
    if (managerModal.mode === 'add') {
      await userApi.addSubUser({
        name: managerForm.name, email: managerForm.email,
        contact: managerForm.contact, password: managerForm.password,
      })
      ui.success('Manager added successfully.')
    } else {
      await userApi.updateSubUser({ user_id: managerModal.userId, name: managerForm.name, email: managerForm.email })
      ui.success('Manager updated.')
    }
    managerModal.open = false
    await loadManagers()
  } catch (e) {
    managerSubmitError.value = e?.message || 'Operation failed.'
  } finally {
    managerSubmitting.value = false
  }
}

async function confirmDeleteManager() {
  deleting.value    = true
  deleteError.value = ''
  try {
    await userApi.deleteSubUser({ user_id: deleteModal.manager.id })
    deleteModal.open = false
    ui.success('Manager removed.')
    await loadManagers()
  } catch (e) {
    deleteError.value = e?.message || 'Delete failed.'
  } finally {
    deleting.value = false
  }
}

// Load managers when the users section becomes active
watch(activeSection, (val) => { if (val === 'users') loadManagers() })
onMounted(() => { if (activeSection.value === 'users') loadManagers() })

const notifications = reactive([
  { key:'daily',   icon:'📊', label:'Daily Sales Summary',    sub:'Get end-of-day summary via WhatsApp', enabled:true  },
  { key:'stock',   icon:'🛢️', label:'Low Stock Alert',         sub:'Alert when fuel drops below threshold', enabled:true  },
  { key:'salary',  icon:'💰', label:'Monthly Salary Reminder', sub:'Remind on 28th to process payroll', enabled:false },
  { key:'expense', icon:'🧾', label:'High Expense Alert',      sub:'Alert when daily expense exceeds ₹10,000', enabled:true  },
  { key:'meter',   icon:'📈', label:'Meter Variation Alert',   sub:'Alert on large meter discrepancies', enabled:false },
])

const saveAll = () => ui.success('Settings saved successfully!')
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 11.5px;
  color: #8a9ab5;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
