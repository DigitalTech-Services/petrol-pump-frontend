<template>
  <div>
    <PageHeader title="Petrol Sales" subtitle="All daily sale records — April 2026" :crumbs="['Home','Sales']">
      <template #actions>
        <button class="btn btn-ghost" @click="doExport">📥 Export CSV</button>
        <button class="btn btn-ghost" @click="doPrint">🖨 Print</button>
        <button class="btn btn-primary" @click="openAdd">＋ New Sale Entry</button>
      </template>
    </PageHeader>

    <!-- Summary Stats -->
    <StatRow :stats="summaryStats" class="mb-6" />

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="form-input" placeholder="🔍 Search narration, date…" style="min-width:220px" />
      <select v-model="sortKey" class="form-select">
        <option value="">Sort: Default</option>
        <option value="revenue">Revenue ↓</option>
        <option value="ms">MS Volume ↓</option>
        <option value="expenses">Expenses ↓</option>
      </select>
      <span class="self-center text-[12px] text-[#5a6a82] ml-auto">{{ filtered.length }} records</span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Rate MS</th><th>Revenue (₹)</th><th>Cash (₹)</th>
              <th>PhonePe (₹)</th><th>Card (₹)</th>
              <th>Expenses</th><th>Balance</th><th>Narration</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r,i) in filtered" :key="r.date+i">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i+1 }}</td>
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td><span class="badge badge-ms">{{ fmt(r.ms) }}</span></td>
              <td><span class="badge badge-hsd">{{ fmt(r.hsd) }}</span></td>
              <td><span class="badge badge-speed">{{ fmt(r.speed) }}</span></td>
              <td class="font-mono-custom text-[12px]">{{ r.rateMS }}</td>
              <td class="amt text-[#f59e0b]">{{ fmt(r.revenue) }}</td>
              <td class="amt text-positive">{{ fmt(r.cash) }}</td>
              <td class="amt text-[#6366f1]">{{ fmt(r.phonepay) }}</td>
              <td class="amt text-[#3b82f6]">{{ r.card > 0 ? fmt(r.card) : '—' }}</td>
              <td class="amt text-negative">{{ fmt(r.exp) }}</td>
              <td class="amt text-[#f59e0b]">{{ fmt(r.balance) }}</td>
              <td><div class="text-[11.5px] text-[#5a6a82] truncate max-w-[160px]" :title="r.narration">{{ r.narration }}</div></td>
              <td>
                <div class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(r)">✏️</button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(r,i)">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filtered.length">
            <tr>
              <td colspan="2">TOTAL ({{ filtered.length }} days)</td>
              <td>{{ fmt(totals.ms) }}</td>
              <td>{{ fmt(totals.hsd) }}</td>
              <td>{{ fmt(totals.speed) }}</td>
              <td>—</td>
              <td>{{ fmt(totals.revenue) }}</td>
              <td>{{ fmt(totals.cash) }}</td>
              <td>{{ fmt(totals.phonepay) }}</td>
              <td>{{ fmt(totals.card) }}</td>
              <td>{{ fmt(totals.exp) }}</td>
              <td colspan="3">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ═══ ADD SALE MODAL ═══ -->
    <AppModal v-model="showAdd" title="New Sale Entry" subtitle="Enter daily fuel sale data" icon="⛽" max-width="640px">
      <div class="space-y-5">

        <!-- Row 1: Date & Shift -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Sale Date *</label>
            <input type="date" v-model="saleForm.date" class="form-input w-full" required />
          </div>
          <div>
            <label class="field-label">Shift</label>
            <select v-model="saleForm.shift" class="form-select w-full">
              <option>Morning</option><option>Evening</option><option>Night</option><option>Full Day</option>
            </select>
          </div>
        </div>

        <!-- Row 2: MS -->
        <div class="p-4 rounded-xl" style="background:#161b24;border:1px solid rgba(245,158,11,0.2)">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-ms">MS Petrol</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="field-label">Volume (L)</label><input type="number" step="0.01" v-model.number="saleForm.ms" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">Rate (₹/L)</label><input type="number" step="0.01" v-model.number="saleForm.rateMS" class="form-input w-full" placeholder="104.77" @input="recalc" /></div>
          </div>
        </div>

        <!-- Row 3: HSD -->
        <div class="p-4 rounded-xl" style="background:#161b24;border:1px solid rgba(16,185,129,0.2)">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-hsd">HSD Diesel</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="field-label">Volume (L)</label><input type="number" step="0.01" v-model.number="saleForm.hsd" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">Rate (₹/L)</label><input type="number" step="0.01" v-model.number="saleForm.rateHSD" class="form-input w-full" placeholder="91.28" @input="recalc" /></div>
          </div>
        </div>

        <!-- Row 4: Speed -->
        <div class="p-4 rounded-xl" style="background:#161b24;border:1px solid rgba(59,130,246,0.2)">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-speed">Speed Premium</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="field-label">Volume (L)</label><input type="number" step="0.01" v-model.number="saleForm.speed" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">Rate (₹/L)</label><input type="number" step="0.01" v-model.number="saleForm.rateSpeed" class="form-input w-full" placeholder="113.85" @input="recalc" /></div>
          </div>
        </div>

        <!-- Row 5: Collections -->
        <div class="p-4 rounded-xl" style="background:#161b24;border:1px solid #1c2230">
          <div class="text-[12px] font-semibold text-white mb-3">💰 Collections</div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="field-label">Cash (₹)</label><input type="number" step="0.01" v-model.number="saleForm.cash" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">PhonePe (₹)</label><input type="number" step="0.01" v-model.number="saleForm.phonepay" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">Card (₹)</label><input type="number" step="0.01" v-model.number="saleForm.card" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div><label class="field-label">Expenses (₹)</label><input type="number" step="0.01" v-model.number="saleForm.exp" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
            <div><label class="field-label">Credit Sale (₹)</label><input type="number" step="0.01" v-model.number="saleForm.credit" class="form-input w-full" placeholder="0.00" @input="recalc" /></div>
          </div>
        </div>

        <!-- Live Calculated Preview -->
        <div class="grid grid-cols-2 gap-3 p-4 rounded-xl" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2)">
          <div>
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Gross Revenue</div>
            <div class="font-display font-bold text-[20px] text-[#f59e0b]">₹{{ fmt(calcRevenue) }}</div>
          </div>
          <div>
            <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Cash Balance</div>
            <div class="font-display font-bold text-[20px]" :class="calcBalance>=0?'text-positive':'text-negative'">₹{{ fmt(calcBalance) }}</div>
          </div>
        </div>

        <!-- Narration -->
        <div>
          <label class="field-label">Narration / Notes</label>
          <textarea v-model="saleForm.narration" class="form-input w-full" rows="2" placeholder="Employee short, tanker, tea, expenses detail…" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveSale" :disabled="saving">
            <span v-if="saving" class="animate-spin inline-block mr-1">⟳</span>💾 Save Sale Entry
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Sale Entry" icon="✏️" max-width="640px">
      <div class="space-y-4" v-if="editData">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date</label><input type="text" v-model="editData.date" class="form-input w-full" /></div>
          <div><label class="field-label">Shift</label>
            <select v-model="editData.shift" class="form-select w-full"><option>Morning</option><option>Evening</option><option>Full Day</option></select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="field-label">MS Volume (L)</label><input type="number" step="0.01" v-model.number="editData.ms" class="form-input w-full" @input="recalcEdit" /></div>
          <div><label class="field-label">HSD Volume (L)</label><input type="number" step="0.01" v-model.number="editData.hsd" class="form-input w-full" @input="recalcEdit" /></div>
          <div><label class="field-label">Speed Volume (L)</label><input type="number" step="0.01" v-model.number="editData.speed" class="form-input w-full" @input="recalcEdit" /></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="field-label">Cash (₹)</label><input type="number" step="0.01" v-model.number="editData.cash" class="form-input w-full" @input="recalcEdit" /></div>
          <div><label class="field-label">PhonePe (₹)</label><input type="number" step="0.01" v-model.number="editData.phonepay" class="form-input w-full" @input="recalcEdit" /></div>
          <div><label class="field-label">Expenses (₹)</label><input type="number" step="0.01" v-model.number="editData.exp" class="form-input w-full" @input="recalcEdit" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3 p-3 rounded-lg" style="background:#161b24">
          <div>
            <div class="text-[11px] text-[#5a6a82] mb-1">Revenue</div>
            <div class="font-display font-bold text-[16px] text-[#f59e0b]">₹{{ fmt((editData.ms||0)*editData.rateMS+(editData.hsd||0)*editData.rateHSD+(editData.speed||0)*editData.rateSpeed) }}</div>
          </div>
          <div>
            <div class="text-[11px] text-[#5a6a82] mb-1">Balance</div>
            <div class="font-display font-bold text-[16px] text-positive">₹{{ fmt((editData.cash||0)+(editData.phonepay||0)-(editData.exp||0)) }}</div>
          </div>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="editData.narration" class="form-input w-full" rows="2" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8" @click="saveEdit">💾 Update Sale</button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Sale Record" icon="⚠️" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-[14px] text-[#e8edf5] mb-2">
          Delete sale record for <span class="text-[#f59e0b] font-bold">{{ deleteTarget.date }}</span>?
        </p>
        <p class="text-[13px] text-[#8a9ab5]">Revenue: <span class="text-positive">₹{{ fmt(deleteTarget.revenue) }}</span></p>
        <p class="text-[12px] text-negative mt-3">This cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete=false">Cancel</button>
          <button class="btn btn-danger px-8" @click="confirmDelete">🗑 Delete</button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatRow    from '@/components/ui/StatRow.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt }    from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const showAdd    = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const saving     = ref(false)
const editData   = ref(null)
const deleteTarget = ref(null)
const search  = ref('')
const sortKey = ref('')

const saleForm = reactive({
  date:'', shift:'Full Day',
  ms:null, rateMS:104.77, hsd:null, rateHSD:91.28, speed:null, rateSpeed:113.85,
  cash:null, phonepay:null, card:null, exp:null, credit:null, narration:''
})

const calcRevenue = computed(() =>
  (saleForm.ms||0)*saleForm.rateMS + (saleForm.hsd||0)*saleForm.rateHSD + (saleForm.speed||0)*saleForm.rateSpeed
)
const calcBalance = computed(() =>
  (saleForm.cash||0) + (saleForm.phonepay||0) + (saleForm.card||0) - (saleForm.exp||0)
)
const recalc = () => {}
const recalcEdit = () => {}

const salesData = reactive([
  {date:'01 Apr',shift:'Full Day',ms:3130.11,hsd:1030.26,speed:54.34,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:428170,cash:172823,phonepay:255347,card:0,   exp:1086, credit:0,balance:427084,narration:'Employee Short + Density + Tea'},
  {date:'02 Apr',shift:'Full Day',ms:3202.38,hsd:1372.5, speed:71.47,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:468932,cash:127340,phonepay:341592,card:0,   exp:3832, credit:0,balance:465100,narration:'Employee Short + Tea + DG Diesel + Snacks'},
  {date:'03 Apr',shift:'Full Day',ms:3729.09,hsd:1251.57,speed:57.35,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:511469,cash:190913,phonepay:315556,card:5000,exp:1963, credit:0,balance:509506,narration:'Employee Short + Juice + Tea + Ghanta gadi'},
  {date:'04 Apr',shift:'Full Day',ms:3589.91,hsd:1304.5, speed:319.41, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:531554,cash:196960,phonepay:334594,card:0,   exp:6687, credit:0,balance:524867,narration:'Employee Short + Water Jar + Stationary'},
  {date:'05 Apr',shift:'Full Day',ms:3634.32,hsd:1372.84,speed:75.21,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:514643,cash:162142,phonepay:352501,card:0,   exp:708,  credit:0,balance:513935,narration:'Employee Short + Tea'},
  {date:'06 Apr',shift:'Full Day',ms:3959.95,hsd:1396.76,speed:70.79,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:550439,cash:238538,phonepay:311901,card:0,   exp:615,  credit:0,balance:549824,narration:'Employee Short + Tea'},
  {date:'07 Apr',shift:'Full Day',ms:3933.4, hsd:1231.62,speed:127.43, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:539032,cash:204133,phonepay:334899,card:0,   exp:1108, credit:0,balance:537924,narration:'Employee Short + Tanker + Xerox'},
  {date:'08 Apr',shift:'Full Day',ms:3861.98,hsd:1664.85,speed:79.96,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:565690,cash:205368,phonepay:360322,card:0,   exp:1729, credit:0,balance:563961,narration:'Employee Short + Tea'},
  {date:'09 Apr',shift:'Full Day',ms:4160.6, hsd:1160.63,speed:134.03, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:557107,cash:236839,phonepay:320268,card:0,   exp:9153, credit:0,balance:547954,narration:'Employee Short + Air Machine Pipe + Fabrication'},
  {date:'10 Apr',shift:'Full Day',ms:4082.55,hsd:1360.76,speed:150.26, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:569046,cash:193637,phonepay:375409,card:0,   exp:23777,credit:0,balance:545269,narration:'Employee Short + Tanker + Tea + Petrol'},
  {date:'11 Apr',shift:'Full Day',ms:4057.09,hsd:1687.96,speed:203.93, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:602355,cash:220912,phonepay:381443,card:0,   exp:3722, credit:0,balance:598633,narration:'Employee Short + Ghanta Gadi + Light Electrician'},
  {date:'12 Apr',shift:'Full Day',ms:4476.28,hsd:1611.87,speed:121.44, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:629937,cash:206413,phonepay:423524,card:0,   exp:3124, credit:0,balance:626813,narration:'Employee short + Tea + DG Diesel + Water Bottle'},
  {date:'13 Apr',shift:'Full Day',ms:4439.22,hsd:1771.0, speed:181.11, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:647373,cash:248322,phonepay:399051,card:0,   exp:2119, credit:0,balance:645254,narration:'Employee Short + Jayesh Advance + Tea'},
  {date:'14 Apr',shift:'Full Day',ms:3834.12,hsd:1347.15,speed:294.52, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:558199,cash:211239,phonepay:346960,card:0,   exp:1171, credit:0,balance:557028,narration:'Employee Short + Tea + Tanker'},
  {date:'15 Apr',shift:'Full Day',ms:4841.0, hsd:1674.51,speed:233.38, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:686611,cash:256263,phonepay:430348,card:0,   exp:709,  credit:0,balance:685902,narration:'Employee Short + Tea + Tanker'},
  {date:'16 Apr',shift:'Full Day',ms:4773.47,hsd:1747.84,speed:72.56,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:667920,cash:241950,phonepay:425970,card:0,   exp:1328, credit:0,balance:666592,narration:'Employee short + Tea'},
  {date:'17 Apr',shift:'Full Day',ms:4000.9, hsd:1346.9, speed:191.65, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:563938,cash:222925,phonepay:341013,card:0,   exp:13383,credit:0,balance:550555,narration:'Employee Short + Dhanu + LED light'},
  {date:'18 Apr',shift:'Full Day',ms:4822.21,hsd:2153.61,speed:112.72, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:714637,cash:263225,phonepay:451412,card:0,   exp:2033, credit:0,balance:712604,narration:'Employee Short + Light Fitting + Tea'},
  {date:'19 Apr',shift:'Full Day',ms:4363.93,hsd:1649.06,speed:155.25, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:625410,cash:213349,phonepay:412061,card:0,   exp:1399, credit:0,balance:624011,narration:'Employee Short + Tea + Lock + Tanker'},
  {date:'20 Apr',shift:'Full Day',ms:4893.98,hsd:2213.95,speed:88.96,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:724959,cash:228345,phonepay:496614,card:0,   exp:6207, credit:0,balance:718752,narration:'Pooja Tailor + Ajay Adv + Employee Short + Tea'},
  {date:'21 Apr',shift:'Full Day',ms:4596.56,hsd:2096.29,speed:292.1,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:706186,cash:264293,phonepay:441893,card:0,   exp:5419, credit:0,balance:700767,narration:'Employee Short + DG Diesel + Tea + Shoes'},
  {date:'22 Apr',shift:'Full Day',ms:4739.08,hsd:1858.25,speed:171.08, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:685611,cash:246477,phonepay:434134,card:5000,exp:866,  credit:200,balance:684545,narration:'Employee Short + Avasthi + Tea'},
  {date:'23 Apr',shift:'Full Day',ms:4664.94,hsd:2261.97,speed:133.64, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:710433,cash:256209,phonepay:454224,card:0,   exp:1001, credit:0,balance:709432,narration:'Water + Employee Short + Tanker'},
  {date:'24 Apr',shift:'Full Day',ms:5083.6, hsd:1965.8, speed:71.25,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:720158,cash:281123,phonepay:439035,card:0,   exp:16600,credit:0,balance:703558,narration:'Santosh Advance + Tea'},
  {date:'25 Apr',shift:'Full Day',ms:3612.45,hsd:1831.2, speed:720.21, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:627624,cash:242231,phonepay:385393,card:0,   exp:18049,credit:0,balance:609575,narration:'Fabrication + Tanker + Dhanu Petrol + Tea'},
  {date:'26 Apr',shift:'Full Day',ms:4989.38,hsd:2313.09,speed:156.11, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:751649,cash:263357,phonepay:488292,card:0,   exp:1984, credit:0,balance:749665,narration:'Employee Short + Tea'},
  {date:'27 Apr',shift:'Full Day',ms:1598.38,hsd:1887.17,speed:947.01, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:447540,cash:167317,phonepay:280223,card:0,   exp:2100, credit:0,balance:445440,narration:'Employee Short + Tea + Paint'},
  {date:'28 Apr',shift:'Full Day',ms:4136.39,hsd:2091.03,speed:94.34,  rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:634979,cash:232688,phonepay:402291,card:0,   exp:3482, credit:0,balance:631497,narration:'Employee Short + Tea + Tanker'},
  {date:'29 Apr',shift:'Full Day',ms:4397.51,hsd:1806.19,speed:211.62, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:649689,cash:258415,phonepay:391274,card:0,   exp:856,  credit:0,balance:648833,narration:'Employee Short + Tea'},
  {date:'30 Apr',shift:'Full Day',ms:4347.08,hsd:2014.27,speed:135.35, rateMS:104.77,rateHSD:91.28,rateSpeed:113.85,revenue:654715,cash:243090,phonepay:411625,card:0,   exp:1342, credit:0,balance:653373,narration:'Employee Short + DG Diesel + Tea'},
])

const filtered = computed(() => {
  let d = [...salesData]
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(r => r.narration.toLowerCase().includes(q) || r.date.toLowerCase().includes(q))
  }
  if (sortKey.value === 'revenue')  d.sort((a,b)=>b.revenue-a.revenue)
  if (sortKey.value === 'ms')       d.sort((a,b)=>b.ms-a.ms)
  if (sortKey.value === 'expenses') d.sort((a,b)=>b.exp-a.exp)
  return d
})

