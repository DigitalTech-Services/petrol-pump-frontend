<template>
  <div>
    <PageHeader title="Monthly Reports" :subtitle="`Analytics, P&L and export — ${monthLabel}`" :crumbs="['Home','Reports']">
      <template #actions>
        <input type="month" v-model="selectedPeriod" class="form-input" @change="loadAll" />
        <button class="btn btn-ghost flex items-center gap-1.5" @click="printReport"><Printer :size="14" /> Print</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="exportExcel"><BarChart3 :size="14" /> Excel</button>
        <button class="btn btn-primary flex items-center gap-1.5" @click="exportPdf"><FileText :size="14" /> PDF Report</button>
      </template>
    </PageHeader>

    <!-- Tab Navigation -->
    <div class="tab-bar mb-6">
      <button class="tab-btn flex items-center gap-1.5" :class="{ active: tab === 'summary' }"   @click="tab = 'summary'"><BarChart3 :size="14" /> Summary</button>
      <button class="tab-btn flex items-center gap-1.5" :class="{ active: tab === 'fuel' }"      @click="tab = 'fuel'"><Fuel :size="14" /> Fuel Report</button>
      <button class="tab-btn flex items-center gap-1.5" :class="{ active: tab === 'financial' }" @click="tab = 'financial'"><Banknote :size="14" /> P&L</button>
      <button class="tab-btn flex items-center gap-1.5" :class="{ active: tab === 'staff' }"     @click="tab = 'staff'"><Users :size="14" /> Staff</button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-24 text-[#5a6a82]">
      <RotateCw :size="20" class="animate-spin mr-2" /> Loading report…
    </div>

    <template v-else>
    <!-- ===== SUMMARY TAB ===== -->
    <template v-if="tab === 'summary'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Gross Revenue"   :value="fmtINR(monthly?.kpis?.gross_revenue)"        :icon="Banknote" color="#f59e0b" :sub="`${monthly?.days ?? 0} days`" />
        <KpiCard label="Total Fuel Sold" :value="fmt(monthly?.kpis?.total_fuel) + ' L'"        :icon="Fuel"    color="#10b981" sub="All fuel types" />
        <KpiCard label="Total Expenses"  :value="fmtINR(monthly?.kpis?.total_expenses)"        :icon="Receipt" color="#ef4444" sub="Operational" />
        <KpiCard label="Net Payroll"     :value="fmtINR(monthly?.kpis?.net_payroll)"           :icon="Users"   color="#6366f1" :sub="`${monthly?.kpis?.staff_count ?? 0} staff`" />
      </div>

      <!-- P&L Summary Card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-white flex items-center gap-2"><ClipboardList :size="16" /> {{ monthLabel }} — P&L Summary</div>
          </div>
          <div class="card-body">
            <div class="space-y-0">
              <div v-for="row in plRows" :key="row.label"
                class="flex items-center justify-between py-3"
                :style="{ borderBottom: row.divider ? '2px solid #2e3a50' : '1px solid #1c2230' }">
                <span class="text-[13px]" :class="row.bold ? 'font-bold text-white font-display text-[15px]' : 'text-[#8a9ab5]'"
                  :style="{ paddingLeft: row.indent ? '16px' : '0' }">
                  {{ row.label }}
                </span>
                <span class="font-mono-custom text-[13px]" :class="row.class || 'text-[#e8edf5]'"
                  :style="{ fontSize: row.bold ? '16px' : '13px' }">
                  {{ row.value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Collection breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="font-display font-bold text-[15px] text-white flex items-center gap-2"><CreditCard :size="16" /> Collection Breakdown</div>
          </div>
          <div class="card-body">
            <BaseChart type="doughnut" :data="collectionChart" :options="doughnutOpts" :height="220" />
            <div class="mt-4 space-y-2">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#10b981"/><span class="text-[12.5px] text-[#8a9ab5]">Cash</span></div>
                <span class="amt text-[#10b981]">{{ fmtINR(monthly?.collection?.cash) }} ({{ monthly?.collection?.cash_pct ?? 0 }}%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#6366f1"/><span class="text-[12.5px] text-[#8a9ab5]">PhonePe/UPI</span></div>
                <span class="amt text-[#6366f1]">{{ fmtINR(monthly?.collection?.phone_pe) }} ({{ monthly?.collection?.phone_pe_pct ?? 0 }}%)</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" style="background:#3b82f6"/><span class="text-[12.5px] text-[#8a9ab5]">Card (Pine Labs)</span></div>
                <span class="amt text-[#3b82f6]">{{ fmtINR(monthly?.collection?.card) }} ({{ monthly?.collection?.card_pct ?? 0 }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Daily Revenue vs Collections — {{ monthLabel }}</div>
        </div>
        <div class="card-body">
          <BaseChart type="line" :data="revVsCollChart" :options="lineOpts" :height="280" />
        </div>
      </div>
    </template>

    <!-- ===== FUEL TAB ===== -->
    <template v-if="tab === 'fuel'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card" v-for="f in fuelCards" :key="f.key">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white flex items-center gap-2"><Fuel :size="16" :class="f.iconClass" /> {{ f.title }}</div></div>
          <div class="card-body space-y-3">
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Total Volume</span><span class="amt font-semibold" :style="{color:f.color}">{{ fmt(f.stats.total_volume) }} L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Rate/Litre</span><span class="amt">₹{{ fmt(f.stats.rate) }}</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Revenue</span><span class="amt font-semibold" :style="{color:f.color}">{{ fmtINR(f.stats.revenue) }}</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Avg Daily</span><span class="amt">{{ fmt(f.stats.avg_daily, 0) }} L</span></div>
            <div class="flex justify-between"><span class="text-[#8a9ab5]">Peak Day</span><span class="amt">{{ fmt(f.stats.peak_volume, 0) }} L ({{ f.stats.peak_date ?? '—' }})</span></div>
            <div class="fuel-bar-track mt-2"><div class="fuel-bar-fill" :style="{ width: f.stats.pct_of_total + '%', background: f.color }"/></div>
            <div class="text-[11px] text-[#5a6a82]">{{ f.stats.pct_of_total }}% of total fuel volume</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">MS Daily Volume</div></div>
          <div class="card-body"><BaseChart type="bar" :data="msBarChart" :options="barOpts" :height="260" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">HSD Daily Volume</div></div>
          <div class="card-body"><BaseChart type="bar" :data="hsdBarChart" :options="barOpts" :height="260" /></div>
        </div>
      </div>
    </template>

    <!-- ===== P&L TAB ===== -->
    <template v-if="tab === 'financial'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Revenue vs Cash vs PhonePe</div></div>
          <div class="card-body"><BaseChart type="line" :data="revVsCollChart" :options="lineOpts" :height="260" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Daily Expenses Trend</div></div>
          <div class="card-body"><BaseChart type="bar" :data="expBarChart" :options="expOpts" :height="260" /></div>
        </div>
      </div>
      <!-- Expense table -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Expense Category Breakdown</div></div>
        <div class="card-body">
          <div v-if="!expCategories.length" class="text-center py-8 text-[#5a6a82] text-[13px]">No expenses recorded for {{ monthLabel }}.</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div v-for="cat in expCategories" :key="cat.label"
              class="p-4 rounded-xl" style="background:#161b24; border:1px solid #1c2230">
              <component :is="cat.icon" :size="24" class="mb-2" :style="{color: cat.color}" />
              <div class="text-[12px] text-[#5a6a82] mb-1">{{ cat.label }}</div>
              <div class="font-display font-bold text-[18px]" :style="{ color: cat.color }">₹{{ fmt(cat.value, 0) }}</div>
              <div class="text-[11px] text-[#5a6a82] mt-1">{{ cat.sub }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== STAFF TAB ===== -->
    <template v-if="tab === 'staff'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Staff Salary Distribution</div></div>
          <div class="card-body"><BaseChart type="bar" :data="staffSalaryChart" :options="staffBarOpts" :height="280" /></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Salary vs Advance vs Net</div></div>
          <div class="card-body"><BaseChart type="bar" :data="staffCompChart" :options="staffGroupOpts" :height="280" /></div>
        </div>
      </div>

      <!-- Staff Commission Summary -->
      <div class="card">
        <div class="card-header"><div class="font-display font-bold text-[15px] text-white">Staff Payroll Summary</div></div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Days</th><th>Gross</th><th>Advance</th><th>Net</th><th>% Utilised</th></tr>
            </thead>
            <tbody>
              <tr v-if="!staffSummary.length">
                <td colspan="7" class="text-center text-[#5a6a82] py-6 text-[13px]">No staff records found.</td>
              </tr>
              <tr v-for="s in staffSummary" :key="s.name">
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-display"
                      :style="{ background: s.color }">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-white">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray">{{ s.role }}</span></td>
                <td class="amt">{{ s.days }}</td>
                <td class="amt text-positive">₹{{ fmt(s.gross) }}</td>
                <td class="amt text-negative">{{ s.advance > 0 ? '₹' + fmt(s.advance) : '—' }}</td>
                <td><span class="font-display font-bold text-[14px]" :class="s.net < 0 ? 'text-negative' : 'text-[#f59e0b]'">₹{{ fmt(s.net) }}</span></td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 fuel-bar-track" style="min-width:60px">
                      <div class="fuel-bar-fill" :style="{ width: Math.min(100, s.gross ? s.advance / s.gross * 100 : 0) + '%', background: s.color }" />
                    </div>
                    <span class="text-[11px] text-[#5a6a82]">{{ s.gross ? Math.round(s.advance / s.gross * 100) : 0 }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="staffSummary.length">
              <tr>
                <td colspan="3">TOTAL</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.gross,0)) }}</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.advance,0)) }}</td>
                <td>₹{{ fmt(staffSummary.reduce((a,s)=>a+s.net,0)) }}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useSelectedStationStore } from '@/stores/selectedStation'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import BaseChart  from '@/components/charts/BaseChart.vue'
