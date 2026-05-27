<template>
  <div>
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--red)">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-value">{{ fmtINR(store.totalExp) }}</div>
        <div class="kpi-sub">April 2026</div>
        <div class="kpi-icon">🧾</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--accent)">
        <div class="kpi-label">Avg Daily Expense</div>
        <div class="kpi-value">{{ fmtINR(Math.round(store.totalExp / store.sales.length)) }}</div>
        <div class="kpi-sub">Per day</div>
        <div class="kpi-icon">📉</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--green)">
        <div class="kpi-label">Lowest Expense Day</div>
        <div class="kpi-value">{{ fmtINR(minExp.exp) }}</div>
        <div class="kpi-sub">{{ minExp.date }}</div>
        <div class="kpi-icon">✅</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--red)">
        <div class="kpi-label">Highest Expense Day</div>
        <div class="kpi-value">{{ fmtINR(maxExp.exp) }}</div>
        <div class="kpi-sub">{{ maxExp.date }}</div>
        <div class="kpi-icon">⚠️</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Daily Expenses + Narration</div>
          <div class="card-sub" style="margin-top:2px">All 30 days of April 2026</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Amount (₹)</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in store.sales" :key="r.date">
                <td><span class="mono" style="font-size:12px;color:var(--accent)">{{ r.date }}</span></td>
                <td class="amt" :class="r.exp > 10000 ? 'negative' : r.exp > 3000 ? 'warning' : ''">{{ fmt(r.exp) }}</td>
                <td><div class="narration" style="max-width:260px" :title="r.narration">{{ r.narration }}</div></td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td>TOTAL</td><td>{{ fmt(store.totalExp) }}</td><td>—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:14px">
          <div class="card-header"><div class="card-title">Expense Trend</div></div>
          <div class="card-body">
            <div class="chart-wrap"><canvas ref="expChartEl"></canvas></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Expense Distribution</div></div>
          <div class="card-body">
            <div style="margin-bottom:10px">
              <div class="fuel-bar-row" v-for="b in buckets" :key="b.label">
                <div class="fuel-bar-head">
                  <span>{{ b.label }}</span>
                  <span :class="b.cls" style="font-size:11px">{{ b.days }} days</span>
                </div>
                <div class="fuel-bar-track">
                  <div class="fuel-bar-fill" :style="{ width: (b.days/30*100)+'%', background: b.color }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
const { fmt, fmtINR } = useFormat()
const { GRID, TICK } = useChartDefaults()
const expChartEl = ref(null)

const minExp = computed(() => store.sales.reduce((a,r) => r.exp < a.exp ? r : a, store.sales[0]))
const maxExp = computed(() => store.sales.reduce((a,r) => r.exp > a.exp ? r : a, store.sales[0]))

const buckets = [
  { label:'< ₹1,000 (Low)',        days: store.sales.filter(r=>r.exp < 1000).length,               color:'#10b981', cls:'positive' },
  { label:'₹1,000–₹3,000 (Normal)',days: store.sales.filter(r=>r.exp>=1000&&r.exp<3000).length,    color:'#6366f1', cls:'muted' },
  { label:'₹3,000–₹10,000 (High)', days: store.sales.filter(r=>r.exp>=3000&&r.exp<10000).length,   color:'#f59e0b', cls:'warning' },
  { label:'> ₹10,000 (Very High)',  days: store.sales.filter(r=>r.exp>=10000).length,               color:'#ef4444', cls:'negative' },
]

onMounted(() => {
  new Chart(expChartEl.value, {
    type: 'bar',
    data: {
      labels: store.sales.map(r => r.date),
      datasets: [{
        label: 'Expenses',
        data: store.sales.map(r => r.exp),
        backgroundColor: store.sales.map(r => r.exp > 10000 ? '#ef4444' : r.exp > 3000 ? '#f59e0b' : 'rgba(239,68,68,.45)'),
        borderRadius: 4, borderSkipped: false,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1, callbacks:{label:ctx=>'₹'+Number(ctx.raw).toLocaleString('en-IN')}} },
      scales:{ x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}}, y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+Number(v).toLocaleString('en-IN')}} }
    }
  })
})
</script>
