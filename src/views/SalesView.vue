<template>
  <div>
    <PageHeader title="Petrol Sales" subtitle="All daily sale records" :crumbs="['Home','Sales']">
      <template #actions>
        <button class="btn btn-ghost" @click="exportExcel">📥 Excel</button>
        <button class="btn btn-ghost" @click="exportPdf">📄 PDF</button>
        <RouterLink to="/sales/new" class="btn btn-primary">＋ New Entry</RouterLink>
      </template>
    </PageHeader>

    <!-- Stat Row -->
    <StatRow :stats="summaryStats" :loading="store.loading" class="mb-6" />

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" class="form-input" placeholder="🔍 Search narration, date..." style="min-width:220px" />
      <select v-model="sortKey" class="form-select">
        <option value="date">Sort: Date</option>
        <option value="revenue">Revenue ↓</option>
        <option value="ms">MS Volume ↓</option>
        <option value="expenses">Expenses ↓</option>
      </select>
      <span class="ml-auto text-[12px] text-[#5a6a82] self-center">{{ filtered.length }} records</span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Rate MS</th><th>Rate HSD</th>
              <th>Revenue (₹)</th><th>Cash (₹)</th>
              <th>Card (₹)</th><th>PhonePe (₹)</th>
              <th>Expenses</th><th>Credit</th><th>Balance</th><th>Narration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="store.loading">
              <tr v-for="i in 10" :key="i">
                <td v-for="j in 16" :key="j"><div class="skeleton h-4 rounded w-16" /></td>
              </tr>
            </template>
            <template v-else-if="!filtered.length">
              <tr><td colspan="16" class="text-center py-16 text-[#5a6a82]">
                <div class="text-4xl mb-3">📭</div><div>No records found</div>
              </td></tr>
            </template>
            <template v-else>
              <tr v-for="(r, i) in filtered" :key="r._id || r.date">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.saleDate || r.date }}</span></td>
                <td><span class="badge badge-ms">{{ fmt(r.msVolume || r.ms) }}</span></td>
                <td><span class="badge badge-hsd">{{ fmt(r.hsdVolume || r.hsd) }}</span></td>
                <td><span class="badge badge-speed">{{ fmt(r.speedVolume || r.speed) }}</span></td>
                <td class="font-mono-custom text-[12px]">{{ r.msRate || r.rateMS }}</td>
                <td class="font-mono-custom text-[12px]">{{ r.hsdRate || r.rateHSD }}</td>
                <td class="amt text-[#f59e0b]">{{ fmt(r.revenue) }}</td>
                <td class="amt text-positive">{{ fmt(r.cash) }}</td>
                <td class="amt text-[#3b82f6]">{{ (r.card || r.cardSale) > 0 ? fmt(r.card || r.cardSale) : '—' }}</td>
                <td class="amt text-[#6366f1]">{{ fmt(r.phonePe || r.phonepay) }}</td>
                <td class="amt text-negative">{{ fmt(r.expenses || r.exp) }}</td>
                <td class="amt text-[#ef4444]">{{ (r.creditSale || r.credit) > 0 ? fmt(r.creditSale || r.credit) : '—' }}</td>
                <td class="amt text-[#f59e0b]">{{ fmt(r.balance) }}</td>
                <td class="max-w-[180px]">
                  <div class="text-[11.5px] text-[#5a6a82] truncate" :title="r.narration">{{ r.narration }}</div>
                </td>
                <td>
                  <div class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="editRow(r)">✏️</button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="deleteRow(r)">🗑</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot v-if="filtered.length">
            <tr>
              <td colspan="2">TOTAL ({{ filtered.length }} days)</td>
              <td>{{ fmt(totals.ms) }}</td>
              <td>{{ fmt(totals.hsd) }}</td>
              <td>{{ fmt(totals.speed) }}</td>
              <td colspan="2">—</td>
              <td>{{ fmt(totals.revenue) }}</td>
              <td>{{ fmt(totals.cash) }}</td>
              <td>{{ fmt(totals.card) }}</td>
              <td>{{ fmt(totals.phone) }}</td>
              <td>{{ fmt(totals.exp) }}</td>
              <td>{{ fmt(totals.credit) }}</td>
              <td colspan="3">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useUiStore }    from '@/stores/ui'
