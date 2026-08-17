<template>
  <div>
    <PageHeader title="Meter Readings" subtitle="Nozzle-wise opening & closing meters" :crumbs="['Home','Meter']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button v-if="auth.canWrite" class="btn btn-primary flex items-center gap-1.5" @click="openAddReading"><Plus :size="14" /> Add Reading</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Nozzles"    :value="`${nozzleCount('MS')} Active`"    :icon="Gauge" color="#f59e0b" sub="From Nozzle Config"/>
      <KpiCard label="HSD Nozzles"   :value="`${nozzleCount('HSD')} Active`"   :icon="Gauge" color="#10b981" sub="From Nozzle Config"/>
      <KpiCard label="Power Nozzles" :value="`${nozzleCount('Speed')} Active`" :icon="Gauge" color="#3b82f6" sub="From Nozzle Config"/>
      <KpiCard label="Total Fuel Used" :value="fmt(store.totalUsed) + ' L'" :icon="BarChart3" color="#6366f1" sub="All nozzles, selected month"/>
    </div>

    <!-- Month filter + Fuel type tabs -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <input type="month" v-model="selectedMonth" class="form-input" />
      <div class="tab-bar">
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='MS'}"    @click="tab='MS'"><Fuel :size="14" /> MS (Petrol)</button>
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='HSD'}"   @click="tab='HSD'"><Fuel :size="14" class="text-[#10b981]" /> HSD (Diesel)</button>
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='Speed'}" @click="tab='Speed'"><Fuel :size="14" class="text-[#3b82f6]" /> Power (Premium)</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="font-display font-bold text-[15px] text-[var(--text)]">{{ tabLabel }} Nozzle Meter</div>
        <span class="badge ml-2" :class="badgeClass(tab)">{{ tabReadings.length }} entries</span>
      </div>

      <!-- Loading state -->
      <div v-if="store.loading" class="p-8 text-center text-[var(--text-3)] text-[13px]">Loading meter readings…</div>

      <!-- Error state -->
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <!-- No nozzles configured for this fuel type -->
      <div v-else-if="!tabNozzles.length" class="p-8 text-center text-[var(--text-3)] text-[13px]">
        No active {{ tabLabel }} nozzles configured. Add one in Settings → Nozzle Configuration.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <template v-for="n in tabNozzles" :key="n.nozzleId">
                <th>{{ n.nozzleId }} Open</th><th>{{ n.nozzleId }} Close</th><th>{{ n.nozzleId }} Used</th>
              </template>
              <th>{{ tabLabel }} Day Total</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tabReadings.length === 0">
              <td :colspan="2 + tabNozzles.length * 3 + 2" class="text-center text-[var(--text-3)] py-6 text-[13px]">No {{ tabLabel }} readings found. Add the first one.</td>
            </tr>
            <tr v-for="(r, i) in tabReadings" :key="r.id ?? r.date">
              <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i + 1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(r.date) }}</span></td>
              <template v-for="n in tabNozzles" :key="n.nozzleId">
                <td class="font-mono-custom text-[11.5px]">{{ r.nozzles[n.nozzleId]?.opening ?? '—' }}</td>
                <td class="font-mono-custom text-[11.5px]">{{ r.nozzles[n.nozzleId]?.closing ?? '—' }}</td>
                <td><span class="badge" :class="badgeClass(tab)">{{ fmt(r.nozzles[n.nozzleId]?.used ?? 0) }}</span></td>
              </template>
              <td class="amt text-[#f59e0b] font-bold">{{ fmt(tabTotal(r)) }}</td>
              <td class="flex items-center gap-1" v-if="auth.canWrite">
                <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditReading(r)"><Pencil :size="11" /></button>
                <button class="btn btn-ghost py-0.5 px-2 text-[11px] text-red-400" @click="confirmDelete(r)"><Trash2 :size="11" /></button>
              </td>
              <td v-else class="text-[11px] text-[var(--text-3)]">—</td>
            </tr>
          </tbody>
          <tfoot v-if="tabReadings.length > 0">
            <tr>
              <td colspan="2">TOTAL</td>
              <template v-for="n in tabNozzles" :key="n.nozzleId">
                <td colspan="2">—</td>
                <td>{{ fmt(tabReadings.reduce((a, r) => a + (r.nozzles[n.nozzleId]?.used ?? 0), 0)) }}</td>
              </template>
              <td>{{ fmt(tabReadings.reduce((a, r) => a + tabTotal(r), 0)) }}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD METER READING MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Meter Reading" subtitle="Enter opening & closing meter for each nozzle" :icon="Gauge" max-width="580px">
      <div class="mb-4">
        <label class="field-label">Reading Date *</label>
        <input type="date" v-model="meterForm.date" class="form-input w-full" />
      </div>
      <div v-if="!activeNozzles.length" class="text-center text-[13px] text-[var(--text-3)] py-6">
        No active nozzles configured yet. Add one in Settings → Nozzle Configuration first.
      </div>
      <div v-else class="text-[11.5px] text-[var(--text-3)] px-1 mb-1">
        Opening meter is pre-filled from the last recorded closing reading — edit it if needed.
      </div>
      <template v-for="group in nozzleGroups" :key="group.fuel">
        <div class="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide mb-2 mt-3">{{ group.fuel }}</div>
        <div v-for="n in group.items" :key="n.nozzleId"
          class="p-4 rounded-xl mb-3" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge" :class="badgeClass(group.fuel)">{{ n.nozzleId }}</span>
            <span class="text-[13px] font-medium text-[var(--text)]">{{ n.pump }}</span>
            <span class="ml-auto text-[12px] text-[var(--text-3)]">Used: <span class="text-[#f59e0b] font-semibold">{{ fmt(nozzleUsed(meterForm, n.nozzleId)) }} L</span></span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">Opening Meter</label>
              <input type="number" step="0.01" v-model.number="meterForm.nozzles[n.nozzleId].opening" class="form-input w-full" placeholder="0.00" />
            </div>
            <div>
              <label class="field-label">Closing Meter</label>
              <input type="number" step="0.01" v-model.number="meterForm.nozzles[n.nozzleId].closing" class="form-input w-full" placeholder="0.00" />
            </div>
          </div>
        </div>
      </template>
      <div class="p-3 rounded-lg flex justify-between mt-2" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
        <span class="text-[13px] font-medium text-[var(--text)]">Total Day Consumption</span>
        <span class="font-display font-bold text-[18px] text-[#f59e0b]">{{ fmt(calcTotal(meterForm)) }} L</span>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveMeterReading" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Reading
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT READING MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Meter Reading" :icon="Pencil" max-width="560px">
      <div class="space-y-4" v-if="editData">
        <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
        <template v-for="group in editNozzleGroups" :key="group.fuel">
          <div class="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wide mb-1">{{ group.fuel }}</div>
          <div v-for="n in group.items" :key="n.nozzleId"
            class="p-3 rounded-xl" style="background:var(--bg-3);border:1px solid var(--bg-4)">
            <div class="text-[12px] font-semibold text-[#f59e0b] mb-2">{{ n.nozzleId }} · {{ n.pump }}</div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="field-label">Opening</label><input type="number" step="0.01" v-model.number="editData.nozzles[n.nozzleId].opening" class="form-input w-full" /></div>
              <div><label class="field-label">Closing</label><input type="number" step="0.01" v-model.number="editData.nozzles[n.nozzleId].closing" class="form-input w-full" /></div>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEdit" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Update
          </button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt, formatDate } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore }    from '@/stores/ui'
