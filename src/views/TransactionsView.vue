<template>
  <div>
    <PageHeader title="Card Transactions" subtitle="Bank of Maharashtra daily transfers" :crumbs="['Home','Transactions']">
      <template #actions>
        <button class="btn btn-ghost">📥 Export</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Transferred" value="₹1.15Cr"  icon="💳" color="#3b82f6" sub="April 2026" />
      <KpiCard label="Transactions"      value="30"       icon="🔢" color="#10b981" sub="Daily transfers" />
      <KpiCard label="Avg Per Day"        value="₹3.85L"  icon="📊" color="#f59e0b" sub="BOM average" />
      <KpiCard label="Max Single"         value="₹4.96L"  icon="🏆" color="#6366f1" sub="Apr 20, 2026" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily PhonePe Transfers — BOM</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>#</th><th>Date</th><th>Bank</th><th>Amount (₹)</th><th>Remarks</th></tr></thead>
            <tbody>
              <tr v-for="(t, i) in txData" :key="t.date">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ t.date }}</span></td>
                <td><span class="badge badge-blue">{{ t.bank }}</span></td>
                <td class="amt-lg text-positive">₹{{ fmt(t.amount) }}</td>
                <td class="text-[12px] text-[#5a6a82]">{{ t.remarks }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="3">TOTAL</td><td>₹{{ fmt(totalTx) }}</td><td>—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Transfer Trend</div></div>
        <div class="card-body">
          <BaseChart type="line" :data="txChartData" :options="lineOpts" :height="500" />
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
import { fmt, chartColors } from '@/utils/format'

const txData = [
  {date:'01 Apr',bank:'BOM',amount:255347,remarks:'PhonePe Settlement'},{date:'02 Apr',bank:'BOM',amount:341592,remarks:'PhonePe Settlement'},
  {date:'03 Apr',bank:'BOM',amount:320556,remarks:'PhonePe Settlement'},{date:'04 Apr',bank:'BOM',amount:334594,remarks:'PhonePe Settlement'},
  {date:'05 Apr',bank:'BOM',amount:352501,remarks:'PhonePe Settlement'},{date:'06 Apr',bank:'BOM',amount:311901,remarks:'PhonePe Settlement'},
  {date:'07 Apr',bank:'BOM',amount:334899,remarks:'PhonePe Settlement'},{date:'08 Apr',bank:'BOM',amount:360322,remarks:'PhonePe Settlement'},
  {date:'09 Apr',bank:'BOM',amount:320268,remarks:'PhonePe Settlement'},{date:'10 Apr',bank:'BOM',amount:375409,remarks:'PhonePe Settlement'},
  {date:'11 Apr',bank:'BOM',amount:381443,remarks:'PhonePe Settlement'},{date:'12 Apr',bank:'BOM',amount:423524,remarks:'PhonePe Settlement'},
  {date:'13 Apr',bank:'BOM',amount:399051,remarks:'PhonePe Settlement'},{date:'14 Apr',bank:'BOM',amount:346960,remarks:'PhonePe Settlement'},
  {date:'15 Apr',bank:'BOM',amount:430348,remarks:'PhonePe Settlement'},{date:'16 Apr',bank:'BOM',amount:425970,remarks:'PhonePe Settlement'},
  {date:'17 Apr',bank:'BOM',amount:341013,remarks:'PhonePe Settlement'},{date:'18 Apr',bank:'BOM',amount:451412,remarks:'PhonePe Settlement'},
  {date:'19 Apr',bank:'BOM',amount:412061,remarks:'PhonePe Settlement'},{date:'20 Apr',bank:'BOM',amount:496614,remarks:'PhonePe Settlement'},
  {date:'21 Apr',bank:'BOM',amount:441893,remarks:'PhonePe Settlement'},{date:'22 Apr',bank:'BOM',amount:439134,remarks:'PhonePe Settlement'},
  {date:'23 Apr',bank:'BOM',amount:454224,remarks:'PhonePe Settlement'},{date:'24 Apr',bank:'BOM',amount:439035,remarks:'PhonePe Settlement'},
  {date:'25 Apr',bank:'BOM',amount:385393,remarks:'PhonePe Settlement'},{date:'26 Apr',bank:'BOM',amount:488292,remarks:'PhonePe Settlement'},
  {date:'27 Apr',bank:'BOM',amount:280223,remarks:'PhonePe Settlement'},{date:'28 Apr',bank:'BOM',amount:402291,remarks:'PhonePe Settlement'},
  {date:'29 Apr',bank:'BOM',amount:391274,remarks:'PhonePe Settlement'},{date:'30 Apr',bank:'BOM',amount:411625,remarks:'PhonePe Settlement'},
]

const totalTx = computed(() => txData.reduce((a, t) => a + t.amount, 0))

const txChartData = computed(() => ({
  labels: txData.map(t => t.date.split(' ')[0]),
  datasets: [{
    label: 'Transfer (₹)',
    data: txData.map(t => t.amount),
    borderColor: chartColors.phone, backgroundColor: 'rgba(99,102,241,0.1)',
    tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: chartColors.phone,
  }]
}))

const lineOpts = {
  plugins: { legend: { display: false } },
  scales: { x: { ticks: { font: { size: 9 }, maxRotation: 60 } }, y: { ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } } }
}
</script>
