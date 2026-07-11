<template>
  <div>
    <PageHeader title="Stock Summary" :subtitle="`Fuel inventory & stock variation — ${monthLabel}`" :crumbs="['Home','Stock']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doExport"><Download :size="14" /> Export CSV</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAddModal"><Plus :size="14" /> Add Stock</button>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Received"    :value="`${fmt(tankwiseFor('MS').total_received)} L`"    :icon="Fuel"     color="#f59e0b" sub="This month" />
      <KpiCard label="HSD Received"   :value="`${fmt(tankwiseFor('HSD').total_received)} L`"    :icon="Fuel"     color="#10b981" sub="This month" />
      <KpiCard label="Speed Received" :value="`${fmt(tankwiseFor('Speed').total_received)} L`"   :icon="Fuel"     color="#3b82f6" sub="This month" />
      <KpiCard :label="`Avg ${tabLabel} Variation`" :value="`${tankwiseFor(tabFuelType).avg_variation >= 0 ? '+' : ''}${tankwiseFor(tabFuelType).avg_variation} L/day`" :icon="BarChart3" color="#6366f1" sub="Over/Short avg" />
    </div>

    <!-- Month filter + Tabs -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <input type="month" v-model="selectedMonth" class="form-input" @change="loadAll" />
      <div class="tab-bar">
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='ms'}"    @click="tab='ms'"><Fuel :size="14" /> MS (Petrol)</button>
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='hsd'}"   @click="tab='hsd'"><Fuel :size="14" class="text-[#10b981]" /> HSD (Diesel)</button>
        <button class="tab-btn flex items-center gap-1.5" :class="{active:tab==='speed'}" @click="tab='speed'"><Fuel :size="14" class="text-[#3b82f6]" /> Speed (Premium)</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">{{ tabLabel }} Stock — {{ monthLabel }}</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Opening, receipts, closing and daily variation</div>
        </div>
        <div class="ml-auto flex gap-2">
          <span class="badge badge-green text-[11px]">{{ store.records.length }} records</span>
        </div>
      </div>

      <div v-if="store.loading" class="p-8 text-center text-[#5a6a82] text-[13px]">Loading stock data…</div>
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Opening (L)</th><th>Received (L)</th>
              <th>Net Stock (L)</th><th>Closing (L)</th><th>Actual Sale (L)</th>
              <th>Variation (L)</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.records.length === 0">
              <td colspan="9" class="text-center text-[#5a6a82] py-6 text-[13px]">No stock entries found. Add the first entry.</td>
            </tr>
            <tr v-for="(r, i) in store.records" :key="r.id">
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
                <div class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditModal(r)"><Pencil :size="11" /> Edit</button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteModal(r)"><Trash2 :size="11" /></button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="store.records.length">
            <tr>
              <td colspan="3">TOTAL</td>
              <td>+{{ fmt(store.records.reduce((a,r)=>a+Number(r.recv),0)) }}</td>
              <td>—</td>
              <td>—</td>
              <td>{{ fmt(store.records.reduce((a,r)=>a+Number(r.sale),0)) }}</td>
              <td>{{ fmt(store.records.reduce((a,r)=>a+Number(r.var),0)) }}</td>
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
            <input type="number" step="0.01" v-model.number="form.open" class="form-input w-full" placeholder="0.00" />
          </div>
          <div>
            <label class="field-label">Received (L)</label>
            <input type="number" step="0.01" v-model.number="form.recv" class="form-input w-full" placeholder="0.00" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Closing Stock (L) *</label>
            <input type="number" step="0.01" v-model.number="form.close" class="form-input w-full" placeholder="0.00" />
          </div>
          <div>
            <label class="field-label">Actual Sale (L)</label>
            <input type="number" step="0.01" v-model.number="form.sale" class="form-input w-full" placeholder="Leave blank to use recorded sale" />
          </div>
        </div>

        <!-- Auto calculated row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Net Stock</div>
            <div class="font-display font-bold text-[18px] text-[#f59e0b]">{{ fmt(calcNetStock) }} L</div>
          </div>
          <div class="p-3 rounded-lg" style="background:#161b24;border:1px solid #1c2230">
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Variation (est.)</div>
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
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveStock" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Stock Entry
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Stock Entry" :icon="Pencil" max-width="520px">
      <div class="space-y-4" v-if="editRow">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="date" v-model="editRow.date" class="form-input w-full" /></div>
          <div><label class="field-label">Opening (L)</label><input type="number" step="0.01" v-model.number="editRow.open" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Received (L)</label><input type="number" step="0.01" v-model.number="editRow.recv" class="form-input w-full" /></div>
          <div><label class="field-label">Closing (L)</label><input type="number" step="0.01" v-model.number="editRow.close" class="form-input w-full" /></div>
        </div>
        <div>
          <label class="field-label">Actual Sale (L)</label>
          <input type="number" step="0.01" v-model.number="editRow.sale" class="form-input w-full" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEdit" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Update
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Stock Entry" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[#e8edf5] mb-2">
          Delete {{ tabLabel }} stock entry for <span class="text-[#f59e0b] font-bold">{{ deleteTarget.date }}</span>?
        </p>
        <p class="text-[12px] text-negative mt-3">This cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete=false">Cancel</button>
          <button class="btn btn-danger px-8 flex items-center gap-1.5" @click="confirmDelete" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Trash2 v-else :size="14" /> Delete
          </button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useStockStore } from '@/stores/stock'
