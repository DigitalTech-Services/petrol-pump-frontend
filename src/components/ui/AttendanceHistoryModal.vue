<template>
  <AppModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="Attendance History" :subtitle="'Past attendance records — ' + historyMonthLabel" :icon="History" max-width="1100px">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <select v-model.number="historyMonthNum" class="form-select text-[13px]" style="min-width:130px">
        <option v-for="(name, i) in MONTH_NAMES" :key="name" :value="i + 1">{{ name }}</option>
      </select>
      <select v-model.number="historyYear" class="form-select text-[13px]" style="min-width:90px">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
      <select v-model="historyStaffId" class="form-select text-[13px]" style="min-width:180px">
        <option value="">All Staff</option>
        <option v-for="st in historyStaffOptions" :key="st.id" :value="st.id">{{ st.name }}</option>
      </select>
      <div class="flex rounded-lg p-0.5 ml-auto" style="background:var(--bg-3);border:1px solid var(--bg-4)">
        <button v-for="v in [{ key: 'calendar', label: 'Calendar' }, { key: 'list', label: 'List' }]" :key="v.key" type="button"
          class="px-3 py-1 rounded-md text-[12px] font-medium transition-colors"
          :class="historyView === v.key ? 'bg-[#f59e0b] text-[#0a0c10]' : 'text-[var(--text-2)]'"
          @click="historyView = v.key">{{ v.label }}</button>
      </div>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      <div v-for="t in historyTotals" :key="t.label" class="p-2.5 rounded-lg" style="background:var(--bg-3);border:1px solid var(--bg-4)">
        <div class="text-[10px] text-[var(--text-3)] uppercase tracking-wide">{{ t.label }}</div>
        <div class="font-display font-bold text-[18px]" :style="{ color: t.color }">{{ t.value }}</div>
      </div>
    </div>

    <div v-if="historyLoading" class="text-center py-12 text-[var(--text-3)] text-[13px]">Loading attendance…</div>
    <div v-else-if="!historyRecords.length" class="text-center py-12 text-[var(--text-3)] text-[13px]">No attendance recorded for {{ historyMonthLabel }}.</div>

    <!-- Calendar: one staff member → month calendar -->
    <template v-else-if="historyView === 'calendar' && historyStaffId">
      <div class="grid grid-cols-7 gap-1.5">
        <div v-for="w in WEEKDAYS" :key="w" class="text-center text-[10px] text-[var(--text-3)] uppercase tracking-wide pb-1">{{ w }}</div>
        <div v-for="n in historyLeadingBlanks" :key="'b' + n" />
        <div v-for="d in historyDays" :key="d" class="rounded-lg p-1.5 min-h-[62px] flex flex-col"
          :style="dayCellStyle(cellFor(historyStaffId, d))">
          <span class="text-[11px] text-[var(--text-3)]">{{ d }}</span>
          <template v-if="cellFor(historyStaffId, d)">
            <span class="mt-auto font-display font-bold text-[13px]" :class="cellFor(historyStaffId, d).status === 'present' ? 'text-positive' : 'text-negative'">
              {{ cellFor(historyStaffId, d).status === 'present' ? `${fmtHours(cellFor(historyStaffId, d).total_hours)}h` : 'Absent' }}
            </span>
            <span v-if="cellFor(historyStaffId, d).in_time" class="text-[9.5px] text-[var(--text-3)] font-mono-custom">
              {{ hhmm(cellFor(historyStaffId, d).in_time) }}–{{ hhmm(cellFor(historyStaffId, d).out_time) }}
            </span>
          </template>
        </div>
      </div>
    </template>

    <!-- Calendar: all staff → monthly register (staff × days) -->
    <div v-else-if="historyView === 'calendar'" class="overflow-x-auto">
      <table class="text-[11px] border-separate" style="border-spacing:2px">
        <thead>
          <tr>
            <th class="sticky left-0 z-10 text-left px-2 py-1 text-[var(--text-3)] font-medium" style="background:var(--bg-2);min-width:140px">Staff</th>
            <th v-for="d in historyDays" :key="d" class="w-7 text-center text-[var(--text-3)] font-medium">{{ d }}</th>
            <th class="px-2 text-[var(--text-3)] font-medium">P</th>
            <th class="px-2 text-[var(--text-3)] font-medium">Hrs</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="st in historyStaffRows" :key="st.id">
            <td class="sticky left-0 z-10 px-2 py-1 text-[var(--text)] font-medium whitespace-nowrap" style="background:var(--bg-2)">{{ st.name }}</td>
            <td v-for="d in historyDays" :key="d" class="w-7 h-7 text-center rounded font-semibold"
              :style="dayCellStyle(cellFor(st.id, d))"
              :title="cellTitle(st.name, d, cellFor(st.id, d))">
              <span v-if="cellFor(st.id, d)?.status === 'present'" class="text-positive">{{ fmtHours(cellFor(st.id, d).total_hours) }}</span>
              <span v-else-if="cellFor(st.id, d)" class="text-negative">A</span>
            </td>
            <td class="px-2 text-center text-positive font-semibold">{{ staffStat(st.id).present }}</td>
            <td class="px-2 text-center text-[#3b82f6] font-semibold">{{ fmtHours(staffStat(st.id).hours) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="flex gap-4 mt-3 text-[11px] text-[var(--text-3)]">
        <span><span class="text-positive font-semibold">8 / 24</span> Present (hours)</span>
        <span><span class="text-negative font-semibold">A</span> Absent</span>
        <span>Blank — not marked</span>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="overflow-x-auto">
      <table class="data-table w-full">
        <thead>
          <tr><th>Date</th><th>Employee</th><th>Status</th><th>In Time</th><th>Out Time</th><th>Hours</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in historyListRows" :key="r.id">
            <td>{{ formatDate(r.date) }}</td>
            <td class="text-[var(--text)] font-medium">{{ r.staff?.name || '—' }}</td>
            <td><span class="badge" :class="r.status === 'present' ? 'badge-green' : 'badge-red'">{{ r.status === 'present' ? 'Present' : 'Absent' }}</span></td>
            <td class="font-mono-custom">{{ hhmm(r.in_time) || '—' }}</td>
            <td class="font-mono-custom">{{ hhmm(r.out_time) || '—' }}</td>
            <td class="amt text-[#3b82f6]">{{ r.status === 'present' ? fmtHours(r.total_hours) + 'h' : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppModal>
</template>

<script setup>
// Attendance History — day-by-day attendance for a chosen month & year, as a
// calendar (one staff), a register (all staff), or a plain list.
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatDate } from '@/utils/format'
import { useUiStore } from '@/stores/ui'
import { staffApi } from '@/services/api'
import { History } from 'lucide-vue-next'

const ui = useUiStore()

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  month:      { type: String, default: () => new Date().toISOString().slice(0, 7) }, // 'YYYY-MM' to open on
  staffId:    { type: [Number, String], default: '' },                               // '' = all staff
  staffList:  { type: Array, default: () => [] },                                    // [{ id, name }] shown in the filter
  stationId:  { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue'])

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const historyYear     = ref(Number(props.month.slice(0, 4)))
const historyMonthNum = ref(Number(props.month.slice(5, 7)))
const historyMonth    = computed(() => `${historyYear.value}-${String(historyMonthNum.value).padStart(2, '0')}`)
const historyStaffId  = ref(props.staffId)

// Current year back to 5 years ago (plus the opened year, if older)
const yearOptions = computed(() => {
  const now   = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => now - i)
  if (!years.includes(historyYear.value)) years.push(historyYear.value)
  return years
})
const historyView    = ref('calendar')
const historyRecords = ref([])
const historyLoading = ref(false)

const historyMonthLabel = computed(() => {
  const [y, m] = historyMonth.value.split('-')
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

const historyDays = computed(() => {
  const [y, m] = historyMonth.value.split('-')
  return new Date(+y, +m, 0).getDate()
})

// Empty cells before the 1st so the calendar lines up with Mon–Sun
const historyLeadingBlanks = computed(() => {
  const [y, m] = historyMonth.value.split('-')
  return (new Date(+y, +m - 1, 1).getDay() + 6) % 7
})

// Staff who appear in this month's records, plus the current staff list
const historyStaffOptions = computed(() => {
  const map = new Map()
  props.staffList.forEach(s => map.set(s.id, { id: s.id, name: s.name }))
  historyRecords.value.forEach(r => r.staff && map.set(r.staff_id, { id: r.staff_id, name: r.staff.name }))
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const historyStaffRows = computed(() =>
  historyStaffOptions.value.filter(st => historyRecords.value.some(r => r.staff_id === st.id))
)

// staffId → day-of-month → record, for quick calendar lookups
const historyIndex = computed(() => {
  const idx = {}
  historyRecords.value.forEach(r => {
    const day = Number(r.date.slice(8, 10))
    ;(idx[r.staff_id] ??= {})[day] = r
  })
  return idx
})

const cellFor = (staffId, day) => historyIndex.value[staffId]?.[day] ?? null

const filteredHistory = computed(() =>
  historyStaffId.value
    ? historyRecords.value.filter(r => r.staff_id === historyStaffId.value)
    : historyRecords.value
)

const historyListRows = computed(() =>
  [...filteredHistory.value].sort((a, b) => b.date.localeCompare(a.date) || (a.staff?.name ?? '').localeCompare(b.staff?.name ?? ''))
)

const historyTotals = computed(() => {
  const recs    = filteredHistory.value
  const present = recs.filter(r => r.status === 'present')
  return [
    { label: 'Days Marked',  value: new Set(recs.map(r => r.date)).size, color: 'var(--text)' },
    { label: 'Present',      value: present.length,                      color: '#10b981' },
    { label: 'Absent',       value: recs.length - present.length,        color: '#ef4444' },
    { label: 'Total Hours',  value: fmtHours(present.reduce((a, r) => a + Number(r.total_hours || 0), 0)) + 'h', color: '#3b82f6' },
  ]
})

const staffStat = (staffId) => {
  const recs = Object.values(historyIndex.value[staffId] ?? {}).filter(r => r.status === 'present')
  return { present: recs.length, hours: recs.reduce((a, r) => a + Number(r.total_hours || 0), 0) }
}

const fmtHours = (h) => Number(h || 0) % 1 === 0 ? String(Number(h || 0)) : Number(h).toFixed(1)
const hhmm     = (t) => (t ? String(t).slice(0, 5) : '')

function dayCellStyle(rec) {
  if (!rec) return { background: 'var(--bg-3)', border: '1px solid var(--bg-4)' }
  return rec.status === 'present'
    ? { background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)' }
    : { background: 'rgba(239,68,68,.10)',  border: '1px solid rgba(239,68,68,.3)' }
}

function cellTitle(name, day, rec) {
  if (!rec) return `${name} — ${day}: not marked`
  if (rec.status !== 'present') return `${name} — ${formatDate(rec.date)}: Absent`
  const times = rec.in_time ? ` (${hhmm(rec.in_time)}–${hhmm(rec.out_time)})` : ''
  return `${name} — ${formatDate(rec.date)}: Present, ${fmtHours(rec.total_hours)}h${times}`
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await staffApi.getAttendance({
      month: historyMonth.value,
      ...(props.stationId ? { station_id: props.stationId } : {}),
    })
    historyRecords.value = res?.data?.attendance ?? []
  } catch (e) {
    historyRecords.value = []
    ui.error(e?.message || 'Failed to load attendance history')
  } finally {
    historyLoading.value = false
  }
}

// Each time the modal opens, start from the month / staff the caller asked for
watch(() => props.modelValue, (open) => {
  if (!open) return
  historyYear.value     = Number(props.month.slice(0, 4))
  historyMonthNum.value = Number(props.month.slice(5, 7))
  historyStaffId.value  = props.staffId
  loadHistory()
})

watch([historyMonth, () => props.stationId], () => { if (props.modelValue) loadHistory() })
</script>
