<template>
  <div class="max-w-4xl">
    <PageHeader title="New Sale Entry" subtitle="Add daily fuel sale record" :crumbs="['Home','Sales','New Entry']">
      <template #actions>
        <RouterLink to="/sales" class="btn btn-ghost">← Back to Sales</RouterLink>
      </template>
    </PageHeader>

    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Date & Shift -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">📅 Basic Details</div></div>
          <div class="card-body space-y-4">
            <div>
              <label class="field-label">Sale Date *</label>
              <input type="date" v-model="form.saleDate" class="form-input w-full" required />
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

        <!-- Fuel Volumes -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">⛽ Fuel Volumes</div></div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">MS Volume (L) <span class="text-[#f59e0b]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.msVolume" class="form-input w-full" placeholder="0.00" @input="calc" />
              </div>
              <div>
                <label class="field-label">MS Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.msRate" class="form-input w-full" placeholder="104.77" @input="calc" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">HSD Volume (L) <span class="text-[#10b981]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.hsdVolume" class="form-input w-full" placeholder="0.00" @input="calc" />
              </div>
              <div>
                <label class="field-label">HSD Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.hsdRate" class="form-input w-full" placeholder="91.28" @input="calc" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Speed Volume (L) <span class="text-[#3b82f6]">●</span></label>
                <input type="number" step="0.01" v-model.number="form.speedVolume" class="form-input w-full" placeholder="0.00" @input="calc" />
              </div>
              <div>
                <label class="field-label">Speed Rate (₹/L)</label>
                <input type="number" step="0.01" v-model.number="form.speedRate" class="form-input w-full" placeholder="113.85" @input="calc" />
              </div>
            </div>
          </div>
        </div>

        <!-- Collections -->
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">💰 Collections</div></div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Cash (₹)</label>
                <input type="number" step="0.01" v-model.number="form.cash" class="form-input w-full" placeholder="0.00" @input="calcBalance" />
              </div>
              <div>
                <label class="field-label">Card / Pine Labs (₹)</label>
                <input type="number" step="0.01" v-model.number="form.card" class="form-input w-full" placeholder="0.00" @input="calcBalance" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">PhonePe / UPI (₹)</label>
                <input type="number" step="0.01" v-model.number="form.phonePe" class="form-input w-full" placeholder="0.00" @input="calcBalance" />
              </div>
              <div>
                <label class="field-label">Credit Sale (₹)</label>
                <input type="number" step="0.01" v-model.number="form.creditSale" class="form-input w-full" placeholder="0.00" @input="calcBalance" />
              </div>
            </div>
            <div>
              <label class="field-label">Expenses (₹)</label>
              <input type="number" step="0.01" v-model.number="form.expenses" class="form-input w-full" placeholder="0.00" @input="calcBalance" />
            </div>
          </div>
        </div>

        <!-- Auto Calculated -->
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-white">🧮 Auto Calculated</div>
            <span class="ml-auto badge badge-green text-[11px]">Live Preview</span>
          </div>
          <div class="card-body space-y-3">
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #1c2230">
              <span class="text-[13px] text-[#8a9ab5]">MS Revenue</span>
              <span class="amt text-[#f59e0b]">₹{{ fmt(calc_msRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #1c2230">
              <span class="text-[13px] text-[#8a9ab5]">HSD Revenue</span>
              <span class="amt text-[#10b981]">₹{{ fmt(calc_hsdRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #1c2230">
              <span class="text-[13px] text-[#8a9ab5]">Speed Revenue</span>
              <span class="amt text-[#3b82f6]">₹{{ fmt(calc_speedRev) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #2e3a50">
              <span class="text-[14px] font-semibold text-white">Gross Revenue</span>
              <span class="amt-lg text-[#f59e0b]">₹{{ fmt(calc_revenue) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #1c2230">
              <span class="text-[13px] text-[#8a9ab5]">Total Collection</span>
              <span class="amt text-positive">₹{{ fmt(calc_collection) }}</span>
            </div>
            <div class="flex justify-between py-2.5 px-3 rounded-lg" style="background:#161b24; border:1px solid #1c2230">
              <span class="text-[14px] font-semibold text-white">Cash Balance</span>
              <span class="amt-lg" :class="calc_balance >= 0 ? 'text-positive' : 'text-negative'">₹{{ fmt(calc_balance) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Submit -->
      <div class="flex gap-3 mt-5 justify-end">
        <RouterLink to="/sales" class="btn btn-ghost px-8">Cancel</RouterLink>
        <button type="submit" class="btn btn-primary px-10 py-2.5 text-[14px]" :disabled="saving">
          <span v-if="saving" class="animate-spin inline-block">⟳</span>
          <span v-else>💾 Save Sale Entry</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore } from '@/stores/sales'
import { useUiStore }    from '@/stores/ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import { fmt } from '@/utils/format'

const store  = useSalesStore()
const ui     = useUiStore()
const router = useRouter()
const saving  = ref(false)

const form = reactive({
  saleDate: new Date().toISOString().split('T')[0],
  shift: 'Full Day',
  msVolume: null, msRate: 104.77,
  hsdVolume: null, hsdRate: 91.28,
  speedVolume: null, speedRate: 113.85,
  cash: null, card: null, phonePe: null,
  creditSale: null, expenses: null,
  narration: '',
})

const calc_msRev    = computed(() => (form.msVolume    || 0) * (form.msRate    || 0))
const calc_hsdRev   = computed(() => (form.hsdVolume   || 0) * (form.hsdRate   || 0))
const calc_speedRev = computed(() => (form.speedVolume || 0) * (form.speedRate || 0))
const calc_revenue  = computed(() => calc_msRev.value + calc_hsdRev.value + calc_speedRev.value)
const calc_collection = computed(() => (form.cash||0) + (form.card||0) + (form.phonePe||0) + (form.creditSale||0))
const calc_balance  = computed(() => calc_collection.value - (form.expenses || 0))

const calc = () => {}
const calcBalance = () => {}

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
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