import { salesApi }      from '@/services/api'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatRow    from '@/components/ui/StatRow.vue'
import { fmt }    from '@/utils/format'

const store = useSalesStore()
const ui    = useUiStore()
const search  = ref('')
const sortKey = ref('date')

onMounted(() => store.fetchAll())

// Fallback static data when API not yet connected
const STATIC = [
  {date:'01 Apr',ms:3130.11,hsd:1030.26,speed:54.34,  rateMS:104.77,rateHSD:91.28,revenue:428170,cash:172823,phonepay:255347,exp:1086, credit:0,balance:427084,narration:'Employee Short +Density + Tea'},
  {date:'02 Apr',ms:3202.38,hsd:1372.5, speed:71.47,  rateMS:104.77,rateHSD:91.28,revenue:468932,cash:127340,phonepay:341592,exp:3832, credit:0,balance:465100,narration:'Employee Short + Tea + DG Diesel'},
  {date:'03 Apr',ms:3729.09,hsd:1251.57,speed:57.35,  rateMS:104.77,rateHSD:91.28,revenue:511469,cash:190913,phonepay:315556,exp:1963, credit:0,balance:509506,narration:'Employee Short + Juice + Tea'},
  {date:'04 Apr',ms:3589.91,hsd:1304.5, speed:319.41, rateMS:104.77,rateHSD:91.28,revenue:531554,cash:196960,phonepay:334594,exp:6687, credit:0,balance:524867,narration:'Employee Short + Water Jar + Stationary'},
  {date:'05 Apr',ms:3634.32,hsd:1372.84,speed:75.21,  rateMS:104.77,rateHSD:91.28,revenue:514643,cash:162142,phonepay:352501,exp:708,  credit:0,balance:513935,narration:'Employee Short + Tea'},
  {date:'06 Apr',ms:3959.95,hsd:1396.76,speed:70.79,  rateMS:104.77,rateHSD:91.28,revenue:550439,cash:238538,phonepay:311901,exp:615,  credit:0,balance:549824,narration:'Employee Short + Tea'},
  {date:'07 Apr',ms:3933.4, hsd:1231.62,speed:127.43, rateMS:104.77,rateHSD:91.28,revenue:539032,cash:204133,phonepay:334899,exp:1108, credit:0,balance:537924,narration:'Employee Short + Tanker + Xerox'},
  {date:'08 Apr',ms:3861.98,hsd:1664.85,speed:79.96,  rateMS:104.77,rateHSD:91.28,revenue:565690,cash:205368,phonepay:360322,exp:1729, credit:0,balance:563961,narration:'Employee Short + Tea'},
  {date:'09 Apr',ms:4160.6, hsd:1160.63,speed:134.03, rateMS:104.77,rateHSD:91.28,revenue:557107,cash:236839,phonepay:320268,exp:9153, credit:0,balance:547954,narration:'Employee Short + Air Machine Pipe'},
  {date:'10 Apr',ms:4082.55,hsd:1360.76,speed:150.26, rateMS:104.77,rateHSD:91.28,revenue:569046,cash:193637,phonepay:375409,exp:23777,credit:0,balance:545269,narration:'Employee Short + Tanker + Tea + Petrol'},
  {date:'11 Apr',ms:4057.09,hsd:1687.96,speed:203.93, rateMS:104.77,rateHSD:91.28,revenue:602355,cash:220912,phonepay:381443,exp:3722, credit:0,balance:598633,narration:'Employee Short + Ghanta Gadi + Stationary'},
  {date:'12 Apr',ms:4476.28,hsd:1611.87,speed:121.44, rateMS:104.77,rateHSD:91.28,revenue:629937,cash:206413,phonepay:423524,exp:3124, credit:0,balance:626813,narration:'Employee Short + Tea + DG Diesel'},
  {date:'13 Apr',ms:4439.22,hsd:1771.0, speed:181.11, rateMS:104.77,rateHSD:91.28,revenue:647373,cash:248322,phonepay:399051,exp:2119, credit:0,balance:645254,narration:'Employee Short + Jayesh Advance + Tea'},
  {date:'14 Apr',ms:3834.12,hsd:1347.15,speed:294.52, rateMS:104.77,rateHSD:91.28,revenue:558199,cash:211239,phonepay:346960,exp:1171, credit:0,balance:557028,narration:'Employee Short + Tea + Tanker'},
  {date:'15 Apr',ms:4841.0, hsd:1674.51,speed:233.38, rateMS:104.77,rateHSD:91.28,revenue:686611,cash:256263,phonepay:430348,exp:709,  credit:0,balance:685902,narration:'Employee Short + Tea + Tanker'},
  {date:'16 Apr',ms:4773.47,hsd:1747.84,speed:72.56,  rateMS:104.77,rateHSD:91.28,revenue:667920,cash:241950,phonepay:425970,exp:1328, credit:0,balance:666592,narration:'Employee Short + Tea'},
  {date:'17 Apr',ms:4000.9, hsd:1346.9, speed:191.65, rateMS:104.77,rateHSD:91.28,revenue:563938,cash:222925,phonepay:341013,exp:13383,credit:0,balance:550555,narration:'Employee Short + Dhanu + LED light'},
  {date:'18 Apr',ms:4822.21,hsd:2153.61,speed:112.72, rateMS:104.77,rateHSD:91.28,revenue:714637,cash:263225,phonepay:451412,exp:2033, credit:0,balance:712604,narration:'Employee Short + Light Fitting + Tea'},
  {date:'19 Apr',ms:4363.93,hsd:1649.06,speed:155.25, rateMS:104.77,rateHSD:91.28,revenue:625410,cash:213349,phonepay:412061,exp:1399, credit:0,balance:624011,narration:'Employee Short + Tea + Lock + Tanker'},
  {date:'20 Apr',ms:4893.98,hsd:2213.95,speed:88.96,  rateMS:104.77,rateHSD:91.28,revenue:724959,cash:228345,phonepay:496614,exp:6207, credit:0,balance:718752,narration:'Pooja Tailor + Ajay Adv + Employee Short'},
  {date:'21 Apr',ms:4596.56,hsd:2096.29,speed:292.1,  rateMS:104.77,rateHSD:91.28,revenue:706186,cash:264293,phonepay:441893,exp:5419, credit:0,balance:700767,narration:'Employee Short + DG Diesel + Tea + Shoes'},
  {date:'22 Apr',ms:4739.08,hsd:1858.25,speed:171.08, rateMS:104.77,rateHSD:91.28,revenue:685611,cash:246477,phonepay:434134,exp:866,  credit:200,balance:684545,narration:'Employee Short + Avasthi + Tea'},
  {date:'23 Apr',ms:4664.94,hsd:2261.97,speed:133.64, rateMS:104.77,rateHSD:91.28,revenue:710433,cash:256209,phonepay:454224,exp:1001, credit:0,balance:709432,narration:'Water + Employee Short + Tanker'},
  {date:'24 Apr',ms:5083.6, hsd:1965.8, speed:71.25,  rateMS:104.77,rateHSD:91.28,revenue:720158,cash:281123,phonepay:439035,exp:16600,credit:0,balance:703558,narration:'Santosh Advance + Tea'},
  {date:'25 Apr',ms:3612.45,hsd:1831.2, speed:720.21, rateMS:104.77,rateHSD:91.28,revenue:627624,cash:242231,phonepay:385393,exp:18049,credit:0,balance:609575,narration:'Fabrication + Tanker + Dhanu Petrol + Tea'},
  {date:'26 Apr',ms:4989.38,hsd:2313.09,speed:156.11, rateMS:104.77,rateHSD:91.28,revenue:751649,cash:263357,phonepay:488292,exp:1984, credit:0,balance:749665,narration:'Employee Short + Tea'},
  {date:'27 Apr',ms:1598.38,hsd:1887.17,speed:947.01, rateMS:104.77,rateHSD:91.28,revenue:447540,cash:167317,phonepay:280223,exp:2100, credit:0,balance:445440,narration:'Employee Short + Tea + Paint'},
  {date:'28 Apr',ms:4136.39,hsd:2091.03,speed:94.34,  rateMS:104.77,rateHSD:91.28,revenue:634979,cash:232688,phonepay:402291,exp:3482, credit:0,balance:631497,narration:'Employee Short + Tea + Tanker'},
  {date:'29 Apr',ms:4397.51,hsd:1806.19,speed:211.62, rateMS:104.77,rateHSD:91.28,revenue:649689,cash:258415,phonepay:391274,exp:856,  credit:0,balance:648833,narration:'Employee Short + Tea'},
  {date:'30 Apr',ms:4347.08,hsd:2014.27,speed:135.35, rateMS:104.77,rateHSD:91.28,revenue:654715,cash:243090,phonepay:411625,exp:1342, credit:0,balance:653373,narration:'Employee Short + DG Diesel + Tea'},
]

