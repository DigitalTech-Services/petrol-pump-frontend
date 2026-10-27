<template>
  <div>
    <PageHeader title="New Sale Entry" subtitle="Add daily fuel sale record" :crumbs="['Home','Sales','New Entry']">
      <template #actions>
        <RouterLink to="/sales" class="btn btn-ghost">← Back to Sales</RouterLink>
      </template>
    </PageHeader>

    <form @submit.prevent="handleSubmit" class="space-y-4">

      <!-- Basic Details (secondary — compact strip) -->
      <div class="card">
        <div class="px-4 py-3 grid grid-cols-2 md:grid-cols-[170px_150px_1fr] gap-3 items-end">
          <div>
            <label class="field-label-sm"><Calendar :size="11" class="inline -mt-0.5" /> Sale Date *</label>
            <input type="date" v-model="form.saleDate" class="form-input form-input-sm w-full" required />
          </div>
          <div>
            <label class="field-label-sm">Shift</label>
            <select v-model="form.shift" class="form-select form-input-sm w-full">
              <option>Morning</option><option>Evening</option><option>Night</option><option>Full Day</option>
            </select>
          </div>
          <div class="col-span-2 md:col-span-1">
            <label class="field-label-sm">Narration / Notes</label>
            <input type="text" v-model="form.narration" class="form-input form-input-sm w-full" placeholder="Expenses description, special notes..." />
          </div>
        </div>
      </div>

      <!-- Primary inputs: Fuel Volumes + Collections side by side -->
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">

        <!-- Fuel Volumes -->
        <div class="card card-primary xl:col-span-3">
          <div class="card-header py-3">
            <div class="font-display font-bold text-[16px] text-[var(--text)] flex items-center gap-2"><Fuel :size="17" /> Fuel Volumes</div>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-[72px_1fr_1fr_1fr] gap-x-3 gap-y-3 items-center">
              <div></div>
              <div class="field-label !mb-0">Volume (L)</div>
              <div class="field-label !mb-0 opacity-70">Testing (L)</div>
              <div class="field-label !mb-0">Rate (₹/L)</div>

              <template v-for="f in fuels" :key="f.key">
                <div class="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <span :style="{ color: f.color }">●</span>{{ f.label }}
                </div>
                <input type="number" step="0.01" v-model.number="form[f.key + 'Volume']" class="form-input form-input-lg w-full" placeholder="0.00" />
                <input type="number" step="0.01" v-model.number="form[f.key + 'TestingVolume']" class="form-input w-full" placeholder="0.00" />
                <input type="number" step="0.01" v-model.number="form[f.key + 'Rate']" class="form-input form-input-lg w-full" placeholder="0.00" @input="ratesAutoFilled[f.key] = false" />
              </template>
            </div>
            <div class="text-[11px] text-[var(--text-3)] mt-3">Rates are pre-filled from Settings → Fuel Rates for this date — edit if needed. Testing volume (meter calibration) is deducted before revenue is calculated.</div>
          </div>
        </div>

        <!-- Collections -->
        <div class="card card-primary xl:col-span-2">
          <div class="card-header py-3">
            <div class="font-display font-bold text-[16px] text-[var(--text)] flex items-center gap-2"><Banknote :size="17" /> Collections</div>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Cash (₹)</label>
                <input type="number" step="0.01" v-model.number="form.cash" class="form-input form-input-lg w-full" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">Card / Pine Labs (₹)</label>
                <input type="number" step="0.01" v-model.number="form.card" class="form-input form-input-lg w-full" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">PhonePe / UPI (₹)</label>
                <input type="number" step="0.01" v-model.number="form.phonePe" class="form-input form-input-lg w-full" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label" title="Pre-filled from Credit Customers entries for this date — edit if needed.">Credit Sale (₹) <span class="normal-case tracking-normal text-[var(--text-3)]">· auto</span></label>
                <input type="number" step="0.01" v-model.number="form.creditSale" class="form-input form-input-lg w-full" placeholder="0.00" @input="creditAutoFilled = false" />
              </div>
              <div class="col-span-2">
                <label class="field-label" title="Pre-filled from Expenses logged for this date — edit if needed.">Expenses (₹) <span class="normal-case tracking-normal text-[var(--text-3)]">· auto</span></label>
                <input type="number" step="0.01" v-model.number="form.expenses" class="form-input form-input-lg w-full" placeholder="0.00" @input="markExpensesEdited" />
              </div>
            </div>
            <div class="text-[11px] text-[var(--text-3)] mt-3">Credit Sale and Expenses are pre-filled from this date's entries — edit if needed.</div>
          </div>
        </div>

      </div>

      <!-- Auto Calculated (secondary — compact summary) + Submit -->
      <div class="card">
        <div class="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="flex items-center gap-1.5 text-[12px] text-[var(--text-3)]"><Calculator :size="13" /> Live</div>
          <div class="summary-item"><span>MS</span><span class="amt text-[#f59e0b]">₹{{ fmt(calc_msRev) }}</span></div>
          <div class="summary-item"><span>HSD</span><span class="amt text-[#10b981]">₹{{ fmt(calc_hsdRev) }}</span></div>
          <div class="summary-item"><span>Power</span><span class="amt text-[#3b82f6]">₹{{ fmt(calc_speedRev) }}</span></div>
          <div class="summary-item"><span>Gross Revenue</span><span class="amt-lg text-[#f59e0b]">₹{{ fmt(calc_revenue) }}</span></div>
          <div class="summary-item"><span>Total Collection</span><span class="amt-lg text-positive">₹{{ fmt(calc_collection) }}</span></div>
          <div class="summary-item"><span>Cash Balance</span><span class="amt-lg" :class="calc_balance >= 0 ? 'text-positive' : 'text-negative'">₹{{ fmt(calc_balance) }}</span></div>

          <div class="flex gap-3 ml-auto">
            <RouterLink to="/sales" class="btn btn-ghost px-6">Cancel</RouterLink>
            <button type="submit" class="btn btn-primary px-8 py-2.5 text-[14px] flex items-center gap-1.5" :disabled="saving">
              <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" />
              {{ saving ? 'Saving…' : 'Save Sale Entry' }}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useUiStore }    from '@/stores/ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import { fmt } from '@/utils/format'
