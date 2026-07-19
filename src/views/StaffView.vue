<template>
  <div>
    <PageHeader title="Staff & Salary" :subtitle="`Payroll management — ${monthLabel}`" :crumbs="['Home','Staff']">
      <template #actions>
        <input type="month" v-model="selectedMonth" class="form-input" />
        <button class="btn btn-ghost flex items-center gap-1.5" @click="toggleView">
          <component :is="viewMode==='cards' ? List : LayoutGrid" :size="14" />
          {{ viewMode==='cards' ? 'Table' : 'Cards' }}
        </button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button v-if="auth.canWrite" class="btn btn-primary flex items-center gap-1.5" @click="openAddStaff"><Plus :size="14" /> Add Staff</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Staff"    :value="staffList.length"                                   :icon="Users"        color="#f59e0b" sub="Active employees" />
      <KpiCard label="Total Payroll"  :value="'₹'+fmt(staffList.reduce((a,s)=>a+s.workingSalary,0))" :icon="Banknote"  color="#ef4444" sub="Working salaries" />
      <KpiCard label="Final Payout"   :value="'₹'+fmt(staffList.reduce((a,s)=>a+Math.max(0,s.finalPayout),0))" :icon="CheckCircle2" color="#10b981" sub="After advances" />
      <KpiCard label="Total Advances" :value="'₹'+fmt(staffList.reduce((a,s)=>a+s.totalAdvance,0))" :icon="Upload"    color="#6366f1" sub="All staff combined" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-[var(--text-3)]">
      <RotateCw :size="22" class="animate-spin mr-3" /> Loading staff…
    </div>

    <!-- CARD VIEW -->
    <template v-if="!loading && viewMode==='cards'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div v-for="s in staffList" :key="s.id"
          class="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
          style="background:var(--bg-2);border:1px solid var(--border)">
          <div class="h-1" :style="{background:s.color}" />
          <div class="p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[16px] text-[var(--text)] flex-shrink-0"
                :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-display font-bold text-[15px] text-[var(--text)] leading-tight">{{ s.name }}</div>
                <div class="text-[11.5px] text-[var(--text-3)]">{{ s.role }}</div>
              </div>
              <div v-if="auth.canWrite" class="flex gap-1">
                <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[#f59e0b] hover:bg-[var(--bg-4)] transition-all" @click="openEditStaff(s)" title="Edit"><Pencil :size="13" /></button>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[#f59e0b] hover:bg-[var(--bg-4)] transition-all" @click="openAddAdvance(s)" title="Add Advance"><Banknote :size="13" /></button>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[#ef4444] hover:bg-[var(--bg-4)] transition-all" @click="deleteStaff(s)" title="Delete"><Trash2 :size="13" /></button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid var(--bg-4)">
              <div class="text-center">
                <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Hours</div>
                <div class="font-display font-bold text-[14px] text-[var(--text)]">{{ fmt(s.hoursWorked, 0) }}h</div>
              </div>
              <div class="text-center">
                <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Salary</div>
                <div class="font-display font-bold text-[14px] text-positive">₹{{ fmtK(s.workingSalary) }}</div>
              </div>
              <div class="text-center">
                <div class="text-[9.5px] text-[var(--text-3)] uppercase tracking-wide mb-1">Net</div>
                <div class="font-display font-bold text-[14px]" :style="{color:s.finalPayout<0?'#ef4444':'#f59e0b'}">₹{{ fmtK(s.finalPayout) }}</div>
              </div>
            </div>
            <div class="mt-3 text-[10px] text-[var(--text-3)]">₹{{ s.ratePerHour }}/hr — {{ monthLabel }}</div>
          </div>
        </div>

        <!-- Add New Card -->
        <button v-if="auth.canWrite" @click="openAddStaff"
          class="rounded-xl flex flex-col items-center justify-center gap-3 h-[180px] transition-all hover:border-[#f59e0b] hover:text-[#f59e0b]"
          style="background:var(--bg-2);border:2px dashed var(--border);color:var(--text-3)">
          <Plus :size="28" />
          <span class="font-display font-bold text-[14px]">Add New Staff</span>
        </button>
      </div>
    </template>

    <!-- TABLE VIEW -->
    <template v-if="!loading && viewMode==='table'">
      <div class="card mb-6">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Staff Salary Register — {{ monthLabel }}</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Role</th><th>Hours</th><th>Rate/Hour</th><th>Gross Salary</th><th>Advance</th><th>Final Payout</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s,i) in staffList" :key="s.id">
                <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i+1 }}</td>
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-[var(--text)] flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-[var(--text)]">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ s.role }}</span></td>
                <td><span class="font-mono-custom">{{ fmt(s.hoursWorked, 0) }}</span><span class="text-[var(--text-3)] text-[11px]">h</span></td>
                <td class="amt text-[var(--text-2)]">₹{{ s.ratePerHour }}</td>
                <td class="amt text-positive font-semibold">₹{{ fmt(s.workingSalary) }}</td>
                <td class="amt text-negative">{{ s.totalAdvance>0?'₹'+fmt(s.totalAdvance):'—' }}</td>
                <td><span class="font-display font-bold text-[15px]" :class="s.finalPayout<0?'text-negative':'text-[#f59e0b]'">₹{{ fmt(s.finalPayout) }}</span></td>
                <td><span class="badge" :class="s.finalPayout<0?'badge-red':'badge-green'">{{ s.finalPayout<0?'Overpaid':'Due' }}</span></td>
                <td>
                  <div v-if="auth.canWrite" class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditStaff(s)"><Pencil :size="11" /> Edit</button>
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openAddAdvance(s)" style="color:#f59e0b"><Banknote :size="11" /> Adv</button>
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="deleteStaff(s)" style="color:#ef4444"><Trash2 :size="11" /></button>
                  </div>
                  <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">TOTAL ({{ staffList.length }} staff)</td>
                <td>₹{{ fmt(staffList.reduce((a,s)=>a+s.workingSalary,0)) }}</td>
                <td>₹{{ fmt(staffList.reduce((a,s)=>a+s.totalAdvance,0)) }}</td>
                <td>₹{{ fmt(staffList.reduce((a,s)=>a+s.finalPayout,0)) }}</td>
                <td colspan="2">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- Advance Tracker -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Advance Tracker</div>
          <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Daily advance payments per staff</div>
        </div>
        <button class="btn btn-ghost ml-auto text-[12px] flex items-center gap-1.5" @click="exportAdvanceCSV"><Download :size="13" /> Export</button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th v-for="n in advanceNames" :key="n">{{ n }}</th>
              <th>Day Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in advanceRows" :key="row.date">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ row.date }}</span></td>
              <td v-for="n in advanceNames" :key="n">
                <span v-if="row[n]>0" class="badge badge-red text-[11px]">₹{{ fmt(row[n]) }}</span>
                <span v-else class="text-[var(--border-2)]">—</span>
              </td>
              <td class="amt text-[#f59e0b] font-semibold">{{ fmt(advanceNames.reduce((a,n)=>a+(row[n]||0),0)) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL</td>
              <td v-for="n in advanceNames" :key="n">{{ fmt(advanceRows.reduce((a,r)=>a+(r[n]||0),0)) }}</td>
              <td>{{ fmt(advanceRows.reduce((a,r)=>a+advanceNames.reduce((b,n)=>b+(r[n]||0),0),0)) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD STAFF MODAL ═══ -->
    <AppModal v-model="showAddStaff" title="Add New Staff Member" subtitle="Fill in employee details" :icon="User" max-width="560px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Full Name *</label><input v-model="staffForm.name" class="form-input w-full" placeholder="Employee name" /></div>
          <div><label class="field-label">Role *</label>
            <select v-model="staffForm.role" class="form-select w-full">
              <option>Staff</option><option>Senior Staff</option><option>Manager</option>
              <option>Security</option><option>Part-time</option><option>Air Machine</option><option>Petrol</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Phone</label><input v-model="staffForm.phone" class="form-input w-full" placeholder="+91 98765 43210" /></div>
          <div><label class="field-label">Join Date</label><input type="date" v-model="staffForm.joinDate" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Monthly Salary (₹) *</label><input type="number" v-model.number="staffForm.monthlySalary" class="form-input w-full" placeholder="15000" /></div>
          <div><label class="field-label">Shift Hours</label>
            <select v-model="staffForm.shiftHours" class="form-select w-full">
              <option value="8">8 Hours</option><option value="10">10 Hours</option>
              <option value="12">12 Hours</option><option value="14">14 Hours</option>
            </select>
          </div>
        </div>
        <div class="text-[11.5px] text-[var(--text-3)] px-1">
          Hourly rate is calculated automatically — Monthly Salary ÷ days in the month ÷ shift hours (e.g. ₹15,000 ÷ 31 ÷ 8 ≈ ₹{{ previewRatePerHour }}/hr) — then multiplied by hours present each day for salary.
        </div>
        <div><label class="field-label">Address / Notes</label><textarea v-model="staffForm.notes" class="form-input w-full" rows="2" placeholder="Address, emergency contact, notes…" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAddStaff=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveStaff" :disabled="savingStaff">
            <RotateCw v-if="savingStaff" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Staff
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT STAFF MODAL ═══ -->
    <AppModal v-model="showEditStaff" title="Edit Staff Member" :icon="Pencil" max-width="560px">
      <div class="space-y-4" v-if="editStaffData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Full Name</label><input v-model="editStaffData.name" class="form-input w-full" /></div>
          <div><label class="field-label">Role</label>
            <select v-model="editStaffData.role" class="form-select w-full">
              <option>Staff</option><option>Senior Staff</option><option>Manager</option><option>Security</option><option>Part-time</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Monthly Salary (₹)</label><input type="number" v-model.number="editStaffData.monthlySalary" class="form-input w-full" /></div>
          <div><label class="field-label">Shift Hours</label>
            <select v-model="editStaffData.shiftHours" class="form-select w-full">
              <option value="8">8 Hours</option><option value="10">10 Hours</option>
              <option value="12">12 Hours</option><option value="14">14 Hours</option>
            </select>
          </div>
        </div>
        <div class="text-[11.5px] text-[var(--text-3)] px-1">
          This only affects hours logged from now on — {{ monthLabel }}'s already-logged hours keep the rate that was in effect when they were recorded.
        </div>
        <div class="p-3 rounded-lg flex justify-between" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <span class="text-[var(--text-2)]">{{ monthLabel }} Gross Salary</span>
          <span class="font-display font-bold text-[16px] text-positive">₹{{ fmt(editStaffData.workingSalary||0) }}</span>
        </div>
        <div class="p-3 rounded-lg flex justify-between" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <span class="text-[var(--text-2)]">Net Payable</span>
          <span class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt(editStaffData.finalPayout||0) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEditStaff=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEditStaff"><Save :size="14" /> Update</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ ADD ADVANCE MODAL ═══ -->
    <AppModal v-model="showAdvance" :title="'Add Advance — '+(advanceTarget?.name||'')" :icon="Banknote" max-width="420px">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-lg mb-2" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-[var(--text)]"
            :style="{background:advanceTarget?.color}">{{ advanceTarget?.name?.slice(0,2).toUpperCase() }}</div>
          <div>
            <div class="font-display font-bold text-[15px] text-[var(--text)]">{{ advanceTarget?.name }}</div>
            <div class="text-[12px] text-[var(--text-3)]">Current advance: ₹{{ fmt(advanceTarget?.totalAdvance||0) }}</div>
          </div>
        </div>
        <div><label class="field-label">Date *</label><input type="date" v-model="advanceForm.date" class="form-input w-full" /></div>
        <div><label class="field-label">Amount (₹) *</label><input type="number" v-model.number="advanceForm.amount" class="form-input w-full" placeholder="0" /></div>
        <div><label class="field-label">Reason</label><input v-model="advanceForm.reason" class="form-input w-full" placeholder="Personal, medical, travel…" /></div>
        <div v-if="advanceForm.amount" class="p-3 rounded-lg" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
          <span class="text-[12px] text-[var(--text-2)]">New total advance will be: </span>
          <span class="font-display font-bold text-[15px] text-negative">₹{{ fmt((advanceTarget?.totalAdvance||0)+(advanceForm.amount||0)) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdvance=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveAdvance"><Save :size="14" /> Record Advance</button>
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
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { staffApi } from '@/services/api'
import {
  Users, Banknote, CheckCircle2, Upload, RotateCw, Save,
  Pencil, Trash2, Plus, Download, Printer, List, LayoutGrid, User
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()
const viewMode = ref('cards')
const loading  = ref(false)
const toggleView = () => viewMode.value = viewMode.value === 'cards' ? 'table' : 'cards'

// Modal states
const showAddStaff  = ref(false)
const showEditStaff = ref(false)
const showAdvance   = ref(false)
const savingStaff   = ref(false)
const editStaffData = ref(null)
const advanceTarget = ref(null)

const staffForm = reactive({ name:'', role:'Staff', phone:'', joinDate:'', monthlySalary:15000, shiftHours:'8', notes:'' })
const advanceForm = reactive({ date:'', amount:null, reason:'' })

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const monthLabel = computed(() => {
  const [y, m] = selectedMonth.value.split('-')
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

const fmtK = n => Math.abs(n)>=1000 ? (n/1000).toFixed(1)+'K' : String(n)

// Live preview of the hourly rate the backend will derive: salary ÷ days in the
// reference month (join date if set, else current month) ÷ shift hours.
const previewRatePerHour = computed(() => {
  const salary = Number(staffForm.monthlySalary) || 0
  const hours  = Number(staffForm.shiftHours) || 8
  const ref    = staffForm.joinDate ? new Date(staffForm.joinDate) : new Date()
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  return daysInMonth > 0 && hours > 0 ? (salary / daysInMonth / hours).toFixed(2) : '0.00'
})

const COLORS = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f97316','#84cc16','#14b8a6','#6366f1','#78716c']

const staffList   = reactive([])
const allAdvances = reactive([]) // raw advances from API for the tracker table

// Derive advance-tracker columns from loaded advances
const advanceNames = computed(() => [...new Set(allAdvances.map(a => a.staff?.name).filter(Boolean))])

// Build pivot rows: { date: '01 Apr', Name1: amount, Name2: amount, … }
const advanceRows = computed(() => {
  const byDate = {}
  for (const adv of allAdvances) {
    if (!adv.staff?.name) continue
    const d = new Date(adv.date)
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    if (!byDate[key]) byDate[key] = { date: key }
    byDate[key][adv.staff.name] = (byDate[key][adv.staff.name] || 0) + adv.amount
  }
  return Object.values(byDate)
})

function mapStaff(s) {
  return {
    id:           s.id,
    name:         s.name,
    role:         s.role,
    phone:        s.phone,
    joinDate:     s.join_date,
    hoursWorked:  s.hours_worked ?? 0,
    ratePerHour:  s.rate_per_hour,
    monthlySalary:s.monthly_salary ?? 0,
    shiftHours:   String(s.shift_hours ?? 8),
    workingSalary:s.working_salary ?? 0,
    totalAdvance: s.total_advance ?? 0,
    finalPayout:  s.final_payout  ?? ((s.working_salary ?? 0) - (s.total_advance ?? 0)),
    notes:        s.notes,
    color:        COLORS[s.id % COLORS.length],
  }
}

// Returns the first validation error message, or null if the form is valid.
function validateStaffForm(form) {
  if (!form.name || !form.name.trim()) return 'Name is required'
  if (form.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!form.role) return 'Role is required'
  if (form.phone && form.phone.trim()) {
    const digits = form.phone.replace(/[^0-9]/g, '')
    if (digits.length < 10 || digits.length > 13) return 'Enter a valid phone number'
  }
  if (form.joinDate && isNaN(new Date(form.joinDate).getTime())) return 'Enter a valid join date'
  if (!form.monthlySalary || Number(form.monthlySalary) <= 0) return 'Monthly salary must be greater than 0'
  if (!form.shiftHours || Number(form.shiftHours) < 1 || Number(form.shiftHours) > 24) return 'Shift hours must be between 1 and 24'
  return null
}

function stationParam() {
  return selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}
}

async function loadStaff() {
  loading.value = true
  try {
    const res = await staffApi.getAll({ month: selectedMonth.value, ...stationParam() })
    staffList.splice(0)
    ;(res.data?.staff ?? []).forEach(s => staffList.push(mapStaff(s)))
  } catch (e) {
    ui.error(e.message || 'Failed to load staff')
  } finally {
    loading.value = false
  }
}

async function loadAdvances() {
  try {
    const res = await staffApi.getAdvances({ month: selectedMonth.value, ...stationParam() })
    allAdvances.splice(0)
    ;(res.data?.advances ?? []).forEach(a => allAdvances.push(a))
  } catch { /* non-critical */ }
}

function loadAll() { loadStaff(); loadAdvances() }

onMounted(loadAll)
watch(selectedMonth, loadAll)
watch(() => selectedStation.selectedStationId, loadAll)

function openAddStaff() {
  Object.assign(staffForm, {name:'',role:'Staff',phone:'',joinDate:'',monthlySalary:15000,shiftHours:'8',notes:''})
  showAddStaff.value = true
}
function openEditStaff(s) { editStaffData.value = {...s}; showEditStaff.value = true }
function openAddAdvance(s) {
  advanceTarget.value = s
  advanceForm.date = new Date().toISOString().split('T')[0]
  advanceForm.amount = null
  advanceForm.reason = ''
  showAdvance.value = true
}

async function saveStaff() {
  const validationError = validateStaffForm(staffForm)
  if (validationError) { ui.error(validationError); return }
  savingStaff.value = true
  try {
    const res = await staffApi.create({
      name:           staffForm.name.trim(),
      role:           staffForm.role,
      phone:          staffForm.phone || null,
      join_date:      staffForm.joinDate || null,
      monthly_salary: staffForm.monthlySalary,
      shift_hours:    Number(staffForm.shiftHours),
      notes:          staffForm.notes || null,
    })
    staffList.push(mapStaff(res.data.staff))
    showAddStaff.value = false
    ui.success(`${staffForm.name} added successfully!`)
  } catch (e) {
    ui.error(e.message || 'Failed to add staff')
  } finally {
    savingStaff.value = false
  }
}

async function saveEditStaff() {
  if (!editStaffData.value) return
  const s = editStaffData.value
  if (!s.name || !s.name.trim()) { ui.error('Name is required'); return }
  if (!s.monthlySalary || Number(s.monthlySalary) <= 0) { ui.error('Monthly salary must be greater than 0'); return }
  try {
    await staffApi.update(s.id, {
      name:           s.name.trim(),
      role:           s.role,
      monthly_salary: s.monthlySalary,
      shift_hours:    Number(s.shiftHours),
    })
    // Reload rather than splice in the response — the backend computes gross
    // salary for its own default month, which may not match selectedMonth.
    await loadStaff()
    showEditStaff.value = false
    ui.success('Staff updated!')
  } catch (e) {
    ui.error(e.message || 'Failed to update staff')
  }
}

async function deleteStaff(s) {
  if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return
  try {
    await staffApi.delete(s.id)
    const i = staffList.findIndex(x => x.id === s.id)
    if (i !== -1) staffList.splice(i, 1)
    ui.success(`${s.name} removed.`)
  } catch (e) {
    ui.error(e.message || 'Failed to delete staff')
  }
}

async function saveAdvance() {
  if (!advanceForm.amount) { ui.error('Enter advance amount'); return }
  try {
    const res = await staffApi.addAdvance({
      staff_id: advanceTarget.value.id,
      date:     advanceForm.date,
      amount:   advanceForm.amount,
      reason:   advanceForm.reason || null,
    })
    // Update in-memory staff totals
    const s = staffList.find(x => x.id === advanceTarget.value.id)
    if (s) {
      s.totalAdvance += advanceForm.amount
      s.finalPayout   = s.workingSalary - s.totalAdvance
    }
    // Append to advance tracker
    const adv = res.data?.advance
    if (adv) allAdvances.push(adv)
    showAdvance.value = false
    ui.success(`Advance of ₹${fmt(advanceForm.amount)} recorded for ${advanceTarget.value.name}`)
  } catch (e) {
    ui.error(e.message || 'Failed to record advance')
  }
}

function doExport() {
  const headers = ['Name','Role','Hours','Rate/Hour','Gross Salary','Advance','Final Payout']
  const rows = staffList.map(s => [s.name, s.role, s.hoursWorked, s.ratePerHour, s.workingSalary, s.totalAdvance, s.finalPayout])
  exportCSV(`Staff_Salary_${selectedMonth.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Name','Role','Hours','Rate/Hour','Gross','Advance','Net Payout']
  const rows = staffList.map(s => [s.name, s.role, s.hoursWorked, '₹'+s.ratePerHour, '₹'+fmt(s.workingSalary), '₹'+fmt(s.totalAdvance), '₹'+fmt(s.finalPayout)])
  printTable(`Staff Salary Register — ${monthLabel.value}`, headers, rows)
}

function exportAdvanceCSV() {
  const names = advanceNames.value
  const headers = ['Date', ...names, 'Day Total']
  const rows = advanceRows.value.map(r => [r.date, ...names.map(n => r[n]||0), names.reduce((a,n)=>a+(r[n]||0),0)])
  exportCSV('Advance_Tracker', headers, rows)
  ui.success('Advance CSV exported!')
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