import { useAuthStore }  from '@/stores/auth'
import { useMeterStore } from '@/stores/meter'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { Download, Printer, Plus, Gauge, Fuel, BarChart3, Pencil, Save, RotateCw, Trash2 } from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const store           = useMeterStore()
const selectedStation = useSelectedStationStore()

const tab = ref('MS')
const tabLabel = computed(() => (tab.value === 'Speed' ? 'Power' : tab.value))

const BADGE_CLASS = { MS: 'badge-ms', HSD: 'badge-hsd', Speed: 'badge-speed' }
function badgeClass(fuel) { return BADGE_CLASS[fuel] ?? 'badge-gray' }

function nozzleCount(fuel) {
  return store.nozzles.filter((n) => n.fuel === fuel && n.active).length
}

const activeNozzles = computed(() => store.nozzles.filter((n) => n.active))
const tabNozzles    = computed(() => activeNozzles.value.filter((n) => n.fuel === tab.value))

// Only readings that actually have an entry for one of the current tab's
// nozzles — a reading with only MS data shouldn't count/appear under HSD.
const tabReadings = computed(() =>
  store.readings.filter((r) => tabNozzles.value.some((n) => r.nozzles[n.nozzleId]))
)

function tabTotal(r) {
  return tabNozzles.value.reduce((sum, n) => sum + (r.nozzles[n.nozzleId]?.used ?? 0), 0)
}

