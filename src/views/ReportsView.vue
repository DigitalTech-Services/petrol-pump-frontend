<template>
  <div>
    <PageHeader title="Monthly Reports" subtitle="Analytics, P&L and export — April 2026" :crumbs="['Home','Reports']">
      <template #actions>
        <button class="btn btn-ghost" @click="printReport">🖨 Print</button>
        <button class="btn btn-ghost" @click="exportExcel">📊 Excel</button>
        <button class="btn btn-primary" @click="exportPdf">📄 PDF Report</button>
      </template>
    </PageHeader>

    <!-- Tab Navigation -->
    <div class="tab-bar mb-6">
      <button class="tab-btn" :class="{ active: tab === 'summary' }"   @click="tab = 'summary'">📊 Summary</button>
      <button class="tab-btn" :class="{ active: tab === 'fuel' }"      @click="tab = 'fuel'">⛽ Fuel Report</button>
      <button class="tab-btn" :class="{ active: tab === 'financial' }" @click="tab = 'financial'">💰 P&L</button>
      <button class="tab-btn" :class="{ active: tab === 'staff' }"     @click="tab = 'staff'">👥 Staff</button>
    </div>

    <!-- ===== SUMMARY TAB ===== -->
    <template v-if="tab === 'summary'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Gross Revenue"   value="₹1,82,46,018" icon="💰" color="#f59e0b" sub="30 days" />
        <KpiCard label="Total Fuel Sold" value="1,80,155 L"   icon="⛽" color="#10b981" sub="All fuel types" />
        <KpiCard label="Total Expenses"  value="₹1,29,358"    icon="🧾" color="#ef4444" sub="Operational" />
        <KpiCard label="Net Payroll"     value="₹1,04,449"    icon="👥" color="#6366f1" sub="13 staff" />
      </div>

      <!-- P&L Summary Card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-white">📋 April 2026 — P&L Summary</div>
          </div>
          <div class="card-body">
            <div class="space-y-0">
              <div v-for="row in plRows" :key="row.label"
                class="flex items-center justify-between py-3"
                :style="{ borderBottom: row.divider ? '2px solid #2e3a50' : '1px solid #1c2230' }">
                <span class="text-[13px]" :class="row.bold ? 'font-bold text-white font-display text-[15px]' : 'text-[#8a9ab5]'"
                  :style="{ paddingLeft: row.indent ? '16px' : '0' }">
                  {{ row.label }}
                </span>
                <span class="font-mono-custom text-[13px]" :class="row.class || 'text-[#e8edf5]'"
                  :style="{ fontSize: row.bold ? '16px' : '13px' }">
                  {{ row.value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Collection breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-white">💳 Collection Breakdown</div>
          </div>
          <div class="card-body">
            <BaseChart type="doughnut" :data="collectionChart" :options="doughnutOpts" :height="220" />
            <div class="mt-4 space-y-2">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#10b981"/><span class="text-[12.5px] text-[#8a9ab5]">Cash</span></div>
                <span class="amt text-[#10b981]">₹66,96,849 (36.7%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#6366f1"/><span class="text-[12.5px] text-[#8a9ab5]">PhonePe/UPI</span></div>
                <span class="amt text-[#6366f1]">₹1,15,49,169 (63.3%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#3b82f6"/><span class="text-[12.5px] text-[#8a9ab5]">Card (Pine Labs)</span></div>
                <span class="amt text-[#3b82f6]">₹10,000 (0.01%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily Revenue vs Collections — April 2026</div>
        </div>
        <div class="card-body">
          <BaseChart type="line" :data="revVsCollChart" :options="lineOpts" :height="280" />
        </div>
      </div>
    </template>

    <!-- ===== FUEL TAB ===== -->
    <template v-if="tab === 'fuel'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">⛽ MS Petrol</div></div>
          <div class="card-body space-y-3">
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Total Volume</span><span class="amt text-[#f59e0b] font-semibold">1,23,951.86 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Rate/Litre</span><span class="amt">₹104.77</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Revenue</span><span class="amt text-[#f59e0b] font-semibold">₹1,29,89,717</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Avg Daily</span><span class="amt">4,131 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Peak Day</span><span class="amt">5,083 L (Apr 24)</span></div>
            <div class="fuel-bar-track mt-2"><div class="fuel-bar-fill" style="width:69%;background:#f59e0b"/></div>
            <div class="text-[11px] text-[#5a6a82]">69% of total fuel volume</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">🟢 HSD Diesel</div></div>
          <div class="card-body space-y-3">
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Total Volume</span><span class="amt text-[#10b981] font-semibold">50,475.40 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Rate/Litre</span><span class="amt">₹91.28</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Revenue</span><span class="amt text-[#10b981] font-semibold">₹46,07,395</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Avg Daily</span><span class="amt">1,682 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Peak Day</span><span class="amt">2,313 L (Apr 26)</span></div>
            <div class="fuel-bar-track mt-2"><div class="fuel-bar-fill" style="width:28%;background:#10b981"/></div>
            <div class="text-[11px] text-[#5a6a82]">28% of total fuel volume</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">🔵 Speed Premium</div></div>
          <div class="card-body space-y-3">
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Total Volume</span><span class="amt text-[#3b82f6] font-semibold">5,728.48 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Rate/Litre</span><span class="amt">₹113.85</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Revenue</span><span class="amt text-[#3b82f6] font-semibold">₹6,52,145</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Avg Daily</span><span class="amt">191 L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Peak Day</span><span class="amt">947 L (Apr 27)</span></div>
            <div class="fuel-bar-track mt-2"><div class="fuel-bar-fill" style="width:3%;background:#3b82f6"/></div>
            <div class="text-[11px] text-[#5a6a82]">3% of total fuel volume</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">MS Daily Volume</div></div>
          <div class="card-body"><BaseChart type="bar" :data="msBarChart" :options="barOpts" :height="260" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">HSD Daily Volume</div></div>
          <div class="card-body"><BaseChart type="bar" :data="hsdBarChart" :options="barOpts" :height="260" /></div>
        </div>
      </div>
    </template>

    <!-- ===== P&L TAB ===== -->
    <template v-if="tab === 'financial'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Revenue vs Cash vs PhonePe</div></div>
          <div class="card-body"><BaseChart type="line" :data="revVsCollChart" :options="lineOpts" :height="260" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Daily Expenses Trend</div></div>
          <div class="card-body"><BaseChart type="bar" :data="expBarChart" :options="expOpts" :height="260" /></div>
        </div>
      </div>
      <!-- Expense table -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Expense Category Breakdown</div></div>
        <div class="card-body">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div v-for="cat in expCategories" :key="cat.label"
              class="p-4 rounded-xl" style="background:#161b24; border:1px solid #1c2230">
              <div class="text-2xl mb-2">{{ cat.icon }}</div>
              <div class="text-[12px] text-[#5a6a82] mb-1">{{ cat.label }}</div>
              <div class="font-display font-bold text-[18px]" :style="{ color: cat.color }">₹{{ cat.value }}</div>
              <div class="text-[11px] text-[#5a6a82] mt-1">{{ cat.sub }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== STAFF TAB ===== -->
    <template v-if="tab === 'staff'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Staff Salary Distribution</div></div>
          <div class="card-body"><BaseChart type="bar" :data="staffSalaryChart" :options="staffBarOpts" :height="280" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Salary vs Advance vs Net</div></div>
          <div class="card-body"><BaseChart type="bar" :data="staffCompChart" :options="staffGroupOpts" :height="280" /></div>
        </div>
      </div>

      <!-- Staff Commission Summary -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Staff Payroll Summary</div></div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Days</th><th>Gross</th><th>Advance</th><th>Net</th><th>% Utilised</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in staffSummary" :key="s.name">
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-display"
                      :style="{ background: s.color }">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-white">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ s.role }}</span></td>
                <td class="amt">{{ s.days }}</td>
                <td class="amt text-positive">₹{{ fmt(s.gross) }}</td>
                <td class="amt text-negative">{{ s.advance > 0 ? '₹' + fmt(s.advance) : '—' }}</td>
                <td><span class="font-display font-bold text-[14px]" :class="s.net < 0 ? 'text-negative' : 'text-[#f59e0b]'">₹{{ fmt(s.net) }}</span></td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 fuel-bar-track" style="min-width:60px">
                      <div class="fuel-bar-fill" :style="{ width: Math.min(100, s.advance / s.gross * 100) + '%', background: s.color }" />
                    </div>
                    <span class="text-[11px] text-[#5a6a82]">{{ Math.round(s.advance / s.gross * 100) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">TOTAL</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.gross,0)) }}</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.advance,0)) }}</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.net,0)) }}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt, chartColors } from '@/utils/format'

const tab = ref('summary')
const ui  = useUiStore()

const exportPdf   = () => ui.success('PDF export — connect to salesApi.exportPdf()')
const exportExcel = () => ui.success('Excel export — connect to salesApi.exportExcel()')
const printReport = () => window.print()

const LABELS = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15',
                '16','17','18','19','20','21','22','23','24','25','26','27','28','29','30']

const REV  = [428170,468932,511469,531554,514643,550439,539032,565690,557107,569046,602355,629937,647373,558199,686611,667920,563938,714637,625410,724959,706186,685611,710433,720158,627624,751649,447540,634979,649689,654715]
const CASH = [172823,127340,190913,196960,162142,238538,204133,205368,236839,193637,220912,206413,248322,211239,256263,241950,222925,263225,213349,228345,264293,246477,256209,281123,242231,263357,167317,232688,258415,243090]
const PHPE = [255347,341592,315556,334594,352501,311901,334899,360322,320268,375409,381443,423524,399051,346960,430348,425970,341013,451412,412061,496614,441893,434134,454224,439035,385393,488292,280223,402291,391274,411625]
const MS   = [3130,3202,3729,3589,3634,3959,3933,3861,4160,4082,4057,4476,4439,3834,4841,4773,4000,4822,4363,4893,4596,4739,4664,5083,3612,4989,1598,4136,4397,4347]
const HSD  = [1030,1372,1251,1304,1372,1396,1231,1664,1160,1360,1687,1611,1771,1347,1674,1747,1346,2153,1649,2213,2096,1858,2261,1965,1831,2313,1887,2091,1806,2014]
const EXP  = [1086,3832,1963,6687,708,615,1108,1729,9153,23777,3722,3124,2119,1171,709,1328,13383,2033,1399,6207,5419,866,1001,16600,18049,1984,2100,3482,856,1342]

const G = chartColors.grid, T = chartColors.tick

const revVsCollChart = {
  labels: LABELS,
  datasets: [
    { label:'Revenue', data: REV,  borderColor:'#f59e0b', tension:0.4, pointRadius:2, fill:false },
    { label:'Cash',    data: CASH, borderColor:'#10b981', tension:0.4, pointRadius:2, fill:false },
    { label:'PhonePe', data: PHPE, borderColor:'#6366f1', tension:0.4, pointRadius:2, fill:false },
  ]
}

const collectionChart = {
  labels: ['Cash', 'PhonePe/UPI', 'Card'],
  datasets: [{
    data: [6696849, 11549169, 10000],
    backgroundColor: ['#10b981','#6366f1','#3b82f6'],
    borderWidth: 2, borderColor: '#0a0c10',
  }]
}

const msBarChart = {
  labels: LABELS,
  datasets: [{ label:'MS (L)', data: MS, backgroundColor:'rgba(245,158,11,0.65)', borderRadius:4, borderSkipped:false }]
}

const hsdBarChart = {
  labels: LABELS,
  datasets: [{ label:'HSD (L)', data: HSD, backgroundColor:'rgba(16,185,129,0.65)', borderRadius:4, borderSkipped:false }]
}

const expBarChart = {
  labels: LABELS,
  datasets: [{
    label:'Expenses (₹)',
    data: EXP,
    backgroundColor: EXP.map(v => v > 10000 ? '#ef4444' : v > 3000 ? '#f59e0b' : 'rgba(239,68,68,0.4)'),
    borderRadius: 4, borderSkipped: false,
  }]
}

const staffNames = ['Ajay','Santosh','Ayaz','Rizwan','Rehan','Kartik','Komal','Tanmay','Vanshika','Sahil P','Sahil A','Shaikh','Dhanu']
const staffColors = ['#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#f59e0b','#14b8a6','#6366f1','#78716c']
const salaries = [15000,21600,12000,12000,3666,10666,6666,4750,5066,2200,9600,25000,15000]
const advances = [6880,25719,1094,1517,656,2415,725,574,630,675,0,0,0]
const nets     = [8120,-4119,10906,10483,3010,8251,5941,4176,4436,1525,9600,25000,15000]

const staffSalaryChart = {
  labels: staffNames,
  datasets: [{ label:'Salary (₹)', data: salaries, backgroundColor: staffColors, borderRadius:4, borderSkipped:false }]
}

const staffCompChart = {
  labels: staffNames,
  datasets: [
    { label:'Gross Salary', data:salaries, backgroundColor:'rgba(16,185,129,0.6)', borderRadius:3 },
    { label:'Advance',      data:advances, backgroundColor:'rgba(239,68,68,0.6)',  borderRadius:3 },
    { label:'Net Payable',  data:nets.map(n => Math.max(0,n)), backgroundColor:'rgba(245,158,11,0.6)', borderRadius:3 },
  ]
}

const staffSummary = staffNames.map((n,i) => ({
  name:n, role:['Senior','Senior','Staff','Staff','Part-time','Staff','Staff','Staff','Staff','Petrol','Air','Manager','Security'][i],
  days:[30,27,30,30,8,26,20,15,16,6,24,30,30][i], gross:salaries[i], advance:advances[i], net:nets[i], color:staffColors[i]
}))

const lineOpts = { scales: { x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}} } }
const barOpts  = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>v+'L'}}} }
const expOpts  = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+v}}} }
const doughnutOpts = { cutout:'68%', plugins:{legend:{display:false}} }
const staffBarOpts = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}}} }
const staffGroupOpts = { scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}}} }