import { fmt, fmtINR } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { reportsApi } from '@/services/api'
import {
  Banknote, Fuel, Receipt, Users, CreditCard, BarChart3,
  ClipboardList, Printer, FileText, HardHat, Truck, Coffee, Zap,
  Wrench, Package, MoreHorizontal, RotateCw
} from 'lucide-vue-next'

const ui              = useUiStore()
const selectedStation = useSelectedStationStore()
const tab = ref('summary')

// ── Month filter ──────────────────────────────────────────────────
const now = new Date()
const selectedPeriod = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const monthLabel = computed(() => {
  const [y, m] = selectedPeriod.value.split('-')
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// ── Data loading ───────────────────────────────────────────────────
const loading = ref(false)
const monthly = ref(null)
const fuel    = ref(null)
const pnl     = ref(null)
const staff   = ref([])

async function loadAll() {
  loading.value = true
  try {
    const params = {
      period: selectedPeriod.value,
      ...(selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}),
    }
    const [m, f, p, s] = await Promise.all([
      reportsApi.getMonthly(params),
      reportsApi.getFuelReport(params),
      reportsApi.getPnl(params),
      reportsApi.getStaffReport(params),
    ])
    monthly.value = m?.data ?? null
    fuel.value    = f?.data ?? null
    pnl.value     = p?.data ?? null
    staff.value   = s?.data?.staff ?? []
  } catch (e) {
    ui.error(e?.message || 'Failed to load report.')
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(() => selectedStation.selectedStationId, loadAll)

// ── Chart / display helpers ────────────────────────────────────────
const revVsCollChart = computed(() => {
  const d = monthly.value?.daily ?? []
  return {
    labels: d.map(r => r.day),
    datasets: [
      { label:'Revenue', data: d.map(r => r.revenue),  borderColor:'#f59e0b', tension:0.4, pointRadius:2, fill:false },
      { label:'Cash',    data: d.map(r => r.cash),     borderColor:'#10b981', tension:0.4, pointRadius:2, fill:false },
      { label:'PhonePe', data: d.map(r => r.phone_pe), borderColor:'#6366f1', tension:0.4, pointRadius:2, fill:false },
    ]
  }
})

const collectionChart = computed(() => ({
  labels: ['Cash', 'PhonePe/UPI', 'Card'],
  datasets: [{
    data: [monthly.value?.collection?.cash ?? 0, monthly.value?.collection?.phone_pe ?? 0, monthly.value?.collection?.card ?? 0],
    backgroundColor: ['#10b981','#6366f1','#3b82f6'],
    borderWidth: 2, borderColor: '#0a0c10',
  }]
}))

const fuelCards = computed(() => {
  const f = fuel.value?.fuel ?? {}
  const empty = { total_volume:0, rate:0, revenue:0, avg_daily:0, peak_volume:0, peak_date:null, pct_of_total:0 }
  return [
    { key:'MS',    title:'MS Petrol',      color:'#f59e0b', iconClass:'',                stats: f.MS    ?? empty },
    { key:'HSD',   title:'HSD Diesel',     color:'#10b981', iconClass:'text-[#10b981]',   stats: f.HSD   ?? empty },
    { key:'Speed', title:'Speed Premium',  color:'#3b82f6', iconClass:'text-[#3b82f6]',   stats: f.Speed ?? empty },
  ]
})

const msBarChart = computed(() => {
  const d = fuel.value?.daily?.MS ?? []
  return { labels: d.map(r => r.day), datasets: [{ label:'MS (L)', data: d.map(r => r.volume), backgroundColor:'rgba(245,158,11,0.65)', borderRadius:4, borderSkipped:false }] }
})

const hsdBarChart = computed(() => {
  const d = fuel.value?.daily?.HSD ?? []
  return { labels: d.map(r => r.day), datasets: [{ label:'HSD (L)', data: d.map(r => r.volume), backgroundColor:'rgba(16,185,129,0.65)', borderRadius:4, borderSkipped:false }] }
})

const expBarChart = computed(() => {
  const d = pnl.value?.daily ?? []
  const vals = d.map(r => r.expenses)
  return {
    labels: d.map(r => r.day),
    datasets: [{
      label:'Expenses (₹)', data: vals,
      backgroundColor: vals.map(v => v > 10000 ? '#ef4444' : v > 3000 ? '#f59e0b' : 'rgba(239,68,68,0.4)'),
      borderRadius: 4, borderSkipped: false,
    }]
  }
})

const CATEGORY_ICONS = {
  'Employee Shortage': { icon: HardHat, color:'#f59e0b' },
  'Tanker Charges':    { icon: Truck,   color:'#10b981' },
  'Tea & Snacks':      { icon: Coffee,  color:'#06b6d4' },
  'DG Diesel':         { icon: Zap,     color:'#ef4444' },
  'Maintenance':       { icon: Wrench,  color:'#8b5cf6' },
  'Stationary':        { icon: Package, color:'#3b82f6' },
  'Other':             { icon: MoreHorizontal, color:'#5a6a82' },
}

const expCategories = computed(() => (pnl.value?.by_category ?? []).map(c => ({
  icon:  CATEGORY_ICONS[c.category]?.icon  ?? Receipt,
  color: CATEGORY_ICONS[c.category]?.color ?? '#5a6a82',
  label: c.category,
  value: c.total,
  sub:   `${c.count} record${c.count !== 1 ? 's' : ''}`,
})))

const STAFF_COLORS = ['#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#6366f1','#78716c']

const staffSummary = computed(() => staff.value.map((s, i) => ({ ...s, color: STAFF_COLORS[i % STAFF_COLORS.length] })))

const staffSalaryChart = computed(() => ({
  labels: staffSummary.value.map(s => s.name),
  datasets: [{ label:'Salary (₹)', data: staffSummary.value.map(s => s.gross), backgroundColor: staffSummary.value.map(s => s.color), borderRadius:4, borderSkipped:false }]
}))

const staffCompChart = computed(() => ({
  labels: staffSummary.value.map(s => s.name),
  datasets: [
    { label:'Gross Salary', data: staffSummary.value.map(s => s.gross),              backgroundColor:'rgba(16,185,129,0.6)', borderRadius:3 },
    { label:'Advance',      data: staffSummary.value.map(s => s.advance),            backgroundColor:'rgba(239,68,68,0.6)',  borderRadius:3 },
    { label:'Net Payable',  data: staffSummary.value.map(s => Math.max(0, s.net)),   backgroundColor:'rgba(245,158,11,0.6)', borderRadius:3 },
  ]
}))

const lineOpts = { scales: { x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}} } }
const barOpts  = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>v+'L'}}} }
const expOpts  = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+v}}} }
const doughnutOpts = { cutout:'68%', plugins:{legend:{display:false}} }
const staffBarOpts = { plugins:{legend:{display:false}}, scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}}} }
const staffGroupOpts = { scales:{x:{ticks:{font:{size:9},maxRotation:60}}, y:{ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'K'}}} }