const rows = computed(() => (store.records.length ? store.records : STATIC))

const filtered = computed(() => {
  let d = [...rows.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(r => (r.narration || '').toLowerCase().includes(q) || (r.date || r.saleDate || '').toLowerCase().includes(q))
  }
  if (sortKey.value === 'revenue') d.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
  else if (sortKey.value === 'ms') d.sort((a, b) => (b.msVolume || b.ms || 0) - (a.msVolume || a.ms || 0))
  else if (sortKey.value === 'expenses') d.sort((a, b) => (b.expenses || b.exp || 0) - (a.expenses || a.exp || 0))
  return d
})

const totals = computed(() => ({
  ms:      filtered.value.reduce((a, r) => a + +(r.msVolume    || r.ms    || 0), 0),
  hsd:     filtered.value.reduce((a, r) => a + +(r.hsdVolume   || r.hsd   || 0), 0),
  speed:   filtered.value.reduce((a, r) => a + +(r.speedVolume || r.speed || 0), 0),
  revenue: filtered.value.reduce((a, r) => a + +(r.revenue     || 0),             0),
  cash:    filtered.value.reduce((a, r) => a + +(r.cash        || 0),             0),
  card:    filtered.value.reduce((a, r) => a + +(r.card || r.cardSale || 0),      0),
  phone:   filtered.value.reduce((a, r) => a + +(r.phonePe     || r.phonepay || 0),0),
  exp:     filtered.value.reduce((a, r) => a + +(r.expenses    || r.exp   || 0),  0),
  credit:  filtered.value.reduce((a, r) => a + +(r.creditSale  || r.credit|| 0),  0),
}))

const summaryStats = computed(() => [
  { label: 'Total Revenue',   value: '₹' + fmt(totals.value.revenue, 0), sub: '30 days', class: 'text-[#f59e0b]' },
  { label: 'Total Cash',      value: '₹' + fmt(totals.value.cash, 0),    sub: 'Collected', class: 'text-positive' },
  { label: 'Total PhonePe',   value: '₹' + fmt(totals.value.phone, 0),   sub: 'UPI transfers', class: 'text-[#6366f1]' },
  { label: 'Total Expenses',  value: '₹' + fmt(totals.value.exp, 0),     sub: 'All days', class: 'text-negative' },
])

const editRow = (r) => ui.info(`Edit: ${r.date || r.saleDate} — connect to API`)
const deleteRow = (r) => ui.error(`Delete: ${r.date || r.saleDate} — connect to API`)
const exportExcel = () => ui.success('Exporting Excel — connect salesApi.exportExcel()')
const exportPdf   = () => ui.success('Exporting PDF — connect salesApi.exportPdf()')
</script>
