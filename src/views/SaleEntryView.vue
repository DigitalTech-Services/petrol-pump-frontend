<template>
  <div>
    <PageHeader title="New Sale Entry" subtitle="Add daily fuel sale record" :crumbs="['Home','Sales','New Entry']">
      <template #actions>
        <RouterLink to="/sales" class="btn btn-ghost">← Back to Sales</RouterLink>
      </template>
    </PageHeader>

    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Fuel Volumes -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)] flex items-center gap-2"><Fuel :size="16" /> Fuel Volumes</div></div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="field-label">MS Volume (L) <span class="text-[#f59e0b]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.msVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.fuel }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">MS Testing Volume (L)</label>
                <input type="number" step="0.01" v-model.number="form.msTestingVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.msTesting }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">MS Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.msRate" min="0" class="form-input w-full" :class="{ 'input-error': err.msRate }" placeholder="0.00" @input="ratesAutoFilled.ms = false" />
              </div>
            </div>
            <p v-if="err.msTesting || err.msRate" class="field-error -mt-2">{{ err.msTesting || err.msRate }}</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="field-label">HSD Volume (L) <span class="text-[#10b981]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.hsdVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.fuel }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">HSD Testing Volume (L)</label>
                <input type="number" step="0.01" v-model.number="form.hsdTestingVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.hsdTesting }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">HSD Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.hsdRate" min="0" class="form-input w-full" :class="{ 'input-error': err.hsdRate }" placeholder="0.00" @input="ratesAutoFilled.hsd = false" />
              </div>
            </div>
            <p v-if="err.hsdTesting || err.hsdRate" class="field-error -mt-2">{{ err.hsdTesting || err.hsdRate }}</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="field-label">Power Volume (L) <span class="text-[#3b82f6]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.speedVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.fuel }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">Power Testing Volume (L)</label>
                <input type="number" step="0.01" v-model.number="form.speedTestingVolume" min="0" class="form-input w-full" :class="{ 'input-error': err.speedTesting }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">Power Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.speedRate" min="0" class="form-input w-full" :class="{ 'input-error': err.speedRate }" placeholder="0.00" @input="ratesAutoFilled.speed = false" />
              </div>
            </div>
            <p v-if="err.speedTesting || err.speedRate" class="field-error -mt-2">{{ err.speedTesting || err.speedRate }}</p>
            <p v-if="err.fuel" class="field-error">{{ err.fuel }}</p>
            <div class="text-[11.5px] text-[var(--text-3)] px-1">Rates are pre-filled from Settings → Fuel Rates for this date — edit if needed. Testing volume (fuel dispensed for meter calibration) is deducted before revenue is calculated.</div>
          </div>
        </div>

        <!-- Collections -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)] flex items-center gap-2"><Banknote :size="16" /> Collections</div></div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Cash (₹)</label>
                <input type="number" step="0.01" v-model.number="form.cash" min="0" class="form-input w-full" :class="{ 'input-error': err.collection }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">Card / Pine Labs (₹)</label>
                <input type="number" step="0.01" v-model.number="form.card" min="0" class="form-input w-full" :class="{ 'input-error': err.collection }" placeholder="0.00" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">PhonePe / UPI (₹)</label>
                <input type="number" step="0.01" v-model.number="form.phonePe" min="0" class="form-input w-full" :class="{ 'input-error': err.collection }" placeholder="0.00" />
              </div>
              <div>
                <label class="field-label">Credit Sale (₹)</label>
                <input type="number" :value="form.creditSale" class="form-input w-full cursor-not-allowed opacity-75" placeholder="0.00" readonly tabindex="-1" title="Taken from Credit Customers — add or edit credit entries there" />
                <div class="text-[11px] text-[var(--text-3)] mt-1">Auto-filled from Credit Customers for this date.</div>
              </div>
            </div>
            <p v-if="err.collection" class="field-error -mt-2">{{ err.collection }}</p>
            <div>
              <label class="field-label">Expenses (₹)</label>
              <input type="number" step="0.01" v-model.number="form.expenses" min="0" class="form-input w-full" placeholder="0.00" @input="markExpensesEdited" />
              <div class="text-[11px] text-[var(--text-3)] mt-1">Pre-filled from Expenses logged for this date — edit if needed.</div>
            </div>
          </div>
        </div>

        <!-- Date & Shift -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)] flex items-center gap-2"><Calendar :size="16" /> Basic Details</div></div>
          <div class="card-body space-y-4">
            <div>
              <label class="field-label">Sale Date *</label>
              <input type="date" v-model="form.saleDate" :max="todayLocal" class="form-input w-full" :class="{ 'input-error': err.date }" required />
              <p v-if="err.date" class="field-error">{{ err.date }}</p>
            </div>
            <div>
              <label class="field-label">Shift</label>
              <select v-model="form.shift" class="form-select w-full">
                <option>Morning</option><option>Evening</option><option>Night</option><option>Full Day</option>
              </select>
            </div>
            <div>
              <label class="field-label">Narration / Notes</label>
              <textarea v-model="form.narration" class="form-input w-full" rows="3" placeholder="Expenses description, special notes..." />
            </div>
          </div>
        </div>

        <!-- Auto Calculated -->
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-[var(--text)] flex items-center gap-2"><Calculator :size="16" /> Auto Calculated</div>
            <span class="ml-auto badge badge-green text-[11px]">Live Preview</span>
          </div>
          <div class="card-body space-y-3">
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <span class="text-[13px] text-[var(--text-2)]">MS Revenue</span>
              <span class="amt text-[#f59e0b]">₹{{ fmt(calc_msRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <span class="text-[13px] text-[var(--text-2)]">HSD Revenue</span>
              <span class="amt text-[#10b981]">₹{{ fmt(calc_hsdRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <span class="text-[13px] text-[var(--text-2)]">Power Revenue</span>
              <span class="amt text-[#3b82f6]">₹{{ fmt(calc_speedRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--border-2)">
              <span class="text-[14px] font-semibold text-[var(--text)]">Gross Revenue</span>
              <span class="amt-lg text-[#f59e0b]">₹{{ fmt(calc_revenue) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <span class="text-[13px] text-[var(--text-2)]">Total Collection</span>
              <span class="amt text-positive">₹{{ fmt(calc_collection) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <span class="text-[14px] font-semibold text-[var(--text)]">Cash Balance</span>
              <span class="amt-lg" :class="calc_balance >= 0 ? 'text-positive' : 'text-negative'">₹{{ fmt(calc_balance) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Submit -->
      <div class="flex gap-3 mt-5 justify-end">
        <RouterLink to="/sales" class="btn btn-ghost px-8">Cancel</RouterLink>
        <button type="submit" class="btn btn-primary px-10 py-2.5 text-[14px] flex items-center gap-1.5" :disabled="saving">
          <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" />
          {{ saving ? 'Saving…' : 'Save Sale Entry' }}
        </button>
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

// Credit Sale is read-only: always the total of fuel given on credit that day
// (Credit Customers), so it can't drift from the credit ledger.
async function seedCreditForDate(date) {
  form.creditSale = null
  if (!date) return
  try {
    const res = await creditApi.getTotalForDate({ date })
    if (form.saleDate === date) form.creditSale = res.data?.total || null
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

// ── Validation ── shown once Save is pressed, then live as fields are fixed
const pad        = (n) => String(n).padStart(2, '0')
const now        = new Date()
const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

const FUELS = [['ms', 'MS'], ['hsd', 'HSD'], ['speed', 'Power']]

const errors = computed(() => {
  const e = {}
  if (!form.saleDate)                    e.date = 'Select the sale date.'
  else if (form.saleDate > todayLocal)   e.date = "Sale date can't be in the future."

  let sold = false
  for (const [key, label] of FUELS) {
    const volume  = Number(form[key + 'Volume'] || 0)
    const testing = Number(form[key + 'TestingVolume'] || 0)
    if (testing > volume)    e[key + 'Testing'] = `${label} testing volume can't be more than the volume dispensed.`
    else if (volume - testing > 0) {
      sold = true
      if (!(Number(form[key + 'Rate']) > 0)) e[key + 'Rate'] = `Enter the ${label} rate.`
    }
  }
  if (!sold && !FUELS.some(([k]) => e[k + 'Testing'])) e.fuel = 'Enter the volume sold for at least one fuel.'

  if (calc_collection.value <= 0) e.collection = 'Enter at least one collection — cash, card or UPI (or credit sales for this date).'
  return e
})

const submitted = ref(false)
const err       = computed(() => submitted.value ? errors.value : {})

async function handleSubmit() {
  submitted.value = true
  const messages = Object.values(errors.value)
  if (messages.length) {
    ui.error(messages.length === 1 ? messages[0] : `Please fix ${messages.length} highlighted fields.`)
    return
  }
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
.field-error { font-size:11.5px; color:#ef4444; }
.input-error { border-color:#ef4444 !important; }
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
