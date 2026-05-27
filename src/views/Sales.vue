<template>
  <div>
    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-block">
        <div class="kpi-label">Sales Days</div>
        <div class="kpi-value" style="font-size:26px">30</div>
        <div class="kpi-sub">April 2026</div>
      </div>
      <div class="stat-block">
        <div class="kpi-label">Avg Daily Revenue</div>
        <div class="kpi-value" style="font-size:26px">{{ fmtCr(store.avgDailyRevenue) }}</div>
        <div class="kpi-sub">Per day</div>
      </div>
      <div class="stat-block">
        <div class="kpi-label">Max Day Revenue</div>
        <div class="kpi-value" style="font-size:26px">{{ fmtCr(store.maxDayRevenue) }}</div>
        <div class="kpi-sub">{{ store.maxDayDate }}</div>
      </div>
      <div class="stat-block">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-value" style="font-size:26px">{{ fmtCr(store.totalExp) }}</div>
        <div class="kpi-sub">All days combined</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <input class="filter-input" v-model="search" placeholder="🔍 Search narration or date…" style="min-width:220px">
      <select class="filter-select" v-model="sortBy">
        <option value="date">Sort: Date</option>
        <option value="revenue_desc">Revenue ↓</option>
        <option value="revenue_asc">Revenue ↑</option>
        <option value="ms_desc">MS Volume ↓</option>
        <option value="exp_desc">Expenses ↓</option>
      </select>
      <span class="muted" style="margin-left:auto;font-size:12px">Showing {{ filtered.length }} of {{ store.sales.length }} records</span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th>
              <th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Rate MS</th><th>Rate HSD</th><th>Rate Speed</th>
              <th>Revenue (₹)</th><th>Cash (₹)</th>
              <th>Card (₹)</th><th>PhonePe (₹)</th>
              <th>Expenses</th><th>Credit</th><th>Balance</th><th>Narration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="r.date">
              <td class="mono muted" style="font-size:11px">{{ i+1 }}</td>
              <td><span class="mono" style="font-size:12px;color:var(--accent)">{{ r.date }}</span></td>
              <td><span class="badge badge-ms">{{ r.ms }}</span></td>
              <td><span class="badge badge-hsd">{{ r.hsd }}</span></td>
              <td><span class="badge badge-speed">{{ r.speed }}</span></td>
              <td class="mono" style="font-size:11.5px">{{ r.rateMS }}</td>
              <td class="mono" style="font-size:11.5px">{{ r.rateHSD }}</td>
              <td class="mono" style="font-size:11.5px">{{ r.rateSpeed }}</td>
              <td class="amt warning">{{ fmt(r.revenue) }}</td>
              <td class="amt positive">{{ fmt(r.cash) }}</td>
              <td class="amt" style="color:var(--blue)">{{ r.card > 0 ? fmt(r.card) : '—' }}</td>
              <td class="amt" style="color:var(--indigo)">{{ fmt(r.phonepay) }}</td>
              <td class="amt" :class="r.exp > 10000 ? 'negative' : r.exp > 3000 ? 'warning' : ''">{{ fmt(r.exp) }}</td>
              <td class="amt" style="color:var(--red)">{{ r.credit > 0 ? fmt(r.credit) : '—' }}</td>
              <td class="amt warning">{{ fmt(r.balance) }}</td>
              <td><div class="narration" :title="r.narration">{{ r.narration }}</div></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">TOTAL</td>
              <td>{{ fmt(store.totalMS, 2) }}</td>
              <td>{{ fmt(store.totalHSD, 2) }}</td>
              <td>{{ fmt(store.totalSpeed, 2) }}</td>
              <td colspan="3">—</td>
              <td>{{ fmt(store.totalRevenue) }}</td>
              <td>{{ fmt(store.totalCash) }}</td>
              <td>{{ fmt(store.totalCard) }}</td>
              <td>{{ fmt(store.totalPhone) }}</td>
              <td>{{ fmt(store.totalExp) }}</td>
              <td>{{ fmt(store.totalCredit) }}</td>
              <td colspan="2">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSalesStore } from '@/stores/salesStore'
import { useFormat } from '@/composables/useFormat'

const store = useSalesStore()
const { fmt, fmtCr } = useFormat()

const search = ref('')
const sortBy = ref('date')

const filtered = computed(() => {
  let d = [...store.sales]
  if (search.value) {
    const q = search.value.toLowerCase()
    d = d.filter(r => r.narration.toLowerCase().includes(q) || r.date.toLowerCase().includes(q))
  }
  if (sortBy.value === 'revenue_desc') d.sort((a,b) => b.revenue - a.revenue)
  else if (sortBy.value === 'revenue_asc') d.sort((a,b) => a.revenue - b.revenue)
  else if (sortBy.value === 'ms_desc') d.sort((a,b) => b.ms - a.ms)
  else if (sortBy.value === 'exp_desc') d.sort((a,b) => b.exp - a.exp)
  return d
})
</script>
