<template>
  <div>
    <PageHeader title="Card Transactions" subtitle="Bank of Maharashtra daily PhonePe settlements" :crumbs="['Home','Transactions']">
      <template #actions>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openAdd">＋ Add Transaction</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Transferred" :value="'₹'+fmtCr(totalTx)"       icon="💳" color="#3b82f6" sub="April 2026" />
      <KpiCard label="Transactions"      :value="txData.length"              icon="🔢" color="#10b981" sub="Daily settlements" />
      <KpiCard label="Avg Per Day"        :value="'₹'+fmtCr(totalTx/30)"    icon="📊" color="#f59e0b" sub="BOM average" />
      <KpiCard label="Highest Day"        value="₹4,96,614"                  icon="🏆" color="#6366f1" sub="Apr 20, 2026" />
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="form-input" placeholder="🔍 Search by date or amount…" style="min-width:200px" />
      <select v-model="bankFilter" class="form-select">
        <option value="">All Banks</option>
        <option>BOM</option><option>ICICI</option><option>HDFC</option>
      </select>
      <span class="self-center text-[12px] text-[#5a6a82] ml-auto">Total: ₹{{ fmt(filteredTotal) }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Table -->
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily PhonePe Transfers — Bank of Maharashtra</div>
          <span class="badge badge-blue ml-2">{{ filtered.length }} records</span>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>Date</th><th>Bank</th><th>Type</th><th>Amount (₹)</th><th>Reference</th><th>Remarks</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="(t,i) in filtered" :key="t.date+i">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ t.date }}</span></td>
                <td><span class="badge badge-blue">{{ t.bank }}</span></td>
                <td><span class="badge" :class="t.type==='PhonePe'?'badge-indigo':'badge-blue'">{{ t.type }}</span></td>
                <td class="amt-lg text-positive">₹{{ fmt(t.amount) }}</td>
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ t.ref || '—' }}</td>
                <td class="text-[12px] text-[#5a6a82]">{{ t.remarks }}</td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(t)">✏️</button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(t,i)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="4">TOTAL</td><td>₹{{ fmt(filteredTotal) }}</td><td colspan="3">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Chart -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Transfer Trend</div></div>
        <div class="card-body">
          <BaseChart type="line" :data="txChartData" :options="lineOpts" :height="430" />
        </div>
        <!-- Summary below chart -->
        <div class="px-5 pb-5 space-y-2">
          <div class="flex justify-between p-2.5 rounded-lg" style="background:#161b24">
            <span class="text-[12px] text-[#8a9ab5]">Total PhonePe</span>
            <span class="amt text-[#6366f1]">₹{{ fmt(txData.filter(t=>t.type==='PhonePe').reduce((a,t)=>a+t.amount,0)) }}</span>
          </div>
          <div class="flex justify-between p-2.5 rounded-lg" style="background:#161b24">
            <span class="text-[12px] text-[#8a9ab5]">Total Card</span>
            <span class="amt text-[#3b82f6]">₹{{ fmt(txData.filter(t=>t.type==='Card').reduce((a,t)=>a+t.amount,0)) }}</span>
          </div>
          <div class="flex justify-between p-2.5 rounded-lg" style="background:#161b24;border:1px solid #2e3a50">
            <span class="text-[13px] font-semibold text-white">Grand Total</span>
            <span class="amt-lg text-[#f59e0b]">₹{{ fmt(totalTx) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ ADD TRANSACTION MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Transaction" subtitle="Record a card or PhonePe payment" icon="💳" max-width="500px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Date *</label>
            <input type="date" v-model="txForm.date" class="form-input w-full" required />
          </div>
          <div>
            <label class="field-label">Payment Type *</label>
            <select v-model="txForm.type" class="form-select w-full">
              <option>PhonePe</option><option>Card</option><option>NEFT</option><option>RTGS</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Bank *</label>
            <select v-model="txForm.bank" class="form-select w-full">
              <option>BOM</option><option>ICICI</option><option>HDFC</option><option>SBI</option>
            </select>
          </div>
          <div>
            <label class="field-label">Amount (₹) *</label>
            <input type="number" step="0.01" v-model.number="txForm.amount" class="form-input w-full" placeholder="0.00" />
          </div>
        </div>
        <div>
          <label class="field-label">Reference Number</label>
          <input v-model="txForm.ref" class="form-input w-full" placeholder="UTR / Transaction ID" />
        </div>
        <div>
          <label class="field-label">Remarks</label>
          <input v-model="txForm.remarks" class="form-input w-full" placeholder="Settlement details…" />
        </div>

        <div v-if="txForm.amount" class="p-3 rounded-lg flex justify-between" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)">
          <span class="text-[13px] text-[#8a9ab5]">Transaction Amount</span>
          <span class="font-display font-bold text-[18px] text-positive">₹{{ fmt(txForm.amount) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveTx" :disabled="saving">
            <span v-if="saving" class="animate-spin inline-block mr-1">⟳</span>💾 Save Transaction
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Transaction" icon="✏️" max-width="500px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
          <div><label class="field-label">Amount (₹)</label><input type="number" v-model.number="editData.amount" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Bank</label>
            <select v-model="editData.bank" class="form-select w-full">
              <option>BOM</option><option>ICICI</option><option>HDFC</option><option>SBI</option>
            </select>
          </div>
          <div><label class="field-label">Type</label>
            <select v-model="editData.type" class="form-select w-full">
              <option>PhonePe</option><option>Card</option><option>NEFT</option>
            </select>
          </div>
        </div>
        <div><label class="field-label">Remarks</label><input v-model="editData.remarks" class="form-input w-full" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEdit">💾 Update</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Transaction" icon="⚠️" max-width="400px">
      <div v-if="deleteTarget" class="text-center py-4">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-[14px] text-[#e8edf5] mb-1">Delete <span class="text-positive font-bold">₹{{ fmt(deleteTarget.amount) }}</span> on <span class="text-[#f59e0b]">{{ deleteTarget.date }}</span>?</p>
        <p class="text-[12px] text-negative mt-3">This cannot be undone.</p>
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
import { fmt, fmtCr } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const showAdd    = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const saving     = ref(false)
const editData   = ref(null)
const deleteTarget = ref(null)
const search = ref('')
const bankFilter = ref('')

const txForm = reactive({ date:'', type:'PhonePe', bank:'BOM', amount:null, ref:'', remarks:'PhonePe Settlement' })

const txData = reactive([
  {date:'01 Apr',bank:'BOM',type:'PhonePe',amount:255347,ref:'UTR001',remarks:'Daily Settlement'},
  {date:'02 Apr',bank:'BOM',type:'PhonePe',amount:341592,ref:'UTR002',remarks:'Daily Settlement'},
  {date:'03 Apr',bank:'BOM',type:'PhonePe',amount:320556,ref:'UTR003',remarks:'Daily Settlement'},
  {date:'04 Apr',bank:'BOM',type:'PhonePe',amount:334594,ref:'UTR004',remarks:'Daily Settlement'},
  {date:'05 Apr',bank:'BOM',type:'PhonePe',amount:352501,ref:'UTR005',remarks:'Daily Settlement'},
  {date:'06 Apr',bank:'BOM',type:'PhonePe',amount:311901,ref:'UTR006',remarks:'Daily Settlement'},
  {date:'07 Apr',bank:'BOM',type:'PhonePe',amount:334899,ref:'UTR007',remarks:'Daily Settlement'},
  {date:'08 Apr',bank:'BOM',type:'PhonePe',amount:360322,ref:'UTR008',remarks:'Daily Settlement'},
  {date:'09 Apr',bank:'BOM',type:'PhonePe',amount:320268,ref:'UTR009',remarks:'Daily Settlement'},
  {date:'10 Apr',bank:'BOM',type:'PhonePe',amount:375409,ref:'UTR010',remarks:'Daily Settlement'},
  {date:'11 Apr',bank:'BOM',type:'PhonePe',amount:381443,ref:'UTR011',remarks:'Daily Settlement'},
  {date:'12 Apr',bank:'BOM',type:'PhonePe',amount:423524,ref:'UTR012',remarks:'Daily Settlement'},
  {date:'13 Apr',bank:'BOM',type:'PhonePe',amount:399051,ref:'UTR013',remarks:'Daily Settlement'},
  {date:'14 Apr',bank:'BOM',type:'PhonePe',amount:346960,ref:'UTR014',remarks:'Daily Settlement'},
  {date:'15 Apr',bank:'BOM',type:'PhonePe',amount:430348,ref:'UTR015',remarks:'Daily Settlement'},
  {date:'16 Apr',bank:'BOM',type:'PhonePe',amount:425970,ref:'UTR016',remarks:'Daily Settlement'},
  {date:'17 Apr',bank:'BOM',type:'PhonePe',amount:341013,ref:'UTR017',remarks:'Daily Settlement'},
  {date:'18 Apr',bank:'BOM',type:'PhonePe',amount:451412,ref:'UTR018',remarks:'Daily Settlement'},
  {date:'19 Apr',bank:'BOM',type:'PhonePe',amount:412061,ref:'UTR019',remarks:'Daily Settlement'},
  {date:'20 Apr',bank:'BOM',type:'PhonePe',amount:496614,ref:'UTR020',remarks:'Daily Settlement'},
  {date:'21 Apr',bank:'BOM',type:'PhonePe',amount:441893,ref:'UTR021',remarks:'Daily Settlement'},
  {date:'22 Apr',bank:'BOM',type:'PhonePe',amount:434134,ref:'UTR022',remarks:'Daily Settlement'},
  {date:'22 Apr',bank:'ICICI',type:'Card', amount:5000,  ref:'POS001',remarks:'Pine Labs POS'},
  {date:'23 Apr',bank:'BOM',type:'PhonePe',amount:454224,ref:'UTR023',remarks:'Daily Settlement'},
  {date:'24 Apr',bank:'BOM',type:'PhonePe',amount:439035,ref:'UTR024',remarks:'Daily Settlement'},
  {date:'25 Apr',bank:'BOM',type:'PhonePe',amount:385393,ref:'UTR025',remarks:'Daily Settlement'},
  {date:'26 Apr',bank:'BOM',type:'PhonePe',amount:488292,ref:'UTR026',remarks:'Daily Settlement'},
  {date:'27 Apr',bank:'BOM',type:'PhonePe',amount:280223,ref:'UTR027',remarks:'Daily Settlement'},
  {date:'28 Apr',bank:'BOM',type:'PhonePe',amount:402291,ref:'UTR028',remarks:'Daily Settlement'},
  {date:'29 Apr',bank:'BOM',type:'PhonePe',amount:391274,ref:'UTR029',remarks:'Daily Settlement'},
  {date:'30 Apr',bank:'BOM',type:'PhonePe',amount:411625,ref:'UTR030',remarks:'Daily Settlement'},
])

const filtered = computed(() => {
  let d = [...txData]
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(t => t.date.toLowerCase().includes(q) || String(t.amount).includes(q))
  }
  if (bankFilter.value) d = d.filter(t => t.bank === bankFilter.value)
  return d
})

const totalTx      = computed(() => txData.reduce((a,t)=>a+t.amount,0))
const filteredTotal= computed(() => filtered.value.reduce((a,t)=>a+t.amount,0))

function openAdd() {
  txForm.date=''; txForm.amount=null; txForm.ref=''; txForm.bank='BOM'; txForm.type='PhonePe'; txForm.remarks='Daily Settlement'
  showAdd.value = true
}
function openEdit(t)    { editData.value = {...t}; showEdit.value = true }
function openDelete(t)  { deleteTarget.value = t;  showDelete.value = true }

async function saveTx() {
  if (!txForm.date || !txForm.amount) { ui.error('Date and amount are required'); return }
  saving.value = true
  await new Promise(r=>setTimeout(r,500))
  txData.push({ date:txForm.date, bank:txForm.bank, type:txForm.type, amount:txForm.amount, ref:txForm.ref, remarks:txForm.remarks })
  txData.sort((a,b)=>a.date.localeCompare(b.date))
  saving.value = false; showAdd.value = false
  ui.success('Transaction added!')
}
function saveEdit() {
  const i = txData.findIndex(t=>t.date===editData.value.date&&t.ref===editData.value.ref)
  if (i!==-1) txData[i] = {...editData.value}
  showEdit.value = false; ui.success('Transaction updated!')
}
function confirmDelete() {
  const i = txData.findIndex(t=>t.date===deleteTarget.value.date&&t.ref===deleteTarget.value.ref)
  if (i!==-1) txData.splice(i,1)
  showDelete.value = false; ui.success('Transaction deleted!')
}

function doExport() {
  const headers = ['Date','Bank','Type','Amount (₹)','Reference','Remarks']
  const rows = txData.map(t=>[t.date,t.bank,t.type,t.amount,t.ref,t.remarks])
  exportCSV('Transactions_April2026', headers, rows)
  ui.success('CSV exported!')
}
function doPrint() {
  const headers = ['Date','Bank','Type','Amount','Reference']
  const rows = filtered.value.map(t=>[t.date,t.bank,t.type,'₹'+fmt(t.amount),t.ref])
  printTable('Card Transactions — April 2026', headers, rows)
}

const txChartData = computed(() => ({
  labels: txData.filter(t=>t.type==='PhonePe').map(t=>t.date.split(' ')[0]),
  datasets:[{
    label:'PhonePe (₹)',
    data: txData.filter(t=>t.type==='PhonePe').map(t=>t.amount),
    borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.1)',
    tension:0.4, fill:true, pointRadius:2, pointBackgroundColor:'#6366f1',
  }]
}))
const lineOpts = {
  plugins:{legend:{display:false}},
  scales:{
    x:{ticks:{font:{size:9},maxRotation:60}},
    y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}}
  }
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
