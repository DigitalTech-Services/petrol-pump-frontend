<template>
  <div>
    <PageHeader title="Time Sheet" :subtitle="'Staff attendance & working hours — '+monthLabel" :crumbs="['Home','Time Sheet']">
      <template #actions>
        <input type="month" v-model="selectedMonth" class="form-input text-[13px]" style="width:150px" />
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="openHistory()"><History :size="14" /> Attendance History</button>
        <button v-if="auth.canWrite" class="btn btn-primary flex items-center gap-1.5" @click="openMarkAttendance"><CheckCircle2 :size="14" /> Mark Attendance</button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-[var(--text-3)] text-[14px]">Loading timesheet…</div>

    <template v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Staff"     :value="timesheetData.length"                                                                               :icon="Users"      color="#f59e0b" sub="Active this month"/>
        <KpiCard label="Total Man-Days"  :value="timesheetData.reduce((a,s)=>a+s.daysWorked,0)"                                                      :icon="Calendar"   color="#10b981" sub="Combined attendance"/>
        <KpiCard label="Avg Attendance"  :value="timesheetData.length ? Math.round(timesheetData.reduce((a,s)=>a+s.daysWorked,0)/timesheetData.length)+' days' : '—'" :icon="BarChart3" color="#3b82f6" sub="Per person"/>
        <KpiCard label="Full Attendance" :value="timesheetData.filter(s=>s.daysWorked>=daysInMonth).length+' Staff'"                                 :icon="Award"      color="#6366f1" :sub="`${daysInMonth}/${daysInMonth} days`"/>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div v-for="s in timesheetData" :key="s.id"
          class="rounded-xl p-5 transition-all duration-200 hover:-translate-y-1"
          :class="auth.canWrite ? 'cursor-pointer' : ''"
          style="background:var(--bg-2);border:1px solid var(--border)"
          @click="auth.canWrite && openEditAttendance(s)">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-[var(--text)] flex-shrink-0" :style="{background:s.color}">
              {{ s.name.slice(0,2).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-display font-bold text-[15px] text-[var(--text)]">{{ s.name }}</div>
              <div class="text-[11.5px] text-[var(--text-3)]">{{ s.role }}</div>
            </div>
            <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[#f59e0b] hover:bg-[var(--bg-4)] transition-all flex-shrink-0"
              title="Attendance History" @click.stop="openHistory(s)"><History :size="14" /></button>
            <div class="text-right">
              <div class="font-display font-bold text-[22px]" :style="{color:s.color}">{{ s.daysWorked }}</div>
              <div class="text-[10px] text-[var(--text-3)]">/ {{ daysInMonth }} days</div>
            </div>
          </div>
          <div class="mb-3">
            <div class="fuel-bar-track">
              <div class="fuel-bar-fill" :style="{width:(s.daysWorked/daysInMonth*100)+'%',background:s.color}" />
            </div>
            <div class="flex justify-between text-[10.5px] text-[var(--text-3)] mt-1">
              <span>{{ Math.round(s.daysWorked/daysInMonth*100) }}% attendance</span>
              <span>{{ daysInMonth-s.daysWorked }} absent</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid var(--bg-4)">
            <div class="text-center">
              <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Hours/Day</div>
              <div class="font-display font-bold text-[13px] text-[#3b82f6]">{{ s.totalHours }}h</div>
            </div>
            <div class="text-center">
              <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Rate/Hr</div>
              <div class="font-display font-bold text-[13px] text-[#f59e0b]">₹{{ s.ratePerHour }}</div>
            </div>
            <div class="text-center">
              <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Salary</div>
              <div class="font-display font-bold text-[13px] text-positive">{{ fmtCompact(s.salary) }}</div>
            </div>
          </div>
          <div v-if="auth.canWrite" class="mt-3 text-center text-[10.5px] text-[var(--text-3)] hover:text-[#f59e0b] transition-colors flex items-center justify-center gap-1"><Pencil :size="10" /> Click to edit</div>
        </div>
      </div>

      <!-- Full Register Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-[var(--text)]">Attendance Register — {{ monthLabel }}</div>
            <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Complete shift & salary register</div>
          </div>
          <button class="btn btn-ghost ml-auto text-[12px] flex items-center gap-1.5" @click="doPrint"><Printer :size="13" /> Print Register</button>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>Employee</th><th>Role</th><th>Days Present</th><th>Days Absent</th><th>In Time</th><th>Out Time</th><th>Hours</th><th>Rate/Hour</th><th>Gross Salary</th><th>Advance</th><th>Net Payable</th><th>Attendance %</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s,i) in timesheetData" :key="s.id">
                <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i+1 }}</td>
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-[var(--text)] flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-[var(--text)]">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ s.role }}</span></td>
                <td><span class="font-display font-bold text-[15px] text-positive">{{ s.daysWorked }}</span> <span class="text-[var(--text-3)] text-[11px]">days</span></td>
                <td><span class="font-display font-bold text-[15px]" :class="(daysInMonth-s.daysWorked)>5?'text-negative':'text-[var(--text-3)]'">{{ daysInMonth-s.daysWorked }}</span></td>
                <td class="font-mono-custom text-[12px] text-[var(--text-2)]">{{ s.inTime }}</td>
                <td class="font-mono-custom text-[12px] text-[var(--text-2)]">{{ s.outTime }}</td>
                <td><span class="badge badge-gray text-[#3b82f6]">{{ s.totalHours }}h</span></td>
                <td class="amt text-[var(--text-2)]">₹{{ s.ratePerHour }}</td>
                <td class="amt text-positive font-semibold">₹{{ fmt(s.salary) }}</td>
                <td class="amt text-negative">{{ s.advance>0?'₹'+fmt(s.advance):'—' }}</td>
                <td><span class="font-display font-bold text-[15px]" :class="s.netPayable<0?'text-negative':'text-[#f59e0b]'">₹{{ fmt(s.netPayable) }}</span></td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 fuel-bar-track" style="min-width:50px">
                      <div class="fuel-bar-fill" :style="{width:(s.daysWorked/daysInMonth*100)+'%',background:s.color}" />
                    </div>
                    <span class="text-[11px] text-[var(--text-2)]">{{ Math.round(s.daysWorked/daysInMonth*100) }}%</span>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openHistory(s)"><History :size="11" /> History</button>
                    <button v-if="auth.canWrite" class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditAttendance(s)"><Pencil :size="11" /> Edit</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="timesheetData.length">
              <tr>
                <td colspan="3">TOTAL ({{ timesheetData.length }} employees)</td>
                <td>{{ timesheetData.reduce((a,s)=>a+s.daysWorked,0) }} days</td>
                <td>{{ timesheetData.reduce((a,s)=>a+(daysInMonth-s.daysWorked),0) }}</td>
                <td colspan="2">—</td>
                <td>{{ timesheetData.length ? (timesheetData.reduce((a,s)=>a+s.totalHours,0)/timesheetData.length).toFixed(1) : 0 }}h avg</td>
                <td>—</td>
                <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.salary,0)) }}</td>
                <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.advance,0)) }}</td>
                <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.netPayable,0)) }}</td>
                <td colspan="2">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ═══ MARK ATTENDANCE MODAL ═══ -->
    <AppModal v-model="showMark" title="Mark Attendance" subtitle="Record staff attendance for the date" :icon="CheckCircle2" max-width="560px">
      <div class="mb-4">
        <label class="field-label">Attendance Date *</label>
        <input type="date" v-model="attendanceDate" class="form-input w-full" />
      </div>
      <div class="space-y-2">
        <div v-for="s in timesheetData" :key="s.id"
          class="p-3 rounded-lg"
          style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <!-- Top row: avatar + name + present toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[12px] text-[var(--text)] flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
              <div>
                <div class="font-medium text-[var(--text)] text-[13.5px]">{{ s.name }}</div>
                <div class="text-[11px] text-[var(--text-3)]">{{ s.role }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[12px] text-[var(--text-3)]">{{ s.daysWorked }}/{{ daysInMonth }} days</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="attendanceMap[s.id]" class="sr-only peer">
                <div class="w-10 h-5 rounded-full peer-checked:bg-[#10b981] bg-[var(--border)] transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
              <span class="text-[12px] w-14" :class="attendanceMap[s.id]?'text-positive':'text-negative'">{{ attendanceMap[s.id]?'Present':'Absent' }}</span>
            </div>
          </div>
          <!-- In / Out time — only shown when marked Present -->
          <div v-if="attendanceMap[s.id]" class="grid grid-cols-3 gap-2 mt-2.5 pt-2.5" style="border-top:1px solid var(--border)">
            <div>
              <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">In Time</div>
              <input type="time" v-model="attendanceTimeMap[s.id].in" class="form-input w-full text-[12px] py-1" />
            </div>
            <div>
              <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">Hours Worked</div>
              <!-- Client rule: a shift is either 8 or 24 hours — nothing else -->
              <div class="grid grid-cols-2 gap-1 p-0.5 rounded-lg" style="background:var(--bg-2);border:1px solid var(--border);height:34px">
                <button v-for="h in ALLOWED_HOURS" :key="h" type="button"
                  class="rounded-md font-display font-bold text-[13px] transition-colors"
                  :class="attendanceTimeMap[s.id].hours === h ? 'bg-[#3b82f6] text-white' : 'text-[var(--text-2)]'"
                  @click="attendanceTimeMap[s.id].hours = h">{{ h }}h</button>
              </div>
            </div>
            <div>
              <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">Out Time</div>
              <div class="p-1.5 rounded-lg flex items-center justify-center font-mono-custom text-[12px] text-[var(--text-2)]" style="background:var(--bg-2);border:1px solid var(--border);height:34px">
                {{ outTimeFor(attendanceTimeMap[s.id]) || '—' }}<span v-if="attendanceTimeMap[s.id].in && attendanceTimeMap[s.id].hours === 24" class="ml-1 text-[10px] text-[var(--text-3)]">+1d</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 p-3 rounded-lg flex justify-between" style="background:var(--bg-3);border:1px solid var(--bg-4)">
        <span class="text-[var(--text-2)] text-[13px]">Present today:</span>
        <span class="font-display font-bold text-[16px] text-positive">{{ Object.values(attendanceMap).filter(Boolean).length }} / {{ timesheetData.length }}</span>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showMark=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" :disabled="saving" @click="saveAttendance">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><CheckCircle2 v-else :size="14" /> {{ saving ? 'Saving…' : 'Save Attendance' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT ATTENDANCE MODAL ═══ -->
    <AppModal v-model="showEditAtt" :title="'Edit — '+(editAttData?.name||'')" :icon="Pencil" max-width="480px">
      <div class="space-y-4" v-if="editAttData">
        <div class="flex items-center gap-3 p-3 rounded-lg mb-2" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <div class="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-[16px] text-[var(--text)]" :style="{background:editAttData.color}">{{ editAttData.name.slice(0,2).toUpperCase() }}</div>
          <div>
            <div class="font-display font-bold text-[16px] text-[var(--text)]">{{ editAttData.name }}</div>
            <div class="text-[12px] text-[var(--text-3)]">{{ editAttData.role }} · ₹{{ editAttData.ratePerHour }}/hr</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Days Present</label>
            <div class="p-2.5 rounded-lg flex items-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-display font-bold text-[18px] text-positive">{{ editAttData.daysWorked }}</span>
              <span class="text-[11px] text-[var(--text-3)] ml-1">/ {{ daysInMonth }} days</span>
            </div>
          </div>
          <div>
            <label class="field-label">Shift Hours</label>
            <select v-model.number="editAttData.shift" class="form-select w-full">
              <option :value="null" disabled>Select shift</option>
              <option :value="8">8 Hours</option><option :value="24">24 Hours</option>
            </select>
          </div>
        </div>
        <!-- In / Out / Total Hours (display from last attendance record) -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="field-label">Last In Time</label>
            <div class="p-2 rounded-lg flex items-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-mono-custom text-[13px] text-[var(--text-2)]">{{ editAttData.inTime || '—' }}</span>
            </div>
          </div>
          <div>
            <label class="field-label">Last Out Time</label>
            <div class="p-2 rounded-lg flex items-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-mono-custom text-[13px] text-[var(--text-2)]">{{ editAttData.outTime || '—' }}</span>
            </div>
          </div>
          <div>
            <label class="field-label">Avg Hours/Day</label>
            <div class="p-2.5 rounded-lg flex items-center justify-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-display font-bold text-[20px] text-[#3b82f6]">{{ editAttData.totalHours }}h</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Rate per Hour (₹)</label>
            <div class="p-2.5 rounded-lg flex items-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-mono-custom text-[13px] text-[var(--text-2)]">₹{{ editAttData.ratePerHour }}/hr</span>
            </div>
          </div>
          <div>
            <label class="field-label">Total Advance (₹)</label>
            <div class="p-2.5 rounded-lg flex items-center" style="background:var(--bg-3);border:1px solid var(--bg-4);height:42px">
              <span class="font-display font-bold text-[18px] text-negative">₹{{ fmt(editAttData.advance) }}</span>
            </div>
          </div>
        </div>
        <div class="text-[11.5px] text-[var(--text-3)] px-1">
          To change this employee's rate going forward, use Staff & Salary — {{ monthLabel }}'s gross pay below already reflects the rate in effect on each logged day.
        </div>
        <!-- Summary (from the timesheet — already hour-based, not recomputed here) -->
        <div class="grid grid-cols-3 gap-3 p-3 rounded-lg" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <div class="text-center">
            <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">Gross Salary</div>
            <div class="font-display font-bold text-[16px] text-positive">₹{{ fmt(editAttData.salary) }}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">Advance</div>
            <div class="font-display font-bold text-[16px] text-negative">₹{{ fmt(editAttData.advance) }}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] text-[var(--text-3)] uppercase mb-1">Net Payable</div>
            <div class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt(editAttData.netPayable) }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEditAtt=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" :disabled="saving" @click="saveEditAtt">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" /> {{ saving ? 'Saving…' : 'Update' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ ATTENDANCE HISTORY MODAL ═══ -->
    <AttendanceHistoryModal v-model="showHistory" :month="historyMonth" :staff-id="historyStaffId"
      :staff-list="timesheetData" :station-id="selectedStation.selectedStationId" />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import AttendanceHistoryModal from '@/components/ui/AttendanceHistoryModal.vue'
import { fmt, fmtCompact, formatDate } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { staffApi }   from '@/services/api'
import {
  Users, Calendar, BarChart3, Award, Download, Printer,
  CheckCircle2, Pencil, RotateCw, Save, History
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()
const showMark    = ref(false)
const showEditAtt = ref(false)
const editAttData = ref(null)
const attendanceDate = ref(new Date().toISOString().split('T')[0])
const loading     = ref(false)
const saving      = ref(false)

const selectedMonth = ref(new Date().toISOString().slice(0, 7))

const monthLabel = computed(() => {
  const [y, m] = selectedMonth.value.split('-')
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Actual number of days in the selected month (28-31) — not a fixed 30.
const daysInMonth = computed(() => {
  const [y, m] = selectedMonth.value.split('-')
  return new Date(+y, +m, 0).getDate()
})

const COLORS = ['#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#6366f1','#78716c']


// Attendance can only be marked as an 8-hour or a 24-hour shift (client requirement)
const ALLOWED_HOURS = [8, 24]

// Default to the staff member's shift when it's an allowed value, otherwise 8
const defaultHours = (s) => ALLOWED_HOURS.includes(Number(s.shift)) ? Number(s.shift) : 8

// Out time = in time + shift hours, wrapped past midnight (24h → same clock time next day)
function outTimeFor({ in: inTime, hours }) {
  if (!inTime) return ''
  const [h, m] = inTime.split(':').map(Number)
  const mins = (h * 60 + m + hours * 60) % (24 * 60)
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function mapEntry(item, idx) {
  const s = item.staff
  return {
    id:          s.id,
    name:        s.name,
    role:        s.role,
    daysWorked:  item.days_present,
    shift:       s.shift_hours ?? 8,
    ratePerHour: s.rate_per_hour,
    salary:      item.gross_salary,
    advance:    item.total_advance,
    netPayable: item.net_payable,
    totalHours: item.avg_hours_per_day,
    inTime:     s.in_time  ?? '08:00',
    outTime:    s.out_time ?? '16:00',
    color:      COLORS[idx % COLORS.length],
  }
}

const timesheetData     = reactive([])
const attendanceMap     = reactive({})
const attendanceTimeMap = reactive({})

async function loadTimesheet() {
  loading.value = true
  try {
    const res = await staffApi.getTimesheet({
      month: selectedMonth.value,
      ...(selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}),
    })
    const summary = res?.data?.summary ?? []
    timesheetData.splice(0)
    summary.forEach((item, idx) => timesheetData.push(mapEntry(item, idx)))
    timesheetData.forEach(s => {
      attendanceMap[s.id]     = true
      attendanceTimeMap[s.id] = { in: s.inTime, hours: defaultHours(s) }
    })
  } catch (e) {
    ui.error(e?.message || 'Failed to load timesheet')
  } finally {
    loading.value = false
  }
}

onMounted(loadTimesheet)
watch(selectedMonth, loadTimesheet)
watch(() => selectedStation.selectedStationId, loadTimesheet)

function openMarkAttendance() {
  if (!timesheetData.length) return ui.info('Add staff members first (Staff page) — attendance is marked per staff member.')
  attendanceDate.value = new Date().toISOString().split('T')[0]
  timesheetData.forEach(s => {
    attendanceMap[s.id]     = true
    attendanceTimeMap[s.id] = { in: s.inTime, hours: defaultHours(s) }
  })
  showMark.value = true
}

// ── Attendance History — for everyone, or one staff member ──────────
const showHistory    = ref(false)
const historyMonth   = ref(selectedMonth.value)
const historyStaffId = ref('')

function openHistory(staff = null) {
  historyMonth.value   = selectedMonth.value
  historyStaffId.value = staff?.id ?? ''
  showHistory.value    = true
}

function openEditAttendance(s) {
  editAttData.value = { ...s, shift: ALLOWED_HOURS.includes(Number(s.shift)) ? Number(s.shift) : null }
  showEditAtt.value = true
}

async function saveAttendance() {
  const records = timesheetData.map(s => {
    const present = attendanceMap[s.id]
    const t       = attendanceTimeMap[s.id]
    return {
      staff_id:    s.id,
      status:      present ? 'present' : 'absent',
      in_time:     present ? (t?.in || null) : null,
      out_time:    present ? (outTimeFor(t) || null) : null,
      total_hours: present ? t.hours : null,
    }
  })
  saving.value = true
  try {
    await staffApi.bulkAttendance({ date: attendanceDate.value, records })
    showMark.value = false
    const count = records.filter(r => r.status === 'present').length
    ui.success(`Attendance marked for ${count} staff on ${formatDate(attendanceDate.value)}`)
    await loadTimesheet()
  } catch (e) {
    ui.error(e?.message || 'Failed to save attendance')
  } finally {
    saving.value = false
  }
}

async function saveEditAtt() {
  const d = editAttData.value
  if (!ALLOWED_HOURS.includes(d.shift)) return ui.error('Shift hours must be 8 or 24')
  saving.value = true
  try {
    await staffApi.update(d.id, { shift_hours: d.shift })
    showEditAtt.value = false
    ui.success(`${d.name} updated!`)
    await loadTimesheet()
  } catch (e) {
    ui.error(e?.message || 'Failed to update staff')
  } finally {
    saving.value = false
  }
}

function doExport() {
  const headers = ['Name','Role','Days Present','Days Absent','In Time','Out Time','Hours/Day','Rate/Hour','Gross Salary','Advance','Net Payable','Attendance %']
  const rows = timesheetData.map(s => [
    s.name, s.role, s.daysWorked, daysInMonth.value - s.daysWorked,
    s.inTime, s.outTime, s.totalHours + 'h',
    '₹' + s.ratePerHour, '₹' + fmt(s.salary), '₹' + fmt(s.advance),
    '₹' + fmt(s.netPayable), Math.round(s.daysWorked / daysInMonth.value * 100) + '%'
  ])
  exportCSV('TimeSheet_' + selectedMonth.value, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Name','Role','Days','Absent','In','Out','Hours','Rate','Gross','Adv','Net','Att%']
  const rows = timesheetData.map(s => [
    s.name, s.role, s.daysWorked, daysInMonth.value - s.daysWorked,
    s.inTime, s.outTime, s.totalHours + 'h',
    '₹' + s.ratePerHour, '₹' + fmt(s.salary), '₹' + fmt(s.advance), '₹' + fmt(s.netPayable),
    Math.round(s.daysWorked / daysInMonth.value * 100) + '%'
  ])
  printTable('Attendance Register — ' + monthLabel.value, headers, rows)
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
