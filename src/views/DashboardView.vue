<template>
  <div>
    <PageHeader title="Dashboard" subtitle="Monthly overview & key metrics" :crumbs="['Home', 'Dashboard']">
      <template #actions>
        <select v-model="selectedPeriod" class="form-select text-[12px]">
          <option value="2026-04">April 2026</option>
          <option value="2026-03">March 2026</option>
        </select>
        <button class="btn btn-ghost" @click="refresh"><span :class="{ 'animate-spin inline-block': store.loading }">⟳</span> Refresh</button>
      </template>
    </PageHeader>

    <!-- KPI Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Revenue" :value="kpi('totalRevenue','₹1.82Cr')" icon="💰" color="#f59e0b" sub="April 2026" :loading="store.loading" />
      <KpiCard label="MS Sold (Litres)" :value="kpi('msSold','1,23,952')" icon="🔴" color="#f59e0b" sub="Petrol volume" :loading="store.loading" />
      <KpiCard label="HSD Sold (Litres)" :value="kpi('hsdSold','50,475')" icon="🟢" color="#10b981" sub="Diesel volume" :loading="store.loading" />
      <KpiCard label="Speed (Litres)" :value="kpi('speedSold','5,728')" icon="🔵" color="#3b82f6" sub="Premium fuel" :loading="store.loading" />
      <KpiCard label="Total Cash" :value="kpi('totalCash','₹66.97L')" icon="💵" color="#10b981" sub="36.7% of sales" :loading="store.loading" />
      <KpiCard label="PhonePe / UPI" :value="kpi('totalPhonePe','₹1.15Cr')" icon="📱" color="#6366f1" sub="63.3% of sales" :loading="store.loading" />
      <KpiCard label="Total Expenses" :value="kpi('totalExpenses','₹1,29,358')" icon="🧾" color="#ef4444" sub="0.71% of revenue" :loading="store.loading" />
      <KpiCard label="Staff Payroll" :value="kpi('staffPayroll','₹1,16,302')" icon="👥" color="#8b5cf6" sub="13 staff members" :loading="store.loading" />
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-white">Daily Revenue</div>
            <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Day-wise sales revenue (₹)</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart type="bar" :data="revenueChartData" :options="revenueOpts" :height="240" />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-white">Fuel Volume Mix</div>
            <div class="text-[11.5px] text-[#5a6a82] mt-0.5">MS vs HSD vs Speed (litres)</div>
          </div>
        </div>
        <div class="card-body">
          <BaseChart type="line" :data="fuelMixChartData" :options="lineOpts" :height="240" />
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Payment Split Donut -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Payment Split</div>
        </div>
        <div class="card-body flex flex-col items-center">
          <BaseChart type="doughnut" :data="paymentChartData" :options="doughnutOpts" :height="200" />
          <div class="mt-4 w-full space-y-2 text-[12px]">
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Cash</span><span class="amt text-[#10b981]">₹66,96,849</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">PhonePe/UPI</span><span class="amt text-[#6366f1]">₹1,15,49,169</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Card (Pine)</span><span class="amt text-[#3b82f6]">₹10,000</span></div>
          </div>
        </div>
      </div>

      <!-- Stock Levels -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-white">Fuel Stock</div>
            <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Current inventory levels</div>
          </div>
        </div>
        <div class="card-body">
          <div class="flex items-center gap-3 py-3" style="border-bottom:1px solid #1c2230">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:#f59e0b" />
            <span class="flex-1 text-[13px] font-medium">MS (Petrol)</span>
            <div class="text-right">
              <div class="font-display font-bold text-[15px] text-[#f59e0b]">2,890 L</div>
              <div class="text-[10.5px] text-[#5a6a82]">Closing stock</div>
            </div>
          </div>
          <div class="flex items-center gap-3 py-3" style="border-bottom:1px solid #1c2230">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:#10b981" />
            <span class="flex-1 text-[13px] font-medium">HSD (Diesel)</span>
            <div class="text-right">
              <div class="font-display font-bold text-[15px] text-[#10b981]">~4,200 L</div>
              <div class="text-[10.5px] text-[#5a6a82]">Estimated closing</div>
            </div>
          </div>
          <div class="flex items-center gap-3 py-3">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:#3b82f6" />
            <span class="flex-1 text-[13px] font-medium">Speed (Premium)</span>
            <div class="text-right">
              <div class="font-display font-bold text-[15px] text-[#3b82f6]">~344 L</div>
              <div class="text-[10.5px] text-[#5a6a82]">Closing stock</div>
            </div>
          </div>
          <div class="mt-4 space-y-2.5">
            <FuelBar label="MS Level" value="2,890L" :pct="36" color="#f59e0b" />
            <FuelBar label="HSD Level" value="4,200L" :pct="62" color="#10b981" />
            <FuelBar label="Speed Level" value="344L" :pct="25" color="#3b82f6" />
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Quick Stats</div>
        </div>
        <div class="card-body space-y-3">
          <div v-for="stat in quickStats" :key="stat.label"
            class="flex items-center justify-between py-2.5 px-3 rounded-lg"
            style="background:#161b24; border:1px solid #1c2230">
            <div class="flex items-center gap-2.5">
              <span class="text-lg">{{ stat.icon }}</span>
              <div>
                <div class="text-[12.5px] font-medium text-white">{{ stat.label }}</div>
                <div class="text-[10.5px] text-[#5a6a82]">{{ stat.sub }}</div>
              </div>
            </div>
            <div class="font-display font-bold text-[15px]" :style="{ color: stat.color }">{{ stat.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sales Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">Recent Sales</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Last 7 days</div>
        </div>
        <RouterLink to="/sales" class="btn btn-ghost ml-auto text-[12px] py-1.5">View All →</RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th><th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Revenue</th><th>Cash</th><th>PhonePe</th><th>Expenses</th><th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentSales" :key="r.date">
              <td><span class="font-mono-custom text-[11.5px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td><span class="badge badge-ms">{{ r.ms }}</span></td>
              <td><span class="badge badge-hsd">{{ r.hsd }}</span></td>
              <td><span class="badge badge-speed">{{ r.speed }}</span></td>
              <td class="amt text-[#f59e0b]">₹{{ r.revenue }}</td>
              <td class="amt text-positive">₹{{ r.cash }}</td>
              <td class="amt text-[#6366f1]">₹{{ r.phone }}</td>
              <td class="amt text-negative">₹{{ r.exp }}</td>
              <td class="amt text-[#f59e0b]">₹{{ r.balance }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import FuelBar    from '@/components/ui/FuelBar.vue'
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt, chartColors } from '@/utils/format'

const store = useDashboardStore()
const selectedPeriod = ref('2026-04')

const kpi = (key, fallback) => store.kpis?.[key] || fallback

const refresh = () => store.fetchAll({ period: selectedPeriod.value })
onMounted(refresh)

// ---- Chart Data (from API store or fallback static) ----
const LABELS = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15',
                '16','17','18','19','20','21','22','23','24','25','26','27','28','29','30']

const REV_DATA = [428170,468932,511469,531554,514643,550439,539032,565690,557107,569046,
                  602355,629937,647373,558199,686611,667920,563938,714637,625410,724959,
                  706186,685611,710433,720158,627624,751649,447540,634979,649689,654715]

const MS_DATA  = [3130,3202,3729,3589,3634,3959,3933,3861,4160,4082,4057,4476,4439,3834,4841,
                  4773,4000,4822,4363,4893,4596,4739,4664,5083,3612,4989,1598,4136,4397,4347]
const HSD_DATA = [1030,1372,1251,1304,1372,1396,1231,1664,1160,1360,1687,1611,1771,1347,1674,
                  1747,1346,2153,1649,2213,2096,1858,2261,1965,1831,2313,1887,2091,1806,2014]
const SPD_DATA = [54,71,57,319,75,70,127,79,134,150,203,121,181,294,233,
                  72,191,112,155,88,292,171,133,71,720,156,947,94,211,135]

const revenueChartData = computed(() => ({
  labels: LABELS,
  datasets: [{
    label: 'Revenue (₹)',
    data: store.dailyTrend.length ? store.dailyTrend.map(d => d.revenue) : REV_DATA,
    backgroundColor: REV_DATA.map((v, i) => i === 29 ? '#f59e0b' : 'rgba(245,158,11,0.55)'),
    borderRadius: 4, borderSkipped: false,
  }]
}))

const fuelMixChartData = computed(() => ({
  labels: LABELS,
  datasets: [
    { label: 'MS (L)',    data: MS_DATA,  borderColor: chartColors.ms,    backgroundColor: 'rgba(245,158,11,0.08)', tension: 0.4, fill: true, pointRadius: 2 },
    { label: 'HSD (L)',   data: HSD_DATA, borderColor: chartColors.hsd,   backgroundColor: 'rgba(16,185,129,0.06)',  tension: 0.4, fill: true, pointRadius: 2 },
    { label: 'Speed (L)', data: SPD_DATA, borderColor: chartColors.speed, backgroundColor: 'rgba(59,130,246,0.06)',  tension: 0.4, fill: true, pointRadius: 2 },
  ]
}))

const paymentChartData = computed(() => ({
  labels: ['Cash', 'PhonePe / UPI', 'Card'],
  datasets: [{
    data: [6696849, 11549169, 10000],
    backgroundColor: [chartColors.cash, chartColors.phone, chartColors.card],
    borderWidth: 2, borderColor: '#0a0c10',
  }]
}))

const revenueOpts = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 9 }, maxRotation: 60 } },
    y: { ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } }
  }
}
const lineOpts = { scales: { x: { ticks: { font: { size: 9 }, maxRotation: 60 } } } }
const doughnutOpts = { cutout: '68%', plugins: { legend: { position: 'bottom', labels: { padding: 14 } } } }

