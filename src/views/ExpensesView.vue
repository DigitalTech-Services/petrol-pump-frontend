<template>
  <div>
    <PageHeader title="Expenses" subtitle="Daily expense tracker & analysis" :crumbs="['Home','Expenses']">
      <template #actions>
        <button class="btn btn-ghost">📥 Export</button>
        <button class="btn btn-primary">＋ Add Expense</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Expenses"   :value="'₹' + fmt(totalExp)"   icon="🧾" color="#ef4444" sub="April 2026" />
      <KpiCard label="Avg Per Day"       value="₹4,312"                 icon="📊" color="#f59e0b" sub="30-day avg" />
      <KpiCard label="Lowest Day"        value="₹615"                   icon="✅" color="#10b981" sub="Apr 06, 2026" />
      <KpiCard label="Highest Day"       value="₹23,777"                icon="⚠️" color="#ef4444" sub="Apr 10, 2026" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily Expenses + Narration</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>#</th><th>Date</th><th>Amount (₹)</th><th>Category / Notes</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in expData" :key="r.date">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
                <td class="amt" :class="r.exp > 10000 ? 'text-negative' : r.exp > 3000 ? 'text-[#f59e0b]' : ''">
                  {{ fmt(r.exp) }}
                </td>
                <td class="max-w-[280px]">
                  <div class="text-[12px] text-[#8a9ab5] truncate" :title="r.narration">{{ r.narration }}</div>
                </td>
              </tr>
            </tbody>
            <tfoot><tr><td colspan="2">TOTAL</td><td>{{ fmt(totalExp) }}</td><td>—</td></tr></tfoot>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Expense Trend</div></div>
        <div class="card-body">
          <BaseChart type="bar" :data="expChartData" :options="barOpts" :height="440" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt }    from '@/utils/format'

const expData = [
  {date:'01 Apr',exp:1086, narration:'Employee Short +Density + Tea'},
  {date:'02 Apr',exp:3832, narration:'Employee Short + Tea + DG Diesel + Snacks'},
  {date:'03 Apr',exp:1963, narration:'Employee Short + Juice + Tea + Ghanta gadi'},
  {date:'04 Apr',exp:6687, narration:'Employee Short + Water Jar + Stationary'},
  {date:'05 Apr',exp:708,  narration:'Employee Short + Tea'},
  {date:'06 Apr',exp:615,  narration:'Employee Short + Tea'},
  {date:'07 Apr',exp:1108, narration:'Employee Short + Tanker + Xerox'},
  {date:'08 Apr',exp:1729, narration:'Employee Short + Tea'},
  {date:'09 Apr',exp:9153, narration:'Employee Short + Tea + Air Machine Pipe + Fabrication'},
  {date:'10 Apr',exp:23777,narration:'Employee Short + Tanker + Tea + Petrol'},
  {date:'11 Apr',exp:3722, narration:'Employee Short + Ghanta Gadi + Stationary + Light Electrician + Key'},
  {date:'12 Apr',exp:3124, narration:'Employee short + Tea + DG Diesel + Water Bottle'},
  {date:'13 Apr',exp:2119, narration:'Employee Short + Jayesh Advance + Tea + Harpick'},
  {date:'14 Apr',exp:1171, narration:'Employee Short + Tea + Tanker'},
  {date:'15 Apr',exp:709,  narration:'Employee Short + Tea + Tanker'},
  {date:'16 Apr',exp:1328, narration:'Employee short + Tea'},
  {date:'17 Apr',exp:13383,narration:'Employee Short + Dhanu + LED light'},
  {date:'18 Apr',exp:2033, narration:'Employee Short + Light Fitting + Tea'},
  {date:'19 Apr',exp:1399, narration:'Employee Short + Tea + Lock + Tanker'},
  {date:'20 Apr',exp:6207, narration:'Pooja Tailor + Ajay Adv + Employee Short + Tea'},
  {date:'21 Apr',exp:5419, narration:'Employee Short + DG Diesel + Tea + Shoes'},
  {date:'22 Apr',exp:866,  narration:'Employee Short + Avasthi + Tea'},
  {date:'23 Apr',exp:1001, narration:'Water + Employee Short + Tanker'},
  {date:'24 Apr',exp:16600,narration:'Santosh Advance + Tea'},
  {date:'25 Apr',exp:18049,narration:'Fabrication + Tanker + Dhanu Petrol + Tea + Employee Short'},
  {date:'26 Apr',exp:1984, narration:'Employee Short + Tea'},
  {date:'27 Apr',exp:2100, narration:'Employee Short + Tea + Paint'},
  {date:'28 Apr',exp:3482, narration:'Employee Short + Tea + Tanker'},
  {date:'29 Apr',exp:856,  narration:'Employee Short + Tea'},
  {date:'30 Apr',exp:1342, narration:'Employee Short + DG Diesel + Tea'},
]

const totalExp = computed(() => expData.reduce((a, r) => a + r.exp, 0))

const expChartData = computed(() => ({
  labels: expData.map(r => r.date.split(' ')[0]),
  datasets: [{
    label: 'Expenses (₹)',
    data: expData.map(r => r.exp),
    backgroundColor: expData.map(r => r.exp > 10000 ? '#ef4444' : r.exp > 3000 ? '#f59e0b' : 'rgba(239,68,68,0.45)'),
    borderRadius: 4, borderSkipped: false,
  }]
}))

const barOpts = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 9 }, maxRotation: 60 } },
    y: { ticks: { callback: v => '₹' + v } }
  }
}
</script>
