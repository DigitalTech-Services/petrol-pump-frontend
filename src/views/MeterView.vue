<template>
  <div>
    <PageHeader title="Meter Readings" subtitle="Nozzle-wise opening & closing meters" :crumbs="['Home','Meter']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAddReading"><Plus :size="14" /> Add Reading</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Nozzles"    value="3 Active"   :icon="Gauge"    color="#f59e0b" sub="MS-1 to MS-3"/>
      <KpiCard label="HSD Nozzles"   value="4 Active"   :icon="Gauge"    color="#10b981" sub="HSD-1 to HSD-4"/>
      <KpiCard label="Speed Nozzles" value="4 Active"   :icon="Gauge"    color="#3b82f6" sub="SP-1 to SP-4"/>
      <KpiCard label="Total MS Used" :value="fmt(store.totalUsed) + ' L'" :icon="BarChart3" color="#6366f1" sub="All nozzles current month"/>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="font-display font-bold text-[15px] text-white">MS Nozzle Meter</div>
        <span class="badge badge-ms ml-2">{{ store.readings.length }} entries</span>
      </div>

      <!-- Loading state -->
      <div v-if="store.loading" class="p-8 text-center text-[#5a6a82] text-[13px]">Loading meter readings…</div>

      <!-- Error state -->
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS-1 Open</th><th>MS-1 Close</th><th>MS-1 Used</th>
              <th>MS-2 Open</th><th>MS-2 Close</th><th>MS-2 Used</th>
              <th>MS-3 Open</th><th>MS-3 Close</th><th>MS-3 Used</th>
              <th>Day Total</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.readings.length === 0">
              <td colspan="13" class="text-center text-[#5a6a82] py-6 text-[13px]">No readings found. Add the first one.</td>
            </tr>
            <tr v-for="(r, i) in store.readings" :key="r.id ?? r.date">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1o ?? '—' }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1c ?? '—' }}</td>
              <td><span class="badge badge-ms">{{ fmt((r.ms1c ?? 0) - (r.ms1o ?? 0)) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2o ?? '—' }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2c ?? '—' }}</td>
              <td><span class="badge badge-ms">{{ fmt((r.ms2c ?? 0) - (r.ms2o ?? 0)) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3o ?? '—' }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3c ?? '—' }}</td>
              <td><span class="badge badge-ms">{{ fmt((r.ms3c ?? 0) - (r.ms3o ?? 0)) }}</span></td>
              <td class="amt text-[#f59e0b] font-bold">{{ fmt(r.total) }}</td>
              <td class="flex items-center gap-1">
                <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditReading(r)"><Pencil :size="11" /></button>
                <button class="btn btn-ghost py-0.5 px-2 text-[11px] text-red-400" @click="confirmDelete(r)"><Trash2 :size="11" /></button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="store.readings.length > 0">
            <tr>
              <td colspan="4">TOTAL</td>
              <td>{{ fmt(store.readings.reduce((a, r) => a + ((r.ms1c ?? 0) - (r.ms1o ?? 0)), 0)) }}</td>
              <td colspan="2">—</td>
              <td>{{ fmt(store.readings.reduce((a, r) => a + ((r.ms2c ?? 0) - (r.ms2o ?? 0)), 0)) }}</td>
              <td colspan="2">—</td>
              <td>{{ fmt(store.readings.reduce((a, r) => a + ((r.ms3c ?? 0) - (r.ms3o ?? 0)), 0)) }}</td>
              <td>{{ fmt(store.readings.reduce((a, r) => a + (r.total ?? 0), 0)) }}</td>
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
      <div v-for="nozzle in NOZZLE_KEYS" :key="nozzle"
        class="p-4 rounded-xl mb-3" style="background:#161b24;border:1px solid #1c2230">
        <div class="flex items-center gap-2 mb-3">
          <span class="badge badge-ms">{{ nozzleLabel(nozzle) }}</span>
          <span class="text-[13px] font-medium text-white">Nozzle {{ nozzleLabel(nozzle) }}</span>
          <span class="ml-auto text-[12px] text-[#5a6a82]">Used: <span class="text-[#f59e0b] font-semibold">{{ fmt(Math.max(0, (meterForm[nozzle + 'c'] || 0) - (meterForm[nozzle + 'o'] || 0))) }} L</span></span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Opening Meter</label>
            <input type="number" step="0.01" v-model.number="meterForm[nozzle + 'o']" class="form-input w-full" placeholder="0.00" />
          </div>
          <div>
            <label class="field-label">Closing Meter</label>
            <input type="number" step="0.01" v-model.number="meterForm[nozzle + 'c']" class="form-input w-full" placeholder="0.00" />
          </div>
        </div>
      </div>
      <div class="p-3 rounded-lg flex justify-between mt-2" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
        <span class="text-[13px] font-medium text-white">Total Day Consumption</span>
        <span class="font-display font-bold text-[18px] text-[#f59e0b]">{{ fmt(calcTotal) }} L</span>
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
        <div v-for="nozzle in NOZZLE_KEYS" :key="nozzle"
          class="p-3 rounded-xl" style="background:#161b24;border:1px solid #1c2230">
          <div class="text-[12px] font-semibold text-[#f59e0b] mb-2">{{ nozzleLabel(nozzle) }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="field-label">Opening</label><input type="number" step="0.01" v-model.number="editData[nozzle + 'o']" class="form-input w-full" /></div>
            <div><label class="field-label">Closing</label><input type="number" step="0.01" v-model.number="editData[nozzle + 'c']" class="form-input w-full" /></div>
          </div>
        </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore }    from '@/stores/ui'
