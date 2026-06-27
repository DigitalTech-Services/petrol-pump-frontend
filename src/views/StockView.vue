<template>
  <div>
    <PageHeader title="Stock Summary" subtitle="Fuel inventory & stock variation" :crumbs="['Home','Stock']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAddModal"><Plus :size="14" /> Add Stock</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Received (Apr)"  value="1,23,000 L" :icon="Fuel"     color="#f59e0b" sub="Multiple deliveries" />
      <KpiCard label="HSD Received (Apr)" value="~52,500 L"  :icon="Fuel"     color="#10b981" sub="Multiple deliveries" />
      <KpiCard label="Speed Received"     value="~6,000 L"   :icon="Fuel"     color="#3b82f6" sub="Multiple deliveries" />
      <KpiCard label="Avg MS Variation"   value="+1.4 L/day" :icon="BarChart3" color="#6366f1" sub="Over/Short avg" />
    </div>

    <!-- Tabs -->
    <div class="tab-bar mb-5">
      <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='ms'}"    @click="tab='ms'"><Fuel :size="14" /> MS (Petrol)</button>
      <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='hsd'}"   @click="tab='hsd'"><Fuel :size="14" class="text-[#10b981]" /> HSD (Diesel)</button>
      <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='speed'}" @click="tab='speed'"><Fuel :size="14" class="text-[#3b82f6]" /> Speed (Premium)</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">{{ tabLabel }} Stock — April 2026</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Opening, receipts, closing and daily variation</div>
        </div>
        <div class="ml-auto flex gap-2">
          <span class="badge badge-green text-[11px]">{{ currentData.length }} records</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Opening (L)</th><th>Received (L)</th>
              <th>Net Stock (L)</th><th>Closing (L)</th><th>Actual Sale (L)</th>
              <th>Variation (L)</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in currentData" :key="r.date">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td class="amt">{{ fmt(r.open) }}</td>
              <td class="amt" :class="r.recv > 0 ? 'text-positive' : 'text-[#5a6a82]'">
                {{ r.recv > 0 ? '+' + fmt(r.recv) : '—' }}
              </td>
              <td class="amt">{{ fmt(r.net) }}</td>
              <td class="amt text-[#f59e0b]">{{ fmt(r.close) }}</td>
              <td class="amt">{{ fmt(r.sale) }}</td>
              <td>
                <span class="badge" :class="Number(r.var) >= 0 ? 'badge-green' : 'badge-red'">
                  {{ Number(r.var) >= 0 ? '+' : '' }}{{ r.var }}
                </span>
              </td>
              <td>
                <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditModal(r)"><Pencil :size="11" /> Edit</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL</td>
              <td>+{{ fmt(currentData.reduce((a,r)=>a+Number(r.recv),0)) }}</td>
              <td>—</td>
              <td>—</td>
              <td>{{ fmt(currentData.reduce((a,r)=>a+Number(r.sale),0)) }}</td>
              <td>{{ fmt(currentData.reduce((a,r)=>a+Number(r.var),0)) }}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD STOCK MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Stock Entry" subtitle="Record new fuel delivery or opening stock" :icon="Package" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Date *</label>
            <input type="date" v-model="form.date" class="form-input w-full" required />
          </div>
          <div>
            <label class="field-label">Fuel Type *</label>
            <select v-model="form.fuelType" class="form-select w-full">
              <option value="MS">MS (Petrol)</option>
              <option value="HSD">HSD (Diesel)</option>
              <option value="Speed">Speed (Premium)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Opening Stock (L) *</label>
            <input type="number" step="0.01" v-model.number="form.openingStock" class="form-input w-full" placeholder="0.00" @input="autoCalc" />
          </div>
          <div>
            <label class="field-label">Received (L)</label>
            <input type="number" step="0.01" v-model.number="form.received" class="form-input w-full" placeholder="0.00" @input="autoCalc" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Closing Stock (L) *</label>
            <input type="number" step="0.01" v-model.number="form.closingStock" class="form-input w-full" placeholder="0.00" @input="autoCalc" />
          </div>
          <div>
            <label class="field-label">Actual Sale (L)</label>
            <input type="number" step="0.01" v-model.number="form.actualSale" class="form-input w-full" placeholder="0.00" @input="autoCalc" />
          </div>
        </div>

        <!-- Auto calculated row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Net Stock</div>
            <div class="font-display font-bold text-[18px] text-[#f59e0b]">{{ fmt(calcNetStock) }} L</div>
          </div>
          <div class="p-3 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Variation</div>
            <div class="font-display font-bold text-[18px]" :class="calcVariation >= 0 ? 'text-positive' : 'text-negative'">
              {{ calcVariation >= 0 ? '+' : '' }}{{ fmt(calcVariation) }} L
            </div>
          </div>
        </div>

        <div>
          <label class="field-label">Remarks</label>
          <textarea v-model="form.remarks" class="form-input w-full" rows="2" placeholder="Tanker number, supplier, notes…" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveStock" :disabled="saving">
            <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Stock Entry
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Stock Entry" :icon="Pencil" max-width="520px">
      <div class="space-y-4" v-if="editRow">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="text" v-model="editRow.date" class="form-input w-full" /></div>
          <div><label class="field-label">Opening (L)</label><input type="number" v-model.number="editRow.open" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Received (L)</label><input type="number" v-model.number="editRow.recv" class="form-input w-full" /></div>
          <div><label class="field-label">Closing (L)</label><input type="number" v-model.number="editRow.close" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Actual Sale (L)</label><input type="number" v-model.number="editRow.sale" class="form-input w-full" /></div>
          <div><label class="field-label">Variation (L)</label><input type="number" v-model.number="editRow.var" class="form-input w-full" /></div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEdit"><Save :size="14" /> Update</button>
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
import { Download, Printer, Plus, Fuel, BarChart3, Package, Pencil, RotateCw, Save } from 'lucide-vue-next'

const ui     = useUiStore()
const tab    = ref('ms')
const showAdd  = ref(false)
const showEdit = ref(false)
const editRow  = ref(null)
const saving   = ref(false)

const tabLabel = computed(() => ({ ms:'MS Petrol', hsd:'HSD Diesel', speed:'Speed Premium' }[tab.value]))

const form = reactive({
  date:'', fuelType:'MS', openingStock:null, received:null,
  closingStock:null, actualSale:null, remarks:''
})

const calcNetStock  = computed(() => (form.openingStock||0) + (form.received||0))
const calcVariation = computed(() => calcNetStock.value - (form.closingStock||0) - (form.actualSale||0))

function autoCalc() {}

function openAddModal() {
  form.date = new Date().toISOString().split('T')[0]
  form.fuelType = tab.value.toUpperCase()
  form.openingStock = form.received = form.closingStock = form.actualSale = null
  form.remarks = ''
  showAdd.value = true
}

function openEditModal(r) {
  editRow.value = { ...r }
  showEdit.value = true
}

async function saveStock() {
  if (!form.date || !form.openingStock) { ui.error('Date and Opening Stock are required'); return }
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  MS_STOCK.push({
    date: form.date, open: form.openingStock, recv: form.received||0,
    net: calcNetStock.value, close: form.closingStock||0,
    sale: form.actualSale||0, var: calcVariation.value.toFixed(2)
  })
  saving.value = false
  showAdd.value = false
  ui.success('Stock entry added successfully!')
}

function saveEdit() {
  const i = MS_STOCK.findIndex(r => r.date === editRow.value.date)
  if (i !== -1) MS_STOCK[i] = { ...editRow.value }
  showEdit.value = false
  ui.success('Stock entry updated!')
}

function doExport() {
  const headers = ['Date','Opening (L)','Received (L)','Net Stock (L)','Closing (L)','Actual Sale (L)','Variation (L)']
  const rows = currentData.value.map(r => [r.date, r.open, r.recv, r.net, r.close, r.sale, r.var])
  exportCSV(`${tab.value.toUpperCase()}_Stock_April2026`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date','Opening','Received','Net Stock','Closing','Sale','Variation']
  const rows = currentData.value.map(r => [r.date, r.open, r.recv, r.net, r.close, r.sale, r.var])
  printTable(`${tabLabel.value} Stock — April 2026`, headers, rows)
}

const MS_STOCK = reactive([
  {date:'01 Apr',open:17833,recv:0,    net:17833,close:14750,sale:3130.11,var:47.11},
  {date:'02 Apr',open:14750,recv:0,    net:14750,close:11550,sale:3202.38,var:2.38},
  {date:'03 Apr',open:11550,recv:0,    net:11550,close:7820, sale:3729.09,var:-0.91},
  {date:'04 Apr',open:7820, recv:6000, net:13820,close:10230,sale:3589.91,var:-0.09},
  {date:'05 Apr',open:10230,recv:0,    net:10230,close:6600, sale:3634.32,var:4.32},
  {date:'06 Apr',open:6600, recv:0,    net:6600, close:2640, sale:3959.95,var:-0.05},
  {date:'07 Apr',open:2640, recv:12000,net:14640,close:10700,sale:3933.4, var:-6.6},
  {date:'08 Apr',open:10700,recv:0,    net:10700,close:6855, sale:3861.98,var:16.98},
  {date:'09 Apr',open:6855, recv:0,    net:6855, close:2690, sale:4160.6, var:-4.4},
  {date:'10 Apr',open:2690, recv:9000, net:11690,close:7600, sale:4082.55,var:-7.45},
  {date:'11 Apr',open:7600, recv:6000, net:13600,close:9540, sale:4057.09,var:-2.91},
  {date:'12 Apr',open:9540, recv:0,    net:9540, close:5060, sale:4476.28,var:-3.72},
  {date:'13 Apr',open:5060, recv:0,    net:5060, close:649,  sale:4439.22,var:28.22},
  {date:'14 Apr',open:649,  recv:12000,net:12649,close:9150, sale:3834.12,var:335.12},
  {date:'15 Apr',open:9150, recv:9000, net:18150,close:12970,sale:4841,   var:-339},
  {date:'16 Apr',open:12970,recv:0,    net:12970,close:8200, sale:4773.47,var:3.47},
  {date:'17 Apr',open:8200, recv:9000, net:17200,close:13200,sale:4000.9, var:0.9},
  {date:'18 Apr',open:13200,recv:0,    net:13200,close:8380, sale:4822.21,var:2.21},
  {date:'19 Apr',open:8380, recv:9000, net:17380,close:13020,sale:4363.93,var:3.93},
  {date:'20 Apr',open:13020,recv:0,    net:13020,close:8120, sale:4893.98,var:-6.02},
  {date:'21 Apr',open:8120, recv:6000, net:14120,close:9520, sale:4596.56,var:-3.44},
  {date:'22 Apr',open:9520, recv:0,    net:9520, close:4780, sale:4739.08,var:-0.92},
  {date:'23 Apr',open:4780, recv:9000, net:13780,close:9120, sale:4664.94,var:4.94},
  {date:'24 Apr',open:9120, recv:0,    net:9120, close:4040, sale:5083.66,var:3.66},
  {date:'25 Apr',open:4040, recv:7000, net:11040,close:7420, sale:3612.45,var:-7.55},
  {date:'26 Apr',open:7420, recv:0,    net:7420, close:2430, sale:4989.38,var:-0.62},
  {date:'27 Apr',open:2430, recv:10500,net:12930,close:11090,sale:1598.38,var:-241.62},
  {date:'28 Apr',open:11090,recv:0,    net:11090,close:7020, sale:4136.39,var:-66.61},
  {date:'29 Apr',open:7020, recv:0,    net:7020, close:2890, sale:4397.51,var:-267.49},
  {date:'30 Apr',open:2890, recv:0,    net:2890, close:2890, sale:0,      var:135.35},
])

const currentData = computed(() => {
  if (tab.value === 'ms') return MS_STOCK
  const f = tab.value === 'hsd' ? 0.42 : 0.046
  return MS_STOCK.map(r => ({
    ...r,
    open: Math.round(r.open*f), recv: Math.round(r.recv*f),
    net: Math.round(r.net*f),   close: Math.round(r.close*f),
    sale: (r.sale*f).toFixed(2), var: (r.var*(f*0.8)).toFixed(2),
  }))
})
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