const totals = computed(() => ({
  ms:       filtered.value.reduce((a,r)=>a+r.ms,0),
  hsd:      filtered.value.reduce((a,r)=>a+r.hsd,0),
  speed:    filtered.value.reduce((a,r)=>a+r.speed,0),
  revenue:  filtered.value.reduce((a,r)=>a+r.revenue,0),
  cash:     filtered.value.reduce((a,r)=>a+r.cash,0),
  phonepay: filtered.value.reduce((a,r)=>a+r.phonepay,0),
  card:     filtered.value.reduce((a,r)=>a+r.card,0),
  exp:      filtered.value.reduce((a,r)=>a+r.exp,0),
}))

const summaryStats = computed(() => [
  {label:'Total Revenue',  value:'₹'+fmt(totals.value.revenue,0),  sub:'30 days', class:'text-[#f59e0b]'},
  {label:'Total Cash',     value:'₹'+fmt(totals.value.cash,0),     sub:'Collected', class:'text-positive'},
  {label:'Total PhonePe',  value:'₹'+fmt(totals.value.phonepay,0), sub:'UPI', class:'text-[#6366f1]'},
  {label:'Total Expenses', value:'₹'+fmt(totals.value.exp,0),      sub:'All days', class:'text-negative'},
])

function openAdd() {
  saleForm.date = new Date().toISOString().split('T')[0]
  saleForm.shift='Full Day'; saleForm.ms=null; saleForm.hsd=null; saleForm.speed=null
  saleForm.cash=null; saleForm.phonepay=null; saleForm.card=null; saleForm.exp=null; saleForm.credit=null; saleForm.narration=''
  showAdd.value = true
}
function openEdit(r)   { editData.value = {...r}; showEdit.value = true }
function openDelete(r) { deleteTarget.value = r;  showDelete.value = true }