// Grouped by fuel type for the add/edit modals — one MeterReading covers every
// nozzle regardless of which tab is active, so these always list everything.
const nozzleGroups = computed(() => {
  const order = ['MS', 'HSD', 'Speed']
  return order
    .map((fuel) => ({ fuel, items: activeNozzles.value.filter((n) => n.fuel === fuel) }))
    .filter((g) => g.items.length)
})

// Editing an existing reading must keep whatever nozzles it already has data
// for — even ones since deactivated in Settings — because the backend fully
// replaces a reading's nozzle rows on save; silently dropping one here would
// delete its historical data. So this group also includes those "orphaned"
// nozzle IDs (looked up in the full, not-active-filtered nozzle list).
const editNozzleGroups = computed(() => {
  if (!editData.value) return nozzleGroups.value
  const activeIds = new Set(activeNozzles.value.map((n) => n.nozzleId))
  const extra = Object.keys(editData.value.nozzles ?? {})
    .filter((id) => !activeIds.has(id))
    .map((id) => store.nozzles.find((n) => n.nozzleId === id) ?? { nozzleId: id, pump: '—', fuel: 'MS' })
  const all = [...activeNozzles.value, ...extra]
  const order = ['MS', 'HSD', 'Speed']
  return order
    .map((fuel) => ({ fuel, items: all.filter((n) => n.fuel === fuel) }))
    .filter((g) => g.items.length)
})

function nozzleUsed(form, nozzleId) {
  const n = form.nozzles[nozzleId]
  if (!n) return 0
  return Math.max(0, (n.closing || 0) - (n.opening || 0))
}

function calcTotal(form) {
  return Object.keys(form.nozzles).reduce((sum, id) => sum + nozzleUsed(form, id), 0)
}

// Only nozzles the user actually entered a value for — submitting every
// active nozzle regardless (even ones left blank) would record a fake
// zero reading for fuel types the user never touched that day, which is
// exactly what made tab filtering/counts unreliable.
function filledNozzleIds(form) {
  return Object.keys(form.nozzles).filter((id) => {
    const n = form.nozzles[id]
    return n && n.opening !== null && n.opening !== '' && n.closing !== null && n.closing !== ''
  })
}

const showAdd  = ref(false)
const showEdit = ref(false)
const editData = ref(null)

const meterForm = reactive({ date: '', nozzles: {} })

function buildNozzleForm(nozzleIds, existing) {
  const next = {}
  for (const id of nozzleIds) {
    next[id] = existing?.[id] ? { ...existing[id] } : { opening: null, closing: null }
  }
  return next
}

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

function loadAll() {
  store.fetchNozzles(selectedStation.selectedStationId)
  store.fetchReadings(selectedMonth.value, selectedStation.selectedStationId)
}

onMounted(loadAll)
watch(selectedMonth, loadAll)
watch(() => selectedStation.selectedStationId, loadAll)

