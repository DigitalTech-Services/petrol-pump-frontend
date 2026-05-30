<template>
  <div>
    <PageHeader title="Staff & Salary" subtitle="Payroll management — April 2026" :crumbs="['Home','Staff']">
      <template #actions>
        <button class="btn btn-ghost" @click="toggleView">{{ viewMode==='cards' ? '📋 Table' : '🧩 Cards' }}</button>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openAddStaff">＋ Add Staff</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Staff"    :value="staffList.length"                                   icon="👥" color="#f59e0b" sub="Active employees" />
      <KpiCard label="Total Payroll"  :value="'₹'+fmt(staffList.reduce((a,s)=>a+s.workingSalary,0))" icon="💰" color="#ef4444" sub="Working salaries" />
      <KpiCard label="Final Payout"   :value="'₹'+fmt(staffList.reduce((a,s)=>a+Math.max(0,s.finalPayout),0))" icon="✅" color="#10b981" sub="After advances" />
      <KpiCard label="Total Advances" :value="'₹'+fmt(staffList.reduce((a,s)=>a+s.totalAdvance,0))" icon="📤" color="#6366f1" sub="All staff combined" />
    </div>

    <!-- CARD VIEW -->
    <template v-if="viewMode==='cards'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div v-for="s in staffList" :key="s.name"
          class="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
          style="background:#0f1218;border:1px solid #242d3e">
          <div class="h-1" :style="{background:s.color}" />
          <div class="p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[16px] text-white flex-shrink-0"
                :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-display font-bold text-[15px] text-white leading-tight">{{ s.name }}</div>
                <div class="text-[11.5px] text-[#5a6a82]">{{ s.role }}</div>
              </div>
              <div class="flex gap-1">
                <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a6a82] hover:text-[#f59e0b] hover:bg-[#1c2230] transition-all text-[13px]" @click="openEditStaff(s)" title="Edit">✏️</button>
                <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a6a82] hover:text-[#ef4444] hover:bg-[#1c2230] transition-all text-[13px]" @click="openAddAdvance(s)" title="Add Advance">💰</button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid #1c2230">
              <div class="text-center">
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Days</div>
                <div class="font-display font-bold text-[14px] text-white">{{ s.daysWorked }}/30</div>
              </div>
              <div class="text-center">
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Salary</div>
                <div class="font-display font-bold text-[14px] text-positive">₹{{ fmtK(s.workingSalary) }}</div>
              </div>
              <div class="text-center">
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Net</div>
                <div class="font-display font-bold text-[14px]" :style="{color:s.finalPayout<0?'#ef4444':'#f59e0b'}">₹{{ fmtK(s.finalPayout) }}</div>
              </div>
            </div>
            <div class="mt-3">
              <div class="fuel-bar-track"><div class="fuel-bar-fill" :style="{width:Math.max(4,(s.daysWorked/30*100))+'%',background:s.color}" /></div>
              <div class="text-[10px] text-[#5a6a82] mt-1">{{ Math.round(s.daysWorked/30*100) }}% attendance</div>
            </div>
          </div>
        </div>

        <!-- Add New Card -->
        <button @click="openAddStaff"
          class="rounded-xl flex flex-col items-center justify-center gap-3 h-[180px] transition-all hover:border-[#f59e0b] hover:text-[#f59e0b]"
          style="background:#0f1218;border:2px dashed #242d3e;color:#5a6a82">
          <span class="text-3xl">＋</span>
          <span class="font-display font-bold text-[14px]">Add New Staff</span>
        </button>
      </div>
    </template>

    <!-- TABLE VIEW -->
    <template v-else>
      <div class="card mb-6">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Staff Salary Register — April 2026</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Role</th><th>Days</th><th>Rate/Day</th><th>Gross Salary</th><th>Advance</th><th>Final Payout</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s,i) in staffList" :key="s.name">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-white flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-white">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ s.role }}</span></td>
                <td><span class="font-mono-custom">{{ s.daysWorked }}</span><span class="text-[#5a6a82] text-[11px]">/30</span></td>
                <td class="amt text-[#8a9ab5]">₹{{ s.ratePerDay }}</td>
                <td class="amt text-positive font-semibold">₹{{ fmt(s.workingSalary) }}</td>
                <td class="amt text-negative">{{ s.totalAdvance>0?'₹'+fmt(s.totalAdvance):'—' }}</td>
                <td><span class="font-display font-bold text-[15px]" :class="s.finalPayout<0?'text-negative':'text-[#f59e0b]'">₹{{ fmt(s.finalPayout) }}</span></td>
                <td><span class="badge" :class="s.finalPayout<0?'badge-red':'badge-green'">{{ s.finalPayout<0?'Overpaid':'Due' }}</span></td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditStaff(s)">✏️ Edit</button>
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openAddAdvance(s)" style="color:#f59e0b">💰 Adv</button>
                  </div>
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
          <div class="font-display font-bold text-[15px] text-white">Advance Tracker</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Daily advance payments per staff</div>
        </div>
        <button class="btn btn-ghost ml-auto text-[12px]" @click="exportAdvanceCSV">📥 Export</button>
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
                <span v-else class="text-[#2e3a50]">—</span>
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
    <AppModal v-model="showAddStaff" title="Add New Staff Member" subtitle="Fill in employee details" icon="👤" max-width="560px">
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
          <div><label class="field-label">Rate per Day (₹) *</label><input type="number" v-model.number="staffForm.ratePerDay" class="form-input w-full" placeholder="400" /></div>
          <div><label class="field-label">Shift Hours</label>
            <select v-model="staffForm.shiftHours" class="form-select w-full">
              <option value="8">8 Hours</option><option value="10">10 Hours</option>
              <option value="12">12 Hours</option><option value="14">14 Hours</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Days Worked</label><input type="number" max="30" v-model.number="staffForm.daysWorked" class="form-input w-full" placeholder="30" /></div>
          <div>
            <label class="field-label">Calculated Salary</label>
            <div class="p-2.5 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
              <span class="font-display font-bold text-[18px] text-positive">₹{{ fmt((staffForm.ratePerDay||0)*(staffForm.daysWorked||0)) }}</span>
            </div>
          </div>
        </div>
        <div><label class="field-label">Address / Notes</label><textarea v-model="staffForm.notes" class="form-input w-full" rows="2" placeholder="Address, emergency contact, notes…" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAddStaff=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveStaff" :disabled="savingStaff">
            <span v-if="savingStaff" class="animate-spin inline-block mr-1">⟳</span>💾 Save Staff
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT STAFF MODAL ═══ -->
    <AppModal v-model="showEditStaff" title="Edit Staff Member" icon="✏️" max-width="560px">
      <div class="space-y-4" v-if="editStaffData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Full Name</label><input v-model="editStaffData.name" class="form-input w-full" /></div>
          <div><label class="field-label">Role</label>
            <select v-model="editStaffData.role" class="form-select w-full">
              <option>Staff</option><option>Senior Staff</option><option>Manager</option><option>Security</option><option>Part-time</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div><label class="field-label">Days Worked</label><input type="number" max="30" v-model.number="editStaffData.daysWorked" class="form-input w-full" /></div>
          <div><label class="field-label">Rate/Day (₹)</label><input type="number" v-model.number="editStaffData.ratePerDay" class="form-input w-full" /></div>
          <div><label class="field-label">Total Advance (₹)</label><input type="number" v-model.number="editStaffData.totalAdvance" class="form-input w-full" /></div>
        </div>
        <div class="p-3 rounded-lg flex justify-between" style="background:#161b24;border:1px solid #1c2230">
          <span class="text-[#8a9ab5]">Calculated Salary</span>
          <span class="font-display font-bold text-[16px] text-positive">₹{{ fmt((editStaffData.ratePerDay||0)*(editStaffData.daysWorked||0)) }}</span>
        </div>
        <div class="p-3 rounded-lg flex justify-between" style="background:#161b24;border:1px solid #1c2230">
          <span class="text-[#8a9ab5]">Net Payable</span>
          <span class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt((editStaffData.ratePerDay||0)*(editStaffData.daysWorked||0)-(editStaffData.totalAdvance||0)) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEditStaff=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEditStaff">💾 Update</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ ADD ADVANCE MODAL ═══ -->
    <AppModal v-model="showAdvance" :title="'Add Advance — '+(advanceTarget?.name||'')" icon="💰" max-width="420px">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-lg mb-2" style="background:#161b24;border:1px solid #1c2230">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-white"
            :style="{background:advanceTarget?.color}">{{ advanceTarget?.name?.slice(0,2).toUpperCase() }}</div>
          <div>
            <div class="font-display font-bold text-[15px] text-white">{{ advanceTarget?.name }}</div>
            <div class="text-[12px] text-[#5a6a82]">Current advance: ₹{{ fmt(advanceTarget?.totalAdvance||0) }}</div>
          </div>
        </div>
        <div><label class="field-label">Date *</label><input type="date" v-model="advanceForm.date" class="form-input w-full" /></div>
        <div><label class="field-label">Amount (₹) *</label><input type="number" v-model.number="advanceForm.amount" class="form-input w-full" placeholder="0" /></div>
        <div><label class="field-label">Reason</label><input v-model="advanceForm.reason" class="form-input w-full" placeholder="Personal, medical, travel…" /></div>
        <div v-if="advanceForm.amount" class="p-3 rounded-lg" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
          <span class="text-[12px] text-[#8a9ab5]">New total advance will be: </span>
          <span class="font-display font-bold text-[15px] text-negative">₹{{ fmt((advanceTarget?.totalAdvance||0)+(advanceForm.amount||0)) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdvance=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveAdvance">💾 Record Advance</button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const viewMode = ref('cards')
const toggleView = () => viewMode.value = viewMode.value === 'cards' ? 'table' : 'cards'

// Modal states
const showAddStaff  = ref(false)
const showEditStaff = ref(false)
const showAdvance   = ref(false)
const savingStaff   = ref(false)
const editStaffData = ref(null)
const advanceTarget = ref(null)

const staffForm = reactive({ name:'', role:'Staff', phone:'', joinDate:'', ratePerDay:400, shiftHours:'8', daysWorked:30, notes:'' })
const advanceForm = reactive({ date:'', amount:null, reason:'' })

const fmtK = n => Math.abs(n)>=1000 ? (n/1000).toFixed(1)+'K' : String(n)

const staffList = reactive([
  {name:'Ajay',     role:'Senior Staff', daysWorked:30, ratePerDay:500, workingSalary:15000, totalAdvance:6880,  finalPayout:8120,  color:'#f59e0b'},
  {name:'Santosh',  role:'Senior Staff', daysWorked:27, ratePerDay:800, workingSalary:21600, totalAdvance:25719, finalPayout:-4119, color:'#ef4444'},
  {name:'Ayaz',     role:'Staff',        daysWorked:30, ratePerDay:400, workingSalary:12000, totalAdvance:1094,  finalPayout:10906, color:'#10b981'},
  {name:'Rizwan',   role:'Staff',        daysWorked:30, ratePerDay:400, workingSalary:12000, totalAdvance:1517,  finalPayout:10483, color:'#3b82f6'},
  {name:'Rehan',    role:'Part-time',    daysWorked:8,  ratePerDay:458, workingSalary:3666,  totalAdvance:656,   finalPayout:3010,  color:'#8b5cf6'},
  {name:'Kartik',   role:'Staff',        daysWorked:26, ratePerDay:410, workingSalary:10666, totalAdvance:2415,  finalPayout:8251,  color:'#06b6d4'},
  {name:'Komal',    role:'Staff',        daysWorked:20, ratePerDay:333, workingSalary:6666,  totalAdvance:725,   finalPayout:5941,  color:'#f97316'},
  {name:'Tanmay',   role:'Staff',        daysWorked:15, ratePerDay:316, workingSalary:4750,  totalAdvance:574,   finalPayout:4176,  color:'#84cc16'},
  {name:'Vanshika', role:'Staff',        daysWorked:16, ratePerDay:316, workingSalary:5066,  totalAdvance:630,   finalPayout:4436,  color:'#ec4899'},
  {name:'Sahil P',  role:'Petrol',       daysWorked:6,  ratePerDay:366, workingSalary:2200,  totalAdvance:675,   finalPayout:1525,  color:'#f59e0b'},
  {name:'Sahil A',  role:'Air Machine',  daysWorked:24, ratePerDay:400, workingSalary:9600,  totalAdvance:0,     finalPayout:9600,  color:'#14b8a6'},
  {name:'Shaikh',   role:'Manager',      daysWorked:30, ratePerDay:833, workingSalary:25000, totalAdvance:0,     finalPayout:25000, color:'#6366f1'},
  {name:'Dhanu',    role:'Security',     daysWorked:30, ratePerDay:500, workingSalary:15000, totalAdvance:0,     finalPayout:15000, color:'#78716c'},
])

function openAddStaff() {
  Object.assign(staffForm, {name:'',role:'Staff',phone:'',joinDate:'',ratePerDay:400,shiftHours:'8',daysWorked:30,notes:''})
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
  if (!staffForm.name || !staffForm.ratePerDay) { ui.error('Name and rate are required'); return }
  savingStaff.value = true
  await new Promise(r => setTimeout(r, 500))
  const salary = staffForm.ratePerDay * staffForm.daysWorked
  const colors = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#ec4899']
  staffList.push({
    name: staffForm.name, role: staffForm.role, daysWorked: staffForm.daysWorked,
    ratePerDay: staffForm.ratePerDay, workingSalary: salary, totalAdvance: 0,
    finalPayout: salary, color: colors[staffList.length % colors.length]
  })
  savingStaff.value = false
  showAddStaff.value = false
  ui.success(`${staffForm.name} added successfully!`)
}

function saveEditStaff() {
  const i = staffList.findIndex(s => s.name === editStaffData.value.name)
  if (i !== -1) {
    const s = editStaffData.value
    s.workingSalary = s.ratePerDay * s.daysWorked
    s.finalPayout   = s.workingSalary - s.totalAdvance
    staffList[i] = {...s}
  }
  showEditStaff.value = false
  ui.success('Staff updated!')
}

function saveAdvance() {
  if (!advanceForm.amount) { ui.error('Enter advance amount'); return }
  const s = staffList.find(x => x.name === advanceTarget.value.name)
  if (s) {
    s.totalAdvance += advanceForm.amount
    s.finalPayout   = s.workingSalary - s.totalAdvance
    const row = advanceRows.find(r => r.date === advanceForm.date)
    if (row) row[s.name] = (row[s.name]||0) + advanceForm.amount
    else advanceRows.push({ date: advanceForm.date, [s.name]: advanceForm.amount })
  }
  showAdvance.value = false
  ui.success(`Advance of ₹${fmt(advanceForm.amount)} recorded for ${advanceTarget.value.name}`)
}

function doExport() {
  const headers = ['Name','Role','Days','Rate/Day','Gross Salary','Advance','Final Payout']
  const rows = staffList.map(s => [s.name, s.role, s.daysWorked, s.ratePerDay, s.workingSalary, s.totalAdvance, s.finalPayout])
  exportCSV('Staff_Salary_April2026', headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Name','Role','Days','Rate/Day','Gross','Advance','Net Payout']
  const rows = staffList.map(s => [s.name, s.role, s.daysWorked, '₹'+s.ratePerDay, '₹'+fmt(s.workingSalary), '₹'+fmt(s.totalAdvance), '₹'+fmt(s.finalPayout)])
  printTable('Staff Salary Register — April 2026', headers, rows)
}

function exportAdvanceCSV() {
  const headers = ['Date', ...advanceNames, 'Day Total']
  const rows = advanceRows.map(r => [r.date, ...advanceNames.map(n => r[n]||0), advanceNames.reduce((a,n)=>a+(r[n]||0),0)])
  exportCSV('Advance_Tracker_April2026', headers, rows)
  ui.success('Advance CSV exported!')
}

const advanceNames = ['Ajay','Santosh','Ayaz','Rizwan','Rehan','Kartik','Komal','Tanmay','Vanshika']
const advanceRows = reactive([
  {date:'01 Apr',Ajay:0,Santosh:0,    Ayaz:0,  Rizwan:0,  Rehan:104,Kartik:258,Komal:0,  Tanmay:244,Vanshika:0},
  {date:'02 Apr',Ajay:0,Santosh:1039, Ayaz:0,  Rizwan:43, Rehan:0,  Kartik:531,Komal:0,  Tanmay:0,  Vanshika:0},
  {date:'03 Apr',Ajay:0,Santosh:2700, Ayaz:0,  Rizwan:0,  Rehan:0,  Kartik:0,  Komal:0,  Tanmay:0,  Vanshika:0},
  {date:'04 Apr',Ajay:100,Santosh:700,Ayaz:500,Rizwan:0,  Rehan:498,Kartik:43, Komal:0,  Tanmay:0,  Vanshika:116},
  {date:'05 Apr',Ajay:0,Santosh:474,  Ayaz:0,  Rizwan:0,  Rehan:54, Kartik:0,  Komal:0,  Tanmay:0,  Vanshika:0},
  {date:'06 Apr',Ajay:0,Santosh:0,    Ayaz:0,  Rizwan:0,  Rehan:0,  Kartik:157,Komal:88, Tanmay:0,  Vanshika:0},
  {date:'07 Apr',Ajay:0,Santosh:0,    Ayaz:0,  Rizwan:52, Rehan:0,  Kartik:0,  Komal:200,Tanmay:0,  Vanshika:0},
  {date:'08 Apr',Ajay:0,Santosh:1220, Ayaz:0,  Rizwan:79, Rehan:0,  Kartik:0,  Komal:0,  Tanmay:74, Vanshika:0},
  {date:'09 Apr',Ajay:0,Santosh:6000, Ayaz:0,  Rizwan:0,  Rehan:0,  Kartik:103,Komal:100,Tanmay:0,  Vanshika:0},
  {date:'10 Apr',Ajay:0,Santosh:0,    Ayaz:0,  Rizwan:76, Rehan:0,  Kartik:0,  Komal:0,  Tanmay:93, Vanshika:0},
  {date:'20 Apr',Ajay:500,Santosh:0,  Ayaz:0,  Rizwan:0,  Rehan:0,  Kartik:44, Komal:0,  Tanmay:0,  Vanshika:313},
  {date:'24 Apr',Ajay:6000,Santosh:10000,Ayaz:0,Rizwan:90,Rehan:0, Kartik:0,  Komal:0,  Tanmay:0,  Vanshika:0},
  {date:'29 Apr',Ajay:50,Santosh:354, Ayaz:0,  Rizwan:74, Rehan:0,  Kartik:60, Komal:268,Tanmay:0,  Vanshika:0},
])
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