import { Download, Printer, Plus, Fuel, BarChart3, Package, Pencil, RotateCw, Save, Trash2, AlertTriangle } from 'lucide-vue-next'

const ui    = useUiStore()
const store = useStockStore()

// ── Month + tab filters ─────────────────────────────────────────
const now           = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const tab           = ref('ms')

const monthLabel = computed(() => {
  const [y, m] = selectedMonth.value.split('-')
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

const tabLabel    = computed(() => ({ ms:'MS Petrol', hsd:'HSD Diesel', speed:'Speed Premium' }[tab.value]))
const tabFuelType = computed(() => ({ ms:'MS', hsd:'HSD', speed:'Speed' }[tab.value]))

function tankwiseFor(fuelType) {
  return store.tankwise?.[fuelType] ?? { total_received: 0, latest_closing: 0, total_sale: 0, avg_variation: 0 }
}

function loadAll() {
  store.fetchAll({ month: selectedMonth.value, fuel_type: tabFuelType.value }).catch(() => {})
  store.fetchTankwise({ month: selectedMonth.value }).catch(() => {})
}

onMounted(() => loadAll())

function onTabChange() {
  store.fetchAll({ month: selectedMonth.value, fuel_type: tabFuelType.value }).catch(() => {})
}

watch(tab, () => onTabChange())

// ── Add modal ────────────────────────────────────────────────────
const showAdd = ref(false)
const form = reactive({
  date:'', fuelType:'MS', open:null, recv:null, close:null, sale:null, remarks:''
})

const calcNetStock  = computed(() => (form.open||0) + (form.recv||0))
const calcVariation = computed(() => (form.sale||0) - (calcNetStock.value - (form.close||0)))

function openAddModal() {
  form.date = new Date().toISOString().split('T')[0]
  form.fuelType = tabFuelType.value
  form.open = form.recv = form.close = form.sale = null
  form.remarks = ''
  showAdd.value = true
}

async function saveStock() {
  if (!form.date || form.open === null || form.close === null) {
    ui.error('Date, opening stock and closing stock are required'); return
  }
  try {
    await store.create({ ...form })
    showAdd.value = false
    ui.success('Stock entry added successfully!')
    store.fetchTankwise({ month: selectedMonth.value }).catch(() => {})
  } catch (e) {
    ui.error(e?.message || 'Failed to save stock entry.')
  }
}

// ── Edit modal ───────────────────────────────────────────────────
const showEdit = ref(false)
const editRow  = ref(null)

function openEditModal(r) {
  editRow.value = { ...r }
  showEdit.value = true
}

async function saveEdit() {
  if (!editRow.value?.id) return
  try {
    await store.update(editRow.value.id, { ...editRow.value, fuelType: tabFuelType.value })
    showEdit.value = false
    ui.success('Stock entry updated!')
    store.fetchTankwise({ month: selectedMonth.value }).catch(() => {})
  } catch (e) {
    ui.error(e?.message || 'Failed to update stock entry.')
  }
}

// ── Delete modal ─────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)

function openDeleteModal(r) { deleteTarget.value = r; showDelete.value = true }

async function confirmDelete() {
  if (!deleteTarget.value?.id) return
  try {
    await store.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Stock entry deleted!')
    store.fetchTankwise({ month: selectedMonth.value }).catch(() => {})
  } catch (e) {
    ui.error(e?.message || 'Failed to delete stock entry.')
  }
}

// ── Export / Print ───────────────────────────────────────────────
function doExport() {
  const headers = ['Date','Opening (L)','Received (L)','Net Stock (L)','Closing (L)','Actual Sale (L)','Variation (L)']
  const rows = store.records.map(r => [r.date, r.open, r.recv, r.net, r.close, r.sale, r.var])
  exportCSV(`${tabFuelType.value}_Stock_${selectedMonth.value}`, headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date','Opening','Received','Net Stock','Closing','Sale','Variation']
  const rows = store.records.map(r => [r.date, r.open, r.recv, r.net, r.close, r.sale, r.var])
  printTable(`${tabLabel.value} Stock — ${monthLabel.value}`, headers, rows)
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
