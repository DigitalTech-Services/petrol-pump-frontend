<template>
  <div>
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--blue)">
        <div class="kpi-label">Total Transfers (Apr)</div>
        <div class="kpi-value">{{ fmtCr(totalAmt) }}</div>
        <div class="kpi-sub">All BOM PhonePe transfers</div>
        <div class="kpi-icon">💳</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--green)">
        <div class="kpi-label">Transaction Count</div>
        <div class="kpi-value">{{ store.cardTx.length }}</div>
        <div class="kpi-sub">Daily transfers</div>
        <div class="kpi-icon">📊</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--accent)">
        <div class="kpi-label">Avg Per Day</div>
        <div class="kpi-value">{{ fmtCr(totalAmt / store.cardTx.length) }}</div>
        <div class="kpi-sub">Average daily transfer</div>
        <div class="kpi-icon">📈</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--indigo)">
        <div class="kpi-label">Max Single Transfer</div>
        <div class="kpi-value">{{ fmtINR(maxTx.amount) }}</div>
        <div class="kpi-sub">{{ maxTx.date }}</div>
        <div class="kpi-icon">🏆</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Daily Bank Transfers – BOM</div>
          <div class="card-sub" style="margin-top:2px">Bank of Maharashtra · April 2026</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Bank</th><th>Amount (₹)</th></tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in store.cardTx" :key="t.date">
                <td class="mono muted" style="font-size:11px">{{ i+1 }}</td>
                <td><span class="mono" style="font-size:12px;color:var(--accent)">{{ t.date }}</span></td>
                <td><span class="badge badge-blue">{{ t.bank }}</span></td>
                <td class="amt-lg positive">₹{{ fmt(t.amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">TOTAL</td>
                <td>₹{{ fmt(totalAmt) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Transfer Volume Trend</div>
          <div class="card-sub" style="margin-top:2px">Daily PhonePe/UPI inflow</div>
        </div>
        <div class="card-body">
          <div class="chart-wrap chart-wrap-lg"><canvas ref="txChartEl"></canvas></div>
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
const { fmt, fmtCr, fmtINR } = useFormat()
const { GRID, TICK } = useChartDefaults()
const txChartEl = ref(null)

const totalAmt = computed(() => store.cardTx.reduce((a,t) => a + t.amount, 0))
const maxTx    = computed(() => store.cardTx.reduce((a,t) => t.amount > a.amount ? t : a, store.cardTx[0]))

onMounted(() => {
  new Chart(txChartEl.value, {
    type: 'line',
    data: {
      labels: store.cardTx.map(t => t.date),
      datasets: [{
        label: 'Transfer Amount',
        data: store.cardTx.map(t => t.amount),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.1)',
        tension: .4, fill: true, pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1, callbacks:{label:ctx=>'₹'+Number(ctx.raw).toLocaleString('en-IN')}} },
      scales:{ x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}}, y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+(v/100000).toFixed(1)+'L'}} }
    }
  })
})
</script>
