<template>
  <div>
    <PageHeader title="Dashboard" subtitle="Monthly overview & key metrics" :crumbs="['Home', 'Dashboard']">
      <template #actions>
        <select v-model="selectedPeriod" class="form-select text-[12px]" @change="refresh">
          <option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="refresh">
          <RotateCw :size="14" :class="{ 'animate-spin': store.loading }" /> Refresh
        </button>
      </template>
    </PageHeader>

    <!-- KPI Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Revenue"  :value="kpi('totalRevenue')"  :icon="Banknote"   color="#f59e0b" :sub="monthLabel"       :loading="store.loading" />
      <KpiCard label="MS Sold (L)"    :value="kpi('msSold')"        :icon="Fuel"       color="#f59e0b" sub="Petrol volume"     :loading="store.loading" />
      <KpiCard label="HSD Sold (L)"   :value="kpi('hsdSold')"       :icon="Fuel"       color="#10b981" sub="Diesel volume"     :loading="store.loading" />
      <KpiCard label="Speed (L)"      :value="kpi('speedSold')"     :icon="Fuel"       color="#3b82f6" sub="Premium fuel"      :loading="store.loading" />
      <KpiCard label="Fuel Profit/Loss" :value="fuelProfitDisplay"  :icon="TrendingUp" :color="fuelProfitColor" :sub="fuelProfitSub" :loading="store.loading" />
      <KpiCard label="Total Cash"     :value="kpi('totalCash')"     :icon="Banknote"   color="#10b981" sub="Cash receipts"     :loading="store.loading" />
      <KpiCard label="PhonePe / UPI"  :value="kpi('totalPhonePe')"  :icon="Smartphone" color="#6366f1" sub="UPI payments"      :loading="store.loading" />
      <KpiCard label="Total Expenses" :value="kpi('totalExpenses')" :icon="Receipt"    color="#ef4444" sub="Operating costs"   :loading="store.loading" />
      <KpiCard label="Staff Payroll"  :value="kpi('staffPayroll')"  :icon="Users"      color="#8b5cf6" sub="Staff salary"      :loading="store.loading" />
    </div>

    <!-- Charts Row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-[var(--text)]">Daily Revenue</div>
            <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Day-wise sales revenue (₹) — {{ monthLabel }}</div>
          </div>
        </div>
        <div class="card-body">
          <div v-if="store.loading" class="flex items-center justify-center h-[240px] text-[var(--text-3)]">
            <RotateCw :size="20" class="animate-spin mr-2" /> Loading…
          </div>
          <BaseChart v-else type="bar" :data="revenueChartData" :options="revenueOpts" :height="240" />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-[var(--text)]">Fuel Volume Mix</div>
            <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">MS vs HSD vs Speed (litres) — {{ monthLabel }}</div>
          </div>
        </div>
        <div class="card-body">
          <div v-if="store.loading" class="flex items-center justify-center h-[240px] text-[var(--text-3)]">
            <RotateCw :size="20" class="animate-spin mr-2" /> Loading…
          </div>
          <BaseChart v-else type="line" :data="fuelMixChartData" :options="lineOpts" :height="240" />
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

      <!-- Payment Split Donut -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Payment Split</div>
        </div>
        <div class="card-body flex flex-col items-center">
          <div v-if="store.loading" class="flex items-center justify-center h-[200px] text-[var(--text-3)]">
            <RotateCw :size="20" class="animate-spin mr-2" /> Loading…
          </div>
          <template v-else>
            <BaseChart type="doughnut" :data="paymentChartData" :options="doughnutOpts" :height="200" />
            <div class="mt-4 w-full space-y-2 text-[12px]">
              <div class="flex justify-between">
                <span class="text-[var(--text-2)]">Cash</span>
                <span class="amt text-[#10b981]">{{ store.paymentSplit ? '₹' + fmt(store.paymentSplit.cash, 0) : '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--text-2)]">PhonePe / UPI</span>
                <span class="amt text-[#6366f1]">{{ store.paymentSplit ? '₹' + fmt(store.paymentSplit.phone_pe, 0) : '—' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--text-2)]">Card (Pine)</span>
                <span class="amt text-[#3b82f6]">{{ store.paymentSplit ? '₹' + fmt(store.paymentSplit.card, 0) : '—' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Stock Levels (static — no stock intake table yet) -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="font-display font-bold text-[15px] text-[var(--text)]">Fuel Stock</div>
            <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Current inventory levels</div>
          </div>
        </div>
        <div class="card-body">
          <div v-if="store.loading" class="flex items-center justify-center py-8 text-[var(--text-3)]">
            <RotateCw :size="20" class="animate-spin mr-2" /> Loading…
          </div>
          <div v-else-if="!hasStockLevels" class="flex items-center justify-center py-8 text-center">
            <div>
              <Fuel :size="32" class="mx-auto mb-2 text-[var(--faint)]" />
              <div class="text-[12px] text-[var(--text-3)]">No stock entries recorded {{ monthLabel }}.</div>
              <div class="text-[11px] text-[var(--faint)] mt-1">Add a stock entry to see levels here.</div>
            </div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="s in stockRows" :key="s.key" class="flex items-center justify-between py-2.5 px-3 rounded-lg"
              style="background:var(--bg-3); border:1px solid var(--bg-4)">
              <div class="flex items-center gap-2.5">
                <span class="badge" :class="s.badge">{{ s.label }}</span>
                <span class="text-[11px] text-[var(--text-3)]">{{ s.date ? `as of ${s.date}` : 'No entries' }}</span>
              </div>
              <span class="font-display font-bold text-[15px]" :style="{ color: s.color }">
                {{ s.closing !== null ? fmt(s.closing) + ' L' : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Quick Stats</div>
        </div>
        <div class="card-body space-y-3">
          <div v-for="stat in quickStats" :key="stat.label"
            class="flex items-center justify-between py-2.5 px-3 rounded-lg"
            style="background:var(--bg-3); border:1px solid var(--bg-4)">
            <div class="flex items-center gap-2.5">
              <component :is="stat.icon" :size="18" />
              <div>
                <div class="text-[12.5px] font-medium text-[var(--text)]">{{ stat.label }}</div>
                <div class="text-[10.5px] text-[var(--text-3)]">{{ stat.sub }}</div>
              </div>
            </div>
            <div class="font-display font-bold text-[15px]" :style="{ color: stat.color }">
              <RotateCw v-if="store.loading" :size="13" class="animate-spin" />
              <span v-else>{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Sales Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Recent Sales</div>
          <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Last 7 days with data — {{ monthLabel }}</div>
        </div>
        <RouterLink v-if="auth.isManager" to="/sales" class="btn btn-ghost ml-auto text-[12px] py-1.5">View All →</RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th><th>MS (L)</th><th>HSD (L)</th><th>Speed (L)</th>
              <th>Revenue</th><th>Cash</th><th>PhonePe</th><th>Expenses</th><th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="store.loading">
              <tr><td colspan="9" class="text-center py-6 text-[var(--text-3)]">
                <RotateCw :size="13" class="animate-spin inline mr-1.5" />Loading…
              </td></tr>
            </template>
            <template v-else-if="!recentSales.length">
              <tr><td colspan="9" class="text-center py-6 text-[var(--text-3)]">No sales data for {{ monthLabel }}.</td></tr>
            </template>
            <template v-else>
              <tr v-for="r in recentSales" :key="r.date">
                <td><span class="font-mono-custom text-[11.5px] text-[#f59e0b]">{{ r.date }}</span></td>
                <td><span class="badge badge-ms">{{ r.ms }}</span></td>
                <td><span class="badge badge-hsd">{{ r.hsd }}</span></td>
                <td><span class="badge badge-speed">{{ r.speed }}</span></td>
                <td class="amt text-[#f59e0b]">₹{{ r.revenue }}</td>
                <td class="amt text-positive">₹{{ r.cash }}</td>
                <td class="amt text-[#6366f1]">₹{{ r.phone }}</td>
                <td class="amt text-negative">₹{{ r.exp }}</td>
                <td class="amt text-[#f59e0b]">₹{{ r.balance }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useSelectedStationStore } from '@/stores/selectedStation'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard   from '@/components/ui/KpiCard.vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import { fmt, fmtINR, chartColors } from '@/utils/format'
import {
  Banknote, Fuel, Smartphone, Receipt, Users,
  Calendar, TrendingUp, Award, CreditCard, BarChart3, RotateCw
} from 'lucide-vue-next'

const auth            = useAuthStore()
const store           = useDashboardStore()
const selectedStation = useSelectedStationStore()

// ── Period selector (last 6 months, most-recent first) ───────────────
const now = new Date()
const periods = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return {
    value: `${y}-${m}`,
    label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  }
})

const selectedPeriod = ref(periods[0].value)
const monthLabel = computed(() => periods.find(p => p.value === selectedPeriod.value)?.label ?? selectedPeriod.value)

const refresh = () => store.fetchAll({
  period: selectedPeriod.value,
  ...(selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}),
})
onMounted(refresh)
watch(() => selectedStation.selectedStationId, refresh)

// ── KPI: returns live value or '—' (no static fallbacks) ─────────────
const kpi = (key) => store.kpis?.[key] ?? '—'

// ── Fuel Stock card — current closing level per fuel type ────────────
const STOCK_FUEL_META = {
  ms:    { label: 'MS',    color: '#f59e0b', badge: 'badge-ms' },
  hsd:   { label: 'HSD',   color: '#10b981', badge: 'badge-hsd' },
  speed: { label: 'Speed', color: '#3b82f6', badge: 'badge-speed' },
}

const stockRows = computed(() =>
  Object.entries(STOCK_FUEL_META).map(([key, meta]) => {
    const level = store.stockLevels?.[key] ?? null
    return {
      key,
      label: meta.label,
      color: meta.color,
      badge: meta.badge,
      closing: level ? level.closing : null,
      date: level ? level.date : null,
    }
  })
)

const hasStockLevels = computed(() => stockRows.value.some((s) => s.closing !== null))

// ── Fuel Profit/Loss — (selling rate − actual rate) × volume, from Fuel Rates ─
const fuelProfitTotal = computed(() => store.profitLoss?.total ?? null)

const fuelProfitDisplay = computed(() => {
  if (fuelProfitTotal.value === null) return '—'
  const amt = Math.abs(fuelProfitTotal.value)
  return (fuelProfitTotal.value < 0 ? '−' : '') + fmtINR(amt)
})

const fuelProfitColor = computed(() => {
  if (fuelProfitTotal.value === null) return '#8b5cf6'
  return fuelProfitTotal.value >= 0 ? '#10b981' : '#ef4444'
})

const fuelProfitSub = computed(() => {
  if (fuelProfitTotal.value === null) return 'Set rates in Settings'
  return fuelProfitTotal.value >= 0 ? 'Profit this month' : 'Loss this month'
})

// ── Charts — fully dynamic, no hardcoded data arrays ─────────────────

const revenueChartData = computed(() => {
  const labels = store.dailyTrend.map(d => d.day)
  const data   = store.dailyTrend.map(d => d.revenue)
  return {
    labels,
    datasets: [{
      label: 'Revenue (₹)',
      data,
      backgroundColor: data.map((v, i) =>
        (i === data.length - 1 || v === Math.max(...data)) ? '#f59e0b' : 'rgba(245,158,11,0.45)'
      ),
      borderRadius: 4,
      borderSkipped: false,
    }],
  }
})

const fuelMixChartData = computed(() => ({
  labels: store.fuelMix.map(d => d.day),
  datasets: [
    { label: 'MS (L)',    data: store.fuelMix.map(d => d.ms),    borderColor: chartColors.ms,    backgroundColor: 'rgba(245,158,11,0.08)', tension: 0.4, fill: true, pointRadius: 2 },
    { label: 'HSD (L)',   data: store.fuelMix.map(d => d.hsd),   borderColor: chartColors.hsd,   backgroundColor: 'rgba(16,185,129,0.06)',  tension: 0.4, fill: true, pointRadius: 2 },
    { label: 'Speed (L)', data: store.fuelMix.map(d => d.speed), borderColor: chartColors.speed, backgroundColor: 'rgba(59,130,246,0.06)',  tension: 0.4, fill: true, pointRadius: 2 },
  ],
}))

const paymentChartData = computed(() => ({
  labels: ['Cash', 'PhonePe / UPI', 'Card'],
  datasets: [{
    data: store.paymentSplit
      ? [store.paymentSplit.cash, store.paymentSplit.phone_pe, store.paymentSplit.card]
      : [0, 0, 0],
    backgroundColor: [chartColors.cash, chartColors.phone, chartColors.card],
    borderWidth: 2,
    borderColor: 'var(--bg)',
  }],
}))

// ── Recent sales — last 7 days that have revenue > 0 ─────────────────
const recentSales = computed(() =>
  store.dailyTrend
    .filter(d => d.revenue > 0)
    .slice(-7)
    .map(d => ({
      date:    new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      ms:      fmt(d.ms, 0),
      hsd:     fmt(d.hsd, 0),
      speed:   fmt(d.speed, 0),
      revenue: fmt(d.revenue, 0),
      cash:    fmt(d.cash, 0),
      phone:   fmt(d.phone_pe, 0),
      exp:     fmt(d.expenses, 0),
      balance: fmt(d.balance, 0),
    }))
)

// ── Quick stats — fully from API ──────────────────────────────────────
const salesDays = computed(() => store.dailyTrend.filter(d => d.revenue > 0).length)

const quickStats = computed(() => {
  const k = store.kpis
  return [
    { icon: Calendar,   label: 'Sales Days',       sub: monthLabel.value,           value: k ? String(salesDays.value) : '—', color: '#f59e0b' },
    { icon: TrendingUp, label: 'Avg Daily Revenue', sub: 'Per day',                  value: k?.avgDailyRevenue ?? '—',          color: '#10b981' },
    { icon: Award,      label: 'Best Day Revenue',  sub: k?.bestDay ?? '—',          value: k?.bestDayRevenue  ?? '—',          color: '#3b82f6' },
    { icon: Fuel,       label: 'Total Fuel Sold',   sub: 'All types',                value: k?.totalFuel       ?? '—',          color: '#6366f1' },
    { icon: CreditCard, label: 'Card Transactions', sub: 'Pine Labs',                value: k?.totalCard       ?? '—',          color: '#8b5cf6' },
    { icon: BarChart3,  label: 'Avg MS / Day',      sub: 'Petrol volume',            value: k?.avgMsPerDay     ?? '—',          color: '#f59e0b' },
  ]
})

// ── Chart options ─────────────────────────────────────────────────────
const revenueOpts = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { font: { size: 9 }, maxRotation: 60 } },
    y: { ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'K' } },
  },
}
const lineOpts     = { scales: { x: { ticks: { font: { size: 9 }, maxRotation: 60 } } } }
const doughnutOpts = { cutout: '68%', plugins: { legend: { position: 'bottom', labels: { padding: 14 } } } }
</script>
