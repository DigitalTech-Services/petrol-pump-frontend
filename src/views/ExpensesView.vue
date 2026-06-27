<template>
  <div>
    <PageHeader title="Expenses" subtitle="Daily expense tracker & analysis" :crumbs="['Home','Expenses']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAddExpense"><Plus :size="14" /> Add Expense</button>
      </template>
    </PageHeader>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Expenses"  :value="'₹'+fmt(summary.total)"      :icon="Receipt"       color="#ef4444" :sub="monthLabel"/>
      <KpiCard label="Avg Per Day"     :value="'₹'+fmt(summary.avg_per_day)" :icon="BarChart3"     color="#f59e0b" :sub="monthLabel"/>
      <KpiCard label="Lowest Day"      :value="summary.min ? '₹'+fmt(summary.min.amount) : '—'" :icon="CheckCircle2" color="#10b981" :sub="summary.min ? fmtDate(summary.min.date) : '—'"/>
      <KpiCard label="Highest Day"     :value="summary.max ? '₹'+fmt(summary.max.amount) : '—'" :icon="AlertTriangle" color="#ef4444" :sub="summary.max ? fmtDate(summary.max.date) : '—'"/>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input type="month" v-model="month" class="form-input" />
      <input v-model="search" class="form-input" placeholder="Search narration…" style="min-width:220px" />
      <select v-model="categoryFilter" class="form-select">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <span class="self-center text-[12px] text-[#5a6a82] ml-auto">{{ filtered.length }} records · Total: ₹{{ fmt(filteredTotal) }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Table -->
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily Expenses — {{ monthLabel }}</div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
          <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
        </div>

        <!-- Error -->
        <div v-else-if="loadError" class="card-body text-center py-8">
          <p class="text-[#ef4444] text-[13px] mb-2">{{ loadError }}</p>
          <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadExpenses">Retry</button>
        </div>

        <!-- Data -->
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>#</th><th>Date</th><th>Amount (₹)</th><th>Category</th><th>Narration / Notes</th><th>Paid By</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in filtered" :key="r.id">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ fmtDate(r.date) }}</span></td>
                <td class="amt" :class="r.amount > 10000 ? 'text-negative' : r.amount > 3000 ? 'text-[#f59e0b]' : ''">{{ fmt(r.amount) }}</td>
                <td><span class="badge badge-gray text-[11px]">{{ r.category }}</span></td>
                <td class="max-w-[260px]"><div class="text-[12px] text-[#8a9ab5] truncate" :title="r.narration">{{ r.narration }}</div></td>
                <td class="text-[12px] text-[#8a9ab5]">{{ r.paid_by || '—' }}</td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditExpense(r)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteExpense(r)"><Trash2 :size="11" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length && !loading">
                <td colspan="7" class="text-center text-[12.5px] text-[#5a6a82] py-6">
                  No expenses found for this period.
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filtered.length">
              <tr><td colspan="2">TOTAL</td><td>{{ fmt(filteredTotal) }}</td><td colspan="4">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Chart -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Expense Trend</div></div>
        <div class="card-body">
          <BaseChart type="bar" :data="expChartData" :options="barOpts" :height="460" />
        </div>
      </div>
    </div>

    <!-- ═══ ADD EXPENSE MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Expense" subtitle="Record a daily expense entry" :icon="Receipt" max-width="480px">
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
          <button class="btn btn-ghost px-6" @click="showAdd = false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveExpense" :disabled="saving">
            <RotateCw v-if="saving" :size="14" class="animate-spin mr-1" /><Save v-else :size="14" class="mr-1" /> Save Expense
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT EXPENSE MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Expense" :icon="Pencil" max-width="480px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editData.date" class="form-input w-full" /></div>
          <div><label class="field-label">Amount (₹)</label><input type="number" step="0.01" v-model.number="editData.amount" class="form-input w-full" /></div>
        </div>
        <div>
          <label class="field-label">Category</label>
          <select v-model="editData.category" class="form-select w-full">
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="editData.narration" class="form-input w-full" rows="3" /></div>
        <div>
          <label class="field-label">Paid By</label>
          <select v-model="editData.paid_by" class="form-select w-full">
            <option>Cash</option><option>PhonePe</option><option>Card</option>
          </select>
        </div>
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
    <AppModal v-model="showDelete" title="Delete Expense" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[#e8edf5] mb-2">
          Delete expense of <span class="font-bold text-negative">₹{{ fmt(deleteTarget.amount) }}</span>
          on <span class="text-[#f59e0b]">{{ fmtDate(deleteTarget.date) }}</span>?
        </p>
        <p class="text-[12px] text-[#5a6a82]">"{{ deleteTarget.narration }}"</p>
        <p class="text-[12px] text-negative mt-3">This action cannot be undone.</p>
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
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { expenseApi } from '@/services/api'
import {
  Download, Printer, Plus, Receipt, BarChart3, CheckCircle2, AlertTriangle,
  RotateCw, Save, Pencil, Trash2
} from 'lucide-vue-next'

const ui = useUiStore()

// ── Month selector ────────────────────────────────────────────────
const month = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM

const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// ── Data & loading state ──────────────────────────────────────────
const expData   = ref([])
const loading   = ref(false)
const loadError = ref('')

const summary = ref({ total: 0, count: 0, avg_per_day: 0, min: null, max: null })

// ── Helpers ───────────────────────────────────────────────────────
const categories = ['Employee Shortage', 'Tanker Charges', 'Tea & Snacks', 'DG Diesel', 'Maintenance', 'Stationary', 'Other']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// ── Load expenses + summary ───────────────────────────────────────
async function loadExpenses() {
  loading.value   = true
  loadError.value = ''
  try {
    const [expRes, sumRes] = await Promise.all([
      expenseApi.getAll({ month: month.value }),
      expenseApi.getSummary({ month: month.value }),
    ])
    expData.value  = expRes.data?.expenses  || []
    summary.value  = sumRes.data?.summary   || { total: 0, count: 0, avg_per_day: 0, min: null, max: null }
  } catch (e) {
    loadError.value = e?.message || 'Failed to load expenses.'
  } finally {
    loading.value = false
  }
}

watch(month, loadExpenses)
onMounted(loadExpenses)

// ── Filters (client-side within loaded month) ─────────────────────
const search         = ref('')
const categoryFilter = ref('')

const filtered = computed(() => {
  let d = expData.value
  if (search.value)         d = d.filter(r => r.narration.toLowerCase().includes(search.value.toLowerCase()))
  if (categoryFilter.value) d = d.filter(r => r.category === categoryFilter.value)
  return d
})

const filteredTotal = computed(() => filtered.value.reduce((a, r) => a + Number(r.amount), 0))

// ── Add Expense ───────────────────────────────────────────────────
const showAdd = ref(false)
const saving  = ref(false)
const expForm = reactive({ date: '', amount: null, category: 'Other', narration: '', paidBy: 'Cash' })

function openAddExpense() {
  expForm.date      = new Date().toISOString().split('T')[0]
  expForm.amount    = null
  expForm.narration = ''
  expForm.category  = 'Other'
  expForm.paidBy    = 'Cash'
  showAdd.value     = true
}

async function saveExpense() {
  if (!expForm.date || !expForm.amount || !expForm.narration) {
    ui.error('Date, amount and narration are required')
    return
  }
  saving.value = true
  try {
    await expenseApi.create({
      date:      expForm.date,
      amount:    expForm.amount,
      category:  expForm.category,
      narration: expForm.narration,
      paid_by:   expForm.paidBy,
    })
    showAdd.value = false
    ui.success('Expense added!')
    await loadExpenses()
  } catch (e) {
    ui.error(e?.message || 'Failed to add expense.')
  } finally {
    saving.value = false
  }
}

// ── Edit Expense ──────────────────────────────────────────────────
const showEdit   = ref(false)
const editSaving = ref(false)
const editData   = ref(null)

function openEditExpense(r) {
  editData.value = { ...r }
  showEdit.value = true
}

async function saveEdit() {
  editSaving.value = true
  try {
    await expenseApi.update(editData.value.id, {
      date:      editData.value.date,
      amount:    editData.value.amount,
      category:  editData.value.category,
      narration: editData.value.narration,
      paid_by:   editData.value.paid_by,
    })
    showEdit.value = false
    ui.success('Expense updated!')
    await loadExpenses()
  } catch (e) {
    ui.error(e?.message || 'Failed to update expense.')
  } finally {
    editSaving.value = false
  }
}

// ── Delete Expense ────────────────────────────────────────────────
const showDelete  = ref(false)
const deleteSaving= ref(false)
const deleteTarget= ref(null)

function openDeleteExpense(r) {
  deleteTarget.value = r
  showDelete.value   = true
}

async function confirmDelete() {
  deleteSaving.value = true
  try {
    await expenseApi.delete(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Expense deleted!')
    await loadExpenses()
  } catch (e) {
    ui.error(e?.message || 'Failed to delete expense.')
  } finally {
    deleteSaving.value = false
  }
}

// ── Export / Print ────────────────────────────────────────────────
function doExport() {
  const headers = ['Date', 'Amount (₹)', 'Category', 'Narration', 'Paid By']
  const rows    = expData.value.map(r => [fmtDate(r.date), r.amount, r.category, r.narration, r.paid_by || '—'])
  exportCSV(`Expenses_${month.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date', 'Amount', 'Category', 'Notes']
  const rows    = expData.value.map(r => [fmtDate(r.date), '₹' + fmt(r.amount), r.category, r.narration])
  printTable(`Daily Expenses — ${monthLabel.value}`, headers, rows)
}

// ── Chart ─────────────────────────────────────────────────────────
const expChartData = computed(() => ({
  labels: expData.value.map(r => r.date.slice(8, 10)),
  datasets: [{
    label: 'Expense (₹)',
    data:  expData.value.map(r => r.amount),
    backgroundColor: expData.value.map(r =>
      Number(r.amount) > 10000 ? '#ef4444' : Number(r.amount) > 3000 ? '#f59e0b' : 'rgba(239,68,68,0.4)'
    ),
    borderRadius: 4, borderSkipped: false,
  }],
}))

const barOpts = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 9 }, maxRotation: 60 } },
    y: { ticks: { callback: v => '₹' + v } },
  },
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