import { useMeterStore } from '@/stores/meter'
import { Download, Printer, Plus, Gauge, BarChart3, Pencil, Save, RotateCw, Trash2 } from 'lucide-vue-next'

const ui    = useUiStore()
const store = useMeterStore()

const NOZZLE_KEYS = ['ms1', 'ms2', 'ms3']

function nozzleLabel(key) {
  // 'ms1' → 'MS-1'
  return key.toUpperCase().replace(/([A-Z]+)(\d)/, '$1-$2')
}

const showAdd  = ref(false)
const showEdit = ref(false)
const editData = ref(null)

const meterForm = reactive({ date: '', ms1o: null, ms1c: null, ms2o: null, ms2c: null, ms3o: null, ms3c: null })

const calcTotal = computed(() =>
  NOZZLE_KEYS.reduce((sum, key) =>
    sum + Math.max(0, (meterForm[key + 'c'] || 0) - (meterForm[key + 'o'] || 0)), 0)
)

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

onMounted(() => {
  store.fetchReadings(currentMonth.value)
})

function openAddReading() {
  meterForm.date = new Date().toISOString().split('T')[0]
  NOZZLE_KEYS.forEach((k) => { meterForm[k + 'o'] = null; meterForm[k + 'c'] = null })
  showAdd.value = true
}

function openEditReading(r) {
  editData.value = { ...r, date: r.date?.includes(' ') ? toIsoDate(r.date) : r.date }
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
  try {
    const payload = store.buildPayload(meterForm, NOZZLE_KEYS)
    await store.createReading(payload)
    showAdd.value = false
    ui.success('Meter reading saved!')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to save reading.')
  }
}

async function saveEdit() {
  if (!editData.value?.id) return
  try {
    const payload = store.buildPayload(editData.value, NOZZLE_KEYS)
    await store.updateReading(editData.value.id, payload)
    showEdit.value = false
    ui.success('Meter reading updated!')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to update reading.')
  }
}

async function confirmDelete(r) {
  if (!confirm(`Delete reading for ${r.date}?`)) return
  try {
    await store.deleteReading(r.id)
    ui.success('Meter reading deleted.')
  } catch (e) {
    ui.error(e?.message ?? 'Failed to delete reading.')
  }
}

function doExport() {
  const headers = ['Date', 'MS1-Open', 'MS1-Close', 'MS1-Used', 'MS2-Open', 'MS2-Close', 'MS2-Used', 'MS3-Open', 'MS3-Close', 'MS3-Used', 'Total']
  const rows = store.readings.map((r) => [
    r.date,
    r.ms1o, r.ms1c, fmt((r.ms1c ?? 0) - (r.ms1o ?? 0)),
    r.ms2o, r.ms2c, fmt((r.ms2c ?? 0) - (r.ms2o ?? 0)),
    r.ms3o, r.ms3c, fmt((r.ms3c ?? 0) - (r.ms3o ?? 0)),
    r.total,
  ])
  exportCSV('Meter_Readings', headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date', 'MS-1 Used', 'MS-2 Used', 'MS-3 Used', 'Day Total']
  const rows = store.readings.map((r) => [
    r.date,
    fmt((r.ms1c ?? 0) - (r.ms1o ?? 0)),
    fmt((r.ms2c ?? 0) - (r.ms2o ?? 0)),
    fmt((r.ms3c ?? 0) - (r.ms3o ?? 0)),
    fmt(r.total),
  ])
  printTable('MS Meter Readings', headers, rows)
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
