<template>
  <div>
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: tab==='summary' }"   @click="tab='summary'">📊 Summary</button>
      <button class="tab-btn" :class="{ active: tab==='fuel' }"      @click="tab='fuel'">⛽ Fuel Report</button>
      <button class="tab-btn" :class="{ active: tab==='financial' }" @click="tab='financial'">💰 P&L Report</button>
    </div>

    <!-- SUMMARY TAB -->
    <template v-if="tab==='summary'">
      <div class="kpi-grid mb-6">
        <div class="kpi-card" style="--kpi-c:var(--accent)">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-value">{{ fmtCr(store.totalRevenue) }}</div>
          <div class="kpi-sub">April 2026</div>
        </div>
        <div class="kpi-card" style="--kpi-c:var(--green)">
          <div class="kpi-label">Cash Collected</div>
          <div class="kpi-value">{{ fmtCr(store.totalCash) }}</div>
        </div>
        <div class="kpi-card" style="--kpi-c:var(--blue)">
          <div class="kpi-label">PhonePe / UPI</div>
          <div class="kpi-value">{{ fmtCr(store.totalPhone) }}</div>
        </div>
        <div class="kpi-card" style="--kpi-c:var(--red)">
          <div class="kpi-label">Card (Pine Labs)</div>
          <div class="kpi-value">₹{{ fmt(store.totalCard) }}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">April 2026 – Monthly Summary</div></div>
          <div class="card-body">
            <table>
              <tbody>
                <tr v-for="row in summaryRows" :key="row.label">
                  <td :style="{ color: row.indent ? 'var(--text3)' : 'var(--text)', paddingLeft: row.indent ? '28px':'13px', fontSize:'13px', padding:'9px 13px', borderBottom:'1px solid rgba(31,45,66,.6)' }">
                    {{ row.label }}
                  </td>
                  <td class="amt" :class="row.cls" style="padding:9px 13px;border-bottom:1px solid rgba(31,45,66,.6);font-size:13.5px">
                    {{ row.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-header"><div class="card-title">Revenue Cumulative</div></div>
            <div class="card-body">
              <div class="chart-wrap" style="height:220px"><canvas ref="cumulativeChartEl"></canvas></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Fuel Volume Share</div></div>
            <div class="card-body">
              <div class="chart-wrap" style="height:160px"><canvas ref="fuelShareChartEl"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- FUEL REPORT TAB -->
    <template v-if="tab==='fuel'">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">MS Daily Volume Trend</div></div>
          <div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas ref="msTrendChartEl"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">HSD Daily Volume Trend</div></div>
          <div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas ref="hsdTrendChartEl"></canvas></div></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="card-header"><div class="card-title">Speed (Premium) Volume Trend</div></div>
        <div class="card-body"><div class="chart-wrap" style="height:200px"><canvas ref="speedTrendChartEl"></canvas></div></div>
      </div>
    </template>

    <!-- P&L TAB -->
    <template v-if="tab==='financial'">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Revenue vs Cash vs PhonePe</div></div>
          <div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas ref="pnlChartEl"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Daily Expense Breakdown</div></div>
          <div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas ref="expBreakChartEl"></canvas></div></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="card-header"><div class="card-title">P&L Summary</div></div>
        <div class="card-body">
          <div class="grid-3" style="gap:20px">
            <div v-for="item in plItems" :key="item.label" style="text-align:center">
              <div class="kpi-label">{{ item.label }}</div>
              <div class="kpi-value" style="font-size:20px" :class="item.cls">{{ item.value }}</div>
              <div class="kpi-sub">{{ item.sub }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import { useSalesStore } from '@/stores/salesStore'
import { useFormat } from '@/composables/useFormat'
import { useChartDefaults } from '@/composables/useChartDefaults'

const store = useSalesStore()
const { fmt, fmtCr, fmtINR } = useFormat()
const { GRID, TICK } = useChartDefaults()

const tab = ref('summary')
const cumulativeChartEl  = ref(null)
const fuelShareChartEl   = ref(null)
const msTrendChartEl     = ref(null)
const hsdTrendChartEl    = ref(null)
const speedTrendChartEl  = ref(null)
const pnlChartEl         = ref(null)
const expBreakChartEl    = ref(null)

const charts = {}
const labels = store.sales.map(r => r.date)

const summaryRows = [
  { label:'Period', value:'April 2026 (30 days)', cls:'' },
  { label:'MS Volume Sold', value:`${fmt(store.totalMS, 2)} Litres`, cls:'warning' },
  { label:'HSD Volume Sold', value:`${fmt(store.totalHSD, 2)} Litres`, cls:'warning' },
  { label:'Speed Volume Sold', value:`${fmt(store.totalSpeed, 2)} Litres`, cls:'warning' },
  { label:'Total Fuel Sold', value:`${fmt(store.totalMS + store.totalHSD + store.totalSpeed, 2)} L`, cls:'positive', indent:true },
  { label:'MS Rate', value:'₹104.77 / Litre', cls:'' },
  { label:'HSD Rate', value:'₹91.28 / Litre', cls:'' },
  { label:'Speed Rate', value:'₹113.85 / Litre', cls:'' },
  { label:'Gross Revenue', value:`₹${fmt(store.totalRevenue)}`, cls:'warning' },
  { label:'Cash Received', value:`₹${fmt(store.totalCash)}`, cls:'positive' },
  { label:'Card (Pine Labs)', value:'₹10,000', cls:'' },
  { label:'PhonePe / UPI', value:`₹${fmt(store.totalPhone)}`, cls:'' },
  { label:'Total Collection', value:`₹${fmt(store.totalRevenue)}`, cls:'positive', indent:true },
  { label:'Total Expenses', value:`₹${fmt(store.totalExp)}`, cls:'negative' },
  { label:'Staff Payroll', value:`₹${fmt(store.totalPayroll)}`, cls:'negative' },
  { label:'Credit Sales', value:'₹200', cls:'negative' },
]

const plItems = [
  { label:'Gross Revenue',      value: fmtCr(store.totalRevenue),              cls:'warning',  sub:'Total fuel sales' },
  { label:'Operating Expenses', value: fmtINR(store.totalExp),                 cls:'negative', sub:'Daily expenses' },
  { label:'Staff Cost',         value: fmtINR(store.totalPayroll),             cls:'negative', sub:'Salaries + advances' },
  { label:'Total Deductions',   value: fmtINR(store.totalExp + store.totalPayroll), cls:'negative', sub:'Exp + Payroll' },
  { label:'Net Operating',      value: fmtCr(store.totalRevenue - store.totalExp - store.totalPayroll), cls:'positive', sub:'After all deductions' },
  { label:'Expense Ratio',      value: ((store.totalExp/store.totalRevenue)*100).toFixed(2)+'%', cls:'muted', sub:'Expenses / Revenue' },
]

const destroyChart = (key) => { if (charts[key]) { charts[key].destroy(); delete charts[key] } }

const buildSummaryCharts = () => {
  nextTick(() => {
    destroyChart('cumulative'); destroyChart('fuelShare')
    let cum = 0
    charts['cumulative'] = new Chart(cumulativeChartEl.value, {
      type:'line',
      data:{ labels, datasets:[{ label:'Cumulative Revenue', data: store.sales.map(r=>(cum+=r.revenue,cum)), borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.08)', tension:.4, fill:true, pointRadius:2 }] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1,callbacks:{label:ctx=>'₹'+(ctx.raw/10000000).toFixed(2)+'Cr'}}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+(v/10000000).toFixed(1)+'Cr'}}} }
    })
    charts['fuelShare'] = new Chart(fuelShareChartEl.value, {
      type:'doughnut',
      data:{ labels:['MS','HSD','Speed'], datasets:[{ data:[store.totalMS,store.totalHSD,store.totalSpeed], backgroundColor:['#f59e0b','#10b981','#3b82f6'], borderWidth:2, borderColor:'#0d1117' }] },
      options:{ responsive:true,maintainAspectRatio:false,cutout:'60%', plugins:{legend:{position:'right',labels:{color:TICK,font:{size:11},padding:10}},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1}} }
    })
  })
}

const buildFuelCharts = () => {
  nextTick(() => {
    ['msTrend','hsdTrend','speedTrend'].forEach(k => destroyChart(k))
    charts['msTrend'] = new Chart(msTrendChartEl.value, {
      type:'bar', data:{ labels, datasets:[{label:'MS (L)',data:store.sales.map(r=>r.ms),backgroundColor:'rgba(245,158,11,.7)',borderRadius:3}] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}}} }
    })
    charts['hsdTrend'] = new Chart(hsdTrendChartEl.value, {
      type:'bar', data:{ labels, datasets:[{label:'HSD (L)',data:store.sales.map(r=>r.hsd),backgroundColor:'rgba(16,185,129,.7)',borderRadius:3}] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}}} }
    })
    charts['speedTrend'] = new Chart(speedTrendChartEl.value, {
      type:'bar', data:{ labels, datasets:[{label:'Speed (L)',data:store.sales.map(r=>r.speed),backgroundColor:'rgba(59,130,246,.7)',borderRadius:3}] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}}} }
    })
  })
}