async function saveSale() {
  if (!saleForm.date || (!saleForm.ms && !saleForm.hsd && !saleForm.speed)) {
    ui.error('Date and at least one fuel volume required'); return
  }
  saving.value = true
  await new Promise(r=>setTimeout(r,600))
  salesData.push({
    date: saleForm.date, shift: saleForm.shift,
    ms: saleForm.ms||0, hsd: saleForm.hsd||0, speed: saleForm.speed||0,
    rateMS: saleForm.rateMS, rateHSD: saleForm.rateHSD, rateSpeed: saleForm.rateSpeed,
    revenue: calcRevenue.value,
    cash: saleForm.cash||0, phonepay: saleForm.phonepay||0, card: saleForm.card||0,
    exp: saleForm.exp||0, credit: saleForm.credit||0,
    balance: calcBalance.value, narration: saleForm.narration,
  })
  salesData.sort((a,b)=>a.date.localeCompare(b.date))
  saving.value = false; showAdd.value = false
  ui.success('Sale entry saved!')
}

function saveEdit() {
  const i = salesData.findIndex(r=>r.date===editData.value.date)
  if (i!==-1) {
    const d = editData.value
    d.revenue = (d.ms||0)*d.rateMS + (d.hsd||0)*d.rateHSD + (d.speed||0)*d.rateSpeed
    d.balance = (d.cash||0) + (d.phonepay||0) - (d.exp||0)
    salesData[i] = {...d}
  }
  showEdit.value = false; ui.success('Sale updated!')
}