const plRows = [
  { label:'Period',               value:'April 2026 (30 days)' },
  { label:'MS Volume Sold',       value:'1,23,951.86 L',  class:'text-[#f59e0b]' },
  { label:'HSD Volume Sold',      value:'50,475.40 L',    class:'text-[#10b981]' },
  { label:'Speed Volume Sold',    value:'5,728.48 L',     class:'text-[#3b82f6]' },
  { label:'Total Fuel Sold',      value:'1,80,155.74 L',  class:'text-positive', bold:false, divider:true },
  { label:'MS Rate',              value:'₹104.77 / Litre', indent:true },
  { label:'HSD Rate',             value:'₹91.28 / Litre',  indent:true },
  { label:'Speed Rate',           value:'₹113.85 / Litre', indent:true, divider:true },
  { label:'Cash Received',        value:'₹66,96,849',     class:'text-positive', indent:true },
  { label:'PhonePe / UPI',        value:'₹1,15,49,169',   class:'text-[#6366f1]', indent:true },
  { label:'Card (Pine Labs)',      value:'₹10,000',        class:'text-[#3b82f6]', indent:true },
  { label:'Gross Revenue',        value:'₹1,82,46,018',   class:'text-[#f59e0b]', divider:true },
  { label:'Operational Expenses', value:'−₹1,29,358',     class:'text-negative', indent:true },
  { label:'Staff Payroll',        value:'−₹1,04,449',     class:'text-negative', indent:true, divider:true },
  { label:'NET OPERATING PROFIT', value:'₹1,80,12,211',   class:'text-[#f59e0b]', bold:true },
]

const expCategories = [
  { icon:'👷', label:'Employee Shortage', value:'48,213', sub:'Daily cash handover', color:'#f59e0b' },
  { icon:'🚛', label:'Tanker Charges',    value:'31,000', sub:'Delivery expenses', color:'#10b981' },
  { icon:'☕', label:'Tea & Snacks',       value:'8,200',  sub:'Daily staff tea', color:'#06b6d4' },
  { icon:'⚡', label:'Fabrication & Misc',value:'41,945', sub:'Repairs, spares, tools', color:'#ef4444' },
]
</script>
