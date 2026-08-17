<template>
  <div>
    <PageHeader
      title="Petrol Sales"
      :subtitle="`Daily sale records — ${monthLabel}`"
      :crumbs="['Home','Sales']"
    >
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
      </template>
    </PageHeader>

    <!-- Summary Stats -->
    <StatRow :stats="summaryStats" class="mb-6" />

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input type="month" v-model="selectedMonth" class="form-input" @change="loadSales" />
      <input v-model="search" class="form-input" placeholder="Search narration, date…" style="min-width:200px" />
      <select v-model="sortKey" class="form-select">
        <option value="">Sort: Default</option>
        <option value="revenue">Revenue ↓</option>
        <option value="ms">MS Volume ↓</option>
        <option value="expenses">Expenses ↓</option>
      </select>
      <span class="self-center text-[12px] text-[var(--text-3)] ml-auto">{{ filtered.length }} records</span>
    </div>

    <!-- Table -->
    <div class="card">
      <!-- Loading -->
      <div v-if="store.loading" class="p-8 text-center text-[var(--text-3)] text-[13px]">Loading sales data…</div>

      <!-- Error -->
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS (L)</th><th>HSD (L)</th><th>Power (L)</th>
              <th>Rate MS</th><th>Revenue (₹)</th><th>Cash (₹)</th>
              <th>PhonePe (₹)</th><th>Card (₹)</th>
              <th>Expenses</th><th>Balance</th><th>Narration</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="14" class="text-center text-[var(--text-3)] py-6 text-[13px]">No records found. Add the first sale entry.</td>
            </tr>
            <tr v-for="(r, i) in filtered" :key="r.id ?? r.date + i">
              <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i + 1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(r.date) }}</span></td>
              <td><span class="badge badge-ms">{{ fmt(r.ms) }}</span></td>
              <td><span class="badge badge-hsd">{{ fmt(r.hsd) }}</span></td>
              <td><span class="badge badge-speed">{{ fmt(r.speed) }}</span></td>
              <td class="font-mono-custom text-[12px]">{{ r.rateMS }}</td>
              <td class="amt text-[#f59e0b]">{{ fmt(r.revenue) }}</td>
              <td class="amt text-positive">{{ fmt(r.cash) }}</td>
              <td class="amt text-[#6366f1]">{{ fmt(r.phonepay) }}</td>
              <td class="amt text-[#3b82f6]">{{ r.card > 0 ? fmt(r.card) : '—' }}</td>
              <td class="amt text-negative">{{ fmt(r.exp) }}</td>
              <td class="amt text-[#f59e0b]">{{ fmt(r.balance) }}</td>
              <td><div class="text-[11.5px] text-[var(--text-3)] truncate max-w-[160px]" :title="r.narration">{{ r.narration }}</div></td>
              <td>
                <div v-if="auth.canWrite" class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(r)"><Pencil :size="11" /></button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(r)"><Trash2 :size="11" /></button>
                </div>
                <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filtered.length">
            <tr>
              <td colspan="2">TOTAL ({{ filtered.length }} days)</td>
              <td>{{ fmt(totals.ms) }}</td>
              <td>{{ fmt(totals.hsd) }}</td>
              <td>{{ fmt(totals.speed) }}</td>
              <td>—</td>
              <td>{{ fmt(totals.revenue) }}</td>
              <td>{{ fmt(totals.cash) }}</td>
              <td>{{ fmt(totals.phonepay) }}</td>
              <td>{{ fmt(totals.card) }}</td>
              <td>{{ fmt(totals.exp) }}</td>
              <td colspan="3">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Sale Entry" :icon="Pencil" max-width="640px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
          <div>
            <label class="field-label">Shift</label>
            <select v-model="editData.shift" class="form-select w-full">
              <option>Morning</option><option>Evening</option><option>Night</option><option>Full Day</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="field-label">MS Volume (L)</label><input type="number" step="0.01" v-model.number="editData.ms" class="form-input w-full" /></div>
          <div><label class="field-label">HSD Volume (L)</label><input type="number" step="0.01" v-model.number="editData.hsd" class="form-input w-full" /></div>
          <div><label class="field-label">Power Volume (L)</label><input type="number" step="0.01" v-model.number="editData.speed" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="field-label">MS Rate (₹/L)</label><input type="number" step="0.01" v-model.number="editData.rateMS" class="form-input w-full" /></div>
          <div><label class="field-label">HSD Rate (₹/L)</label><input type="number" step="0.01" v-model.number="editData.rateHSD" class="form-input w-full" /></div>
          <div><label class="field-label">Power Rate (₹/L)</label><input type="number" step="0.01" v-model.number="editData.rateSpeed" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="field-label">Cash (₹)</label><input type="number" step="0.01" v-model.number="editData.cash" class="form-input w-full" /></div>
          <div><label class="field-label">PhonePe (₹)</label><input type="number" step="0.01" v-model.number="editData.phonepay" class="form-input w-full" /></div>
          <div><label class="field-label">Expenses (₹)</label><input type="number" step="0.01" v-model.number="editData.exp" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">Card (₹)</label><input type="number" step="0.01" v-model.number="editData.card" class="form-input w-full" /></div>
          <div><label class="field-label">Credit Sale (₹)</label><input type="number" step="0.01" v-model.number="editData.credit" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3 p-3 rounded-lg" style="background:var(--bg-3)">
          <div>
            <div class="text-[11px] text-[var(--text-3)] mb-1">Revenue</div>
            <div class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt(editRevenue) }}</div>
          </div>
          <div>
            <div class="text-[11px] text-[var(--text-3)] mb-1">Balance</div>
            <div class="font-display font-bold text-[16px] text-positive">₹{{ fmt(editBalance) }}</div>
          </div>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="editData.narration" class="form-input w-full" rows="2" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEdit" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Update Sale
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Sale Record" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[var(--text)] mb-2">
          Delete sale record for <span class="text-[#f59e0b] font-bold">{{ formatDate(deleteTarget.date) }}</span>?
        </p>
        <p class="text-[13px] text-[var(--text-2)]">Revenue: <span class="text-positive">₹{{ fmt(deleteTarget.revenue) }}</span></p>
        <p class="text-[12px] text-negative mt-3">This cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete = false">Cancel</button>
          <button class="btn btn-danger px-8 flex items-center gap-1.5" @click="confirmDelete" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Trash2 v-else :size="14" /> Delete
          </button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatRow    from '@/components/ui/StatRow.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt, formatDate } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore }   from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSalesStore } from '@/stores/sales'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { Download, Printer, Pencil, AlertTriangle, RotateCw, Save, Trash2 } from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const store           = useSalesStore()
