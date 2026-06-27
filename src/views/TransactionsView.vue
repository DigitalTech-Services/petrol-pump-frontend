<template>
  <div>
    <PageHeader title="Card Transactions" subtitle="Bank of Maharashtra daily PhonePe settlements" :crumbs="['Home','Transactions']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAdd"><Plus :size="14" /> Add Transaction</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Transferred" :value="'₹'+fmtCr(summary.total)"      :icon="CreditCard"  color="#3b82f6" :sub="monthLabel"/>
      <KpiCard label="Transactions"      :value="String(summary.count)"           :icon="Hash"        color="#10b981" sub="All settlements"/>
      <KpiCard label="Avg Per Day"       :value="'₹'+fmtCr(summary.avg_per_day)" :icon="BarChart3"   color="#f59e0b" :sub="monthLabel"/>
      <KpiCard label="Highest Day"
        :value="summary.highest ? '₹'+fmt(summary.highest.amount) : '—'"
        :icon="Award" color="#6366f1"
        :sub="summary.highest ? fmtDate(summary.highest.date) : '—'" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input type="month" v-model="month" class="form-input" />
      <input v-model="search" class="form-input" placeholder="Search reference, remarks, bank…" style="min-width:200px" />
      <select v-model="typeFilter" class="form-select">
        <option value="">All Types</option>
        <option>PhonePe</option><option>Card</option><option>NEFT</option><option>RTGS</option>
      </select>
      <select v-model="bankFilter" class="form-select">
        <option value="">All Banks</option>
        <option>BOM</option><option>ICICI</option><option>HDFC</option><option>SBI</option>
      </select>
      <span class="self-center text-[12px] text-[#5a6a82] ml-auto">
        {{ filtered.length }} records · Total: ₹{{ fmt(filteredTotal) }}
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Table -->
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Transfers — {{ monthLabel }}</div>
          <span class="badge badge-blue ml-2">{{ filtered.length }} records</span>
        </div>

        <div v-if="loading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
          <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
        </div>
        <div v-else-if="loadError" class="card-body text-center py-8">
          <p class="text-[#ef4444] text-[13px] mb-2">{{ loadError }}</p>
          <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadAll">Retry</button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>Date</th><th>Bank</th><th>Type</th><th>Amount (₹)</th><th>Reference</th><th>Remarks</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in filtered" :key="t.id">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ fmtDate(t.date) }}</span></td>
                <td><span class="badge badge-blue">{{ t.bank }}</span></td>
                <td><span class="badge" :class="t.type === 'PhonePe' ? 'badge-indigo' : 'badge-blue'">{{ t.type }}</span></td>
                <td class="amt-lg text-positive">₹{{ fmt(t.amount) }}</td>
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ t.ref_number || '—' }}</td>
                <td class="text-[12px] text-[#5a6a82]">{{ t.remarks || '—' }}</td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(t)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(t)"><Trash2 :size="11" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length && !loading">
                <td colspan="8" class="text-center text-[12.5px] text-[#5a6a82] py-6">
                  No transactions found for this period.
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filtered.length">
              <tr><td colspan="4">TOTAL</td><td>₹{{ fmt(filteredTotal) }}</td><td colspan="3">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Chart + type breakdown -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Transfer Trend</div>
        </div>
        <div class="card-body">
          <BaseChart type="line" :data="txChartData" :options="lineOpts" :height="430" />
        </div>
        <div class="px-5 pb-5 space-y-2">
          <div v-for="t in summary.by_type" :key="t.type"
            class="flex justify-between p-2.5 rounded-lg" style="background:#161b24">
            <span class="text-[12px] text-[#8a9ab5]">{{ t.type }}</span>
            <span class="amt" :class="t.type === 'PhonePe' ? 'text-[#6366f1]' : 'text-[#3b82f6]'">₹{{ fmt(t.total) }}</span>
          </div>
          <div v-if="!summary.by_type.length && !loading" class="flex justify-between p-2.5 rounded-lg" style="background:#161b24">
            <span class="text-[12px] text-[#5a6a82]">No data yet</span>
          </div>
          <div class="flex justify-between p-2.5 rounded-lg" style="background:#161b24; border:1px solid #2e3a50">
            <span class="text-[13px] font-semibold text-white">Grand Total</span>
            <span class="amt-lg text-[#f59e0b]">₹{{ fmt(summary.total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ ADD TRANSACTION MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Transaction" subtitle="Record a card or PhonePe payment" :icon="CreditCard" max-width="500px">
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
          <input v-model="txForm.ref_number" class="form-input w-full" placeholder="UTR / Transaction ID" />
        </div>
        <div>
          <label class="field-label">Remarks</label>
          <input v-model="txForm.remarks" class="form-input w-full" placeholder="Settlement details…" />
        </div>
        <div v-if="txForm.amount" class="p-3 rounded-lg flex justify-between"
          style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2)">
          <span class="text-[13px] text-[#8a9ab5]">Transaction Amount</span>
          <span class="font-display font-bold text-[18px] text-positive">₹{{ fmt(txForm.amount) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd = false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveTx" :disabled="saving">
            <RotateCw v-if="saving" :size="14" class="animate-spin mr-1" /><Save v-else :size="14" class="mr-1" /> Save Transaction
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Transaction" :icon="Pencil" max-width="500px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
          <div><label class="field-label">Amount (₹)</label><input type="number" v-model.number="editData.amount" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Bank</label>
            <select v-model="editData.bank" class="form-select w-full">
              <option>BOM</option><option>ICICI</option><option>HDFC</option><option>SBI</option>
            </select>
          </div>
          <div>
            <label class="field-label">Type</label>
            <select v-model="editData.type" class="form-select w-full">
              <option>PhonePe</option><option>Card</option><option>NEFT</option><option>RTGS</option>
            </select>
          </div>
        </div>
        <div>
          <label class="field-label">Reference Number</label>
          <input v-model="editData.ref_number" class="form-input w-full" />
        </div>
        <div><label class="field-label">Remarks</label><input v-model="editData.remarks" class="form-input w-full" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit = false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEdit" :disabled="editSaving">
            <RotateCw v-if="editSaving" :size="14" class="animate-spin mr-1" /><Save v-else :size="14" class="mr-1" /> Update
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Transaction" :icon="AlertTriangle" max-width="400px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[#e8edf5] mb-1">
          Delete <span class="text-positive font-bold">₹{{ fmt(deleteTarget.amount) }}</span>
          on <span class="text-[#f59e0b]">{{ fmtDate(deleteTarget.date) }}</span>?
        </p>
        <p class="text-[12px] text-[#5a6a82] mt-1">{{ deleteTarget.ref_number || deleteTarget.remarks || '' }}</p>
        <p class="text-[12px] text-negative mt-3">This cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete = false">Cancel</button>
          <button class="btn btn-danger px-8" @click="confirmDelete" :disabled="deleteSaving">
            <RotateCw v-if="deleteSaving" :size="14" class="animate-spin mr-1" /><Trash2 v-else :size="14" class="mr-1" /> Delete
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
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt, fmtCr } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { transactionApi } from '@/services/api'
import {
  Download, Printer, Plus, CreditCard, Hash, BarChart3, Award,
  RotateCw, Save, Pencil, AlertTriangle, Trash2
} from 'lucide-vue-next'

const ui = useUiStore()

// ── Month selector ────────────────────────────────────────────────
const month = ref(new Date().toISOString().slice(0, 7))

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// ── Data & summary state ──────────────────────────────────────────
const txData    = ref([])
const loading   = ref(false)
const loadError = ref('')

const EMPTY_SUMMARY = { total: 0, count: 0, avg_per_day: 0, highest: null, by_type: [], by_bank: [] }
const summary = ref({ ...EMPTY_SUMMARY })

async function loadAll() {
  loading.value   = true
  loadError.value = ''
  try {
    const [txRes, sumRes] = await Promise.all([
      transactionApi.getAll({ month: month.value }),
      transactionApi.getSummary({ month: month.value }),
    ])
    txData.value  = txRes.data?.transactions || []
    summary.value = sumRes.data?.summary     || { ...EMPTY_SUMMARY }
  } catch (e) {
    loadError.value = e?.message || 'Failed to load transactions.'
  } finally {
    loading.value = false
  }
}

watch(month, loadAll)
onMounted(loadAll)

// ── Client-side filters ───────────────────────────────────────────
const search     = ref('')
const typeFilter = ref('')
const bankFilter = ref('')

const filtered = computed(() => {
  let d = txData.value
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(t =>
      (t.ref_number || '').toLowerCase().includes(q) ||
      (t.remarks    || '').toLowerCase().includes(q) ||
      (t.bank       || '').toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    )
  }
  if (typeFilter.value) d = d.filter(t => t.type === typeFilter.value)
  if (bankFilter.value) d = d.filter(t => t.bank === bankFilter.value)
  return d
})

const filteredTotal = computed(() => filtered.value.reduce((a, t) => a + Number(t.amount), 0))

// ── Add ───────────────────────────────────────────────────────────
const showAdd = ref(false)
const saving  = ref(false)
const txForm  = reactive({
  date: '', type: 'PhonePe', bank: 'BOM', amount: null, ref_number: '', remarks: 'Daily Settlement',
})

function openAdd() {
  txForm.date       = new Date().toISOString().split('T')[0]
  txForm.type       = 'PhonePe'
  txForm.bank       = 'BOM'
  txForm.amount     = null
  txForm.ref_number = ''
  txForm.remarks    = 'Daily Settlement'
  showAdd.value     = true
}

async function saveTx() {
  if (!txForm.date || !txForm.amount) { ui.error('Date and amount are required'); return }
  saving.value = true
  try {
    await transactionApi.create({
      date:       txForm.date,
      type:       txForm.type,
      bank:       txForm.bank,
      amount:     txForm.amount,
      ref_number: txForm.ref_number || null,
      remarks:    txForm.remarks    || null,
    })
    showAdd.value = false
    ui.success('Transaction added!')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to add transaction.')
  } finally {
    saving.value = false
  }
}

// ── Edit ──────────────────────────────────────────────────────────
const showEdit   = ref(false)
const editSaving = ref(false)
const editData   = ref(null)

function openEdit(t) { editData.value = { ...t }; showEdit.value = true }

async function saveEdit() {
  editSaving.value = true
  try {
    await transactionApi.update(editData.value.id, {
      date:       editData.value.date,
      type:       editData.value.type,
      bank:       editData.value.bank,
      amount:     editData.value.amount,
      ref_number: editData.value.ref_number || null,
      remarks:    editData.value.remarks    || null,
    })
    showEdit.value = false
    ui.success('Transaction updated!')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to update transaction.')
  } finally {
    editSaving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteSaving = ref(false)
const deleteTarget = ref(null)

function openDelete(t) { deleteTarget.value = t; showDelete.value = true }

async function confirmDelete() {
  deleteSaving.value = true
  try {
    await transactionApi.delete(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Transaction deleted!')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to delete transaction.')
  } finally {
    deleteSaving.value = false
  }
}

// ── Export / Print ────────────────────────────────────────────────
function doExport() {
  const headers = ['Date', 'Bank', 'Type', 'Amount (₹)', 'Reference', 'Remarks']
  const rows    = txData.value.map(t => [fmtDate(t.date), t.bank, t.type, t.amount, t.ref_number || '', t.remarks || ''])
  exportCSV(`Transactions_${month.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date', 'Bank', 'Type', 'Amount', 'Reference']
  const rows    = filtered.value.map(t => [fmtDate(t.date), t.bank, t.type, '₹' + fmt(t.amount), t.ref_number || '—'])
  printTable(`Card Transactions — ${monthLabel.value}`, headers, rows)
}

// ── Chart (PhonePe trend) ─────────────────────────────────────────
const phonePeTx = computed(() => txData.value.filter(t => t.type === 'PhonePe'))

const txChartData = computed(() => ({
  labels: phonePeTx.value.map(t => t.date.slice(8, 10)),
  datasets: [{
    label: 'PhonePe (₹)',
    data:  phonePeTx.value.map(t => t.amount),
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.1)',
    tension: 0.4, fill: true, pointRadius: 2, pointBackgroundColor: '#6366f1',
  }],
}))

const lineOpts = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 9 }, maxRotation: 60 } },
    y: { ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' } },
  },
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
