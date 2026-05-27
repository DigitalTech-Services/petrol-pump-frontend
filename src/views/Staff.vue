<template>
  <div>
    <div class="kpi-grid">
      <div class="kpi-card" style="--kpi-c:var(--accent)">
        <div class="kpi-label">Total Staff</div>
        <div class="kpi-value">{{ store.staff.length }}</div>
        <div class="kpi-sub">Active employees</div>
        <div class="kpi-icon">👥</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--red)">
        <div class="kpi-label">Total Payroll</div>
        <div class="kpi-value">{{ fmtINR(store.totalPayroll) }}</div>
        <div class="kpi-sub">Working salaries</div>
        <div class="kpi-icon">💵</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--green)">
        <div class="kpi-label">Final Payout</div>
        <div class="kpi-value">{{ fmtINR(finalPayout) }}</div>
        <div class="kpi-sub">After advances</div>
        <div class="kpi-icon">✅</div>
      </div>
      <div class="kpi-card" style="--kpi-c:var(--blue)">
        <div class="kpi-label">Total Advances</div>
        <div class="kpi-value">{{ fmtINR(store.totalAdvances) }}</div>
        <div class="kpi-sub">All staff combined</div>
        <div class="kpi-icon">📤</div>
      </div>
    </div>

    <!-- Staff Cards -->
    <div class="staff-grid">
      <div class="staff-card" v-for="s in store.staff" :key="s.name">
        <div class="s-avatar" :style="{ background: s.color }">{{ s.name.slice(0,2).toUpperCase() }}</div>
        <div class="s-name">{{ s.name }}</div>
        <div class="s-meta">{{ s.role }} · {{ s.days }}/30 days</div>
        <div class="s-stats">
          <div class="s-stat">
            <div class="s-stat-label">Salary</div>
            <div class="s-stat-val positive">₹{{ fmt(s.salary) }}</div>
          </div>
          <div class="s-stat">
            <div class="s-stat-label">Advance</div>
            <div class="s-stat-val negative">₹{{ fmt(s.advance) }}</div>
          </div>
          <div class="s-stat">
            <div class="s-stat-label">Final</div>
            <div class="s-stat-val" :style="{ color: s.final < 0 ? 'var(--red)' : 'var(--accent)' }">
              ₹{{ fmt(Math.abs(s.final)) }}<span v-if="s.final<0" class="negative"> DR</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff salary bar chart -->
    <div class="card mb-5" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">Staff Salary Overview</div></div>
      <div class="card-body">
        <div class="chart-wrap"><canvas ref="staffChartEl"></canvas></div>
      </div>
    </div>

    <!-- Advance tracker table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Staff Advance Tracker – April 2026</div>
        <div class="card-sub" style="margin-top:2px">Day-wise advance payments</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th v-for="n in store.staffNames" :key="n">{{ n }}</th>
              <th>Day Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.advances" :key="r.date">
              <td><span class="mono" style="font-size:12px;color:var(--accent)">{{ r.date }}</span></td>
              <td v-for="n in store.staffNames" :key="n">
                <span v-if="r[n]>0" class="badge badge-red">₹{{ fmt(r[n]) }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="amt warning">{{ fmt(store.staffNames.reduce((a,n)=>a+(r[n]||0),0)) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL</td>
              <td v-for="n in store.staffNames" :key="n">
                {{ fmt(store.advances.reduce((a,r)=>a+(r[n]||0),0)) }}
              </td>
              <td>{{ fmt(store.advances.reduce((a,r)=>a+store.staffNames.reduce((b,n)=>b+(r[n]||0),0),0)) }}</td>
            </tr>
          </tfoot>
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
const { fmt, fmtINR } = useFormat()
const { GRID, TICK } = useChartDefaults()
const staffChartEl = ref(null)

const finalPayout = computed(() => store.staff.reduce((a,s) => a + s.final, 0))

onMounted(() => {
  new Chart(staffChartEl.value, {
    type: 'bar',
    data: {
      labels: store.staff.map(s => s.name),
      datasets: [
        { label:'Salary',  data:store.staff.map(s=>s.salary),  backgroundColor:'rgba(16,185,129,.65)', borderRadius:4 },
        { label:'Advance', data:store.staff.map(s=>s.advance), backgroundColor:'rgba(239,68,68,.55)',  borderRadius:4 },
        { label:'Final',   data:store.staff.map(s=>Math.max(s.final,0)), backgroundColor:'rgba(245,158,11,.65)', borderRadius:4 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:TICK,font:{size:11}}}, tooltip:{backgroundColor:'#1c2535',titleColor:'#e2e8f4',bodyColor:'#8796b0',borderColor:'#2a3d57',borderWidth:1, callbacks:{label:ctx=>'₹'+Number(ctx.raw).toLocaleString('en-IN')}} },
      scales:{ x:{grid:{color:GRID},ticks:{color:TICK,font:{size:10}}}, y:{grid:{color:GRID},ticks:{color:TICK,font:{size:10},callback:v=>'₹'+Number(v).toLocaleString('en-IN')}} }
    }
  })
})
</script>