const selectedStation = useSelectedStationStore()

// ── Month filter ──────────────────────────────────────────────────
const now           = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const monthLabel = computed(() => {
  const [y, m] = selectedMonth.value.split('-')
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

function loadSales() {
  store.fetchAll({
    month: selectedMonth.value,
    ...(selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}),
  }).catch(() => {})
}

onMounted(() => loadSales())
watch(() => selectedStation.selectedStationId, loadSales)

// ── Filters & sort ───────────────────────────────────────────────
const search  = ref('')
const sortKey = ref('')

const filtered = computed(() => {
  let d = [...store.records]
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(r => r.narration?.toLowerCase().includes(q) || String(r.date).toLowerCase().includes(q))
  }
  if (sortKey.value === 'revenue')  d.sort((a, b) => b.revenue - a.revenue)
  if (sortKey.value === 'ms')       d.sort((a, b) => b.ms - a.ms)
  if (sortKey.value === 'expenses') d.sort((a, b) => b.exp - a.exp)
  return d
})

const totals = computed(() => {
  const src = filtered.value
  return {
    ms:       src.reduce((a, r) => a + (r.ms      || 0), 0),
    hsd:      src.reduce((a, r) => a + (r.hsd     || 0), 0),
    speed:    src.reduce((a, r) => a + (r.speed   || 0), 0),
    revenue:  src.reduce((a, r) => a + (r.revenue || 0), 0),
    cash:     src.reduce((a, r) => a + (r.cash    || 0), 0),
    card:     src.reduce((a, r) => a + (r.card    || 0), 0),
    phonepay: src.reduce((a, r) => a + (r.phonepay|| 0), 0),
    exp:      src.reduce((a, r) => a + (r.exp     || 0), 0),
  }
})

const summaryStats = computed(() => [
  { label: 'Total Revenue',  value: '₹' + fmt(totals.value.revenue, 0),  sub: `${filtered.value.length} days`, class: 'text-[#f59e0b]' },
  { label: 'Total Cash',     value: '₹' + fmt(totals.value.cash, 0),     sub: 'Collected',  class: 'text-positive' },
  { label: 'Total PhonePe',  value: '₹' + fmt(totals.value.phonepay, 0), sub: 'UPI',        class: 'text-[#6366f1]' },
  { label: 'Total Expenses', value: '₹' + fmt(totals.value.exp, 0),      sub: 'All days',   class: 'text-negative' },
])

// ── Edit modal ───────────────────────────────────────────────────
const showEdit = ref(false)
const editData = ref(null)

const editRevenue = computed(() => {
  if (!editData.value) return 0
  const d = editData.value
  return (d.ms || 0) * (d.rateMS || 0) + (d.hsd || 0) * (d.rateHSD || 0) + (d.speed || 0) * (d.rateSpeed || 0)
})
const editBalance = computed(() => {
  if (!editData.value) return 0
  const d = editData.value
  return (d.cash || 0) + (d.phonepay || 0) + (d.card || 0) - (d.exp || 0)
})

function openEdit(r) { editData.value = { ...r }; showEdit.value = true }

async function saveEdit() {
  if (!editData.value?.id) return
  try {
    await store.update(editData.value.id, { ...editData.value })
    showEdit.value = false
    ui.success('Sale updated!')
  } catch (e) {
    ui.error(e?.message || 'Failed to update.')
  }
}

// ── Delete modal ─────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)

function openDelete(r) { deleteTarget.value = r; showDelete.value = true }

async function confirmDelete() {
  if (!deleteTarget.value?.id) return
  try {
    await store.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Sale record deleted!')
  } catch (e) {
    ui.error(e?.message || 'Failed to delete.')
  }
}

// ── Export / Print ───────────────────────────────────────────────
function doExport() {
  const headers = ['Date', 'Shift', 'MS(L)', 'HSD(L)', 'Power(L)', 'Revenue', 'Cash', 'PhonePe', 'Card', 'Expenses', 'Balance', 'Narration']
  const rows = store.records.map(r => [r.date, r.shift, r.ms, r.hsd, r.speed, r.revenue, r.cash, r.phonepay, r.card, r.exp, r.balance, r.narration])
  exportCSV(`Petrol_Sales_${selectedMonth.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date', 'MS(L)', 'HSD(L)', 'Power(L)', 'Revenue', 'Cash', 'PhonePe', 'Expenses', 'Balance']
  const rows = filtered.value.map(r => [formatDate(r.date), fmt(r.ms), fmt(r.hsd), fmt(r.speed), '₹' + fmt(r.revenue), '₹' + fmt(r.cash), '₹' + fmt(r.phonepay), '₹' + fmt(r.exp), '₹' + fmt(r.balance)])
  printTable(`Petrol Sales Register — ${monthLabel.value}`, headers, rows)
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
