<template>
  <div>
    <PageHeader title="Time Sheet" subtitle="Staff attendance & working hours — April 2026" :crumbs="['Home','Time Sheet']">
      <template #actions>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openMarkAttendance">✅ Mark Attendance</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Staff"     :value="timesheetData.length"                                   icon="👥" color="#f59e0b" sub="Active this month"/>
      <KpiCard label="Total Man-Days"  :value="timesheetData.reduce((a,s)=>a+s.daysWorked,0)"          icon="📅" color="#10b981" sub="Combined attendance"/>
      <KpiCard label="Avg Attendance"  :value="Math.round(timesheetData.reduce((a,s)=>a+s.daysWorked,0)/timesheetData.length)+' days'" icon="📊" color="#3b82f6" sub="Per person"/>
      <KpiCard label="Full Attendance" :value="timesheetData.filter(s=>s.daysWorked===30).length+' Staff'" icon="🏆" color="#6366f1" sub="30/30 days"/>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div v-for="s in timesheetData" :key="s.name"
        class="rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
        style="background:#0f1218;border:1px solid #242d3e"
        @click="openEditAttendance(s)">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-white flex-shrink-0" :style="{background:s.color}">
            {{ s.name.slice(0,2).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-display font-bold text-[15px] text-white">{{ s.name }}</div>
            <div class="text-[11.5px] text-[#5a6a82]">{{ s.role }}</div>
          </div>
          <div class="text-right">
            <div class="font-display font-bold text-[22px]" :style="{color:s.color}">{{ s.daysWorked }}</div>
            <div class="text-[10px] text-[#5a6a82]">/ 30 days</div>
          </div>
        </div>
        <div class="mb-3">
          <div class="fuel-bar-track">
            <div class="fuel-bar-fill" :style="{width:(s.daysWorked/30*100)+'%',background:s.color}" />
          </div>
          <div class="flex justify-between text-[10.5px] text-[#5a6a82] mt-1">
            <span>{{ Math.round(s.daysWorked/30*100) }}% attendance</span>
            <span>{{ 30-s.daysWorked }} absent</span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid #1c2230">
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Shift</div>
            <div class="font-display font-bold text-[13px] text-white">{{ s.shift }}h</div>
          </div>
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Rate</div>
            <div class="font-display font-bold text-[13px] text-[#f59e0b]">₹{{ s.ratePerDay }}</div>
          </div>
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Salary</div>
            <div class="font-display font-bold text-[13px] text-positive">₹{{ fmtK(s.salary) }}</div>
          </div>
        </div>
        <div class="mt-3 text-center text-[10.5px] text-[#5a6a82] hover:text-[#f59e0b] transition-colors">✏️ Click to edit attendance</div>
      </div>
    </div>

    <!-- Full Register Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">Attendance Register — April 2026</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Complete shift & salary register</div>
        </div>
        <button class="btn btn-ghost ml-auto text-[12px]" @click="doPrint">🖨 Print Register</button>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Employee</th><th>Role</th><th>Days Present</th><th>Days Absent</th><th>Shift</th><th>Rate/Day</th><th>Gross Salary</th><th>Advance</th><th>Net Payable</th><th>Attendance %</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="(s,i) in timesheetData" :key="s.name">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
              <td>
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-white flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
                  <span class="font-medium text-white">{{ s.name }}</span>
                </div>
              </td>
              <td><span class="badge badge-gray">{{ s.role }}</span></td>
              <td><span class="font-display font-bold text-[15px] text-positive">{{ s.daysWorked }}</span> <span class="text-[#5a6a82] text-[11px]">days</span></td>
              <td><span class="font-display font-bold text-[15px]" :class="(30-s.daysWorked)>5?'text-negative':'text-[#5a6a82]'">{{ 30-s.daysWorked }}</span></td>
              <td class="amt text-[#8a9ab5]">{{ s.shift }}h</td>
              <td class="amt text-[#8a9ab5]">₹{{ s.ratePerDay }}</td>
              <td class="amt text-positive font-semibold">₹{{ fmt(s.salary) }}</td>
              <td class="amt text-negative">{{ s.advance>0?'₹'+fmt(s.advance):'—' }}</td>
              <td><span class="font-display font-bold text-[15px]" :class="s.netPayable<0?'text-negative':'text-[#f59e0b]'">₹{{ fmt(s.netPayable) }}</span></td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="flex-1 fuel-bar-track" style="min-width:50px">
                    <div class="fuel-bar-fill" :style="{width:(s.daysWorked/30*100)+'%',background:s.color}" />
                  </div>
                  <span class="text-[11px] text-[#8a9ab5]">{{ Math.round(s.daysWorked/30*100) }}%</span>
                </div>
              </td>
              <td>
                <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditAttendance(s)">✏️ Edit</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL ({{ timesheetData.length }} employees)</td>
              <td>{{ timesheetData.reduce((a,s)=>a+s.daysWorked,0) }} days</td>
              <td>{{ timesheetData.reduce((a,s)=>a+(30-s.daysWorked),0) }}</td>
              <td colspan="2">—</td>
              <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.salary,0)) }}</td>
              <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.advance,0)) }}</td>
              <td>₹{{ fmt(timesheetData.reduce((a,s)=>a+s.netPayable,0)) }}</td>
              <td colspan="2">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ MARK ATTENDANCE MODAL ═══ -->
    <AppModal v-model="showMark" title="Mark Attendance" subtitle="Record today's staff attendance" icon="✅" max-width="560px">
      <div class="mb-4">
        <label class="field-label">Attendance Date *</label>
        <input type="date" v-model="attendanceDate" class="form-input w-full" />
      </div>
      <div class="space-y-2">
        <div v-for="s in timesheetData" :key="s.name"
          class="flex items-center justify-between p-3 rounded-lg"
          style="background:#161b24;border:1px solid #1c2230">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[12px] text-white flex-shrink-0" :style="{background:s.color}">{{ s.name.slice(0,2).toUpperCase() }}</div>
            <div>
              <div class="font-medium text-white text-[13.5px]">{{ s.name }}</div>
              <div class="text-[11px] text-[#5a6a82]">{{ s.role }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[12px] text-[#5a6a82]">{{ s.daysWorked }}/30 days</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="attendanceMap[s.name]" class="sr-only peer">
              <div class="w-10 h-5 rounded-full peer-checked:bg-[#10b981] bg-[#242d3e] transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
            <span class="text-[12px] w-14" :class="attendanceMap[s.name]?'text-positive':'text-negative'">{{ attendanceMap[s.name]?'Present':'Absent' }}</span>
          </div>
        </div>
      </div>
      <div class="mt-4 p-3 rounded-lg flex justify-between" style="background:#161b24;border:1px solid #1c2230">
        <span class="text-[#8a9ab5] text-[13px]">Present today:</span>
        <span class="font-display font-bold text-[16px] text-positive">{{ Object.values(attendanceMap).filter(Boolean).length }} / {{ timesheetData.length }}</span>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showMark=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveAttendance">✅ Save Attendance</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT ATTENDANCE MODAL ═══ -->
    <AppModal v-model="showEditAtt" :title="'Edit Attendance — '+(editAttData?.name||'')" icon="✏️" max-width="480px">
      <div class="space-y-4" v-if="editAttData">
        <div class="flex items-center gap-3 p-3 rounded-lg mb-2" style="background:#161b24;border:1px solid #1c2230">
          <div class="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-[16px] text-white" :style="{background:editAttData.color}">{{ editAttData.name.slice(0,2).toUpperCase() }}</div>
          <div>
            <div class="font-display font-bold text-[16px] text-white">{{ editAttData.name }}</div>
            <div class="text-[12px] text-[#5a6a82]">{{ editAttData.role }} · ₹{{ editAttData.ratePerDay }}/day</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Days Present *</label>
            <input type="number" min="0" max="30" v-model.number="editAttData.daysWorked" class="form-input w-full" @input="recalcEdit" />
          </div>
          <div>
            <label class="field-label">Shift Hours</label>
            <select v-model.number="editAttData.shift" class="form-select w-full" @change="recalcEdit">
              <option value="8">8 Hours</option><option value="10">10 Hours</option>
              <option value="12">12 Hours</option><option value="14">14 Hours</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Rate per Day (₹)</label>
            <input type="number" v-model.number="editAttData.ratePerDay" class="form-input w-full" @input="recalcEdit" />
          </div>
          <div>
            <label class="field-label">Advance (₹)</label>
            <input type="number" v-model.number="editAttData.advance" class="form-input w-full" @input="recalcEdit" />
          </div>
        </div>
        <!-- Live Preview -->
        <div class="grid grid-cols-3 gap-3 p-3 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
          <div class="text-center">
            <div class="text-[10px] text-[#5a6a82] uppercase mb-1">Gross Salary</div>
            <div class="font-display font-bold text-[16px] text-positive">₹{{ fmt(editAttData.daysWorked*editAttData.ratePerDay) }}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] text-[#5a6a82] uppercase mb-1">Advance</div>
            <div class="font-display font-bold text-[16px] text-negative">₹{{ fmt(editAttData.advance) }}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] text-[#5a6a82] uppercase mb-1">Net Payable</div>
            <div class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt(editAttData.daysWorked*editAttData.ratePerDay - editAttData.advance) }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEditAtt=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEditAtt">💾 Update</button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const showMark    = ref(false)
const showEditAtt = ref(false)
const editAttData = ref(null)
const attendanceDate = ref(new Date().toISOString().split('T')[0])

const fmtK = n => Math.abs(n)>=1000 ? (n/1000).toFixed(1)+'K' : String(n)

const timesheetData = reactive([
  {name:'Ajay',    role:'Senior Staff',daysWorked:30,shift:12,ratePerDay:500,salary:15000,advance:6880, netPayable:8120, color:'#f59e0b'},
  {name:'Santosh', role:'Senior Staff',daysWorked:27,shift:14,ratePerDay:800,salary:21600,advance:25719,netPayable:-4119,color:'#ef4444'},
  {name:'Ayaz',    role:'Staff',       daysWorked:30,shift:8, ratePerDay:400,salary:12000,advance:1094, netPayable:10906,color:'#10b981'},
  {name:'Rizwan',  role:'Staff',       daysWorked:30,shift:8, ratePerDay:400,salary:12000,advance:1517, netPayable:10483,color:'#3b82f6'},
  {name:'Rehan',   role:'Part-time',   daysWorked:8, shift:10,ratePerDay:458,salary:3666, advance:656,  netPayable:3010, color:'#8b5cf6'},
  {name:'Kartik',  role:'Staff',       daysWorked:26,shift:10,ratePerDay:410,salary:10666,advance:2415, netPayable:8251, color:'#06b6d4'},
  {name:'Komal',   role:'Staff',       daysWorked:20,shift:8, ratePerDay:333,salary:6666, advance:725,  netPayable:5941, color:'#f97316'},
  {name:'Tanmay',  role:'Staff',       daysWorked:15,shift:8, ratePerDay:316,salary:4750, advance:574,  netPayable:4176, color:'#84cc16'},
  {name:'Vanshika',role:'Staff',       daysWorked:16,shift:8, ratePerDay:316,salary:5066, advance:630,  netPayable:4436, color:'#ec4899'},
  {name:'Sahil P', role:'Petrol',      daysWorked:6, shift:8, ratePerDay:366,salary:2200, advance:675,  netPayable:1525, color:'#f59e0b'},
  {name:'Sahil A', role:'Air Machine', daysWorked:24,shift:12,ratePerDay:400,salary:9600, advance:0,    netPayable:9600, color:'#14b8a6'},
  {name:'Shaikh',  role:'Manager',     daysWorked:30,shift:12,ratePerDay:833,salary:25000,advance:0,    netPayable:25000,color:'#6366f1'},
  {name:'Dhanu',   role:'Security',    daysWorked:30,shift:12,ratePerDay:500,salary:15000,advance:0,    netPayable:15000,color:'#78716c'},
])

const attendanceMap = reactive(
  Object.fromEntries(timesheetData.map(s => [s.name, true]))
)

function openMarkAttendance() {
  attendanceDate.value = new Date().toISOString().split('T')[0]
  timesheetData.forEach(s => attendanceMap[s.name] = true)
  showMark.value = true
}

function openEditAttendance(s) {
  editAttData.value = { ...s }
  showEditAtt.value = true
}

function recalcEdit() {
  if (!editAttData.value) return
  editAttData.value.salary     = editAttData.value.daysWorked * editAttData.value.ratePerDay
  editAttData.value.netPayable = editAttData.value.salary - editAttData.value.advance
}

function saveAttendance() {
  let count = 0
  timesheetData.forEach(s => {
    if (attendanceMap[s.name]) {
      s.daysWorked = Math.min(30, s.daysWorked + 1)
      s.salary     = s.daysWorked * s.ratePerDay
      s.netPayable = s.salary - s.advance
      count++
    }
  })
  showMark.value = false
  ui.success(`Attendance marked for ${count} staff on ${attendanceDate.value}`)
}

function saveEditAtt() {
  const i = timesheetData.findIndex(s => s.name === editAttData.value.name)
  if (i !== -1) {
    const d = editAttData.value
    d.salary     = d.daysWorked * d.ratePerDay
    d.netPayable = d.salary - d.advance
    timesheetData[i] = { ...d }
  }
  showEditAtt.value = false
  ui.success(`${editAttData.value.name} attendance updated!`)
}

function doExport() {
  const headers = ['Name','Role','Days Present','Days Absent','Shift (h)','Rate/Day','Gross Salary','Advance','Net Payable','Attendance %']
  const rows = timesheetData.map(s => [
    s.name, s.role, s.daysWorked, 30-s.daysWorked, s.shift+'h',
    '₹'+s.ratePerDay, '₹'+fmt(s.salary), '₹'+fmt(s.advance),
    '₹'+fmt(s.netPayable), Math.round(s.daysWorked/30*100)+'%'
  ])
  exportCSV('TimeSheet_April2026', headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Name','Role','Days','Absent','Shift','Rate','Gross','Advance','Net','Att%']
  const rows = timesheetData.map(s => [
    s.name, s.role, s.daysWorked, 30-s.daysWorked, s.shift+'h',
    '₹'+s.ratePerDay, '₹'+fmt(s.salary), '₹'+fmt(s.advance), '₹'+fmt(s.netPayable),
    Math.round(s.daysWorked/30*100)+'%'
  ])
  printTable('Attendance Register — April 2026', headers, rows)
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