const buildPnlCharts = () => {
  nextTick(() => {
    ['pnl','expBreak'].forEach(k => destroyChart(k))
    charts['pnl'] = new Chart(pnlChartEl.value, {
      type:'line',
      data:{ labels, datasets:[
        {label:'Revenue',data:store.sales.map(r=>r.revenue),borderColor:'#f59e0b',tension:.4,pointRadius:2},
        {label:'Cash',   data:store.sales.map(r=>r.cash),   borderColor:'#10b981',tension:.4,pointRadius:2},
        {label:'PhonePe',data:store.sales.map(r=>r.phonepay),borderColor:'#6366f1',tension:.4,pointRadius:2},
      ] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{labels:{color:TICK,font:{size:11}}},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1,callbacks:{label:ctx=>'₹'+(ctx.raw/100000).toFixed(1)+'L'}}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+(v/100000).toFixed(1)+'L'}}} }
    })
    charts['expBreak'] = new Chart(expBreakChartEl.value, {
      type:'bar', data:{ labels, datasets:[{label:'Expenses',data:store.sales.map(r=>r.exp),backgroundColor:store.sales.map(r=>r.exp>10000?'#ef4444':r.exp>3000?'#f59e0b':'rgba(239,68,68,.5)'),borderRadius:4}] },
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1,callbacks:{label:ctx=>'₹'+Number(ctx.raw).toLocaleString('en-IN')}}}, scales:{x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}},y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+Number(v).toLocaleString('en-IN')}}} }
    })
  })
}

watch(tab, (t) => {
  if (t === 'summary')   buildSummaryCharts()
  if (t === 'fuel')      buildFuelCharts()
  if (t === 'financial') buildPnlCharts()
})

onMounted(buildSummaryCharts)
</script>
