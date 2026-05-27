<template>
  <div>
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--accent)">
        <div class="kpi-label">Total Revenue (Apr)</div>
        <div class="kpi-value">{{ fmtCr(store.totalRevenue) }}</div>
        <div class="kpi-sub"><span class="up">↑ 8.4%</span> vs Mar 2026</div>
        <div class="kpi-icon">💰</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--ms)">
        <div class="kpi-label">MS Sold (Litres)</div>
        <div class="kpi-value">{{ fmt(store.totalMS, 0) }}</div>
        <div class="kpi-sub"><span class="up">↑ 5.2%</span> growth</div>
        <div class="kpi-icon">🔴</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--hsd)">
        <div class="kpi-label">HSD Sold (Litres)</div>
        <div class="kpi-value">{{ fmt(store.totalHSD, 0) }}</div>
        <div class="kpi-sub"><span class="up">↑ 3.8%</span> growth</div>
        <div class="kpi-icon">🟢</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--speed)">
        <div class="kpi-label">Speed (Litres)</div>
        <div class="kpi-value">{{ fmt(store.totalSpeed, 0) }}</div>
        <div class="kpi-sub"><span class="up">↑ 12.1%</span> growth</div>
        <div class="kpi-icon">🔵</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--green)">
        <div class="kpi-label">Total Cash</div>
        <div class="kpi-value">{{ fmtCr(store.totalCash) }}</div>
        <div class="kpi-sub">{{ ((store.totalCash/store.totalRevenue)*100).toFixed(1) }}% of revenue</div>
        <div class="kpi-icon">💵</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--blue)">
        <div class="kpi-label">PhonePe / UPI</div>
        <div class="kpi-value">{{ fmtCr(store.totalPhone) }}</div>
        <div class="kpi-sub">{{ ((store.totalPhone/store.totalRevenue)*100).toFixed(1) }}% of revenue</div>
        <div class="kpi-icon">📱</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--red)">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-value">{{ fmtINR(store.totalExp) }}</div>
        <div class="kpi-sub">{{ ((store.totalExp/store.totalRevenue)*100).toFixed(2) }}% of revenue</div>
        <div class="kpi-icon">🧾</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--indigo)">
        <div class="kpi-label">Staff Payroll</div>
        <div class="kpi-value">{{ fmtINR(store.totalPayroll) }}</div>
        <div class="kpi-sub">{{ store.staff.length }} staff members</div>
        <div class="kpi-icon">👥</div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-2 mb-6">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Daily Revenue – April 2026</div>
            <div class="card-sub">Day-wise sales revenue (₹)</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-wrap">
            <canvas ref="revenueChartEl"></canvas>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Fuel Volume Mix</div>
            <div class="card-sub">MS vs HSD vs Speed (litres)</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-wrap">
            <canvas ref="fuelChartEl"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock + Payment -->
    <div class="grid-2 mb-6">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Current Fuel Stock</div>
            <div class="card-sub">As of Apr 30, 2026</div>
          </div>
        </div>
        <div class="card-body">
          <div v-for="s in stockItems" :key="s.name" style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)">
            <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0" :style="{ background: s.color }"></div>
            <div style="flex:1;font-weight:500;font-size:13px">{{ s.name }}</div>
            <div style="text-align:right">
              <div class="amt" :class="s.cls" style="font-size:14px;font-weight:700;font-family:'Rajdhani',sans-serif">{{ s.val }}</div>
              <div style="font-size:10.5px;color:var(--text3)">{{ s.label }}</div>
            </div>
          </div>
          <div style="margin-top:16px">
            <div v-for="s in stockItems" :key="s.name+'bar'" class="fuel-bar-row">
              <div class="fuel-bar-head"><span style="font-size:12px">{{ s.name }}</span><span :class="s.cls" style="font-size:11px">{{ s.val }}</span></div>
              <div class="fuel-bar-track"><div class="fuel-bar-fill" :style="{ width: s.pct+'%', background: s.color }"></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Payment Mode Split</div>
            <div class="card-sub">April 2026 total collections</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-wrap">
            <canvas ref="payChartEl"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sales -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Recent Sales (Last 7 Days)</div>
          <div class="card-sub">Apr 24–30, 2026</div>
        </div>
        <div class="card-actions">
          <RouterLink to="/sales"><button class="tb-btn">View All →</button></RouterLink>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Revenue</th><th>Cash</th><th>PhonePe</th><th>Expenses</th><th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentSales" :key="r.date">
              <td><span class="mono" style="font-size:11.5px;color:var(--accent)">{{ r.date }}</span></td>
              <td><span class="badge badge-ms">{{ r.ms }}</span></td>
              <td><span class="badge badge-hsd">{{ r.hsd }}</span></td>
              <td><span class="badge badge-speed">{{ r.speed }}</span></td>
              <td class="amt warning">₹{{ fmt(r.revenue) }}</td>
              <td class="amt positive">₹{{ fmt(r.cash) }}</td>
              <td class="amt" style="color:var(--blue)">₹{{ fmt(r.phonepay) }}</td>
              <td class="amt negative">₹{{ fmt(r.exp) }}</td>
              <td class="amt warning">₹{{ fmt(r.balance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Chart } from 'chart.js/auto'
import { useSalesStore } from '@/stores/salesStore'
import { useFormat } from '@/composables/useFormat'
import { useChartDefaults } from '@/composables/useChartDefaults'

const store = useSalesStore()
const { fmt, fmtCr, fmtINR } = useFormat()
const { baseOpts, rupeeY } = useChartDefaults()

const revenueChartEl = ref(null)
const fuelChartEl    = ref(null)
const payChartEl     = ref(null)

const recentSales = computed(() => store.sales.slice(-7))

const stockItems = [
  { name:'MS (Petrol)',   val:'2,890 L',  color:'var(--ms)',    cls:'warning', label:'Closing stock',    pct:36 },
  { name:'HSD (Diesel)',  val:'~4,200 L', color:'var(--hsd)',   cls:'positive', label:'Est. closing',   pct:62 },
  { name:'Speed Premium', val:'~344 L',   color:'var(--speed)', cls:'positive', label:'Closing stock',  pct:25 },
]

const labels = store.sales.map(r => r.date)

onMounted(() => {
  // Revenue chart
  new Chart(revenueChartEl.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: store.sales.map(r => r.revenue),
        backgroundColor: store.sales.map((r,i) =>
          i === store.sales.length-1 ? '#f59e0b' : 'rgba(245,158,11,0.55)'),
        borderRadius: 4, borderSkipped: false,
      }]
    },
    options: { ...baseOpts(rupeeY), plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '₹' + Number(ctx.raw).toLocaleString('en-IN') } } } }
  })

  // Fuel mix chart
  new Chart(fuelChartEl.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'MS (L)',    data: store.sales.map(r=>r.ms),    borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.08)', tension:.4, fill:true, pointRadius:2 },
        { label:'HSD (L)',   data: store.sales.map(r=>r.hsd),   borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.06)', tension:.4, fill:true, pointRadius:2 },
        { label:'Speed (L)', data: store.sales.map(r=>r.speed), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.06)', tension:.4, fill:true, pointRadius:2 },
      ]
    },
    options: baseOpts()
  })

  // Payment doughnut
  new Chart(payChartEl.value, {
    type: 'doughnut',
    data: {
      labels: [`Cash (${fmtCr(store.totalCash)})`, `PhonePe (${fmtCr(store.totalPhone)})`, `Card (₹10K)`],
      datasets: [{ data: [store.totalCash, store.totalPhone, store.totalCard], backgroundColor: ['#10b981','#6366f1','#3b82f6'], borderWidth: 2, borderColor: '#0d1117' }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { position:'bottom', labels: { color:'#4e6080', font:{size:11}, padding:14 } },
        tooltip: { backgroundColor:'#1c2535', titleColor:'#e2e8f4', bodyColor:'#8796b0', borderColor:'#2a3d57', borderWidth:1 } }
    }
  })
})
</script>
