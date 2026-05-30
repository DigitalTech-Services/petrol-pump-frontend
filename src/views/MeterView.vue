<template>
  <div>
    <PageHeader title="Meter Readings" subtitle="Nozzle-wise opening & closing meters" :crumbs="['Home','Meter']">
      <template #actions>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openAddReading">＋ Add Reading</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Nozzles"    value="3 Active"       icon="🔴" color="#f59e0b" sub="MS-1 to MS-3"/>
      <KpiCard label="HSD Nozzles"   value="4 Active"       icon="🟢" color="#10b981" sub="HSD-1 to HSD-4"/>
      <KpiCard label="Speed Nozzles" value="4 Active"       icon="🔵" color="#3b82f6" sub="SP-1 to SP-4"/>
      <KpiCard label="Total MS Used" value="1,23,952 L"     icon="📊" color="#6366f1" sub="All nozzles Apr"/>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="font-display font-bold text-[15px] text-white">MS Nozzle Meter — April 2026</div>
        <span class="badge badge-ms ml-2">{{ meterData.length }} entries</span>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS-1 Open</th><th>MS-1 Close</th><th>MS-1 Used</th>
              <th>MS-2 Open</th><th>MS-2 Close</th><th>MS-2 Used</th>
              <th>MS-3 Open</th><th>MS-3 Close</th><th>MS-3 Used</th>
              <th>Day Total</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r,i) in meterData" :key="r.date">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms1c-r.ms1o) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms2c-r.ms2o) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms3c-r.ms3o) }}</span></td>
              <td class="amt text-[#f59e0b] font-bold">{{ fmt(r.total) }}</td>
              <td>
                <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEditReading(r)">✏️</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">TOTAL</td>
              <td>{{ fmt(meterData.reduce((a,r)=>a+(r.ms1c-r.ms1o),0)) }}</td>
              <td colspan="2">—</td>
              <td>{{ fmt(meterData.reduce((a,r)=>a+(r.ms2c-r.ms2o),0)) }}</td>
              <td colspan="2">—</td>
              <td>{{ fmt(meterData.reduce((a,r)=>a+(r.ms3c-r.ms3o),0)) }}</td>
              <td>{{ fmt(meterData.reduce((a,r)=>a+r.total,0)) }}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD METER READING MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Meter Reading" subtitle="Enter opening & closing meter for each nozzle" icon="📊" max-width="580px">
      <div class="mb-4">
        <label class="field-label">Reading Date *</label>
        <input type="date" v-model="meterForm.date" class="form-input w-full" />
      </div>
      <!-- Nozzle blocks -->
      <div v-for="nozzle in ['ms1','ms2','ms3']" :key="nozzle"
        class="p-4 rounded-xl mb-3" style="background:#161b24;border:1px solid #1c2230">
        <div class="flex items-center gap-2 mb-3">
          <span class="badge badge-ms">{{ nozzle.toUpperCase().replace('MS','MS-').replace('1','1').replace('2','2').replace('3','3') }}</span>
          <span class="text-[13px] font-medium text-white">Nozzle {{ nozzle.replace('ms','MS-') }}</span>
          <span class="ml-auto text-[12px] text-[#5a6a82]">Used: <span class="text-[#f59e0b] font-semibold">{{ fmt(Math.max(0,(meterForm[nozzle+'c']||0)-(meterForm[nozzle+'o']||0))) }} L</span></span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Opening Meter</label>
            <input type="number" step="0.01" v-model.number="meterForm[nozzle+'o']" class="form-input w-full" placeholder="0.00" />
          </div>
          <div>
            <label class="field-label">Closing Meter</label>
            <input type="number" step="0.01" v-model.number="meterForm[nozzle+'c']" class="form-input w-full" placeholder="0.00" />
          </div>
        </div>
      </div>
      <!-- Total preview -->
      <div class="p-3 rounded-lg flex justify-between mt-2" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2)">
        <span class="text-[13px] font-medium text-white">Total Day Consumption</span>
        <span class="font-display font-bold text-[18px] text-[#f59e0b]">{{ fmt(calcTotal) }} L</span>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveMeterReading" :disabled="saving">
            <span v-if="saving" class="animate-spin inline-block mr-1">⟳</span>💾 Save Reading
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT READING MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Meter Reading" icon="✏️" max-width="560px">
      <div class="space-y-4" v-if="editData">
        <div><label class="field-label">Date</label><input v-model="editData.date" class="form-input w-full" /></div>
        <div v-for="nozzle in ['ms1','ms2','ms3']" :key="nozzle"
          class="p-3 rounded-xl" style="background:#161b24;border:1px solid #1c2230">
          <div class="text-[12px] font-semibold text-[#f59e0b] mb-2">{{ nozzle.toUpperCase().replace('MS','MS-') }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="field-label">Opening</label><input type="number" step="0.01" v-model.number="editData[nozzle+'o']" class="form-input w-full" /></div>
            <div><label class="field-label">Closing</label><input type="number" step="0.01" v-model.number="editData[nozzle+'c']" class="form-input w-full" /></div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEdit">💾 Update</button>
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

const ui      = useUiStore()
const showAdd  = ref(false)
const showEdit = ref(false)
const editData = ref(null)
const saving   = ref(false)

const meterForm = reactive({ date:'', ms1o:null, ms1c:null, ms2o:null, ms2c:null, ms3o:null, ms3c:null })
const calcTotal = computed(() =>
  Math.max(0,(meterForm.ms1c||0)-(meterForm.ms1o||0)) +
  Math.max(0,(meterForm.ms2c||0)-(meterForm.ms2o||0)) +
  Math.max(0,(meterForm.ms3c||0)-(meterForm.ms3o||0))
)

function openAddReading() {
  meterForm.date = new Date().toISOString().split('T')[0]
  meterForm.ms1o = meterForm.ms1c = meterForm.ms2o = meterForm.ms2c = meterForm.ms3o = meterForm.ms3c = null
  showAdd.value = true
}

function openEditReading(r) { editData.value = { ...r }; showEdit.value = true }

async function saveMeterReading() {
  if (!meterForm.date) { ui.error('Date is required'); return }
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  meterData.push({
    date: meterForm.date,
    ms1o: meterForm.ms1o||0, ms1c: meterForm.ms1c||0,
    ms2o: meterForm.ms2o||0, ms2c: meterForm.ms2c||0,
    ms3o: meterForm.ms3o||0, ms3c: meterForm.ms3c||0,
    total: calcTotal.value,
  })
  saving.value = false
  showAdd.value = false
  ui.success('Meter reading saved!')
}

function saveEdit() {
  const i = meterData.findIndex(r => r.date === editData.value.date)
  if (i !== -1) {
    const d = editData.value
    d.total = (d.ms1c-d.ms1o) + (d.ms2c-d.ms2o) + (d.ms3c-d.ms3o)
    meterData[i] = { ...d }
  }
  showEdit.value = false
  ui.success('Meter reading updated!')
}

function doExport() {
  const headers = ['Date','MS1-Open','MS1-Close','MS1-Used','MS2-Open','MS2-Close','MS2-Used','MS3-Open','MS3-Close','MS3-Used','Total']
  const rows = meterData.map(r => [r.date, r.ms1o, r.ms1c, fmt(r.ms1c-r.ms1o), r.ms2o, r.ms2c, fmt(r.ms2c-r.ms2o), r.ms3o, r.ms3c, fmt(r.ms3c-r.ms3o), r.total])
  exportCSV('Meter_Readings_April2026', headers, rows)
  ui.success('CSV exported!')
}

function doPrint() {
  const headers = ['Date','MS-1 Used','MS-2 Used','MS-3 Used','Day Total']
  const rows = meterData.map(r => [r.date, fmt(r.ms1c-r.ms1o), fmt(r.ms2c-r.ms2o), fmt(r.ms3c-r.ms3o), fmt(r.total)])
  printTable('MS Meter Readings — April 2026', headers, rows)
}

const meterData = reactive([
  {date:'01 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:253427.84,ms2c:254118.90,ms3o:336102.26,ms3c:337120.24,total:3130.11},
  {date:'02 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:254118.90,ms2c:254633.36,ms3o:337120.24,ms3c:338229.55,total:3202.38},
  {date:'03 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:254633.36,ms2c:255516.83,ms3o:338229.55,ms3c:339049.72,total:3729.09},
  {date:'04 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:255516.83,ms2c:255709.61,ms3o:339049.72,ms3c:340078.13,total:3589.91},
  {date:'05 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:255709.61,ms2c:256335.81,ms3o:340078.13,ms3c:340859.01,total:3634.32},
  {date:'06 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:256335.81,ms2c:256926.46,ms3o:340859.01,ms3c:342292.00,total:3959.95},
  {date:'07 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:256926.46,ms2c:257714.74,ms3o:342292.00,ms3c:343710.92,total:3933.40},
  {date:'08 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:257714.74,ms2c:258378.23,ms3o:343710.92,ms3c:345278.61,total:3861.98},
  {date:'09 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:258378.23,ms2c:258980.45,ms3o:345278.61,ms3c:346784.65,total:4160.60},
  {date:'10 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:258980.45,ms2c:259772.00,ms3o:346784.65,ms3c:347842.03,total:4082.55},
  {date:'11 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:259772.00,ms2c:260267.82,ms3o:347842.03,ms3c:349121.91,total:4057.09},
  {date:'12 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:260267.82,ms2c:261338.09,ms3o:349121.91,ms3c:351014.65,total:4476.28},
  {date:'13 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:261338.09,ms2c:262632.79,ms3o:351014.65,ms3c:352222.93,total:4439.22},
  {date:'14 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:262632.79,ms2c:264376.02,ms3o:352222.93,ms3c:353208.66,total:3834.12},
  {date:'15 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:264376.02,ms2c:265422.57,ms3o:353208.66,ms3c:354926.72,total:4841.00},
])
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