// ── P&L rows (derived from monthly + fuel report) ──────────────────
const plRows = computed(() => {
  const k = monthly.value?.kpis ?? {}
  const f = monthly.value?.fuel ?? {}
  const c = monthly.value?.collection ?? {}
  const totalFuel = (f.ms_volume ?? 0) + (f.hsd_volume ?? 0) + (f.speed_volume ?? 0)

  return [
    { label:'Period',               value:`${monthLabel.value} (${monthly.value?.days ?? 0} days)` },
    { label:'MS Volume Sold',       value:`${fmt(f.ms_volume)} L`,    class:'text-[#f59e0b]' },
    { label:'HSD Volume Sold',      value:`${fmt(f.hsd_volume)} L`,   class:'text-[#10b981]' },
    { label:'Speed Volume Sold',    value:`${fmt(f.speed_volume)} L`, class:'text-[#3b82f6]' },
    { label:'Total Fuel Sold',      value:`${fmt(totalFuel)} L`,      class:'text-positive', divider:true },
    { label:'MS Rate',              value:`₹${fmt(f.rate_ms)} / Litre`,    indent:true },
    { label:'HSD Rate',             value:`₹${fmt(f.rate_hsd)} / Litre`,   indent:true },
    { label:'Speed Rate',           value:`₹${fmt(f.rate_speed)} / Litre`,indent:true, divider:true },
    { label:'Cash Received',        value:fmtINR(c.cash),      class:'text-positive', indent:true },
    { label:'PhonePe / UPI',        value:fmtINR(c.phone_pe),  class:'text-[#6366f1]', indent:true },
    { label:'Card (Pine Labs)',     value:fmtINR(c.card),      class:'text-[#3b82f6]', indent:true },
    { label:'Gross Revenue',        value:fmtINR(k.gross_revenue),   class:'text-[#f59e0b]', divider:true },
    { label:'Operational Expenses', value:`−${fmtINR(k.total_expenses)}`, class:'text-negative', indent:true },
    { label:'Staff Payroll',        value:`−${fmtINR(k.net_payroll)}`,    class:'text-negative', indent:true, divider:true },
    { label:'NET OPERATING PROFIT', value:fmtINR(monthly.value?.net_profit), class:'text-[#f59e0b]', bold:true },
  ]
})

// ── Export / Print ───────────────────────────────────────────────
const exportPdf   = () => { printTable(`Monthly P&L Report — ${monthLabel.value}`, ['Metric','Value'], plRows.value.map(r=>[r.label,r.value])); ui.success('Print dialog opened!') }
const exportExcel = () => { exportCSV(`Monthly_Report_${selectedPeriod.value}`, ['Metric','Value'], plRows.value.map(r=>[r.label,r.value])); ui.success('CSV exported!') }
const printReport = () => window.print()
</script>