function confirmDelete() {
  const i = salesData.findIndex(r=>r.date===deleteTarget.value.date)
  if (i!==-1) salesData.splice(i,1)
  showDelete.value = false; ui.success('Sale record deleted!')
}

function doExport() {
  const headers = ['Date','Shift','MS(L)','HSD(L)','Speed(L)','Revenue','Cash','PhonePe','Card','Expenses','Balance','Narration']
  const rows = salesData.map(r=>[r.date,r.shift,r.ms,r.hsd,r.speed,r.revenue,r.cash,r.phonepay,r.card,r.exp,r.balance,r.narration])
  exportCSV('Petrol_Sales_April2026', headers, rows)
  ui.success('CSV exported!')
}
function doPrint() {
  const headers = ['Date','MS(L)','HSD(L)','Speed(L)','Revenue','Cash','PhonePe','Expenses','Balance']
  const rows = filtered.value.map(r=>[r.date,fmt(r.ms),fmt(r.hsd),fmt(r.speed),'₹'+fmt(r.revenue),'₹'+fmt(r.cash),'₹'+fmt(r.phonepay),'₹'+fmt(r.exp),'₹'+fmt(r.balance)])
  printTable('Petrol Sales Register — April 2026', headers, rows)
}
</script>

<style scoped>
.field-label{display:block;font-size:11.5px;color:#8a9ab5;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
</style>
