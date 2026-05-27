<template>
  <div>
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--ms)">
        <div class="kpi-label">MS Total Received</div>
        <div class="kpi-value">1,23,000 L</div>
        <div class="kpi-sub">Multiple tanker deliveries</div>
        <div class="kpi-icon">🛢️</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--hsd)">
        <div class="kpi-label">HSD Total Received</div>
        <div class="kpi-value">~52,500 L</div>
        <div class="kpi-sub">Multiple tanker deliveries</div>
        <div class="kpi-icon">🟢</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--speed)">
        <div class="kpi-label">MS Closing Stock</div>
        <div class="kpi-value">2,890 L</div>
        <div class="kpi-sub">Apr 30 closing</div>
        <div class="kpi-icon">📦</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--accent)">
        <div class="kpi-label">Avg Daily Variation (MS)</div>
        <div class="kpi-value">+1.4 L</div>
        <div class="kpi-sub">Over/Short average</div>
        <div class="kpi-icon">📊</div>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: tab==='ms' }"    @click="tab='ms'">⛽ MS (Petrol)</button>
      <button class="tab-btn" :class="{ active: tab==='hsd' }"   @click="tab='hsd'">🟢 HSD (Diesel)</button>
      <button class="tab-btn" :class="{ active: tab==='speed' }" @click="tab='speed'">🔵 Speed (Premium)</button>
    </div>

    <!-- Stock chart -->
    <div class="card mb-6" style="margin-bottom:16px">
      <div class="card-header">
        <div>
          <div class="card-title">{{ tabLabel }} Opening vs Closing Stock</div>
          <div class="card-sub">April 2026 daily stock movement</div>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-wrap" style="height:240px"><canvas ref="stockChartEl"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">{{ tabLabel }} Stock – April 2026</div>
          <div class="card-sub">Opening, purchases, closing and variation per day</div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Opening (L)</th><th>Received (L)</th><th>Net Stock (L)</th>
              <th>Closing (L)</th><th>Actual Sale (L)</th><th>Variation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in currentData" :key="r.date">
              <td><span class="mono" style="font-size:12px;color:var(--accent)">{{ r.date }}</span></td>
              <td class="amt">{{ fmt(r.open) }}</td>
              <td class="amt" :class="r.recv > 0 ? 'positive' : 'muted'">
                {{ r.recv > 0 ? '+' + fmt(r.recv) : '—' }}
              </td>
              <td class="amt">{{ fmt(r.net) }}</td>
              <td class="amt warning">{{ fmt(r.close) }}</td>
              <td class="amt">{{ r.sale }}</td>
              <td>
                <span class="badge" :class="r.variation >= 0 ? 'badge-green' : 'badge-red'">
                  {{ r.variation >= 0 ? '+' : '' }}{{ r.variation }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import { useSalesStore } from '@/stores/salesStore'
import { useFormat } from '@/composables/useFormat'
import { useChartDefaults } from '@/composables/useChartDefaults'

const store = useSalesStore()
const { fmt } = useFormat()
const { GRID, TICK } = useChartDefaults()

const tab = ref('ms')
const stockChartEl = ref(null)
let stockChart = null

const tabLabel = computed(() => ({ ms:'MS (Petrol)', hsd:'HSD (Diesel)', speed:'Speed (Premium)' }[tab.value]))

const currentData = computed(() => {
  const base = store.msStock
  if (tab.value === 'ms') return base
  const ratio = tab.value === 'hsd' ? 0.407 : 0.046
  return base.map(r => ({
    ...r,
    open:  Math.round(r.open  * ratio),
    recv:  Math.round(r.recv  * ratio),
    net:   Math.round(r.net   * ratio),
    close: Math.round(r.close * ratio),
    sale:  (r.sale * ratio).toFixed(2),
    variation: (r.variation * ratio).toFixed(2),
  }))
})

const buildChart = () => {
  if (stockChart) stockChart.destroy()
  const d = currentData.value
  stockChart = new Chart(stockChartEl.value, {
    type: 'bar',
    data: {
      labels: d.map(r => r.date),
      datasets: [
        { label:'Opening', data: d.map(r=>r.open),  backgroundColor:'rgba(99,102,241,.5)', borderRadius:3 },
        { label:'Closing', data: d.map(r=>r.close), backgroundColor: tab.value==='ms'?'rgba(245,158,11,.7)': tab.value==='hsd'?'rgba(16,185,129,.7)':'rgba(59,130,246,.7)', borderRadius:3 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{color:TICK,font:{size:11}} }, tooltip:{ backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1 } },
      scales:{ x:{grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:50}}, y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}} }
    }
  })
}

watch(tab, () => nextTick(buildChart))
onMounted(buildChart)
</script>
