<template>
  <div>
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--ms)">
        <div class="kpi-label">MS Nozzles Active</div>
        <div class="kpi-value">6</div>
        <div class="kpi-sub">MS-1 to MS-6</div>
        <div class="kpi-icon">⛽</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--hsd)">
        <div class="kpi-label">HSD Nozzles Active</div>
        <div class="kpi-value">4</div>
        <div class="kpi-sub">HSD-1 to HSD-4</div>
        <div class="kpi-icon">🟢</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--speed)">
        <div class="kpi-label">Speed Nozzles Active</div>
        <div class="kpi-value">4</div>
        <div class="kpi-sub">SP-1 to SP-4</div>
        <div class="kpi-icon">🔵</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--green)">
        <div class="kpi-label">Total MS Consumed</div>
        <div class="kpi-value">1,23,952 L</div>
        <div class="kpi-sub">All nozzles combined</div>
        <div class="kpi-icon">📊</div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card mb-5" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title">Nozzle-wise Daily Consumption (MS-2, MS-3, MS-4)</div>
        <div class="card-sub" style="margin-top:2px">First 10 days of April 2026</div>
      </div>
      <div class="card-body">
        <div class="chart-wrap" style="height:230px"><canvas ref="nozzleChartEl"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">MS Nozzle Meter – Opening & Closing (Apr 2026)</div>
        <div class="card-sub" style="margin-top:2px">First 10 days | MS-1 to MS-5</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>MS-1 Open</th><th>MS-1 Close</th><th>MS-1 Used</th>
              <th>MS-2 Open</th><th>MS-2 Close</th><th>MS-2 Used</th>
              <th>MS-3 Open</th><th>MS-3 Close</th><th>MS-3 Used</th>
              <th>MS-4 Open</th><th>MS-4 Close</th><th>MS-4 Used</th>
              <th>MS-5 Open</th><th>MS-5 Close</th><th>MS-5 Used</th>
              <th>Day Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.meters" :key="r.date">
              <td><span class="mono" style="font-size:11.5px;color:var(--accent)">{{ r.date }}</span></td>
              <td class="mono" style="font-size:11px">{{ r.ms1o }}</td>
              <td class="mono" style="font-size:11px">{{ r.ms1c }}</td>
              <td><span class="badge badge-ms">{{ (r.ms1c - r.ms1o).toFixed(2) }}</span></td>
              <td class="mono" style="font-size:11px">{{ r.ms2o }}</td>
              <td class="mono" style="font-size:11px">{{ r.ms2c }}</td>
              <td><span class="badge badge-ms">{{ (r.ms2c - r.ms2o).toFixed(2) }}</span></td>
              <td class="mono" style="font-size:11px">{{ r.ms3o }}</td>
              <td class="mono" style="font-size:11px">{{ r.ms3c }}</td>
              <td><span class="badge badge-ms">{{ (r.ms3c - r.ms3o).toFixed(2) }}</span></td>
              <td class="mono" style="font-size:11px">{{ r.ms4o }}</td>
              <td class="mono" style="font-size:11px">{{ r.ms4c }}</td>
              <td><span class="badge badge-ms">{{ (r.ms4c - r.ms4o).toFixed(2) }}</span></td>
              <td class="mono" style="font-size:11px">{{ r.ms5o }}</td>
              <td class="mono" style="font-size:11px">{{ r.ms5c }}</td>
              <td><span class="badge badge-ms">{{ (r.ms5c - r.ms5o).toFixed(2) }}</span></td>
              <td class="amt warning">{{ r.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Chart } from 'chart.js/auto'
import { useSalesStore } from '@/stores/salesStore'
import { useChartDefaults } from '@/composables/useChartDefaults'

const store = useSalesStore()
const { GRID, TICK } = useChartDefaults()
const nozzleChartEl = ref(null)

onMounted(() => {
  const d = store.meters
  new Chart(nozzleChartEl.value, {
    type: 'bar',
    data: {
      labels: d.map(r => r.date),
      datasets: [
        { label:'MS-2', data: d.map(r=>(r.ms2c-r.ms2o).toFixed(2)), backgroundColor:'rgba(245,158,11,.7)', borderRadius:3 },
        { label:'MS-3', data: d.map(r=>(r.ms3c-r.ms3o).toFixed(2)), backgroundColor:'rgba(99,102,241,.65)', borderRadius:3 },
        { label:'MS-4', data: d.map(r=>(r.ms4c-r.ms4o).toFixed(2)), backgroundColor:'rgba(16,185,129,.65)', borderRadius:3 },
        { label:'MS-5', data: d.map(r=>(r.ms5c-r.ms5o).toFixed(2)), backgroundColor:'rgba(59,130,246,.65)', borderRadius:3 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{color:TICK,font:{size:11}} }, tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1} },
      scales:{ x:{stacked:false,grid:{color:GRID},ticks:{color:TICK,font:{size:9},maxRotation:45}}, y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}} }
    }
  })
})
</script>