const recentSales = [
  { date:'24 Apr', ms:'5,083', hsd:'1,965', speed:'71',  revenue:'7,20,158', cash:'2,81,123', phone:'4,39,035', exp:'16,600', balance:'7,03,558' },
  { date:'25 Apr', ms:'3,612', hsd:'1,831', speed:'720', revenue:'6,27,624', cash:'2,42,231', phone:'3,85,393', exp:'18,049', balance:'6,09,575' },
  { date:'26 Apr', ms:'4,989', hsd:'2,313', speed:'156', revenue:'7,51,649', cash:'2,63,357', phone:'4,88,292', exp:'1,984',  balance:'7,49,665' },
  { date:'27 Apr', ms:'1,598', hsd:'1,887', speed:'947', revenue:'4,47,540', cash:'1,67,317', phone:'2,80,223', exp:'2,100',  balance:'4,45,440' },
  { date:'28 Apr', ms:'4,136', hsd:'2,091', speed:'94',  revenue:'6,34,979', cash:'2,32,688', phone:'4,02,291', exp:'3,482',  balance:'6,31,497' },
  { date:'29 Apr', ms:'4,397', hsd:'1,806', speed:'211', revenue:'6,49,689', cash:'2,58,415', phone:'3,91,274', exp:'856',    balance:'6,48,833' },
  { date:'30 Apr', ms:'4,347', hsd:'2,014', speed:'135', revenue:'6,54,715', cash:'2,43,090', phone:'4,11,625', exp:'1,342',  balance:'6,53,373' },
]

const quickStats = [
  { icon:'📅', label:'Sales Days',       sub:'April 2026',     value:'30',        color:'#f59e0b' },
  { icon:'📈', label:'Avg Daily Revenue',sub:'Per day',        value:'₹6.08L',    color:'#10b981' },
  { icon:'🏆', label:'Best Day Revenue', sub:'Apr 26, 2026',   value:'₹7.51L',    color:'#3b82f6' },
  { icon:'⛽', label:'Total Fuel Sold',  sub:'All types',      value:'1,80,155L', color:'#6366f1' },
  { icon:'💳', label:'Card Transactions',sub:'Pine Labs',      value:'₹10,000',   color:'#8b5cf6' },
  { icon:'📊', label:'Avg MS/Day',       sub:'Petrol volume',  value:'4,131 L',   color:'#f59e0b' },
]
</script>
