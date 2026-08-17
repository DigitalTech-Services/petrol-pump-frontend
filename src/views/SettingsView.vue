<template>
  <div>
    <PageHeader title="Settings" subtitle="Station configuration & system preferences" :crumbs="['Home','Settings']">
      <template #actions>
        <button
          v-if="auth.canWrite && ['station','fuel','notifications'].includes(activeSection)"
          class="btn btn-primary flex items-center gap-2"
          @click="saveAll"
          :disabled="saving"
        >
          <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" />
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
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
              : 'text-[var(--text-2)] hover:bg-[var(--bg-3)] hover:text-[var(--text)]'"
            @click="activeSection = s.key"
          >
            <component :is="s.icon" :size="16" class="flex-shrink-0" />
            <span class="font-medium">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Content Panel -->
      <div class="lg:col-span-3 space-y-5">

        <!-- Owner with no station selected — station/fuel/nozzle config is single-station -->
        <template v-if="['station','fuel','nozzles'].includes(activeSection) && noStationSelected">
          <div class="card">
            <div class="card-body text-center py-12">
              <Building2 :size="32" class="mx-auto mb-3 text-[var(--faint)]" />
              <div class="text-[13px] text-[var(--text-2)]">Select a station from the top bar to view its settings.</div>
              <div class="text-[11px] text-[var(--text-3)] mt-1">"All Stations" has no single configuration to show.</div>
            </div>
          </div>
        </template>

        <!-- Station Details -->
        <template v-else-if="activeSection === 'station'">
          <div class="card">
            <div class="card-header">
              <Building2 :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-[var(--text)]">Station Details</div>
                <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Basic information about your fuel station</div>
              </div>
            </div>
            <div v-if="stationLoading" class="card-body text-center text-[13px] text-[var(--text-3)] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="stationError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ stationError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadStation">Retry</button>
            </div>
            <div v-else class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="field-label">HP Dealer Code</label><input v-model="settings.dealerCode" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">Contact Number</label><input v-model="settings.phone" :disabled="!auth.canWrite" maxlength="10" placeholder="9876543210" class="form-input w-full" /></div>
              <div class="sm:col-span-2"><label class="field-label">Address</label><textarea v-model="settings.address" :disabled="!auth.canWrite" class="form-input w-full" rows="2" /></div>
              <div><label class="field-label">City</label><input v-model="settings.city" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">State</label><input v-model="settings.state" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">GST Number</label><input v-model="settings.gst" :disabled="!auth.canWrite" maxlength="15" placeholder="27ABCDE1234F1Z5" class="form-input w-full" style="text-transform:uppercase" /></div>
              <div><label class="field-label">PAN Number</label><input v-model="settings.pan" :disabled="!auth.canWrite" maxlength="10" placeholder="ABCDE1234F" class="form-input w-full" style="text-transform:uppercase" /></div>
            </div>
          </div>
        </template>

        <!-- Fuel Rates -->
        <template v-else-if="activeSection === 'fuel'">
          <div class="card">
            <div class="card-header">
              <Fuel :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-[var(--text)]">Fuel Rates</div>
                <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Current fuel prices (auto-affects revenue calculations)</div>
              </div>
              <span class="ml-auto badge badge-green">Live Rates</span>
            </div>
            <div v-if="fuelLoading" class="card-body text-center text-[13px] text-[var(--text-3)] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="fuelError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ fuelError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadFuelRates">Retry</button>
            </div>
            <div v-else class="card-body space-y-5">
              <div v-for="fuel in fuelRates" :key="fuel.key"
                class="p-4 rounded-xl" style="background:var(--bg-3); border:1px solid var(--bg-4)">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-[13px] text-[var(--text)]"
                    :style="{ background: fuel.color }">{{ fuel.abbr }}</div>
                  <div>
                    <div class="font-display font-bold text-[15px] text-[var(--text)] flex items-center gap-2">
                      {{ fuel.name }}
                      <span v-if="!fuel.configured" class="badge badge-red text-[9.5px]">Not set today</span>
                    </div>
                    <div class="text-[11px] text-[var(--text-3)]">{{ fuel.type }}</div>
                  </div>
                  <div class="ml-auto text-right">
                    <template v-if="fuel.configured">
                      <div>
                        <span class="font-display font-bold text-[22px]" :style="{ color: fuel.color }">₹{{ fuel.rate }}</span>
                        <span class="text-[11px] text-[var(--text-3)]">/L</span>
                      </div>
                      <div class="text-[11px] font-semibold" :class="margin(fuel) >= 0 ? 'text-positive' : 'text-negative'">
                        {{ margin(fuel) >= 0 ? '+' : '−' }}₹{{ fmt(Math.abs(margin(fuel))) }}/L {{ margin(fuel) >= 0 ? 'profit' : 'loss' }}
                      </div>
                    </template>
                    <div v-else class="text-[11px] text-[var(--text-3)] max-w-[140px]">Enter today's rate below and save</div>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div><label class="field-label">Actual Rate (₹/L)</label>
                    <input type="number" step="0.01" v-model.number="fuel.actualRate" :disabled="!auth.canWrite" class="form-input w-full" @input="fuel.configured = true" /></div>
                  <div><label class="field-label">Selling Rate (₹/L)</label>
                    <input type="number" step="0.01" v-model.number="fuel.rate" :disabled="!auth.canWrite" class="form-input w-full" @input="fuel.configured = true" /></div>
                  <div><label class="field-label">Effective Date</label>
                    <input type="date" v-model="fuel.effectiveDate" :disabled="!auth.canWrite" class="form-input w-full" /></div>
                </div>
                <div v-if="fuel.configured" class="mt-3 p-2.5 rounded-lg flex items-center justify-between" style="background:var(--bg-2);border:1px solid var(--bg-4)">
                  <span class="text-[12px] text-[var(--text-2)]">Profit / Loss per Litre</span>
                  <span class="font-display font-bold text-[15px]" :class="margin(fuel) >= 0 ? 'text-positive' : 'text-negative'">
                    {{ margin(fuel) >= 0 ? '+' : '−' }}₹{{ fmt(Math.abs(margin(fuel))) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Nozzle Config -->
        <template v-else-if="activeSection === 'nozzles'">
          <div class="card">
            <div class="card-header">
              <Wrench :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-[var(--text)]">Nozzle Configuration</div>
                <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Pump and nozzle assignments</div>
              </div>
              <button v-if="auth.canWrite" class="btn btn-primary ml-auto text-[12px] py-1 flex items-center gap-1" @click="openAddNozzle"><Plus :size="12" /> Add Nozzle</button>
            </div>

            <div v-if="nozzlesLoading" class="card-body text-center text-[13px] text-[var(--text-3)] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="nozzlesError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ nozzlesError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadNozzles">Retry</button>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr><th>Nozzle ID</th><th>Pump</th><th>Fuel Type</th><th>Status</th><th>Last Reading</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr v-for="n in nozzles" :key="n.nozzleId">
                    <td class="font-mono-custom text-[#f59e0b]">{{ n.nozzleId }}</td>
                    <td>{{ n.pump }}</td>
                    <td><span class="badge" :class="n.fuel === 'MS' ? 'badge-ms' : n.fuel === 'HSD' ? 'badge-hsd' : 'badge-speed'">{{ n.fuel }}</span></td>
                    <td><span class="badge" :class="n.active ? 'badge-green' : 'badge-red'">{{ n.active ? 'Active' : 'Inactive' }}</span></td>
                    <td class="font-mono-custom text-[12px]">{{ n.lastReading || '—' }}</td>
                    <td>
                      <div v-if="auth.canWrite" class="flex gap-1.5">
                        <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditNozzle(n)"><Pencil :size="11" /> Edit</button>
                        <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteNozzle(n)"><Trash2 :size="11" /></button>
                      </div>
                      <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                    </td>
                  </tr>
                  <tr v-if="!nozzles.length">
                    <td colspan="6" class="text-center text-[12.5px] text-[var(--text-3)] py-6">
                      No nozzles configured. Click <strong class="text-[var(--text)]">+ Add Nozzle</strong> to create one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add / Edit Nozzle Modal -->
          <Transition name="modal-fade">
            <div v-if="nozzleModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="nozzleModal.open = false">
              <div class="w-full max-w-[440px] rounded-2xl p-6" style="background:var(--bg-2); border:1px solid var(--border)">
                <h3 class="font-display font-bold text-[17px] text-[var(--text)] mb-1">
                  {{ nozzleModal.mode === 'add' ? 'Add Nozzle' : 'Edit Nozzle' }}
                </h3>
                <p class="text-[12px] text-[var(--text-3)] mb-5">
                  {{ nozzleModal.mode === 'add' ? 'Register a new nozzle on a pump.' : 'Update nozzle details.' }}
                </p>
                <form @submit.prevent="submitNozzle">
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="field-label">Nozzle ID</label>
                      <input v-model="nozzleForm.nozzleId" type="text" class="form-input w-full"
                        placeholder="MS-01" required :disabled="nozzleModal.mode === 'edit'" />
                    </div>
                    <div>
                      <label class="field-label">Pump</label>
                      <input v-model="nozzleForm.pump" type="text" class="form-input w-full"
                        placeholder="Pump 1" required />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="field-label">Fuel Type</label>
                      <select v-model="nozzleForm.fuel" class="form-input w-full" required>
                        <option value="MS">MS Petrol</option>
                        <option value="HSD">HSD Diesel</option>
                        <option value="Speed">Power</option>
                      </select>
                    </div>
                    <div>
                      <label class="field-label">Last Reading</label>
                      <input v-model="nozzleForm.lastReading" type="text" class="form-input w-full"
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div class="mb-5 flex items-center justify-between p-3 rounded-xl"
                    style="background:var(--bg-3); border:1px solid var(--bg-4)">
                    <span class="text-[13px] text-[var(--text)]">Active Status</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" v-model="nozzleForm.active" class="sr-only peer">
                      <div class="w-10 h-5 rounded-full peer-checked:bg-[#f59e0b] bg-[var(--border)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                  <Transition name="fade">
                    <div v-if="nozzleSubmitError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                      style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                      <AlertTriangle :size="13" class="inline mr-1" />{{ nozzleSubmitError }}
                    </div>
                  </Transition>
                  <div class="flex gap-3 justify-end">
                    <button type="button" @click="nozzleModal.open = false"
                      class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[var(--text-2)] hover:text-[var(--text)]"
                      style="background:var(--bg-3); border:1px solid var(--border)">Cancel</button>
                    <button type="submit"
                      class="btn btn-primary px-5 py-2 flex items-center gap-2"
                      :disabled="nozzleSubmitting">
                      <RotateCw v-if="nozzleSubmitting" :size="14" class="animate-spin" />
                      {{ nozzleSubmitting ? 'Saving…' : (nozzleModal.mode === 'add' ? 'Add Nozzle' : 'Save Changes') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Transition>

          <!-- Delete Nozzle Confirmation -->
          <Transition name="modal-fade">
            <div v-if="nozzleDeleteModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="nozzleDeleteModal.open = false">
              <div class="w-full max-w-[360px] rounded-2xl p-6" style="background:var(--bg-2); border:1px solid var(--border)">
                <h3 class="font-display font-bold text-[17px] text-[var(--text)] mb-1">Remove Nozzle</h3>
                <p class="text-[13px] text-[var(--text-3)] mb-5">
                  Remove nozzle <strong class="text-[var(--text)]">{{ nozzleDeleteModal.nozzle?.nozzleId }}</strong>?
                  This action cannot be undone.
                </p>
                <Transition name="fade">
                  <div v-if="nozzleDeleteError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                    style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                    <AlertTriangle :size="13" class="inline mr-1" />{{ nozzleDeleteError }}
                  </div>
                </Transition>
                <div class="flex gap-3 justify-end">
                  <button @click="nozzleDeleteModal.open = false"
                    class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[var(--text-2)] hover:text-[var(--text)]"
                    style="background:var(--bg-3); border:1px solid var(--border)">Cancel</button>
                  <button @click="confirmDeleteNozzle"
                    class="btn btn-danger px-5 py-2 flex items-center gap-2"
                    :disabled="nozzleDeleting">
                    <RotateCw v-if="nozzleDeleting" :size="14" class="animate-spin" />
                    {{ nozzleDeleting ? 'Removing…' : 'Remove' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <!-- Notifications (manager-personal, not offered to owner — see `sections` computed) -->
        <template v-else-if="activeSection === 'notifications'">
          <div class="card">
            <div class="card-header">
              <Bell :size="18" class="text-[#f59e0b]" />
              <div><div class="font-display font-bold text-[15px] text-[var(--text)]">Notification Preferences</div></div>
            </div>
            <div v-if="notifLoading" class="card-body text-center text-[13px] text-[var(--text-3)] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="notifError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ notifError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadNotifications">Retry</button>
            </div>
            <div v-else class="card-body space-y-4">
              <div v-for="notif in notifications" :key="notif.key"
                class="flex items-center justify-between p-4 rounded-xl"
                style="background:var(--bg-3); border:1px solid var(--bg-4)">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ notif.icon }}</span>
                  <div>
                    <div class="font-medium text-[var(--text)] text-[13.5px]">{{ notif.label }}</div>
                    <div class="text-[11.5px] text-[var(--text-3)]">{{ notif.sub }}</div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="notif.enabled" class="sr-only peer">
                  <div class="w-10 h-5 rounded-full peer-checked:bg-[#f59e0b] bg-[var(--border)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>
        </template>

        <!-- Appearance (personal preference — available to owner and manager alike) -->
        <template v-else-if="activeSection === 'appearance'">
          <div class="card">
            <div class="card-header">
              <Palette :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-[var(--text)]">Appearance</div>
                <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Choose how Petromines looks on this device</div>
              </div>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-2 gap-4 max-w-md">
                <button
                  v-for="t in THEMES" :key="t.key"
                  class="rounded-xl p-4 text-left transition-all"
                  :class="themeStore.theme === t.key ? 'border-2' : 'border border-[var(--border)] hover:border-[var(--border-2)]'"
                  :style="themeStore.theme === t.key ? 'border-color:#f59e0b' : ''"
                  @click="themeStore.setTheme(t.key)"
                >
                  <div class="h-14 rounded-lg mb-3 flex items-center justify-center gap-1.5"
                    :style="t.key === 'light' ? 'background:#f5f6f8; border:1px solid #dde2ea' : 'background:#0a0c10; border:1px solid #242d3e'">
                    <span class="w-2.5 h-2.5 rounded-full" style="background:#f59e0b" />
                    <span class="w-8 h-2.5 rounded-full" :style="t.key === 'light' ? 'background:#e4e8ee' : 'background:#1c2230'" />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[13.5px] font-medium text-[var(--text)]">{{ t.label }}</span>
                    <CheckCircle2 v-if="themeStore.theme === t.key" :size="16" class="text-[#f59e0b]" />
                  </div>
                </button>
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
import { useSelectedStationStore } from '@/stores/selectedStation'
import { useThemeStore, THEMES } from '@/stores/theme'
import { settingsApi } from '@/services/api'
import { fmt } from '@/utils/format'
import { isValidGST, isValidPAN, isValidPhone } from '@/utils/validation'
import PageHeader from '@/components/ui/PageHeader.vue'
import {
  Building2, Fuel, Wrench, Bell, Palette, CheckCircle2,
  RotateCw, Save, AlertTriangle, Plus, Pencil, Trash2
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()
const themeStore      = useThemeStore()
const activeSection = ref('station')
const saving = ref(false)

// Owner has no "all stations" view for single-station config (station/fuel/nozzles).
const noStationSelected = computed(() => auth.isOwner && !selectedStation.selectedStationId)

const sections = computed(() => [
  { key:'station',       icon: Building2, label:'Station Details' },
  { key:'fuel',          icon: Fuel,      label:'Fuel Rates' },
  { key:'nozzles',       icon: Wrench,    label:'Nozzle Config' },
  // Notifications are manager-personal, not station data — no owner view.
  ...(auth.isOwner ? [] : [{ key:'notifications', icon: Bell, label:'Notifications' }]),
  { key:'appearance', icon: Palette, label:'Appearance' },
])

// ── Station Details ──────────────────────────────────────────────
const stationLoading = ref(false)
const stationError   = ref('')
const settings = reactive({
  dealerCode: '',
  phone: '', address: '', city: '', state: '', gst: '', pan: '',
})

function stationParam() {
  return auth.isOwner && selectedStation.selectedStationId
    ? { station_id: selectedStation.selectedStationId }
    : {}
}

async function loadStation() {
  stationLoading.value = true
  stationError.value   = ''
  try {
    const res = await settingsApi.getStation(stationParam())
    const s   = res.data?.station || {}
    settings.dealerCode  = s.dealer_code  || ''
    settings.phone       = s.phone        || ''
    settings.address     = s.address      || ''
    settings.city        = s.city         || ''
    settings.state       = s.state        || ''
    settings.gst         = s.gst          || ''
    settings.pan         = s.pan          || ''
  } catch (e) {
    stationError.value = e?.message || 'Failed to load station settings.'
  } finally {
    stationLoading.value = false
  }
}

async function saveStation() {
  if (settings.gst && !isValidGST(settings.gst)) {
    ui.error('Enter a valid 15-character GST number (e.g. 27ABCDE1234F1Z5).'); return
  }
  if (settings.pan && !isValidPAN(settings.pan)) {
    ui.error('Enter a valid 10-character PAN number (e.g. ABCDE1234F).'); return
  }
  if (settings.phone && !isValidPhone(settings.phone)) {
    ui.error('Enter a valid 10-digit phone number.'); return
  }

  settings.gst = settings.gst?.trim().toUpperCase() || ''
  settings.pan = settings.pan?.trim().toUpperCase() || ''

  saving.value = true
  try {
    await settingsApi.updateStation({
      dealer_code: settings.dealerCode,
      phone:       settings.phone,
      address:     settings.address,
      city:        settings.city,
      state:       settings.state,
      gst:         settings.gst,
      pan:         settings.pan,
    })
    ui.success('Station settings saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save station settings.')
  } finally {
    saving.value = false
  }
}

// ── Fuel Rates ──────────────────────────────────────────────────
const fuelLoading = ref(false)
const fuelError   = ref('')
const fuelRates   = ref([])

// Profit/loss per litre: selling rate minus what the station actually pays.
function margin(fuel) {
  return (Number(fuel.rate) || 0) - (Number(fuel.actualRate) || 0)
}

function mapFuelRates(rates) {
  const today = new Date().toISOString().split('T')[0]
  return rates.map(r => ({
    key:           r.fuel_key,
    name:          r.name,
    abbr:          r.abbr,
    type:          r.type,
    rate:          r.rate,
    actualRate:    r.actual_rate ?? 0,
    // A fuel never saved before comes back with no effective_date — default
    // the picker to today (the day almost every save will be for anyway)
    // without pretending a real rate already exists (see `configured`).
    effectiveDate: r.effective_date || today,
    color:         r.color,
    configured:    !!r.effective_date,
  }))
}

async function loadFuelRates() {
  fuelLoading.value = true
  fuelError.value   = ''
  try {
    const res = await settingsApi.getFuelRates(stationParam())
    fuelRates.value = mapFuelRates(res.data?.fuel_rates || [])
  } catch (e) {
    fuelError.value = e?.message || 'Failed to load fuel rates.'
  } finally {
    fuelLoading.value = false
  }
}

async function saveFuelRates() {
  saving.value = true
  try {
    const res = await settingsApi.updateFuelRates({
      rates: fuelRates.value.map(f => ({
        fuel_key:       f.key,
        name:           f.name,
        abbr:           f.abbr,
        type:           f.type,
        rate:           f.rate,
        actual_rate:    f.actualRate,
        effective_date: f.effectiveDate,
        color:          f.color,
      })),
    })
    fuelRates.value = mapFuelRates(res.data?.fuel_rates || [])
    ui.success('Fuel rates saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save fuel rates.')
  } finally {
    saving.value = false
  }
}

// ── Nozzles ─────────────────────────────────────────────────────
const nozzlesLoading = ref(false)
const nozzlesError   = ref('')
const nozzles        = ref([])

function mapNozzle(n) {
  return {
    id:          n.id          ?? null,
    nozzleId:    n.nozzle_id   ?? n.nozzleId  ?? '',
    pump:        n.pump        ?? '',
    fuel:        n.fuel        ?? 'MS',
    active:      n.active      ?? true,
    lastReading: n.last_reading ?? n.lastReading ?? '',
  }
}

async function loadNozzles() {
  nozzlesLoading.value = true
  nozzlesError.value   = ''
  try {
    const res  = await settingsApi.getNozzles(stationParam())
    const data = res.data?.nozzles || []
    nozzles.value = data.map(mapNozzle)
  } catch (e) {
    nozzlesError.value = e?.message || 'Failed to load nozzles.'
  } finally {
    nozzlesLoading.value = false
  }
}

const nozzleModal       = reactive({ open: false, mode: 'add', nozzleDbId: null })
const nozzleForm        = reactive({ nozzleId: '', pump: '', fuel: 'MS', active: true, lastReading: '' })
const nozzleSubmitting  = ref(false)
const nozzleSubmitError = ref('')

function openAddNozzle() {
  nozzleModal.mode      = 'add'
  nozzleModal.nozzleDbId = null
  nozzleForm.nozzleId   = ''
  nozzleForm.pump       = ''
  nozzleForm.fuel       = 'MS'
  nozzleForm.active     = true
  nozzleForm.lastReading= ''
  nozzleSubmitError.value = ''
  nozzleModal.open = true
}

function openEditNozzle(n) {
  nozzleModal.mode       = 'edit'
  nozzleModal.nozzleDbId = n.id
  nozzleForm.nozzleId    = n.nozzleId
  nozzleForm.pump        = n.pump
  nozzleForm.fuel        = n.fuel
  nozzleForm.active      = n.active
  nozzleForm.lastReading = n.lastReading
  nozzleSubmitError.value = ''
  nozzleModal.open = true
}

async function submitNozzle() {
  nozzleSubmitting.value  = true
  nozzleSubmitError.value = ''
  try {
    if (nozzleModal.mode === 'add') {
      await settingsApi.storeNozzle({
        nozzle_id:    nozzleForm.nozzleId,
        pump:         nozzleForm.pump,
        fuel:         nozzleForm.fuel,
        active:       nozzleForm.active,
        last_reading: nozzleForm.lastReading,
      })
      ui.success('Nozzle added.')
    } else {
      await settingsApi.updateNozzle(nozzleModal.nozzleDbId, {
        pump:         nozzleForm.pump,
        fuel:         nozzleForm.fuel,
        active:       nozzleForm.active,
        last_reading: nozzleForm.lastReading,
      })
      ui.success('Nozzle updated.')
    }
    nozzleModal.open = false
    await loadNozzles()
  } catch (e) {
    nozzleSubmitError.value = e?.message || 'Operation failed.'
  } finally {
    nozzleSubmitting.value = false
  }
}

const nozzleDeleteModal = reactive({ open: false, nozzle: null })
const nozzleDeleting    = ref(false)
const nozzleDeleteError = ref('')

function openDeleteNozzle(n) {
  nozzleDeleteModal.nozzle = n
  nozzleDeleteError.value  = ''
  nozzleDeleteModal.open   = true
}

async function confirmDeleteNozzle() {
  nozzleDeleting.value    = true
  nozzleDeleteError.value = ''
  try {
    await settingsApi.deleteNozzle(nozzleDeleteModal.nozzle.id)
    nozzleDeleteModal.open = false
    ui.success('Nozzle removed.')
    await loadNozzles()
  } catch (e) {
    nozzleDeleteError.value = e?.message || 'Delete failed.'
  } finally {
    nozzleDeleting.value = false
  }
}

// ── Notifications ────────────────────────────────────────────────
const notifLoading  = ref(false)
const notifError    = ref('')
const notifications = ref([])

async function loadNotifications() {
  notifLoading.value = true
  notifError.value   = ''
  try {
    const res  = await settingsApi.getNotifications()
    const data = res.data?.notifications || []
    notifications.value = data.map(n => ({
      key:     n.notif_key ?? n.key,
      icon:    n.icon,
      label:   n.label,
      sub:     n.sub,
      enabled: n.enabled,
    }))
  } catch (e) {
    notifError.value = e?.message || 'Failed to load notification preferences.'
  } finally {
    notifLoading.value = false
  }
}

async function saveNotifications() {
  saving.value = true
  try {
    await settingsApi.updateNotifications({
      notifications: notifications.value.map(n => ({
        notif_key: n.key,
        enabled:   n.enabled,
      })),
    })
    ui.success('Notification preferences saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save notification preferences.')
  } finally {
    saving.value = false
  }
}

// ── Section-aware save ───────────────────────────────────────────
async function saveAll() {
  switch (activeSection.value) {
    case 'station':       return saveStation()
    case 'fuel':          return saveFuelRates()
    case 'notifications': return saveNotifications()
  }
}

// ── Lazy load per section (load only on first visit) ─────────────
const loaded = reactive({ station: false, fuel: false, nozzles: false, notifications: false })

async function loadSection(section) {
  if (section === 'station' && !loaded.station) {
    loaded.station = true
    await loadStation()
  } else if (section === 'fuel' && !loaded.fuel) {
    loaded.fuel = true
    await loadFuelRates()
  } else if (section === 'nozzles' && !loaded.nozzles) {
    loaded.nozzles = true
    await loadNozzles()
  } else if (section === 'notifications' && !loaded.notifications) {
    loaded.notifications = true
    await loadNotifications()
  }
}

watch(activeSection, loadSection)
onMounted(() => loadSection(activeSection.value))

// Owner switching the global station selector invalidates the single-station
// config sections — force a re-fetch of whichever one is currently open.
watch(() => selectedStation.selectedStationId, () => {
  if (!auth.isOwner) return
  loaded.station = loaded.fuel = loaded.nozzles = false
  loadSection(activeSection.value)
})
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
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
