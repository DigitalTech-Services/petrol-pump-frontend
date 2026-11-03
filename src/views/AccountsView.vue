<template>
  <div>
    <PageHeader title="Bank & Tax (CA)" subtitle="Keep bank statements, bank charges & tax payments ready for your CA" :crumbs="['Home','Accounts & Tax']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" title="One CSV with all three sections for the selected period" @click="exportCaPack"><Download :size="14" /> Export CA Pack</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
      </template>
    </PageHeader>

    <!-- Period -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <select v-model="fy" class="form-select">
        <option v-for="y in fyOptions" :key="y" :value="y">FY {{ y }}-{{ String(y + 1).slice(2) }}</option>
      </select>
      <select v-model="month" class="form-select">
        <option value="">Full Year</option>
        <option v-for="m in fyMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </div>

    <!-- Section picker: each card shows its total and opens that section -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <button v-for="s in sections" :key="s.key" type="button"
        class="kpi-card section-card text-left" :class="{ active: tab === s.key }" :style="{ '--kpi-accent': s.color }"
        @click="tab = s.key">
        <div class="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text)] mb-2">
          <component :is="s.icon" :size="15" :style="{ color: s.color }" /> {{ s.label }}
        </div>
        <div class="font-display font-bold text-[24px] leading-none text-[var(--text)] mb-1.5" :title="s.exact">{{ s.value }}</div>
        <div class="text-[11.5px]" :class="s.warn ? 'text-[#f59e0b]' : 'text-[var(--text-3)]'">{{ s.sub }}</div>
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="card card-body text-center text-[13px] text-[var(--text-3)] py-8">
      <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
    </div>
    <div v-else-if="loadError" class="card card-body text-center py-8">
      <p class="text-[#ef4444] text-[13px] mb-2">{{ loadError }}</p>
      <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadAll">Retry</button>
    </div>

    <div v-else class="card">
      <div class="card-header flex flex-wrap items-center gap-3">
        <div>
          <div class="font-display font-bold text-[15px] text-[var(--text)]">{{ entity.plural }} — {{ periodLabel }}</div>
          <div class="text-[11.5px] text-[var(--text-3)]">{{ entity.hint }}</div>
        </div>
        <div class="flex flex-wrap gap-2 ml-auto">
          <select v-if="tab !== 'taxes' && options.banks.length > 1" v-model="bankFilter" class="form-select">
            <option value="">All Banks</option>
            <option v-for="b in options.banks" :key="b" :value="b">{{ b }}</option>
          </select>
          <select v-if="tab === 'statements'" v-model="statusFilter" class="form-select">
            <option value="">Any CA Status</option>
            <option value="pending">Not sent to CA</option>
            <option value="shared">Sent to CA</option>
          </select>
          <select v-if="tab === 'charges'" v-model="chargeTypeFilter" class="form-select">
            <option value="">All Charge Types</option>
            <option v-for="c in options.charge_types" :key="c" :value="c">{{ c }}</option>
          </select>
          <select v-if="tab === 'taxes'" v-model="taxTypeFilter" class="form-select">
            <option value="">All Tax Types</option>
            <option v-for="t in options.tax_types" :key="t" :value="t">{{ t }}</option>
          </select>
          <button v-if="auth.canWrite" class="btn btn-primary flex items-center gap-1.5" @click="openAdd"><Plus :size="14" /> {{ entity.add }}</button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!activeRows.length" class="text-center py-12 px-4">
        <component :is="entity.icon" :size="36" class="mx-auto mb-3 text-[var(--text-3)] opacity-50" />
        <p class="text-[13px] text-[var(--text-2)] mb-1">No {{ entity.plural.toLowerCase() }} for {{ periodLabel }}.</p>
        <p class="text-[12px] text-[var(--text-3)] mb-4">{{ entity.hint }}</p>
        <button v-if="auth.canWrite" class="btn btn-primary inline-flex items-center gap-1.5" @click="openAdd"><Plus :size="14" /> {{ entity.add }}</button>
      </div>

      <!-- ===== BANK STATEMENTS ===== -->
      <div v-else-if="tab === 'statements'" class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Bank</th><th v-if="auth.isOwner">Station</th><th>Details</th><th>Credit (₹)</th><th>Debit (₹)</th><th>Sent to CA?</th><th></th></tr></thead>
          <tbody>
            <tr v-for="s in filteredStatements" :key="s.id">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ s.date ? formatDate(s.date) : fmtMonth(s.statement_month) }}</span></td>
              <td class="text-[12.5px]">{{ s.bank_name }}<div v-if="s.account_no" class="font-mono-custom text-[10.5px] text-[var(--text-3)]">{{ s.account_no }}</div></td>
              <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ s.station?.name || '—' }}</td>
              <td class="max-w-[260px]"><div class="text-[12px] text-[var(--text-2)] truncate" :title="s.notes">{{ s.notes || (s.type ? '—' : 'Monthly summary') }}</div></td>
              <td class="amt text-positive">{{ s.total_credits ? fmt(s.total_credits) : '' }}</td>
              <td class="amt text-negative">{{ s.total_debits ? fmt(s.total_debits) : '' }}</td>
              <td>
                <button v-if="auth.canWrite" type="button" class="badge text-[11px] cursor-pointer" :class="s.shared_with_ca ? 'badge-green' : 'badge-red'"
                  :title="s.shared_with_ca ? 'Click to mark as not sent' : 'Click once you have sent this to your CA'" @click="toggleShared(s)">
                  <template v-if="s.shared_with_ca"><Check :size="11" /> Sent · {{ formatDate(s.shared_on, { year: false }) }}</template>
                  <template v-else><Send :size="11" /> Not sent — mark sent</template>
                </button>
                <span v-else class="badge text-[11px]" :class="s.shared_with_ca ? 'badge-green' : 'badge-red'">{{ s.shared_with_ca ? 'Sent' : 'Not sent' }}</span>
              </td>
              <td>
                <div class="flex justify-end gap-1.5">
                  <a v-if="s.statement_url" :href="s.statement_url" target="_blank" rel="noopener" class="btn btn-ghost py-0.5 px-2 text-[11px]" title="Open attachment"><ExternalLink :size="11" /></a>
                  <template v-if="auth.canWrite">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" title="Edit" @click="openEdit(s)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" title="Delete" @click="openDelete(s)"><Trash2 :size="11" /></button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td :colspan="auth.isOwner ? 4 : 3">TOTAL</td><td>{{ fmt(sum(filteredStatements, 'total_credits')) }}</td><td>{{ fmt(sum(filteredStatements, 'total_debits')) }}</td><td colspan="2">Net {{ fmt(sum(filteredStatements, 'total_credits') - sum(filteredStatements, 'total_debits')) }}</td></tr>
          </tfoot>
        </table>
      </div>

      <!-- ===== BANK CHARGES ===== -->
      <div v-else-if="tab === 'charges'" class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Bank</th><th v-if="auth.isOwner">Station</th><th>Charge</th><th>Total (₹)</th><th>Note</th><th></th></tr></thead>
          <tbody>
            <tr v-for="c in filteredCharges" :key="c.id">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(c.date) }}</span></td>
              <td class="text-[12.5px]">{{ c.bank_name }}<div v-if="c.account_no" class="font-mono-custom text-[10.5px] text-[var(--text-3)]">{{ c.account_no }}</div></td>
              <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ c.station?.name || '—' }}</td>
              <td><span class="badge badge-gray text-[11px]">{{ c.charge_type }}</span></td>
              <td class="amt">
                <span class="font-semibold text-negative">{{ fmt(c.amount + c.gst_amount) }}</span>
                <div v-if="c.gst_amount" class="text-[10.5px] text-[var(--text-3)]">incl. GST {{ fmt(c.gst_amount) }}</div>
              </td>
              <td class="max-w-[240px]">
                <div class="text-[12px] text-[var(--text-2)] truncate" :title="c.narration">{{ c.narration || '—' }}</div>
                <div v-if="c.reference_no" class="font-mono-custom text-[10.5px] text-[var(--text-3)]">Ref {{ c.reference_no }}</div>
              </td>
              <td>
                <div v-if="auth.canWrite" class="flex justify-end gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" title="Edit" @click="openEdit(c)"><Pencil :size="11" /></button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" title="Delete" @click="openDelete(c)"><Trash2 :size="11" /></button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td :colspan="auth.isOwner ? 4 : 3">TOTAL</td><td>{{ fmt(sum(filteredCharges, 'amount') + sum(filteredCharges, 'gst_amount')) }}</td><td colspan="2"></td></tr>
          </tfoot>
        </table>
      </div>

      <!-- ===== TAX PAYMENTS ===== -->
      <div v-else-if="tab === 'taxes'" class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Paid On</th><th>Tax</th><th v-if="auth.isOwner">Station</th><th>Challan / Ref</th><th>Total Paid (₹)</th><th>Mode</th><th></th></tr></thead>
          <tbody>
            <tr v-for="t in filteredTaxes" :key="t.id">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(t.date) }}</span></td>
              <td>
                <span class="badge badge-indigo text-[11px]">{{ t.tax_type }}</span>
                <div v-if="t.period" class="text-[10.5px] text-[var(--text-3)] mt-0.5">for {{ t.period }}</div>
              </td>
              <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ t.station?.name || '—' }}</td>
              <td class="font-mono-custom text-[11.5px] text-[var(--text-2)]" :title="t.narration">{{ t.challan_no || '—' }}</td>
              <td class="amt">
                <span class="font-semibold">{{ fmt(taxTotal(t)) }}</span>
                <div v-if="t.interest || t.penalty" class="text-[10.5px] text-negative">incl. {{ fmt(Number(t.interest || 0) + Number(t.penalty || 0)) }} interest/penalty</div>
              </td>
              <td class="text-[12px] text-[var(--text-2)]">{{ t.payment_mode || '—' }}</td>
              <td>
                <div v-if="auth.canWrite" class="flex justify-end gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" title="Edit" @click="openEdit(t)"><Pencil :size="11" /></button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" title="Delete" @click="openDelete(t)"><Trash2 :size="11" /></button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td :colspan="auth.isOwner ? 4 : 3">TOTAL</td><td>{{ fmt(filteredTaxes.reduce((a, t) => a + taxTotal(t), 0)) }}</td><td colspan="2"></td></tr>
          </tfoot>
        </table>
      </div>
    </div>

    <datalist id="bank-names"><option v-for="b in options.banks" :key="b" :value="b" /></datalist>

    <!-- ═══ BANK ENTRY MODAL ═══ -->
    <AppModal v-model="showStatement" :title="form.id ? 'Edit Bank Entry' : 'Add Bank Entry'" subtitle="One credit or debit in your bank account" :icon="FileText" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="type-btn" :class="{ active: form.type === 'credit' }" style="--type-color:#10b981" @click="form.type = 'credit'">
            <ArrowDownLeft :size="18" /><span>Credit<small>Money in</small></span>
          </button>
          <button type="button" class="type-btn" :class="{ active: form.type === 'debit' }" style="--type-color:#ef4444" @click="form.type = 'debit'">
            <ArrowUpRight :size="18" /><span>Debit<small>Money out</small></span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Amount (₹) *</label><input type="number" step="0.01" min="0" v-model.number="form.amount" class="form-input w-full" placeholder="0.00" /></div>
          <div><label class="field-label">Date *</label><input type="date" v-model="form.date" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Bank Name *</label><input v-model="form.bank_name" list="bank-names" class="form-input w-full" placeholder="e.g. SBI Current A/c" /></div>
          <div><label class="field-label">Account No.</label><input v-model="form.account_no" class="form-input w-full" placeholder="Last 4 digits is fine" /></div>
        </div>
        <div><label class="field-label">Details</label><input v-model="form.notes" class="form-input w-full" :placeholder="form.type === 'credit' ? 'e.g. Card settlement, cash deposit' : 'e.g. Fuel payment to IOCL'" /></div>
        <div><label class="field-label">Statement / Receipt Link</label><input type="url" v-model="form.statement_url" class="form-input w-full" placeholder="https://… (optional)" /></div>
        <label class="flex items-center gap-2 text-[13px] text-[var(--text-2)] cursor-pointer">
          <input type="checkbox" v-model="form.shared_with_ca" /> Sent to CA
        </label>
        <p v-if="form.legacy" class="text-[11.5px] text-[#f59e0b]">
          This is an old monthly summary (credit ₹{{ fmt(form.total_credits) }}, debit ₹{{ fmt(form.total_debits) }}). Saving keeps only the {{ form.type }} amount above.
        </p>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ CHARGE MODAL ═══ -->
    <AppModal v-model="showCharge" :title="form.id ? 'Edit Bank Charge' : 'Add Bank Charge'" subtitle="Fees & charges debited by the bank" :icon="Landmark" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date *</label><input type="date" v-model="form.date" class="form-input w-full" /></div>
          <div>
            <label class="field-label">Charge Type</label>
            <select v-model="form.charge_type" class="form-select w-full"><option v-for="c in options.charge_types" :key="c">{{ c }}</option></select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Bank Name *</label><input v-model="form.bank_name" list="bank-names" class="form-input w-full" /></div>
          <div><label class="field-label">Account No.</label><input v-model="form.account_no" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Charge Amount (₹) *</label><input type="number" step="0.01" min="0" v-model.number="form.amount" class="form-input w-full" placeholder="0.00" /></div>
          <div>
            <label class="field-label">GST on Charge (₹)</label>
            <input type="number" step="0.01" min="0" v-model.number="form.gst_amount" class="form-input w-full" />
            <button v-if="form.amount" class="text-[11px] text-[#f59e0b] underline mt-1" @click="form.gst_amount = Math.round(form.amount * 18) / 100">Apply 18%</button>
          </div>
        </div>
        <div><label class="field-label">Reference / Txn No.</label><input v-model="form.reference_no" class="form-input w-full" /></div>
        <div><label class="field-label">Narration</label><textarea v-model="form.narration" class="form-input w-full" rows="2" placeholder="As shown on the bank statement" /></div>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ TAX MODAL ═══ -->
    <AppModal v-model="showTax" :title="form.id ? 'Edit Tax Payment' : 'Add Tax Payment'" subtitle="GST, VAT, TDS, advance tax & other dues" :icon="ReceiptIndianRupee" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Tax Type *</label>
            <select v-model="form.tax_type" class="form-select w-full"><option v-for="t in options.tax_types" :key="t">{{ t }}</option></select>
          </div>
          <div><label class="field-label">Payment Date *</label><input type="date" v-model="form.date" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">For Period</label><input v-model="form.period" class="form-input w-full" placeholder="e.g. Sep 2026 / Q2 FY 26-27" /></div>
          <div><label class="field-label">Challan / CIN / Ref</label><input v-model="form.challan_no" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div><label class="field-label">Tax (₹) *</label><input type="number" step="0.01" min="0" v-model.number="form.amount" class="form-input w-full" placeholder="0.00" /></div>
          <div><label class="field-label">Interest (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.interest" class="form-input w-full" /></div>
          <div><label class="field-label">Penalty / Fee (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.penalty" class="form-input w-full" /></div>
        </div>
        <div>
          <label class="field-label">Payment Mode</label>
          <select v-model="form.payment_mode" class="form-select w-full"><option v-for="m in options.payment_modes" :key="m">{{ m }}</option></select>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="form.narration" class="form-input w-full" rows="2" /></div>
        <div class="text-[12.5px] text-[var(--text-2)] text-right">Total paid: <span class="font-semibold text-[var(--text)]">₹{{ fmt(taxTotal(form)) }}</span></div>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" :title="`Delete ${entity.noun}`" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[var(--text)] mb-2">Delete this {{ entity.noun.toLowerCase() }}?</p>
        <p class="text-[12px] text-[var(--text-3)]">{{ deleteLabel }}</p>
        <p class="text-[12px] text-negative mt-3">This action cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete = false">Cancel</button>
          <button class="btn btn-danger px-8" @click="confirmDelete" :disabled="saving">
            <RotateCw v-if="saving" :size="14" class="animate-spin mr-1" /><Trash2 v-else :size="14" class="mr-1" /> Delete
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt, fmtINR, fmtCompact, formatDate } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { accountsApi } from '@/services/api'
import {
  Download, Printer, Plus, FileText, Landmark, ReceiptIndianRupee, AlertTriangle,
  RotateCw, Save, Pencil, Trash2, Send, Check, ExternalLink, ArrowDownLeft, ArrowUpRight
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()

const tab = ref('statements')

// ── Period: Indian financial year (Apr–Mar), optionally one month ──
const today     = new Date()
const currentFy = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
const fy        = ref(currentFy)
const month     = ref('')  // '' = full year, else YYYY-MM
const fyOptions = Array.from({ length: 6 }, (_, i) => currentFy - i)

const fyMonths = computed(() => Array.from({ length: 12 }, (_, i) => {
  const d = new Date(fy.value, 3 + i, 1)
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  }
}))

const range = computed(() => {
  if (month.value) {
    const [y, m] = month.value.split('-').map(Number)
    const last   = new Date(y, m, 0).getDate()
    return { from: `${month.value}-01`, to: `${month.value}-${String(last).padStart(2, '0')}` }
  }
  return { from: `${fy.value}-04-01`, to: `${fy.value + 1}-03-31` }
})

const periodLabel = computed(() => month.value
  ? fyMonths.value.find(m => m.value === month.value)?.label
  : `FY ${fy.value}-${String(fy.value + 1).slice(2)} (Apr ${fy.value} – Mar ${fy.value + 1})`)

watch(fy, () => { month.value = '' })

// ── Helpers ───────────────────────────────────────────────────────
const sum      = (rows, key) => rows.reduce((a, r) => a + Number(r[key] || 0), 0)
const taxTotal = (t) => Number(t.amount || 0) + Number(t.interest || 0) + Number(t.penalty || 0)

function fmtMonth(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

// ── Data ──────────────────────────────────────────────────────────
const emptySummary = () => ({
  statements: { count: 0, shared: 0, pending: 0, total_credits: 0, total_debits: 0 },
  charges:    { count: 0, amount: 0, gst: 0, total: 0, by_type: [] },
  taxes:      { count: 0, amount: 0, interest: 0, penalty: 0, total: 0, by_type: [] },
})

const statements = ref([])
const charges    = ref([])
const taxes      = ref([])
const summary    = ref(emptySummary())
const options    = ref({ charge_types: [], tax_types: [], payment_modes: [], banks: [] })
const loading    = ref(false)
const loadError  = ref('')

async function loadAll() {
  loading.value   = true
  loadError.value = ''
  try {
    const station = selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}
    const params  = { ...range.value, ...station }
    const [sumRes, stRes, chRes, txRes, optRes] = await Promise.all([
      accountsApi.getSummary(params),
      accountsApi.getStatements(params),
      accountsApi.getCharges(params),
      accountsApi.getTaxes(params),
      accountsApi.getOptions(station),
    ])
    summary.value    = sumRes.data?.summary || emptySummary()
    statements.value = stRes.data?.statements || []
    charges.value    = chRes.data?.charges || []
    taxes.value      = txRes.data?.taxes || []
    options.value    = optRes.data || options.value
  } catch (e) {
    loadError.value = e?.message || 'Failed to load accounts data.'
  } finally {
    loading.value = false
  }
}

watch(range, loadAll)
watch(() => selectedStation.selectedStationId, loadAll)
onMounted(loadAll)

// ── Filters (client-side within loaded period) ────────────────────
const bankFilter       = ref('')
const chargeTypeFilter = ref('')
const taxTypeFilter    = ref('')
const statusFilter     = ref('')  // '' | 'pending' | 'shared'

const filteredStatements = computed(() => statements.value.filter(s =>
  (!bankFilter.value || s.bank_name === bankFilter.value) &&
  (!statusFilter.value || (statusFilter.value === 'shared') === !!s.shared_with_ca)))
const filteredCharges    = computed(() => charges.value.filter(c =>
  (!bankFilter.value || c.bank_name === bankFilter.value) && (!chargeTypeFilter.value || c.charge_type === chargeTypeFilter.value)))
const filteredTaxes      = computed(() => taxes.value.filter(t => !taxTypeFilter.value || t.tax_type === taxTypeFilter.value))
const activeRows         = computed(() => ({ statements: filteredStatements, charges: filteredCharges, taxes: filteredTaxes })[tab.value].value)

// ── Entity config per tab ─────────────────────────────────────────
const ENTITIES = {
  statements: {
    noun: 'Bank Entry', plural: 'Bank Entries', add: 'Add Entry', icon: FileText,
    hint: 'Money that came into (credit) or went out of (debit) your bank account — one entry per transaction.', create: accountsApi.createStatement, update: accountsApi.updateStatement, remove: accountsApi.deleteStatement,
    blank: () => ({ type: 'credit', amount: null, date: today.toISOString().slice(0, 10), bank_name: options.value.banks[0] || '', account_no: '', statement_url: '', shared_with_ca: false, notes: '' }),
    required: (f) => f.type && f.date && f.bank_name && f.amount > 0,
    label: (r) => `${r.total_credits ? 'Credit' : 'Debit'} ₹${fmt(r.total_credits || r.total_debits)} — ${r.bank_name}, ${r.date ? formatDate(r.date) : fmtMonth(r.statement_month)}`,
  },
  charges: {
    noun: 'Bank Charge', plural: 'Bank Charges', add: 'Add Charge', icon: Landmark,
    hint: 'Fees the bank deducted (SMS, ATM, cheque book, POS rent…). Your CA claims GST on these.', create: accountsApi.createCharge, update: accountsApi.updateCharge, remove: accountsApi.deleteCharge,
    blank: () => ({ date: today.toISOString().slice(0, 10), bank_name: options.value.banks[0] || '', account_no: '', charge_type: 'Other', amount: null, gst_amount: 0, reference_no: '', narration: '' }),
    required: (f) => f.date && f.bank_name && f.amount !== null && f.amount !== '',
    label: (r) => `${r.charge_type} · ₹${fmt(r.amount)} on ${formatDate(r.date)}`,
  },
  taxes: {
    noun: 'Tax Payment', plural: 'Tax Payments', add: 'Add Tax Payment', icon: ReceiptIndianRupee,
    hint: 'GST, VAT, TDS or advance tax challans you have paid.', create: accountsApi.createTax, update: accountsApi.updateTax, remove: accountsApi.deleteTax,
    blank: () => ({ date: today.toISOString().slice(0, 10), tax_type: 'GST', period: '', challan_no: '', amount: null, interest: 0, penalty: 0, payment_mode: 'Net Banking', narration: '' }),
    required: (f) => f.date && f.tax_type && f.amount !== null && f.amount !== '',
    label: (r) => `${r.tax_type} · ₹${fmt(taxTotal(r))} on ${formatDate(r.date)}`,
  },
}

// Add / edit / delete always act on the active section
const entity = computed(() => ENTITIES[tab.value])

const sections = computed(() => {
  const { statements: st, charges: ch, taxes: tx } = summary.value
  const extra = tx.interest + tx.penalty
  return [
    { key: 'statements', label: 'Bank Statement', icon: FileText, color: '#3b82f6',
      value: `${fmtCompact(st.total_credits - st.total_debits)} net`,
      exact: `Credit ${fmtINR(st.total_credits)} · Debit ${fmtINR(st.total_debits)}`, warn: st.pending > 0,
      sub: !st.count ? 'Nothing added yet'
        : `In ${fmtCompact(st.total_credits)} · Out ${fmtCompact(st.total_debits)}` + (st.pending ? ` · ${st.pending} not sent to CA` : '') },
    { key: 'charges', label: 'Bank Charges', icon: Landmark, color: '#ef4444',
      value: fmtCompact(ch.total), exact: fmtINR(ch.total),
      sub: `${ch.count} entries · incl. GST ${fmtINR(ch.gst)}` },
    { key: 'taxes', label: 'Tax Payments', icon: ReceiptIndianRupee, color: '#10b981',
      value: fmtCompact(tx.total), exact: fmtINR(tx.total), warn: extra > 0,
      sub: extra > 0 ? `${tx.count} payments · ${fmtINR(extra)} interest/penalty` : `${tx.count} payments` },
  ]
})

// ── Add / Edit ────────────────────────────────────────────────────
const showStatement = ref(false)
const showCharge    = ref(false)
const showTax       = ref(false)
const saving        = ref(false)
const form          = ref({})

const modalFor = { statements: showStatement, charges: showCharge, taxes: showTax }

function openAdd() {
  form.value = entity.value.blank()
  modalFor[tab.value].value = true
}

function openEdit(row) {
  form.value = { ...row, statement_url: row.statement_url || '' }
  if (tab.value === 'statements') form.value = { ...form.value, ...bankEntryForm(row) }
  modalFor[tab.value].value = true
}

// A bank entry is stored as credit or debit totals; older rows are monthly
// summaries with no date/type, so pick the larger side and the 1st of the month.
function bankEntryForm(row) {
  const type = row.type || (row.total_credits >= row.total_debits ? 'credit' : 'debit')
  return {
    type,
    amount: type === 'credit' ? row.total_credits : row.total_debits,
    date:   row.date || `${row.statement_month}-01`,
    legacy: !row.type && row.total_credits > 0 && row.total_debits > 0,
  }
}

// Strip server-only fields before sending
const STRIP = ['id', 'user_id', 'station_id', 'station', 'created_at', 'updated_at', 'shared_on', 'legacy',
  'statement_month', 'opening_balance', 'total_credits', 'total_debits', 'closing_balance',
  'created_by_id', 'created_by_name', 'created_host_name', 'created_ip',
  'updated_by_id', 'updated_by_name', 'updated_host_name', 'updated_ip']

async function save() {
  const e = entity.value
  if (!e.required(form.value)) {
    ui.error('Please fill in the required (*) fields')
    return
  }
  const payload = Object.fromEntries(Object.entries(form.value)
    .filter(([k]) => !STRIP.includes(k))
    .map(([k, v]) => [k, v === '' ? null : v]))

  saving.value = true
  try {
    if (form.value.id) await e.update(form.value.id, payload)
    else               await e.create(payload)
    modalFor[tab.value].value = false
    ui.success(`${e.noun} ${form.value.id ? 'updated' : 'added'}!`)
    await loadAll()
  } catch (err) {
    ui.error(err?.message || `Failed to save ${e.noun.toLowerCase()}.`)
  } finally {
    saving.value = false
  }
}

const ModalFooter = () => h('div', { class: 'flex justify-end gap-3' }, [
  h('button', { class: 'btn btn-ghost px-6', onClick: () => { modalFor[tab.value].value = false } }, 'Cancel'),
  h('button', { class: 'btn btn-primary px-8', disabled: saving.value, onClick: save }, [
    h(saving.value ? RotateCw : Save, { size: 14, class: saving.value ? 'animate-spin mr-1' : 'mr-1' }),
    form.value.id ? ' Update' : ' Save',
  ]),
])

async function toggleShared(s) {
  try {
    await accountsApi.updateStatement(s.id, { shared_with_ca: !s.shared_with_ca })
    ui.success(s.shared_with_ca ? 'Marked as pending' : 'Marked as shared with CA')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to update statement.')
  }
}

// ── Delete ────────────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)
const deleteLabel  = computed(() => deleteTarget.value ? entity.value.label(deleteTarget.value) : '')

function openDelete(row) {
  deleteTarget.value = row
  showDelete.value   = true
}

async function confirmDelete() {
  saving.value = true
  try {
    await entity.value.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success(`${entity.value.noun} deleted!`)
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to delete.')
  } finally {
    saving.value = false
  }
}

// ── Export / Print ────────────────────────────────────────────────
const statementRows = () => statements.value.map(s => [s.date || fmtMonth(s.statement_month), s.bank_name, s.account_no || '', s.notes || '', s.total_credits, s.total_debits, s.shared_with_ca ? `Sent ${s.shared_on || ''}` : 'Not sent', s.statement_url || ''])
const chargeRows    = () => charges.value.map(c => [c.date, c.bank_name, c.account_no || '', c.charge_type, c.amount, c.gst_amount, c.amount + c.gst_amount, c.reference_no || '', c.narration || ''])
const taxRows       = () => taxes.value.map(t => [t.date, t.tax_type, t.period || '', t.challan_no || '', t.amount, t.interest, t.penalty, taxTotal(t), t.payment_mode || '', t.narration || ''])

const STATEMENT_HEADERS = ['Date', 'Bank', 'Account', 'Details', 'Credit', 'Debit', 'CA Status', 'Link']
const CHARGE_HEADERS    = ['Date', 'Bank', 'Account', 'Charge Type', 'Amount', 'GST', 'Total', 'Reference', 'Narration']
const TAX_HEADERS       = ['Paid On', 'Tax Type', 'Period', 'Challan / Ref', 'Tax', 'Interest', 'Penalty', 'Total', 'Mode', 'Narration']

// One CSV with all three sections — what the CA asks for at year end
function exportCaPack() {
  const blank = []
  const rows = [
    blank,
    ['BANK STATEMENT'], STATEMENT_HEADERS, ...statementRows(),
    ['', '', '', 'TOTAL', summary.value.statements.total_credits, summary.value.statements.total_debits], blank,
    ['BANK CHARGES'], CHARGE_HEADERS, ...chargeRows(),
    ['', '', '', 'TOTAL', summary.value.charges.amount, summary.value.charges.gst, summary.value.charges.total], blank,
    ['TAX PAYMENTS'], TAX_HEADERS, ...taxRows(),
    ['', '', '', 'TOTAL', summary.value.taxes.amount, summary.value.taxes.interest, summary.value.taxes.penalty, summary.value.taxes.total],
  ]
  exportCSV(`CA_Pack_${month.value || `FY${fy.value}-${String(fy.value + 1).slice(2)}`}`, [`CA Pack — ${periodLabel.value}`], rows)
  ui.success('CA pack exported!')
}

function doPrint() {
  const title = `${entity.value.plural} — ${periodLabel.value}`
  if (tab.value === 'charges')    printTable(title, CHARGE_HEADERS, chargeRows())
  else if (tab.value === 'taxes') printTable(title, TAX_HEADERS, taxRows())
  else                            printTable(title, STATEMENT_HEADERS.slice(0, 7), statementRows().map(r => r.slice(0, 7)))
}
</script>

<style scoped>
.section-card { cursor:pointer; padding:16px 18px; opacity:.75 }
.section-card:hover { opacity:1 }
.section-card.active { opacity:1; border-color:var(--kpi-accent); box-shadow:0 0 0 1px var(--kpi-accent) }
.type-btn { display:flex; align-items:center; justify-content:center; gap:10px; padding:12px; border-radius:10px; border:1px solid var(--border); background:var(--bg-3); color:var(--text-3); font-weight:600; font-size:14px; cursor:pointer; transition:all .15s }
.type-btn span { display:flex; flex-direction:column; align-items:flex-start; line-height:1.2 }
.type-btn small { font-size:11px; font-weight:400 }
.type-btn.active { color:var(--type-color); border-color:var(--type-color); background:color-mix(in srgb, var(--type-color) 12%, transparent) }
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