// Pre-fills each nozzle's opening reading with its closing reading from the most
// recent prior day's entry — still a plain editable input, just seeded instead
// of blank, since opening should normally equal yesterday's closing.
async function seedOpeningFromLastClosing(date) {
  const lastClosing = await store.fetchLastClosing(date, selectedStation.selectedStationId)
  for (const id of Object.keys(meterForm.nozzles)) {
    const current = meterForm.nozzles[id]
    if (lastClosing[id] !== undefined && (current.opening === null || current.opening === '')) {
      current.opening = lastClosing[id]
    }
  }
}

function openAddReading() {
  meterForm.date = new Date().toISOString().split('T')[0]
  meterForm.nozzles = buildNozzleForm(activeNozzles.value.map((n) => n.nozzleId))
  showAdd.value = true
  seedOpeningFromLastClosing(meterForm.date)
}

// Re-seed if the user backdates/changes the reading date while the modal is
// open — only fills nozzles still blank, so it never clobbers a manual edit.
watch(() => meterForm.date, (newDate) => {
  if (showAdd.value && newDate) seedOpeningFromLastClosing(newDate)
})

function openEditReading(r) {
  const activeIds   = activeNozzles.value.map((n) => n.nozzleId)
  const existingIds = Object.keys(r.nozzles ?? {})
  const ids = Array.from(new Set([...activeIds, ...existingIds]))
  editData.value = {
    ...r,
    date: r.date?.includes(' ') ? toIsoDate(r.date) : r.date,
    nozzles: buildNozzleForm(ids, r.nozzles),
  }
  showEdit.value = true
}

function toIsoDate(displayDate) {
  // '01 Apr 2026' or '2026-04-01' → 'YYYY-MM-DD'
  if (!displayDate) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) return displayDate
  return new Date(displayDate).toISOString().split('T')[0]
}

async function saveMeterReading() {
  if (!meterForm.date) { ui.error('Date is required'); return }
  const ids = filledNozzleIds(meterForm)
  if (!ids.length) { ui.error('Enter at least one nozzle reading'); return }
  try {
    const payload = store.buildPayload(meterForm, ids)
    await store.createReading(payload)
    showAdd.value = false
    ui.success('Meter reading saved!')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to save reading.')
  }
}

async function saveEdit() {
  if (!editData.value?.id) return
  const ids = filledNozzleIds(editData.value)
  if (!ids.length) { ui.error('Enter at least one nozzle reading'); return }
  try {
    const payload = store.buildPayload(editData.value, ids)
    await store.updateReading(editData.value.id, payload)
    showEdit.value = false
    ui.success('Meter reading updated!')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to update reading.')
  }
}

async function confirmDelete(r) {
  if (!confirm(`Delete reading for ${formatDate(r.date)}?`)) return
  try {
    await store.deleteReading(r.id)
    ui.success('Meter reading deleted.')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to delete reading.')
  }
}

function doExport() {
  const headers = ['Date', ...tabNozzles.value.flatMap((n) => [`${n.nozzleId}-Open`, `${n.nozzleId}-Close`, `${n.nozzleId}-Used`]), 'Total']
  const rows = tabReadings.value.map((r) => [
    r.date,
    ...tabNozzles.value.flatMap((n) => [
      r.nozzles[n.nozzleId]?.opening ?? '',
      r.nozzles[n.nozzleId]?.closing ?? '',
      fmt(r.nozzles[n.nozzleId]?.used ?? 0),
    ]),
    fmt(tabTotal(r)),
  ])
  exportCSV(`${tabLabel.value}_Meter_Readings_${selectedMonth.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date', ...tabNozzles.value.map((n) => `${n.nozzleId} Used`), 'Day Total']
  const rows = tabReadings.value.map((r) => [
    formatDate(r.date),
    ...tabNozzles.value.map((n) => fmt(r.nozzles[n.nozzleId]?.used ?? 0)),
    fmt(tabTotal(r)),
  ])
  printTable(`${tabLabel.value} Meter Readings`, headers, rows)
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
