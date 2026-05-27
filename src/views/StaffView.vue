<template>
  <div>
    <PageHeader title="Staff & Salary" subtitle="Payroll management — April 2026" :crumbs="['Home','Staff']">
      <template #actions>
        <button class="btn btn-ghost" @click="viewMode = viewMode === 'cards' ? 'table' : 'cards'">
          {{ viewMode === 'cards' ? '📋 Table View' : '🧩 Card View' }}
        </button>
        <button class="btn btn-ghost">📥 Salary Sheet</button>
        <button class="btn btn-primary">＋ Add Staff</button>
      </template>
    </PageHeader>

    <!-- KPI Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Staff"     value="13"           icon="👥" color="#f59e0b" sub="Active employees" />
      <KpiCard label="Total Payroll"   value="₹1,06,615"   icon="💰" color="#ef4444" sub="Working salaries" />
      <KpiCard label="Final Payout"    value="₹1,04,449"   icon="✅" color="#10b981" sub="After advances" />
      <KpiCard label="Total Advances"  value="₹41,885"     icon="📤" color="#6366f1" sub="All staff combined" />
    </div>

    <!-- CARD VIEW -->
    <template v-if="viewMode === 'cards'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div
          v-for="s in staffData" :key="s.name"
          class="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          style="background:#0f1218; border:1px solid #242d3e;"
          :style="{ '--staff-color': s.color }"
        >
          <!-- Top accent bar -->
          <div class="h-1" :style="{ background: s.color }" />

          <div class="p-5">
            <!-- Avatar + Name -->
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[16px] text-white flex-shrink-0"
                :style="{ background: s.color }"
              >
                {{ s.name.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="font-display font-bold text-[15px] text-white leading-tight">{{ s.name }}</div>
                <div class="text-[11.5px] text-[#5a6a82]">{{ s.role }}</div>
              </div>
              <div class="ml-auto">
                <span class="badge" :class="s.finalPayout >= 0 ? 'badge-green' : 'badge-red'" style="font-size:10px">
                  {{ s.daysWorked }}/30d
                </span>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid #1c2230">
              <div>
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Salary</div>
                <div class="font-display font-bold text-[14px] text-[#10b981]">₹{{ fmtK(s.workingSalary) }}</div>
              </div>
              <div>
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Advance</div>
                <div class="font-display font-bold text-[14px] text-[#ef4444]">₹{{ fmtK(s.totalAdvance) }}</div>
              </div>
              <div>
                <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Final</div>
                <div class="font-display font-bold text-[14px]" :style="{ color: s.finalPayout < 0 ? '#ef4444' : '#f59e0b' }">
                  ₹{{ fmtK(s.finalPayout) }}
                </div>
              </div>
            </div>

            <!-- Salary bar -->
            <div class="mt-3">
              <div class="fuel-bar-track">
                <div class="fuel-bar-fill" :style="{ width: salaryPct(s) + '%', background: s.color }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- TABLE VIEW -->
    <template v-else>
      <div class="card mb-6">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Staff Salary Register — April 2026</div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Role</th><th>Days</th>
                <th>Rate/Day</th><th>Working Salary</th><th>Advance</th><th>Final Payout</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in staffData" :key="s.name">
                <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-white flex-shrink-0"
                      :style="{ background: s.color }">{{ s.name.slice(0,2).toUpperCase() }}</div>
                    <span class="font-medium text-white">{{ s.name }}</span>
                  </div>
                </td>
                <td><span class="badge badge-gray text-[11px]">{{ s.role }}</span></td>
                <td>
                  <span class="font-mono-custom text-[13px]">{{ s.daysWorked }}</span>
                  <span class="text-[#5a6a82] text-[11px]">/30</span>
                </td>
                <td class="amt text-[#8a9ab5]">₹{{ s.ratePerDay }}</td>
                <td class="amt text-positive font-semibold">₹{{ fmt(s.workingSalary) }}</td>
                <td class="amt text-negative">{{ s.totalAdvance > 0 ? '₹' + fmt(s.totalAdvance) : '—' }}</td>
                <td>
                  <span class="font-display font-bold text-[15px]"
                    :class="s.finalPayout < 0 ? 'text-negative' : 'text-[#f59e0b]'">
                    ₹{{ fmt(s.finalPayout) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="s.finalPayout < 0 ? 'badge-red' : 'badge-green'">
                    {{ s.finalPayout < 0 ? 'Overpaid' : 'Due' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">TOTAL (13 staff)</td>
                <td>₹{{ fmt(staffData.reduce((a,s) => a + s.workingSalary, 0)) }}</td>
                <td>₹{{ fmt(staffData.reduce((a,s) => a + s.totalAdvance, 0)) }}</td>
                <td>₹{{ fmt(staffData.reduce((a,s) => a + s.finalPayout, 0)) }}</td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- Advance Tracker -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">Advance Tracker</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Daily advance payments per staff member</div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th v-for="n in advanceNames" :key="n">{{ n }}</th>
              <th>Day Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in advanceRows" :key="row.date">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ row.date }}</span></td>
              <td v-for="n in advanceNames" :key="n">
                <span v-if="row[n] > 0" class="badge badge-red text-[11px]">₹{{ fmt(row[n]) }}</span>
                <span v-else class="text-[#2e3a50]">—</span>
              </td>
              <td class="amt text-[#f59e0b] font-semibold">
                {{ fmt(advanceNames.reduce((a, n) => a + (row[n] || 0), 0)) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL</td>
              <td v-for="n in advanceNames" :key="n">{{ fmt(advanceRows.reduce((a, r) => a + (r[n] || 0), 0)) }}</td>
              <td>{{ fmt(advanceRows.reduce((a, r) => a + advanceNames.reduce((b, n) => b + (r[n] || 0), 0), 0)) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import { fmt }    from '@/utils/format'

const viewMode = ref('cards')

const fmtK = (n) => {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const salaryPct = (s) => Math.min(100, Math.round((s.finalPayout / s.workingSalary) * 100))

const staffData = [
  { name:'Ajay',      role:'Senior Staff',  daysWorked:30, ratePerDay:500,   workingSalary:15000, totalAdvance:6880,  finalPayout:6120,  color:'#f59e0b' },
  { name:'Santosh',   role:'Senior Staff',  daysWorked:27, ratePerDay:800,   workingSalary:21600, totalAdvance:25719, finalPayout:-4119, color:'#ef4444' },
  { name:'Ayaz',      role:'Staff',         daysWorked:30, ratePerDay:400,   workingSalary:12000, totalAdvance:1094,  finalPayout:10906, color:'#10b981' },
  { name:'Rizwan',    role:'Staff',         daysWorked:30, ratePerDay:400,   workingSalary:12000, totalAdvance:1517,  finalPayout:10483, color:'#3b82f6' },
  { name:'Rehan',     role:'Part-time',     daysWorked:8,  ratePerDay:458,   workingSalary:3666,  totalAdvance:656,   finalPayout:3010,  color:'#8b5cf6' },
  { name:'Kartik',    role:'Staff',         daysWorked:26, ratePerDay:410,   workingSalary:10666, totalAdvance:2415,  finalPayout:8251,  color:'#06b6d4' },
  { name:'Komal',     role:'Staff',         daysWorked:20, ratePerDay:333,   workingSalary:6666,  totalAdvance:725,   finalPayout:5941,  color:'#f97316' },
  { name:'Tanmay',    role:'Staff',         daysWorked:15, ratePerDay:316,   workingSalary:4750,  totalAdvance:574,   finalPayout:4176,  color:'#84cc16' },
  { name:'Vanshika',  role:'Staff',         daysWorked:16, ratePerDay:316,   workingSalary:5066,  totalAdvance:630,   finalPayout:4436,  color:'#ec4899' },
  { name:'Sahil P',   role:'Petrol',        daysWorked:6,  ratePerDay:366,   workingSalary:2200,  totalAdvance:675,   finalPayout:1525,  color:'#f59e0b' },
  { name:'Sahil A',   role:'Air Machine',   daysWorked:24, ratePerDay:400,   workingSalary:9600,  totalAdvance:0,     finalPayout:9600,  color:'#14b8a6' },
  { name:'Shaikh',    role:'Manager',       daysWorked:30, ratePerDay:833,   workingSalary:25000, totalAdvance:0,     finalPayout:25000, color:'#6366f1' },
  { name:'Dhanu',     role:'Security',      daysWorked:30, ratePerDay:500,   workingSalary:15000, totalAdvance:0,     finalPayout:15000, color:'#78716c' },
]

const advanceNames = ['Ajay','Santosh','Ayaz','Rizwan','Rehan','Kartik','Komal','Tanmay','Vanshika']

const advanceRows = [
  { date:'01 Apr', Ajay:0,    Santosh:0,     Ayaz:0,   Rizwan:0,   Rehan:104,  Kartik:258,  Komal:0,   Tanmay:244, Vanshika:0 },
  { date:'02 Apr', Ajay:0,    Santosh:1039,  Ayaz:0,   Rizwan:43,  Rehan:0,    Kartik:531,  Komal:0,   Tanmay:0,   Vanshika:0 },
  { date:'03 Apr', Ajay:0,    Santosh:2700,  Ayaz:0,   Rizwan:0,   Rehan:0,    Kartik:0,    Komal:0,   Tanmay:0,   Vanshika:0 },
  { date:'04 Apr', Ajay:100,  Santosh:700,   Ayaz:500, Rizwan:0,   Rehan:498,  Kartik:43,   Komal:0,   Tanmay:0,   Vanshika:116 },
  { date:'05 Apr', Ajay:0,    Santosh:474,   Ayaz:0,   Rizwan:0,   Rehan:54,   Kartik:0,    Komal:0,   Tanmay:0,   Vanshika:0 },
  { date:'06 Apr', Ajay:0,    Santosh:0,     Ayaz:0,   Rizwan:0,   Rehan:0,    Kartik:157,  Komal:88,  Tanmay:0,   Vanshika:0 },
  { date:'07 Apr', Ajay:0,    Santosh:0,     Ayaz:0,   Rizwan:52,  Rehan:0,    Kartik:0,    Komal:200, Tanmay:0,   Vanshika:0 },
  { date:'08 Apr', Ajay:0,    Santosh:1220,  Ayaz:0,   Rizwan:79,  Rehan:0,    Kartik:0,    Komal:0,   Tanmay:74,  Vanshika:0 },
  { date:'09 Apr', Ajay:0,    Santosh:6000,  Ayaz:0,   Rizwan:0,   Rehan:0,    Kartik:103,  Komal:100, Tanmay:0,   Vanshika:0 },
  { date:'10 Apr', Ajay:0,    Santosh:0,     Ayaz:0,   Rizwan:76,  Rehan:0,    Kartik:0,    Komal:0,   Tanmay:93,  Vanshika:0 },
  { date:'20 Apr', Ajay:500,  Santosh:0,     Ayaz:0,   Rizwan:0,   Rehan:0,    Kartik:44,   Komal:0,   Tanmay:0,   Vanshika:313 },
  { date:'24 Apr', Ajay:6000, Santosh:10000, Ayaz:0,   Rizwan:90,  Rehan:0,    Kartik:0,    Komal:0,   Tanmay:0,   Vanshika:0 },
  { date:'29 Apr', Ajay:50,   Santosh:354,   Ayaz:0,   Rizwan:74,  Rehan:0,    Kartik:60,   Komal:268, Tanmay:0,   Vanshika:0 },
]
</script>
