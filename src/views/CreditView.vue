<template>
  <div>
    <PageHeader title="Credit Customers" subtitle="Fuel given on credit — customers, dues & payments" :crumbs="['Home','Credit Customers']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button v-if="auth.canWrite" class="btn btn-ghost flex items-center gap-1.5" @click="openAddCustomer"><UserPlus :size="14" /> Add Customer</button>
        <button v-if="auth.canWrite" class="btn btn-primary flex items-center gap-1.5" @click="openAddEntry()"><Plus :size="14" /> Give Fuel on Credit</button>
      </template>
    </PageHeader>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Outstanding Credit" :value="fmtCompact(summary.outstanding)" :exact="fmtINR(summary.outstanding)" :icon="HandCoins" color="#ef4444" :sub="`${summary.pending_entries} unpaid entries`" />
      <KpiCard label="Customers With Dues" :value="summary.customers_with_dues" :icon="Users" color="#f59e0b" :sub="`of ${customers.length} customers`" />
      <KpiCard label="Credit Given" :value="fmtCompact(summary.given_this_month)" :exact="fmtINR(summary.given_this_month)" :icon="Fuel" color="#3b82f6" sub="This month" />
      <KpiCard label="Collected" :value="fmtCompact(summary.collected_this_month)" :exact="fmtINR(summary.collected_this_month)" :icon="BadgeCheck" color="#10b981" sub="Paid this month" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="form-input" placeholder="Search name, mobile, vehicle…" style="min-width:240px" />
      <select v-model="duesFilter" class="form-select">
        <option value="">All Customers</option>
        <option value="dues">With Dues</option>
        <option value="clear">No Dues</option>
      </select>
      <span class="self-center text-[12px] text-[var(--text-3)] ml-auto">{{ filtered.length }} customers · Outstanding: ₹{{ fmt(filteredOutstanding) }}</span>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="font-display font-bold text-[15px] text-[var(--text)]">Credit Customers</div>
      </div>

      <div v-if="loading" class="card-body text-center text-[13px] text-[var(--text-3)] py-8">
        <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
      </div>

      <div v-else-if="loadError" class="card-body text-center py-8">
        <p class="text-[#ef4444] text-[13px] mb-2">{{ loadError }}</p>
        <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadAll">Retry</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Mobile</th><th>Vehicle</th><th>Total Credit</th><th>Paid</th><th>Outstanding</th><th>Last Credit</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in filtered" :key="c.id">
              <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i + 1 }}</td>
              <td>
                <div class="font-medium text-[var(--text)]">{{ c.name }}</div>
                <div v-if="c.credit_limit && c.outstanding > c.credit_limit" class="text-[10.5px] text-negative">Over limit (₹{{ fmt(c.credit_limit) }})</div>
              </td>
              <td class="font-mono-custom text-[12px]">{{ c.mobile }}</td>
              <td class="text-[12px] text-[var(--text-2)]">{{ c.vehicle_number || '—' }}</td>
              <td class="amt">₹{{ fmt(c.total_credit) }}</td>
              <td class="amt text-positive">₹{{ fmt(c.total_paid) }}</td>
              <td>
                <span v-if="c.outstanding > 0" class="badge badge-red">₹{{ fmt(c.outstanding) }}</span>
                <span v-else class="badge badge-green">Clear</span>
              </td>
              <td class="text-[12px] text-[var(--text-2)]">{{ c.last_credit_date ? formatDate(c.last_credit_date) : '—' }}</td>
              <td>
                <div class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openHistory(c)"><History :size="11" /> History</button>
                  <template v-if="auth.canWrite">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" style="color:#f59e0b" @click="openAddEntry(c)"><Plus :size="11" /> Credit</button>
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" title="Edit" @click="openEditCustomer(c)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" title="Delete" @click="deleteTarget = c"><Trash2 :size="11" /></button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="9" class="text-center text-[12.5px] text-[var(--text-3)] py-6">
                {{ customers.length ? 'No customers match your filters.' : 'No credit customers yet — add one to start giving fuel on credit.' }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filtered.length">
            <tr>
              <td colspan="4">TOTAL</td>
              <td>₹{{ fmt(filtered.reduce((a, c) => a + c.total_credit, 0)) }}</td>
              <td>₹{{ fmt(filtered.reduce((a, c) => a + c.total_paid, 0)) }}</td>
              <td>₹{{ fmt(filteredOutstanding) }}</td>
              <td colspan="2">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD / EDIT CUSTOMER ═══ -->
    <AppModal v-model="showCustomer" :title="customerForm.id ? 'Edit Credit Customer' : 'Add Credit Customer'" subtitle="Each customer needs a unique mobile number" :icon="UserPlus" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Customer Name *</label>
            <input v-model="customerForm.name" class="form-input w-full" placeholder="e.g. Sharma Transport" />
          </div>
          <div>
            <label class="field-label">Mobile Number *</label>
            <input v-model="customerForm.mobile" class="form-input w-full font-mono-custom" inputmode="numeric" maxlength="10" placeholder="10-digit mobile"
              @input="customerForm.mobile = customerForm.mobile.replace(/\D/g, '')" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Vehicle Number</label>
            <input v-model="customerForm.vehicle_number" class="form-input w-full uppercase" placeholder="MH12 AB 1234" />
          </div>
          <div>
            <label class="field-label">Credit Limit (₹)</label>
            <input type="number" step="0.01" min="0" v-model.number="customerForm.credit_limit" class="form-input w-full" placeholder="Optional" />
          </div>
        </div>
        <div>
          <label class="field-label">Address</label>
          <input v-model="customerForm.address" class="form-input w-full" placeholder="Optional" />
        </div>
        <div>
          <label class="field-label">Notes</label>
          <textarea v-model="customerForm.notes" class="form-input w-full" rows="2" placeholder="Optional" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showCustomer = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" :disabled="saving" @click="saveCustomer">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" /> {{ customerForm.id ? 'Update' : 'Save Customer' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ ADD CREDIT ENTRY ═══ -->
    <AppModal v-model="showEntry" title="Give Fuel on Credit" subtitle="Enter the amount — litres & rate are optional. Entries can't be edited once saved." :icon="Fuel" max-width="520px">
      <div class="space-y-4">
        <div>
          <label class="field-label">Customer *</label>
          <select v-model.number="entryForm.credit_customer_id" class="form-select w-full">
            <option :value="null" disabled>Select customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} — {{ c.mobile }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Date *</label>
            <input type="date" v-model="entryForm.date" :max="today" class="form-input w-full" />
          </div>
          <div>
            <label class="field-label">Fuel *</label>
            <select v-model="entryForm.fuel_type" class="form-select w-full">
              <option v-for="(label, key) in FUEL_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="field-label">Credit Amount (₹) *</label>
          <input type="number" step="0.01" min="0" v-model.number="entryForm.amount" class="form-input w-full" placeholder="0.00" @input="onAmountInput" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Litres</label>
            <input type="number" step="0.01" min="0" v-model.number="entryForm.litres" class="form-input w-full" placeholder="Optional" @input="onLitresInput" />
          </div>
          <div>
            <label class="field-label">Rate / Litre (₹)</label>
            <input type="number" step="0.01" min="0" v-model.number="entryForm.rate" class="form-input w-full" placeholder="Optional" @input="onRateInput" />
          </div>
        </div>
        <div class="text-[11px] text-[var(--text-3)] -mt-2">Rate is pre-filled from Settings → Fuel Rates. Fill any two of amount, litres and rate and the third is calculated.</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Vehicle Number</label>
            <input v-model="entryForm.vehicle_number" class="form-input w-full uppercase" placeholder="Optional" />
          </div>
          <div>
            <label class="field-label">Notes</label>
            <input v-model="entryForm.notes" class="form-input w-full" placeholder="Optional" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEntry = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" :disabled="saving" @click="saveEntry">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Credit
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ CUSTOMER CREDIT HISTORY ═══ -->
    <AppModal v-model="showHistory" :title="history.customer?.name || 'Credit History'" :subtitle="history.customer ? `${history.customer.mobile}${history.customer.vehicle_number ? ' · ' + history.customer.vehicle_number : ''}` : ''" :icon="History" max-width="980px">
      <template v-if="history.customer">
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div v-for="t in historyTotals" :key="t.label" class="p-2.5 rounded-lg" style="background:var(--bg-3);border:1px solid var(--bg-4)">
            <div class="text-[10px] text-[var(--text-3)] uppercase tracking-wide">{{ t.label }}</div>
            <div class="font-display font-bold text-[18px]" :style="{ color: t.color }">₹{{ fmt(t.value) }}</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 mb-3">
          <select v-model="history.period" class="form-select text-[13px]">
            <option value="">All Time</option>
            <option value="month">Selected Month</option>
          </select>
          <input v-if="history.period === 'month'" type="month" v-model="history.month" class="form-input text-[13px]" style="width:150px" />
          <select v-model="history.status" class="form-select text-[13px]">
            <option value="">All Entries</option>
            <option value="pending">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
          <button v-if="auth.canWrite && history.customer.outstanding > 0" class="btn btn-primary ml-auto flex items-center gap-1.5 text-[12px]"
            @click="openPay({ customer: history.customer })">
            <BadgeCheck :size="14" /> Mark All Paid (₹{{ fmt(history.customer.outstanding) }})
          </button>
        </div>
      </template>

      <div v-if="history.loading" class="text-center py-10 text-[var(--text-3)] text-[13px]">Loading credit history…</div>
      <div v-else class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr><th>Date</th><th>Fuel</th><th>Litres</th><th>Rate</th><th>Amount</th><th>Vehicle</th><th>Status</th><th>Payment</th><th v-if="auth.canWrite">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in history.entries" :key="e.id">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(e.date) }}</span></td>
              <td><span class="badge" :class="FUEL_BADGES[e.fuel_type]">{{ FUEL_LABELS[e.fuel_type] }}</span></td>
              <td class="amt">{{ e.litres != null ? `${fmt(e.litres)} L` : '—' }}</td>
              <td class="amt text-[var(--text-2)]">{{ e.rate != null ? `₹${fmt(e.rate)}` : '—' }}</td>
              <td class="amt font-semibold">₹{{ fmt(e.amount) }}</td>
              <td class="text-[12px] text-[var(--text-2)]">{{ e.vehicle_number || '—' }}</td>
              <td><span class="badge" :class="e.status === 'paid' ? 'badge-green' : 'badge-red'">{{ e.status === 'paid' ? 'Paid' : 'Unpaid' }}</span></td>
              <td class="text-[11.5px] text-[var(--text-2)]">
                <template v-if="e.status === 'paid'">{{ formatDate(e.paid_on) }} · {{ e.payment_mode }}<span v-if="e.payment_ref" class="text-[var(--text-3)]"> ({{ e.payment_ref }})</span></template>
                <template v-else>—</template>
              </td>
              <td v-if="auth.canWrite">
                <div class="flex gap-1.5">
                  <template v-if="e.status === 'pending'">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1 text-positive" @click="openPay({ entry: e })"><BadgeCheck :size="11" /> Mark Paid</button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" title="Delete" @click="deleteEntry(e)"><Trash2 :size="11" /></button>
                  </template>
                  <button v-else class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" title="Undo payment" @click="markUnpaid(e)"><Undo2 :size="11" /> Undo</button>
                </div>
              </td>
            </tr>
            <tr v-if="!history.entries.length">
              <td :colspan="auth.canWrite ? 9 : 8" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No credit entries for this filter.</td>
            </tr>
          </tbody>
          <tfoot v-if="history.entries.length">
            <tr>
              <td colspan="2">TOTAL</td>
              <td>{{ fmt(history.entries.reduce((a, e) => a + (e.litres || 0), 0)) }} L</td>
              <td>—</td>
              <td>₹{{ fmt(history.entries.reduce((a, e) => a + e.amount, 0)) }}</td>
              <td :colspan="auth.canWrite ? 4 : 3">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </AppModal>

    <!-- ═══ MARK AS PAID ═══ -->
    <AppModal v-model="showPay" title="Mark as Paid" :subtitle="payTarget.customer ? `Settle all unpaid credit of ${payTarget.customer.name}` : 'Record payment for this credit entry'" :icon="BadgeCheck" max-width="440px">
      <div class="space-y-4">
        <div class="p-3 rounded-lg flex justify-between items-center" style="background:var(--bg-3);border:1px solid var(--bg-4)">
          <span class="text-[var(--text-2)] text-[13px]">Amount Received</span>
          <span class="font-display font-bold text-[20px] text-positive">₹{{ fmt(payAmount) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Payment Date *</label>
            <input type="date" v-model="payForm.paid_on" :max="today" class="form-input w-full" />
          </div>
          <div>
            <label class="field-label">Payment Mode *</label>
            <select v-model="payForm.payment_mode" class="form-select w-full">
              <option v-for="m in PAYMENT_MODES" :key="m">{{ m }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="field-label">Reference / Txn No.</label>
          <input v-model="payForm.payment_ref" class="form-input w-full" placeholder="Optional — UPI ref, cheque no., etc." />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showPay = false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" :disabled="saving" @click="confirmPay">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><BadgeCheck v-else :size="14" /> Mark Paid
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CUSTOMER ═══ -->
    <AppModal :model-value="!!deleteTarget" @update:model-value="v => { if (!v) deleteTarget = null }" title="Delete Credit Customer" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[var(--text)] mb-2">Delete <span class="font-bold">{{ deleteTarget.name }}</span> ({{ deleteTarget.mobile }})?</p>
        <p v-if="deleteTarget.outstanding > 0" class="text-[12px] text-negative">This customer still owes ₹{{ fmt(deleteTarget.outstanding) }} — mark it as paid first.</p>
        <p v-else class="text-[12px] text-negative mt-3">Their credit history will be removed. This cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger px-8 flex items-center gap-1.5" :disabled="saving || deleteTarget?.outstanding > 0" @click="confirmDeleteCustomer">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><Trash2 v-else :size="14" /> Delete
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
import { fmt, fmtINR, fmtCompact, formatDate } from '@/utils/format'
import { exportCSV } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { creditApi, settingsApi } from '@/services/api'
import {
  Download, Plus, UserPlus, Users, Fuel, HandCoins, BadgeCheck, History,
  Pencil, Trash2, RotateCw, Save, Undo2, AlertTriangle
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()

const FUEL_LABELS   = { ms: 'MS (Petrol)', hsd: 'HSD (Diesel)', speed: 'Power' }
const FUEL_BADGES   = { ms: 'badge-ms', hsd: 'badge-hsd', speed: 'badge-speed' }
const PAYMENT_MODES = ['Cash', 'PhonePe', 'Card', 'Bank Transfer', 'Cheque']

const today = new Date().toISOString().split('T')[0]
const stationParam = () => (selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {})

// ── Customers + summary ───────────────────────────────────────────
const customers = ref([])
const summary   = ref({ outstanding: 0, pending_entries: 0, customers_with_dues: 0, given_this_month: 0, collected_this_month: 0 })
const loading   = ref(false)
const loadError = ref('')

async function loadAll() {
  loading.value   = true
  loadError.value = ''
  try {
    const [cRes, sRes] = await Promise.all([
      creditApi.getCustomers(stationParam()),
      creditApi.getSummary(stationParam()),
    ])
    customers.value = cRes.data?.customers ?? []
    summary.value   = sRes.data?.summary   ?? summary.value
  } catch (e) {
    loadError.value = e?.message || 'Failed to load credit customers.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(() => selectedStation.selectedStationId, loadAll)

// ── Filters ───────────────────────────────────────────────────────
const search     = ref('')
const duesFilter = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return customers.value.filter(c =>
    (!q || [c.name, c.mobile, c.vehicle_number].some(v => v?.toLowerCase().includes(q))) &&
    (duesFilter.value !== 'dues'  || c.outstanding > 0) &&
    (duesFilter.value !== 'clear' || c.outstanding <= 0)
  )
})

const filteredOutstanding = computed(() => filtered.value.reduce((a, c) => a + c.outstanding, 0))

const saving = ref(false)

// ── Add / edit customer ───────────────────────────────────────────
const showCustomer = ref(false)
const customerForm = reactive({ id: null, name: '', mobile: '', vehicle_number: '', address: '', credit_limit: null, notes: '' })

function openAddCustomer() {
  Object.assign(customerForm, { id: null, name: '', mobile: '', vehicle_number: '', address: '', credit_limit: null, notes: '' })
  showCustomer.value = true
}

function openEditCustomer(c) {
  Object.assign(customerForm, {
    id: c.id, name: c.name, mobile: c.mobile, vehicle_number: c.vehicle_number || '',
    address: c.address || '', credit_limit: c.credit_limit, notes: c.notes || '',
  })
  showCustomer.value = true
}

async function saveCustomer() {
  if (!customerForm.name.trim()) return ui.error('Customer name is required')
  if (!/^[6-9]\d{9}$/.test(customerForm.mobile)) return ui.error('Enter a valid 10-digit mobile number')

  const payload = {
    name:           customerForm.name.trim(),
    mobile:         customerForm.mobile,
    vehicle_number: customerForm.vehicle_number.trim().toUpperCase() || null,
    address:        customerForm.address.trim() || null,
    credit_limit:   customerForm.credit_limit || null,
    notes:          customerForm.notes.trim() || null,
  }
  saving.value = true
  try {
    if (customerForm.id) await creditApi.updateCustomer(customerForm.id, payload)
    else                 await creditApi.createCustomer(payload)
    showCustomer.value = false
    ui.success(customerForm.id ? 'Customer updated!' : 'Credit customer added!')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to save customer.')
  } finally {
    saving.value = false
  }
}

// ── Delete customer ───────────────────────────────────────────────
const deleteTarget = ref(null)

async function confirmDeleteCustomer() {
  saving.value = true
  try {
    await creditApi.deleteCustomer(deleteTarget.value.id)
    ui.success(`${deleteTarget.value.name} deleted`)
    deleteTarget.value = null
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to delete customer.')
  } finally {
    saving.value = false
  }
}

// ── Give fuel on credit (add only — entries are not editable) ──
const showEntry   = ref(false)
const rateTouched = ref(false)
const entryForm   = reactive({ credit_customer_id: null, date: today, fuel_type: 'hsd', amount: null, litres: null, rate: null, vehicle_number: '', notes: '' })

// The amount is what's actually owed; litres and rate are optional detail.
// Any two of the three fill in the third. Once the amount is typed by hand it
// stays fixed and litres/rate are derived from it; otherwise amount = litres × rate.
const amountTyped = ref(false)
const pos   = v => (Number(v) > 0 ? Number(v) : null)
const round2 = v => Math.round(v * 100) / 100

function onAmountInput() {
  const amount = pos(entryForm.amount), rate = pos(entryForm.rate), litres = pos(entryForm.litres)
  amountTyped.value = !!amount
  if (rate)                  entryForm.litres = amount ? round2(amount / rate) : null
  else if (litres && amount) { entryForm.rate = round2(amount / litres); rateTouched.value = true }
}

function onLitresInput() {
  const amount = pos(entryForm.amount), rate = pos(entryForm.rate), litres = pos(entryForm.litres)
  if (amountTyped.value && amount) {
    if (litres) { entryForm.rate = round2(amount / litres); rateTouched.value = true }
  } else if (rate) {
    entryForm.amount = litres ? round2(litres * rate) : null
  }
}

function applyRate() {
  const amount = pos(entryForm.amount), rate = pos(entryForm.rate), litres = pos(entryForm.litres)
  if (!rate) return
  if (amountTyped.value && amount) entryForm.litres = round2(amount / rate)
  else if (litres)                 entryForm.amount = round2(litres * rate)
}

function onRateInput() {
  rateTouched.value = true
  applyRate()
}

// Pre-fill the rate from Settings → Fuel Rates in effect on that date (still editable)
async function seedRate() {
  if (rateTouched.value || !entryForm.date) return
  try {
    const res   = await settingsApi.getFuelRates({ date: entryForm.date })
    const rate  = (res.data?.fuel_rates ?? []).find(r => r.fuel_key === entryForm.fuel_type)?.rate
    if (rate && !rateTouched.value) { entryForm.rate = Number(rate); applyRate() }
  } catch { /* non-critical */ }
}
watch(() => [entryForm.date, entryForm.fuel_type], () => { if (showEntry.value) seedRate() })

function openAddEntry(customer = null) {
  // Credit is always recorded against a customer — explain the missing
  // dependency instead of opening a form with an empty customer list
  if (!customer && !customers.value.length) {
    if (loadError.value) return ui.error(`Customers could not be loaded: ${loadError.value}`)
    ui.info('Add a credit customer first — fuel on credit is recorded against a customer.')
    return openAddCustomer()
  }
  Object.assign(entryForm, {
    credit_customer_id: customer?.id ?? null, date: today, fuel_type: 'hsd',
    amount: null, litres: null, rate: null, vehicle_number: customer?.vehicle_number || '', notes: '',
  })
  rateTouched.value = false
  amountTyped.value = false
  showEntry.value   = true
  seedRate()
}

async function saveEntry() {
  if (!entryForm.credit_customer_id) return ui.error('Select a customer')
  if (!entryForm.date)               return ui.error('Date is required')
  if (!(entryForm.amount > 0))       return ui.error('Amount must be more than 0')

  const payload = {
    credit_customer_id: entryForm.credit_customer_id,
    date:               entryForm.date,
    fuel_type:          entryForm.fuel_type,
    amount:             round2(entryForm.amount),
    litres:             pos(entryForm.litres),
    rate:               pos(entryForm.rate),
    vehicle_number:     entryForm.vehicle_number.trim().toUpperCase() || null,
    notes:              entryForm.notes.trim() || null,
  }
  saving.value = true
  try {
    await creditApi.createEntry(payload)
    showEntry.value = false
    ui.success(`Credit of ₹${fmt(payload.amount)} recorded`)
    await refreshAfterChange()
  } catch (e) {
    ui.error(e?.message || 'Failed to save credit entry.')
  } finally {
    saving.value = false
  }
}

async function deleteEntry(e) {
  if (!confirm(`Delete this credit entry of ₹${fmt(e.amount)} on ${formatDate(e.date)}?`)) return
  try {
    await creditApi.deleteEntry(e.id)
    ui.success('Credit entry deleted')
    await refreshAfterChange()
  } catch (err) {
    ui.error(err?.message || 'Failed to delete credit entry.')
  }
}

// ── Credit history of one customer ────────────────────────────────
const showHistory = ref(false)
const history     = reactive({ customer: null, entries: [], loading: false, period: '', month: today.slice(0, 7), status: '' })

const historyTotals = computed(() => {
  const c = history.customer
  return [
    { label: 'Total Credit', value: c?.total_credit ?? 0, color: 'var(--text)' },
    { label: 'Paid',         value: c?.total_paid   ?? 0, color: '#10b981' },
    { label: 'Outstanding',  value: c?.outstanding  ?? 0, color: '#ef4444' },
  ]
})

async function loadHistory() {
  if (!history.customer) return
  history.loading = true
  try {
    const res = await creditApi.getHistory(history.customer.id, {
      ...stationParam(),
      ...(history.period === 'month' ? { month: history.month } : {}),
      ...(history.status ? { status: history.status } : {}),
    })
    history.customer = res.data?.customer ?? history.customer
    history.entries  = res.data?.entries  ?? []
  } catch (e) {
    ui.error(e?.message || 'Failed to load credit history.')
  } finally {
    history.loading = false
  }
}

watch(() => [history.period, history.month, history.status], () => { if (showHistory.value) loadHistory() })

function openHistory(c) {
  Object.assign(history, { customer: c, entries: [], period: '', month: today.slice(0, 7), status: '' })
  showHistory.value = true
  loadHistory()
}

async function refreshAfterChange() {
  await Promise.all([loadAll(), showHistory.value ? loadHistory() : null])
}

// ── Mark as paid (one entry, or all of a customer's dues) ─────────
const showPay   = ref(false)
const payTarget = ref({})
const payForm   = reactive({ paid_on: today, payment_mode: 'Cash', payment_ref: '' })

const payAmount = computed(() => payTarget.value.entry?.amount ?? payTarget.value.customer?.outstanding ?? 0)

function openPay(target) {
  payTarget.value = target
  Object.assign(payForm, { paid_on: today, payment_mode: 'Cash', payment_ref: '' })
  showPay.value = true
}

async function confirmPay() {
  const payload = { paid_on: payForm.paid_on, payment_mode: payForm.payment_mode, payment_ref: payForm.payment_ref.trim() || null }
  saving.value = true
  try {
    if (payTarget.value.entry) {
      await creditApi.markPaid(payTarget.value.entry.id, payload)
      ui.success(`₹${fmt(payTarget.value.entry.amount)} marked as paid`)
    } else {
      const res = await creditApi.payAll(payTarget.value.customer.id, payload)
      ui.success(res?.message || 'Credit marked as paid')
    }
    showPay.value = false
    await refreshAfterChange()
  } catch (e) {
    ui.error(e?.message || 'Failed to mark as paid.')
  } finally {
    saving.value = false
  }
}

async function markUnpaid(e) {
  if (!confirm(`Undo the payment of ₹${fmt(e.amount)}? It will show as unpaid again.`)) return
  try {
    await creditApi.markUnpaid(e.id)
    ui.success('Payment undone')
    await refreshAfterChange()
  } catch (err) {
    ui.error(err?.message || 'Failed to undo payment.')
  }
}

// ── Export ────────────────────────────────────────────────────────
function doExport() {
  const headers = ['Customer', 'Mobile', 'Vehicle', 'Total Credit', 'Paid', 'Outstanding', 'Last Credit']
  const rows = filtered.value.map(c => [
    c.name, c.mobile, c.vehicle_number || '', c.total_credit, c.total_paid, c.outstanding,
    c.last_credit_date ? formatDate(c.last_credit_date) : '',
  ])
  exportCSV('Credit_Customers_' + today, headers, rows)
  ui.success('CSV exported!')
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
