<template>
  <div>
    <PageHeader title="Expenses" subtitle="Daily expense tracker & analysis" :crumbs="['Home','Expenses']">
      <template #actions>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openAddExpense">＋ Add Expense</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Expenses"  :value="'₹'+fmt(totalExp)"     icon="🧾" color="#ef4444" sub="April 2026"/>
      <KpiCard label="Avg Per Day"      :value="'₹'+fmt(totalExp/30)"  icon="📊" color="#f59e0b" sub="30-day average"/>
      <KpiCard label="Lowest Day"       value="₹615"                   icon="✅" color="#10b981" sub="Apr 06, 2026"/>
      <KpiCard label="Highest Day"      value="₹23,777"                icon="⚠️" color="#ef4444" sub="Apr 10, 2026"/>
    </div>

    <!-- Search bar -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="form-input" placeholder="🔍 Search narration…" style="min-width:220px" />
      <select v-model="categoryFilter" class="form-select">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <span class="self-center text-[12px] text-[#5a6a82] ml-auto">{{ filtered.length }} records · Total: ₹{{ fmt(filteredTotal) }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily Expenses — April 2026</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>#</th><th>Date</th><th>Amount (₹)</th><th>Category</th><th>Narration / Notes</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="(r,i) in filtered" :key="r.date+i">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
                <td class="amt" :class="r.exp>10000?'text-negative':r.exp>3000?'text-[#f59e0b]':''">{{ fmt(r.exp) }}</td>
                <td><span class="badge badge-gray text-[11px]">{{ r.category }}</span></td>
                <td class="max-w-[260px]"><div class="text-[12px] text-[#8a9ab5] truncate" :title="r.narration">{{ r.narration }}</div></td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditExpense(r)">✏️</button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="deleteExpense(r, i)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot><tr><td colspan="2">TOTAL</td><td>{{ fmt(filteredTotal) }}</td><td colspan="3">—</td></tr></tfoot>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Expense Trend</div></div>
        <div class="card-body">
          <BaseChart type="bar" :data="expChartData" :options="barOpts" :height="460" />
        </div>
      </div>
    </div>

    <!-- ═══ ADD EXPENSE MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Expense" subtitle="Record a daily expense entry" icon="🧾" max-width="480px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Date *</label>
            <input type="date" v-model="expForm.date" class="form-input w-full" required />
          </div>
          <div>
            <label class="field-label">Amount (₹) *</label>
            <input type="number" step="0.01" v-model.number="expForm.amount" class="form-input w-full" placeholder="0.00" />
          </div>
        </div>
        <div>
          <label class="field-label">Category</label>
          <select v-model="expForm.category" class="form-select w-full">
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="field-label">Description / Narration *</label>
          <textarea v-model="expForm.narration" class="form-input w-full" rows="3" placeholder="What was this expense for?" required />
        </div>
        <div>
          <label class="field-label">Paid By</label>
          <select v-model="expForm.paidBy" class="form-select w-full">
            <option>Cash</option><option>PhonePe</option><option>Card</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveExpense" :disabled="saving">
            <span v-if="saving" class="animate-spin inline-block mr-1">⟳</span>💾 Save Expense
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT EXPENSE MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Expense" icon="✏️" max-width="480px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
          <div><label class="field-label">Amount (₹)</label><input type="number" step="0.01" v-model.number="editData.exp" class="form-input w-full" /></div>
        </div>
        <div><label class="field-label">Category</label>
          <select v-model="editData.category" class="form-select w-full">
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="editData.narration" class="form-input w-full" rows="3" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEdit">💾 Update</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Expense" icon="⚠️" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-[14px] text-[#e8edf5] mb-2">Delete expense of <span class="font-bold text-negative">₹{{ fmt(deleteTarget.exp) }}</span> on <span class="text-[#f59e0b]">{{ deleteTarget.date }}</span>?</p>
        <p class="text-[12px] text-[#5a6a82]">"{{ deleteTarget.narration }}"</p>
        <p class="text-[12px] text-negative mt-3">This action cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete=false">Cancel</button>
          <button class="btn btn-danger px-8" @click="confirmDelete">🗑 Delete</button>
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
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const showAdd    = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const saving     = ref(false)
const editData   = ref(null)
const deleteTarget = ref(null)
const deleteIndex  = ref(-1)
const search = ref('')
const categoryFilter = ref('')

const categories = ['Employee Shortage','Tanker Charges','Tea & Snacks','DG Diesel','Maintenance','Stationary','Other']

const expForm = reactive({ date:'', amount:null, category:'Other', narration:'', paidBy:'Cash' })

const expData = reactive([
  {date:'01 Apr',exp:1086, category:'Employee Shortage',narration:'Employee Short + Density + Tea'},
  {date:'02 Apr',exp:3832, category:'Other',            narration:'Employee Short + Tea + DG Diesel + Snacks'},
  {date:'03 Apr',exp:1963, category:'Maintenance',      narration:'Employee Short + Juice + Tea + Ghanta gadi'},
  {date:'04 Apr',exp:6687, category:'Stationary',       narration:'Employee Short + Water Jar + Stationary'},
  {date:'05 Apr',exp:708,  category:'Tea & Snacks',     narration:'Employee Short + Tea'},
  {date:'06 Apr',exp:615,  category:'Tea & Snacks',     narration:'Employee Short + Tea'},
  {date:'07 Apr',exp:1108, category:'Tanker Charges',   narration:'Employee Short + Tanker + Xerox'},
  {date:'08 Apr',exp:1729, category:'Tea & Snacks',     narration:'Employee Short + Tea'},
  {date:'09 Apr',exp:9153, category:'Maintenance',      narration:'Employee Short + Tea + Air Machine Pipe + Fabrication'},
  {date:'10 Apr',exp:23777,category:'Tanker Charges',   narration:'Employee Short + Tanker + Tea + Petrol'},
  {date:'11 Apr',exp:3722, category:'Maintenance',      narration:'Employee Short + Ghanta Gadi + Stationary + Light Electrician'},
  {date:'12 Apr',exp:3124, category:'DG Diesel',        narration:'Employee short + Tea + DG Diesel + Water Bottle'},
  {date:'13 Apr',exp:2119, category:'Other',            narration:'Employee Short + Jayesh Advance + Tea + Harpick'},
  {date:'14 Apr',exp:1171, category:'Tanker Charges',   narration:'Employee Short + Tea + Tanker'},
  {date:'15 Apr',exp:709,  category:'Tanker Charges',   narration:'Employee Short + Tea + Tanker'},
  {date:'16 Apr',exp:1328, category:'Tea & Snacks',     narration:'Employee short + Tea'},
  {date:'17 Apr',exp:13383,category:'Maintenance',      narration:'Employee Short + Dhanu + LED light'},
  {date:'18 Apr',exp:2033, category:'Maintenance',      narration:'Employee Short + Light Fitting + Tea'},
  {date:'19 Apr',exp:1399, category:'Tanker Charges',   narration:'Employee Short + Tea + Lock + Tanker'},
  {date:'20 Apr',exp:6207, category:'Other',            narration:'Pooja Tailor + Ajay Adv + Employee Short + Tea'},
  {date:'21 Apr',exp:5419, category:'DG Diesel',        narration:'Employee Short + DG Diesel + Tea + Shoes'},
  {date:'22 Apr',exp:866,  category:'Tea & Snacks',     narration:'Employee Short + Avasthi + Tea'},
  {date:'23 Apr',exp:1001, category:'Tanker Charges',   narration:'Water + Employee Short + Tanker'},
  {date:'24 Apr',exp:16600,category:'Other',            narration:'Santosh Advance + Tea'},
  {date:'25 Apr',exp:18049,category:'Maintenance',      narration:'Fabrication + Tanker + Dhanu Petrol + Tea + Employee Short'},
  {date:'26 Apr',exp:1984, category:'Tea & Snacks',     narration:'Employee Short + Tea'},
  {date:'27 Apr',exp:2100, category:'Other',            narration:'Employee Short + Tea + Paint'},
  {date:'28 Apr',exp:3482, category:'Tanker Charges',   narration:'Employee Short + Tea + Tanker'},
  {date:'29 Apr',exp:856,  category:'Tea & Snacks',     narration:'Employee Short + Tea'},
  {date:'30 Apr',exp:1342, category:'DG Diesel',        narration:'Employee Short + DG Diesel + Tea'},
])

const filtered = computed(() => {
  let d = [...expData]
  if (search.value) d = d.filter(r => r.narration.toLowerCase().includes(search.value.toLowerCase()))
  if (categoryFilter.value) d = d.filter(r => r.category === categoryFilter.value)
  return d
})

const totalExp      = computed(() => expData.reduce((a,r)=>a+r.exp,0))
const filteredTotal = computed(() => filtered.value.reduce((a,r)=>a+r.exp,0))

function openAddExpense() {
  expForm.date = new Date().toISOString().split('T')[0]
  expForm.amount = null; expForm.narration = ''; expForm.category = 'Other'; expForm.paidBy = 'Cash'
  showAdd.value = true
}

function openEditExpense(r) { editData.value = {...r}; showEdit.value = true }

function deleteExpense(r, i) { deleteTarget.value = r; deleteIndex.value = i; showDelete.value = true }

async function saveExpense() {
  if (!expForm.date || !expForm.amount || !expForm.narration) { ui.error('Date, amount and narration are required'); return }
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  expData.push({ date: expForm.date, exp: expForm.amount, category: expForm.category, narration: expForm.narration })
  expData.sort((a,b) => a.date.localeCompare(b.date))
  saving.value = false
  showAdd.value = false
  ui.success('Expense added!')
}

function saveEdit() {
  const i = expData.findIndex(r => r.date === editData.value.date && r.narration === editData.value.narration)
  if (i !== -1) expData[i] = { ...editData.value }
  showEdit.value = false
  ui.success('Expense updated!')
}

function confirmDelete() {
  const i = expData.findIndex(r => r.date === deleteTarget.value.date && r.narration === deleteTarget.value.narration)
  if (i !== -1) expData.splice(i, 1)
  showDelete.value = false
  ui.success('Expense deleted!')
}

function doExport() {
  const headers = ['Date','Amount (₹)','Category','Narration']
  const rows = expData.map(r => [r.date, r.exp, r.category, r.narration])
  exportCSV('Expenses_April2026', headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date','Amount','Category','Notes']
  const rows = expData.map(r => [r.date, '₹'+fmt(r.exp), r.category, r.narration])
  printTable('Daily Expenses — April 2026', headers, rows)
}

const expChartData = computed(() => ({
  labels: expData.map(r => r.date.split(' ')[0]),
  datasets: [{
    label:'Expense (₹)',
    data: expData.map(r=>r.exp),
    backgroundColor: expData.map(r => r.exp>10000?'#ef4444':r.exp>3000?'#f59e0b':'rgba(239,68,68,0.4)'),
    borderRadius:4, borderSkipped:false,
  }]
}))
const barOpts = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+v}}} }
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