import { expenseApi, settingsApi, creditApi } from '@/services/api'
import { Calendar, Fuel, Banknote, Calculator, RotateCw, Save } from 'lucide-vue-next'

const store  = useSalesStore()
const ui     = useUiStore()
const router = useRouter()
const saving  = ref(false)

const form = reactive({
  saleDate: new Date().toISOString().split('T')[0],
  shift: 'Full Day',
  msVolume: null, msTestingVolume: null, msRate: null,
  hsdVolume: null, hsdTestingVolume: null, hsdRate: null,
  speedVolume: null, speedTestingVolume: null, speedRate: null,
  cash: null, card: null, phonePe: null,
  creditSale: null, expenses: null,
  narration: '',
})

// Pre-fills the rate fields from Settings → Fuel Rates using the rate actually
// in effect on this sale's date (fuel rates change daily, so this is looked up
// fresh — never a hardcoded number). Still plain editable fields; re-seeds when
// the date changes, but stops touching a field the moment it's edited by hand.
// A fuel with no saved rate yet stays blank, prompting real entry instead of a
// fabricated placeholder.
const ratesAutoFilled = reactive({ ms: true, hsd: true, speed: true })

const fuels = [
  { key: 'ms',    label: 'MS',    color: '#f59e0b' },
  { key: 'hsd',   label: 'HSD',   color: '#10b981' },
  { key: 'speed', label: 'Power', color: '#3b82f6' },
]

async function seedRatesForDate(date) {
  if (!date) return
  try {
    const res   = await settingsApi.getFuelRates({ date })
    const rates = res.data?.fuel_rates ?? []
    const byKey = Object.fromEntries(rates.map(r => [r.fuel_key, r.rate]))

    if (ratesAutoFilled.ms    && byKey.ms)    form.msRate    = byKey.ms
    if (ratesAutoFilled.hsd   && byKey.hsd)   form.hsdRate   = byKey.hsd
    if (ratesAutoFilled.speed && byKey.speed) form.speedRate = byKey.speed
  } catch { /* non-critical */ }
}

onMounted(() => seedRatesForDate(form.saleDate))
watch(() => form.saleDate, (newDate) => seedRatesForDate(newDate))

// Pre-fills Expenses from whatever's already logged for this date in the
// Expenses ledger — still a plain editable field, just seeded instead of blank.
// Re-seeds when the date changes (so switching dates updates the prefill), but
// stops re-seeding entirely as soon as the user manually edits the field.
const expensesAutoFilled = ref(true)

async function seedExpensesForDate(date) {
  if (!date || !expensesAutoFilled.value) return
  try {
    const res = await expenseApi.getTotalForDate({ date })
    form.expenses = res.data?.total || null
  } catch { /* non-critical */ }
}

function markExpensesEdited() {
  expensesAutoFilled.value = false
}

onMounted(() => seedExpensesForDate(form.saleDate))
watch(() => form.saleDate, (newDate) => seedExpensesForDate(newDate))

// Same idea for Credit Sale: seeded from all fuel given on credit that day
// (Credit Customers), until the user edits the field by hand.
const creditAutoFilled = ref(true)

async function seedCreditForDate(date) {
  if (!date || !creditAutoFilled.value) return
  try {
    const res = await creditApi.getTotalForDate({ date })
    if (creditAutoFilled.value) form.creditSale = res.data?.total || null
  } catch { /* non-critical */ }
}

onMounted(() => seedCreditForDate(form.saleDate))
watch(() => form.saleDate, (newDate) => seedCreditForDate(newDate))

// Testing volume (fuel dispensed for meter calibration) isn't sold, so it's
// deducted from the entered volume before revenue is calculated.
const calc_msRev    = computed(() => Math.max(0, (form.msVolume    || 0) - (form.msTestingVolume    || 0)) * (form.msRate    || 0))
const calc_hsdRev   = computed(() => Math.max(0, (form.hsdVolume   || 0) - (form.hsdTestingVolume   || 0)) * (form.hsdRate   || 0))
const calc_speedRev = computed(() => Math.max(0, (form.speedVolume || 0) - (form.speedTestingVolume || 0)) * (form.speedRate || 0))
const calc_revenue  = computed(() => calc_msRev.value + calc_hsdRev.value + calc_speedRev.value)
const calc_collection = computed(() => (form.cash||0) + (form.card||0) + (form.phonePe||0) + (form.creditSale||0))
const calc_balance  = computed(() => calc_collection.value - (form.expenses || 0))

async function handleSubmit() {
  saving.value = true
  try {
    await store.create({ ...form, revenue: calc_revenue.value, balance: calc_balance.value })
    ui.success('Sale entry saved successfully!')
    router.push('/sales')
  } catch (e) {
    ui.error(e?.message || 'Failed to save. Check API connection.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
.field-label-sm { display:block; font-size:10.5px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px; }
.form-input-sm { padding:5px 10px; font-size:12.5px; }
.form-input-lg { padding:10px 12px; font-size:15px; font-family:'DM Mono',monospace; }
.card-primary { border-top:2px solid #f59e0b; }
.summary-item { display:flex; flex-direction:column; gap:2px; }
.summary-item > span:first-child { font-size:10.5px; color:var(--text-3); text-transform:uppercase; letter-spacing:0.06em; }
</style>
